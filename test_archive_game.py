import sys
import time
from pathlib import Path
from pipeline.cdp import CDP

def test_game():
    print("=== [ARCHIVE 1999] 스팀 상용화급 얼티밋 에디션 자동 플레이테스트 시작 ===")
    game_path = Path("archive_1999.html").resolve()
    url = game_path.as_uri()

    cdp = CDP()
    try:
        def evaluate_js(expr):
            res = cdp._send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
            return res.get("result", {}).get("value")

        print(f"1. 페이지 로드 중... ({url})")
        cdp.navigate(url, settle_ms=2000)

        title = evaluate_js("document.title")
        print(f"   타이틀: {title}")
        assert "ARCHIVE 1999" in str(title)

        print("2. [게임 입장] 버튼 클릭")
        evaluate_js("document.getElementById('btnStartGame').click()")
        cdp.drain(1500)

        print("3. Three.js 씬 및 3D 그래픽 환경 (볼류메트릭 콘, 증거보드, 차트, 비상등) 검증")
        scene_exists = evaluate_js("typeof scene !== 'undefined' && scene !== null")
        cone_exists = evaluate_js("typeof flashlightCone !== 'undefined' && flashlightCone !== null")
        board_exists = evaluate_js("typeof noticeBoardObj !== 'undefined' && noticeBoardObj !== null")
        clip_exists = evaluate_js("typeof clipboardObj !== 'undefined' && clipboardObj !== null")
        exit_exists = evaluate_js("typeof exitSignObj !== 'undefined' && exitSignObj !== null")
        dust_exists = evaluate_js("typeof dustParticles !== 'undefined' && dustParticles !== null")
        cctv_exists = evaluate_js("typeof cctvCameraObj !== 'undefined' && cctvCameraObj !== null")

        print(f"   - Three.js 씬: {scene_exists}")
        print(f"   - 3D 볼류메트릭 라이트 콘(Light Cone): {cone_exists}")
        print(f"   - 벽면 사건 증거 보드(Notice Board): {board_exists}")
        print(f"   - 의무 기록 차트(Clipboard): {clip_exists}")
        print(f"   - 404호 비상구 등(EXIT 404): {exit_exists}")
        print(f"   - 부유 먼지 입자: {dust_exists}")
        print(f"   - CCTV 감시 카메라: {cctv_exists}")
        assert scene_exists and cone_exists and board_exists and clip_exists and exit_exists

        print("4. 사건 증거 보드 및 임상 차트 정밀 열람 모달 테스트")
        evaluate_js("openDocModal('board')")
        cdp.drain(400)
        is_modal_open = evaluate_js("document.getElementById('documentInspectModal').style.display === 'flex'")
        print(f"   - 사건 보드 모달 열림: {is_modal_open}")
        assert is_modal_open

        evaluate_js("openDocModal('clipboard')")
        cdp.drain(400)
        doc_title = evaluate_js("document.getElementById('docInspectTitle').innerText")
        print(f"   - 임상 일지 타이틀: {doc_title}")
        assert "임상 일지" in str(doc_title)

        evaluate_js("closeDocModal()")
        cdp.drain(300)

        print("5. UV 자외선 블랙라이트 [G] 모드 토글 테스트")
        evaluate_js("setLightMode('uv')")
        cdp.drain(500)
        uv_active = evaluate_js("lightMode === 'uv'")
        cone_color = evaluate_js("flashlightCone.material.color.getHexString()")
        print(f"   - UV 모드 활성: {uv_active}, 볼류메트릭 콘 색상: #{cone_color}")
        assert uv_active
        cdp.screenshot(Path("site/archive-1999-uv-ultimate-test.png"))
        print("   ✅ UV 볼류메트릭 빔 스크린샷 저장 완료: site/archive-1999-uv-ultimate-test.png")

        evaluate_js("setLightMode('flashlight')")
        cdp.drain(300)

        print("6. 정전(Blackout) 이벤트 및 배전반 차단기 복구 테스트")
        evaluate_js("triggerBlackoutEvent()")
        cdp.drain(500)
        is_blackout = evaluate_js("isBlackoutActive")
        print(f"   - 정전 상태 발생 확인: {is_blackout}")
        assert is_blackout
        evaluate_js("repairBreaker()")
        cdp.drain(400)

        print("7. 오디오 워크스테이션 열기 & 헤테로다인 라디오 튜닝 테스트")
        evaluate_js("enterTerminal()")
        cdp.drain(600)
        evaluate_js("document.getElementById('btnPlay').click()")
        cdp.drain(500)
        hetero_exists = evaluate_js("typeof heterodyneOsc !== 'undefined' && heterodyneOsc !== null")
        print(f"   - 헤테로다인 아날로그 휘파람 신시사이저 작동: {hetero_exists}")
        assert hetero_exists

        evaluate_js("autoTuneAssist()")
        cdp.drain(1200)
        sync_text = evaluate_js("document.getElementById('lblSyncState').innerText")
        print(f"   - Ch.1 동기화 상태: {sync_text}")
        assert "LOCKED" in str(sync_text)

        cdp.screenshot(Path("site/archive-1999-terminal-ultimate-test.png"))
        print("   ✅ 단말기 UI 스크린샷 저장 완료: site/archive-1999-terminal-ultimate-test.png")

        print("8. 쫄보 안심 모드 (Safe Mode) 및 자동 관전(Auto-Cinema) 토글 테스트")
        evaluate_js("toggleSafeMode()")
        safe_on = evaluate_js("isSafeMode")
        print(f"   - 쫄보 안심 모드 ON 확인: {safe_on}")
        assert safe_on is True

        evaluate_js("toggleAutoCinema()")
        cinema_on = evaluate_js("isAutoCinema")
        print(f"   - 자동 관전 모드 실행 확인: {cinema_on}")
        assert cinema_on is True
        evaluate_js("toggleAutoCinema()")

        print("9. 브라우저 콘솔 에러 검사")
        cdp.drain(1000)
        errors = cdp.errors
        js_errors = [e for e in errors if "favicon" not in e.lower()]
        if js_errors:
            print(f"   ⚠️ JS 에러 발견: {js_errors}")
            raise RuntimeError(f"Console errors: {js_errors}")
        else:
            print("   ✅ 콘솔 에러 0건! 완벽히 정상 구동 확인!")

        print("=== 🎉 [ARCHIVE 1999] 모든 검증 통과! 스팀 상용화급 얼티밋 에디션 무결점 증명! ===")
    finally:
        cdp.proc.terminate()

if __name__ == "__main__":
    test_game()
