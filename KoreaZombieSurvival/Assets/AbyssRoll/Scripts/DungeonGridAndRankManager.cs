using System;
using System.Collections.Generic;
using UnityEngine;

namespace AbyssRoll.Dungeon
{
    [Serializable]
    public enum DungeonNodeType
    {
        CombatCrypt,
        CursedCurioRoom,
        CampfireSanctuary,
        AltarOfDiceCrafting,
        VolcanoGolemBoss
    }

    [Serializable]
    public class DungeonNode
    {
        public int nodeIndex;
        public DungeonNodeType nodeType;
        public string title;
        public string description;
        public bool isCleared = false;
    }

    [Serializable]
    public class CombatEntity
    {
        public string id;
        public string name;
        public int currentHP;
        public int maxHP;
        public int rank; // 1 (front) to 4 (back)
        public bool isMonster = false;
        public int attackPower = 12;
        public int stressAttack = 10;
        public Sprite characterSprite;
    }

    public class DungeonGridAndRankManager : MonoBehaviour
    {
        public static DungeonGridAndRankManager Instance { get; private set; }

        [Header("Party and Monster Formations")]
        public List<CombatEntity> heroes = new List<CombatEntity>();
        public List<CombatEntity> monsters = new List<CombatEntity>();

        [Header("Dungeon Crawler Nodes")]
        public List<DungeonNode> dungeonFloor = new List<DungeonNode>();
        public int currentNodeIndex = 0;

        public event Action<List<CombatEntity>, List<CombatEntity>> OnRanksUpdated;
        public event Action<DungeonNode> OnNodeEntered;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            InitializeDefaultParty();
            GenerateDungeonFloor();
        }

        public void InitializeDefaultParty()
        {
            heroes.Clear();
            // 4 Heroes: Rank 1 (Black Knight), Rank 2 (Berserker), Rank 3 (Hunter), Rank 4 (Wanderer)
            heroes.Add(new CombatEntity { id = "black_knight", name = "Black Knight (흑기사)", rank = 1, maxHP = 120, currentHP = 120, attackPower = 18 });
            heroes.Add(new CombatEntity { id = "berserker", name = "Berserker (광전사)", rank = 2, maxHP = 90, currentHP = 90, attackPower = 24 });
            heroes.Add(new CombatEntity { id = "hunter", name = "Hunter (사냥꾼)", rank = 3, maxHP = 80, currentHP = 80, attackPower = 20 });
            heroes.Add(new CombatEntity { id = "wanderer", name = "Wanderer (방랑자)", rank = 4, maxHP = 75, currentHP = 75, attackPower = 15 });
        }

        public void SpawnMonstersForNode(DungeonNodeType nodeType)
        {
            monsters.Clear();
            if (nodeType == DungeonNodeType.VolcanoGolemBoss)
            {
                monsters.Add(new CombatEntity { id = "boss1", name = "Volcano Golem Boss (화산 골렘)", rank = 1, maxHP = 450, currentHP = 450, attackPower = 35, stressAttack = 25, isMonster = true });
            }
            else
            {
                monsters.Add(new CombatEntity { id = "gravekeeper", name = "Gravekeeper (묘지기)", rank = 1, maxHP = 80, currentHP = 80, attackPower = 14, stressAttack = 8, isMonster = true });
                monsters.Add(new CombatEntity { id = "bone_shaman", name = "Bone Shaman (뼈 주술사)", rank = 2, maxHP = 65, currentHP = 65, attackPower = 10, stressAttack = 18, isMonster = true });
                monsters.Add(new CombatEntity { id = "ghoul", name = "Ghoul (구울)", rank = 3, maxHP = 70, currentHP = 70, attackPower = 16, stressAttack = 10, isMonster = true });
                monsters.Add(new CombatEntity { id = "wraith", name = "Wraith (망령)", rank = 4, maxHP = 50, currentHP = 50, attackPower = 12, stressAttack = 22, isMonster = true });
            }
            OnRanksUpdated?.Invoke(heroes, monsters);
        }

        public void GenerateDungeonFloor(int totalRooms = 10)
        {
            dungeonFloor.Clear();
            for (int i = 0; i < totalRooms; i++)
            {
                var node = new DungeonNode { nodeIndex = i };
                if (i == totalRooms - 1)
                {
                    node.nodeType = DungeonNodeType.VolcanoGolemBoss;
                    node.title = "🔥 CHAMBER OF THE VOLCANO GOLEM";
                    node.description = "The earth shakes with incandescent brimstone.";
                }
                else if (i == 3 || i == 7)
                {
                    node.nodeType = DungeonNodeType.CampfireSanctuary;
                    node.title = "🏕️ CAMPFIRE SANCTUARY";
                    node.description = "A brief respite to warm shivering bones and soothe despair.";
                }
                else if (i == 5)
                {
                    node.nodeType = DungeonNodeType.AltarOfDiceCrafting;
                    node.title = "✨ ELDRITCH DICE ALTAR";
                    node.description = "Engrave blood sigils into the polyhedral faces.";
                }
                else if (i % 2 == 1)
                {
                    node.nodeType = DungeonNodeType.CursedCurioRoom;
                    node.title = "🗝️ CURSED RELIQUARY";
                    node.description = "Gothic curios whisper forgotten temptations.";
                }
                else
                {
                    node.nodeType = DungeonNodeType.CombatCrypt;
                    node.title = $"⚔️ CRYPT PASSAGE #{i + 1}";
                    node.description = "Vile undead skulk in the darkness.";
                }
                dungeonFloor.Add(node);
            }
        }

        public void SwapHeroRanks(int indexA, int indexB)
        {
            if (indexA < 0 || indexA >= heroes.Count || indexB < 0 || indexB >= heroes.Count) return;
            var temp = heroes[indexA];
            heroes[indexA] = heroes[indexB];
            heroes[indexB] = temp;

            for (int i = 0; i < heroes.Count; i++)
            {
                heroes[i].rank = i + 1;
            }
            OnRanksUpdated?.Invoke(heroes, monsters);
        }

        public void AdvanceToNextNode()
        {
            if (currentNodeIndex < dungeonFloor.Count - 1)
            {
                currentNodeIndex++;
                var node = dungeonFloor[currentNodeIndex];
                SpawnMonstersForNode(node.nodeType);
                OnNodeEntered?.Invoke(node);
            }
        }
    }
}
