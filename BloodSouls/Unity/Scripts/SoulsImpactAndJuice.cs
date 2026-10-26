using System.Collections;
using UnityEngine;

/// <summary>
/// 0.05초 역경직 (Hit-stop), 카메라 셰이크, 혈흔 분출, 피격 플래시를 관장하는 쥬얼 임팩트 엔진
/// </summary>
public class SoulsImpactAndJuice : MonoBehaviour
{
    [Header("Hit Stop")]
    public float defaultHitStopDuration = 0.05f;

    [Header("Screen Shake")]
    public float shakeIntensity = 0.2f;

    private Transform mainCameraTransform;
    private Vector3 originalCamPos;
    private ParticleSystem bloodParticles;

    private void Awake()
    {
        if (Camera.main != null) mainCameraTransform = Camera.main.transform;
        CreateProceduralBloodSystem();
    }

    private void CreateProceduralBloodSystem()
    {
        GameObject bloodObj = new GameObject("ProceduralBloodSystem");
        bloodParticles = bloodObj.AddComponent<ParticleSystem>();
        var main = bloodParticles.main;
        main.startColor = new Color(0.7f, 0.05f, 0.1f, 1f);
        main.startSize = 0.18f;
        main.startSpeed = 7f;
        main.gravityModifier = 1.8f;
        main.loop = false;
        main.playOnAwake = false;

        var emission = bloodParticles.emission;
        emission.enabled = false;

        var shape = bloodParticles.shape;
        shape.shapeType = ParticleSystemShapeType.Sphere;
        shape.radius = 0.3f;
    }

    public void TriggerHitStop(float duration)
    {
        StartCoroutine(HitStopRoutine(duration));
    }

    private IEnumerator HitStopRoutine(float duration)
    {
        Time.timeScale = 0.04f;
        yield return new WaitForSecondsRealtime(duration);
        Time.timeScale = 1.0f;
    }

    public void TriggerScreenShake(float intensity, float duration)
    {
        StartCoroutine(ScreenShakeRoutine(intensity, duration));
    }

    private IEnumerator ScreenShakeRoutine(float intensity, float duration)
    {
        if (mainCameraTransform == null) yield break;

        float elapsed = 0f;
        while (elapsed < duration)
        {
            Vector3 randomOffset = Random.insideUnitSphere * intensity * (1f - (elapsed / duration));
            mainCameraTransform.localPosition += randomOffset;
            elapsed += Time.deltaTime;
            yield return null;
        }
    }

    public void TriggerScreenFlash(Color color, float duration)
    {
        SoulsUIManager ui = FindAnyObjectByType<SoulsUIManager>();
        if (ui != null)
        {
            ui.FlashScreen(color, duration);
        }
    }

    public void SpawnBloodSplatter(Vector3 position, bool isCrit)
    {
        if (bloodParticles != null)
        {
            bloodParticles.transform.position = position;
            var main = bloodParticles.main;
            main.startSize = isCrit ? 0.35f : 0.18f;
            bloodParticles.Emit(isCrit ? 60 : 25);
        }
    }
}
