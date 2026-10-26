using UnityEngine;

/// <summary>
/// 다크소울 & 블러드본 3인칭 기동 컨트롤러
/// - WASD 이동, Shift 스프린트 (스태미너 소모)
/// - Space 롤링 구르기 (비 락온 시) / 퀵스텝 대시 (락온 시)
/// - 스태미너 소진 시 탈진(Exhaustion) 처리
/// </summary>
[RequireComponent(typeof(CharacterController))]
public class SoulsMovementController : MonoBehaviour
{
    [Header("Movement Settings")]
    public float walkSpeed = 4.5f;
    public float sprintSpeed = 7.8f;
    public float rotationSpeed = 12f;
    public float gravity = 20f;

    [Header("Dodge & Quickstep")]
    public float rollSpeed = 11.5f;
    public float quickstepSpeed = 13.5f;
    public float rollDuration = 0.5f;
    public float quickstepDuration = 0.38f;
    public float iFrameDuration = 0.35f;

    [Header("Stamina Costs")]
    public float sprintCostPerSec = 16f;
    public float rollCost = 20f;
    public float quickstepCost = 18f;

    private CharacterController controller;
    private SoulsCombatSystem combat;
    private SoulsAnimationController anim;
    private SoulsLockOnCamera camController;

    private Vector3 moveDirection;
    private Vector3 dodgeDirection;
    private float verticalVelocity;
    private float dodgeTimer;
    private bool isDodging;
    private bool isQuickstepping;

    public bool IsDodging => isDodging;
    public bool IsQuickstepping => isQuickstepping;
    public bool HasIFrames => dodgeTimer > (isQuickstepping ? (quickstepDuration - iFrameDuration) : (rollDuration - iFrameDuration));

    private void Awake()
    {
        controller = GetComponent<CharacterController>();
        combat = GetComponent<SoulsCombatSystem>();
        anim = GetComponent<SoulsAnimationController>();
        camController = FindAnyObjectByType<SoulsLockOnCamera>();
    }

    private void Update()
    {
        if (combat != null && (combat.IsDead || combat.IsVisceralActive || combat.IsHealing))
        {
            ApplyGravity();
            return;
        }

        HandleDodgeTimer();

        if (isDodging)
        {
            float speed = isQuickstepping ? quickstepSpeed : rollSpeed;
            controller.Move(dodgeDirection * speed * Time.deltaTime + Vector3.up * verticalVelocity * Time.deltaTime);
            ApplyGravity();
            return;
        }

        HandleInputAndMovement();
    }

    private void HandleInputAndMovement()
    {
        float h = Input.GetAxisRaw("Horizontal");
        float v = Input.GetAxisRaw("Vertical");
        bool isMoving = Mathf.Abs(h) > 0.1f || Mathf.Abs(v) > 0.1f;

        // 카메라 기준 방향 계산
        Transform camTrans = Camera.main != null ? Camera.main.transform : null;
        Vector3 forward = camTrans != null ? Vector3.Scale(camTrans.forward, new Vector3(1, 0, 1)).normalized : Vector3.forward;
        Vector3 right = camTrans != null ? Vector3.Scale(camTrans.right, new Vector3(1, 0, 1)).normalized : Vector3.right;
        Vector3 inputDir = (forward * v + right * h).normalized;

        // 스프린트 (스태미너 잔량 체크)
        bool wantSprint = Input.GetKey(KeyCode.LeftShift) && isMoving && combat != null && combat.CanConsumeStamina(sprintCostPerSec * Time.deltaTime);
        if (wantSprint)
        {
            combat.ConsumeStamina(sprintCostPerSec * Time.deltaTime);
        }

        float currentSpeed = wantSprint ? sprintSpeed : walkSpeed;

        // 회피 입력 (Space)
        if (Input.GetKeyDown(KeyCode.Space) && !isDodging)
        {
            bool isLocked = camController != null && camController.IsLockedOn;
            float cost = isLocked ? quickstepCost : rollCost;

            if (combat != null && combat.CanConsumeStamina(cost))
            {
                combat.ConsumeStamina(cost);
                TriggerDodge(inputDir.magnitude > 0.1f ? inputDir : transform.forward, isLocked);
                return;
            }
        }

        // 회전 (락온 중에는 타겟 주시, 비 락온 시 이동 방향)
        if (camController != null && camController.IsLockedOn && camController.CurrentTarget != null)
        {
            Vector3 lookDir = (camController.CurrentTarget.position - transform.position);
            lookDir.y = 0;
            if (lookDir.sqrMagnitude > 0.01f)
            {
                transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(lookDir), rotationSpeed * Time.deltaTime);
            }
        }
        else if (isMoving && inputDir.sqrMagnitude > 0.01f)
        {
            transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(inputDir), rotationSpeed * Time.deltaTime);
        }

        // 이동 적용
        moveDirection = inputDir * (isMoving ? currentSpeed : 0f);
        ApplyGravity();
        controller.Move((moveDirection + Vector3.up * verticalVelocity) * Time.deltaTime);

        // 애니메이터 파라미터 전달
        if (anim != null)
        {
            anim.UpdateLocomotion(isMoving ? (wantSprint ? 2f : 1f) : 0f, h, v, camController != null && camController.IsLockedOn);
        }
    }

    private void TriggerDodge(Vector3 direction, bool quickstep)
    {
        isDodging = true;
        isQuickstepping = quickstep;
        dodgeDirection = direction.normalized;
        dodgeTimer = quickstep ? quickstepDuration : rollDuration;

        if (anim != null)
        {
            anim.PlayDodgeAnimation(quickstep);
        }

        SoulsTacticalAudio audio = FindAnyObjectByType<SoulsTacticalAudio>();
        if (audio != null)
        {
            audio.PlayDodgeWhoosh();
        }
    }

    private void HandleDodgeTimer()
    {
        if (isDodging)
        {
            dodgeTimer -= Time.deltaTime;
            if (dodgeTimer <= 0)
            {
                isDodging = false;
                isQuickstepping = false;
            }
        }
    }

    private void ApplyGravity()
    {
        if (controller.isGrounded)
        {
            verticalVelocity = -2f;
        }
        else
        {
            verticalVelocity -= gravity * Time.deltaTime;
        }
    }
}
