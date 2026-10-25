# -*- coding: utf-8 -*-
import json
import re

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
}

manager_nat_map = {
    "corbusier": ("스위스 / 프랑스", "🇨🇭🇫🇷", ["스위스", "프랑스"]),
    "hadid": ("이라크 / 영국", "🇮🇶🇬🇧", ["이라크", "영국"]),
    "gaudi": ("스페인 (카탈루냐)", "🇪🇸", ["스페인"]),
    "ando": ("일본", "🇯🇵", ["일본"]),
    "wright": ("미국", "🇺🇸", ["미국"]),
    "koolhaas": ("네덜란드", "🇳🇱", ["네덜란드"]),
}

with open(r"c:\Users\임종서\Desktop\auto gnimag\architecture_fc\data.js", "r", encoding="utf-8") as f:
    text = f.read()

json_str = text.split("const MANAGERS_DATA = ")[1].split(";\n\nif (typeof module")[0]
managers = json.loads(json_str)

for mgr in managers:
    nat_name, nat_flag, home_countries = manager_nat_map.get(mgr["id"], (mgr["nationality"], "🌐", []))
    mgr["nationality"] = nat_name
    mgr["nationalityFlag"] = nat_flag
    mgr["homeCountries"] = home_countries

    for b in mgr["buildings"]:
        city = b.get("city", "")
        # detect country from city
        matched_country = "기타"
        matched_flag = "🌐"

        for k, (c_name, c_flag) in flag_map.items():
            if k in city:
                matched_country = c_name
                matched_flag = c_flag
                break

        # Check if building is in manager's home country
        is_home_turf = any(hc in matched_country for hc in home_countries)
        synergy_label = "본국 홈그라운드 마스터피스 (조직력 +3)" if is_home_turf else "글로벌 원정 랜드마크 (적응력 +3)"

        b["country"] = matched_country
        b["countryFlag"] = matched_flag
        b["isHomeTurf"] = is_home_turf
        b["locationTrait"] = f"{matched_flag} {matched_country}"
        b["architectTrait"] = f"{nat_flag} {nat_name}"
        b["nationalSynergy"] = synergy_label

# Save updated data.js
new_js_code = f"""// Architects FC Database
// 6 Legendary Architect Managers, each commanding 25+ real iconic architectural player-cards.
// Enhanced with Architect Nationality and Building Country Traits & Flags.

const MANAGERS_DATA = {json.dumps(managers, ensure_ascii=False, indent=2)};

if (typeof module !== 'undefined' && module.exports) {{
    module.exports = {{ MANAGERS_DATA }};
}}
"""

with open(r"c:\Users\임종서\Desktop\auto gnimag\architecture_fc\data.js", "w", encoding="utf-8") as f:
    f.write(new_js_code)

print("Successfully enriched data.js with architect nationality and building location traits!")
for mgr in managers:
    print(f"{mgr['nationalityFlag']} {mgr['name']}: {len(mgr['buildings'])} buildings processed")
