using System;
using System.Collections.Generic;
using UnityEngine;

namespace AbyssRoll.Combat
{
    [Serializable]
    public enum DiceType
    {
        D6 = 6,
        D8 = 8,
        D12 = 12,
        D20 = 20
    }

    [Serializable]
    public class DiceFaceSticker
    {
        public string skillName;
        public string description;
        public int baseValue;
        public string effectType; // "Damage", "Vampiric", "Stun", "StressHeal", "Poison", "Crit3X"
    }

    [Serializable]
    public class DiceCraftSlot
    {
        public DiceType diceType = DiceType.D6;
        public int rolledValue = 1;
        public bool isHeld = false;
        public DiceFaceSticker activeSticker;
        public List<DiceFaceSticker> faceStickers = new List<DiceFaceSticker>();

        public void InitializeDefaultStickers()
        {
            faceStickers.Clear();
            int sides = (int)diceType;
            for (int i = 1; i <= sides; i++)
            {
                var sticker = new DiceFaceSticker();
                if (i == 1)
                {
                    sticker.skillName = "💀 Ruinous Curse";
                    sticker.description = "Critical Failure: Self stress +15";
                    sticker.baseValue = 1;
                    sticker.effectType = "Curse";
                }
                else if (i == sides)
                {
                    sticker.skillName = "🩸 Execute Strike";
                    sticker.description = "High impact: 3x Critical damage";
                    sticker.baseValue = i * 4;
                    sticker.effectType = "Crit3X";
                }
                else
                {
                    sticker.skillName = $"⚔️ Strike {i}";
                    sticker.description = $"Standard hit for {i * 2} dmg";
                    sticker.baseValue = i * 2;
                    sticker.effectType = "Damage";
                }
                faceStickers.Add(sticker);
            }
        }

        public void Roll()
        {
            if (isHeld) return;
            rolledValue = UnityEngine.Random.Range(1, (int)diceType + 1);
            int idx = Mathf.Clamp(rolledValue - 1, 0, faceStickers.Count - 1);
            activeSticker = faceStickers[idx];
        }
    }

    public class RandomDiceAndSlotCombat : MonoBehaviour
    {
        public static RandomDiceAndSlotCombat Instance { get; private set; }

        public List<DiceCraftSlot> activeDiceSlots = new List<DiceCraftSlot>();
        public int remainingRerolls = 2;
        public int maxRerolls = 2;

        public event Action OnDiceRolled;
        public event Action<int, bool> OnDiceHoldToggled;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            InitDefaultDicePool();
        }

        public void InitDefaultDicePool()
        {
            activeDiceSlots.Clear();
            // Start with four D6 Bone Dice (one per hero)
            for (int i = 0; i < 4; i++)
            {
                var slot = new DiceCraftSlot { diceType = DiceType.D6 };
                slot.InitializeDefaultStickers();
                activeDiceSlots.Add(slot);
            }
        }

        public void RollAllSlots()
        {
            foreach (var slot in activeDiceSlots)
            {
                slot.Roll();
            }
            OnDiceRolled?.Invoke();
        }

        public bool ToggleHold(int slotIndex)
        {
            if (slotIndex < 0 || slotIndex >= activeDiceSlots.Count) return false;
            activeDiceSlots[slotIndex].isHeld = !activeDiceSlots[slotIndex].isHeld;
            OnDiceHoldToggled?.Invoke(slotIndex, activeDiceSlots[slotIndex].isHeld);
            return activeDiceSlots[slotIndex].isHeld;
        }

        public bool PerformReroll()
        {
            if (remainingRerolls <= 0) return false;
            remainingRerolls--;

            foreach (var slot in activeDiceSlots)
            {
                if (!slot.isHeld)
                {
                    slot.Roll();
                }
            }
            OnDiceRolled?.Invoke();
            return true;
        }

        public void ResetTurnRerolls()
        {
            remainingRerolls = maxRerolls;
            foreach (var slot in activeDiceSlots)
            {
                slot.isHeld = false;
            }
        }

        public void UpgradeDice(int slotIndex, DiceType newType)
        {
            if (slotIndex < 0 || slotIndex >= activeDiceSlots.Count) return;
            activeDiceSlots[slotIndex].diceType = newType;
            activeDiceSlots[slotIndex].InitializeDefaultStickers();
        }

        public void InscribeSticker(int slotIndex, int faceIndex, DiceFaceSticker newSticker)
        {
            if (slotIndex < 0 || slotIndex >= activeDiceSlots.Count) return;
            var slot = activeDiceSlots[slotIndex];
            if (faceIndex >= 0 && faceIndex < slot.faceStickers.Count)
            {
                slot.faceStickers[faceIndex] = newSticker;
            }
        }
    }
}
