using System;
using System.Collections.Generic;
using UnityEngine;

namespace AbyssRoll.Combat
{
    [Serializable]
    public class BossBlindData
    {
        public int ante;
        public string bossName;
        public string koreanTitle;
        public string curseDescription;
        public int baseHp;
        public string avatarIcon;
    }

    public class BossBlindCurseEngine : MonoBehaviour
    {
        public static BossBlindCurseEngine Instance { get; private set; }

        public List<BossBlindData> bossRoster = new List<BossBlindData>();
        public BossBlindData currentActiveBoss;
        public int currentCursedSlot = -1;

        public event Action<BossBlindData> OnBossBlindLoaded;
        public event Action<int> OnSlotCursed;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            InitializeBossRoster();
        }

        private void InitializeBossRoster()
        {
            bossRoster = new List<BossBlindData>
            {
                new BossBlindData { ante = 1, bossName = "The Golem", koreanTitle = "화염 골렘", curseDescription = "주사위 1개 슬롯 화염 봉인", baseHp = 350, avatarIcon = "👹" },
                new BossBlindData { ante = 2, bossName = "The Hook", koreanTitle = "갈고리 사냥꾼", curseDescription = "리롤 시 주사위 1개 버림", baseHp = 600, avatarIcon = "🪝" },
                new BossBlindData { ante = 3, bossName = "The Needle", koreanTitle = "바늘 군주", curseDescription = "단 2회 핸드 발사 기회", baseHp = 900, avatarIcon = "🪡" },
                new BossBlindData { ante = 4, bossName = "The Wall", koreanTitle = "성벽 거수", curseDescription = "초고체력 벽돌 방어선", baseHp = 1600, avatarIcon = "🗿" },
                new BossBlindData { ante = 5, bossName = "The Eye", koreanTitle = "감시자의 눈", curseDescription = "이전 족보 재사용 금지", baseHp = 2400, avatarIcon = "👁️" },
                new BossBlindData { ante = 6, bossName = "The Arm", koreanTitle = "부패의 손", curseDescription = "족보 레벨 1단계 영구 다운그레이드", baseHp = 3500, avatarIcon = "🖐️" },
                new BossBlindData { ante = 7, bossName = "The Ox", koreanTitle = "탐욕의 황소", curseDescription = "자멸 시 골드 50% 강탈", baseHp = 5000, avatarIcon = "🐂" },
                new BossBlindData { ante = 8, bossName = "The Abyssal Sovereign", koreanTitle = "심연의 지배자", curseDescription = "최종 결전! 모든 저주 복합 발동", baseHp = 8000, avatarIcon = "👑" }
            };
        }

        public BossBlindData LoadBossForAnte(int ante)
        {
            int idx = Mathf.Clamp(ante - 1, 0, bossRoster.Count - 1);
            currentActiveBoss = bossRoster[idx];
            currentCursedSlot = UnityEngine.Random.Range(0, 4);

            OnBossBlindLoaded?.Invoke(currentActiveBoss);
            OnSlotCursed?.Invoke(currentCursedSlot);

            Debug.Log($"[BossBlindCurseEngine] ANTE {ante} Loaded: {currentActiveBoss.koreanTitle} (HP: {currentActiveBoss.baseHp}) | Cursed Slot: {currentCursedSlot}");
            return currentActiveBoss;
        }

        public void ShiftCurseRandomly()
        {
            currentCursedSlot = UnityEngine.Random.Range(0, 4);
            OnSlotCursed?.Invoke(currentCursedSlot);
        }
    }
}
