using System;
using System.Collections.Generic;
using UnityEngine;

namespace AbyssRoll.Town
{
    [Serializable]
    public enum HeroClassType
    {
        BlackKnight,
        Berserker,
        Hunter,
        Wanderer,
        PlagueDoctor,
        Occultist,
        Crusader,
        BountyHunter
    }

    [Serializable]
    public class RosterHero
    {
        public string heroInstanceId;
        public HeroClassType classType;
        public string customName;
        public int level = 1;
        public int currentXP = 0;
        public int maxXP = 100;
        public int currentHP = 100;
        public int maxHP = 100;
        public int currentStress = 0;
        public List<string> positiveQuirks = new List<string>();
        public List<string> negativeQuirks = new List<string>();
        public bool isTreatmentInAbbey = false;
        public bool isTreatmentInSanitarium = false;
        public Combat.DiceType primaryDice = Combat.DiceType.D6;
    }

    [Serializable]
    public class TownFacility
    {
        public string facilityName;
        public int level = 1;
        public int maxLevel = 5;
        public int upgradeCostHeirlooms = 20;
        public float effectivenessBonus = 0.2f;
    }

    public class TownEstateHubManager : MonoBehaviour
    {
        public static TownEstateHubManager Instance { get; private set; }

        [Header("Player Estate Economy")]
        public int gold = 1500;
        public int heirlooms = 25;
        public int weeksPassed = 1;

        [Header("Hero Roster (Barracks)")]
        public List<RosterHero> heroRoster = new List<RosterHero>();
        public int maxRosterCapacity = 16;
        public List<RosterHero> stageCoachRecruits = new List<RosterHero>();

        [Header("Estate Facilities")]
        public TownFacility stageCoach = new TownFacility { facilityName = "Stage Coach (역마차)", upgradeCostHeirlooms = 15 };
        public TownFacility blacksmith = new TownFacility { facilityName = "Blacksmith (대장간)", upgradeCostHeirlooms = 25 };
        public TownFacility abbey = new TownFacility { facilityName = "Abbey (수도원: 스트레스 치료)", upgradeCostHeirlooms = 20 };
        public TownFacility sanitarium = new TownFacility { facilityName = "Sanitarium (요양원: 기벽 제거/고정)", upgradeCostHeirlooms = 30 };
        public TownFacility guild = new TownFacility { facilityName = "Survivalist Guild (주사위 스킬 훈련소)", upgradeCostHeirlooms = 25 };

        public event Action OnEstateStateUpdated;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            InitializeDefaultEstate();
        }

        public void InitializeDefaultEstate()
        {
            heroRoster.Clear();
            // Start with 4 classic founders
            AddHeroToRoster(HeroClassType.BlackKnight, "Sir Bryan (흑기사)");
            AddHeroToRoster(HeroClassType.Berserker, "Hagan (광전사)");
            AddHeroToRoster(HeroClassType.Hunter, "Audrey (사냥꾼)");
            AddHeroToRoster(HeroClassType.Wanderer, "Aldous (방랑자)");

            GenerateStageCoachRecruits();
        }

        public void AddHeroToRoster(HeroClassType heroClass, string name)
        {
            if (heroRoster.Count >= maxRosterCapacity) return;

            var hero = new RosterHero
            {
                heroInstanceId = Guid.NewGuid().ToString(),
                classType = heroClass,
                customName = name,
                currentHP = heroClass == HeroClassType.BlackKnight ? 120 : (heroClass == HeroClassType.Berserker ? 95 : 80),
                maxHP = heroClass == HeroClassType.BlackKnight ? 120 : (heroClass == HeroClassType.Berserker ? 95 : 80),
                currentStress = 0,
                primaryDice = Combat.DiceType.D6
            };
            heroRoster.Add(hero);
            OnEstateStateUpdated?.Invoke();
        }

        public void GenerateStageCoachRecruits()
        {
            stageCoachRecruits.Clear();
            int recruitCount = 2 + stageCoach.level;
            HeroClassType[] classes = (HeroClassType[])Enum.GetValues(typeof(HeroClassType));

            for (int i = 0; i < recruitCount; i++)
            {
                var randomClass = classes[UnityEngine.Random.Range(0, classes.Length)];
                stageCoachRecruits.Add(new RosterHero
                {
                    heroInstanceId = Guid.NewGuid().ToString(),
                    classType = randomClass,
                    customName = $"{randomClass} #{UnityEngine.Random.Range(100, 999)}",
                    currentHP = 80,
                    maxHP = 80,
                    primaryDice = Combat.DiceType.D6
                });
            }
        }

        public bool TreatHeroStressInAbbey(RosterHero hero)
        {
            int treatmentCost = 150;
            if (gold < treatmentCost) return false;

            gold -= treatmentCost;
            hero.isTreatmentInAbbey = true;
            OnEstateStateUpdated?.Invoke();
            return true;
        }

        public bool TreatHeroQuirkInSanitarium(RosterHero hero, string quirkToRemove)
        {
            int sanitariumCost = 300;
            if (gold < sanitariumCost) return false;

            gold -= sanitariumCost;
            hero.negativeQuirks.Remove(quirkToRemove);
            hero.isTreatmentInSanitarium = true;
            OnEstateStateUpdated?.Invoke();
            return true;
        }

        public void AdvanceWeek()
        {
            weeksPassed++;
            // Process treatments
            foreach (var h in heroRoster)
            {
                if (h.isTreatmentInAbbey)
                {
                    h.currentStress = Mathf.Max(0, h.currentStress - 65);
                    h.isTreatmentInAbbey = false;
                }
                if (h.isTreatmentInSanitarium)
                {
                    h.isTreatmentInSanitarium = false;
                }
            }
            GenerateStageCoachRecruits();
            OnEstateStateUpdated?.Invoke();
        }
    }
}
