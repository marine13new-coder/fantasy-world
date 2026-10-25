using UnityEngine;
using UnityEngine.UI;

namespace AbyssRoll.Core
{
    [RequireComponent(typeof(Image))]
    public class DarkTorchlightVignette : MonoBehaviour
    {
        private Image _vignetteImage;
        private Texture2D _vignetteTex;

        [Range(0f, 100f)]
        public float torchLevel = 100f;

        private void Awake()
        {
            _vignetteImage = GetComponent<Image>();
            GenerateVignetteTexture();
        }

        private void GenerateVignetteTexture()
        {
            int size = 256;
            _vignetteTex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            _vignetteTex.wrapMode = TextureWrapMode.Clamp;
            Vector2 center = new Vector2(size * 0.5f, size * 0.5f);
            float maxDist = size * 0.5f;

            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    float dist = Vector2.Distance(new Vector2(x, y), center);
                    float normDist = Mathf.Clamp01(dist / maxDist);
                    // Radial gradient alpha from transparent at center to dark crimson black at edge
                    float alpha = Mathf.SmoothStep(0f, 1f, normDist);
                    _vignetteTex.SetPixel(x, y, new Color(0.035f, 0.039f, 0.059f, alpha));
                }
            }
            _vignetteTex.Apply();

            Sprite sprite = Sprite.Create(_vignetteTex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f));
            _vignetteImage.sprite = sprite;
            _vignetteImage.color = new Color(1f, 1f, 1f, 0.7f);
        }

        public void UpdateTorchVignette(float currentTorch)
        {
            torchLevel = Mathf.Clamp(currentTorch, 0f, 100f);
            if (_vignetteImage == null) return;

            // When torch is 100: alpha is ~0.4, tint is dim gothic
            // When torch is 0: alpha is ~0.95, tint turns deep blood-crimson
            float darknessFactor = 1f - (torchLevel / 100f);
            float targetAlpha = Mathf.Lerp(0.35f, 0.95f, darknessFactor);
            Color edgeColor = Color.Lerp(new Color(0.04f, 0.04f, 0.06f, targetAlpha), new Color(0.54f, 0.0f, 0.0f, targetAlpha), darknessFactor * 0.4f);
            _vignetteImage.color = edgeColor;
        }

        private void OnDestroy()
        {
            if (_vignetteTex != null)
            {
                Destroy(_vignetteTex);
            }
        }
    }
}
