using System;
using UnityEngine;

namespace AbyssRoll.Audio
{
    public class DarkAudioAndHapticManager : MonoBehaviour
    {
        public static DarkAudioAndHapticManager Instance { get; private set; }

        private AudioSource _bgmSource;
        private AudioSource _sfxSource;

        private AudioClip _dMinorOrganClip;
        private AudioClip _heartbeatClip;
        private AudioClip _boneDiceRattleClip;
        private AudioClip _heavySlashClip;
        private AudioClip _bellTollClip;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            _bgmSource = gameObject.AddComponent<AudioSource>();
            _bgmSource.loop = true;
            _bgmSource.volume = 0.5f;

            _sfxSource = gameObject.AddComponent<AudioSource>();
            _sfxSource.volume = 0.85f;

            SynthesizeDarkClips();
        }

        private void Start()
        {
            PlayAmbientDrone();
        }

        private void SynthesizeDarkClips()
        {
            _dMinorOrganClip = CreateSynthesizedTone("DMinorOrganDrone", 3.0f, (t) =>
            {
                // D minor triad chords (D2: ~73.4Hz, F2: ~87.3Hz, A2: ~110Hz)
                float d = Mathf.Sin(2 * Mathf.PI * 73.416f * t);
                float f = Mathf.Sin(2 * Mathf.PI * 87.307f * t);
                float a = Mathf.Sin(2 * Mathf.PI * 110.00f * t);
                float sub = Mathf.Sin(2 * Mathf.PI * 36.7f * t) * 0.5f;
                return (d * 0.35f + f * 0.3f + a * 0.25f + sub) * 0.4f;
            });

            _heartbeatClip = CreateSynthesizedTone("HeartbeatTimpani", 0.8f, (t) =>
            {
                // Double thump heartbeat: Lub-dub
                float env1 = Mathf.Exp(-t * 18f);
                float wave1 = Mathf.Sin(2 * Mathf.PI * 55f * t) * env1;
                float t2 = Mathf.Max(0f, t - 0.25f);
                float env2 = Mathf.Exp(-t2 * 20f);
                float wave2 = Mathf.Sin(2 * Mathf.PI * 48f * t2) * env2;
                return (wave1 + wave2) * 0.8f;
            });

            _boneDiceRattleClip = CreateSynthesizedTone("BoneDiceRattle", 0.45f, (t) =>
            {
                // Clicky noisy clicks simulating bone dice clattering on wood
                float noise = (UnityEngine.Random.value * 2f - 1f) * Mathf.Exp(-t * 12f);
                float clack = Mathf.Sin(2 * Mathf.PI * 880f * t) * Mathf.Exp(-Mathf.Repeat(t * 8f, 1f) * 25f);
                return (noise * 0.4f + clack * 0.6f);
            });

            _heavySlashClip = CreateSynthesizedTone("HeavySlash", 0.5f, (t) =>
            {
                // Low pitched impact + noise burst
                float boom = Mathf.Sin(2 * Mathf.PI * Mathf.Lerp(120f, 40f, t / 0.5f) * t) * Mathf.Exp(-t * 7f);
                float crunch = (UnityEngine.Random.value * 2f - 1f) * Mathf.Exp(-t * 15f);
                return (boom * 0.7f + crunch * 0.5f);
            });

            _bellTollClip = CreateSynthesizedTone("DespairBellToll", 2.5f, (t) =>
            {
                // Deep low gothic cathedral bell toll (fundamental ~130Hz + inharmonic partials)
                float env = Mathf.Exp(-t * 1.8f);
                float fundamental = Mathf.Sin(2 * Mathf.PI * 130.8f * t);
                float partial1 = Mathf.Sin(2 * Mathf.PI * 276.5f * t) * 0.6f;
                float partial2 = Mathf.Sin(2 * Mathf.PI * 412.3f * t) * 0.3f;
                return (fundamental + partial1 + partial2) * env * 0.6f;
            });
        }

        private AudioClip CreateSynthesizedTone(string name, float duration, Func<float, float> waveFunc)
        {
            int sampleRate = 44100;
            int totalSamples = (int)(sampleRate * duration);
            float[] samples = new float[totalSamples];

            for (int i = 0; i < totalSamples; i++)
            {
                float t = (float)i / sampleRate;
                samples[i] = Mathf.Clamp(waveFunc(t), -1f, 1f);
            }

            AudioClip clip = AudioClip.Create(name, totalSamples, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        public void PlayAmbientDrone()
        {
            if (_bgmSource != null && _dMinorOrganClip != null)
            {
                _bgmSource.clip = _dMinorOrganClip;
                _bgmSource.Play();
            }
        }

        public void PlayDiceRattle()
        {
            if (_sfxSource != null && _boneDiceRattleClip != null)
            {
                _sfxSource.PlayOneShot(_boneDiceRattleClip, 0.75f);
            }
        }

        public void PlayHeavySlash(bool isCrit = false)
        {
            if (_sfxSource != null && _heavySlashClip != null)
            {
                _sfxSource.PlayOneShot(_heavySlashClip, isCrit ? 1.0f : 0.8f);
            }
            TriggerHaptic(isCrit ? 100 : 45);
        }

        public void PlayDespairBell()
        {
            if (_sfxSource != null && _bellTollClip != null)
            {
                _sfxSource.PlayOneShot(_bellTollClip, 1.0f);
            }
            if (_heartbeatClip != null)
            {
                _sfxSource.PlayOneShot(_heartbeatClip, 0.9f);
            }
            TriggerHaptic(200);
        }

        public void TriggerHaptic(long milliseconds = 50)
        {
#if UNITY_ANDROID && !UNITY_EDITOR
            try
            {
                Handheld.Vibrate();
            }
            catch (Exception ex)
            {
                Debug.LogWarning("[Haptic] Vibration ignored: " + ex.Message);
            }
#endif
        }
    }
}
