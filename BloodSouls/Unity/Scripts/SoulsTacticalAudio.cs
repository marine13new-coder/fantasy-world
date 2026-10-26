using System.Collections;
using UnityEngine;

/// <summary>
/// 외부 사운드 파일 없이 AudioClip.Create로 고딕 오케스트라 앰비언트,
/// 패링 종소리, 타격음, 장전음, 사망 징 소리를 절차적 합성하는 3D 공간 음향 엔진
/// </summary>
public class SoulsTacticalAudio : MonoBehaviour
{
    [Header("Hot-Swap Asset Slots")]
    [Tooltip("외부 고음질 WAV/MP3 사운드 클립이 있으면 슬롯에 드래그&드롭하여 1초 만에 교체 가능합니다.")]
    public AudioClip customParryBellClip;
    public AudioClip customVisceralClip;
    public AudioClip customWhooshClip;
    public AudioClip customYouDiedClip;

    private AudioSource sfxSource;
    private AudioSource ambientSource;
    private AudioSource musicSource;

    private AudioClip whooshClip;
    private AudioClip bladeClangClip;
    private AudioClip gunshotClip;
    private AudioClip parryBellClip;
    private AudioClip visceralClip;
    private AudioClip healClip;
    private AudioClip dodgeClip;
    private AudioClip bonfireClip;
    private AudioClip youDiedClip;
    private AudioClip preySlaughteredClip;

    private void Awake()
    {
        sfxSource = gameObject.AddComponent<AudioSource>();
        ambientSource = gameObject.AddComponent<AudioSource>();
        musicSource = gameObject.AddComponent<AudioSource>();

        ambientSource.loop = true;
        ambientSource.volume = 0.35f;

        musicSource.loop = true;
        musicSource.volume = 0.5f;

        GenerateProceduralClips();
        PlayCathedralAmbience();
    }

    private void GenerateProceduralClips()
    {
        whooshClip = CreateWhooshClip();
        bladeClangClip = CreateToneClip(480f, 0.2f, true);
        gunshotClip = CreateNoiseBurstClip(0.22f);
        parryBellClip = CreateBellClip(1760f, 1.2f);
        visceralClip = CreateSquishClip(0.45f);
        healClip = CreateToneClip(520f, 0.4f, false);
        dodgeClip = CreateToneClip(180f, 0.25f, true);
        bonfireClip = CreateChordClip(new float[] { 220, 277, 330, 440 }, 1.8f);
        youDiedClip = CreateChordClip(new float[] { 55, 82, 110 }, 3.5f);
        preySlaughteredClip = CreateChordClip(new float[] { 261, 329, 392, 523 }, 3.8f);
    }

    public void PlayWhoosh(float pitch = 1.0f)
    {
        AudioClip clip = customWhooshClip != null ? customWhooshClip : whooshClip;
        sfxSource.pitch = pitch;
        sfxSource.PlayOneShot(clip, 0.7f);
    }

    public void PlayBladeClang(bool heavy)
    {
        sfxSource.pitch = heavy ? 0.8f : 1.2f;
        sfxSource.PlayOneShot(bladeClangClip, heavy ? 0.9f : 0.6f);
    }

    public void PlayGunshot()
    {
        sfxSource.pitch = 1.0f;
        sfxSource.PlayOneShot(gunshotClip, 0.9f);
    }

    public void PlayParryBell()
    {
        AudioClip clip = customParryBellClip != null ? customParryBellClip : parryBellClip;
        sfxSource.pitch = 1.0f;
        sfxSource.PlayOneShot(clip, 1.0f);
    }

    public void PlayVisceralAttack()
    {
        AudioClip clip = customVisceralClip != null ? customVisceralClip : visceralClip;
        sfxSource.pitch = 0.9f;
        sfxSource.PlayOneShot(clip, 1.0f);
    }

    public void PlayHeal()
    {
        sfxSource.pitch = 1.1f;
        sfxSource.PlayOneShot(healClip, 0.7f);
    }

    public void PlayDodgeWhoosh()
    {
        sfxSource.pitch = 1.0f;
        sfxSource.PlayOneShot(dodgeClip, 0.5f);
    }

    public void PlayTrickTransform()
    {
        sfxSource.pitch = 1.4f;
        sfxSource.PlayOneShot(bladeClangClip, 0.8f);
    }

    public void PlayBonfireLit()
    {
        sfxSource.pitch = 1.0f;
        sfxSource.PlayOneShot(bonfireClip, 0.9f);
    }

    public void PlayYouDied()
    {
        AudioClip clip = customYouDiedClip != null ? customYouDiedClip : youDiedClip;
        sfxSource.pitch = 1.0f;
        sfxSource.PlayOneShot(clip, 1.0f);
    }

    public void PlayPreySlaughtered()
    {
        sfxSource.pitch = 1.0f;
        sfxSource.PlayOneShot(preySlaughteredClip, 1.0f);
    }

    public void PlayBossPhase2Cue()
    {
        sfxSource.pitch = 0.85f;
        sfxSource.PlayOneShot(youDiedClip, 0.8f);
    }

    public void StopBossMusic()
    {
        musicSource.Stop();
    }

    private void PlayCathedralAmbience()
    {
        int sampleRate = 44100;
        int samples = sampleRate * 4;
        float[] data = new float[samples];
        for (int i = 0; i < samples; i++)
        {
            float t = (float)i / sampleRate;
            data[i] = Mathf.Sin(t * 55f * Mathf.PI * 2f) * 0.12f + Mathf.Sin(t * 110f * Mathf.PI * 2f) * 0.08f;
        }
        AudioClip amb = AudioClip.Create("Ambience", samples, 1, sampleRate, false);
        amb.SetData(data, 0);
        ambientSource.clip = amb;
        ambientSource.Play();
    }

    private AudioClip CreateToneClip(float freq, float duration, bool decay)
    {
        int sampleRate = 44100;
        int samples = (int)(sampleRate * duration);
        float[] data = new float[samples];
        for (int i = 0; i < samples; i++)
        {
            float t = (float)i / sampleRate;
            float envelope = decay ? Mathf.Exp(-t * 12f) : 1f;
            data[i] = Mathf.Sin(t * freq * Mathf.PI * 2f) * envelope * 0.6f;
        }
        AudioClip c = AudioClip.Create("Tone", samples, 1, sampleRate, false);
        c.SetData(data, 0);
        return c;
    }

    private AudioClip CreateBellClip(float freq, float duration)
    {
        int sampleRate = 44100;
        int samples = (int)(sampleRate * duration);
        float[] data = new float[samples];
        for (int i = 0; i < samples; i++)
        {
            float t = (float)i / sampleRate;
            float env = Mathf.Exp(-t * 3.5f);
            data[i] = (Mathf.Sin(t * freq * Mathf.PI * 2f) + 0.5f * Mathf.Sin(t * freq * 1.5f * Mathf.PI * 2f)) * env * 0.5f;
        }
        AudioClip c = AudioClip.Create("Bell", samples, 1, sampleRate, false);
        c.SetData(data, 0);
        return c;
    }

    private AudioClip CreateWhooshClip()
    {
        int sampleRate = 44100;
        int samples = (int)(sampleRate * 0.2f);
        float[] data = new float[samples];
        for (int i = 0; i < samples; i++)
        {
            float t = (float)i / sampleRate;
            float env = Mathf.Sin(t / 0.2f * Mathf.PI);
            data[i] = (Random.value * 2f - 1f) * env * 0.45f;
        }
        AudioClip c = AudioClip.Create("Whoosh", samples, 1, sampleRate, false);
        c.SetData(data, 0);
        return c;
    }

    private AudioClip CreateNoiseBurstClip(float duration)
    {
        int sampleRate = 44100;
        int samples = (int)(sampleRate * duration);
        float[] data = new float[samples];
        for (int i = 0; i < samples; i++)
        {
            float t = (float)i / sampleRate;
            data[i] = (Random.value * 2f - 1f) * Mathf.Exp(-t * 16f) * 0.8f;
        }
        AudioClip c = AudioClip.Create("Noise", samples, 1, sampleRate, false);
        c.SetData(data, 0);
        return c;
    }

    private AudioClip CreateSquishClip(float duration)
    {
        int sampleRate = 44100;
        int samples = (int)(sampleRate * duration);
        float[] data = new float[samples];
        for (int i = 0; i < samples; i++)
        {
            float t = (float)i / sampleRate;
            float sub = Mathf.Sin(t * 60f * Mathf.PI * 2f) * Mathf.Exp(-t * 6f);
            float squish = (Random.value * 2f - 1f) * Mathf.Sin(t * 40f) * Mathf.Exp(-t * 4f);
            data[i] = (sub + squish * 0.6f) * 0.75f;
        }
        AudioClip c = AudioClip.Create("Squish", samples, 1, sampleRate, false);
        c.SetData(data, 0);
        return c;
    }

    private AudioClip CreateChordClip(float[] freqs, float duration)
    {
        int sampleRate = 44100;
        int samples = (int)(sampleRate * duration);
        float[] data = new float[samples];
        for (int i = 0; i < samples; i++)
        {
            float t = (float)i / sampleRate;
            float env = Mathf.Exp(-t * 1.5f);
            float val = 0f;
            foreach (var f in freqs)
            {
                val += Mathf.Sin(t * f * Mathf.PI * 2f) / freqs.Length;
            }
            data[i] = val * env * 0.5f;
        }
        AudioClip c = AudioClip.Create("Chord", samples, 1, sampleRate, false);
        c.SetData(data, 0);
        return c;
    }
}
