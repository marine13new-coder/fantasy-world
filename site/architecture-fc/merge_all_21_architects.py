# -*- coding: utf-8 -*-
"""
Merge all 21 architects (6 original + 5 batch1 + 4 batch2 + 6 batch3)
Total: 21 Legendary Architects, 525 Real Iconic Buildings!
"""
import json

# Load original 6 managers
with open(r"c:\Users\임종서\Desktop\auto gnimag\architecture_fc\data.js", "r", encoding="utf-8") as f:
    text = f.read()

json_str = text.split("const MANAGERS_DATA = ")[1].split(";\n\nif (typeof module")[0]
existing_managers = json.loads(json_str)

# Filter only original 6 if already merged
orig_ids = ["corbusier", "hadid", "gaudi", "ando", "wright", "koolhaas"]
orig_managers = [m for m in existing_managers if m["id"] in orig_ids]

# Load batches
with open(r"c:\Users\임종서\Desktop\auto gnimag\architecture_fc\extra_architects_batch1.json", "r", encoding="utf-8") as f:
    batch1 = json.load(f)

with open(r"c:\Users\임종서\Desktop\auto gnimag\architecture_fc\extra_architects_batch2.json", "r", encoding="utf-8") as f:
    batch2 = json.load(f)

with open(r"c:\Users\임종서\Desktop\auto gnimag\architecture_fc\extra_architects_batch3.json", "r", encoding="utf-8") as f:
    batch3 = json.load(f)

new_raw_list = batch1 + batch2 + batch3

flag_map = {
    "프랑스": ("프랑스", "🇫🇷"),
    "대한민국": ("대한민국", "🇰🇷"),
    "한국": ("대한민국", "🇰🇷"),
    "미국": ("미국", "🇺🇸"),
    "일본": ("일본", "🇯🇵"),
    "스페인": ("스페인", "🇪🇸"),
    "독일": ("독일", "🇩🇪"),
    "중국": ("중국", "🇨🇳"),
    "인도": ("인도", "🇮🇳"),
    "스위스": ("스위스", "🇨🇭"),
    "영국": ("영국", "🇬🇧"),
    "스코틀랜드": ("스코틀랜드", "🏴󠁧󠁢󠁳󠁣󠁴󠁿"),
    "이탈리아": ("이탈리아", "🇮🇹"),
    "네덜란드": ("네덜란드", "🇳🇱"),
    "포르투갈": ("포르투갈", "🇵🇹"),
    "카타르": ("카타르", "🇶🇦"),
    "UAE": ("아랍에미리트", "🇦🇪"),
    "아제르바이잔": ("아제르바이잔", "🇦🇿"),
    "오스트리아": ("오스트리아", "🇦🇹"),
    "벨기에": ("벨기에", "🇧🇪"),
    "싱가포르": ("싱가포르", "🇸🇬"),
    "대만": ("대만", "🇹🇼"),
    "마카오": ("마카오", "🇲🇴"),
    "홍콩": ("홍콩", "🇭🇰"),
    "러시아": ("러시아", "🇷🇺"),
    "아르헨티나": ("아르헨티나", "🇦🇷"),
    "모로코": ("모로코", "🇲🇦"),
    "체코": ("체코", "🇨🇿"),
    "핀란드": ("핀란드", "🇫🇮"),
    "캐나다": ("캐나다", "🇨🇦"),
    "방글라데시": ("방글라데시", "🇧🇩"),
    "파나마": ("파나마", "🇵🇦"),
    "호주": ("호주", "🇦🇺"),
    "카자흐스탄": ("카자흐스탄", "🇰🇿"),
    "필리핀": ("필리핀", "🇵🇭"),
    "브라질": ("브라질", "🇧🇷"),
    "이라크": ("이라크", "🇮🇶"),
    "사우디아라비아": ("사우디아라비아", "🇸🇦"),
    "나이지리아": ("나이지리아", "🇳🇬"),
    "북마케도니아": ("북마케도니아", "🇲🇰"),
    "스웨덴": ("스웨덴", "🇸🇪"),
    "이스라엘": ("이스라엘", "🇮🇱"),
    "아일랜드": ("아일랜드", "🇮🇪"),
    "노르웨이": ("노르웨이", "🇳🇴"),
    "그리스": ("그리스", "🇬🇷"),
    "덴마크": ("덴마크", "🇩🇰"),
    "모나코": ("모나코", "🇲🇨"),
    "베네수엘라": ("베네수엘라", "🇻🇪"),
    "레바논": ("레바논", "🇱🇧"),
    "알제리": ("알제리", "🇩🇿"),
    "뉴칼레도니아": ("뉴칼레도니아", "🇳🇨"),
    "룩셈부르크": ("룩셈부르크", "🇱🇺")
}

new_managers = []
for m in new_raw_list:
    buildings = []
    for idx, bdata in enumerate(m["buildings_data"], 1):
        name, orig_name, year, city, pos, role, ovr, skill_name, skill_desc, skill_rate = bdata
        
        matched_country = "기타"
        matched_flag = "🌐"
        for k, (c_name, c_flag) in flag_map.items():
            if k in city:
                matched_country = c_name
                matched_flag = c_flag
                break
        
        is_home_turf = any(hc in matched_country for hc in m["homeCountries"])
        synergy_label = "본국 홈그라운드 마스터피스 (조직력 +3)" if is_home_turf else "글로벌 원정 랜드마크 (적응력 +3)"
        
        base = ovr - 4
        stats = {
            "STR": min(99, max(65, base + (5 if pos in ["DF", "GK"] else -3))),
            "TEC": min(99, max(65, base + (6 if pos in ["MF", "FW"] else -4))),
            "SPD": min(99, max(65, base + (5 if pos in ["FW", "MF"] else -5))),
            "PAS": min(99, max(65, base + (6 if pos == "MF" else -2))),
            "POW": min(99, max(65, base + (6 if pos == "FW" else -2))),
            "MNT": min(99, max(65, base + (4 if ovr >= 92 else 0)))
        }
        
        b = {
            "id": f"{m['id']}-{idx:02d}",
            "name": name,
            "originalName": orig_name,
            "year": year,
            "city": city,
            "country": matched_country,
            "countryFlag": matched_flag,
            "isHomeTurf": is_home_turf,
            "locationTrait": f"{matched_flag} {matched_country}",
            "architectTrait": f"{m['nationalityFlag']} {m['nationality']}",
            "nationalSynergy": synergy_label,
            "position": pos,
            "role": role,
            "stats": stats,
            "ovr": ovr,
            "skill": {
                "name": skill_name,
                "description": skill_desc,
                "rate": skill_rate
            },
            "desc": f"{m['name']}의 대표작. {city}에 위치하며, {skill_desc}."
        }
        buildings.append(b)
        
    m_clean = {
        "id": m["id"],
        "name": m["name"],
        "nativeName": m["nativeName"],
        "birthYear": m["birthYear"],
        "nationality": m["nationality"],
        "nationalityFlag": m["nationalityFlag"],
        "homeCountries": m["homeCountries"],
        "title": m["title"],
        "style": m["style"],
        "quote": m["quote"],
        "badgeColor": m["badgeColor"],
        "badgeBg": m["badgeBg"],
        "tacticalTrait": m["tacticalTrait"],
        "buff": m["buff"],
        "defaultFormation": m["defaultFormation"],
        "buildings": buildings
    }
    new_managers.append(m_clean)

all_managers = orig_managers + new_managers

# Write to data.js
js_code = f"""// Architects FC Database - 21 Legendary Architect Managers & 525 Iconic Buildings
// Comprehensive Modern Architecture Football Universe.

const MANAGERS_DATA = {json.dumps(all_managers, ensure_ascii=False, indent=2)};

if (typeof module !== 'undefined' && module.exports) {{
    module.exports = {{ MANAGERS_DATA }};
}}
"""

with open(r"c:\Users\임종서\Desktop\auto gnimag\architecture_fc\data.js", "w", encoding="utf-8") as f:
    f.write(js_code)

print(f"COMPLETE! Total Managers: {len(all_managers)}")
total_b = sum(len(m["buildings"]) for m in all_managers)
print(f"Total Buildings: {total_b}")
for idx, m in enumerate(all_managers, 1):
    print(f"{idx:02d}. {m['nationalityFlag']} {m['name']} ({m['nativeName']}): {len(m['buildings'])} buildings")
