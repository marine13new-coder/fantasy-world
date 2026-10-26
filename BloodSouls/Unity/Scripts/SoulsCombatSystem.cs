using System.Collections;
using UnityEngine;

/// <summary>
/// 소울본 다이내믹 컴뱃 시스템
/// - 변형 톱단도 [Z] 접힘/펼침 모드
/// - 월광의 대검 [1]/[2] 무기 스위칭
/// - 사냥꾼 단총 [우클릭] 공격 윈드업 패링 판정 -> 그로기 유발
/// - 내장 뽑기(Visceral Attack) 치명타: 슬로우모션 + 0.15초 역경직(Hit-stop) + 피분수 분출
/// - 블러드본 리게인(Rally) 체력 회수 시스템
/// - 수혈액(에스트 병) [R] 회복 루틴
/// </summary>
public class SoulsCombatSystem : MonoBehaviour
{
    [Header("Player Vitals")]
    public float maxHp = 650f;
    public float currentHp = 650f;
    public float rallyHp = 650f;
    public float rallyWindowDuration = 3.2f;

    public float maxStamina = 120f;
    public float currentStamina = 120f;
    public float staminaRegenRate = 38f;

    public int bloodVials = 5;
    public int bullets = 12;
    public int bloodEchoes = 4280;

    [Header("Weapons")]
    public GameObject sawCleaverObject;
    public GameObject moonlightSwordObject;
    public GameObject pistolObject;
    public Transform weaponHinge;

    public bool isTricked = false;
    public string currentWeapon = "saw_cleaver"; // "saw_cleaver" or "moonlight"

    [Header("Attack Parameters")]
    public float lightAttackStamina = 18f;
    public float heavyAttackStamina = 32f;
    public float attackRadius = 2.6f;
    public LayerMask enemyLayer;

    private int comboStep = 0;
    private float rallyTimer = 0f;
    private bool isDead = false;
    private bool isVisceralActive = false;
    private bool isHealing = false;
    private bool isExhausted = false;

    private SoulsMovementController movement;
    private SoulsAnimationController anim;
    private SoulsImpactAndJuice juice;
    private SoulsTacticalAudio audioManager;
    private SoulsUIManager ui;

    public bool IsDead => isDead;
    public bool IsVisceralActive => isVisceralActive;
    public bool IsHealing => isHealing;
    public bool IsExhausted => isExhausted;

    private void Awake()
    {
        movement = GetComponent<SoulsMovementController>();
        anim = GetComponent<SoulsAnimationController>();
        juice = FindAnyObjectByType<SoulsImpactAndJuice>();
        audioManager = FindAnyObjectByType<SoulsTacticalAudio>();
        ui = FindAnyObjectByType<SoulsUIManager>();
        enemyLayer = LayerMask.GetMask("Default", "Enemy");
    }

    private void Start()
    {
        currentHp = maxHp;
        rallyHp = maxHp;
        currentStamina = maxStamina;
        UpdateWeaponVisibility();
    }

    private void Update()
    {
        if (isDead) return;

        HandleStaminaRegen();
        HandleRallyDecay();
        HandleInputs();
    }

    private void HandleInputs()
    {
        // 1. 공격 (마우스 좌클릭)
        if (Input.GetMouseButtonDown(0) && !movement.IsDodging && !isHealing && !isVisceralActive)
        {
            // 혹시 근처에 그로기 적이 있으면 내장뽑기 우선 실행!
            SoulsGothicAI groggyEnemy = FindNearbyGroggyEnemy();
            if (groggyEnemy != null)
            {
                ExecuteVisceralAttack(groggyEnemy);
                return;
            }

            PerformLightAttack();
        }

        // 2. 단총 사격 & 패링 (마우스 우클릭)
        if (Input.GetMouseButtonDown(1) && !movement.IsDodging && !isHealing && !isVisceralActive)
        {
            PerformPistolParry();
        }

        // 3. 톱단도 무기 변형 [Z]
        if (Input.GetKeyDown(KeyCode.Z) || Input.GetKeyDown(KeyCode.T))
        {
            ToggleTrickWeapon();
        }

        // 4. 주무기 교체 [1]: 톱단도, [2]: 월광의 대검
        if (Input.GetKeyDown(KeyCode.Alpha1)) SwitchWeapon("saw_cleaver");
        if (Input.GetKeyDown(KeyCode.Alpha2)) SwitchWeapon("moonlight");

        // 5. 수혈액 섭취 [R]
        if (Input.GetKeyDown(KeyCode.R))
        {
            DrinkBloodVial();
        }

        // 6. 상호작용 [E]
        if (Input.GetKeyDown(KeyCode.E))
        {
            SoulsGothicAI groggyEnemy = FindNearbyGroggyEnemy();
            if (groggyEnemy != null)
            {
                ExecuteVisceralAttack(groggyEnemy);
            }
        }
    }

    private void PerformLightAttack()
    {
        if (!CanConsumeStamina(lightAttackStamina)) return;
        ConsumeStamina(lightAttackStamina);

        if (anim != null) anim.PlayAttackAnimation(comboStep);
        if (audioManager != null) audioManager.PlayWhoosh(currentWeapon == "moonlight" ? 0.85f : (isTricked ? 0.95f : 1.2f));

        comboStep = (comboStep + 1) % 3;
        StartCoroutine(CheckHitDelay(0.15f));
    }

    private IEnumerator CheckHitDelay(float delay)
    {
        yield return new WaitForSeconds(delay);

        float range = (currentWeapon == "moonlight") ? 3.8f : (isTricked ? 3.4f : 2.5f);
        float damage = (currentWeapon == "moonlight") ? 175f : (isTricked ? 130f : 90f);

        Collider[] hits = Physics.OverlapSphere(transform.position + transform.forward * (range * 0.5f) + Vector3.up, range * 0.6f);
        foreach (var col in hits)
        {
            SoulsGothicAI ai = col.GetComponentInParent<SoulsGothicAI>();
            if (ai != null && ai.IsAlive)
            {
                ai.TakeDamage(damage, transform.position);

                if (juice != null)
                {
                    juice.TriggerHitStop(0.05f);
                    juice.TriggerScreenShake(0.12f, 0.15f);
                    juice.SpawnBloodSplatter(col.transform.position + Vector3.up * 1.2f, false);
                }

                if (audioManager != null)
                {
                    audioManager.PlayBladeClang(isTricked || currentWeapon == "moonlight");
                }

                // 리게인 흡혈
                if (currentHp < rallyHp)
                {
                    float recover = Mathf.Min(35f, rallyHp - currentHp);
                    currentHp += recover;
                    if (ui != null) ui.ShowFloatingText("+" + (int)recover, transform.position + Vector3.up * 2f, Color.green);
                }
                break;
            }
        }
    }

    private void PerformPistolParry()
    {
        if (bullets <= 0) return;
        bullets--;
        if (ui != null) ui.UpdateQuickslots(currentWeapon, isTricked, bullets, bloodVials);

        if (anim != null) anim.PlayParryAnimation();
        if (audioManager != null) audioManager.PlayGunshot();

        Ray ray = new Ray(transform.position + Vector3.up * 1.3f, transform.forward);
        if (Physics.Raycast(ray, out RaycastHit hit, 16f))
        {
            SoulsGothicAI ai = hit.collider.GetComponentInParent<SoulsGothicAI>();
            if (ai != null && ai.IsAlive)
            {
                if (ai.CurrentState == SoulsGothicAI.AIState.Windup)
                {
                    // 패링 성공! 그로기 상태 유발
                    ai.TriggerGroggy();
                    if (audioManager != null) audioManager.PlayParryBell();
                    if (juice != null) juice.TriggerScreenFlash(Color.white, 0.08f);
                    if (ui != null) ui.ShowFloatingText("PARRIED!", hit.point + Vector3.up * 0.5f, Color.red);
                }
                else
                {
                    ai.TakeDamage(30f, transform.position);
                }
            }
        }
    }

    public void ExecuteVisceralAttack(SoulsGothicAI target)
    {
        StartCoroutine(VisceralAttackRoutine(target));
    }

    private IEnumerator VisceralAttackRoutine(SoulsGothicAI target)
    {
        isVisceralActive = true;
        Time.timeScale = 0.15f; // 슬로우모션 줌인
        if (anim != null) anim.PlayVisceralAttackAnimation();

        transform.LookAt(new Vector3(target.transform.position.x, transform.position.y, target.transform.position.z));

        yield return new WaitForSecondsRealtime(0.35f);

        Time.timeScale = 1.0f;
        if (audioManager != null) audioManager.PlayVisceralAttack();

        float dmg = target.isBoss ? target.maxHp * 0.28f : 999f;
        target.TakeDamage(dmg, transform.position);

        if (juice != null)
        {
            juice.TriggerHitStop(0.15f);
            juice.TriggerScreenShake(0.3f, 0.45f);
            juice.SpawnBloodSplatter(target.transform.position + Vector3.up * 1.5f, true);
        }

        // 리게인 완충
        currentHp = Mathf.Min(maxHp, currentHp + 220f);
        rallyHp = currentHp;

        if (ui != null) ui.ShowFloatingText(((int)dmg).ToString(), target.transform.position + Vector3.up * 2f, Color.red);

        yield return new WaitForSeconds(0.45f);
        isVisceralActive = false;
    }

    private SoulsGothicAI FindNearbyGroggyEnemy()
    {
        Collider[] hits = Physics.OverlapSphere(transform.position, 3.2f);
        foreach (var c in hits)
        {
            SoulsGothicAI ai = c.GetComponentInParent<SoulsGothicAI>();
            if (ai != null && ai.IsAlive && ai.CurrentState == SoulsGothicAI.AIState.Groggy)
            {
                return ai;
            }
        }
        return null;
    }

    public void ToggleTrickWeapon()
    {
        if (currentWeapon != "saw_cleaver") return;
        isTricked = !isTricked;

        if (audioManager != null) audioManager.PlayTrickTransform();
        if (weaponHinge != null)
        {
            weaponHinge.localRotation = Quaternion.Euler(isTricked ? 170f : 0f, 0, 0);
        }

        if (ui != null) ui.UpdateQuickslots(currentWeapon, isTricked, bullets, bloodVials);
    }

    public void SwitchWeapon(string weaponId)
    {
        currentWeapon = weaponId;
        UpdateWeaponVisibility();
        if (audioManager != null) audioManager.PlayBladeClang(true);
        if (ui != null) ui.UpdateQuickslots(currentWeapon, isTricked, bullets, bloodVials);
    }

    private void UpdateWeaponVisibility()
    {
        if (sawCleaverObject != null) sawCleaverObject.SetActive(currentWeapon == "saw_cleaver");
        if (moonlightSwordObject != null) moonlightSwordObject.SetActive(currentWeapon == "moonlight");
    }

    public void DrinkBloodVial()
    {
        if (bloodVials <= 0 || currentHp >= maxHp || isHealing) return;
        StartCoroutine(HealRoutine());
    }

    private IEnumerator HealRoutine()
    {
        isHealing = true;
        bloodVials--;
        if (audioManager != null) audioManager.PlayHeal();

        yield return new WaitForSeconds(0.6f);

        float healAmt = maxHp * 0.45f;
        currentHp = Mathf.Min(maxHp, currentHp + healAmt);
        rallyHp = currentHp;

        if (ui != null)
        {
            ui.ShowFloatingText("+" + (int)healAmt, transform.position + Vector3.up * 2f, Color.green);
            ui.UpdateQuickslots(currentWeapon, isTricked, bullets, bloodVials);
        }

        yield return new WaitForSeconds(0.2f);
        isHealing = false;
    }

    public void TakeDamage(float amount)
    {
        if (isDead || (movement != null && movement.HasIFrames)) return;

        currentHp -= amount;
        rallyTimer = rallyWindowDuration;

        if (juice != null)
        {
            juice.TriggerScreenShake(0.18f, 0.25f);
            juice.TriggerScreenFlash(new Color(0.8f, 0.1f, 0.1f, 0.7f), 0.15f);
        }

        if (audioManager != null) audioManager.PlayBladeClang(true);

        if (currentHp <= 0f)
        {
            currentHp = 0f;
            isDead = true;
            if (audioManager != null) audioManager.PlayYouDied();
            if (ui != null) ui.ShowBanner("YOU DIED", "사냥꾼이 심연으로 쓰러졌습니다", Color.red);
            StartCoroutine(RespawnRoutine());
        }
    }

    private IEnumerator RespawnRoutine()
    {
        yield return new WaitForSeconds(4f);
        currentHp = maxHp;
        rallyHp = maxHp;
        bloodVials = 5;
        isDead = false;
        transform.position = new Vector3(0, 0.5f, 70f);
    }

    public bool CanConsumeStamina(float amount)
    {
        return !isExhausted && currentStamina >= amount;
    }

    public void ConsumeStamina(float amount)
    {
        currentStamina = Mathf.Max(0f, currentStamina - amount);
        if (currentStamina <= 0f) isExhausted = true;
    }

    private void HandleStaminaRegen()
    {
        if (!movement.IsDodging && !isHealing)
        {
            currentStamina = Mathf.Min(maxStamina, currentStamina + staminaRegenRate * Time.deltaTime);
            if (currentStamina > 25f) isExhausted = false;
        }
    }

    private void HandleRallyDecay()
    {
        if (rallyTimer > 0f)
        {
            rallyTimer -= Time.deltaTime;
        }
        else if (rallyHp > currentHp)
        {
            rallyHp = Mathf.Max(currentHp, rallyHp - 65f * Time.deltaTime);
        }
    }
}
