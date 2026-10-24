using System;
using System.Collections.Generic;
using UnityEngine;

namespace AbyssRoll.Campaign
{
    [Serializable]
    public enum DungeonRegion
    {
        RuinsOfCrypt,       // 폐허 (해골/이교도)
        WealdForest,        // 삼림지 (진균/야수)
        WarrensSewers,      // 사육장 (돼지인간/질병)
        CoveCaverns,        // 해안만 (어인/출혈)
        DarkestAbyss        // 가장 어두운 심연 (최종 엔드게임 보스 4단계)
    }

    [Serializable]
    public enum ExpeditionLength
    {
        Short = 8,
        Medium = 16,
        Long = 24
    }

    [Serializable]
    public class ExpeditionQuest
    {
        public string questId;
        public DungeonRegion region;
        public string title;
        public ExpeditionLength length;
        public int difficultyLevel = 1; // 1: 견습, 3: 베테랑, 5: 챔피언, 6: 다키스트
        public int rewardGold = 2500;
        public int rewardHeirlooms = 12;
        public string targetBossOrGoal;
        public bool isCompleted = false;
    }

    public class CampaignMapAndQuestManager : MonoBehaviour
    {
        public static CampaignMapAndQuestManager Instance { get; private set; }

        public List<ExpeditionQuest> activeQuests = new List<ExpeditionQuest>();
        public ExpeditionQuest selectedQuest;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            GenerateWeeklyQuests();
        }

        public void GenerateWeeklyQuests()
        {
            activeQuests.Clear();

            // 1. Ruins Quest
            activeQuests.Add(new ExpeditionQuest
            {
                questId = Guid.NewGuid().ToString(),
                region = DungeonRegion.RuinsOfCrypt,
                title = "🦴 Cleansing the Defiled Crypts",
                length = ExpeditionLength.Short,
                difficultyLevel = 1,
                rewardGold = 2000,
                rewardHeirlooms = 10,
                targetBossOrGoal = "Explore 90% of Rooms"
            });

            // 2. Weald Quest
            activeQuests.Add(new ExpeditionQuest
            {
                questId = Guid.NewGuid().ToString(),
                region = DungeonRegion.WealdForest,
                title = "🌲 The Fungal Horror in the Thick",
                length = ExpeditionLength.Medium,
                difficultyLevel = 1,
                rewardGold = 3500,
                rewardHeirlooms = 16,
                targetBossOrGoal = "Slay the Witch of Thorns"
            });

            // 3. Warrens Quest
            activeQuests.Add(new ExpeditionQuest
            {
                questId = Guid.NewGuid().ToString(),
                region = DungeonRegion.WarrensSewers,
                title = "🐖 Swine King's Feast of Carcass",
                length = ExpeditionLength.Medium,
                difficultyLevel = 3,
                rewardGold = 5000,
                rewardHeirlooms = 22,
                targetBossOrGoal = "Assassinate Swine Prince"
            });

            // 4. Cove Quest
            activeQuests.Add(new ExpeditionQuest
            {
                questId = Guid.NewGuid().ToString(),
                region = DungeonRegion.CoveCaverns,
                title = "🌊 Siren's Alluring Dirge",
                length = ExpeditionLength.Long,
                difficultyLevel = 3,
                rewardGold = 7000,
                rewardHeirlooms = 28,
                targetBossOrGoal = "Slay Drowned Siren"
            });

            // 5. Darkest Abyss (Endgame Boss)
            activeQuests.Add(new ExpeditionQuest
            {
                questId = Guid.NewGuid().ToString(),
                region = DungeonRegion.DarkestAbyss,
                title = "👁️ THE DARKEST ABYSS: SHUFFLING HORROR",
                length = ExpeditionLength.Long,
                difficultyLevel = 6,
                rewardGold = 20000,
                rewardHeirlooms = 50,
                targetBossOrGoal = "Heart of Darkness Final Extinction"
            });

            selectedQuest = activeQuests[0];
        }
    }
}
