using System;
using System.Collections.Generic;
using UnityEngine;

namespace AbyssRoll.Camping
{
    [Serializable]
    public class CampingSkill
    {
        public string skillName;
        public int timeRespiteCost; // 1 to 4 (Total 12 Respite points)
        public string description;
        public int partyStressHeal = 0;
        public int selfHpHealPercent = 0;
        public int torchBonus = 0;
        public float buffCritBonus = 0f;
    }

    public class CampfireSystemManager : MonoBehaviour
    {
        public static CampfireSystemManager Instance { get; private set; }

        public int remainingRespitePoints = 12;
        public bool isCampingActive = false;

        public List<CampingSkill> availableSkills = new List<CampingSkill>();

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            InitializeDefaultCampSkills();
        }

        public void InitializeDefaultCampSkills()
        {
            availableSkills.Clear();
            availableSkills.Add(new CampingSkill
            {
                skillName = "🔥 Stoke the Hearth",
                timeRespiteCost = 2,
                torchBonus = 40,
                description = "Stoke the embers. Increases Torchlight by +40."
            });
            availableSkills.Add(new CampingSkill
            {
                skillName = "🕯️ Shared Solace",
                timeRespiteCost = 3,
                partyStressHeal = 20,
                description = "Speak comforting tales. -20 Stress to all party members."
            });
            availableSkills.Add(new CampingSkill
            {
                skillName = "⚔️ Hone Weapons",
                timeRespiteCost = 3,
                buffCritBonus = 0.2f,
                description = "Sharpen blades against whetstones. +20% Critical chance for next combat."
            });
            availableSkills.Add(new CampingSkill
            {
                skillName = "🛡️ Sanctuary Vigil",
                timeRespiteCost = 4,
                description = "Prevents Nighttime Ambush while sleeping."
            });
        }

        public bool UseCampingSkill(CampingSkill skill)
        {
            if (remainingRespitePoints < skill.timeRespiteCost) return false;
            remainingRespitePoints -= skill.timeRespiteCost;

            if (skill.torchBonus > 0 && Core.SanityAndTorchManager.Instance != null)
            {
                Core.SanityAndTorchManager.Instance.LightTorch(skill.torchBonus);
            }
            return true;
        }

        public void RestAndBreakCamp(Action onCampFinished)
        {
            // Nighttime Ambush Check (15% chance if sanctuary vigil wasn't used)
            bool ambush = UnityEngine.Random.value < 0.15f;
            Debug.Log($"[Campfire] Rest complete. Ambush: {ambush}");
            isCampingActive = false;
            remainingRespitePoints = 12;
            onCampFinished?.Invoke();
        }
    }
}
