using System.Collections;
using UnityEngine;
namespace SeoulSurvival
{
    public sealed class PrecisionCombat : MonoBehaviour
    {
        public bool GunEquipped { get; private set; }=true;
        public bool RifleEquipped {get;private set;}
        public int EquippedSlot=>GunEquipped?(RifleEquipped?3:1):2;
        public string WeaponLabel=>GunEquipped?(RifleEquipped?"현장 조립 소총":"구호 권총"):"소방도끼";
        public bool Reloading { get; private set; }
        public float Focus { get; private set; }
        public int Magazine { get; private set; }
        public int Reserve { get; private set; }
        public int PistolMagazine=>RifleEquipped?pistolMagazine:Magazine;
        public int RifleMagazine=>RifleEquipped?Magazine:rifleMagazine;
        public AudioClip optionalShot, optionalHeadshot;
        public CombatFeedback feedback;
        GameBootstrap game; TacticalPlayerController player; WeaponData data; LineRenderer left,right; float nextAttack;int pistolMagazine,rifleMagazine;
        public void Initialize(GameBootstrap context,TacticalPlayerController owner)
        {
            game=context; player=owner; data=game.balance.weapon; Magazine=data.magazineSize;pistolMagazine=Magazine; Reserve=data.startingReserve;
            optionalShot=game.assets.shot; optionalHeadshot=game.assets.headshot;
            left=Laser("Aim left"); right=Laser("Aim right");
            feedback=gameObject.AddComponent<CombatFeedback>();feedback.optionalGunPrefab=game.assets.pistolPrefab;feedback.optionalRiflePrefab=game.assets.riflePrefab;feedback.optionalAxePrefab=game.assets.axePrefab;feedback.optionalMuzzlePrefab=game.assets.muzzlePrefab;feedback.optionalImpactPrefab=game.assets.impactPrefab;feedback.Initialize(this);
        }
        LineRenderer Laser(string name) { var go=new GameObject(name); go.transform.SetParent(transform); var line=go.AddComponent<LineRenderer>(); line.positionCount=2; line.startWidth=.025f; line.endWidth=.015f; line.sharedMaterial=Resources.Load<Material>("CombatLine"); return line; }
        public void Equip(bool gun) { EquipSlot(gun?1:2); }
        public bool CycleWeapon() => EquipSlot(EquippedSlot==1?2:EquippedSlot==2 && game.Survival.Count(ResourceKind.ScoutRifle)>0?3:1);
        public bool EquipSlot(int slot)
        {
            if(Reloading || slot<1 || slot>3 || (slot==3 && game.Survival.Count(ResourceKind.ScoutRifle)<1))return false;
            if(RifleEquipped)rifleMagazine=Magazine;else pistolMagazine=Magazine;
            GunEquipped=slot!=2;RifleEquipped=slot==3;data=RifleEquipped?game.balance.scoutRifle:game.balance.weapon;
            Magazine=RifleEquipped?rifleMagazine:pistolMagazine;Focus=0;return true;
        }
        public void AddAmmo(int count) { Reserve+=Mathf.Max(0,count); }
        public void RestoreAmmo(int magazine,int reserve) {RestoreLoadout(1,magazine,0,reserve);}
        public void RestoreLoadout(int slot,int pistol,int rifle,int reserve)
        {Cancel();pistolMagazine=Mathf.Clamp(pistol,0,game.balance.weapon.magazineSize);rifleMagazine=Mathf.Clamp(rifle,0,game.balance.scoutRifle.magazineSize);Reserve=Mathf.Max(0,reserve);GunEquipped=true;RifleEquipped=false;Magazine=pistolMagazine;data=game.balance.weapon;EquipSlot(slot==3&&game.Survival.Count(ResourceKind.ScoutRifle)<1?1:slot);}
        public void SetFocus(bool active) { float workshop=game.Campaign?1+game.Campaign.WorkshopLevel*.08f:1;Focus=active && !Reloading ? Mathf.Clamp01(Focus+Time.deltaTime/data.focusSeconds*workshop) : 0; }
        public void Cancel() { StopAllCoroutines(); Reloading=false; Focus=0; Time.timeScale=1; }
        void LateUpdate()
        {
            if(!left)return;
            left.enabled=right.enabled=GunEquipped && game.Running && !RideableVehicle.ActiveRide;
            float angle=(1-Focus)*data.spreadDegrees;
            var origin=transform.position+Vector3.up*1.2f+transform.forward*.55f;
            Draw(left,origin,-angle); Draw(right,origin,angle);
        }
        void Draw(LineRenderer line,Vector3 origin,float angle)
        {
            var dir=Quaternion.AngleAxis(angle,Vector3.up)*transform.forward;
            float visualRange=Mathf.Min(data.range,18);
            var end=origin+dir*visualRange;
            if(Physics.Raycast(origin,dir,out var hit,visualRange,~0,QueryTriggerInteraction.Ignore))end=hit.point;
            var color=Focus>=.999f ? Color.green : new Color(1,.4f,.1f,.65f);
            line.startColor=line.endColor=color; line.SetPosition(0,origin); line.SetPosition(1,end);
        }
        public void Fire()
        {
            if(!game.Running || RideableVehicle.ActiveRide || game.Survival.CraftingOpen || game.Survival.Searching || (game.Campaign && game.Campaign.PanelOpen) || Reloading || Time.time<nextAttack)return;
            if(!GunEquipped && game.Campaign && !game.Campaign.SpendStamina(game.balance.meleeStamina))return;
            nextAttack=Time.time+(GunEquipped?data.shotInterval:data.meleeInterval);
            player.animationBridge.Attack();
            if(!GunEquipped) { Melee(); return; }
            if(Magazine<=0) { game.Atmosphere.Play(SoundKind.Empty,transform.position); return; }
            Magazine--; player.SetAction(PlayerState.Shoot,.12f);
            game.Atmosphere.Play(SoundKind.Shot,transform.position,data.noiseRadius,optionalShot);
            if(game.Journey)game.Journey.ChangeAlert(game.balance.pursuit.gunshotAlert);
            bool precise=Focus>=.999f;
            var direction=Quaternion.AngleAxis(precise?0:Random.Range(-data.spreadDegrees,data.spreadDegrees),Vector3.up)*transform.forward;
            // Precision is a tactical hit bonus on an unobstructed target, not a wall-penetrating auto-hit.
            var start=transform.position+Vector3.up*1.2f+transform.forward*.55f;
            bool struck=Physics.Raycast(start,direction,out var hit,data.range,~0,QueryTriggerInteraction.Ignore);feedback.Shot(start,struck?hit.point:start+direction*data.range);
            if(struck) {
                var zombie=hit.collider.GetComponentInParent<ZombieAI>();
                if(zombie) {
                    zombie.TakeHit(data.damage*(precise?data.headshotMultiplier:1),precise,precise && Random.value<data.instantKillChance,direction);
                    feedback.Hit(hit.point,data.damage*(precise?data.headshotMultiplier:1),precise);
                    if(precise) { game.Atmosphere.Play(SoundKind.Headshot,hit.point,0,optionalHeadshot); game.CameraRig.Shake(.45f); StartCoroutine(HitStop()); }
                }
            }
        }
        void Melee()
        {
            player.SetAction(PlayerState.MeleeSwing,.3f); game.Atmosphere.Play(SoundKind.Axe,transform.position,5);feedback.Swing();
            foreach(var z in ZombieAI.Active.ToArray()) {
                if(!z)continue; var delta=z.transform.position-transform.position; delta.y=0;
                if(delta.magnitude>data.meleeRange || Vector3.Angle(transform.forward,delta)>data.meleeArc*.5f)continue;
                var start=transform.position+Vector3.up*1.1f;
                if(Physics.Raycast(start,delta.normalized,out var hit,delta.magnitude,~0,QueryTriggerInteraction.Ignore) && hit.collider.GetComponentInParent<ZombieAI>()!=z)continue;
                z.TakeHit(data.meleeDamage*(1+.25f*game.Survival.Count(ResourceKind.AxeUpgrade)),false,false,delta.normalized);
                feedback.Hit(z.transform.position+Vector3.up,data.meleeDamage*(1+.25f*game.Survival.Count(ResourceKind.AxeUpgrade)),false);
            }
        }
        IEnumerator HitStop() { Time.timeScale=.05f; yield return new WaitForSecondsRealtime(.06f); Time.timeScale=1; }
        public void Reload() { if(!game.Running || Reloading || !GunEquipped || Reserve<=0 || Magazine>=data.magazineSize)return; StartCoroutine(ReloadRoutine()); }
        IEnumerator ReloadRoutine() { Reloading=true; Focus=0; player.SetAction(PlayerState.Reload,data.reloadSeconds); game.Atmosphere.Play(SoundKind.Reload,transform.position); yield return new WaitForSeconds(data.reloadSeconds); int amount=Mathf.Min(data.magazineSize-Magazine,Reserve); Magazine+=amount; Reserve-=amount; Reloading=false; }
        void OnDrawGizmosSelected() { if(data==null)return; Gizmos.color=Color.yellow; Vector3 previous=transform.position+Quaternion.AngleAxis(-data.meleeArc/2,Vector3.up)*transform.forward*data.meleeRange; for(int i=1;i<=20;i++){Vector3 p=transform.position+Quaternion.AngleAxis(-data.meleeArc/2+data.meleeArc*i/20,Vector3.up)*transform.forward*data.meleeRange; Gizmos.DrawLine(previous,p);previous=p;} Gizmos.DrawLine(transform.position,previous); }
    }
}
