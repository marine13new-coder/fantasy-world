using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AI;
using UnityEngine.SceneManagement;
namespace SeoulSurvival
{
    public sealed class SurvivalAndEscapeManager : MonoBehaviour
    {
        public readonly HashSet<string> Looted=new HashSet<string>(), Killed=new HashSet<string>();
        public readonly Dictionary<ResourceKind,int> Inventory=new Dictionary<ResourceKind,int>();
        public bool CraftingOpen {get;private set;} public bool Victory {get;private set;} public bool Defending {get;private set;}
        public float Remaining {get;private set;} public Transform Tower {get;private set;}
        public float SignalSeconds {get;private set;} public float SignalLock {get;private set;}
        public bool Searching {get;private set;}
        public GameObject optionalBarricadePrefab,optionalHelicopterPrefab;
        GameBootstrap game; float nextWave; string message="실내 상자에서 E로 자원 확보 → C로 수리 키트 제작"; Font font; GameObject helicopter;
        public void Initialize(GameBootstrap context)
        {
            game=context; optionalBarricadePrefab=game.assets.barricadePrefab; optionalHelicopterPrefab=game.assets.helicopterPrefab;
            Tower=new GameObject("Rescue transmitter").transform; Tower.position=new Vector3(0,0,108);
            WorldFactory.Box("Tower mast",Tower,new Vector3(0,5,0),new Vector3(1.5f,10,1.5f),new Color(.5f,.15f,.75f));
            WorldFactory.Box("Antenna",Tower,new Vector3(0,9,0),new Vector3(7,.3f,.3f),Color.magenta,false);
            WorldFactory.Box("Terminal",Tower,new Vector3(0,.75f,-2),new Vector3(1.5f,1.5f,.5f),Color.magenta);
            WorldFactory.Label(Tower,"보조 임무 · 무전탑 / E",new Vector3(0,4,-1),Color.magenta,.3f);
            var light=Tower.gameObject.AddComponent<Light>(); light.type=LightType.Point; light.color=Color.magenta; light.range=15; light.intensity=2;
            font=WorldFactory.KoreanFont?WorldFactory.KoreanFont:Font.CreateDynamicFontFromOSFont(new[]{"Malgun Gothic","Noto Sans CJK KR","Arial"},16);
        }
        public int Count(ResourceKind kind) => Inventory.TryGetValue(kind,out int count)?count:0;
        public void Add(ResourceKind kind,int count) { if(count<=0)return; if(kind==ResourceKind.Ammo)game.Player.combat.AddAmmo(count); else Inventory[kind]=Count(kind)+count; }
        public void ToggleCrafting() { if(game.Running && !Searching && !(game.Campaign && game.Campaign.PanelOpen))CraftingOpen=!CraftingOpen; }
        public bool CanCraft(Recipe recipe)
        {
            var required=new Dictionary<ResourceKind,int>(); foreach(var cost in recipe.costs) { required.TryGetValue(cost.item,out int n); required[cost.item]=n+cost.count; }
            foreach(var pair in required)if(Count(pair.Key)<pair.Value)return false; return true;
        }
        public bool Craft(int index)
        {
            if(!game.Running || index<0 || index>=game.balance.recipes.Length)return false;
            var recipe=game.balance.recipes[index]; if(!CanCraft(recipe)) { message="자원이 부족합니다.";return false; }
            Vector3 place=game.Player.transform.position+game.Player.transform.forward*3;
            if(recipe.barricade && Physics.CheckBox(place+Vector3.up*.7f,new Vector3(1.7f,.7f,.4f),game.Player.transform.rotation,1<<8,QueryTriggerInteraction.Ignore)) { message="설치할 공간이 없습니다.";return false; }
            foreach(var cost in recipe.costs)Inventory[cost.item]=Count(cost.item)-cost.count;
            if(recipe.barricade) {
                var barricade=optionalBarricadePrefab?Instantiate(optionalBarricadePrefab,place,game.Player.transform.rotation):WorldFactory.Box("Barricade",null,place+Vector3.up*.7f,new Vector3(3.4f,1.4f,.8f),new Color(.45f,.3f,.15f));
                barricade.transform.rotation=game.Player.transform.rotation; if(!barricade.GetComponent<Collider>())barricade.AddComponent<BoxCollider>();
                barricade.layer=8; var obstacle=barricade.AddComponent<NavMeshObstacle>(); obstacle.shape=NavMeshObstacleShape.Box; obstacle.size=optionalBarricadePrefab?new Vector3(3.4f,1.4f,.8f):Vector3.one; obstacle.carving=true;
            } else Add(recipe.output,recipe.count+(recipe.output==ResourceKind.Ammo && game.Campaign?game.Campaign.WorkshopLevel*2:0));
            message=recipe.name+" 완료"; return true;
        }
        public void Interact(bool careful=false)
        {
            if(!game.Running || CraftingOpen || Searching)return;
            if(game.Campaign && game.Campaign.AtHome){game.Campaign.TogglePanel();return;}
            if(Vector3.Distance(game.Player.transform.position,Tower.position)<4) { ActivateTower();return; }
            LootBox best=null; float distance=2.5f;
            foreach(var box in FindObjectsByType<LootBox>(FindObjectsSortMode.None)) { float d=Vector3.Distance(box.transform.position,game.Player.transform.position); if(!box.Opened && d<distance && !Physics.Linecast(game.Player.transform.position+Vector3.up,box.transform.position+Vector3.up,1<<8,QueryTriggerInteraction.Ignore)) {best=box;distance=d;} }
            if(best && careful){StartCoroutine(SearchCarefully(best));return;}
            if(best && best.TryOpen()) { game.Player.SetAction(PlayerState.Interact,.3f); message="급속 수색 · 물자 확보 / 소음과 추격 증가"; } else message="상자 또는 송신탑 가까이에서 E";
        }
        System.Collections.IEnumerator SearchCarefully(LootBox box)
        {
            Searching=true;var start=game.Player.transform.position;float health=game.Player.Health;float duration=game.balance.carefulSearchSeconds;
            game.Player.SetAction(PlayerState.Interact,duration);game.Atmosphere.Play(SoundKind.Reload,start,game.balance.pursuit.carefulSearchNoise);message="정밀 분해 중 · 피격 시 중단";
            float elapsed=0;while(elapsed<duration){if(!box || !game.Running || game.Player.Health<health || Vector3.Distance(start,game.Player.transform.position)>.5f){Searching=false;yield break;}elapsed+=Time.deltaTime;yield return null;}
            if(box && box.TryOpen(true))message="정밀 분해 완료 · 추가 부품 / 동네 소음은 소폭 남음";Searching=false;
        }
        public void ContinueCampaign(){Victory=false;Defending=false;CraftingOpen=false;if(helicopter)Destroy(helicopter);message="다음 지역 구호 작전 · 물자를 준비하세요.";}
        public void RestoreCompleted(bool completed){Victory=completed;Defending=false;}
        public bool ActivateTower()
        {
            if(Defending || Victory || !game.Running)return false;
            if(Count(ResourceKind.RepairKit)<1) { message="수리 키트가 필요합니다. 학교와 업무지구에서 부품을 확보하세요.";return false; }
            if(game.Campaign)game.Campaign.SaveNow();
            Inventory[ResourceKind.RepairKit]--; Defending=true; Remaining=game.balance.defenseSeconds; SignalSeconds=game.balance.signalWindowSeconds; nextWave=Time.time; game.Atmosphere.Play(SoundKind.Siren,Tower.position,180); message="구호 작전! 탑 정밀 조준으로 신호를 갱신하세요.";return true;
        }
        public void UseHealing()
        {
            var kind=Count(ResourceKind.Medkit)>0?ResourceKind.Medkit:ResourceKind.Food; if(Count(kind)<=0)return;
            Inventory[kind]--; game.Player.Heal(kind==ResourceKind.Medkit?40:15);
        }
        public bool UseFlare()
        {
            if(!game.Running || CraftingOpen || Count(ResourceKind.SignalFlare)<1)return false;
            var origin=game.Player.transform.position+Vector3.up;
            var target=origin+game.Player.transform.forward*16;
            if(Physics.Raycast(origin,game.Player.transform.forward,out var hit,16,1<<8,QueryTriggerInteraction.Ignore))target=hit.point-game.Player.transform.forward;
            if(!NavMesh.SamplePosition(target,out var place,4,NavMesh.AllAreas))return false;
            Inventory[ResourceKind.SignalFlare]--;
            StartCoroutine(Flare(place.position));message="신호탄 투척 · 좀비가 불빛과 소리를 향해 이동합니다.";return true;
        }
        System.Collections.IEnumerator Flare(Vector3 position)
        {
            var marker=game.assets.flarePrefab?Instantiate(game.assets.flarePrefab,position,Quaternion.identity):WorldFactory.Box("유인 신호탄",null,position+Vector3.up*.3f,new Vector3(.35f,.6f,.35f),new Color(1,.25f,.1f),false);
            foreach(var collider in marker.GetComponentsInChildren<Collider>())collider.enabled=false;
            var glow=marker.AddComponent<Light>();glow.type=LightType.Point;glow.color=new Color(1,.25f,.1f);glow.range=9;glow.intensity=3;
            game.Atmosphere.Play(SoundKind.Siren,position,game.balance.flareNoiseRadius);
            float end=Time.time+game.balance.flareDuration;
            while(Time.time<end) {yield return new WaitForSeconds(1);if(Time.time<end)ZombieAI.HearNoise(position,game.balance.flareNoiseRadius);}
            Destroy(marker);
        }
        void Update()
        {
            if(Input.GetKeyDown(KeyCode.C))ToggleCrafting(); if(Input.GetKeyDown(KeyCode.E))Interact(); if(Input.GetKeyDown(KeyCode.V))Interact(true); if(Input.GetKeyDown(KeyCode.H) && game.Running)UseHealing(); if(Input.GetKeyDown(KeyCode.Q))UseFlare();
            if(!Defending || !game.Running)return;
            bool inZone=Vector3.Distance(game.Player.transform.position,Tower.position)<40;
            var toTower=Tower.position-game.Player.transform.position; toTower.y=0;
            bool syncing=inZone && game.Player.combat.GunEquipped && game.Player.combat.Focus>=.999f && game.Player.State!=PlayerState.Shoot && Vector3.Angle(game.Player.transform.forward,toTower)<10 && !Physics.Linecast(game.Player.transform.position+Vector3.up,Tower.position+Vector3.up,1<<8,QueryTriggerInteraction.Ignore);
            SignalLock=syncing?Mathf.Clamp01(SignalLock+Time.deltaTime/game.balance.signalLockSeconds):0;
            if(SignalLock>=1) { SignalSeconds=game.balance.signalWindowSeconds; SignalLock=0; game.Atmosphere.Play(SoundKind.Loot,Tower.position); }
            if(inZone && SignalSeconds>0) { Remaining=Mathf.Max(0,Remaining-Time.deltaTime); SignalSeconds=Mathf.Max(0,SignalSeconds-Time.deltaTime); }
            else message=inZone?"신호 끊김! 탑을 향해 우클릭을 유지하세요.":"방어 구역 이탈: 송신탑으로 돌아오세요.";
            if(Time.time>=nextWave) {
                nextWave=Time.time+4;
                for(int i=0;i<4;i++) { float angle=(i*90+Random.Range(-25,25))*Mathf.Deg2Rad; var pos=Tower.position+new Vector3(Mathf.Sin(angle),0,Mathf.Cos(angle))*Random.Range(22,35);
                    if(NavMesh.SamplePosition(pos,out var p,8,NavMesh.AllAreas)) { var z=ZombieAI.Spawn(p.position); if(z)z.Alert(game.Player.transform.position); }
                }
                ZombieAI.HearNoise(Tower.position,180);
            }
            if(Remaining<=0)Win();
        }
        void Win()
        {
            Victory=true; Defending=false; CraftingOpen=false; game.Player.combat.Cancel(); message="구호 작전 성공 · 주민센터로 복귀할 수 있습니다.";if(game.Campaign)game.Campaign.SaveNow();
            var p=Tower.position+new Vector3(0,8,-7);
            helicopter=optionalHelicopterPrefab?Instantiate(optionalHelicopterPrefab,p,Quaternion.identity):new GameObject("Rescue helicopter"); helicopter.transform.position=p;
            if(!optionalHelicopterPrefab) { WorldFactory.Box("Cabin",helicopter.transform,Vector3.zero,new Vector3(3,2,5),new Color(.15f,.22f,.2f),false); WorldFactory.Box("Tail",helicopter.transform,new Vector3(0,.2f,-4),new Vector3(.5f,.6f,5),Color.gray,false); WorldFactory.Box("Rotor",helicopter.transform,new Vector3(0,1.4f,0),new Vector3(11,.1f,.3f),Color.black,false); }
        }
        void OnGUI()
        {
            if(!game || !game.Player || (game.Journey && !game.Journey.Ready))return;
            GUI.skin.font=font; GUI.skin.label.fontSize=16; GUI.skin.button.fontSize=16; GUI.skin.box.fontSize=16;
            float scale=Mathf.Clamp(Screen.height/900f,.65f,1.6f); GUI.matrix=Matrix4x4.Scale(Vector3.one*scale); float width=Screen.width/scale,height=Screen.height/scale;
            Fill(new Rect(18,18,370,190),new Color(.025f,.055f,.07f,.92f));Fill(new Rect(18,18,3,190),new Color(.35f,.9f,.72f));GUILayout.BeginArea(new Rect(32,26,343,170));
            GUILayout.Label("SEOUL / WAY HOME   ·   "+game.Map.AreaLabel);
            GUILayout.Label($"체력 {game.Player.Health:0}     탄약 {game.Player.combat.Magazine} / {game.Player.combat.Reserve}");
            GUILayout.Label($"{game.Player.combat.EquippedSlot} {game.Player.combat.WeaponLabel}   조준 안정도 {game.Player.combat.Focus*100:0}%");
            GUILayout.Label($"보조 임무: 송신탑 {Vector3.Distance(game.Player.transform.position,Tower.position):0}m");
            GUILayout.Label(Defending?$"구조까지 {Remaining:0.0}초 · 신호 유지 {SignalSeconds:0}초":message);
            if(Defending)GUILayout.Label(SignalSeconds<=0?$"신호 끊김! 탑 우클릭 조준 · 동기화 {SignalLock*100:0}%":$"탑 우클릭 조준으로 신호 갱신 · {SignalLock*100:0}%"); GUILayout.EndArea();
            GUI.Label(new Rect(22,height-102,width-44,26),game.Atmosphere.Caption);
            GUI.Label(new Rect(22,height-75,width-44,25),"WASD 이동 · 우클릭 정밀조준 · 좌클릭 공격 · 1 권총 / 2 도끼 / 3 조립 소총 · R 장전 · E 수색 / V 정밀분해 · C 조합 · H 회복 · Q 유인탄");
            GUI.Label(new Rect(22,height-49,width-44,24),"M 지역도 · G 탈것 탑승/내리기 · J 전기 스쿠터 배터리 충전 · F 식사 · T 물/음료 · B 거점 · F5 저장");
            GUI.Label(new Rect(22,height-26,width-44,24),"지도 © OpenStreetMap contributors / ODbL · 실내와 보충 시설은 게임용 재구성");
            if(CraftingOpen && game.Running) {
                GUI.Box(new Rect(width/2-260,220,520,410),"현장 조합 — 창을 열어도 위험은 계속됩니다"); GUILayout.BeginArea(new Rect(width/2-240,260,480,355));
                foreach(var pair in Inventory)GUILayout.Label(pair.Key+": "+pair.Value);
                for(int i=0;i<game.balance.recipes.Length;i++) { var r=game.balance.recipes[i]; string costs=""; foreach(var cost in r.costs)costs+=$" {cost.item} {cost.count}"; GUI.enabled=CanCraft(r); if(GUILayout.Button(r.name+" /"+costs))Craft(i); }
                GUI.enabled=true; if(GUILayout.Button("닫기 (C)"))ToggleCrafting(); GUILayout.EndArea();
            }
            if(!game.Running) { GUI.Box(new Rect(width/2-250,height/2-100,500,200),Victory?"구호 작전 성공 · 생존은 계속됩니다":"생존 실패"); GUI.Label(new Rect(width/2-220,height/2-45,440,60),Victory?"물자를 거점으로 가져가고 다음 지역을 준비하세요.":"마지막 저장에서 다시 준비할 수 있습니다."); if(GUI.Button(new Rect(width/2-120,height/2+30,240,45),Victory?"주민센터 복귀 · 장기 생존 계속":"마지막 저장에서 이어하기")){if(Victory)game.Campaign.ReturnHome();else SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);} }
            GUI.matrix=Matrix4x4.identity;
        }
        static void Fill(Rect rect,Color color){var previous=GUI.color;GUI.color=color;GUI.DrawTexture(rect,Texture2D.whiteTexture);GUI.color=previous;}
        void OnDestroy() { if(Tower)Destroy(Tower.gameObject); if(helicopter)Destroy(helicopter); }
    }
}
