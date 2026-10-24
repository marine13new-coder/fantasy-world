using System;
using UnityEngine;
using UnityEngine.UI;

namespace AbyssRoll.UI
{
    public class VerticalDungeonUIManager : MonoBehaviour
    {
        public static VerticalDungeonUIManager Instance { get; private set; }

        [Header("Containers")]
        public RectTransform safeAreaRoot;
        public RectTransform topBattlePanel;      // 35%
        public RectTransform middleDiceBoardPanel; // 35%
        public RectTransform bottomActionPanel;   // 30%

        [Header("Top Battle Sub-Elements")]
        public RectTransform heroRankContainer;
        public RectTransform monsterRankContainer;
        public Text dungeonRoomTitleText;
        public Text torchPercentText;
        public Slider torchSlider;

        [Header("Middle Dice & Sanity Sub-Elements")]
        public RectTransform heroStatusCardsContainer;
        public RectTransform diceSlotsContainer;
        public Text combatLogText;

        [Header("Bottom Action Sub-Elements")]
        public Button rollButton;
        public Button rerollButton;
        public Button lightTorchButton;
        public Button inspectPartyButton;
        public Text rollButtonText;
        public Text rerollCounterText;

        private Rect _lastSafeArea = new Rect(0, 0, 0, 0);

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void SetupHierarchy(Canvas canvas)
        {
            CanvasScaler scaler = canvas.GetComponent<CanvasScaler>();
            if (scaler == null) scaler = canvas.gameObject.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080, 1920);
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            scaler.matchWidthOrHeight = 0.5f;

            // 1. Safe Area Root
            GameObject safeAreaGo = new GameObject("SafeAreaRoot", typeof(RectTransform));
            safeAreaGo.transform.SetParent(canvas.transform, false);
            safeAreaRoot = safeAreaGo.GetComponent<RectTransform>();
            ApplySafeArea();

            // 2. Top Panel (35% height: Y 0.65 to 1.0)
            topBattlePanel = CreatePanel(safeAreaRoot, "TopBattlePanel_35%", new Vector2(0f, 0.65f), new Vector2(1f, 1.0f), new Color(0.04f, 0.04f, 0.06f, 0.95f));

            // 3. Middle Panel (35% height: Y 0.30 to 0.65)
            middleDiceBoardPanel = CreatePanel(safeAreaRoot, "MiddleDiceBoard_35%", new Vector2(0f, 0.30f), new Vector2(1f, 0.65f), new Color(0.06f, 0.06f, 0.08f, 0.98f));

            // 4. Bottom Panel (30% height: Y 0.0 to 0.30)
            bottomActionPanel = CreatePanel(safeAreaRoot, "BottomActionPanel_30%", new Vector2(0f, 0.0f), new Vector2(1f, 0.30f), new Color(0.03f, 0.03f, 0.04f, 1.0f));

            BuildTopElements();
            BuildMiddleElements();
            BuildBottomElements();
        }

        private void Update()
        {
            if (Screen.safeArea != _lastSafeArea)
            {
                ApplySafeArea();
            }
        }

        private void ApplySafeArea()
        {
            if (safeAreaRoot == null) return;
            _lastSafeArea = Screen.safeArea;

            Vector2 anchorMin = _lastSafeArea.position;
            Vector2 anchorMax = _lastSafeArea.position + _lastSafeArea.size;

            anchorMin.x /= Screen.width;
            anchorMin.y /= Screen.height;
            anchorMax.x /= Screen.width;
            anchorMax.y /= Screen.height;

            safeAreaRoot.anchorMin = anchorMin;
            safeAreaRoot.anchorMax = anchorMax;
            safeAreaRoot.offsetMin = Vector2.zero;
            safeAreaRoot.offsetMax = Vector2.zero;
        }

        private RectTransform CreatePanel(RectTransform parent, string name, Vector2 anchorMin, Vector2 anchorMax, Color bgColor)
        {
            GameObject panelGo = new GameObject(name, typeof(RectTransform), typeof(Image));
            panelGo.transform.SetParent(parent, false);
            RectTransform rt = panelGo.GetComponent<RectTransform>();
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            Image img = panelGo.GetComponent<Image>();
            img.color = bgColor;
            return rt;
        }

        private void BuildTopElements()
        {
            // Dungeon Room Title Banner
            GameObject titleGo = new GameObject("RoomTitle", typeof(RectTransform), typeof(Text));
            titleGo.transform.SetParent(topBattlePanel, false);
            RectTransform titleRt = titleGo.GetComponent<RectTransform>();
            titleRt.anchorMin = new Vector2(0.05f, 0.88f);
            titleRt.anchorMax = new Vector2(0.95f, 0.98f);
            titleRt.offsetMin = titleRt.offsetMax = Vector2.zero;
            dungeonRoomTitleText = titleGo.GetComponent<Text>();
            dungeonRoomTitleText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            dungeonRoomTitleText.fontSize = 32;
            dungeonRoomTitleText.color = new Color(0.77f, 0.63f, 0.35f); // Antique brass
            dungeonRoomTitleText.alignment = TextAnchor.MiddleCenter;
            dungeonRoomTitleText.text = "ABYSS DEPTHS - ROOM I (CRYPT OF SKELETONS)";

            // Torch Status Display
            GameObject torchGo = new GameObject("TorchLabel", typeof(RectTransform), typeof(Text));
            torchGo.transform.SetParent(topBattlePanel, false);
            RectTransform torchRt = torchGo.GetComponent<RectTransform>();
            torchRt.anchorMin = new Vector2(0.05f, 0.78f);
            torchRt.anchorMax = new Vector2(0.95f, 0.86f);
            torchRt.offsetMin = torchRt.offsetMax = Vector2.zero;
            torchPercentText = torchGo.GetComponent<Text>();
            torchPercentText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            torchPercentText.fontSize = 24;
            torchPercentText.color = new Color(0.95f, 0.6f, 0.1f);
            torchPercentText.alignment = TextAnchor.MiddleCenter;
            torchPercentText.text = "🔥 TORCHLIGHT: 100% [SAFE PASSAGE]";

            // Hero Rank Container (Left side)
            GameObject heroContainerGo = new GameObject("HeroRankContainer", typeof(RectTransform));
            heroContainerGo.transform.SetParent(topBattlePanel, false);
            heroRankContainer = heroContainerGo.GetComponent<RectTransform>();
            heroRankContainer.anchorMin = new Vector2(0.02f, 0.05f);
            heroRankContainer.anchorMax = new Vector2(0.48f, 0.75f);
            heroRankContainer.offsetMin = heroRankContainer.offsetMax = Vector2.zero;

            // Monster Rank Container (Right side)
            GameObject monsterContainerGo = new GameObject("MonsterRankContainer", typeof(RectTransform));
            monsterContainerGo.transform.SetParent(topBattlePanel, false);
            monsterRankContainer = monsterContainerGo.GetComponent<RectTransform>();
            monsterRankContainer.anchorMin = new Vector2(0.52f, 0.05f);
            monsterRankContainer.anchorMax = new Vector2(0.98f, 0.75f);
            monsterRankContainer.offsetMin = monsterRankContainer.offsetMax = Vector2.zero;
        }

        private void BuildMiddleElements()
        {
            // Hero Status Cards Container (Top half of middle: HP + Stress)
            GameObject cardsGo = new GameObject("HeroStatusCards", typeof(RectTransform));
            cardsGo.transform.SetParent(middleDiceBoardPanel, false);
            heroStatusCardsContainer = cardsGo.GetComponent<RectTransform>();
            heroStatusCardsContainer.anchorMin = new Vector2(0.02f, 0.52f);
            heroStatusCardsContainer.anchorMax = new Vector2(0.98f, 0.98f);
            heroStatusCardsContainer.offsetMin = heroStatusCardsContainer.offsetMax = Vector2.zero;

            // Dice Slots Container (Bottom half of middle)
            GameObject diceGo = new GameObject("DiceSlotsContainer", typeof(RectTransform));
            diceGo.transform.SetParent(middleDiceBoardPanel, false);
            diceSlotsContainer = diceGo.GetComponent<RectTransform>();
            diceSlotsContainer.anchorMin = new Vector2(0.02f, 0.18f);
            diceSlotsContainer.anchorMax = new Vector2(0.98f, 0.50f);
            diceSlotsContainer.offsetMin = diceSlotsContainer.offsetMax = Vector2.zero;

            // Combat Log Text
            GameObject logGo = new GameObject("CombatLogText", typeof(RectTransform), typeof(Text));
            logGo.transform.SetParent(middleDiceBoardPanel, false);
            RectTransform logRt = logGo.GetComponent<RectTransform>();
            logRt.anchorMin = new Vector2(0.02f, 0.02f);
            logRt.anchorMax = new Vector2(0.98f, 0.16f);
            logRt.offsetMin = logRt.offsetMax = Vector2.zero;
            combatLogText = logGo.GetComponent<Text>();
            combatLogText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            combatLogText.fontSize = 20;
            combatLogText.color = new Color(0.88f, 0.86f, 0.78f);
            combatLogText.alignment = TextAnchor.MiddleLeft;
            combatLogText.text = "⚔️ The descent begins. Darkness whispers in the crypt...";
        }

        private void BuildBottomElements()
        {
            // 1. Roll / Strike Big Gothic Button
            rollButton = CreateGothicButton(bottomActionPanel, "Btn_Roll", new Vector2(0.05f, 0.52f), new Vector2(0.95f, 0.92f), "🎲 ROLL THE FATE DICE", new Color(0.55f, 0.0f, 0.0f));
            rollButtonText = rollButton.GetComponentInChildren<Text>();

            // 2. Reroll Button
            rerollButton = CreateGothicButton(bottomActionPanel, "Btn_Reroll", new Vector2(0.05f, 0.10f), new Vector2(0.33f, 0.45f), "🔄 REROLL (2)", new Color(0.18f, 0.22f, 0.32f));
            rerollCounterText = rerollButton.GetComponentInChildren<Text>();

            // 3. Torch Button
            lightTorchButton = CreateGothicButton(bottomActionPanel, "Btn_Torch", new Vector2(0.36f, 0.10f), new Vector2(0.64f, 0.45f), "🔥 LIGHT TORCH", new Color(0.6f, 0.35f, 0.05f));

            // 4. Tactics / Party Order Button
            inspectPartyButton = CreateGothicButton(bottomActionPanel, "Btn_Party", new Vector2(0.67f, 0.10f), new Vector2(0.95f, 0.45f), "🛡️ TACTICS", new Color(0.2f, 0.2f, 0.24f));
        }

        private Button CreateGothicButton(RectTransform parent, string name, Vector2 anchorMin, Vector2 anchorMax, string label, Color bgColor)
        {
            GameObject btnGo = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(Button));
            btnGo.transform.SetParent(parent, false);
            RectTransform rt = btnGo.GetComponent<RectTransform>();
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = rt.offsetMax = Vector2.zero;

            Image img = btnGo.GetComponent<Image>();
            img.color = bgColor;

            GameObject textGo = new GameObject("Text", typeof(RectTransform), typeof(Text));
            textGo.transform.SetParent(btnGo.transform, false);
            RectTransform textRt = textGo.GetComponent<RectTransform>();
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.offsetMin = textRt.offsetMax = Vector2.zero;

            Text txt = textGo.GetComponent<Text>();
            txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            txt.fontSize = 26;
            txt.color = Color.white;
            txt.alignment = TextAnchor.MiddleCenter;
            txt.text = label;

            return btnGo.GetComponent<Button>();
        }
    }
}
