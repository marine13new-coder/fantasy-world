using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace AbyssRoll.UI
{
    public class CurioAndEventModalUI : MonoBehaviour
    {
        public static CurioAndEventModalUI Instance { get; private set; }

        public RectTransform modalRoot;
        public Text curioTitleText;
        public Text curioPromptText;
        public Button inspectButton;
        public Button leaveButton;

        private Action _onInspectCallback;
        private Action _onLeaveCallback;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void SetupModal(RectTransform parent)
        {
            GameObject modalGo = new GameObject("CurioEventModal", typeof(RectTransform), typeof(Image));
            modalGo.transform.SetParent(parent, false);
            modalRoot = modalGo.GetComponent<RectTransform>();
            modalRoot.anchorMin = new Vector2(0.1f, 0.25f);
            modalRoot.anchorMax = new Vector2(0.9f, 0.75f);
            modalRoot.offsetMin = modalRoot.offsetMax = Vector2.zero;

            Image bg = modalGo.GetComponent<Image>();
            bg.color = new Color(0.08f, 0.08f, 0.12f, 0.98f);

            // Title
            GameObject titleGo = new GameObject("Title", typeof(RectTransform), typeof(Text));
            titleGo.transform.SetParent(modalRoot, false);
            RectTransform tRt = titleGo.GetComponent<RectTransform>();
            tRt.anchorMin = new Vector2(0.05f, 0.75f);
            tRt.anchorMax = new Vector2(0.95f, 0.95f);
            tRt.offsetMin = tRt.offsetMax = Vector2.zero;
            curioTitleText = titleGo.GetComponent<Text>();
            curioTitleText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            curioTitleText.fontSize = 28;
            curioTitleText.color = new Color(0.77f, 0.63f, 0.35f);
            curioTitleText.alignment = TextAnchor.MiddleCenter;

            // Prompt
            GameObject promptGo = new GameObject("Prompt", typeof(RectTransform), typeof(Text));
            promptGo.transform.SetParent(modalRoot, false);
            RectTransform pRt = promptGo.GetComponent<RectTransform>();
            pRt.anchorMin = new Vector2(0.05f, 0.35f);
            pRt.anchorMax = new Vector2(0.95f, 0.70f);
            pRt.offsetMin = pRt.offsetMax = Vector2.zero;
            curioPromptText = promptGo.GetComponent<Text>();
            curioPromptText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            curioPromptText.fontSize = 20;
            curioPromptText.color = new Color(0.88f, 0.86f, 0.78f);
            curioPromptText.alignment = TextAnchor.MiddleCenter;

            // Inspect Button
            GameObject btnInspectGo = new GameObject("Btn_Inspect", typeof(RectTransform), typeof(Image), typeof(Button));
            btnInspectGo.transform.SetParent(modalRoot, false);
            RectTransform biRt = btnInspectGo.GetComponent<RectTransform>();
            biRt.anchorMin = new Vector2(0.08f, 0.08f);
            biRt.anchorMax = new Vector2(0.48f, 0.28f);
            biRt.offsetMin = biRt.offsetMax = Vector2.zero;
            btnInspectGo.GetComponent<Image>().color = new Color(0.55f, 0.0f, 0.0f);
            inspectButton = btnInspectGo.GetComponent<Button>();
            CreateButtonLabel(btnInspectGo.transform, "🩸 TOUCH / TOUCH");

            // Leave Button
            GameObject btnLeaveGo = new GameObject("Btn_Leave", typeof(RectTransform), typeof(Image), typeof(Button));
            btnLeaveGo.transform.SetParent(modalRoot, false);
            RectTransform blRt = btnLeaveGo.GetComponent<RectTransform>();
            blRt.anchorMin = new Vector2(0.52f, 0.08f);
            blRt.anchorMax = new Vector2(0.92f, 0.28f);
            blRt.offsetMin = blRt.offsetMax = Vector2.zero;
            btnLeaveGo.GetComponent<Image>().color = new Color(0.2f, 0.2f, 0.25f);
            leaveButton = btnLeaveGo.GetComponent<Button>();
            CreateButtonLabel(btnLeaveGo.transform, "🚶 LEAVE BEHIND");

            inspectButton.onClick.AddListener(() =>
            {
                modalRoot.gameObject.SetActive(false);
                _onInspectCallback?.Invoke();
            });

            leaveButton.onClick.AddListener(() =>
            {
                modalRoot.gameObject.SetActive(false);
                _onLeaveCallback?.Invoke();
            });

            modalRoot.gameObject.SetActive(false);
        }

        private void CreateButtonLabel(Transform parent, string text)
        {
            GameObject txtGo = new GameObject("Label", typeof(RectTransform), typeof(Text));
            txtGo.transform.SetParent(parent, false);
            RectTransform rt = txtGo.GetComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = rt.offsetMax = Vector2.zero;
            Text txt = txtGo.GetComponent<Text>();
            txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            txt.fontSize = 20;
            txt.color = Color.white;
            txt.alignment = TextAnchor.MiddleCenter;
            txt.text = text;
        }

        public void ShowCurioModal(string title, string prompt, Action onInspect, Action onLeave)
        {
            _onInspectCallback = onInspect;
            _onLeaveCallback = onLeave;
            curioTitleText.text = title;
            curioPromptText.text = prompt;
            modalRoot.gameObject.SetActive(true);
        }
    }
}
