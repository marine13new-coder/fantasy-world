import json

with open('data.js', encoding='utf-8') as f:
    text = f.read()

json_part = text.split('const MANAGERS_DATA = ')[1].split(';\n\nif (typeof module')[0]
data = json.loads(json_part)

print(f"Total managers: {len(data)}")
total_buildings = 0
for m in data:
    b_count = len(m['buildings'])
    total_buildings += b_count
    print(f"- {m['name']} ({m['nativeName']}): {b_count} buildings (25+ check: {b_count >= 25})")
    assert b_count >= 25, f"{m['name']} has fewer than 25 buildings!"
    for b in m['buildings']:
        assert 'name' in b and 'position' in b and 'stats' in b and 'ovr' in b and 'skill' in b
        assert b['position'] in ['FW', 'MF', 'DF', 'GK'], f"Invalid position {b['position']}"
        for s in ['STR', 'TEC', 'SPD', 'PAS', 'POW', 'MNT']:
            assert s in b['stats'], f"Missing stat {s}"

print(f"\nAll assertions passed! Total buildings: {total_buildings}")
