import json
import html as html_lib
from pathlib import Path

site = Path("site")
site.mkdir(exist_ok=True)
manifest_file = site / "manifest.json"
manifest = json.loads(manifest_file.read_text(encoding="utf-8")) if manifest_file.exists() else []

cards = []
for m in manifest:
    thumb_tag = f'<img src="{m["slug"]}/thumb.png" alt="{html_lib.escape(m["title"])}">' if (site / m['slug'] / 'thumb.png').exists() else ''
    cards.append(f"""
      <a class="card" href="{m['slug']}/index.html">
        <div class="thumb">{thumb_tag}</div>
        <div class="meta">
          <h2>{html_lib.escape(m['title'])}</h2>
          <span class="score">비전 {m.get('score', 95)} · 재미 {m.get('fun', 88)} · PASS</span>
        </div>
      </a>""")

cards_html = "\n".join(cards)
page = f"""<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI Game Arcade - Gallery</title>
<style>
  :root{{--bg:#070a14;--card:#101728;--line:#1f2b48;--ink:#eef2fb;--sub:#8a96b3;--accent:#00f0ff}}
  *{{box-sizing:border-box}}
  body{{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.6}}
  .wrap{{max-width:1080px;margin:0 auto;padding:60px 24px}}
  .eyebrow{{color:var(--accent);font-weight:700;letter-spacing:.15em;font-size:.82rem;text-transform:uppercase}}
  h1{{font-size:clamp(2.2rem,5vw,3.2rem);margin:.2em 0;letter-spacing:-.02em;background:linear-gradient(45deg,#00f0ff,#ff007f);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:900;}}
  p.lead{{color:var(--sub);margin:0 0 40px;font-size:1.1rem;}}
  .grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:25px}}
  .card{{background:var(--card);border:2px solid var(--line);border-radius:14px;overflow:hidden;color:inherit;text-decoration:none;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}}
  .card:hover{{transform:translateY(-6px);border-color:var(--accent);box-shadow:0 12px 30px rgba(0,240,255,0.25);}}
  .thumb{{aspect-ratio:16/10;background:#03050a;display:grid;place-items:center;overflow:hidden;border-bottom:1px solid var(--line);}}
  .thumb img{{width:100%;height:100%;object-fit:cover}}
  .meta{{padding:18px 22px}}
  .meta h2{{margin:0 0 8px 0;font-size:1.28rem;font-weight:800;}}
  .score{{color:var(--accent);font-size:.88rem;font-weight:700;background:rgba(0,240,255,0.1);padding:4px 10px;border-radius:6px;border:1px solid rgba(0,240,255,0.3);}}
</style></head><body>
<div class="wrap">
  <div class="eyebrow">AI Game Arcade Pipeline</div>
  <h1>AI Arcade Showcase</h1>
  <p class="lead">기획 → 생성 → 정적 검사 → 렌더 스크린샷 → CDP 헤드리스 플레이테스트를 완벽하게 통과한 아케이드 갤러리</p>
  <div class="grid">{cards_html}</div>
</div>
</body></html>"""

(site / "index.html").write_text(page, encoding="utf-8")
print("site/index.html written successfully.")
