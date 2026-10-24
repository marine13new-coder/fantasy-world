using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace SeoulSurvival
{
    [Serializable] public class VehicleSave {public Vector3 position;public float remainingRange;}
    [Serializable] public class CampaignData
    {
        public int version=1, completedOperations, shelterLevel, workshopLevel;
        public float elapsed, hunger=100, stamina=100, health=100;
        public int magazine=12, reserve=36;
        public int loadoutVersion,equippedSlot=1,pistolMagazine=12,rifleMagazine;
        public int resolvedJourneyEvents;public float journeyAlert;
        public bool reunionDefense;public float reunionRemaining;
        public Vector3 position=new Vector3(0,.15f,14);
        public bool extractionReady;
        public int completedReliefContracts;
        public bool reliefActive, reliefRecovered;
        public ItemAmount[] inventory=new ItemAmount[0];
        public string[] looted=new string[0], killed=new string[0];
        public VehicleSave[] vehicles=new VehicleSave[0];
        public DistrictHeatSave[] districtHeat=new DistrictHeatSave[0];
    }
    public sealed class SurvivalCampaign : MonoBehaviour
    {
        public static readonly Vector3 Home=new Vector3(0,0,-22);
        public int CompletedOperations {get;private set;}
        public int CompletedReliefContracts {get;private set;}
        public bool ReliefActive {get;private set;}
        public bool ReliefRecovered {get;private set;}
        public ReliefContractData CurrentRelief => game.balance.reliefContracts[CompletedReliefContracts%game.balance.reliefContracts.Length];
        public int ShelterLevel {get;private set;}
        public int WorkshopLevel {get;private set;}
        public float Elapsed {get;private set;}
        public float Hunger {get;private set;}=100;
        public float Stamina {get;private set;}=100;
        public int Day=>1+Mathf.FloorToInt(Elapsed/game.balance.daySeconds);
        public bool AtHome=>game.Player && Vector3.Distance(game.Player.transform.position,Home)<9;
        public bool PanelOpen {get;private set;}
        public string Status {get;private set;}="주민센터 거점 · 식량과 부품을 비축하세요.";
        public string SavePath {get;set;}
        public bool PersistenceEnabled {get;private set;}
        GameBootstrap game; bool saveBlocked,recoveredBackup; float nextSave=45,starvation; GameObject shelter;
        public void Initialize(GameBootstrap context,bool persistence,string journeySlot=null)
        {
            game=context; PersistenceEnabled=persistence; SavePath=Path.Combine(Application.persistentDataPath,journeySlot==null?"campaign-v1.json":"campaign-v1-"+journeySlot+".json");
            BuildShelter(); if(persistence)Load(); UpdateObjective();
        }
        void BuildShelter()
        {
            shelter=new GameObject("주민센터 · 생존 거점"); shelter.transform.position=Home;
            var t=shelter.transform;
            WorldFactory.Box("Raised courtyard",t,new Vector3(0,-.03f,0),new Vector3(16,.1f,12),new Color(.27f,.32f,.32f));
            WorldFactory.Box("Back wall",t,new Vector3(0,1.5f,-5),new Vector3(16,3,.3f),new Color(.23f,.3f,.32f));
            for(int i=-1;i<=1;i+=2)WorldFactory.Box("Gate pillar",t,new Vector3(i*7,1.5f,4),new Vector3(.6f,3,.6f),new Color(.23f,.3f,.32f));
            WorldFactory.Label(t,"주민센터 · 생존 거점",new Vector3(0,3.1f,-4.7f),new Color(.4f,1,.85f),.2f);
            PlaceProp("Workbench",new Vector3(-4,0,0)); PlaceProp("Bedroll",new Vector3(4,0,-2)); PlaceProp("Barrel",new Vector3(5,0,1));
            WorldFactory.Box("Radio station",t,new Vector3(0,.5f,-3),new Vector3(2,1,.8f),new Color(.12f,.5f,.43f));
            var lamp=new GameObject("Shelter beacon").AddComponent<Light>(); lamp.transform.SetParent(t,false);lamp.transform.localPosition=new Vector3(0,4,0);lamp.type=LightType.Point;lamp.range=18;lamp.intensity=2;lamp.color=new Color(.4f,1,.8f);
        }
        void PlaceProp(string name,Vector3 p) { var prefab=Resources.Load<GameObject>("Props/"+name);if(prefab){var obj=Instantiate(prefab,shelter.transform);obj.transform.localPosition=p;} }
        public void TogglePanel() { if(AtHome && game.Running)PanelOpen=!PanelOpen; }
        public bool AcceptRelief()
        {
            if(!AtHome || !game.Running || ReliefActive)return false;
            ReliefActive=true;ReliefRecovered=false;Status=CurrentRelief.title+" · 해당 시설의 새 상자를 수색하세요.";SaveNow();return true;
        }
        public void RecordReliefLoot(Facility facility)
        {
            if(!ReliefActive || ReliefRecovered || CurrentRelief.facility!=facility)return;
            ReliefRecovered=true;Status=CurrentRelief.title+" 확보 · 주민센터로 돌아오세요.";
        }
        public bool DeliverRelief()
        {
            if(!AtHome || !game.Running || !ReliefActive || !ReliefRecovered)return false;
            var contract=CurrentRelief;game.Survival.Add(contract.reward.item,contract.reward.count);
            CompletedReliefContracts++;ReliefActive=false;ReliefRecovered=false;
            Status=contract.title+" 전달 완료 · "+contract.reward.item+" "+contract.reward.count+"개 보상";SaveNow();return true;
        }
        public void UpdateObjective() { if(game.Survival.Tower)game.Survival.Tower.position=new Vector3(CompletedOperations*RealWorldMapManager.ChunkSize,0,108); }
        public bool Upgrade(bool workshop)
        {
            int level=workshop?WorkshopLevel:ShelterLevel; int scrap=6+level*4,electronics=2+level;
            if(!AtHome || !game.Running || level>=5 || game.Survival.Count(ResourceKind.Scrap)<scrap || game.Survival.Count(ResourceKind.Electronics)<electronics)return false;
            game.Survival.Inventory[ResourceKind.Scrap]-=scrap;game.Survival.Inventory[ResourceKind.Electronics]-=electronics;
            if(workshop)WorkshopLevel++;else ShelterLevel++;
            Status=workshop?"작업대 개선 · 조준 안정성과 탄약 제작 효율 증가":"주민센터 개선 · 식량 소비 감소";SaveNow();return true;
        }
        public bool Rest()
        {
            if(!AtHome || !game.Running || game.Survival.Defending || game.Survival.Count(ResourceKind.Food)<2)return false;
            game.Survival.Inventory[ResourceKind.Food]-=2;Elapsed+=game.balance.daySeconds*.25f;Hunger=100;Stamina=100;game.Player.Heal(game.balance.playerHealth);
            if(game.Journey)game.Journey.ChangeAlert(-game.balance.pursuit.restRecovery);
            Status="식량 2개로 휴식 · 체력과 체력 소모 회복";SaveNow();return true;
        }
        public void Eat()
        {
            if(!game.Running || game.Survival.Count(ResourceKind.Food)<1)return;
            game.Survival.Inventory[ResourceKind.Food]--;Hunger=Mathf.Min(100,Hunger+35);Status="식량 섭취 · 포만감 회복";
        }
        public bool SpendStamina(float amount) { if(Stamina<amount)return false;Stamina-=amount;return true; }
        public void Drink()
        {
            if(!game.Running)return;
            if(game.Survival.Count(ResourceKind.Water)>0) {game.Survival.Inventory[ResourceKind.Water]--;Stamina=Mathf.Min(100,Stamina+25);Hunger=Mathf.Min(100,Hunger+8);Status="생수 섭취 · 기력과 포만감 회복";}
            else if(game.Survival.Count(ResourceKind.Stamina)>0) {game.Survival.Inventory[ResourceKind.Stamina]--;Stamina=Mathf.Min(100,Stamina+50);Status="기력 음료 섭취";}
        }
        public void ReturnHome()
        {
            if(!game.Survival.Victory)return;
            CompletedOperations++;Elapsed+=game.balance.daySeconds*.25f;
            game.Survival.Add(ResourceKind.Food,3);game.Survival.Add(ResourceKind.Scrap,4);game.Survival.Add(ResourceKind.Electronics,2);
            game.Player.Restore(Home+Vector3.forward*2+Vector3.up*.15f,game.balance.playerHealth);
            foreach(var zombie in ZombieAI.Active.ToArray())if(zombie && string.IsNullOrEmpty(zombie.persistentId))Destroy(zombie.gameObject);
            game.Survival.ContinueCampaign();UpdateObjective();PanelOpen=true;Status="구호 물자 전달 완료 · 다음 지역 작전이 열렸습니다.";SaveNow();
        }
        void Update()
        {
            if(!game || !game.Running)return;
            Elapsed+=Time.deltaTime;
            Hunger=Mathf.Max(0,Hunger-Time.deltaTime*game.balance.hungerPerMinute/60/(1+ShelterLevel*.15f));
            Stamina=Mathf.Min(100,Stamina+Time.deltaTime*(Hunger>0?game.balance.staminaRecovery:2));
            if(Hunger<=0) {starvation+=Time.deltaTime;if(starvation>=5){starvation=0;game.Player.Damage(2);}}
            if(Input.GetKeyDown(KeyCode.B))TogglePanel();if(Input.GetKeyDown(KeyCode.F))Eat();if(Input.GetKeyDown(KeyCode.T))Drink();if(Input.GetKeyDown(KeyCode.F5))SaveNow();
            if(!AtHome)PanelOpen=false;
            if(Time.unscaledTime>=nextSave){nextSave=Time.unscaledTime+45;SaveNow();}
        }
        public CampaignData Capture()
        {
            var inventory=new List<ItemAmount>();foreach(var p in game.Survival.Inventory)inventory.Add(new ItemAmount(p.Key,p.Value));
            var vehicles=new List<VehicleSave>();if(game.Journey)foreach(var vehicle in game.Journey.Vehicles)vehicles.Add(new VehicleSave{position=vehicle.transform.position,remainingRange=vehicle.RemainingRange});
            return new CampaignData{completedOperations=CompletedOperations,completedReliefContracts=CompletedReliefContracts,reliefActive=ReliefActive,reliefRecovered=ReliefRecovered,shelterLevel=ShelterLevel,workshopLevel=WorkshopLevel,elapsed=Elapsed,hunger=Hunger,stamina=Stamina,health=game.Player.Health,position=game.Player.transform.position,magazine=game.Player.combat.Magazine,reserve=game.Player.combat.Reserve,loadoutVersion=1,equippedSlot=game.Player.combat.EquippedSlot,pistolMagazine=game.Player.combat.PistolMagazine,rifleMagazine=game.Player.combat.RifleMagazine,resolvedJourneyEvents=game.Journey?game.Journey.ResolvedEvents:0,journeyAlert=game.Journey?game.Journey.Alert:0,reunionDefense=game.Journey && game.Journey.ReunionDefense,reunionRemaining=game.Journey?game.Journey.ReunionRemaining:0,extractionReady=game.Survival.Victory,inventory=inventory.ToArray(),looted=new List<string>(game.Survival.Looted).ToArray(),killed=new List<string>(game.Survival.Killed).ToArray(),vehicles=vehicles.ToArray(),districtHeat=game.Pressure.Capture()};
        }
        public static CampaignData Parse(string json)
        {
            if(string.IsNullOrWhiteSpace(json) || json.Length>8*1024*1024 || !json.Contains("\"version\"") || !json.Contains("\"inventory\""))throw new InvalidDataException("Save size or required fields invalid");
            var d=JsonUtility.FromJson<CampaignData>(json);
            if(d==null || d.version!=1 || d.inventory==null || d.looted==null || d.killed==null || d.completedOperations<0 || d.completedOperations>10000 || d.shelterLevel<0 || d.shelterLevel>5 || d.workshopLevel<0 || d.workshopLevel>5 || d.magazine<0 || d.reserve<0 || d.reserve>1000000 || d.inventory.Length>64 || d.looted.Length>100000 || d.killed.Length>100000)throw new InvalidDataException("Save structure invalid");
            foreach(float n in new[]{d.elapsed,d.hunger,d.stamina,d.health,d.position.x,d.position.y,d.position.z})if(float.IsNaN(n)||float.IsInfinity(n))throw new InvalidDataException("Non-finite save value");
            if(d.elapsed<0||d.health<=0||d.health>100000||d.hunger<0||d.hunger>100||d.stamina<0||d.stamina>100||d.position.sqrMagnitude>1e14f || d.loadoutVersion<0 || d.loadoutVersion>1 || (d.loadoutVersion==1 && (d.equippedSlot<1 || d.equippedSlot>3 || d.pistolMagazine<0 || d.rifleMagazine<0)) || d.resolvedJourneyEvents<0 || d.resolvedJourneyEvents>255 || float.IsNaN(d.journeyAlert) || d.journeyAlert<-.3f || d.journeyAlert>.7f || float.IsNaN(d.reunionRemaining) || d.reunionRemaining<0 || d.reunionRemaining>3600 || d.completedReliefContracts<0 || d.completedReliefContracts>100000 || d.reliefRecovered && !d.reliefActive)throw new InvalidDataException("Save values out of range");
            if(d.vehicles!=null){if(d.vehicles.Length>2)throw new InvalidDataException("Invalid vehicle count");foreach(var vehicle in d.vehicles)if(vehicle==null || vehicle.position.sqrMagnitude>1e14f || float.IsNaN(vehicle.remainingRange) || vehicle.remainingRange<0 || vehicle.remainingRange>1000000)throw new InvalidDataException("Invalid vehicle state");}
            if(d.districtHeat!=null){if(d.districtHeat.Length>64)throw new InvalidDataException("Invalid district heat count");var chunks=new HashSet<Vector2Int>();foreach(var entry in d.districtHeat)if(entry==null || Mathf.Abs(entry.x)>10000 || Mathf.Abs(entry.y)>10000 || float.IsNaN(entry.heat) || float.IsInfinity(entry.heat) || entry.heat<0 || entry.heat>1 || !chunks.Add(new Vector2Int(entry.x,entry.y)))throw new InvalidDataException("Invalid district heat");}
            var seen=new HashSet<ResourceKind>();foreach(var item in d.inventory)if(item==null || !Enum.IsDefined(typeof(ResourceKind),item.item) || !seen.Add(item.item) || item.count<0 || item.count>1000000)throw new InvalidDataException("Invalid inventory");
            foreach(var id in d.looted)if(string.IsNullOrEmpty(id)||id.Length>200)throw new InvalidDataException("Invalid loot id");foreach(var id in d.killed)if(string.IsNullOrEmpty(id)||id.Length>200)throw new InvalidDataException("Invalid zombie id");return d;
        }
        public void Restore(CampaignData d)
        {
            CompletedOperations=d.completedOperations;CompletedReliefContracts=d.completedReliefContracts;ReliefActive=d.reliefActive;ReliefRecovered=d.reliefRecovered;ShelterLevel=d.shelterLevel;WorkshopLevel=d.workshopLevel;Elapsed=d.elapsed;Hunger=d.hunger;Stamina=d.stamina;
            game.Survival.Inventory.Clear();foreach(var item in d.inventory)game.Survival.Inventory[item.item]=item.count;
            game.Survival.Looted.Clear();foreach(var id in d.looted)game.Survival.Looted.Add(id);
            game.Survival.Killed.Clear();foreach(var id in d.killed)game.Survival.Killed.Add(id);
            game.Player.Restore(d.position,d.health);if(d.loadoutVersion==1)game.Player.combat.RestoreLoadout(d.equippedSlot,d.pistolMagazine,d.rifleMagazine,d.reserve);else game.Player.combat.RestoreAmmo(d.magazine,d.reserve);game.Survival.RestoreCompleted(d.extractionReady);UpdateObjective();
            if(game.Journey)game.Journey.RestoreEvents(d.resolvedJourneyEvents,d.journeyAlert);
            if(game.Journey)game.Journey.RestoreReunion(d.reunionDefense,d.reunionRemaining);
            game.Pressure.Restore(d.districtHeat);
            if(d.vehicles!=null && game.Journey)for(int i=0;i<Mathf.Min(d.vehicles.Length,game.Journey.Vehicles.Count);i++)game.Journey.Vehicles[i].Restore(d.vehicles[i].position,d.vehicles[i].remainingRange);
        }
        public bool SaveNow()
        {
            if(!PersistenceEnabled || saveBlocked || !game.Player || game.Player.State==PlayerState.Dead)return false;
            // shortcut: active waves are checkpointed before activation; persist individual enemies before enabling mid-defense saves.
            if(game.Survival.Defending){Status="방어 중 저장 유예 · 직전 체크포인트 유지";return false;}
            try {
                string json=JsonUtility.ToJson(Capture(),true);Parse(json);Directory.CreateDirectory(Path.GetDirectoryName(SavePath));string temp=SavePath+".tmp";
                File.WriteAllText(temp,json);if(File.Exists(SavePath))File.Replace(temp,SavePath,recoveredBackup?null:SavePath+".bak");else File.Move(temp,SavePath);recoveredBackup=false;
                Status="저장 완료 · "+DateTime.Now.ToString("HH:mm");return true;
            }catch(Exception e){Status="저장 실패 · 기존 파일 보존";Debug.LogWarning("Campaign save: "+e.Message);return false;}
        }
        public bool Load()
        {
            foreach(string path in new[]{SavePath,SavePath+".bak"}) {
                if(!File.Exists(path))continue;
                try {if(new FileInfo(path).Length>8*1024*1024)throw new InvalidDataException("Save too large");var d=Parse(File.ReadAllText(path));Restore(d);saveBlocked=false;recoveredBackup=path.EndsWith(".bak");Status=recoveredBackup?"백업 저장 복구":"장기 생존 이어하기";return true;}
                catch(Exception e){saveBlocked=true;Debug.LogWarning("Campaign load: "+e.Message);}
            }
            if(saveBlocked)Status="저장 파일 손상 · 원본 보존 중 (Docs/SAVE_SYSTEM.md 참고)";return false;
        }
        void OnApplicationPause(bool paused){if(paused && game)SaveNow();}
        void OnApplicationQuit(){if(game)SaveNow();}
        void OnGUI()
        {
            if(!game)return;if(WorldFactory.KoreanFont)GUI.skin.font=WorldFactory.KoreanFont;float scale=Mathf.Clamp(Screen.height/900f,.65f,1.6f);GUI.matrix=Matrix4x4.Scale(Vector3.one*scale);float width=Screen.width/scale;
            var oldColor=GUI.color;GUI.color=new Color(.025f,.055f,.07f,.92f);GUI.DrawTexture(new Rect(width-355,18,337,147),Texture2D.whiteTexture);GUI.color=oldColor;
            GUI.Label(new Rect(width-340,26,310,25),$"생존 {Day}일째 · 구호 {CompletedOperations}회 / 회수 {CompletedReliefContracts}회");
            GUI.Label(new Rect(width-340,52,310,25),$"포만감 {Hunger:0} · 기력 {Stamina:0} · 거점 {ShelterLevel}");
            GUI.Label(new Rect(width-340,80,310,25),ReliefActive?(ReliefRecovered?"회수 완료 · 주민센터로 복귀":"회수 의뢰 · "+CurrentRelief.title):AtHome?"안전 구역 · B 거점 / F 식사 / T 음료":"F 식사 · T 음료 · F5 저장");
            GUI.Label(new Rect(width-340,108,310,45),Status);
            if(PanelOpen && game.Running) {
                GUI.Box(new Rect(width/2-250,220,500,360),"주민센터 · 장기 생존 거점");GUILayout.BeginArea(new Rect(width/2-225,260,450,300));
                GUILayout.Label("모은 물자와 지역 파밍 이력은 다음 실행에도 유지됩니다.");
                GUILayout.Label(ReliefActive?ReliefRecovered?"회수 완료 · 거점에 전달하세요.":CurrentRelief.title+" · 새 상자를 찾으세요.":"다음 회수 의뢰 · "+CurrentRelief.title);
                if(!ReliefActive && GUILayout.Button("시설 회수 의뢰 수락"))AcceptRelief();
                if(ReliefRecovered && GUILayout.Button("회수 물자 전달 · "+CurrentRelief.reward.item+" "+CurrentRelief.reward.count+"개 보상"))DeliverRelief();
                if(GUILayout.Button("휴식 · 식량 2개 / 체력·포만감·기력 회복"))Rest();
                if(GUILayout.Button($"거점 개선 {ShelterLevel}/5 · 고철 {6+ShelterLevel*4} / 전자 {2+ShelterLevel}"))Upgrade(false);
                if(GUILayout.Button($"작업대 {WorkshopLevel}/5 · 고철 {6+WorkshopLevel*4} / 전자 {2+WorkshopLevel}"))Upgrade(true);
                if(GUILayout.Button("저장"))SaveNow();
                if(game.Journey && game.Journey.Plan.fromName!=game.Journey.Plan.toName && GUILayout.Button("현재 작전 저장 후 새 목적지 선택"))game.Journey.ChooseNewJourney();
                if(GUILayout.Button("출정 준비 완료 · 닫기"))PanelOpen=false;GUILayout.EndArea();
            }
            GUI.matrix=Matrix4x4.identity;
        }
        void OnDestroy(){if(shelter)Destroy(shelter);}
    }
}
