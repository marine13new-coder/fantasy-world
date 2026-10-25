import os
import sys
import json
import urllib.request
import re

API_URL = "http://127.0.0.1:3001/v1/chat/completions"
API_KEY = "freellmapi-e797e7ed1c9a29a2f89636cd474e9d1b5d984027a0b7edb6"
OUTPUT_PATH = os.path.join("Assets", "StreamingAssets", "FishDex.json")

PROMPT = """너는 스팀 서브 모니터용 '코지(Cozy) 픽셀 낚시 게임'의 물고기 도감 데이터베이스를 만드는 게임 기획자야.
따뜻하고 몽글몽글하며 귀여운 이름과 감성적인 설명을 가진 물고기 50종(id: 1~50)을 반드시 아래 JSON 형식으로만 응답해줘. 설명이나 잡담 없이 오직 순수한 JSON만 출력해.

[희귀도 구성]
- Common (흔함): 15종 (획득 확률 0.40 내외, 가격 20~60 골드, 난이도 0.2~0.4)
- Uncommon (고급): 15종 (획득 확률 0.30 내외, 가격 70~150 골드, 난이도 0.35~0.55)
- Rare (희귀): 10종 (획득 확률 0.18 내외, 가격 180~350 골드, 난이도 0.5~0.7)
- Epic (영웅): 6종 (획득 확률 0.09 내외, 가격 400~800 골드, 난이도 0.65~0.85)
- Legendary (전설): 4종 (획득 확률 0.03 내외, 가격 1000~2500 골드, 난이도 0.85~1.0)
(총 50종)

예시 이름: 별빛 잉어, 뚱뚱복어, 벚꽃 송사리, 구름 해파리, 달콤 가오리, 민트 고등어, 퐁당 참치, 노을빛 금붕어, 꿀방울 미꾸라지, 이슬 머금은 피라미, 솜사탕 해마, 호롱불 아귀, 은하수 고래, 크림빵 가자미 등등.

JSON 형식:
{
  "version": "1.0",
  "total_count": 50,
  "fishes": [
    {
      "id": 1,
      "name": "별빛 잉어",
      "english_name": "Starlight Carp",
      "rarity": "Legendary",
      "catch_probability": 0.02,
      "base_price": 1200,
      "min_length_cm": 40.0,
      "max_length_cm": 65.0,
      "difficulty": 0.85,
      "color_hex": "#FFE66D",
      "description": "밤하늘의 은하수가 수면에 내려앉았을 때만 나타나는 환상의 물고기. 지느러미에서 따스한 별빛 조각이 반짝입니다."
    }
  ]
}
"""

def fetch_from_llm():
    print(f"[Worker] FreeLLMAPI({API_URL})에 50종 물고기 도감 데이터 요청 중...")
    req = urllib.request.Request(
        API_URL,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        data=json.dumps({
            "model": "auto",
            "messages": [
                {"role": "system", "content": "You are a professional JSON generator for a cozy indie fishing game. Always output raw valid JSON without markdown wrapping or commentary."},
                {"role": "user", "content": PROMPT}
            ],
            "temperature": 0.7,
            "max_tokens": 8192
        }).encode("utf-8")
    )
    
    with urllib.request.urlopen(req, timeout=120) as resp:
        res_data = json.loads(resp.read().decode("utf-8"))
        content = res_data["choices"][0]["message"]["content"]
        return content

def extract_json(raw_text):
    clean = raw_text.strip()
    if clean.startswith("```json"):
        clean = clean[7:]
    elif clean.startswith("```"):
        clean = clean[3:]
    if clean.endswith("```"):
        clean = clean[:-3]
    clean = clean.strip()
    
    # Try finding first { and last }
    start = clean.find("{")
    end = clean.rfind("}")
    if start != -1 and end != -1:
        clean = clean[start:end+1]
        
    return json.loads(clean)

def main():
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    raw_content = ""
    try:
        raw_content = fetch_from_llm()
        data = extract_json(raw_content)
        fishes = data.get("fishes", [])
        print(f"[Worker] 파싱 성공! 생성된 물고기 수: {len(fishes)}종")
        
        # Verify 50 count or adjust
        if len(fishes) < 50:
            print(f"[Worker] 수량이 {len(fishes)}개이므로 50개로 보충 작업을 진행합니다.")
            # If slightly short, generate remaining or pad with cozy fish
            rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary"]
            existing_ids = {f.get("id", i+1) for i, f in enumerate(fishes)}
            cur_id = max(existing_ids, default=0) + 1
            additional_names = [
                ("몽실 해파리", "Fluffy Jellyfish", "Common", 0.35, 45, 15, 25, 0.25, "#E2F0CB", "몽실몽실 떠다니는 귀여운 해파리."),
                ("호두 조개", "Walnut Clam", "Common", 0.38, 30, 8, 14, 0.2, "#D4A373", "호두를 쏙 빼닮은 단단하고 고소한 조개."),
                ("물방울 가오리", "Bubble Ray", "Uncommon", 0.25, 95, 30, 50, 0.45, "#BEE1E6", "수면 위로 투명한 물방울을 뿜어냅니다."),
                ("달빛 메기", "Moonlight Catfish", "Rare", 0.15, 240, 40, 70, 0.6, "#9B5DE5", "달이 차오르면 수염으로 달빛을 감지합니다."),
                ("오로라 연어", "Aurora Salmon", "Epic", 0.08, 650, 50, 80, 0.75, "#00BBF9", "북극의 오로라 빛을 온몸에 품고 있는 연어."),
                ("무지개 비단잉어", "Rainbow Koi", "Legendary", 0.02, 1800, 60, 95, 0.9, "#F15BB5", "마음을 씻어주는 일곱 빛깔의 전설적 잉어.")
            ]
            add_idx = 0
            while len(fishes) < 50:
                name, en, rar, prob, price, min_len, max_len, diff, col, desc = additional_names[add_idx % len(additional_names)]
                fishes.append({
                    "id": cur_id,
                    "name": f"{name} {cur_id}",
                    "english_name": f"{en} {cur_id}",
                    "rarity": rar,
                    "catch_probability": prob,
                    "base_price": price,
                    "min_length_cm": min_len,
                    "max_length_cm": max_len,
                    "difficulty": diff,
                    "color_hex": col,
                    "description": desc
                })
                cur_id += 1
                add_idx += 1
                
        # Re-index nicely 1..50
        for i, f in enumerate(fishes[:50]):
            f["id"] = i + 1

        final_data = {
            "version": "1.0",
            "game": "Cozy Pixel Fishing",
            "total_count": 50,
            "fishes": fishes[:50]
        }
        
        with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
            json.dump(final_data, f, ensure_ascii=False, indent=2)
            
        print(f"[Worker] 완료! {OUTPUT_PATH} 에 50종 물고기 도감 데이터가 저장되었습니다.")
        
        # Also copy to cozy fishing folder
        cozy_dir = os.path.join("Assets", "CozyPixelFishing")
        os.makedirs(cozy_dir, exist_ok=True)
        with open(os.path.join(cozy_dir, "FishDex.json"), "w", encoding="utf-8") as f:
            json.dump(final_data, f, ensure_ascii=False, indent=2)

    except Exception as e:
        print(f"[Worker] 오류 발생: {e}")
        if raw_content:
            print(f"[Worker] 응답 내용 일부:\n{raw_content[:500]}")
        sys.exit(1)

if __name__ == "__main__":
    main()
