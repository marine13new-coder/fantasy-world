import json
import re

MANAGER_PORTRAITS = {
    'corbusier': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Le_Corbusier_%281964%29.jpg/400px-Le_Corbusier_%281964%29.jpg',
    'hadid': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Zaha_Hadid_in_Heydar_Aliyev_Cultural_center_in_Baku_nov_2013.jpg/400px-Zaha_Hadid_in_Heydar_Aliyev_Cultural_center_in_Baku_nov_2013.jpg',
    'gaudi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Antoni_Gaudi_1878.jpg/400px-Antoni_Gaudi_1878.jpg',
    'ando': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Tadao_Ando_2004_%284x5_cropped%29.jpg/400px-Tadao_Ando_2004_%284x5_cropped%29.jpg',
    'wright': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Frank_Lloyd_Wright_portrait_c1954_NYWTS.jpg/400px-Frank_Lloyd_Wright_portrait_c1954_NYWTS.jpg',
    'koolhaas': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Rem_Koolhaas.jpg/400px-Rem_Koolhaas.jpg',
    'mies': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Mies_van_der_Rohe%2C_1934.jpg/400px-Mies_van_der_Rohe%2C_1934.jpg',
    'aalto': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Alvar_Aalto_1960s.jpg/400px-Alvar_Aalto_1960s.jpg',
    'kahn': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Louis_Kahn.jpg/400px-Louis_Kahn.jpg',
    'gehry': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Frank_Gehry_2013.jpg/400px-Frank_Gehry_2013.jpg',
    'foster': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Norman_Foster_2014.jpg/400px-Norman_Foster_2014.jpg',
    'piano': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Renzo_Piano_2015.jpg/400px-Renzo_Piano_2015.jpg',
    'niemeyer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Oscar_Niemeyer_1968.jpg/400px-Oscar_Niemeyer_1968.jpg',
    'gropius': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/WalterGropius-1919.jpg/400px-WalterGropius-1919.jpg',
    'pei': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/I._M._Pei_1983.jpg/400px-I._M._Pei_1983.jpg',
    'tange': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Kenzo_Tange_1964.jpg/400px-Kenzo_Tange_1964.jpg',
    'calatrava': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Santiago_Calatrava_2010.jpg/400px-Santiago_Calatrava_2010.jpg',
    'zumthor': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Peter_Zumthor_2013.jpg/400px-Peter_Zumthor_2013.jpg',
    'hdm': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Jacques_Herzog_Pierre_de_Meuron.jpg/400px-Jacques_Herzog_Pierre_de_Meuron.jpg',
    'nouvel': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Jean_Nouvel_2010.jpg/400px-Jean_Nouvel_2010.jpg',
    'kim': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/%EA%B9%80%EC%88%98%EA%B7%BC_%EA%B1%B4%EC%B6%95%EA%B0%80.jpg/400px-%EA%B9%80%EC%88%98%EA%B7%BC_%EA%B1%B4%EC%B6%95%EA%B0%80.jpg'
}

# Themed curated architecture fallback photos by position
POSITION_PHOTO_BANK = {
    'FW': [
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?w=600&auto=format&fit=crop&q=80'
    ],
    'MF': [
        'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1492321936769-b49830bc1d1e?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=600&auto=format&fit=crop&q=80'
    ],
    'DF': [
        'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1448630360428-65456885c650?w=600&auto=format&fit=crop&q=80'
    ],
    'GK': [
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80'
    ]
}

def get_bp_value(ovr):
    # FIFA Online style market value
    base = {
        96: 1250000000000,
        95: 850000000000,
        94: 520000000000,
        93: 310000000000,
        92: 180000000000,
        91: 95000000000,
        90: 54000000000,
        89: 32000000000,
        88: 19000000000,
        87: 11000000000,
        86: 6500000000,
        85: 3800000000,
        84: 2200000000,
        83: 1200000000,
        82: 700000000,
        81: 400000000,
        80: 250000000
    }
    return base.get(ovr, 500000000)

def main():
    with open('images_cache.json', 'r', encoding='utf-8') as f:
        cache = json.load(f)

    with open('data.js', 'r', encoding='utf-8') as f:
        text = f.read()

    match = re.search(r'const MANAGERS_DATA\s*=\s*(\[[\s\S]*\]);\s*(?:if\s*\(typeof module|$)', text)
    if not match:
        print("Could not match MANAGERS_DATA")
        return

    managers = json.loads(match.group(1))

    bld_count = 0
    wiki_img_count = 0

    for m_idx, m in enumerate(managers):
        m['imageUrl'] = MANAGER_PORTRAITS.get(m['id'], cache.get('mgr_' + m['id'], ''))
        
        # Determine era/movement
        style_keywords = m['style'] + ' ' + m['title']
        if '바우하우스' in style_keywords or m['id'] == 'gropius':
            chem = '바우하우스 모더니즘'
        elif '유기' in style_keywords or m['id'] in ['gaudi', 'wright']:
            chem = '유기적 조형주의'
        elif '해체' in style_keywords or m['id'] in ['hadid', 'gehry', 'koolhaas']:
            chem = '해체주의 혁신'
        elif '하이테크' in style_keywords or m['id'] in ['foster', 'piano', 'calatrava']:
            chem = '하이테크 구조미학'
        elif '노출 콘크리트' in style_keywords or m['id'] in ['ando', 'kahn']:
            chem = '순수 콘크리트 미학'
        elif '한국' in style_keywords or m['id'] == 'kim':
            chem = '한국 공간주의'
        elif '지역' in style_keywords or m['id'] in ['aalto', 'zumthor']:
            chem = '지역주의와 물성'
        else:
            chem = '현대 모더니즘'

        m['chemGroup'] = chem

        for b_idx, b in enumerate(m['buildings']):
            bld_count += 1
            b_key = 'bld_' + b['id']
            img = cache.get(b_key)
            if img:
                b['imageUrl'] = img
                wiki_img_count += 1
            else:
                bank = POSITION_PHOTO_BANK.get(b['position'], POSITION_PHOTO_BANK['MF'])
                b['imageUrl'] = bank[(b_idx + m_idx) % len(bank)]

            # Card Tier (FIFA Online Class)
            ovr = b['ovr']
            if ovr >= 94:
                tier = 'ICON'
                tierName = '월드 아이콘'
            elif ovr >= 91:
                tier = 'TOTY'
                tierName = '올해의 팀'
            elif ovr >= 89:
                tier = 'HERITAGE'
                tierName = '건축 헤리티지'
            else:
                tier = 'AOTC'
                tierName = '센추리 마스터'

            b['cardTier'] = tier
            b['cardTierName'] = tierName
            b['enhancement'] = 1  # Base +1
            b['chemGroup'] = chem
            b['managerName'] = m['name']
            b['managerNativeName'] = m['nativeName']
            b['managerImageUrl'] = m['imageUrl']
            b['managerNationalityFlag'] = m['nationalityFlag']
            b['valueBP'] = get_bp_value(ovr)
            b['weakFoot'] = 5 if ovr >= 92 else 4
            b['skillMoves'] = 5 if ovr >= 90 else 4

    print(f"Total buildings processed: {bld_count}")
    print(f"Buildings with real Wikipedia/Wikimedia photos: {wiki_img_count}")

    # Write back to data.js cleanly
    new_code = "// Architects FC Database - 21 Legendary Architect Managers & 525 Iconic Buildings\n"
    new_code += "// FIFA Online Edition with real building photographs and FIFA cards.\n\n"
    new_code += "const MANAGERS_DATA = " + json.dumps(managers, ensure_ascii=False, indent=2) + ";\n\n"
    new_code += "if (typeof module !== 'undefined' && module.exports) {\n"
    new_code += "    module.exports = { MANAGERS_DATA };\n"
    new_code += "}\n"

    with open('data.js', 'w', encoding='utf-8') as f:
        f.write(new_code)

    print("data.js successfully enriched with FIFA Online properties and photographs!")

if __name__ == '__main__':
    main()
