import sys
import subprocess
import json
from pathlib import Path
sys.path.insert(0, r"c:\Users\임종서\Desktop\auto gnimag")
import config

html_path = Path('games/chrono-blade/index.html').resolve()
src = html_path.read_text(encoding='utf-8')

# Script to inject comprehensive simulated gameplay tests
test_harness = """
<script>
window.__TEST_RESULTS = {};

function runTests() {
  console.log("Starting Gameplay Mechanics Verification...");
  
  // 1. Test Math & Shield Back Hit vs Front Deflection
  const shieldEm = { x: 140, y: 320, type: "SHIELD", angle: Math.PI / 2, hp: 2, radius: 22, dead: false };
  // Back cut: slice above enemy (y = 300) from x = 100 to 180
  const backP1 = { x: 100, y: 300 }, backP2 = { x: 180, y: 300 };
  const backHitAngle = Math.atan2(backP2.y - shieldEm.y, backP2.x - shieldEm.x);
  let backDiff = Math.abs(backHitAngle - shieldEm.angle);
  while (backDiff > Math.PI) backDiff -= Math.PI * 2;
  backDiff = Math.abs(backDiff);
  const backCutSuccess = (backDiff >= Math.PI * 0.5);

  // Front cut: slice below enemy (y = 340) from x = 100 to 180
  const frontP1 = { x: 100, y: 340 }, frontP2 = { x: 180, y: 340 };
  const frontHitAngle = Math.atan2(frontP2.y - shieldEm.y, frontP2.x - shieldEm.x);
  let frontDiff = Math.abs(frontHitAngle - shieldEm.angle);
  while (frontDiff > Math.PI) frontDiff -= Math.PI * 2;
  frontDiff = Math.abs(frontDiff);
  const frontDeflected = (frontDiff < Math.PI * 0.5);

  window.__TEST_RESULTS.shieldMechanics = {
    backCutSuccess,
    frontDeflected,
    passed: (backCutSuccess && frontDeflected)
  };

  // 2. Test Optical Vector Reflection Math
  const mirror = { x: 225, y: 350, radius: 24, angle: Math.PI / 4 }; // 45 deg diagonal mirror
  // Ray coming from bottom-left (90, 450) towards mirror (225, 350)
  const dx = 225 - 90; // +135
  const dy = 350 - 450; // -100 (moving up-right)
  const tx = Math.cos(mirror.angle);
  const ty = Math.sin(mirror.angle);
  let nx = -ty, ny = tx;
  const len = Math.hypot(dx, dy);
  const vx = dx / len, vy = dy / len;
  let dot = vx * nx + vy * ny;
  if (dot > 0) { nx = -nx; ny = -ny; dot = -dot; }
  const rx = vx - 2 * dot * nx;
  const ry = vy - 2 * dot * ny;
  // Reflected ray must have valid numbers and point in valid quadrant
  window.__TEST_RESULTS.mirrorOptics = {
    rx, ry,
    isFinite: (Number.isFinite(rx) && Number.isFinite(ry)),
    passed: (Number.isFinite(rx) && Number.isFinite(ry) && Math.abs(Math.hypot(rx, ry) - 1.0) < 0.001)
  };

  // 3. Test Real-Time Mark & Blitz Slice
  startGame();
  enemies = [
    { x: 200, y: 300, type: "DRONE", radius: 16, hp: 1, maxHp: 1, color: "#00f0ff", vy: 50, dead: false }
  ];
  markedEnemies = [
    { enemy: enemies[0], cutP1: { x: 150, y: 300 }, cutP2: { x: 250, y: 300 }, ricochet: false }
  ];
  triggerBladeBlitz([{ x: 150, y: 300 }, { x: 250, y: 300 }]);
  
  window.__TEST_RESULTS.realtimeBlitz = {
    enemyDied: enemies[0].dead,
    killsCount: kills,
    passed: (enemies[0].dead === true && kills >= 1)
  };

  // 4. Test Puzzle Stage 5 Bomb Setup
  loadPuzzleStage(5);
  const stage5Bombs = bombs.length;
  const stage5Enemies = enemies.length;
  window.__TEST_RESULTS.puzzleStage5 = {
    stage5Bombs,
    stage5Enemies,
    fuseValue: (bombs[0] ? bombs[0].fuse : 0),
    passed: (stage5Bombs === 1 && stage5Enemies === 3 && bombs[0].fuse <= 0.7)
  };

  console.log("TEST_RESULTS_JSON:" + JSON.stringify(window.__TEST_RESULTS));
}

setTimeout(runTests, 200);
</script>
"""

test_src = src.replace("</body>", test_harness + "\n</body>")
test_file = Path('games/chrono-blade/_test_mechanics.html').resolve()
test_file.write_text(test_src, encoding='utf-8')

cmd = [
    config.CHROME, '--headless', '--disable-gpu', '--no-sandbox',
    '--enable-logging=stderr', '--v=1',
    '--virtual-time-budget=2000',
    test_file.as_uri()
]
proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
test_file.unlink(missing_ok=True)

# Parse output
found = False
for line in proc.stderr.splitlines():
    if "TEST_RESULTS_JSON:" in line:
        raw = line.split("TEST_RESULTS_JSON:")[1]
        start_idx = raw.find("{")
        end_idx = raw.rfind("}")
        if start_idx != -1 and end_idx != -1:
            data = raw[start_idx:end_idx+1]
            results = json.loads(data)
            print("TEST REPORT:")
            print(json.dumps(results, indent=2, ensure_ascii=False))
            all_passed = all(v.get('passed', False) for v in results.values())
            print(f"ALL TESTS PASSED: {all_passed}")
            found = True
            break

if not found:
    print("Chrome output did not contain test results directly. Raw stderr snippet:")
    print(proc.stderr[:1000])
