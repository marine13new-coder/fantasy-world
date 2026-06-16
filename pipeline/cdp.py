"""아주 작은 Chrome DevTools Protocol 드라이버 (websocket-client 사용, 추가 설치 불필요).

실제 키 입력/클릭을 게임에 보내고, 콘솔/런타임 에러를 수집하고, 스크린샷·DOM 텍스트를
회수한다. Playwright 없이 헤드리스 Chrome 을 직접 제어하기 위한 최소 구현.
"""
import base64
import json
import socket
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path

from websocket import create_connection

import config


def _free_port() -> int:
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    p = s.getsockname()[1]
    s.close()
    return p

# key → (code, windowsVirtualKeyCode, text)
_SPECIAL = {
    "Enter": ("Enter", 13, "\r"), "Tab": ("Tab", 9, ""), "Backspace": ("Backspace", 8, ""),
    "Space": ("Space", 32, " "), " ": ("Space", 32, " "), "Escape": ("Escape", 27, ""),
    "ArrowUp": ("ArrowUp", 38, ""), "ArrowDown": ("ArrowDown", 40, ""),
    "ArrowLeft": ("ArrowLeft", 37, ""), "ArrowRight": ("ArrowRight", 39, ""),
}


def _key_fields(key: str) -> dict:
    # 특수키 이름을 대소문자 무시하고 정규화 ('enter'→'Enter', 'space'→'Space' 등)
    if key not in _SPECIAL:
        for sk in _SPECIAL:
            if key.lower() == sk.lower():
                key = sk
                break
    if key in _SPECIAL:
        code, vk, text = _SPECIAL[key]
        return {"key": " " if key == " " else key, "code": code,
                "windowsVirtualKeyCode": vk, "nativeVirtualKeyCode": vk, "text": text}
    ch = key if len(key) == 1 else (key[:1] or "a")  # 다중문자 비특수키 방어 (ord 에러 방지)
    up = ch.upper()
    code = f"Key{up}" if up.isalpha() else (f"Digit{ch}" if ch.isdigit() else "")
    vk = ord(up)
    return {"key": ch, "code": code, "windowsVirtualKeyCode": vk,
            "nativeVirtualKeyCode": vk, "text": ch}


class CDP:
    W, H = 1280, 800

    def __init__(self):
        self.userdir = tempfile.mkdtemp(prefix="cdp_")
        self.port = _free_port()
        args = [
            config.CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
            "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
            f"--remote-debugging-port={self.port}", f"--user-data-dir={self.userdir}",
            "--remote-allow-origins=*",  # 최신 Chrome: ws origin 검사 우회
            f"--window-size={self.W},{self.H}", "about:blank",
        ]
        self.proc = subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            self.ws = create_connection(self._ws_url(), max_size=None, timeout=10,
                                        suppress_origin=True)
        except Exception:
            self.proc.terminate()  # 실패 시 좀비 프로세스 방지
            raise
        self._id = 0
        self.errors: list[str] = []
        for m in ("Page.enable", "Runtime.enable", "Log.enable"):
            self._send(m)

    def _ws_url(self) -> str:
        for _ in range(60):
            try:
                data = json.load(urllib.request.urlopen(f"http://127.0.0.1:{self.port}/json"))
                pages = [t for t in data if t.get("type") == "page" and t.get("webSocketDebuggerUrl")]
                if pages:
                    return pages[0]["webSocketDebuggerUrl"]
            except Exception:
                pass
            time.sleep(0.25)
        raise RuntimeError("CDP devtools 준비 실패")

    def _collect(self, msg: dict) -> None:
        m, p = msg.get("method"), msg.get("params", {})
        if m == "Runtime.exceptionThrown":
            d = p.get("exceptionDetails", {})
            desc = (d.get("exception") or {}).get("description") or d.get("text") or "exception"
            self.errors.append(f"exception: {desc.splitlines()[0][:200]}")
        elif m == "Runtime.consoleAPICalled" and p.get("type") in ("error", "assert"):
            txt = " ".join(str(a.get("value", a.get("description", ""))) for a in p.get("args", []))
            self.errors.append(f"console.error: {txt[:200]}")
        elif m == "Log.entryAdded" and p.get("entry", {}).get("level") == "error":
            self.errors.append(f"log: {p['entry'].get('text','')[:200]}")

    def _send(self, method: str, params: dict | None = None) -> dict:
        self._id += 1
        mid = self._id
        self.ws.settimeout(15)
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == mid:
                return msg.get("result", {})
            self._collect(msg)

    def drain(self, ms: int) -> None:
        """ms 동안 들어오는 이벤트(에러 등)를 수집."""
        end = time.time() + ms / 1000
        self.ws.settimeout(0.15)
        while time.time() < end:
            try:
                self._collect(json.loads(self.ws.recv()))
            except Exception:
                pass

    def navigate(self, url: str, settle_ms: int = 1800) -> None:
        self._send("Page.navigate", {"url": url})
        self.drain(settle_ms)

    def press(self, key: str) -> None:
        f = _key_fields(key)
        self._send("Input.dispatchKeyEvent", {"type": "keyDown", **f})
        self.drain(40)  # keydown 처리 시간 확보
        self._send("Input.dispatchKeyEvent", {"type": "keyUp", **f})
        self.drain(110)  # 너무 빠른 연타로 키 누락되는 것 방지

    def type_text(self, text: str) -> None:
        for ch in text:
            self.press(ch)

    def click(self, xrel: float, yrel: float) -> None:
        x, y = xrel * self.W, yrel * self.H
        self._send("Input.dispatchMouseEvent", {"type": "mouseMoved", "x": x, "y": y})
        for t in ("mousePressed", "mouseReleased"):
            self._send("Input.dispatchMouseEvent",
                       {"type": t, "x": x, "y": y, "button": "left", "clickCount": 1})
        self.drain(120)

    def move(self, xrel: float, yrel: float) -> None:
        """마우스 이동 — 조준이 필요한 게임용(자동 사격 방향 등)."""
        self._send("Input.dispatchMouseEvent",
                   {"type": "mouseMoved", "x": xrel * self.W, "y": yrel * self.H})
        self.drain(60)

    def inner_text(self) -> str:
        r = self._send("Runtime.evaluate",
                       {"expression": "document.body.innerText", "returnByValue": True})
        return (r.get("result", {}) or {}).get("value", "") or ""

    def screenshot(self, path: Path) -> Path:
        r = self._send("Page.captureScreenshot", {"format": "png"})
        Path(path).write_bytes(base64.b64decode(r["data"]))
        return Path(path)

    def close(self) -> None:
        try:
            self.ws.close()
        except Exception:
            pass
        try:
            self.proc.terminate()
        except Exception:
            pass
        import shutil
        shutil.rmtree(self.userdir, ignore_errors=True)
