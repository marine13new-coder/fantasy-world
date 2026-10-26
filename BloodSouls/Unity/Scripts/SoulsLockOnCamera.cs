using UnityEngine;

/// <summary>
/// 소울본 3인칭 숄더뷰 & 타겟 락온 추적 카메라
/// - [Q] 또는 마우스 휠 클릭: 타겟 락온
/// - 락온 시: 적과 플레이어를 화면 황금분할에 두는 자동 숄더뷰 추적
/// - 비 락온 시: 마우스 회전 궤도 카메라
/// - 지형 충돌 방지 (SphereCast Damping) 탑재
/// </summary>
public class SoulsLockOnCamera : MonoBehaviour
{
    [Header("Target & Follow")]
    public Transform player;
    public Vector3 shoulderOffset = new Vector3(0.6f, 1.8f, 0f);
    public float defaultDistance = 5.5f;
    public float minDistance = 2.0f;
    public float maxDistance = 7.5f;

    [Header("Sensitivity & Damping")]
    public float mouseSensitivityX = 3.5f;
    public float mouseSensitivityY = 2.5f;
    public float smoothSpeed = 14f;
    public float minPitch = -15f;
    public float maxPitch = 65f;

    [Header("Lock-On")]
    public float lockOnRadius = 28f;
    public LayerMask enemyLayer;

    private float yaw = 0f;
    private float pitch = 18f;
    private float currentDistance;
    private bool isLockedOn = false;
    private Transform currentTarget = null;

    public bool IsLockedOn => isLockedOn;
    public Transform CurrentTarget => currentTarget;

    private void Start()
    {
        if (player == null)
        {
            GameObject pObj = GameObject.FindWithTag("Player");
            if (pObj != null) player = pObj.transform;
        }

        currentDistance = defaultDistance;
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
        enemyLayer = LayerMask.GetMask("Default", "Enemy");
    }

    private void Update()
    {
        if (Input.GetKeyDown(KeyCode.Q) || Input.GetMouseButtonDown(2))
        {
            ToggleLockOn();
        }

        if (Input.GetKeyDown(KeyCode.Escape))
        {
            Cursor.lockState = (Cursor.lockState == CursorLockMode.Locked) ? CursorLockMode.None : CursorLockMode.Locked;
            Cursor.visible = (Cursor.lockState != CursorLockMode.Locked);
        }
    }

    private void LateUpdate()
    {
        if (player == null) return;

        if (isLockedOn && currentTarget != null)
        {
            // 락온 모드: 타겟과 플레이어 중간을 주시
            Vector3 toTarget = currentTarget.position - player.position;
            float targetYaw = Mathf.Atan2(toTarget.x, toTarget.z) * Mathf.Rad2Deg;
            yaw = Mathf.LerpAngle(yaw, targetYaw, smoothSpeed * Time.deltaTime);
            pitch = Mathf.Lerp(pitch, 15f, smoothSpeed * Time.deltaTime);

            // 적이 사망하거나 너무 멀어지면 락온 해제
            SoulsGothicAI ai = currentTarget.GetComponentInParent<SoulsGothicAI>();
            if (ai != null && (!ai.IsAlive || toTarget.sqrMagnitude > lockOnRadius * lockOnRadius * 1.5f))
            {
                ClearLockOn();
            }
        }
        else
        {
            // 비 락온 모드: 마우스 회전
            if (Cursor.lockState == CursorLockMode.Locked)
            {
                yaw += Input.GetAxis("Mouse X") * mouseSensitivityX;
                pitch -= Input.GetAxis("Mouse Y") * mouseSensitivityY;
                pitch = Mathf.Clamp(pitch, minPitch, maxPitch);
            }
        }

        Quaternion rotation = Quaternion.Euler(pitch, yaw, 0f);
        Vector3 targetFocus = player.position + player.TransformDirection(shoulderOffset);

        // 지형 충돌 방지 (SphereCast)
        Vector3 desiredCamPos = targetFocus - (rotation * Vector3.forward * defaultDistance);
        if (Physics.SphereCast(targetFocus, 0.3f, (desiredCamPos - targetFocus).normalized, out RaycastHit hit, defaultDistance))
        {
            currentDistance = Mathf.Clamp(hit.distance - 0.2f, minDistance, defaultDistance);
        }
        else
        {
            currentDistance = Mathf.Lerp(currentDistance, defaultDistance, Time.deltaTime * 8f);
        }

        Vector3 finalPos = targetFocus - (rotation * Vector3.forward * currentDistance);
        transform.position = Vector3.Lerp(transform.position, finalPos, Time.deltaTime * smoothSpeed);
        transform.LookAt(targetFocus);
    }

    public void ToggleLockOn()
    {
        if (isLockedOn)
        {
            ClearLockOn();
        }
        else
        {
            Collider[] colliders = Physics.OverlapSphere(player.position, lockOnRadius);
            Transform bestTarget = null;
            float minDistance = float.MaxValue;

            foreach (var col in colliders)
            {
                SoulsGothicAI ai = col.GetComponentInParent<SoulsGothicAI>();
                if (ai != null && ai.IsAlive)
                {
                    float d = Vector3.Distance(player.position, ai.transform.position);
                    if (d < minDistance)
                    {
                        minDistance = d;
                        bestTarget = ai.transform;
                    }
                }
            }

            if (bestTarget != null)
            {
                isLockedOn = true;
                currentTarget = bestTarget;
            }
        }
    }

    public void ClearLockOn()
    {
        isLockedOn = false;
        currentTarget = null;
    }
}
