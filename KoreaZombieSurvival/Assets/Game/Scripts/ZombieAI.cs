using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AI;
namespace SeoulSurvival
{
    public sealed class ZombieAI : MonoBehaviour
    {
        public static readonly List<ZombieAI> Active=new List<ZombieAI>();
        public ZombieState State {get;private set;} public float Health {get;private set;}
        public ZombieVariant Variant {get;private set;}
        public GameObject optionalPrefab; public RuntimeAnimatorController optionalAnimator; public AudioClip optionalGroan;
        public string persistentId; NavMeshAgent agent; AnimationBridge bridge; ZombieData data; ZombieVariantData variantData; GameBootstrap game;
        Vector3 interest,home; float alertedUntil,nextAttack,nextThink,stunnedUntil,nextGroan;
        public static ZombieAI Spawn(Vector3 position,Transform parent=null,string id=null,float threat=1,ZombieVariant variant=ZombieVariant.Common)
        {
            var game=GameBootstrap.Instance;
            if(Active.Count>=game.balance.zombie.maxAlive || (id!=null && game.Survival.Killed.Contains(id)))return null;
            var go=new GameObject("Zombie"); go.SetActive(false); go.transform.SetParent(parent); go.transform.position=position;
            var z=go.AddComponent<ZombieAI>(); z.persistentId=id; z.Initialize(game,threat,variant); go.SetActive(true); return z;
        }
        void Initialize(GameBootstrap context,float threat,ZombieVariant variant)
        {
            game=context; data=game.balance.zombie; Variant=variant; variantData=game.balance.zombieVariants[(int)variant]; Health=data.health*variantData.health*Mathf.Max(1,threat); home=transform.position;
            optionalPrefab=variant==ZombieVariant.Runner && game.assets.runnerZombiePrefab?game.assets.runnerZombiePrefab:variant==ZombieVariant.Armored && game.assets.armoredZombiePrefab?game.assets.armoredZombiePrefab:game.assets.zombiePrefab; optionalAnimator=game.assets.zombieAnimator; optionalGroan=game.assets.groan;
            var col=gameObject.AddComponent<CapsuleCollider>(); col.height=1.9f; col.radius=.38f; col.center=Vector3.up*.95f;
            bridge=gameObject.AddComponent<AnimationBridge>(); bridge.Initialize(WorldFactory.Visual(transform,optionalPrefab,variant==ZombieVariant.Runner?new Color(.85f,.42f,.18f):variant==ZombieVariant.Armored?new Color(.24f,.38f,.6f):new Color(.32f,.42f,.2f)),optionalAnimator);
            if(variant!=ZombieVariant.Common)WorldFactory.Label(transform,variant==ZombieVariant.Runner?"질주 감염자":"중장 감염자",new Vector3(0,2.3f,0),variant==ZombieVariant.Runner?new Color(1,.55f,.2f):new Color(.4f,.75f,1),.09f);
            agent=gameObject.AddComponent<NavMeshAgent>(); agent.radius=.38f; agent.height=1.9f; agent.speed=data.speed*variantData.speed*Mathf.Min(1.35f,Mathf.Max(1,threat)); agent.angularSpeed=360; agent.stoppingDistance=1.25f; agent.enabled=false;
            Active.Add(this); nextGroan=Time.time+Random.Range(4,15);
        }
        public static void HearNoise(Vector3 position,float radius) { foreach(var z in Active)if(z && (z.transform.position-position).sqrMagnitude<=radius*radius)z.Alert(position); }
        public void Alert(Vector3 position) { interest=position; alertedUntil=Time.time+12; }
        public void TakeHit(float damage,bool headshot,bool instantKill,Vector3 direction)
        {
            if(State==ZombieState.Dead)return; Health=instantKill?0:Health-damage*(headshot?1:variantData.bodyDamage); Alert(game.Player.transform.position);
            if(Health<=0) { State=ZombieState.Dead; Active.Remove(this); if(persistentId!=null)game.Survival.Killed.Add(persistentId); bridge.Die(headshot); if(agent.enabled)agent.enabled=false; GetComponent<Collider>().enabled=false; transform.rotation*=Quaternion.Euler(0,0,80); Destroy(gameObject,2); return; }
            if(headshot) { State=ZombieState.HeadshotStun; stunnedUntil=Time.time+.65f; if(agent.enabled && agent.isOnNavMesh) { agent.isStopped=true; agent.Move(direction*.8f); } }
        }
        bool CanSee(Vector3 target)
        {
            var delta=target-transform.position; if(delta.magnitude>data.vision || Vector3.Angle(transform.forward,delta)>75)return false;
            var origin=transform.position+Vector3.up*1.1f;
            return !Physics.Linecast(origin,target+Vector3.up*1.1f,out var hit,~0,QueryTriggerInteraction.Ignore) || hit.collider.GetComponent<TacticalPlayerController>();
        }
        void Update()
        {
            if(!game || State==ZombieState.Dead)return;
            if(!game.Running || (game.Campaign && game.Campaign.AtHome)) { if(agent.enabled && agent.isOnNavMesh)agent.isStopped=true; bridge.Motion(0,false); return; }
            if(Time.time<stunnedUntil)return;
            if(!agent.enabled || !agent.isOnNavMesh) { agent.enabled=false; if(NavMesh.SamplePosition(transform.position,out var sample,2,NavMesh.AllAreas)) { transform.position=sample.position; agent.enabled=true; } else return; }
            agent.isStopped=false; bridge.Motion(agent.velocity.magnitude,false);
            if(Time.time<nextThink)return; nextThink=Time.time+.2f;
            var target=game.Player.transform.position; if(CanSee(target))Alert(target);
            if(Time.time<alertedUntil) {
                State=ZombieState.Chase; agent.SetDestination(interest);
                if(Vector3.Distance(transform.position,target)<1.8f && !Physics.Linecast(transform.position+Vector3.up,target+Vector3.up,1<<8)) {
                    State=ZombieState.Attack; agent.isStopped=true;
                    if(Time.time>=nextAttack) { nextAttack=Time.time+data.attackInterval; game.Player.Damage(data.damage*variantData.attackDamage); bridge.Attack(); }
                }
            } else if(!agent.hasPath || agent.remainingDistance<1.5f) {
                State=ZombieState.Idle;
                var wander=home+new Vector3(Random.Range(-8,8),0,Random.Range(-8,8));
                if(NavMesh.SamplePosition(wander,out var p,4,NavMesh.AllAreas)) { agent.SetDestination(p.position); State=ZombieState.Patrol; }
            }
            if(Time.time>nextGroan && Vector3.Distance(transform.position,target)<14) { nextGroan=Time.time+Random.Range(8,18); game.Atmosphere.Play(SoundKind.Groan,transform.position,0,optionalGroan); }
        }
        void OnDestroy() { Active.Remove(this); }
    }
}
