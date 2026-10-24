using System;
using System.Collections.Generic;
using UnityEngine;

namespace AbyssRoll.Relics
{
    [Serializable]
    public class ActiveRelic
    {
        public string relicId;
        public string name;
        public string rarity;
        public float critBonus = 0f;
        public float torchDecayBonus = 0f;
        public int stressResistBonus = 0;
        public int bonusGoldPerRoom = 0;
    }

    public class RelicAndCurioSystem : MonoBehaviour
    {
        public static RelicAndCurioSystem Instance { get; private set; }

        public List<ActiveRelic> collectedRelics = new List<ActiveRelic>();

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void AddRelic(string relicId, string name, string rarity)
        {
            var relic = new ActiveRelic
            {
                relicId = relicId,
                name = name,
                rarity = rarity,
                critBonus = 0.15f,
                torchDecayBonus = 1.0f,
                bonusGoldPerRoom = 25
            };
            collectedRelics.Add(relic);
            Debug.Log($"[Relic] Acquired: {name} ({rarity})");
        }

        public float GetTotalCritBonus()
        {
            float total = 0f;
            foreach (var r in collectedRelics) total += r.critBonus;
            return total;
        }

        public float GetTotalTorchDecayBonus()
        {
            float total = 0f;
            foreach (var r in collectedRelics) total += r.torchDecayBonus;
            return total;
        }
    }
}
