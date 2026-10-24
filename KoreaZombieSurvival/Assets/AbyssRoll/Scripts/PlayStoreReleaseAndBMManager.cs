using System;
using System.IO;
using UnityEngine;
using UnityEngine.UI;

namespace AbyssRoll.Release
{
    [Serializable]
    public class TownProgressionData
    {
        public int heirlooms = 0;       // 가보
        public int gold = 0;            // 골드
        public int blacksmithLevel = 0; // 대장간: 시작 주사위 강화
        public int monasteryLevel = 0;  // 수도원: 기본 스트레스 저항력 증가
    }

    public class PlayStoreReleaseAndBMManager : MonoBehaviour
    {
        public static PlayStoreReleaseAndBMManager Instance { get; private set; }

        public TownProgressionData townData = new TownProgressionData();
        private string SaveFilePath => Path.Combine(Application.persistentDataPath, "abyss_town_save.json");

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            LoadProgression();
        }

        // BM 1: 운명의 제단 기도 (전멸 위기 시 광고 시청 후 스트레스 0 & HP 50% 부활)
        public void ShowAdAltarOfFate(Action onRewardSuccess)
        {
            Debug.Log("[BM] Triggered: Altar of Fate Rewarded Ad (Revive + Stress Reset)");
            // In editor or test environment, grant immediately. Production integrates AdMob ShowRewardedAd()
            SimulateAdPlayback(() =>
            {
                if (Dungeon.DungeonGridAndRankManager.Instance != null)
                {
                    foreach (var h in Dungeon.DungeonGridAndRankManager.Instance.heroes)
                    {
                        if (h.currentHP <= 0) h.currentHP = (int)(h.maxHP * 0.5f);
                    }
                }
                if (Core.SanityAndTorchManager.Instance != null)
                {
                    Core.SanityAndTorchManager.Instance.LightTorch(50f);
                }
                onRewardSuccess?.Invoke();
            });
        }

        // BM 2: 시간의 모래시계 (전투 중 광고 시청 후 전체 무료 리롤 + D20 축복)
        public void ShowAdHourglassOfTime(Action onRewardSuccess)
        {
            Debug.Log("[BM] Triggered: Hourglass of Time Rewarded Ad (Free Rerolls + D20 Blessing)");
            SimulateAdPlayback(() =>
            {
                if (Combat.RandomDiceAndSlotCombat.Instance != null)
                {
                    Combat.RandomDiceAndSlotCombat.Instance.remainingRerolls += 3;
                    if (Combat.RandomDiceAndSlotCombat.Instance.activeDiceSlots.Count > 0)
                    {
                        Combat.RandomDiceAndSlotCombat.Instance.UpgradeDice(0, Combat.DiceType.D20);
                    }
                    Combat.RandomDiceAndSlotCombat.Instance.RollAllSlots();
                }
                onRewardSuccess?.Invoke();
            });
        }

        // BM 3: 까마귀의 전리품 (원정 종료 후 광고 시청 시 획득 가보/골드 2배)
        public void ShowAdCrowLoot(int gainedHeirlooms, int gainedGold, Action onRewardSuccess)
        {
            Debug.Log("[BM] Triggered: Crow's Plunder Rewarded Ad (2x Heirlooms & Gold)");
            SimulateAdPlayback(() =>
            {
                townData.heirlooms += gainedHeirlooms * 2;
                townData.gold += gainedGold * 2;
                SaveProgression();
                onRewardSuccess?.Invoke();
            });
        }

        private void SimulateAdPlayback(Action onFinished)
        {
            // Direct safe invocation allowing zero-human-confirmation testing
            onFinished?.Invoke();
        }

        public void UpgradeBlacksmith()
        {
            int cost = (townData.blacksmithLevel + 1) * 20;
            if (townData.heirlooms >= cost)
            {
                townData.heirlooms -= cost;
                townData.blacksmithLevel++;
                SaveProgression();
            }
        }

        public void UpgradeMonastery()
        {
            int cost = (townData.monasteryLevel + 1) * 20;
            if (townData.heirlooms >= cost)
            {
                townData.heirlooms -= cost;
                townData.monasteryLevel++;
                SaveProgression();
            }
        }

        public void SaveProgression()
        {
            try
            {
                string json = JsonUtility.ToJson(townData, true);
                File.WriteAllText(SaveFilePath, json);
            }
            catch (Exception ex)
            {
                Debug.LogError("[BM Save] Save failed: " + ex.Message);
            }
        }

        public void LoadProgression()
        {
            try
            {
                if (File.Exists(SaveFilePath))
                {
                    string json = File.ReadAllText(SaveFilePath);
                    townData = JsonUtility.FromJson<TownProgressionData>(json) ?? new TownProgressionData();
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning("[BM Load] Load failed: " + ex.Message);
                townData = new TownProgressionData();
            }
        }
    }
}
