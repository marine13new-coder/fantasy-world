with open('games/fps_arena.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "document.getElementById('cd-q').textContent =" in line:
        new_lines.append("  const elCdQ = document.getElementById('cd-q'); if (elCdQ) elCdQ.textContent = P.droneCd > 0 ? `${Math.ceil(P.droneCd)}s` : '적 탐지';\n")
    elif "document.getElementById('cd-e').textContent =" in line:
        new_lines.append("  const elCdE = document.getElementById('cd-e'); if (elCdE) elCdE.textContent = P.stimCd > 0 ? `${Math.ceil(P.stimCd)}s` : '실드충전';\n")
    elif "document.getElementById('cnt-g').textContent =" in line:
        new_lines.append("  const elCntG = document.getElementById('cnt-g'); if (elCntG) elCntG.textContent = `${P.grenades}개 소지`;\n")
    else:
        new_lines.append(line)

with open('games/fps_arena.html', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
with open('site/fps-arena/index.html', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Applied safe guards for cd-q, cd-e, cnt-g successfully!")
