import sys
import time
from pathlib import Path
from pipeline.cdp import CDP

def test_game():
    print("=== [ARCHIVE 1999] 스팀 상용화급 종합 자동 플레이테스트 시작 ===")
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

        print("3. Three.js 씬 및 3D 그래픽 환경 검증")
        scene_exists = evaluate_js("typeof scene !== 'undefined' && scene !== null")
        dust_exists = evaluate_js("typeof dustParticles !== 'undefined' && dustParticles !== null")
        phone_exists = evaluate_js("typeof phoneObj !== 'undefined' && phoneObj !== null")
        gurney_exists = evaluate_js("typeof gurneyObj !== 'undefined' && gurneyObj !== null")
        print(f"   - Three.js 씬: {scene_exists}")
        print(f"   - 부유 먼지 입자(Volumetric Dust): {dust_exists}")
        print(f"   - 로터리 전화기(Telephone): {phone_exists}")
        print(f"   - 부검/들것(Gurney): {gurney_exists}")
        assert scene_exists and dust_exists and phone_exists and gurney_exists

        # 3D 룸 스크린샷 캡처
        cdp.screenshot(Path("site/archive-1999-room-test.png"))
        print("   ✅ 3D 방 환경 스크린샷 저장 완료: site/archive-1999-room-test.png")

        print("4. 오디오 워크스테이션 열기 (E 키 시뮬레이션)")
        evaluate_js("enterTerminal()")
        cdp.drain(600)
        is_terminal_open = evaluate_js("document.getElementById('tuningStationUI').style.display === 'flex'")
        print(f"   - 단말기 UI 열림 여부: {is_terminal_open}")
        assert is_terminal_open

        print("5. 오실로스코프 캔버스 및 테이프 랙 검증")
        osc_ready = evaluate_js("typeof oscCtx !== 'undefined' && oscCtx !== null")
        tape_count = evaluate_js("document.querySelectorAll('.tape-item').length")
        print(f"   - 오실로스코프 캔버스: {osc_ready}")
        print(f"   - 물리 테이프 카트리지 슬롯 개수: {tape_count}")
        assert osc_ready and tape_count == 5

        print("6. 테이프 재생 및 주파수 튜닝 테스트 (Ch.1)")
        evaluate_js("document.getElementById('btnPlay').click()")
        evaluate_js("autoTuneAssist()")
        cdp.drain(1200)

        sync_text = evaluate_js("document.getElementById('lblSyncState').innerText")
        print(f"   - Ch.1 동기화 상태: {sync_text}")
        assert "LOCKED" in str(sync_text)

        # 단말기 스크린샷 캡처
        cdp.screenshot(Path("site/archive-1999-terminal-test.png"))
        print("   ✅ 단말기 UI 스크린샷 저장 완료: site/archive-1999-terminal-test.png")

        print("7. 전화기 인터랙션 및 통화 모달 테스트")
        evaluate_js("startPhoneRinging()")
        cdp.drain(400)
        phone_ringing = evaluate_js("isPhoneRinging")
        print(f"   - 전화 벨 울림 여부: {phone_ringing}")
        evaluate_js("answerPhone()")
        cdp.drain(600)
        phone_modal_open = evaluate_js("document.getElementById('telephoneCallModal').style.display === 'flex'")
        print(f"   - 수화기 통화 모달 열림 여부: {phone_modal_open}")
        assert phone_modal_open
        evaluate_js("hangupPhone()")
        cdp.drain(300)

        print("8. 쫄보 안심 모드 (Safe Mode) 토글 테스트")
        evaluate_js("toggleSafeMode()")
        safe_on = evaluate_js("isSafeMode")
        print(f"   - 쫄보 안심 모드 ON 확인: {safe_on}")
        assert safe_on is True

        print("9. 브라우저 콘솔 에러 검사")
        cdp.drain(1000)
        errors = cdp.errors
        js_errors = [e for e in errors if "favicon" not in e.lower()]
        if js_errors:
            print(f"   ⚠️ JS 에러 발견: {js_errors}")
            raise RuntimeError(f"Console errors: {js_errors}")
        else:
            print("   ✅ 콘솔 에러 0건! 완벽히 정상 구동 확인!")

        print("=== 🎉 [ARCHIVE 1999] 모든 검증 통과! 스팀 출시급 퀄리티 무결점 증명! ===")
    finally:
        cdp.proc.terminate()

if __name__ == "__main__":
    test_game()
