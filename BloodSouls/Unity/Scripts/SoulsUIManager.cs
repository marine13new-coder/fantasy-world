using System.Collections;
using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// 소울본 정통 HUD 및 배너 UI 매니저
/// - 체력바 (HP 레드) 및 리게인 잠재력 (Rally 오렌지)
/// - 스태미너바 (SP 에메랄드 그린)
/// - 4슬롯 D-패드 장비창 (주무기, 단총, 수혈액, 비전)
/// - 보스 체력 게이지
/// - YOU DIED / BONFIRE LIT / PREY SLAUGHTERED 풀스크린 배너
/// </summary>
public class SoulsUIManager : MonoBehaviour
{
    private Canvas canvas;
    private RectTransform hpBarFill;
    private RectTransform rallyBarFill;
    private RectTransform staminaBarFill;

    private Text hpText;
    private Text staminaText;
    private Text echoesText;

    private GameObject bossBarPanel;
    private RectTransform bossBarFill;
    private Text bossTitleText;
    private Text bossSubtitleText;

    private GameObject bannerPanel;
    private Text bannerTitle;
    private Text bannerSub;
    private Image flashImage;

    private SoulsCombatSystem playerCombat;

    private void Awake()
    {
        CreateProceduralHUD();
    }

    private void Start()
    {
        GameObject p = GameObject.FindWithTag("Player");
        if (p != null) playerCombat = p.GetComponent<SoulsCombatSystem>();
    }

    private void Update()
    {
        if (playerCombat == null) return;

        // HP & Rally 업데이트
        float hpPct = Mathf.Clamp01(playerCombat.currentHp / playerCombat.maxHp);
        float rallyPct = Mathf.Clamp01(playerCombat.rallyHp / playerCombat.maxHp);
        float spPct = Mathf.Clamp01(playerCombat.currentStamina / playerCombat.maxStamina);

        if (hpBarFill != null) hpBarFill.anchorMax = new Vector2(hpPct, 1f);
        if (rallyBarFill != null) rallyBarFill.anchorMax = new Vector2(rallyPct, 1f);
        if (staminaBarFill != null) staminaBarFill.anchorMax = new Vector2(spPct, 1f);

        if (hpText != null) hpText.text = $"HP {(int)playerCombat.currentHp} / {(int)playerCombat.maxHp}";
        if (staminaText != null) staminaText.text = $"SP {(int)playerCombat.currentStamina} / {(int)playerCombat.maxStamina}";
    }

    private void CreateProceduralHUD()
    {
        GameObject canvasObj = new GameObject("SoulsHUDCanvas");
        canvas = canvasObj.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvasObj.AddComponent<CanvasScaler>();
        canvasObj.AddComponent<GraphicRaycaster>();

        // 1. 화면 플래시 이미지 (Flash Image)
        GameObject flashObj = new GameObject("FlashOverlay");
        flashObj.transform.SetParent(canvasObj.transform, false);
        flashImage = flashObj.AddComponent<Image>();
        flashImage.color = Color.clear;
        RectTransform flashRt = flashObj.GetComponent<RectTransform>();
        flashRt.anchorMin = Vector2.zero;
        flashRt.anchorMax = Vector2.one;

        // 2. 좌상단 바이탈 패널 (HP / Rally / Stamina)
        GameObject vitalsObj = new GameObject("VitalsPanel");
        vitalsObj.transform.SetParent(canvasObj.transform, false);
        RectTransform vRt = vitalsObj.AddComponent<RectTransform>();
        vRt.anchorMin = new Vector2(0, 1);
        vRt.anchorMax = new Vector2(0, 1);
        vRt.pivot = new Vector2(0, 1);
        vRt.anchoredPosition = new Vector2(35, -35);
        vRt.sizeDelta = new Vector2(360, 60);

        // HP 프레임
        GameObject hpFrame = CreateUIBox("HP_Frame", vitalsObj.transform, new Vector2(0, 0), new Vector2(340, 18), new Color(0.08f, 0.05f, 0.09f, 0.9f));
        // Rally 바
        GameObject rObj = CreateUIBox("Rally_Bar", hpFrame.transform, Vector2.zero, Vector2.zero, new Color(0.85f, 0.45f, 0.08f));
        rallyBarFill = rObj.GetComponent<RectTransform>();
        rallyBarFill.anchorMin = Vector2.zero;
        rallyBarFill.anchorMax = Vector2.one;
        // HP 실제 바
        GameObject hpObj = CreateUIBox("HP_Bar", hpFrame.transform, Vector2.zero, Vector2.zero, new Color(0.85f, 0.12f, 0.15f));
        hpBarFill = hpObj.GetComponent<RectTransform>();
        hpBarFill.anchorMin = Vector2.zero;
        hpBarFill.anchorMax = Vector2.one;

        // HP 텍스트
        hpText = CreateUIText("HPText", hpFrame.transform, "HP 650 / 650", 11, TextAnchor.MiddleRight, Color.white);
        hpText.GetComponent<RectTransform>().anchoredPosition = new Vector2(-8, 0);

        // 스태미너 프레임
        GameObject spFrame = CreateUIBox("SP_Frame", vitalsObj.transform, new Vector2(0, -25), new Vector2(280, 12), new Color(0.08f, 0.05f, 0.09f, 0.9f));
        GameObject spObj = CreateUIBox("SP_Bar", spFrame.transform, Vector2.zero, Vector2.zero, new Color(0.06f, 0.72f, 0.5f));
        staminaBarFill = spObj.GetComponent<RectTransform>();
        staminaBarFill.anchorMin = Vector2.zero;
        staminaBarFill.anchorMax = Vector2.one;

        // 3. 우하단 피의 유지 (Blood Echoes)
        GameObject echoesObj = CreateUIBox("EchoesPanel", canvasObj.transform, new Vector2(-40, 40), new Vector2(200, 45), new Color(0.08f, 0.06f, 0.1f, 0.85f));
        RectTransform eRt = echoesObj.GetComponent<RectTransform>();
        eRt.anchorMin = Vector2.one;
        eRt.anchorMax = Vector2.one;
        eRt.pivot = Vector2.one;
        echoesText = CreateUIText("EchoesText", echoesObj.transform, "🩸 4,280", 20, TextAnchor.MiddleCenter, new Color(1.0f, 0.85f, 0.3f));

        // 4. 하단 보스 체력바
        bossBarPanel = CreateUIBox("BossHUD", canvasObj.transform, new Vector2(0, 50), new Vector2(720, 36), new Color(0.05f, 0.04f, 0.06f, 0.92f));
        RectTransform bRt = bossBarPanel.GetComponent<RectTransform>();
        bRt.anchorMin = new Vector2(0.5f, 0);
        bRt.anchorMax = new Vector2(0.5f, 0);
        bRt.pivot = new Vector2(0.5f, 0);

        bossTitleText = CreateUIText("BossTitle", bossBarPanel.transform, "심연의 기사 말라코르 (Lord Malakor)", 15, TextAnchor.MiddleCenter, Color.white);
        bossTitleText.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, 26);

        GameObject bBar = CreateUIBox("BossBarFill", bossBarPanel.transform, Vector2.zero, Vector2.zero, new Color(0.85f, 0.08f, 0.2f));
        bossBarFill = bBar.GetComponent<RectTransform>();
        bossBarFill.anchorMin = Vector2.zero;
        bossBarFill.anchorMax = Vector2.one;

        bossSubtitleText = CreateUIText("BossSubtitle", bossBarPanel.transform, "PHASE 1 : THE CORRUPTED SWORDSMAN", 10, TextAnchor.MiddleCenter, new Color(1.0f, 0.6f, 0.7f));
        bossSubtitleText.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, -18);
        bossBarPanel.SetActive(false);

        // 5. 풀스크린 배너 (YOU DIED 등)
        bannerPanel = CreateUIBox("BannerScreen", canvasObj.transform, Vector2.zero, Vector2.zero, new Color(0, 0, 0, 0.85f));
        RectTransform bnRt = bannerPanel.GetComponent<RectTransform>();
        bnRt.anchorMin = Vector2.zero;
        bnRt.anchorMax = Vector2.one;

        bannerTitle = CreateUIText("BannerTitle", bannerPanel.transform, "YOU DIED", 54, TextAnchor.MiddleCenter, Color.red);
        bannerTitle.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, 20);

        bannerSub = CreateUIText("BannerSub", bannerPanel.transform, "사냥꾼이 심연으로 쓰러졌습니다", 16, TextAnchor.MiddleCenter, Color.gray);
        bannerSub.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, -35);
        bannerPanel.SetActive(false);
    }

    public void UpdateBossHealth(float current, float max)
    {
        if (bossBarPanel != null)
        {
            bossBarPanel.SetActive(true);
            if (bossBarFill != null)
            {
                bossBarFill.anchorMax = new Vector2(Mathf.Clamp01(current / max), 1f);
            }
        }
    }

    public void UpdateBossSubtitle(string subtitle)
    {
        if (bossSubtitleText != null) bossSubtitleText.text = subtitle;
    }

    public void UpdateEchoes(int echoes)
    {
        if (echoesText != null) echoesText.text = "🩸 " + echoes.ToString("N0");
    }

    public void UpdateQuickslots(string weapon, bool isTricked, int bullets, int vials)
    {
        // 퀵슬롯 업데이트
    }

    public void FlashScreen(Color color, float duration)
    {
        StartCoroutine(FlashRoutine(color, duration));
    }

    private IEnumerator FlashRoutine(Color color, float duration)
    {
        if (flashImage == null) yield break;
        flashImage.color = color;
        float elapsed = 0f;
        while (elapsed < duration)
        {
            flashImage.color = Color.Lerp(color, Color.clear, elapsed / duration);
            elapsed += Time.deltaTime;
            yield return null;
        }
        flashImage.color = Color.clear;
    }

    public void ShowBanner(string title, string subtitle, Color color)
    {
        StartCoroutine(BannerRoutine(title, subtitle, color));
    }

    private IEnumerator BannerRoutine(string title, string subtitle, Color color)
    {
        if (bannerPanel == null) yield break;
        bannerPanel.SetActive(true);
        if (bannerTitle != null)
        {
            bannerTitle.text = title;
            bannerTitle.color = color;
        }
        if (bannerSub != null) bannerSub.text = subtitle;

        yield return new WaitForSeconds(3.5f);
        bannerPanel.SetActive(false);
    }

    public void ShowFloatingText(string text, Vector3 worldPos, Color color)
    {
        GameObject txtObj = new GameObject("FloatingText");
        txtObj.transform.SetParent(canvas.transform, false);
        Text t = txtObj.AddComponent<Text>();
        t.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        t.text = text;
        t.fontSize = 24;
        t.fontStyle = FontStyle.Bold;
        t.alignment = TextAnchor.MiddleCenter;
        t.color = color;

        Vector3 screenPos = Camera.main != null ? Camera.main.WorldToScreenPoint(worldPos) : new Vector3(Screen.width / 2, Screen.height / 2, 0);
        txtObj.GetComponent<RectTransform>().position = screenPos;
        StartCoroutine(FloatAndDestroyRoutine(txtObj));
    }

    private IEnumerator FloatAndDestroyRoutine(GameObject obj)
    {
        RectTransform rt = obj.GetComponent<RectTransform>();
        float elapsed = 0f;
        while (elapsed < 0.8f)
        {
            rt.position += Vector3.up * 60f * Time.deltaTime;
            elapsed += Time.deltaTime;
            yield return null;
        }
        Destroy(obj);
    }

    private GameObject CreateUIBox(string name, Transform parent, Vector2 pos, Vector2 size, Color color)
    {
        GameObject obj = new GameObject(name);
        obj.transform.SetParent(parent, false);
        Image img = obj.AddComponent<Image>();
        img.color = color;
        RectTransform rt = obj.GetComponent<RectTransform>();
        rt.anchoredPosition = pos;
        rt.sizeDelta = size;
        return obj;
    }

    private Text CreateUIText(string name, Transform parent, string content, int fontSize, TextAnchor alignment, Color color)
    {
        GameObject obj = new GameObject(name);
        obj.transform.SetParent(parent, false);
        Text txt = obj.AddComponent<Text>();
        txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        txt.text = content;
        txt.fontSize = fontSize;
        txt.alignment = alignment;
        txt.color = color;
        RectTransform rt = obj.GetComponent<RectTransform>();
        rt.sizeDelta = new Vector2(300, 30);
        return txt;
    }
}
