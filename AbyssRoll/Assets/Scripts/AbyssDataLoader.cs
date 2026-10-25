using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace AbyssRoll.Data
{
    [Serializable]
    public class HeroData
    {
        public string id;
        public string name;
        public int preferredRank;
        public int baseHp;
        public int baseDmg;
        public string gothicLore;
    }

    [Serializable]
    public class MonsterData
    {
        public string id;
        public string name;
        public int rank;
        public int baseHp;
        public int baseDmg;
        public int stressDmg;
        public bool isBoss;
    }

    [Serializable]
    public class HeroesAndMonstersPayload
    {
        public List<HeroData> heroes;
        public List<MonsterData> monsters;
    }

    [Serializable]
    public class SkillData
    {
        public string id;
        public string skillName;
        public string diceCompatibility;
        public int baseValue;
        public string effectType;
        public string description;
    }

    [Serializable]
    public class SkillsPayload
    {
        public List<SkillData> skills;
    }

    [Serializable]
    public class QuirkData
    {
        public string id;
        public string name;
        public bool isPositive;
        public string effectDescription;
    }

    [Serializable]
    public class AfflictionData
    {
        public string id;
        public string name;
        public string barkQuote;
        public string combatPenalty;
    }

    [Serializable]
    public class VirtueData
    {
        public string id;
        public string name;
        public string barkQuote;
        public string combatBuff;
    }

    [Serializable]
    public class QuirksPayload
    {
        public List<QuirkData> quirks;
        public List<AfflictionData> afflictions;
        public List<VirtueData> virtues;
    }

    [Serializable]
    public class RelicData
    {
        public string id;
        public string name;
        public string rarity;
        public string passiveBenefit;
        public string curseDrawback;
    }

    [Serializable]
    public class CurioData
    {
        public string id;
        public string curioName;
        public string interactionPrompt;
        public string positiveOutcome;
        public string negativeOutcome;
    }

    [Serializable]
    public class RelicsPayload
    {
        public List<RelicData> relics;
        public List<CurioData> curios;
    }

    public class AbyssDataLoader : MonoBehaviour
    {
        public static AbyssDataLoader Instance { get; private set; }

        public HeroesAndMonstersPayload heroesAndMonsters;
        public SkillsPayload skillsPayload;
        public QuirksPayload quirksPayload;
        public RelicsPayload relicsPayload;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            LoadAllStreamingData();
        }

        public void LoadAllStreamingData()
        {
            heroesAndMonsters = LoadJsonFromStreamingAssets<HeroesAndMonstersPayload>("HeroesAndMonsters.json");
            skillsPayload = LoadJsonFromStreamingAssets<SkillsPayload>("DiceFacesAndSkills.json");
            quirksPayload = LoadJsonFromStreamingAssets<QuirksPayload>("QuirksAndAfflictions.json");
            relicsPayload = LoadJsonFromStreamingAssets<RelicsPayload>("RelicsAndCurios.json");
            Debug.Log($"[AbyssDataLoader] Loaded: {heroesAndMonsters?.heroes?.Count ?? 0} Heroes, {heroesAndMonsters?.monsters?.Count ?? 0} Monsters, {skillsPayload?.skills?.Count ?? 0} Skills, {relicsPayload?.relics?.Count ?? 0} Relics");
        }

        private T LoadJsonFromStreamingAssets<T>(string fileName) where T : class
        {
            string path = Path.Combine(Application.streamingAssetsPath, fileName);
            try
            {
                if (File.Exists(path))
                {
                    string json = File.ReadAllText(path);
                    return JsonUtility.FromJson<T>(json);
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[AbyssDataLoader] Failed to load {fileName}: {ex.Message}");
            }
            return null;
        }
    }
}
