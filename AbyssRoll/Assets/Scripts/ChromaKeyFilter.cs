using System.IO;
using UnityEngine;

namespace AbyssRoll.Core
{
    public static class ChromaKeyFilter
    {
        public static Sprite ProcessAndCreateSprite(string filePath, Color keyColor, float tolerance = 0.25f)
        {
            if (!File.Exists(filePath)) return null;

            byte[] bytes = File.ReadAllBytes(filePath);
            Texture2D source = new Texture2D(2, 2, TextureFormat.RGBA32, false);
            if (!source.LoadImage(bytes)) return null;

            Texture2D output = ApplyChromaKey(source, keyColor, tolerance);
            return Sprite.Create(output, new Rect(0, 0, output.width, output.height), new Vector2(0.5f, 0.5f), 100f);
        }

        public static Texture2D ApplyChromaKey(Texture2D source, Color keyColor, float tolerance = 0.25f)
        {
            Color[] pixels = source.GetPixels();
            for (int i = 0; i < pixels.Length; i++)
            {
                Color c = pixels[i];
                // Distance in RGB space
                float rDiff = Mathf.Abs(c.r - keyColor.r);
                float gDiff = Mathf.Abs(c.g - keyColor.g);
                float bDiff = Mathf.Abs(c.b - keyColor.b);
                float dist = (rDiff + gDiff + bDiff) / 3f;

                if (dist <= tolerance)
                {
                    pixels[i] = Color.clear;
                }
            }

            Texture2D filtered = new Texture2D(source.width, source.height, TextureFormat.RGBA32, false);
            filtered.filterMode = FilterMode.Point;
            filtered.SetPixels(pixels);
            filtered.Apply();
            return filtered;
        }

        public static Sprite CreateProceduralGothicSilhouette(string heroOrMonsterType, int width = 128, int height = 128)
        {
            Texture2D tex = new Texture2D(width, height, TextureFormat.RGBA32, false);
            tex.filterMode = FilterMode.Point;
            Color clear = Color.clear;
            Color gothicDark = new Color(0.08f, 0.08f, 0.12f, 1f);
            Color highlight = new Color(0.77f, 0.63f, 0.35f, 1f); // Antique brass
            Color bloodRed = new Color(0.55f, 0.0f, 0.0f, 1f);

            Color primaryColor = gothicDark;
            if (heroOrMonsterType.ToLower().Contains("boss") || heroOrMonsterType.ToLower().Contains("berserker"))
                primaryColor = Color.Lerp(gothicDark, bloodRed, 0.4f);
            else if (heroOrMonsterType.ToLower().Contains("knight") || heroOrMonsterType.ToLower().Contains("wanderer"))
                primaryColor = Color.Lerp(gothicDark, highlight, 0.35f);

            for (int y = 0; y < height; y++)
            {
                for (int x = 0; x < width; x++)
                {
                    float nx = (x - width * 0.5f) / (width * 0.5f);
                    float ny = (y - height * 0.5f) / (height * 0.5f);
                    float r = Mathf.Sqrt(nx * nx + ny * ny);

                    // Procedural gothic silhouette shape
                    bool inside = false;
                    // Torso/Body triangle/shield shape
                    if (ny < 0.2f && ny > -0.8f && Mathf.Abs(nx) < (0.6f - ny * 0.3f)) inside = true;
                    // Head circle
                    if (ny >= 0.2f && ny <= 0.8f && Mathf.Abs(nx) < 0.35f) inside = true;
                    // Shoulders / horns / pauldrons
                    if (ny >= 0.0f && ny <= 0.4f && Mathf.Abs(nx) < 0.75f) inside = true;

                    if (inside)
                    {
                        // Outline vs fill
                        if (r > 0.65f || Mathf.Abs(nx) > 0.55f || ny > 0.65f)
                            tex.SetPixel(x, y, highlight);
                        else
                            tex.SetPixel(x, y, primaryColor);
                    }
                    else
                    {
                        tex.SetPixel(x, y, clear);
                    }
                }
            }
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, width, height), new Vector2(0.5f, 0.5f), 100f);
        }
    }
}
