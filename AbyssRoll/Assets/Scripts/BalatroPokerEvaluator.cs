using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace AbyssRoll.PokerEngine
{
    public enum PokerHandType
    {
        HighDie,
        OnePair,
        TwoPair,
        ThreeOfAKind,
        Straight,
        FullHouse,
        FourOfAKind,
        FiveOfAKind
    }

    [Serializable]
    public class PokerHandStats
    {
        public PokerHandType handType;
        public string koreanName;
        public int level = 1;
        public int baseChips;
        public float baseMult;
        public int chipGrowth;
        public float multGrowth;

        public int CurrentChips => baseChips + ((level - 1) * chipGrowth);
        public float CurrentMult => baseMult + ((level - 1) * multGrowth);
    }

    public class BalatroPokerEvaluator : MonoBehaviour
    {
        public static BalatroPokerEvaluator Instance { get; private set; }

        public Dictionary<PokerHandType, PokerHandStats> handLibrary = new Dictionary<PokerHandType, PokerHandStats>();

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            InitializeHandLibrary();
        }

        private void InitializeHandLibrary()
        {
            handLibrary[PokerHandType.FiveOfAKind] = new PokerHandStats { handType = PokerHandType.FiveOfAKind, koreanName = "야추 (5 of a Kind)", level = 1, baseChips = 100, baseMult = 8.0f, chipGrowth = 30, multGrowth = 2.0f };
            handLibrary[PokerHandType.FourOfAKind] = new PokerHandStats { handType = PokerHandType.FourOfAKind, koreanName = "포카드 (4 of a Kind)", level = 1, baseChips = 70, baseMult = 6.0f, chipGrowth = 25, multGrowth = 1.5f };
            handLibrary[PokerHandType.FullHouse] = new PokerHandStats { handType = PokerHandType.FullHouse, koreanName = "풀하우스 (Full House)", level = 1, baseChips = 50, baseMult = 5.0f, chipGrowth = 20, multGrowth = 1.0f };
            handLibrary[PokerHandType.Straight] = new PokerHandStats { handType = PokerHandType.Straight, koreanName = "스트레이트 (Straight)", level = 1, baseChips = 40, baseMult = 4.0f, chipGrowth = 15, multGrowth = 1.0f };
            handLibrary[PokerHandType.ThreeOfAKind] = new PokerHandStats { handType = PokerHandType.ThreeOfAKind, koreanName = "트리플 (3 of a Kind)", level = 1, baseChips = 30, baseMult = 3.0f, chipGrowth = 12, multGrowth = 0.8f };
            handLibrary[PokerHandType.TwoPair] = new PokerHandStats { handType = PokerHandType.TwoPair, koreanName = "투 페어 (Two Pair)", level = 1, baseChips = 20, baseMult = 2.0f, chipGrowth = 10, multGrowth = 0.5f };
            handLibrary[PokerHandType.OnePair] = new PokerHandStats { handType = PokerHandType.OnePair, koreanName = "원 페어 (One Pair)", level = 1, baseChips = 12, baseMult = 1.5f, chipGrowth = 8, multGrowth = 0.4f };
            handLibrary[PokerHandType.HighDie] = new PokerHandStats { handType = PokerHandType.HighDie, koreanName = "하이 다이스 (High Die)", level = 1, baseChips = 8, baseMult = 1.0f, chipGrowth = 5, multGrowth = 0.2f };
        }

        public PokerHandType EvaluateHand(List<int> diceValues)
        {
            if (diceValues == null || diceValues.Count == 0) return PokerHandType.HighDie;

            var counts = diceValues.GroupBy(x => x).ToDictionary(g => g.Key, g => g.Count());
            var freqs = counts.Values.OrderByDescending(v => v).ToList();

            var uniqueSorted = diceValues.Distinct().OrderBy(x => x).ToList();
            bool isStraight = false;
            if (uniqueSorted.Count >= 4)
            {
                for (int i = 0; i <= uniqueSorted.Count - 4; i++)
                {
                    if (uniqueSorted[i + 3] - uniqueSorted[i] == 3)
                    {
                        isStraight = true;
                        break;
                    }
                }
            }

            if (freqs[0] >= 5) return PokerHandType.FiveOfAKind;
            if (freqs[0] == 4) return PokerHandType.FourOfAKind;
            if (freqs[0] == 3 && freqs.Count > 1 && freqs[1] >= 2) return PokerHandType.FullHouse;
            if (isStraight) return PokerHandType.Straight;
            if (freqs[0] == 3) return PokerHandType.ThreeOfAKind;
            if (freqs[0] == 2 && freqs.Count > 1 && freqs[1] == 2) return PokerHandType.TwoPair;
            if (freqs[0] == 2) return PokerHandType.OnePair;

            return PokerHandType.HighDie;
        }

        public void LevelUpHand(PokerHandType handType)
        {
            if (handLibrary.TryGetValue(handType, out var stats))
            {
                stats.level++;
                Debug.Log($"[BalatroPokerEvaluator] {stats.koreanName} Level Up! -> Lv.{stats.level} (+{stats.CurrentChips} Chips, x{stats.CurrentMult} Mult)");
            }
        }
    }
}
