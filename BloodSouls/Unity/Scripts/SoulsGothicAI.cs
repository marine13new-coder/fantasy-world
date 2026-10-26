using System.Collections;
using UnityEngine;

/// <summary>
/// 소울본 고딕 몬스터 & 보스 FSM 인공지능
/// - 망자 기사, 변종 야수, 심연의 군주 말라코르(2페이즈 에픽 보스)
/// - 공격 윈드업(Windup) 프레임: 플레이어 단총 패링 유효 타이밍
/// - 패링 피격 시 그로기(Groggy) 무릎 꿇기 -> 내장뽑기(Visceral Attack) 피격 대상
/// - 2페이즈 각성 (체력 50% 이하 시 피의 월식 폭주 & 오케스트라 전투곡 전개)
/// </summary>
public class SoulsGothicAI : MonoBehaviour
{
    public enum AIState { Idle, Chase, Windup, Attack, Recovery, Groggy, Dead }

    [Header("Identity & Stats")]
    public string enemyName = "망자 성당 기사";
    public bool isBoss = false;
    public float maxHp = 240f;
    public float currentHp = 240f;
    public float attackDamage = 135f;
    public float moveSpeed = 3.5f;
    public float attackRange = 2.6f;
    public int soulsReward = 500;

    [Header("Boss Phase 2")]
    public int phase = 1;
    public Light phase2FlameLight;

    [Header("Visual Components")]
    public Transform swordTransform;
    public Transform visualRoot;

    private AIState state = AIState.Idle;
    private Transform player;
    private float stateTimer = 0f;
    private SoulsCombatSystem playerCombat;
    private SoulsImpactAndJuice juice;
    private SoulsTacticalAudio audioManager;
    private SoulsUIManager ui;

    public bool IsAlive => state != AIState.Dead;
    public AIState CurrentState => state;

    private void Start()
    {
        currentHp = maxHp;
        GameObject pObj = GameObject.FindWithTag("Player");
        if (pObj != null)
        {
            player = pObj.transform;
            playerCombat = pObj.GetComponent<SoulsCombatSystem>();
        }

        juice = FindAnyObjectByType<SoulsImpactAndJuice>();
        audioManager = FindAnyObjectByType<SoulsTacticalAudio>();
        ui = FindAnyObjectByType<SoulsUIManager>();
    }

    private void Update()
    {
        if (state == AIState.Dead || player == null) return;

        float distanceToPlayer = Vector3.Distance(transform.position, player.position);

        // 보스 2페이즈 체크
        if (isBoss && phase == 1 && currentHp <= maxHp * 0.5f)
        {
            TriggerPhase2();
        }

        switch (state)
        {
            case AIState.Idle:
                if (distanceToPlayer < 26f)
                {
                    state = AIState.Chase;
                }
                break;

            case AIState.Chase:
                LookAtPlayer();
                if (distanceToPlayer > attackRange)
                {
                    Vector3 moveDir = (player.position - transform.position).normalized;
                    moveDir.y = 0;
                    transform.position += moveDir * moveSpeed * Time.deltaTime;
                }
                else
                {
                    // 공격 준비 (윈드업 타이밍 - 패링 가능!)
                    state = AIState.Windup;
                    stateTimer = isBoss ? (phase == 2 ? 0.42f : 0.65f) : 0.55f;
                    if (swordTransform != null) swordTransform.localPosition = new Vector3(0.6f, 2.2f, 0.4f);
                }
                break;

            case AIState.Windup:
                LookAtPlayer();
                stateTimer -= Time.deltaTime;
                if (stateTimer <= 0f)
                {
                    // 실제 참격 발동
                    state = AIState.Attack;
                    stateTimer = 0.35f;
                    if (swordTransform != null) swordTransform.localPosition = new Vector3(0.6f, 1.2f, 0.8f);

                    if (audioManager != null) audioManager.PlayWhoosh(1.1f);

                    if (distanceToPlayer <= attackRange + 0.8f && playerCombat != null)
                    {
                        playerCombat.TakeDamage(attackDamage);
                    }
                }
                break;

            case AIState.Attack:
                stateTimer -= Time.deltaTime;
                if (stateTimer <= 0f)
                {
                    state = AIState.Recovery;
                    stateTimer = 0.5f;
                }
                break;

            case AIState.Recovery:
                stateTimer -= Time.deltaTime;
                if (stateTimer <= 0f)
                {
                    state = AIState.Chase;
                }
                break;

            case AIState.Groggy:
                stateTimer -= Time.deltaTime;
                if (stateTimer <= 0f)
                {
                    state = AIState.Idle;
                    if (visualRoot != null) visualRoot.localRotation = Quaternion.identity;
                }
                break;
        }
    }

    private void LookAtPlayer()
    {
        Vector3 target = player.position;
        target.y = transform.position.y;
        transform.LookAt(target);
    }

    public void TriggerGroggy()
    {
        state = AIState.Groggy;
        stateTimer = 4.2f;
        // 무릎 꿇는 포즈
        if (visualRoot != null) visualRoot.localRotation = Quaternion.Euler(25f, 0, 0);
    }

    private void TriggerPhase2()
    {
        phase = 2;
        attackDamage *= 1.35f;
        moveSpeed *= 1.3f;
        if (phase2FlameLight != null) phase2FlameLight.intensity = 4.5f;

        if (ui != null)
        {
            ui.UpdateBossSubtitle("PHASE 2 : BLOOD ECLIPSE AWAKENING");
            ui.ShowFloatingText("PHASE 2 AWAKENED!", transform.position + Vector3.up * 2.5f, Color.red);
        }

        if (audioManager != null) audioManager.PlayBossPhase2Cue();
        if (juice != null)
        {
            juice.TriggerScreenShake(0.35f, 0.4f);
            juice.SpawnBloodSplatter(transform.position + Vector3.up * 2f, true);
        }
    }

    public void TakeDamage(float amount, Vector3 attackerPos)
    {
        if (state == AIState.Dead) return;

        currentHp -= amount;

        if (isBoss && ui != null)
        {
            ui.UpdateBossHealth(currentHp, maxHp);
        }

        if (currentHp <= 0f)
        {
            Die();
        }
    }

    private void Die()
    {
        state = AIState.Dead;
        currentHp = 0f;

        if (visualRoot != null)
        {
            visualRoot.localRotation = Quaternion.Euler(90f, 0, 0);
            visualRoot.localPosition = new Vector3(0, 0.2f, 0);
        }

        if (playerCombat != null)
        {
            playerCombat.bloodEchoes += soulsReward;
            if (ui != null)
            {
                ui.UpdateEchoes(playerCombat.bloodEchoes);
                ui.ShowFloatingText("+" + soulsReward + "🩸", transform.position + Vector3.up * 2f, Color.yellow);
            }
        }

        if (isBoss)
        {
            if (audioManager != null)
            {
                audioManager.StopBossMusic();
                audioManager.PlayPreySlaughtered();
            }
            if (ui != null) ui.ShowBanner("PREY SLAUGHTERED", "위대한 사냥을 완수했습니다", new Color(0.2f, 0.8f, 1.0f));
        }

        Destroy(gameObject, 6f);
    }
}
