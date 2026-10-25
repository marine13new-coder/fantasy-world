using System;
using System.Collections.Generic;
using UnityEngine;

namespace AbyssRoll.RiskEngine
{
    [Serializable]
    public enum PushYourLuckTier
    {
        Base = 1,        // 1x
        Double = 2,      // 2x 묻고 더블로!
        Quadruple = 4,   // 4x 피의 연승
        OctaBrimstone = 8,// 8x 악마의 탐욕
        Cataclysm16 = 16 // 16x 신성모독의 대박 (또는 즉사 자멸)
    }

    [Serializable]
    public class DiceBustCheckResult
    {
        public bool isBust = false; // 자멸 (폭망) 여부
        public int rolledValue;
        public int multiplier;
        public int totalScoreOrDamage;
        public string chantOrCurse;
    }

    public class PushOrBustRiskManager : MonoBehaviour
    {
        public static PushOrBustRiskManager Instance { get; private set; }

        [Header("Double Down Risk Multipliers")]
        public PushYourLuckTier currentTier = PushYourLuckTier.Base;
        public int currentBankedPot = 0;       // 현재 턴에 쌓아둔 누적 베팅 데미지/골드
        public int consecutiveSuccessCount = 0;

        [Header("Bust Threshold Settings")]
        // 배수가 올라갈수록 '자멸(Bust)' 판정 범위가 넓어짐 (극도의 도박 긴장감)
        // 1배수: 주사위 1만 자멸
        // 2배수: 주사위 1, 2 자멸
        // 4배수: 주사위 1, 2, 3 자멸
        // 8배수: 주사위 1, 2, 3, 4 자멸 (하이리스크 초고배율)
        // 16배수: 짝수만 생존 등 극한의 서스펜스

        public event Action<PushYourLuckTier, int> OnDoubleDownPushed;
        public event Action<int, bool> OnPotBanked; // 확정 수령
        public event Action<string> OnBustExplosion; // 파멸!

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void StartNewRollTurn(int initialBaseRoll)
        {
            currentTier = PushYourLuckTier.Base;
            consecutiveSuccessCount = 0;
            currentBankedPot = initialBaseRoll * 10;
        }

        // 묻고 더블로 가기 (Double Down Gamble)
        public DiceBustCheckResult GambleDoubleDown(Combat.DiceType diceType)
        {
            var result = new DiceBustCheckResult();
            int sides = (int)diceType;
            int roll = UnityEngine.Random.Range(1, sides + 1);
            result.rolledValue = roll;

            // 자멸 위험도 계산
            int bustThreshold = 1;
            if (currentTier == PushYourLuckTier.Base) bustThreshold = 1;
            else if (currentTier == PushYourLuckTier.Double) bustThreshold = 2;
            else if (currentTier == PushYourLuckTier.Quadruple) bustThreshold = 3;
            else if (currentTier == PushYourLuckTier.OctaBrimstone) bustThreshold = 4;
            else bustThreshold = 5;

            // 판정
            if (roll <= bustThreshold)
            {
                // BUST! 탐욕의 파멸!
                result.isBust = true;
                result.multiplier = 0;
                result.totalScoreOrDamage = 0;
                result.chantOrCurse = $"💀 BUST! 주사위 [{roll}] 파멸! 탐욕에 눈이 멀어 모든 배당을 잃고 영혼이 불탑니다!";
                
                int lostPot = currentBankedPot;
                currentBankedPot = 0;
                currentTier = PushYourLuckTier.Base;
                consecutiveSuccessCount = 0;

                OnBustExplosion?.Invoke(result.chantOrCurse);
                return result;
            }

            // 성공! 묻고 더블로!
            consecutiveSuccessCount++;
            int nextMult = (int)currentTier * 2;
            currentTier = (PushYourLuckTier)Mathf.Min(nextMult, 16);
            result.multiplier = (int)currentTier;

            // 팟 2배 증가 + 럭키 주사위 보너스
            currentBankedPot = (currentBankedPot * 2) + (roll * 15);
            result.totalScoreOrDamage = currentBankedPot;
            result.chantOrCurse = $"🔥 JACKPOT! 주사위 [{roll}]! {result.multiplier}배수 돌파! 누적 화력: {currentBankedPot}!";

            OnDoubleDownPushed?.Invoke(currentTier, currentBankedPot);
            return result;
        }

        // 욕심 부리지 않고 현재까지의 팟을 확정 타격/수령 (Bank Pot)
        public int CashOutAndBank()
        {
            int finalPot = currentBankedPot;
            currentBankedPot = 0;
            PushYourLuckTier savedTier = currentTier;
            currentTier = PushYourLuckTier.Base;
            consecutiveSuccessCount = 0;

            OnPotBanked?.Invoke(finalPot, true);
            return finalPot;
        }
    }
}
