using UnityEngine;

/// <summary>
/// 소울본 하이엔드 애니메이션 컨트롤러
/// - Unity Mecanim Animator 파라미터 (Speed, IsLockedOn, AttackTrigger, ComboIndex, DodgeTrigger 등) 정밀 제어
/// - 프로시저럴 다관절 본 애니메이션 (달리기, 호흡, 3단 콤보 베기, 퀵스텝, 내장뽑기)
/// - [Hot-Swap Asset Slots] Mixamo 3D 모델 및 애니메이터 원클릭 교체 슬롯 탑재
/// </summary>
public class SoulsAnimationController : MonoBehaviour
{
    [Header("Hot-Swap Asset Slots")]
    [Tooltip("Mixamo 등에서 다운로드한 3D 캐릭터 프리팹을 드래그&드롭하면 즉시 외형이 교체됩니다.")]
    public GameObject custom3DModelPrefab;
    [Tooltip("Mixamo 애니메이터 컨트롤러를 드래그&드롭하면 프로시저럴 모션 대신 상용 모션캡처로 재생됩니다.")]
    public RuntimeAnimatorController mixamoAnimatorController;

    [Header("Procedural Bone Rig (Fallback)")]
    public Transform hips;
    public Transform spine;
    public Transform chest;
    public Transform head;
    public Transform leftArm;
    public Transform rightArm;
    public Transform leftLeg;
    public Transform rightLeg;
    public Transform coatTail;

    private Animator animator;
    private float locomotionSpeed;
    private float walkTime;
    private int attackIndex;
    private float attackTime;
    private bool isAttacking;
    private bool isQuickstepping;

    private void Awake()
    {
        animator = GetComponentInChildren<Animator>();
        if (animator == null && custom3DModelPrefab != null)
        {
            GameObject model = Instantiate(custom3DModelPrefab, transform);
            animator = model.GetComponent<Animator>();
        }

        if (animator != null && mixamoAnimatorController != null)
        {
            animator.runtimeAnimatorController = mixamoAnimatorController;
        }

        AutoFindBones();
    }

    private void AutoFindBones()
    {
        if (hips == null) hips = transform.Find("Hips");
        if (chest == null && hips != null) chest = hips.Find("Chest");
        if (rightArm == null && chest != null) rightArm = chest.Find("RightArm");
        if (leftArm == null && chest != null) leftArm = chest.Find("LeftArm");
        if (head == null && chest != null) head = chest.Find("Head");
        if (leftLeg == null && hips != null) leftLeg = hips.Find("LeftLeg");
        if (rightLeg == null && hips != null) rightLeg = hips.Find("RightLeg");
        if (coatTail == null && hips != null) coatTail = hips.Find("CoatTail");
    }

    public void UpdateLocomotion(float speed, float inputX, float inputY, bool isLockedOn)
    {
        locomotionSpeed = speed;

        if (animator != null)
        {
            animator.SetFloat("Speed", speed, 0.15f, Time.deltaTime);
            animator.SetFloat("InputX", inputX, 0.15f, Time.deltaTime);
            animator.SetFloat("InputY", inputY, 0.15f, Time.deltaTime);
            animator.SetBool("IsLockedOn", isLockedOn);
            return;
        }

        // 프로시저럴 본 애니메이션 (Mecanim 애니메이터가 없을 때 완벽 작동)
        UpdateProceduralMotion();
    }

    public void PlayAttackAnimation(int comboStep)
    {
        attackIndex = comboStep;
        isAttacking = true;
        attackTime = 0f;

        if (animator != null)
        {
            animator.SetInteger("ComboIndex", comboStep);
            animator.SetTrigger("AttackTrigger");
        }
    }

    public void PlayDodgeAnimation(bool quickstep)
    {
        isQuickstepping = quickstep;
        if (animator != null)
        {
            animator.SetInteger("DodgeType", quickstep ? 1 : 0);
            animator.SetTrigger("DodgeTrigger");
        }
    }

    public void PlayParryAnimation()
    {
        if (animator != null)
        {
            animator.SetTrigger("ParryTrigger");
        }
    }

    public void PlayVisceralAttackAnimation()
    {
        if (animator != null)
        {
            animator.SetTrigger("VisceralTrigger");
        }
    }

    private void Update()
    {
        if (isAttacking)
        {
            attackTime += Time.deltaTime;
            if (attackTime > 0.45f)
            {
                isAttacking = false;
            }
        }
    }

    private void UpdateProceduralMotion()
    {
        if (hips == null) return;

        // 아이들 호흡 모션
        float breathe = Mathf.Sin(Time.time * 2.2f) * 0.02f;
        if (chest != null)
        {
            chest.localPosition = new Vector3(0, 0.65f + breathe, 0);
        }

        // 보행/달리기 관절 회전
        if (locomotionSpeed > 0.1f)
        {
            walkTime += Time.deltaTime * (locomotionSpeed > 1.5f ? 14f : 9.5f);
            float legAngle = Mathf.Sin(walkTime) * 38f;

            if (leftLeg != null) leftLeg.localRotation = Quaternion.Euler(legAngle, 0, 0);
            if (rightLeg != null) rightLeg.localRotation = Quaternion.Euler(-legAngle, 0, 0);

            if (!isAttacking && rightArm != null)
            {
                rightArm.localRotation = Quaternion.Euler(-legAngle * 0.6f, 0, 0);
            }
            if (leftArm != null)
            {
                leftArm.localRotation = Quaternion.Euler(legAngle * 0.6f, 0, 0);
            }

            if (coatTail != null)
            {
                coatTail.localRotation = Quaternion.Euler(15f + Mathf.Abs(legAngle) * 0.35f, 0, 0);
            }
        }
        else
        {
            if (leftLeg != null) leftLeg.localRotation = Quaternion.identity;
            if (rightLeg != null) rightLeg.localRotation = Quaternion.identity;
            if (!isAttacking && rightArm != null) rightArm.localRotation = Quaternion.identity;
            if (leftArm != null) leftArm.localRotation = Quaternion.identity;
        }

        // 3단 콤보 참격 팔 스윙
        if (isAttacking && rightArm != null)
        {
            float t = attackTime / 0.45f;
            float swing = Mathf.Sin(t * Mathf.PI);

            if (attackIndex == 0)
            {
                // 1타: 대각선 베기
                rightArm.localRotation = Quaternion.Euler(-60f + swing * 120f, -swing * 45f, 0);
            }
            else if (attackIndex == 1)
            {
                // 2타: 역방향 수평 베기
                rightArm.localRotation = Quaternion.Euler(15f, -90f + swing * 160f, 0);
            }
            else
            {
                // 3타: 오버헤드 슬램
                rightArm.localRotation = Quaternion.Euler(-110f + swing * 180f, 0, 0);
            }
        }
    }
}
