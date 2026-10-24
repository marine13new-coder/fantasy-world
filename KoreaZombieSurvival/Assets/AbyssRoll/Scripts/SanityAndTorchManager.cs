using System;
using System.Collections.Generic;
using UnityEngine;

namespace AbyssRoll.Core
{
    [Serializable]
    public enum SanityState
    {
        Normal,
        Afflicted, // Paranoia, Masochism, Fear
        Virtuous   // Courage, Fortitude, Focus
    }

    [Serializable]
    public class HeroSanityData
    {
        public string heroId;
        public string heroName;
        public int maxHP = 100;
        public int currentHP = 100;
        public int stress = 0; // 0 to 100
        public SanityState sanityState = SanityState.Normal;
        public string afflictionOrVirtueName = "";
        public List<string> activeQuirks = new List<string>();
        public int rankPosition = 1; // 1 to 4
    }

    public class SanityAndTorchManager : MonoBehaviour
    {
        public static SanityAndTorchManager Instance { get; private set; }

        [Header("Torch System")]
        [Range(0f, 100f)] public float torchLight = 100f;
        public float torchDecayPerTurn = 6f;

        [Header("References")]
        public DarkTorchlightVignette vignette;

        // Events
        public event Action<float> OnTorchChanged;
        public event Action<HeroSanityData, bool> OnFateJudgement; // true = Virtue, false = Affliction
        public event Action<HeroSanityData, int> OnStressChanged;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void ConsumeTorch(float amount)
        {
            torchLight = Mathf.Clamp(torchLight - amount, 0f, 100f);
            OnTorchChanged?.Invoke(torchLight);
            if (vignette != null)
            {
                vignette.UpdateTorchVignette(torchLight);
            }
        }

        public void LightTorch(float amount = 30f)
        {
            torchLight = Mathf.Clamp(torchLight + amount, 0f, 100f);
            OnTorchChanged?.Invoke(torchLight);
            if (vignette != null)
            {
                vignette.UpdateTorchVignette(torchLight);
            }
        }

        // Returns critical hit and drop multiplier based on darkness
        public float GetDarknessCritMultiplier()
        {
            // At 100% torch: 1.0x. At 0% torch: 3.0x (High Risk High Return)
            return Mathf.Lerp(1.0f, 3.0f, 1f - (torchLight / 100f));
        }

        public float GetDarknessMonsterDamageMultiplier()
        {
            // At 0% torch: monsters hit 1.8x harder and cause more stress
            return Mathf.Lerp(1.0f, 1.8f, 1f - (torchLight / 100f));
        }

        public void AddStress(HeroSanityData hero, int stressDelta)
        {
            if (hero == null || hero.currentHP <= 0) return;

            // Darkness multiplies incoming stress
            float darkFactor = Mathf.Lerp(1.0f, 2.0f, 1f - (torchLight / 100f));
            int adjustedStress = Mathf.RoundToInt(stressDelta * darkFactor);

            hero.stress = Mathf.Clamp(hero.stress + adjustedStress, 0, 100);
            OnStressChanged?.Invoke(hero, hero.stress);

            // Fate Judgement check at 100 Stress
            if (hero.stress >= 100 && hero.sanityState == SanityState.Normal)
            {
                TriggerFateJudgement(hero);
            }
        }

        public void RelieveStress(HeroSanityData hero, int relief)
        {
            if (hero == null) return;
            hero.stress = Mathf.Clamp(hero.stress - relief, 0, 100);
            OnStressChanged?.Invoke(hero, hero.stress);
        }

        private void TriggerFateJudgement(HeroSanityData hero)
        {
            // 75% Affliction (Collapse), 25% Virtue (Heroic Awakening)
            float roll = UnityEngine.Random.value;
            if (roll < 0.25f)
            {
                // Heroic Awakening (Virtue)
                hero.sanityState = SanityState.Virtuous;
                string[] virtues = { "COURAGE (용기)", "FORTITUDE (강인함)", "FOCUSED WILL (집중)" };
                hero.afflictionOrVirtueName = virtues[UnityEngine.Random.Range(0, virtues.Length)];
                hero.currentHP = Mathf.Min(hero.maxHP, hero.currentHP + (int)(hero.maxHP * 0.4f));
                hero.stress = 50; // Drop stress to 50
                OnFateJudgement?.Invoke(hero, true);
            }
            else
            {
                // Affliction (Mental Collapse)
                hero.sanityState = SanityState.Afflicted;
                string[] afflictions = { "PARANOIA (편집증)", "MASOCHISM (피학증)", "HOPELESS TERROR (절망)" };
                hero.afflictionOrVirtueName = afflictions[UnityEngine.Random.Range(0, afflictions.Length)];
                OnFateJudgement?.Invoke(hero, false);
            }
        }
    }
}
