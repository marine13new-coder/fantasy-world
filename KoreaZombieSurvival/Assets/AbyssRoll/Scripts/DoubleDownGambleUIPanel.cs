using System;
using UnityEngine;
using UnityEngine.UI;

namespace AbyssRoll.UI
{
    public class DoubleDownGambleUIPanel : MonoBehaviour
    {
        public static DoubleDownGambleUIPanel Instance { get; private set; }

        public RectTransform panelRoot;
        public Text currentMultiplierText; // "2X", "4X", "8X", "16X"
        public Text accumulatedPotText;     // "누적 화력: 450"
        public Text dangerWarningText;      // "⚠️ 파멸 위험: 1, 2, 3 나오면 전액 증발!"
        public Button doubleDownButton;     // "🔥 묻고 더블로 던지기!"
        public Button cashOutButton;        // "💰 여기서 멈추고 확정 타격!"

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void SetupGambleUI(RectTransform parent)
        {
            GameObject go = new GameObject("DoubleDownGamblePanel", typeof(RectTransform), typeof(Image));
            go.transform.SetParent(parent, false);
            panelRoot = go.GetComponent<RectTransform>();
            panelRoot.anchorMin = new Vector2(0.04f, 0.32f);
            panelRoot.anchorMax = new Vector2(0.96f, 0.48f);
            panelRoot.offsetMin = panelRoot.offsetMax = Vector2.zero;

            Image bg = go.GetComponent<Image>();
            bg.color = new Color(0.12f, 0.04f, 0.04f, 0.95f); // 핏빛 카지노 테마

            // Multiplier Badge
            GameObject multGo = new GameObject("MultiplierText", typeof(RectTransform), typeof(Text));
            multGo.transform.SetParent(panelRoot, false);
            RectTransform mRt = multGo.GetComponent<RectTransform>();
            mRt.anchorMin = new Vector2(0.05f, 0.55f);
            mRt.anchorMax = new Vector2(0.35f, 0.95f);
            mRt.offsetMin = mRt.offsetMax = Vector2.zero;
            currentMultiplierText = multGo.GetComponent<Text>();
            currentMultiplierText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            currentMultiplierText.fontSize = 34;
            currentMultiplierText.color = new Color(1f, 0.85f, 0.1f); // 황금색
            currentMultiplierText.alignment = TextAnchor.MiddleCenter;
            currentMultiplierText.text = "🎰 1X";

            // Pot Text
            GameObject potGo = new GameObject("PotText", typeof(RectTransform), typeof(Text));
            potGo.transform.SetParent(panelRoot, false);
            RectTransform pRt = potGo.GetComponent<RectTransform>();
            pRt.anchorMin = new Vector2(0.38f, 0.55f);
            pRt.anchorMax = new Vector2(0.95f, 0.95f);
            pRt.offsetMin = pRt.offsetMax = Vector2.zero;
            accumulatedPotText = potGo.GetComponent<Text>();
            accumulatedPotText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            accumulatedPotText.fontSize = 24;
            accumulatedPotText.color = Color.white;
            accumulatedPotText.alignment = TextAnchor.MiddleLeft;
            accumulatedPotText.text = "누적 데미지: 0 POT";

            // Danger Warning Text
            GameObject warnGo = new GameObject("DangerText", typeof(RectTransform), typeof(Text));
            warnGo.transform.SetParent(panelRoot, false);
            RectTransform wRt = warnGo.GetComponent<RectTransform>();
            wRt.anchorMin = new Vector2(0.05f, 0.38f);
            wRt.anchorMax = new Vector2(0.95f, 0.55f);
            wRt.offsetMin = wRt.offsetMax = Vector2.zero;
            dangerWarningText = warnGo.GetComponent<Text>();
            dangerWarningText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            dangerWarningText.fontSize = 17;
            dangerWarningText.color = new Color(1f, 0.3f, 0.3f);
            dangerWarningText.alignment = TextAnchor.MiddleCenter;
            dangerWarningText.text = "⚠️ [1] 나오면 자멸! 탐욕의 대가를 치릅니다.";

            // Double Down Button
            doubleDownButton = CreateActionButton(panelRoot, "Btn_DoubleDown", new Vector2(0.05f, 0.05f), new Vector2(0.50f, 0.35f), "🔥 묻고 더블로! (Roll)", new Color(0.75f, 0.05f, 0.05f));

            // Cash Out Button
            cashOutButton = CreateActionButton(panelRoot, "Btn_CashOut", new Vector2(0.54f, 0.05f), new Vector2(0.95f, 0.35f), "💰 멈추고 타격 (Bank)", new Color(0.15f, 0.55f, 0.2f));

            panelRoot.gameObject.SetActive(false);
        }

        private Button CreateActionButton(RectTransform parent, string name, Vector2 anchorMin, Vector2 anchorMax, string label, Color color)
        {
            GameObject btnGo = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(Button));
            btnGo.transform.SetParent(parent, false);
            RectTransform rt = btnGo.GetComponent<RectTransform>();
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = rt.offsetMax = Vector2.zero;

            Image img = btnGo.GetComponent<Image>();
            img.color = color;

            GameObject textGo = new GameObject("Text", typeof(RectTransform), typeof(Text));
            textGo.transform.SetParent(btnGo.transform, false);
            RectTransform tRt = textGo.GetComponent<RectTransform>();
            tRt.anchorMin = Vector2.zero;
            tRt.anchorMax = Vector2.one;
            tRt.offsetMin = tRt.offsetMax = Vector2.zero;

            Text txt = textGo.GetComponent<Text>();
            txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            txt.fontSize = 20;
            txt.color = Color.white;
            txt.alignment = TextAnchor.MiddleCenter;
            txt.text = label;

            return btnGo.GetComponent<Button>();
        }

        public void DisplayGambleState(RiskEngine.PushYourLuckTier tier, int pot, int bustThreshold)
        {
            panelRoot.gameObject.SetActive(true);
            currentMultiplierText.text = $"🎰 {(int)tier}X";
            accumulatedPotText.text = $"누적 POT: <b>{pot}</b> 화력!";
            dangerWarningText.text = $"⚠️ [1 ~ {bustThreshold}] 나오면 BUST(전액 자멸 폭발)!";
        }

        public void Hide()
        {
            panelRoot.gameObject.SetActive(false);
        }
    }
}
