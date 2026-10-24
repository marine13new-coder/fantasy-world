using System;
using System.Collections.Generic;
using UnityEngine;

namespace AbyssRoll.Combat
{
    [Serializable]
    public enum StatusEffectType
    {
        Bleed,  // 출혈 (매 턴 지속 물리 피해)
        Blight, // 중독 (방어 무시 산성 피해)
        Stun,   // 기절 (다음 턴 행동 불가)
        Riposte,// 반격 (피격 시 즉시 주사위 반격)
        Marked, // 표식 (특정 스킬 피해량 +100%)
        Stealth // 은신 (타겟 지정 불가)
    }

    [Serializable]
    public class ActiveStatusEffect
    {
        public StatusEffectType type;
        public int potency;
        public int remainingTurns;
    }

    public class StatusEffectAndDoTManager : MonoBehaviour
    {
        public static StatusEffectAndDoTManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void ApplyStatus(Dungeon.CombatEntity target, StatusEffectType type, int potency, int duration)
        {
            Debug.Log($"[StatusEffect] Applied {type} ({potency}/turn, {duration} turns) to {target.name}");
        }

        public int ProcessTurnDoT(Dungeon.CombatEntity entity, List<ActiveStatusEffect> effects)
        {
            int totalDoTDamage = 0;
            for (int i = effects.Count - 1; i >= 0; i--)
            {
                var eff = effects[i];
                if (eff.type == StatusEffectType.Bleed || eff.type == StatusEffectType.Blight)
                {
                    totalDoTDamage += eff.potency;
                }
                eff.remainingTurns--;
                if (eff.remainingTurns <= 0)
                {
                    effects.RemoveAt(i);
                }
            }
            entity.currentHP = Mathf.Max(0, entity.currentHP - totalDoTDamage);
            return totalDoTDamage;
        }

        public bool CheckDeathsDoorSurvival(Dungeon.CombatEntity hero)
        {
            // Death's Door (죽음의 문턱): HP가 0일 때 피격 시 33% 확률로 사망, 67% 확률로 생존
            float roll = UnityEngine.Random.value;
            bool survived = roll <= 0.67f;
            Debug.Log($"[Death's Door] {hero.name} took a fatal blow! Roll: {roll:F2}. Survived: {survived}");
            return survived;
        }
    }
}
