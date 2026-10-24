using System;
using System.Collections.Generic;
using UnityEngine;

namespace AbyssRoll.CasinoGothic
{
    [Serializable]
    public enum CasinoRuneTier
    {
        BronzeRune,     // 일반 룬
        SilverSigil,    // 고급 은빛 각인
        GoldenJackpot,  // 황금 잭팟 성배
        EldritchAllIn   // 금단의 올인 심연 각인
    }

    [Serializable]
    public class DiceFaceGambleSticker
    {
        public string stickerId;
        public string title;
        public CasinoRuneTier tier;
        public string gambleType; // "DoubleOrNothing", "VampireJackpot", "BrimstoneFrenzy", "SevenFortune"
        public int bonusPotOnHit;
        public float bustShieldChance; // 1회 자멸 방어 보험 확률
        public string loreQuote;
    }

    public class EldritchCasinoCraftingManager : MonoBehaviour
    {
        public static EldritchCasinoCraftingManager Instance { get; private set; }

        public List<DiceFaceGambleSticker> catalogue = new List<DiceFaceGambleSticker>();

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            InitCatalogue();
        }

        public void InitCatalogue()
        {
            catalogue.Clear();

            // 1. 묻고 더블로 각인
            catalogue.Add(new DiceFaceGambleSticker
            {
                stickerId = "gamble_double_or_nothing",
                title = "🎲 묻고 더블로 (Double or Nothing)",
                tier = CasinoRuneTier.SilverSigil,
                gambleType = "DoubleOrNothing",
                bonusPotOnHit = 100,
                bustShieldChance = 0f,
                loreQuote = "인간의 탐욕은 멈추지 않는다. 한 번 더 던져라."
            });

            // 2. 피의 잭팟 777 각인
            catalogue.Add(new DiceFaceGambleSticker
            {
                stickerId = "gamble_lucky_seven",
                title = "🎰 럭키 7 잭팟 (Eldritch 777)",
                tier = CasinoRuneTier.GoldenJackpot,
                gambleType = "SevenFortune",
                bonusPotOnHit = 350,
                bustShieldChance = 0.25f,
                loreQuote = "세 번의 주사위가 7 이상을 가리킬 때, 심연조차 비명을 지른다."
            });

            // 3. 악마와의 보험 계약 (자멸 1회 무효화)
            catalogue.Add(new DiceFaceGambleSticker
            {
                stickerId = "gamble_bust_shield",
                title = "🛡️ 영혼의 담보 대출 (Bust Shield 50%)",
                tier = CasinoRuneTier.SilverSigil,
                gambleType = "BustShield",
                bonusPotOnHit = 50,
                bustShieldChance = 0.5f,
                loreQuote = "파멸의 순간, 계약서 한 장이 죽음을 유예한다."
            });

            // 4. 금단의 올인 리스크
            catalogue.Add(new DiceFaceGambleSticker
            {
                stickerId = "gamble_eldritch_all_in",
                title = "🔥 심연의 올인 (Cataclysm All-In)",
                tier = CasinoRuneTier.EldritchAllIn,
                gambleType = "AllIn",
                bonusPotOnHit = 1000,
                bustShieldChance = 0f,
                loreQuote = "모든 것을 걸어라. 전설이 되거나, 뼈조차 남지 않거나."
            });
        }
    }
}
