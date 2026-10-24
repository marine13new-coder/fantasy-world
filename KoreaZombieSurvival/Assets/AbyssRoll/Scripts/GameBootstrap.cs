using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace AbyssRoll.Core
{
    public enum GameFlowState
    {
        TownLobby,
        DungeonMapRoll,
        CombatStart,
        TurnRoll,
        PlayerHoldAndReroll,
        ActionCutIn,
        StressCheck,
        EnemyTurn,
        RelicReward,
        GameOver,
        Victory
    }

    public class GameBootstrap : MonoBehaviour
    {
        public static GameBootstrap Instance { get; private set; }

        public GameFlowState currentState = GameFlowState.TownLobby;

        private UI.VerticalDungeonUIManager _uiManager;
        private SanityAndTorchManager _sanityManager;
        private Combat.RandomDiceAndSlotCombat _combatManager;
        private Dungeon.DungeonGridAndRankManager _rankManager;
        private Presentation.DarkestJuiceAndCutInEngine _cutInEngine;
        private Audio.DarkAudioAndHapticManager _audioManager;
        private Release.PlayStoreReleaseAndBMManager _bmManager;

        private List<Text> _heroHpTexts = new List<Text>();
        private List<Text> _heroStressTexts = new List<Text>();
        private List<Button> _diceSlotButtons = new List<Button>();
        private List<Text> _diceSlotTexts = new List<Text>();

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            InitializeAllSubsystems();
        }

        private void Start()
        {
            SetupUIEventListeners();
            StartCoroutine(StartGameRoutine());
        }

        private void InitializeAllSubsystems()
        {
            // 1. Camera setup
            Camera cam = Camera.main;
            if (cam == null)
            {
                var camGo = new GameObject("Main Camera", typeof(Camera), typeof(AudioListener));
                cam = camGo.GetComponent<Camera>();
                cam.tag = "MainCamera";
                cam.clearFlags = CameraClearFlags.SolidColor;
                cam.backgroundColor = new Color(0.035f, 0.039f, 0.059f);
            }

            // 2. Canvas setup
            Canvas canvas = FindFirstObjectByType<Canvas>();
            if (canvas == null)
            {
                var canvasGo = new GameObject("AbyssCanvas", typeof(Canvas), typeof(GraphicRaycaster));
                canvas = canvasGo.GetComponent<Canvas>();
                canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            }
            if (FindFirstObjectByType<UnityEngine.EventSystems.EventSystem>() == null)
            {
                new GameObject("EventSystem", typeof(UnityEngine.EventSystems.EventSystem), typeof(UnityEngine.EventSystems.StandaloneInputModule));
            }

            // 3. UI Manager
            _uiManager = gameObject.AddComponent<UI.VerticalDungeonUIManager>();
            _uiManager.SetupHierarchy(canvas);

            // 4. Torch & Vignette
            var vignetteGo = new GameObject("DarkTorchlightVignette", typeof(RectTransform), typeof(Image), typeof(DarkTorchlightVignette));
            vignetteGo.transform.SetParent(_uiManager.safeAreaRoot, false);
            RectTransform vRt = vignetteGo.GetComponent<RectTransform>();
            vRt.anchorMin = Vector2.zero;
            vRt.anchorMax = Vector2.one;
            vRt.offsetMin = vRt.offsetMax = Vector2.zero;
            var vignette = vignetteGo.GetComponent<DarkTorchlightVignette>();

            _sanityManager = gameObject.AddComponent<SanityAndTorchManager>();
            _sanityManager.vignette = vignette;

            // 5. Combat & Dice
            _combatManager = gameObject.AddComponent<Combat.RandomDiceAndSlotCombat>();

            // 6. Dungeon & Ranks
            _rankManager = gameObject.AddComponent<Dungeon.DungeonGridAndRankManager>();

            // 7. Cut-In Engine
            _cutInEngine = gameObject.AddComponent<Presentation.DarkestJuiceAndCutInEngine>();
            _cutInEngine.SetupCutInOverlay(_uiManager.safeAreaRoot);

            // 8. Audio & Haptics
            _audioManager = gameObject.AddComponent<Audio.DarkAudioAndHapticManager>();

            // 9. Monetization & Release
            _bmManager = gameObject.AddComponent<Release.PlayStoreReleaseAndBMManager>();

            BuildRuntimeHeroCards();
            BuildRuntimeDiceSlots();
        }

        private void BuildRuntimeHeroCards()
        {
            _heroHpTexts.Clear();
            _heroStressTexts.Clear();

            for (int i = 0; i < 4; i++)
            {
                GameObject cardGo = new GameObject($"HeroCard_{i}", typeof(RectTransform), typeof(Image));
                cardGo.transform.SetParent(_uiManager.heroStatusCardsContainer, false);
                RectTransform rt = cardGo.GetComponent<RectTransform>();
                rt.anchorMin = new Vector2(i * 0.25f + 0.01f, 0.05f);
                rt.anchorMax = new Vector2((i + 1) * 0.25f - 0.01f, 0.95f);
                rt.offsetMin = rt.offsetMax = Vector2.zero;

                Image bg = cardGo.GetComponent<Image>();
                bg.color = new Color(0.1f, 0.11f, 0.16f, 0.9f);

                // Title
                GameObject textGo = new GameObject("NameText", typeof(RectTransform), typeof(Text));
                textGo.transform.SetParent(cardGo.transform, false);
                RectTransform textRt = textGo.GetComponent<RectTransform>();
                textRt.anchorMin = new Vector2(0.05f, 0.65f);
                textRt.anchorMax = new Vector2(0.95f, 0.95f);
                textRt.offsetMin = textRt.offsetMax = Vector2.zero;
                Text nameTxt = textGo.GetComponent<Text>();
                nameTxt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                nameTxt.fontSize = 18;
                nameTxt.color = new Color(0.77f, 0.63f, 0.35f);
                nameTxt.alignment = TextAnchor.MiddleCenter;
                nameTxt.text = _rankManager.heroes[i].name.Split(' ')[0];

                // HP
                GameObject hpGo = new GameObject("HpText", typeof(RectTransform), typeof(Text));
                hpGo.transform.SetParent(cardGo.transform, false);
                RectTransform hpRt = hpGo.GetComponent<RectTransform>();
                hpRt.anchorMin = new Vector2(0.05f, 0.35f);
                hpRt.anchorMax = new Vector2(0.95f, 0.65f);
                hpRt.offsetMin = hpRt.offsetMax = Vector2.zero;
                Text hpTxt = hpGo.GetComponent<Text>();
                hpTxt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                hpTxt.fontSize = 16;
                hpTxt.color = new Color(0.2f, 0.8f, 0.3f);
                hpTxt.alignment = TextAnchor.MiddleCenter;
                hpTxt.text = $"HP: {_rankManager.heroes[i].currentHP}/{_rankManager.heroes[i].maxHP}";
                _heroHpTexts.Add(hpTxt);

                // Stress
                GameObject stressGo = new GameObject("StressText", typeof(RectTransform), typeof(Text));
                stressGo.transform.SetParent(cardGo.transform, false);
                RectTransform stressRt = stressGo.GetComponent<RectTransform>();
                stressRt.anchorMin = new Vector2(0.05f, 0.05f);
                stressRt.anchorMax = new Vector2(0.95f, 0.35f);
                stressRt.offsetMin = stressRt.offsetMax = Vector2.zero;
                Text stressTxt = stressGo.GetComponent<Text>();
                stressTxt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                stressTxt.fontSize = 15;
                stressTxt.color = new Color(0.85f, 0.25f, 0.85f);
                stressTxt.alignment = TextAnchor.MiddleCenter;
                stressTxt.text = "STRESS: 0/100";
                _heroStressTexts.Add(stressTxt);
            }
        }

        private void BuildRuntimeDiceSlots()
        {
            _diceSlotButtons.Clear();
            _diceSlotTexts.Clear();

            for (int i = 0; i < 4; i++)
            {
                int slotIdx = i;
                GameObject diceGo = new GameObject($"DiceSlot_{i}", typeof(RectTransform), typeof(Image), typeof(Button));
                diceGo.transform.SetParent(_uiManager.diceSlotsContainer, false);
                RectTransform rt = diceGo.GetComponent<RectTransform>();
                rt.anchorMin = new Vector2(i * 0.25f + 0.015f, 0.1f);
                rt.anchorMax = new Vector2((i + 1) * 0.25f - 0.015f, 0.9f);
                rt.offsetMin = rt.offsetMax = Vector2.zero;

                Image img = diceGo.GetComponent<Image>();
                img.color = new Color(0.18f, 0.12f, 0.12f, 1f);

                Button btn = diceGo.GetComponent<Button>();
                btn.onClick.AddListener(() => OnDiceSlotClicked(slotIdx));
                _diceSlotButtons.Add(btn);

                GameObject labelGo = new GameObject("Label", typeof(RectTransform), typeof(Text));
                labelGo.transform.SetParent(diceGo.transform, false);
                RectTransform lRt = labelGo.GetComponent<RectTransform>();
                lRt.anchorMin = Vector2.zero;
                lRt.anchorMax = Vector2.one;
                lRt.offsetMin = lRt.offsetMax = Vector2.zero;

                Text txt = labelGo.GetComponent<Text>();
                txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                txt.fontSize = 18;
                txt.alignment = TextAnchor.MiddleCenter;
                txt.color = Color.white;
                txt.text = $"[D6]\nREADY";
                _diceSlotTexts.Add(txt);
            }
        }

        private void SetupUIEventListeners()
        {
            _uiManager.rollButton.onClick.AddListener(OnMainActionButtonPressed);
            _uiManager.rerollButton.onClick.AddListener(OnRerollButtonPressed);
            _uiManager.lightTorchButton.onClick.AddListener(() =>
            {
                _sanityManager.LightTorch(25f);
                _uiManager.combatLogText.text = "🔥 The torch blazes brighter, driving back the gloom.";
            });

            _sanityManager.OnTorchChanged += (torchVal) =>
            {
                _uiManager.torchPercentText.text = $"🔥 TORCHLIGHT: {(int)torchVal}% " + (torchVal < 30 ? "[PITCH BLACK - HIGH DANGER!]" : "[FOCUSED]");
            };

            _sanityManager.OnFateJudgement += (hero, isVirtue) =>
            {
                _audioManager.PlayDespairBell();
                _uiManager.combatLogText.text = isVirtue
                    ? $"🌟 VIRTUE ASCENDANT! {hero.heroName} awakens with {hero.afflictionOrVirtueName}!"
                    : $"💀 AFFLICTION TAKES ROOT! {hero.heroName} collapses into {hero.afflictionOrVirtueName}!";
            };
        }

        private void OnDiceSlotClicked(int slotIndex)
        {
            if (currentState != GameFlowState.PlayerHoldAndReroll) return;
            bool held = _combatManager.ToggleHold(slotIndex);
            Image btnImg = _diceSlotButtons[slotIndex].GetComponent<Image>();
            btnImg.color = held ? new Color(0.77f, 0.63f, 0.35f) : new Color(0.18f, 0.12f, 0.12f);
            _audioManager.PlayDiceRattle();
        }

        private void OnRerollButtonPressed()
        {
            if (currentState != GameFlowState.PlayerHoldAndReroll) return;
            if (_combatManager.PerformReroll())
            {
                _audioManager.PlayDiceRattle();
                UpdateDiceVisuals();
                _uiManager.rerollCounterText.text = $"🔄 REROLL ({_combatManager.remainingRerolls})";
            }
        }

        private void OnMainActionButtonPressed()
        {
            if (currentState == GameFlowState.TownLobby || currentState == GameFlowState.DungeonMapRoll)
            {
                StartCoroutine(EnterNextRoomRoutine());
            }
            else if (currentState == GameFlowState.PlayerHoldAndReroll)
            {
                StartCoroutine(ExecuteCombatRoundRoutine());
            }
        }

        private IEnumerator StartGameRoutine()
        {
            currentState = GameFlowState.TownLobby;
            _uiManager.combatLogText.text = "⚔️ The expedition awaits your command. Click ROLL to delve!";
            yield return null;
        }

        private IEnumerator EnterNextRoomRoutine()
        {
            currentState = GameFlowState.CombatStart;
            _rankManager.AdvanceToNextNode();
            var node = _rankManager.dungeonFloor[_rankManager.currentNodeIndex];
            _uiManager.dungeonRoomTitleText.text = $"{node.title}";
            _uiManager.combatLogText.text = $"Entered room: {node.description}";
            yield return new WaitForSeconds(0.6f);

            StartPlayerTurn();
        }

        private void StartPlayerTurn()
        {
            currentState = GameFlowState.PlayerHoldAndReroll;
            _combatManager.ResetTurnRerolls();
            _combatManager.RollAllSlots();
            _audioManager.PlayDiceRattle();
            UpdateDiceVisuals();

            _uiManager.rollButtonText.text = "⚔️ EXECUTE DICE COMBAT";
            _uiManager.rerollCounterText.text = $"🔄 REROLL ({_combatManager.remainingRerolls})";
            _uiManager.combatLogText.text = "🎲 Hold favorable dice, re-roll blunders, then strike!";
        }

        private void UpdateDiceVisuals()
        {
            for (int i = 0; i < _combatManager.activeDiceSlots.Count; i++)
            {
                var slot = _combatManager.activeDiceSlots[i];
                string stickerName = slot.activeSticker != null ? slot.activeSticker.skillName : "Hit";
                _diceSlotTexts[i].text = $"[{slot.diceType}]\n<b>{slot.rolledValue}</b>\n<size=12>{stickerName}</size>";
            }
        }

        private IEnumerator ExecuteCombatRoundRoutine()
        {
            currentState = GameFlowState.ActionCutIn;
            _uiManager.rollButton.interactable = false;

            // 1. Hero attacks
            for (int i = 0; i < _rankManager.heroes.Count; i++)
            {
                if (_rankManager.monsters.Count == 0) break;
                var hero = _rankManager.heroes[i];
                if (hero.currentHP <= 0) continue;

                var diceSlot = _combatManager.activeDiceSlots[i];
                var target = _rankManager.monsters[UnityEngine.Random.Range(0, _rankManager.monsters.Count)];

                bool isCrit = diceSlot.rolledValue >= (int)diceSlot.diceType - 1;
                int baseDamage = diceSlot.activeSticker != null ? diceSlot.activeSticker.baseValue : diceSlot.rolledValue * 3;
                float darkCritMult = _sanityManager.GetDarknessCritMultiplier();
                int totalDamage = Mathf.RoundToInt(baseDamage * (isCrit ? 2.5f * darkCritMult : 1.0f));

                target.currentHP -= totalDamage;
                _audioManager.PlayHeavySlash(isCrit);

                bool cutInDone = false;
                Sprite heroSp = _cutInEngine.GetSpriteForEntity(hero.id);
                Sprite monsterSp = _cutInEngine.GetSpriteForEntity(target.id);
                _cutInEngine.PlayDarkestCutIn(heroSp, monsterSp, totalDamage, isCrit, () => cutInDone = true);

                while (!cutInDone) yield return null;

                _uiManager.combatLogText.text = $"⚔️ {hero.name} lands {totalDamage} dmg on {target.name}!";
                yield return new WaitForSeconds(0.15f);

                if (target.currentHP <= 0)
                {
                    _rankManager.monsters.Remove(target);
                }
            }

            // 2. Darkness & Stress decay
            _sanityManager.ConsumeTorch(_sanityManager.torchDecayPerTurn);

            // 3. Check Monster Defeat
            if (_rankManager.monsters.Count == 0)
            {
                _uiManager.combatLogText.text = "🏆 VICTORY! The monsters have fallen back into the abyss!";
                yield return new WaitForSeconds(1.0f);
                _bmManager.ShowAdCrowLoot(15, 100, () => { });
                _uiManager.rollButtonText.text = "🎲 PROCEED TO NEXT ROOM";
                _uiManager.rollButton.interactable = true;
                currentState = GameFlowState.DungeonMapRoll;
                yield break;
            }

            // 4. Enemy Turn
            currentState = GameFlowState.EnemyTurn;
            _uiManager.combatLogText.text = "💀 The abominations retaliate!";
            yield return new WaitForSeconds(0.5f);

            foreach (var monster in _rankManager.monsters)
            {
                if (monster.currentHP <= 0) continue;
                var heroTarget = _rankManager.heroes[UnityEngine.Random.Range(0, _rankManager.heroes.Count)];
                float darkDmgMult = _sanityManager.GetDarknessMonsterDamageMultiplier();
                int monsterDamage = Mathf.RoundToInt(monster.attackPower * darkDmgMult);

                heroTarget.currentHP = Mathf.Max(0, heroTarget.currentHP - monsterDamage);
                _sanityManager.AddStress(new HeroSanityData { heroId = heroTarget.id, heroName = heroTarget.name, currentHP = heroTarget.currentHP, maxHP = heroTarget.maxHP }, monster.stressAttack);
                _audioManager.PlayHeavySlash(false);

                _uiManager.combatLogText.text = $"🩸 {monster.name} strikes {heroTarget.name} for {monsterDamage} dmg!";
                yield return new WaitForSeconds(0.4f);
            }

            RefreshHeroUI();

            _uiManager.rollButton.interactable = true;
            StartPlayerTurn();
        }

        private void RefreshHeroUI()
        {
            for (int i = 0; i < _rankManager.heroes.Count; i++)
            {
                var h = _rankManager.heroes[i];
                if (i < _heroHpTexts.Count)
                {
                    _heroHpTexts[i].text = $"HP: {h.currentHP}/{h.maxHP}";
                    _heroHpTexts[i].color = h.currentHP < 30 ? Color.red : Color.green;
                }
            }
        }
    }
}
