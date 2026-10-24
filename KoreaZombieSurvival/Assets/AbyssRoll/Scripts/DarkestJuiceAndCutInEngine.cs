using System;
using System.Collections;
using System.IO;
using UnityEngine;
using UnityEngine.UI;

namespace AbyssRoll.Presentation
{
    public class DarkestJuiceAndCutInEngine : MonoBehaviour
    {
        public static DarkestJuiceAndCutInEngine Instance { get; private set; }

        [Header("Hot-Swap Sprite & Audio Slots")]
        public Sprite hunterSprite;
        public Sprite wraithSprite;
        public Sprite berserkerSprite;
        public Sprite blackknightSprite;
        public Sprite boneShamanSprite;
        public Sprite boss1Sprite;
        public Sprite ghoulSprite;
        public Sprite gravekeeperSprite;

        [Header("Cut-In Stage Overlay")]
        public Image cutInDimmer;
        public RectTransform cutInHeroTransform;
        public Image cutInHeroImage;
        public RectTransform cutInTargetTransform;
        public Image cutInTargetImage;
        public Text cutInDamageText;
        public RectTransform slashTrailEffect;

        [Header("Juice Parameters")]
        public float hitStopDuration = 0.07f;
        public float screenShakeIntensity = 18f;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            TryAutoLoadHotSwapSprites();
        }

        public void SetupCutInOverlay(Transform parent)
        {
            GameObject overlayGo = new GameObject("DarkestCutInOverlay", typeof(RectTransform), typeof(Image));
            overlayGo.transform.SetParent(parent, false);
            RectTransform rt = overlayGo.GetComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = rt.offsetMax = Vector2.zero;

            cutInDimmer = overlayGo.GetComponent<Image>();
            cutInDimmer.color = new Color(0, 0, 0, 0); // Transparent initially
            cutInDimmer.raycastTarget = false;

            // Hero cutin container
            GameObject heroGo = new GameObject("CutInHero", typeof(RectTransform), typeof(Image));
            heroGo.transform.SetParent(overlayGo.transform, false);
            cutInHeroTransform = heroGo.GetComponent<RectTransform>();
            cutInHeroTransform.sizeDelta = new Vector2(360, 480);
            cutInHeroTransform.anchoredPosition = new Vector2(-600, 0);
            cutInHeroImage = heroGo.GetComponent<Image>();

            // Target cutin container
            GameObject targetGo = new GameObject("CutInTarget", typeof(RectTransform), typeof(Image));
            targetGo.transform.SetParent(overlayGo.transform, false);
            cutInTargetTransform = targetGo.GetComponent<RectTransform>();
            cutInTargetTransform.sizeDelta = new Vector2(360, 480);
            cutInTargetTransform.anchoredPosition = new Vector2(600, 0);
            cutInTargetImage = targetGo.GetComponent<Image>();

            // Damage / Critical text popup
            GameObject dmgGo = new GameObject("CutInDamageText", typeof(RectTransform), typeof(Text));
            dmgGo.transform.SetParent(overlayGo.transform, false);
            RectTransform dmgRt = dmgGo.GetComponent<RectTransform>();
            dmgRt.anchoredPosition = new Vector2(0, 150);
            dmgRt.sizeDelta = new Vector2(600, 120);
            cutInDamageText = dmgGo.GetComponent<Text>();
            cutInDamageText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            cutInDamageText.fontSize = 64;
            cutInDamageText.alignment = TextAnchor.MiddleCenter;
            cutInDamageText.color = Color.clear;

            // Slash Trail Effect
            GameObject slashGo = new GameObject("SlashTrail", typeof(RectTransform), typeof(Image));
            slashGo.transform.SetParent(overlayGo.transform, false);
            slashTrailEffect = slashGo.GetComponent<RectTransform>();
            slashTrailEffect.sizeDelta = new Vector2(800, 20);
            slashTrailEffect.localRotation = Quaternion.Euler(0, 0, -35);
            Image slashImg = slashGo.GetComponent<Image>();
            slashImg.color = Color.clear;
        }

        public void TryAutoLoadHotSwapSprites()
        {
            Color chromaGreen = new Color(0f, 1f, 0f, 1f);
            string projectRoot = Application.dataPath;

            // Check potential asset locations
            string[] searchPaths = {
                Path.Combine(projectRoot, "Sprites"),
                Path.Combine(projectRoot, "Game/Art"),
                Path.Combine(projectRoot, "../")
            };

            hunterSprite = LoadOrProcedural("hunter", hunterSprite, chromaGreen, searchPaths);
            wraithSprite = LoadOrProcedural("wraith", wraithSprite, chromaGreen, searchPaths);
            berserkerSprite = LoadOrProcedural("berserker", berserkerSprite, chromaGreen, searchPaths);
            blackknightSprite = LoadOrProcedural("blackknight", blackknightSprite, chromaGreen, searchPaths);
            boneShamanSprite = LoadOrProcedural("bone_shaman", boneShamanSprite, chromaGreen, searchPaths);
            boss1Sprite = LoadOrProcedural("boss1", boss1Sprite, chromaGreen, searchPaths);
            ghoulSprite = LoadOrProcedural("ghoul", ghoulSprite, chromaGreen, searchPaths);
            gravekeeperSprite = LoadOrProcedural("gravekeeper", gravekeeperSprite, chromaGreen, searchPaths);
        }

        private Sprite LoadOrProcedural(string key, Sprite existing, Color keyColor, string[] paths)
        {
            if (existing != null) return existing;

            foreach (var dir in paths)
            {
                if (!Directory.Exists(dir)) continue;
                string file = Path.Combine(dir, key + ".png");
                if (File.Exists(file))
                {
                    Sprite s = Core.ChromaKeyFilter.ProcessAndCreateSprite(file, keyColor);
                    if (s != null) return s;
                }
            }
            // Fallback: Elegant gothic procedural silhouette
            return Core.ChromaKeyFilter.CreateProceduralGothicSilhouette(key);
        }

        public Sprite GetSpriteForEntity(string entityId)
        {
            string id = entityId.ToLower();
            if (id.Contains("hunter")) return hunterSprite;
            if (id.Contains("wraith")) return wraithSprite;
            if (id.Contains("berserker")) return berserkerSprite;
            if (id.Contains("knight") || id.Contains("blackknight")) return blackknightSprite;
            if (id.Contains("bone") || id.Contains("shaman")) return boneShamanSprite;
            if (id.Contains("boss") || id.Contains("golem")) return boss1Sprite;
            if (id.Contains("ghoul")) return ghoulSprite;
            if (id.Contains("gravekeeper")) return gravekeeperSprite;

            return Core.ChromaKeyFilter.CreateProceduralGothicSilhouette(entityId);
        }

        public void PlayDarkestCutIn(Sprite attackerSprite, Sprite defenderSprite, int damage, bool isCrit, Action onComplete = null)
        {
            StartCoroutine(ExecuteCutInSequence(attackerSprite, defenderSprite, damage, isCrit, onComplete));
        }

        private IEnumerator ExecuteCutInSequence(Sprite attacker, Sprite defender, int damage, bool isCrit, Action onComplete)
        {
            if (cutInDimmer == null)
            {
                onComplete?.Invoke();
                yield break;
            }

            // 1. Dim background
            cutInDimmer.color = new Color(0.04f, 0.04f, 0.06f, 0.85f);
            cutInHeroImage.sprite = attacker;
            cutInTargetImage.sprite = defender;
            cutInHeroImage.color = Color.white;
            cutInTargetImage.color = Color.white;

            // 2. Dash inward with dynamic tilt & scale punch
            Vector2 heroStart = new Vector2(-600, 0);
            Vector2 heroHitPos = new Vector2(-120, 0);
            Vector2 targetStart = new Vector2(600, 0);
            Vector2 targetHitPos = new Vector2(120, 0);

            float dashTime = 0.14f;
            float elapsed = 0f;
            while (elapsed < dashTime)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(elapsed / dashTime);
                float ease = Core.FluentTween.EaseOutCubic(t);
                cutInHeroTransform.anchoredPosition = Vector2.Lerp(heroStart, heroHitPos, ease);
                cutInTargetTransform.anchoredPosition = Vector2.Lerp(targetStart, targetHitPos, ease);
                cutInHeroTransform.localRotation = Quaternion.Euler(0, 0, Mathf.Lerp(0, -8f, ease));
                cutInTargetTransform.localRotation = Quaternion.Euler(0, 0, Mathf.Lerp(0, 10f, ease));
                yield return null;
            }

            // 3. Impact Slash + 0.07s Hit-Stop
            Image slashImg = slashTrailEffect.GetComponent<Image>();
            slashImg.color = isCrit ? new Color(1f, 0.85f, 0.2f, 1f) : new Color(0.85f, 0.08f, 0.08f, 1f);

            // Trigger Screen Shake
            StartCoroutine(DoScreenShake(screenShakeIntensity * (isCrit ? 1.8f : 1.0f), 0.25f));

            // Damage Text Pop
            cutInDamageText.color = isCrit ? new Color(1f, 0.9f, 0.1f) : new Color(0.9f, 0.2f, 0.2f);
            cutInDamageText.text = isCrit ? $"CRITICAL!\n-{damage}" : $"-{damage}";
            cutInDamageText.transform.localScale = Vector3.one * 1.5f;

            // Heavy Hitstop freeze
            yield return new WaitForSecondsRealtime(hitStopDuration);

            // 4. Fade out overlay
            float fadeTime = 0.22f;
            elapsed = 0f;
            while (elapsed < fadeTime)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(elapsed / fadeTime);
                float alpha = 1f - t;
                cutInDimmer.color = new Color(0.04f, 0.04f, 0.06f, 0.85f * alpha);
                cutInHeroImage.color = new Color(1, 1, 1, alpha);
                cutInTargetImage.color = new Color(1, 1, 1, alpha);
                cutInDamageText.color = new Color(cutInDamageText.color.r, cutInDamageText.color.g, cutInDamageText.color.b, alpha);
                slashImg.color = new Color(slashImg.color.r, slashImg.color.g, slashImg.color.b, alpha);
                yield return null;
            }

            cutInDimmer.color = Color.clear;
            cutInHeroTransform.anchoredPosition = heroStart;
            cutInTargetTransform.anchoredPosition = targetStart;
            onComplete?.Invoke();
        }

        private IEnumerator DoScreenShake(float intensity, float duration)
        {
            Transform camTransform = Camera.main != null ? Camera.main.transform : transform;
            Vector3 originalPos = camTransform.localPosition;
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                float decay = 1f - (elapsed / duration);
                Vector2 shake = UnityEngine.Random.insideUnitCircle * (intensity * decay * 0.01f);
                camTransform.localPosition = originalPos + new Vector3(shake.x, shake.y, 0);
                yield return null;
            }
            camTransform.localPosition = originalPos;
        }
    }
}
