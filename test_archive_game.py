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

        print("3. Three.js 씬 및 3D 그래픽 환경 (서랍, 약병, 볼류메트릭 콘) 검증")
        scene_exists = evaluate_js("typeof scene !== 'undefined' && scene !== null")
        cone_exists = evaluate_js("typeof flashlightCone !== 'undefined' && flashlightCone !== null")
        drawer_exists = evaluate_js("typeof deskDrawerObj !== 'undefined' && deskDrawerObj !== null")
        sedative_exists = evaluate_js("typeof sedativeBottleObj !== 'undefined' && sedativeBottleObj !== null")
        board_exists = evaluate_js("typeof noticeBoardObj !== 'undefined' && noticeBoardObj !== null")
        clip_exists = evaluate_js("typeof clipboardObj !== 'undefined' && clipboardObj !== null")

        print(f"   - Three.js 씬: {scene_exists}")
        print(f"   - 볼류메트릭 라이트 콘: {cone_exists}")
        print(f"   - 책상 슬라이딩 서랍: {drawer_exists}")
        print(f"   - 신경 안정제 약병: {sedative_exists}")
        print(f"   - 사건 증거 보드: {board_exists}")
        print(f"   - 의무 일지 차트: {clip_exists}")
        assert scene_exists and cone_exists and drawer_exists and sedative_exists and board_exists and clip_exists

        print("4. 서랍 열기 & 신경 안정제 복용 테스트")
        evaluate_js("toggleDeskDrawer()")
        cdp.drain(300)
        is_open = evaluate_js("isDrawerOpen")
        print(f"   - 서랍 열림 상태: {is_open}")
        assert is_open

        # 이성 수치 감소 후 안정제 복용
        evaluate_js("modifySanity(-40)")
        san_before = evaluate_js("sanity")
        print(f"   - 복용 전 이성 수치: {san_before}%")
        evaluate_js("consumeSedative()")
        san_after = evaluate_js("sanity")
        print(f"   - 복용 후 회복된 이성 수치: {san_after}%")
        assert san_after > san_before

        print("5. 사건 증거 보드 및 임상 차트 모달 테스트")
        evaluate_js("openDocModal('board')")
        cdp.drain(300)
        is_modal_open = evaluate_js("document.getElementById('documentInspectModal').style.display === 'flex'")
        print(f"   - 사건 보드 모달 열림: {is_modal_open}")
        assert is_modal_open
        evaluate_js("closeDocModal()")
        cdp.drain(200)

        print("6. UV 자외선 블랙라이트 [G] 모드 토글 테스트")
        evaluate_js("setLightMode('uv')")
        cdp.drain(400)
        uv_active = evaluate_js("lightMode === 'uv'")
        print(f"   - UV 모드 활성: {uv_active}")
        assert uv_active
        evaluate_js("setLightMode('flashlight')")
        cdp.drain(200)

        print("7. 오디오 워크스테이션 열기 & 테이프 와우/플러터 LFO 및 헤테로다인 테스트")
        evaluate_js("enterTerminal()")
        cdp.drain(500)
        evaluate_js("document.getElementById('btnPlay').click()")
        cdp.drain(600)

        hetero_exists = evaluate_js("typeof heterodyneOsc !== 'undefined' && heterodyneOsc !== null")
        lfo_exists = evaluate_js("typeof wowLfo !== 'undefined' && wowLfo !== null")
        print(f"   - 헤테로다인 라디오 휘파람: {hetero_exists}")
        print(f"   - 아날로그 테이프 와우/플러터 LFO: {lfo_exists}")
        assert hetero_exists and lfo_exists

        evaluate_js("autoTuneAssist()")
        cdp.drain(1200)
        sync_text = evaluate_js("document.getElementById('lblSyncState').innerText")
        print(f"   - Ch.1 동기화 상태: {sync_text}")
        assert "LOCKED" in str(sync_text)

        cdp.screenshot(Path("site/archive-1999-final-test.png"))
        print("   ✅ 최종 플레이테스트 스크린샷 저장 완료: site/archive-1999-final-test.png")

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

        print("=== 🎉 [ARCHIVE 1999] 모든 검증 통과! 스팀 상용화급 완벽 구동 확인! ===")
    finally:
        cdp.proc.terminate()

if __name__ == "__main__":
    test_game()
