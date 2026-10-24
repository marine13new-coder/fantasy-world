using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace AbyssRoll.Core
{
    public static class FluentTween
    {
        private class TweenDriver : MonoBehaviour
        {
            private static TweenDriver _instance;
            public static TweenDriver Instance
            {
                get
                {
                    if (_instance == null)
                    {
                        var go = new GameObject("[FluentTweenDriver]");
                        UnityEngine.Object.DontDestroyOnLoad(go);
                        _instance = go.AddComponent<TweenDriver>();
                    }
                    return _instance;
                }
            }
        }

        public static Coroutine ValueTo(float from, float to, float duration, Action<float> onUpdate, Action onComplete = null, Func<float, float> ease = null)
        {
            return TweenDriver.Instance.StartCoroutine(RunValueTween(from, to, duration, onUpdate, onComplete, ease ?? EaseInOutQuad));
        }

        public static Coroutine ScalePunch(Transform target, Vector3 punchScale, float duration, Action onComplete = null)
        {
            Vector3 original = target.localScale;
            return TweenDriver.Instance.StartCoroutine(RunPunch(target, original, punchScale, duration, onComplete));
        }

        public static Coroutine MoveLocal(Transform target, Vector3 targetLocalPos, float duration, Action onComplete = null, Func<float, float> ease = null)
        {
            Vector3 start = target.localPosition;
            return ValueTo(0f, 1f, duration, t =>
            {
                if (target != null) target.localPosition = Vector3.Lerp(start, targetLocalPos, t);
            }, onComplete, ease ?? EaseOutCubic);
        }

        public static Coroutine ShakeLocal(Transform target, float intensity, float duration, Action onComplete = null)
        {
            Vector3 initialPos = target.localPosition;
            return TweenDriver.Instance.StartCoroutine(RunShake(target, initialPos, intensity, duration, onComplete));
        }

        private static IEnumerator RunValueTween(float from, float to, float duration, Action<float> onUpdate, Action onComplete, Func<float, float> ease)
        {
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                float progress = Mathf.Clamp01(elapsed / duration);
                float val = Mathf.Lerp(from, to, ease(progress));
                onUpdate?.Invoke(val);
                yield return null;
            }
            onUpdate?.Invoke(to);
            onComplete?.Invoke();
        }

        private static IEnumerator RunPunch(Transform target, Vector3 original, Vector3 punchScale, float duration, Action onComplete)
        {
            float halfDuration = duration * 0.5f;
            float elapsed = 0f;
            while (elapsed < halfDuration)
            {
                if (target == null) yield break;
                elapsed += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(elapsed / halfDuration);
                target.localScale = Vector3.Lerp(original, original + punchScale, EaseOutCubic(t));
                yield return null;
            }
            elapsed = 0f;
            while (elapsed < halfDuration)
            {
                if (target == null) yield break;
                elapsed += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(elapsed / halfDuration);
                target.localScale = Vector3.Lerp(original + punchScale, original, EaseInCubic(t));
                yield return null;
            }
            if (target != null) target.localScale = original;
            onComplete?.Invoke();
        }

        private static IEnumerator RunShake(Transform target, Vector3 initial, float intensity, float duration, Action onComplete)
        {
            float elapsed = 0f;
            while (elapsed < duration)
            {
                if (target == null) yield break;
                elapsed += Time.unscaledDeltaTime;
                float decay = 1f - Mathf.Clamp01(elapsed / duration);
                Vector2 randomOffset = UnityEngine.Random.insideUnitCircle * (intensity * decay);
                target.localPosition = initial + new Vector3(randomOffset.x, randomOffset.y, 0f);
                yield return null;
            }
            if (target != null) target.localPosition = initial;
            onComplete?.Invoke();
        }

        public static float EaseOutCubic(float t) => 1f - Mathf.Pow(1f - t, 3f);
        public static float EaseInCubic(float t) => t * t * t;
        public static float EaseInOutQuad(float t) => t < 0.5f ? 2f * t * t : 1f - Mathf.Pow(-2f * t + 2f, 2f) / 2f;
    }
}
