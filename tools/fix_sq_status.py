with open('games/fps_arena.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace document.getElementById('sq-status').textContent with a safe check
old_snippet = "document.getElementById('sq-status').textContent"
new_snippet = "const sqEl = document.getElementById('sq-status'); if (sqEl) sqEl.textContent"

# We can replace:
text = text.replace("document.getElementById('sq-status').textContent = '동행 전진 중 [FOLLOWING]';",
                    "const sqEl1 = document.getElementById('sq-status'); if (sqEl1) sqEl1.textContent = '동행 전진 중 [FOLLOWING]';")
text = text.replace("document.getElementById('sq-status').textContent = '엄호 태세 [COVERING]';",
                    "const sqEl2 = document.getElementById('sq-status'); if (sqEl2) sqEl2.textContent = '엄호 태세 [COVERING]';")
text = text.replace("document.getElementById('sq-status').textContent = '교전 사격 중 [ENGAGING]';",
                    "const sqEl3 = document.getElementById('sq-status'); if (sqEl3) sqEl3.textContent = '교전 사격 중 [ENGAGING]';")

with open('games/fps_arena.html', 'w', encoding='utf-8') as f:
    f.write(text)
with open('site/fps-arena/index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Safely guarded sq-status in games/fps_arena.html and site/fps-arena/index.html!")
