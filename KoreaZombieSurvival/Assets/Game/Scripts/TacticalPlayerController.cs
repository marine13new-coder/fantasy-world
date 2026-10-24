using UnityEngine;
namespace SeoulSurvival
{
    public sealed class TacticalPlayerController : MonoBehaviour
    {
        public PlayerState State { get; private set; }
        public float Health { get; private set; }
        public CharacterController body; public AnimationBridge animationBridge; public PrecisionCombat combat;
        public GameObject optionalPrefab; public RuntimeAnimatorController optionalAnimator;
        public Vector2 mobileMove, mobileAim; public bool mobileFocus, mobileFire;
        GameBootstrap game; float actionUntil; PlayerState action; float vertical;
        public void Initialize(GameBootstrap context)
        {
            game=context; Health=game.balance.playerHealth;
            body=gameObject.AddComponent<CharacterController>(); body.height=1.9f; body.radius=.35f; body.center=new Vector3(0,.95f,0); body.stepOffset=.25f;
            optionalPrefab=game.assets.playerPrefab; optionalAnimator=game.assets.playerAnimator;
            var model=WorldFactory.Visual(transform,optionalPrefab,new Color(.12f,.32f,.4f));
            animationBridge=gameObject.AddComponent<AnimationBridge>(); animationBridge.Initialize(model,optionalAnimator);
            combat=gameObject.AddComponent<PrecisionCombat>(); combat.Initialize(game,this);
        }
        public void SetMoveInput(Vector2 value) { mobileMove=Vector2.ClampMagnitude(value,1); }
        public void SetAimInput(Vector2 value) { mobileAim=Vector2.ClampMagnitude(value,1); }
        public void SetFocusInput(bool value) { mobileFocus=value; }
        public void SetFireInput(bool value) { mobileFire=value; }
        public void SetAction(PlayerState state,float seconds) { if(State==PlayerState.Dead)return; action=state; actionUntil=Time.time+seconds; State=state; }
        public void Damage(float amount) { if(!game.Running)return; Health=Mathf.Max(0,Health-amount); game.CameraRig.Shake(.15f); if(Health<=0) { State=PlayerState.Dead; combat.Cancel(); animationBridge.Die(false); } }
        public void Heal(float amount) { if(State!=PlayerState.Dead)Health=Mathf.Min(game.balance.playerHealth,Health+amount); }
        public void Restore(Vector3 position,float health) {body.enabled=false;transform.position=position;body.enabled=true;Health=Mathf.Clamp(health,1,game.balance.playerHealth);State=PlayerState.Idle;actionUntil=0;vertical=0;mobileMove=mobileAim=Vector2.zero;mobileFire=mobileFocus=false;}
        void Update()
        {
            if(!game || !game.Running)return;
            if(RideableVehicle.ActiveRide){combat.SetFocus(false);State=PlayerState.Move;animationBridge.Motion(0,false);return;}
            bool blocked=game.Survival.CraftingOpen || (game.Campaign && game.Campaign.PanelOpen) || game.Survival.Searching || TacticalMapOverlay.Expanded;
            Vector2 move=blocked ? Vector2.zero : Application.isMobilePlatform ? mobileMove : Vector2.ClampMagnitude(new Vector2(Input.GetAxisRaw("Horizontal"),Input.GetAxisRaw("Vertical"))+mobileMove,1);
            bool focus=!blocked && (mobileFocus || (!Application.isMobilePlatform && Input.GetMouseButton(1))) && combat.GunEquipped;
            combat.SetFocus(focus);
            if(!blocked) {
                if(mobileAim.sqrMagnitude>.05f)transform.rotation=Quaternion.LookRotation(new Vector3(mobileAim.x,0,mobileAim.y));
                else if(!Application.isMobilePlatform) { var ray=Camera.main.ScreenPointToRay(Input.mousePosition); if(new Plane(Vector3.up,transform.position+Vector3.up).Raycast(ray,out float d)) { var direction=ray.GetPoint(d)-transform.position; direction.y=0; if(direction.sqrMagnitude>.1f)transform.rotation=Quaternion.LookRotation(direction); } }
                if(Input.GetKeyDown(KeyCode.Alpha1))combat.EquipSlot(1); if(Input.GetKeyDown(KeyCode.Alpha2))combat.EquipSlot(2);if(Input.GetKeyDown(KeyCode.Alpha3))combat.EquipSlot(3);
                if(Input.GetKeyDown(KeyCode.R))combat.Reload();
                if(mobileFire || (!Application.isMobilePlatform && Input.GetMouseButton(0)))combat.Fire();
            }
            vertical=body.isGrounded ? -2 : Mathf.Max(-25,vertical-20*Time.deltaTime);
            var velocity=new Vector3(move.x,0,move.y)*game.balance.moveSpeed*(focus?.5f:1)*(game.Campaign && game.Campaign.Hunger<=0?.7f:1);
            if(!Application.isMobilePlatform){var right=Camera.main.transform.right;var forward=Camera.main.transform.forward;right.y=forward.y=0;velocity=right.normalized*velocity.x+forward.normalized*velocity.z;}
            body.Move((velocity+Vector3.up*vertical)*Time.deltaTime);
            State=Time.time<actionUntil ? action : focus ? PlayerState.FocusAim : move.sqrMagnitude>.01f ? PlayerState.Move : PlayerState.Idle;
            animationBridge.Motion(velocity.magnitude,focus);
        }
    }
}
