using System;
using System.Globalization;
using System.IO;
using UnityEngine;
using UnityEngine.AI;
using UnityEngine.SceneManagement;

namespace SeoulSurvival
{
    [Serializable] public class JourneyPlan
    {
        public int version=1;
        public string fromName,toName;
        public double fromLat,fromLon,toLat,toLon;
        public bool reached;
    }

    // A local Seoul-area pilot. Bundled POI names and coordinates work offline; arbitrary addresses need a licensed geocoder.
    public sealed class JourneyDirector : MonoBehaviour
    {
        public bool Ready {get;private set;}
        public bool Reached {get;private set;}
        public JourneyPlan Plan {get;private set;}
        public float Progress {get;private set;}
        public float RemainingMetres {get;private set;}
        public Vector3 Target=>target;
        public bool ReunionDefense {get;private set;}
        public float ReunionRemaining {get;private set;}
        public string Status {get;private set;}="출발지와 목적지를 입력하세요.";
        GameBootstrap game;bool persistence;string from="노원역",to="잠실역";Vector3 target;float total,nextEncounter;
        int resolvedEvents,pendingEvent=-1;float alert,nextReunionWave;
        public int ResolvedEvents=>resolvedEvents;
        public float Alert=>alert;
        public int PendingEvent=>pendingEvent;
        public string ChapterTitle {get {int chapter=0;for(int i=0;i<game.balance.journeyEvents.Length;i++)if((resolvedEvents & (1<<i))!=0)chapter++;return game.balance.journey.chapterTitles[Mathf.Min(chapter,3)];}}
        public static ZombieVariant EncounterVariant(float progress,float roll,JourneyTuning tuning)
        {
            if(progress>=tuning.armoredStart && roll<tuning.armoredChance)return ZombieVariant.Armored;
            if(progress>=tuning.runnerStart && roll<(progress>=tuning.armoredStart?tuning.armoredChance:0)+tuning.runnerChance)return ZombieVariant.Runner;
            return ZombieVariant.Common;
        }
        GameObject marker;
        readonly System.Collections.Generic.List<RideableVehicle> vehicles=new System.Collections.Generic.List<RideableVehicle>();
        public System.Collections.Generic.IReadOnlyList<RideableVehicle> Vehicles=>vehicles;
        string PlanPath=>Path.Combine(Application.persistentDataPath,"journey-v1.json");

        public void Initialize(GameBootstrap context,bool requireSetup,bool save)
        {
            game=context;persistence=save;
            if(!requireSetup){Begin(new JourneyPlan{fromName="강남역",toName="강남역",fromLat=37.4979,fromLon=127.0276,toLat=37.4979,toLon=127.0276},false);return;}
            if(save && File.Exists(PlanPath))
            {
                try {var file=new FileInfo(PlanPath);if(file.Length>4096)throw new InvalidDataException("Route file too large");var plan=JsonUtility.FromJson<JourneyPlan>(File.ReadAllText(PlanPath));if(Valid(plan))Begin(plan,false);}
                catch(Exception e){Status="저장된 여정을 읽을 수 없습니다. 새 여정을 입력하세요.";Debug.LogWarning("Journey load: "+e.Message);}
            }
        }
        public static bool TryResolve(string input,out string name,out double lat,out double lon)
        {
            name=null;lat=lon=0;if(string.IsNullOrWhiteSpace(input))return false;
            var text=input.Trim();var pieces=text.Split(',');
            if(pieces.Length==2 && double.TryParse(pieces[0],NumberStyles.Float,CultureInfo.InvariantCulture,out lat) && double.TryParse(pieces[1],NumberStyles.Float,CultureInfo.InvariantCulture,out lon))
            {name=$"{lat:F4}, {lon:F4}";return Korea(lat,lon);}
            if(text=="노원" || text=="노원역" || text.Equals("Nowon",StringComparison.OrdinalIgnoreCase)){name="노원역";lat=37.65637;lon=127.06345;return true;}
            if(text=="잠실" || text=="잠실역" || text.Equals("Jamsil",StringComparison.OrdinalIgnoreCase)){name="잠실역";lat=37.51333;lon=127.10028;return true;}
            if(text=="강남" || text=="강남역" || text.Equals("Gangnam",StringComparison.OrdinalIgnoreCase)){name="강남역";lat=37.4979;lon=127.0276;return true;}
            return BundledPlaceCatalog.TryResolve(text,out name,out lat,out lon);
        }
        static bool Korea(double lat,double lon)=>!double.IsNaN(lat)&&!double.IsNaN(lon)&&lat>=33&&lat<=39&&lon>=124&&lon<=132;
        static bool Valid(JourneyPlan p)=>p!=null&&p.version==1&&p.fromName?.Length>0&&p.fromName.Length<=80&&p.toName?.Length>0&&p.toName.Length<=80&&Korea(p.fromLat,p.fromLon)&&Korea(p.toLat,p.toLon);
        public bool TryPlan(string start,string destination)
        {
            if(!TryResolve(start,out var a,out double al,out double ao) || !TryResolve(destination,out var b,out double bl,out double bo))
            {Status="장소를 찾지 못했습니다. 번들 지역의 정확한 시설명, 세 역 이름 또는 '위도,경도'를 입력하세요. 같은 이름이 많으면 '노원 시설명'처럼 지역을 붙여 주세요.";return false;}
            var p=new JourneyPlan{fromName=a,toName=b,fromLat=al,fromLon=ao,toLat=bl,toLon=bo};
            float distance=Vector3.Distance(Vector3.zero,new Vector3((float)((bo-ao)*111320*Math.Cos(al*Math.PI/180)),0,(float)((bl-al)*111320)));
            if(distance<500 || distance>80000){Status="서울권 시범 여정은 0.5~80km만 지원합니다.";return false;}
            Begin(p,true);return true;
        }
        void Begin(JourneyPlan p,bool save)
        {
            Plan=p;Reached=p.reached;game.Map.latitude=p.fromLat;game.Map.longitude=p.fromLon;
            game.Map.useBundledGangnamMap=game.useBundledGangnamMap;
            target=game.Map.ToWorld(p.toLat,p.toLon);total=Vector3.Distance(Vector3.zero,target);RemainingMetres=total;
            Ready=true;
            string slot=string.Format(CultureInfo.InvariantCulture,"{0:F4}_{1:F4}_{2:F4}_{3:F4}",p.fromLat,p.fromLon,p.toLat,p.toLon);
            marker=new GameObject("약속 장소 · "+p.toName);
            marker.transform.position=target;
            WorldFactory.Box("약속 장소 표시",marker.transform,new Vector3(0,2,0),new Vector3(.8f,4,.8f),new Color(.18f,.82f,.7f),false);
            WorldFactory.Label(marker.transform,"약속 장소",new Vector3(0,4.4f,0),Color.cyan,.35f);
            WorldFactory.Visual(marker.transform,game.assets.playerPrefab,new Color(.28f,.65f,.82f));
            WorldFactory.Label(marker.transform,"기다리는 사람",new Vector3(0,2.8f,0),Color.cyan,.1f);
            if(p.fromName!=p.toName)for(int i=0;i<Mathf.Min(2,game.balance.vehicles.Length);i++)
            {
                var vehicle=new GameObject(game.balance.vehicles[i].name).AddComponent<RideableVehicle>();
                vehicle.Initialize(game,game.balance.vehicles[i],new Vector3(i==0?-4:4,0,16),i==0?game.assets.bicyclePrefab:game.assets.scooterPrefab,i==0?new Color(.25f,.6f,.72f):new Color(.92f,.44f,.19f));
                vehicles.Add(vehicle);
            }
            game.Campaign.Initialize(game,persistence,p.fromName==p.toName?null:slot);
            game.Map.enabled=true;nextEncounter=Time.time+EncounterDelay(0,game.balance.journey);
            if(save && persistence)Save();
            Status=$"{p.fromName} → {p.toName} · 길 위에서 생존하세요.";
        }
        void Save()
        {
            try {Directory.CreateDirectory(Path.GetDirectoryName(PlanPath));var temp=PlanPath+".tmp";File.WriteAllText(temp,JsonUtility.ToJson(Plan));if(File.Exists(PlanPath))File.Replace(temp,PlanPath,null);else File.Move(temp,PlanPath);}
            catch(Exception e){Debug.LogWarning("Journey save: "+e.Message);Status="여정 저장 실패 · 현재 플레이는 계속됩니다.";}
        }
        public void RestoreEvents(int mask,float pressure){resolvedEvents=mask;alert=pressure;pendingEvent=-1;}
        public void ChangeAlert(float delta){alert=Mathf.Clamp(alert+delta,-.3f,.7f);}
        public void RestoreReunion(bool active,float seconds){ReunionDefense=active && !Reached;ReunionRemaining=ReunionDefense?Mathf.Clamp(seconds,0,game.balance.journey.reunionHoldSeconds):0;nextReunionWave=Time.time+3;}
        public static int NextEvent(float progress,int mask,JourneyEventData[] events)
        {
            if(events==null)return -1;
            for(int i=0;i<events.Length;i++)if((mask & (1<<i))==0 && progress>=events[i].progress)return i;
            return -1;
        }
        public static float EncounterDelay(float progress,JourneyTuning tuning)=>Mathf.Lerp(tuning.encounterSeconds,tuning.lateEncounterSeconds,Mathf.Clamp01(progress));
        public static bool CrossesHan(JourneyPlan plan)=>plan!=null && Math.Min(plan.fromLat,plan.toLat)<37.53 && Math.Max(plan.fromLat,plan.toLat)>37.55 && Math.Min(plan.fromLon,plan.toLon)>126.75 && Math.Max(plan.fromLon,plan.toLon)<127.25;
        public bool ChooseEvent(bool first)
        {
            if(!game.Running || pendingEvent<0)return false;
            var scene=game.balance.journeyEvents[pendingEvent];var choice=first?scene.first:scene.second;
            if(choice.cost!=null && choice.cost.count>0 && game.Survival.Count(choice.cost.item)<choice.cost.count){Status="선택에 필요한 물자가 부족합니다.";return false;}
            if(game.Campaign.Stamina<choice.staminaCost){Status="우회할 기력이 부족합니다.";return false;}
            if(choice.cost!=null && choice.cost.count>0)game.Survival.Inventory[choice.cost.item]=game.Survival.Count(choice.cost.item)-choice.cost.count;
            if(choice.staminaCost>0)game.Campaign.SpendStamina(choice.staminaCost);
            if(choice.reward!=null && choice.reward.count>0)game.Survival.Add(choice.reward.item,choice.reward.count);
            ChangeAlert(choice.alertChange);
            if(choice.noiseRadius>0)ZombieAI.HearNoise(game.Player.transform.position,choice.noiseRadius);
            for(int i=0;i<choice.zombies;i++)
            {
                float angle=(i+.5f)*Mathf.PI*2/choice.zombies;
                var pos=game.Player.transform.position+new Vector3(Mathf.Cos(angle),0,Mathf.Sin(angle))*27;
                if(NavMesh.SamplePosition(pos,out var hit,6,NavMesh.AllAreas)){var zombie=ZombieAI.Spawn(hit.position,null,null,1+Progress*.5f,EncounterVariant(Progress,UnityEngine.Random.value,game.balance.journey));if(zombie)zombie.Alert(game.Player.transform.position);}
            }
            resolvedEvents|=1<<pendingEvent;pendingEvent=-1;Status=choice.label+" · 선택이 기록되었습니다.";game.Campaign.SaveNow();return true;
        }
        public bool ChooseNewJourney()
        {
            if(!Ready || !game.Campaign.AtHome)return false;
            game.Campaign.SaveNow();
            try {if(File.Exists(PlanPath))File.Delete(PlanPath);SceneManager.LoadScene(SceneManager.GetActiveScene().name);return true;}
            catch(Exception e){Status="새 여정 준비 실패 · 현재 여정 유지";Debug.LogWarning("Journey reset: "+e.Message);return false;}
        }
        void Update()
        {
            if(!Ready || !game.Player || Plan.fromName==Plan.toName)return;
            if(game.Running)alert=Mathf.MoveTowards(alert,0,game.balance.pursuit.decayPerMinute*Time.deltaTime/60);
            RemainingMetres=Vector3.Distance(game.Player.transform.position,target);
            Progress=total<1?1:Mathf.Clamp01(1-RemainingMetres/total);
            if(game.Running && !Reached && pendingEvent<0)pendingEvent=NextEvent(Progress,resolvedEvents,game.balance.journeyEvents);
            if(game.Running && !Reached && !ReunionDefense && RemainingMetres<60 && pendingEvent<0 && resolvedEvents==(1<<game.balance.journeyEvents.Length)-1)
            {ReunionDefense=true;ReunionRemaining=game.balance.journey.reunionHoldSeconds;nextReunionWave=Time.time+3;Status="약속 장소 방어 시작 · 가까이에서 버티세요.";game.Atmosphere.Play(SoundKind.Siren,target,80);game.Campaign.SaveNow();}
            if(ReunionDefense){TickReunion();return;}
            if(!game.Running || Reached || pendingEvent>=0 || Time.time<nextEncounter)return;
            nextEncounter=Time.time+EncounterDelay(Progress,game.balance.journey);
            int count=Mathf.Max(0,Mathf.RoundToInt(Mathf.Lerp(game.balance.journey.startEnemies,game.balance.journey.endEnemies,Progress)+alert*3));
            float threat=Mathf.Max(.5f,1+Progress*game.balance.journey.extraZombieStrength+alert);
            for(int i=0;i<count;i++)
            {
                float angle=UnityEngine.Random.value*Mathf.PI*2;
                var pos=game.Player.transform.position+new Vector3(Mathf.Cos(angle),0,Mathf.Sin(angle))*UnityEngine.Random.Range(22f,34f);
                if(NavMesh.SamplePosition(pos,out var hit,6,NavMesh.AllAreas))ZombieAI.Spawn(hit.position,null,null,threat,EncounterVariant(Progress,UnityEngine.Random.value,game.balance.journey));
            }
        }
        void TickReunion()
        {
            if(!game.Running || RemainingMetres>game.balance.journey.reunionRadius)return;
            ReunionRemaining=Mathf.Max(0,ReunionRemaining-Time.deltaTime);
            if(ReunionRemaining<=0){ReunionDefense=false;Reached=true;Plan.reached=true;Status="약속 장소를 지켰습니다. 재회에 성공했습니다.";if(persistence)Save();game.Campaign.SaveNow();return;}
            if(Time.time<nextReunionWave)return;
            nextReunionWave=Time.time+game.balance.journey.reunionWaveSeconds;
            for(int i=0;i<game.balance.journey.reunionWaveSize;i++)
            {
                float angle=(i+UnityEngine.Random.value)*Mathf.PI*2/game.balance.journey.reunionWaveSize;
                var pos=target+new Vector3(Mathf.Cos(angle),0,Mathf.Sin(angle))*UnityEngine.Random.Range(25,38);
                if(NavMesh.SamplePosition(pos,out var hit,6,NavMesh.AllAreas)){var zombie=ZombieAI.Spawn(hit.position,null,null,1+game.balance.journey.extraZombieStrength+alert,EncounterVariant(Progress,UnityEngine.Random.value,game.balance.journey));if(zombie)zombie.Alert(game.Player.transform.position);}
            }
        }
        void OnGUI()
        {
            if(!game)return;if(WorldFactory.KoreanFont)GUI.skin.font=WorldFactory.KoreanFont;
            float scale=Mathf.Clamp(Screen.height/900f,.65f,1.6f);GUI.matrix=Matrix4x4.Scale(Vector3.one*scale);float w=Screen.width/scale,h=Screen.height/scale;
            if(!Ready)
            {
                var old=GUI.color;GUI.color=new Color(.02f,.04f,.06f,.96f);GUI.DrawTexture(new Rect(0,0,w,h),Texture2D.whiteTexture);GUI.color=old;
                GUI.Box(new Rect(w/2-290,h/2-220,580,440),"SEOUL / THE WAY HOME");
                GUILayout.BeginArea(new Rect(w/2-255,h/2-168,510,350));
                GUILayout.Label("당신은 어디에 있나요?");from=GUILayout.TextField(from,80);
                GUILayout.Space(22);GUILayout.Label("당신의 소중한 사람은 어디에 있나요?");to=GUILayout.TextField(to,80);
                GUILayout.Space(18);GUILayout.Label("오프라인 검색: 노원·잠실·강남 주변 시설명(예: 노원문고), 세 역 또는 위도,경도");
                GUILayout.Label("장소와 좌표는 이 기기에 저장됩니다. 온라인 지도 사용 시 주변 좌표가 OSM 서버로 전송됩니다.");
                if(GUILayout.Button("여정 시작",GUILayout.Height(46)))TryPlan(from,to);
                GUILayout.Label(Status);GUILayout.EndArea();
            }
            else if(Plan.fromName!=Plan.toName)
            {
                var direction=target-game.Player.transform.position;float bearing=(Mathf.Atan2(direction.x,direction.z)*Mathf.Rad2Deg+360)%360;
                string[] compass={"북","북동","동","남동","남","남서","서","북서"};string heading=compass[Mathf.RoundToInt(bearing/45)%8];
                string danger=Progress<.3f?"초기 혼란":Progress<.65f?"확산 구역":Progress<.9f?"봉쇄 구역":"목적지 근접 · 최고 위험";
                if(CrossesHan(Plan)&&Math.Abs(game.Map.WorldToGeo(game.Player.transform.position).x-37.54f)<.012f)danger="한강 접근 · 교량 봉쇄";
                var panel=new Rect(w/2-245,18,490,80);var old=GUI.color;GUI.color=new Color(.025f,.055f,.07f,.94f);GUI.DrawTexture(panel,Texture2D.whiteTexture);GUI.color=old;
                var title=new GUIStyle(GUI.skin.label){font=WorldFactory.KoreanFont,fontSize=17,fontStyle=FontStyle.Bold,alignment=TextAnchor.MiddleCenter};title.normal.textColor=new Color(.55f,1,.85f);
                GUI.Label(new Rect(panel.x,25,panel.width,26),Plan.fromName+"  →  "+Plan.toName+"   /   "+ChapterTitle,title);
                title.fontSize=15;title.fontStyle=FontStyle.Normal;title.normal.textColor=Color.white;
                string pursuit=alert>=.35f?"추격 심각":alert>=.1f?"추격 상승":alert<-.05f?"추격 낮음":"추격 보통";
                GUI.Label(new Rect(panel.x,49,panel.width,24),$"{danger} · {heading}쪽 {RemainingMetres/1000:0.0}km · {Progress*100:0}% · {pursuit}",title);
                GUI.color=new Color(.35f,.9f,.72f);GUI.DrawTexture(new Rect(panel.x,94,panel.width*Progress,3),Texture2D.whiteTexture);GUI.color=old;
                if(ReunionDefense)GUI.Box(new Rect(w/2-240,110,480,65),$"약속 장소 방어 {ReunionRemaining:0}초 · {game.balance.journey.reunionRadius:0}m 안에서 버티세요");
                if(Reached)GUI.Box(new Rect(w/2-260,h/2-75,520,150),"재회 성공\n당신은 약속 장소까지 살아서 도착했습니다.\n계속 탐색하며 다음 이야기를 준비할 수 있습니다.");
                if(pendingEvent>=0 && !Reached)
                {
                    var scene=game.balance.journeyEvents[pendingEvent];
                    GUI.Box(new Rect(w/2-300,h/2-135,600,270),pendingEvent==1 && !CrossesHan(Plan)?"진행 방향 봉쇄선":scene.title);
                    GUILayout.BeginArea(new Rect(w/2-265,h/2-92,530,218));
                    GUILayout.Label(pendingEvent==1 && !CrossesHan(Plan)?"진행 방향에 봉쇄선이 보입니다. 조용히 돌아가거나 경보를 울리고 밀어붙일 수 있습니다.":scene.description);
                    GUILayout.Space(12);
                    if(GUILayout.Button(scene.first.label,GUILayout.Height(42)))ChooseEvent(true);
                    if(GUILayout.Button(scene.second.label,GUILayout.Height(42)))ChooseEvent(false);
                    GUILayout.Label(Status);GUILayout.EndArea();
                }
            }
            GUI.matrix=Matrix4x4.identity;
        }
        void OnDestroy(){if(marker)Destroy(marker);foreach(var vehicle in vehicles)if(vehicle)Destroy(vehicle.gameObject);}
    }
}
