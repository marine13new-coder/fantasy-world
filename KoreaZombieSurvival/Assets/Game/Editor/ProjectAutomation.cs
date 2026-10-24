using System;
using System.Collections;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace SeoulSurvival.Editor
{
    public static class ProjectAutomation
    {
        public const string ScenePath="Assets/Game/Scenes/SeoulSurvival.unity";
        [MenuItem("Seoul Survival/Prepare playable scene")]
        public static void Prepare()
        {
            Directory.CreateDirectory("Assets/Game/Scenes"); Directory.CreateDirectory("Assets/Game/Resources");
            string balance="Assets/Game/Resources/GameBalance.json";
            if(!File.Exists(balance))File.WriteAllText(balance,JsonUtility.ToJson(new GameBalance(),true));
            const string surface="Assets/Game/Resources/ProceduralSurface.mat";
            if(!AssetDatabase.LoadAssetAtPath<Material>(surface))AssetDatabase.CreateAsset(new Material(Shader.Find("Standard")),surface);
            const string line="Assets/Game/Resources/CombatLine.mat";
            if(!AssetDatabase.LoadAssetAtPath<Material>(line))AssetDatabase.CreateAsset(new Material(Shader.Find("Sprites/Default")),line);
            AssetDatabase.Refresh();
            if(File.Exists(ScenePath))EditorSceneManager.OpenScene(ScenePath,OpenSceneMode.Single);
            else EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);
            var bootstrap=UnityEngine.Object.FindFirstObjectByType<GameBootstrap>();
            if(!bootstrap) { bootstrap=new GameObject("GameBootstrap").AddComponent<GameBootstrap>(); bootstrap.balanceJson=AssetDatabase.LoadAssetAtPath<TextAsset>(balance); }
            const string dataPath="Assets/Game/Resources/GameBalance.asset";
            var data=AssetDatabase.LoadAssetAtPath<GameBalanceAsset>(dataPath);
            if(!data){data=ScriptableObject.CreateInstance<GameBalanceAsset>();data.values=JsonUtility.FromJson<GameBalance>(File.ReadAllText(balance));data.values.Validate();AssetDatabase.CreateAsset(data,dataPath);}
            data.values.Validate();EditorUtility.SetDirty(data);
            if(!bootstrap.balanceAsset)bootstrap.balanceAsset=data;
            ArtSetup.Apply();
            EditorSceneManager.SaveScene(SceneManager.GetActiveScene(),ScenePath);
            EditorBuildSettings.scenes=new[]{new EditorBuildSettingsScene(ScenePath,true)};
            PlayerSettings.companyName="Seoul Survival Studio"; PlayerSettings.productName="Seoul Last Signal";
            PlayerSettings.defaultScreenWidth=1440; PlayerSettings.defaultScreenHeight=900; PlayerSettings.fullScreenMode=FullScreenMode.Windowed;
            PlayerSettings.defaultInterfaceOrientation=UIOrientation.LandscapeLeft;
            PlayerSettings.SetApplicationIdentifier(UnityEditor.Build.NamedBuildTarget.Android,"com.seoulsurvival.lastsignal");
            PlayerSettings.Android.minSdkVersion=AndroidSdkVersions.AndroidApiLevel26;
            PlayerSettings.Android.targetArchitectures=AndroidArchitecture.ARM64;
            PlayerSettings.SetScriptingBackend(UnityEditor.Build.NamedBuildTarget.Android,ScriptingImplementation.IL2CPP);
            // Old Input Manager is intentional for the zero-dependency prototype and touch adapter.
            var settings=new SerializedObject(AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/ProjectSettings.asset")[0]);
            var input=settings.FindProperty("activeInputHandler"); if(input!=null) { input.intValue=0; settings.ApplyModifiedPropertiesWithoutUndo(); }
            AssetDatabase.SaveAssets(); Debug.Log("SEOUL_SETUP_OK");
        }
        [MenuItem("Seoul Survival/Build Windows")]
        public static void BuildWindows()
        {
            Prepare(); Directory.CreateDirectory("Builds/Windows");
            var report=BuildPipeline.BuildPlayer(new BuildPlayerOptions {scenes=new[]{ScenePath},locationPathName="Builds/Windows/SeoulLastSignal.exe",target=BuildTarget.StandaloneWindows64,options=BuildOptions.None});
            File.WriteAllText("Logs/build-result.txt",report.summary.result+"\n"+report.summary.totalErrors+" errors\n"+report.summary.totalSize+" bytes");
            if(report.summary.result!=BuildResult.Succeeded)throw new Exception("Windows build failed"); Debug.Log("SEOUL_WINDOWS_BUILD_OK");
        }
        [MenuItem("Seoul Survival/Build Android AAB")]
        public static void BuildAndroid()
        {
            Prepare(); Directory.CreateDirectory("Builds/Android"); EditorUserBuildSettings.buildAppBundle=true;
            var report=BuildPipeline.BuildPlayer(new BuildPlayerOptions{scenes=new[]{ScenePath},locationPathName="Builds/Android/SeoulLastSignal.aab",target=BuildTarget.Android,options=BuildOptions.None});
            if(report.summary.result!=BuildResult.Succeeded)throw new Exception("Android build failed; Android Build Support and signing required.");
        }
        [MenuItem("Seoul Survival/Build Android APK")]
        public static void BuildAndroidApk()
        {
            Prepare(); Directory.CreateDirectory("Builds/Android"); Directory.CreateDirectory("Logs"); EditorUserBuildSettings.buildAppBundle=false;
            var jdk=Path.Combine(Directory.GetParent(Application.dataPath).FullName,"Tools","AndroidJDK");
            if(File.Exists(Path.Combine(jdk,"bin","java.exe")))
            {
                var tools=Type.GetType("UnityEditor.Android.AndroidExternalToolsSettings, UnityEditor.Android.Extensions");
                if(tools==null)throw new Exception("Android Build Support is missing");
                var property=tools.GetProperty("jdkRootPath");
                if(property==null)throw new Exception("Unity Android JDK setting is unavailable");
                property.SetValue(null,jdk);
            }
            var report=BuildPipeline.BuildPlayer(new BuildPlayerOptions{scenes=new[]{ScenePath},locationPathName="Builds/Android/SeoulLastSignal.apk",target=BuildTarget.Android,options=BuildOptions.None});
            File.WriteAllText("Logs/android-apk-result.txt",report.summary.result+"\n"+report.summary.totalErrors+" errors\n"+report.summary.totalSize+" bytes");
            if(report.summary.result!=BuildResult.Succeeded)throw new Exception("Android APK build failed"); Debug.Log("SEOUL_ANDROID_APK_BUILD_OK");
        }
        public static void RunChecks()
        {
            Prepare();
            Assert(RealWorldMapManager.ChunkAt(Vector3.zero)==Vector2Int.zero,"origin chunk");
            Assert(RealWorldMapManager.ChunkAt(new Vector3(401,0,0)).x==1,"positive chunk boundary");
            Assert(RealWorldMapManager.ChunkAt(new Vector3(-401,0,0)).x==-1,"negative chunk boundary");
            Assert(RealWorldMapManager.DistrictKind(Vector2Int.zero)==0 && RealWorldMapManager.DistrictKind(Vector2Int.up)==1 && RealWorldMapManager.DistrictKind(Vector2Int.right)==2 && RealWorldMapManager.DistrictKind(new Vector2Int(-1,0))>=0,"three stable district layouts including negative chunks");
            Assert(!RealWorldMapManager.TryParse("<html>failure</html>",out _),"reject HTML response");
            Assert(!RealWorldMapManager.TryParse("{}",out _),"reject absent elements");
            Assert(RealWorldMapManager.TryParse("{\"elements\":[]}",out _),"accept valid empty OSM response");
            Assert(RealWorldMapManager.TryParse("{\"elements\":[{\"id\":2,\"geometry\":[{\"lat\":37.1,\"lon\":127.1},{\"lat\":37.2,\"lon\":127.2}]}]}",out var geometryOnly) && geometryOnly.elements[0].center!=null && Math.Abs(geometryOnly.elements[0].center.lat-37.15)<.0001,"geometry-only OSM ways receive a usable center");
            Assert(RealWorldMapManager.TryParse("{\"elements\":[{\"id\":1,\"tags\":{\"building:levels\":\"12\",\"height\":\"38 m\"}}]}",out var tagged) && RealWorldMapManager.BuildingHeight(tagged.elements[0].tags,1,out int mappedFloors,out bool measured)==38 && mappedFloors==12 && measured,"OSM levels and height tags survive parsing");
            Assert(RealWorldMapManager.BuildingHeight(new RealWorldMapManager.OsmTags(),5,out int guessedFloors,out bool guessed)>0 && guessedFloors>=2 && !guessed,"untagged building height is marked estimated");
            var rules=new GameBalance();rules.Validate();
            Assert(JourneyDirector.EncounterVariant(.1f,0,rules.journey)==ZombieVariant.Common && JourneyDirector.EncounterVariant(.3f,.1f,rules.journey)==ZombieVariant.Runner && JourneyDirector.EncounterVariant(.3f,.4f,rules.journey)==ZombieVariant.Common && JourneyDirector.EncounterVariant(.8f,.1f,rules.journey)==ZombieVariant.Armored && JourneyDirector.EncounterVariant(.8f,.4f,rules.journey)==ZombieVariant.Runner && JourneyDirector.EncounterVariant(.8f,.9f,rules.journey)==ZombieVariant.Common,"encounter types unlock with route progress");
            var balanceSeed=JsonUtility.FromJson<GameBalance>(Resources.Load<TextAsset>("GameBalance").text);balanceSeed.Validate();
            Assert(balanceSeed.journey.chapterTitles.Length==4 && balanceSeed.journey.chapterTitles[0].Contains("연락"),"JSON contains editable journey chapter titles");
            Assert(balanceSeed.zombieVariants[1].speed>1 && balanceSeed.zombieVariants[2].bodyDamage<1 && balanceSeed.journey.armoredStart>.5f,"JSON zombie variants tune speed and body armor");
            Assert(balanceSeed.reliefContracts.Length==4 && balanceSeed.reliefContracts[0].facility==Facility.Police && balanceSeed.reliefContracts[0].reward.count==1,"JSON balance seed includes editable relief contracts");
            Assert(balanceSeed.loot[2].items.Length==3 && balanceSeed.loot[4].items.Length==3 && balanceSeed.recipes.Length==5 && balanceSeed.recipes[4].output==ResourceKind.SignalFlare && balanceSeed.carefulDistrictBonus[0].item.item==ResourceKind.Battery,"water, battery, flare and district bonus exist in editable JSON balance");
            Assert(balanceSeed.pursuit.quickSearchNoise>balanceSeed.pursuit.carefulSearchNoise && balanceSeed.pursuit.quickSearchAlert>0 && balanceSeed.pursuit.restRecovery>0,"search and pursuit tuning exists in JSON balance");
            var inspectorBalance=AssetDatabase.LoadAssetAtPath<GameBalanceAsset>("Assets/Game/Resources/GameBalance.asset");
            Assert(inspectorBalance && inspectorBalance.values.journey.chapterTitles.Length==4 && inspectorBalance.values.journey.chapterTitles[3].Contains("신호"),"Inspector contains journey chapter titles");
            Assert(inspectorBalance && inspectorBalance.values.zombieVariants.Length==3 && inspectorBalance.values.zombieVariants[2].health>1 && inspectorBalance.values.journey.runnerStart>0,"Inspector zombie variants remain editable");
            Assert(inspectorBalance && inspectorBalance.values.recipes.Length==5 && inspectorBalance.values.loot[2].items.Length==3 && inspectorBalance.values.carefulDistrictBonus.Length==3 && inspectorBalance.values.pursuit.quickSearchAlert>0,"Inspector balance includes loot, flare and pursuit tuning");
            Assert(inspectorBalance.values.districtPressure!=null && inspectorBalance.values.districtPressure.extraEnemies>0 && DistrictPressure.DistanceToChunk(new Vector3(395,0,0),new Vector2Int(1,0))==5,"district sound crosses nearby chunk boundaries and uses Inspector tuning");
            Assert(JourneyDirector.NextEvent(.8f,0,rules.journeyEvents)==0 && JourneyDirector.NextEvent(.8f,1,rules.journeyEvents)==1 && JourneyDirector.NextEvent(.8f,3,rules.journeyEvents)==-1,"journey decisions unlock in order and cannot repeat");
            Assert(JourneyDirector.EncounterDelay(0,rules.journey)>JourneyDirector.EncounterDelay(1,rules.journey),"journey starts quieter and intensifies toward destination");
            var outline=new[]{new Vector3(0,0,0),new Vector3(4,0,0),new Vector3(4,0,1),new Vector3(1,0,1),new Vector3(1,0,4),new Vector3(0,0,4)};
            var roof=OsmBuildingShell.RoofMesh(outline,3);float area=0;var verts=roof.vertices;var indices=roof.triangles;
            for(int i=0;i<indices.Length;i+=3)area+=Vector3.Cross(verts[indices[i+1]]-verts[indices[i]],verts[indices[i+2]]-verts[indices[i]]).magnitude*.5f;
            Assert(Mathf.Abs(area-7)<.001f,"concave OSM roof preserves polygon area");UnityEngine.Object.DestroyImmediate(roof);
            Assert(OsmBuildingShell.Contains(outline,new Vector3(.5f,0,3)) && !OsmBuildingShell.Contains(outline,new Vector3(3,0,3)),"OSM footprint rejects spawn-inside buildings");
            var snapshot=Resources.Load<TextAsset>("MapSnapshots/Gangnam");Assert(snapshot && RealWorldMapManager.TryParse(snapshot.text,out var parsed) && parsed.elements.Length>100 && Array.Exists(parsed.elements,e=>e.tags!=null && e.tags.height!=null),"bundled Gangnam map contains building height tags");
            var nowonSnapshot=Resources.Load<TextAsset>("MapSnapshots/Nowon");Assert(nowonSnapshot && RealWorldMapManager.TryParse(nowonSnapshot.text,out var nowonMap) && Array.Exists(nowonMap.elements,e=>e.tags!=null && e.tags.leisure=="park"),"bundled Nowon map contains OSM parks");
            Assert(JourneyDirector.TryResolve("노원역",out _,out double nowonLat,out _) && JourneyDirector.TryResolve("잠실역",out _,out double jamsilLat,out _) && nowonLat>jamsilLat,"Nowon to Jamsil route resolves north to south");
            var northGoal=TacticalMapOverlay.ObjectivePoint(new Vector3(0,0,10000),Vector3.zero,350,500);
            var eastGoal=TacticalMapOverlay.ObjectivePoint(new Vector3(10000,0,0),Vector3.zero,350,500);
            Assert(Mathf.Abs(northGoal.x-250)<.01f && northGoal.y==8 && eastGoal.x==492 && Mathf.Abs(eastGoal.y-250)<.01f,"distant reunion marker remains on map edge in the correct direction");
            Assert(JourneyDirector.CrossesHan(new JourneyPlan{fromLat=37.65637,fromLon=127.06345,toLat=37.51333,toLon=127.10028}) && !JourneyDirector.CrossesHan(new JourneyPlan{fromLat=37.4979,fromLon=127.0276,toLat=37.51333,toLon=127.10028}),"Han blockade text only appears on crossings");
            Assert(!JourneyDirector.TryResolve("노원구 상계동 123",out _,out _,out _) && JourneyDirector.TryResolve("37.65637,127.06345",out _,out _,out _),"journey rejects approximate address matches and accepts Korean coordinates");
            Assert(JourneyDirector.TryResolve("노원문고",out string placeName,out double placeLat,out _) && placeName=="노원문고" && placeLat>37.65 && JourneyDirector.TryResolve("노원 롯데백화점 노원점",out _,out _,out _),"bundled Korean facilities resolve offline");
            Assert(!JourneyDirector.TryResolve("우리은행",out _,out _,out _),"ambiguous place name cannot silently choose a wrong location");
            Assert(RealWorldMapManager.SnapshotFor(37.6562291,127.0615832)=="Nowon" && RealWorldMapManager.SnapshotFor(37.5131264,127.1009598)=="Jamsil" && RealWorldMapManager.SnapshotFor(36.0,127.0)==null,"POI start and destination reuse nearby bundled maps");
            var boot=UnityEngine.Object.FindFirstObjectByType<GameBootstrap>(); boot.useOnlineMap=false; boot.loadResourceJson=false; boot.balanceJson=null;boot.balanceAsset=null;
            boot.balance=new GameBalance();boot.enablePersistence=false;boot.useBundledGangnamMap=false;boot.requireJourneySetup=false;
            SessionState.SetBool("SeoulChecks",true); EditorApplication.EnterPlaymode();
        }
        static void Assert(bool condition,string message) { if(!condition)throw new Exception("CHECK FAILED: "+message); Debug.Log("CHECK PASS: "+message); }
        [MenuItem("Seoul Survival/Run automated checks")]
        public static void ChecksMenu() { RunChecks(); }
        [MenuItem("Seoul Survival/Preview Gangnam without saving")]
        public static void PreviewGangnam(){Prepare();var boot=UnityEngine.Object.FindFirstObjectByType<GameBootstrap>();boot.enablePersistence=false;boot.useOnlineMap=false;boot.requireJourneySetup=false;EditorApplication.EnterPlaymode();}
        [MenuItem("Seoul Survival/Preview Nowon to Jamsil without saving")]
        public static void PreviewNowon(){Prepare();var boot=UnityEngine.Object.FindFirstObjectByType<GameBootstrap>();boot.enablePersistence=false;boot.useOnlineMap=false;boot.requireJourneySetup=true;SessionState.SetBool("SeoulPreviewNowon",true);EditorApplication.EnterPlaymode();}
        [MenuItem("Seoul Survival/Check active journey")]
        public static void CheckJourney()
        {
            var game=GameBootstrap.Instance;Assert(EditorApplication.isPlaying && game && game.Journey.Ready && game.Journey.Plan.fromName=="노원역" && game.Journey.Plan.toName=="잠실역","journey input resolves Nowon to Jamsil");
            Assert(game.Journey.RemainingMetres>15000 && game.Map.LoadedChunks==9 && game.Map.Roads.Count>10,"route distance, bounded chunks and real Nowon roads");
            int streetSigns=0;foreach(var part in game.Map.GetComponentsInChildren<Transform>())if(part.name=="Street-name post")streetSigns++;Assert(streetSigns>0,"real Korean street names appear in world");
            int recipe=-1;for(int i=0;i<game.balance.recipes.Length;i++)if(game.balance.recipes[i].output==ResourceKind.ScoutRifle)recipe=i;
            Assert(recipe>=0,"generic scout rifle recipe present");game.Survival.Inventory[ResourceKind.GunParts]=2;game.Survival.Inventory[ResourceKind.Scrap]=4;
            Assert(game.Survival.Craft(recipe) && game.Player.combat.EquipSlot(3) && game.Player.combat.RifleEquipped,"craft and equip unbranded rifle");
            game.Player.combat.EquipSlot(1);Assert(game.Player.combat.CycleWeapon() && game.Player.combat.EquippedSlot==2 && game.Player.combat.CycleWeapon() && game.Player.combat.EquippedSlot==3,"mobile weapon button cycles through crafted rifle");
            game.Player.combat.RestoreLoadout(3,5,7,20);Assert(game.Player.combat.RifleMagazine==7 && game.Player.combat.PistolMagazine==5 && game.Player.combat.Reserve==20,"separate magazines survive loadout restore");
            var vehicles=UnityEngine.Object.FindObjectsByType<RideableVehicle>(FindObjectsSortMode.None);Assert(vehicles.Length==2,"bicycle and scooter spawned");
            game.Player.Restore(vehicles[0].transform.position+Vector3.forward,game.Player.Health);Assert(vehicles[0].Toggle() && RideableVehicle.ActiveRide==vehicles[0],"bicycle can be mounted");
            var save=game.Campaign.Capture();Assert(save.vehicles.Length==2 && Vector3.Distance(save.vehicles[0].position,game.Journey.Vehicles[0].transform.position)<.01f,"vehicle positions and range enter campaign save");
            game.Journey.RestoreEvents(1,.15f);save=game.Campaign.Capture();Assert(save.resolvedJourneyEvents==1 && Mathf.Abs(save.journeyAlert-.15f)<.001f,"journey choices and pursuit pressure enter campaign save");
            Debug.Log("SEOUL_JOURNEY_CHECKS_OK");
        }
        [MenuItem("Seoul Survival/Check journey choices")]
        public static void CheckJourneyChoices()
        {
            var game=GameBootstrap.Instance;Assert(EditorApplication.isPlaying && game && game.Journey.Ready && game.Journey.Plan.fromName!=game.Journey.Plan.toName,"journey choice test has active route");
            game.StartCoroutine(CheckJourneyChoicesRoutine(game));
        }
        static IEnumerator CheckJourneyChoicesRoutine(GameBootstrap game)
        {
            game.Survival.Inventory[ResourceKind.Food]=2;
            var destination=game.Map.ToWorld(game.Journey.Plan.toLat,game.Journey.Plan.toLon);
            game.Player.Restore(destination*.25f+Vector3.up*.15f,game.Player.Health);
            yield return null;
            Assert(game.Journey.PendingEvent==0,"first journey event appears after route progress");
            Assert(game.Journey.ChooseEvent(true) && game.Survival.Count(ResourceKind.Food)==1 && game.Survival.Count(ResourceKind.Medkit)>=1,"aid choice trades food for medicine once");
            var save=game.Campaign.Capture();Assert(save.resolvedJourneyEvents==1,"choice included in campaign checkpoint");
            game.Journey.RestoreEvents(0,0);game.Campaign.Restore(save);
            Assert(game.Journey.ResolvedEvents==1 && JourneyDirector.NextEvent(.25f,game.Journey.ResolvedEvents,game.balance.journeyEvents)==-1,"restored choice cannot pay out twice");
            game.Player.Restore(destination*.8f+Vector3.up*.15f,game.Player.Health);yield return null;
            Assert(game.Journey.PendingEvent==1,"crossing decision appears near the river");
            float stamina=game.Campaign.Stamina;Assert(game.Journey.ChooseEvent(true) && game.Campaign.Stamina<=stamina-35 && game.Journey.Alert<0,"quiet detour costs stamina and lowers pursuit");
            game.Player.Restore(destination*.96f+Vector3.up*.15f,game.Player.Health);yield return null;
            game.Survival.Inventory[ResourceKind.Electronics]=0;
            Assert(game.Journey.PendingEvent==2 && !game.Journey.ChooseEvent(true) && game.Journey.PendingEvent==2,"encrypted call requires electronics without consuming choice");
            Assert(game.Journey.ChooseEvent(false) && game.Journey.ResolvedEvents==7 && game.Journey.Alert>0,"public broadcast increases pursuit and resolves final event");
            save=game.Campaign.Capture();game.Journey.RestoreEvents(0,0);game.Campaign.Restore(save);
            Assert(game.Journey.ResolvedEvents==7 && JourneyDirector.NextEvent(1,game.Journey.ResolvedEvents,game.balance.journeyEvents)==-1,"all journey decisions survive save restore");
            game.balance.journey.reunionHoldSeconds=.4f;
            game.Player.Restore(destination+new Vector3(10,.15f,0),game.Player.Health);yield return null;
            Assert(game.Journey.ReunionDefense && !game.Journey.Reached,"destination starts a defense before reunion");
            save=game.Campaign.Capture();Assert(save.reunionDefense && save.reunionRemaining>0,"reunion defense timer enters save");
            game.Journey.RestoreReunion(false,0);game.Campaign.Restore(save);
            Assert(game.Journey.ReunionDefense && game.Journey.ReunionRemaining>0,"reunion defense resumes from save");
            yield return new WaitForSeconds(.6f);
            Assert(game.Journey.Reached && game.Journey.Plan.reached,"surviving destination defense completes reunion");
            Debug.Log("SEOUL_JOURNEY_CHOICES_OK");
        }
        [MenuItem("Seoul Survival/Write runtime diagnostics")]
        public static void Diagnostics()
        {
            var game=GameBootstrap.Instance; if(!game)return;
            Directory.CreateDirectory("Logs");
            File.WriteAllText("Logs/runtime-diagnostics.json",JsonUtility.ToJson(new RuntimeDiagnostics {map=game.Map.Status,chunks=game.Map.LoadedChunks,zombies=ZombieAI.Active.Count,health=game.Player.Health,player=game.Player.transform.position,focus=game.Player.combat.Focus,victory=game.Survival.Victory},true));
        }
        [Serializable] class RuntimeDiagnostics {public string map;public int chunks,zombies;public float health,focus;public Vector3 player;public bool victory;}
    }
    [InitializeOnLoad] public static class PlayChecks
    {
        static double start,wallStart; static int phase; static bool failed; static LootBox searchBox; static int searchScrap,searchBattery; static float searchAlert; static readonly System.Collections.Generic.List<string> results=new System.Collections.Generic.List<string>();
        static PlayChecks() { EditorApplication.playModeStateChanged+=State; }
        static void State(PlayModeStateChange state)
        {
            if(SessionState.GetBool("SeoulPreviewNowon",false) && state==PlayModeStateChange.EnteredPlayMode)
            {SessionState.SetBool("SeoulPreviewNowon",false);GameBootstrap.Instance.Journey.TryPlan("노원역","잠실역");}
            if(!SessionState.GetBool("SeoulChecks",false))return;
            if(state==PlayModeStateChange.EnteredPlayMode) { start=Time.time; wallStart=EditorApplication.timeSinceStartup; phase=0; failed=false; results.Clear(); Application.logMessageReceived+=Log; EditorApplication.update+=Tick; }
            if(state==PlayModeStateChange.EnteredEditMode) { SessionState.SetBool("SeoulChecks",false); EditorApplication.Exit(SessionState.GetBool("SeoulChecksFailed",false)?1:0); }
        }
        static void Log(string message,string trace,LogType type) { if(type==LogType.Error || type==LogType.Exception || type==LogType.Assert) {failed=true;results.Add("ERROR "+message+"\n"+trace);} }
        static void Check(bool condition,string message) { results.Add((condition?"PASS ":"FAIL ")+message); if(!condition)failed=true; }
        static void Teleport(Vector3 p) { var player=GameBootstrap.Instance.Player; player.body.enabled=false; player.transform.position=p+Vector3.up*.15f; player.body.enabled=true; }
        static void Tick()
        {
            try {
                var game=GameBootstrap.Instance; if(!game)return; double elapsed=Time.time-start;
                if(phase==0 && elapsed>4) {
                    Check(game.Map.LoadedChunks==9,"bounded 9-chunk fallback");
                    Check(game.Map.ChunkQuery(Vector2Int.zero).Contains("out body geom 2000") && !game.Map.ChunkQuery(Vector2Int.zero).Contains("around:"),"OSM query covers full square chunk with a bounded result");
                    var skin=game.Player.GetComponentInChildren<SkinnedMeshRenderer>();
                    Check(skin && skin.bounds.size.y>.8f && skin.bounds.size.y<3,"animated licensed character stays human scale");
                    Check(UnityEngine.Object.FindObjectsByType<EnterableBuilding>(FindObjectsSortMode.None).Length==54,"six enterable facilities per chunk");
                    Check(game.Map.ToWorld(37.4979,127.0276).magnitude<.01f,"Gangnam projects to origin");
                    Check(!game.Survival.Craft(2),"cannot craft with missing resources");
                    var building=UnityEngine.Object.FindFirstObjectByType<EnterableBuilding>();
                    SessionState.SetString("TestBuilding",building.persistentId); Teleport(building.transform.position);
                    phase=1;
                } else if(phase==1 && elapsed>5) {
                    var building=Array.Find(UnityEngine.Object.FindObjectsByType<EnterableBuilding>(FindObjectsSortMode.None),b=>b.persistentId==SessionState.GetString("TestBuilding",""));
                    Check(building && building.IsInside && !building.roof.activeSelf,"roof cutaway on entering interior");
                    var box=building.GetComponentInChildren<LootBox>(); Teleport(box.transform.position+Vector3.back); Check(box.TryOpen(),"facility loot acquired"); Check(!box.TryOpen(),"loot cannot be duplicated");
                    Check(Mathf.Abs(game.Journey.Alert-game.balance.pursuit.quickSearchAlert)<.001f,"fast search raises persistent pursuit once");
                    Check(game.Pressure.At(RealWorldMapManager.ChunkAt(box.transform.position))>0,"loud search raises local district pressure");
                    game.Pressure.RecordNoise(new Vector3(395,0,0),30);Check(game.Pressure.At(new Vector2Int(1,0))>0,"noise near a block boundary affects the next district");
                    Teleport(Vector3.zero); game.Map.BuildNavigation(Vector3.zero);
                    foreach(var zombie in ZombieAI.Active.ToArray())if(Vector3.Distance(zombie.transform.position,Vector3.zero)<100)UnityEngine.Object.Destroy(zombie.gameObject);
                    phase=2;
                } else if(phase==2 && elapsed>6) {
                    var z=ZombieAI.Spawn(new Vector3(0,0,8)); Check(z!=null,"spawn target");
                    game.Player.transform.rotation=Quaternion.identity;
                    for(int i=0;i<1000;i++)game.Player.combat.SetFocus(true);
                    Check(game.Player.combat.Focus>=.999f,"focus reaches 100 percent");
                    Physics.SyncTransforms(); int ammo=game.Player.combat.Magazine;float heatBeforeShot=game.Pressure.At(Vector2Int.zero); game.Player.combat.Fire();
                    Check(game.Player.combat.Magazine==ammo-1,"shot consumes one round"); Check(z.State==ZombieState.Dead,"focused unobstructed shot kills target");
                    Check(game.Journey.Alert>game.balance.pursuit.quickSearchAlert,"gunshot raises pursuit beyond fast search");
                    Check(game.Pressure.At(Vector2Int.zero)>heatBeforeShot,"gunshot intensifies the current district");
                    var runner=ZombieAI.Spawn(new Vector3(-5,0,8),null,null,1,ZombieVariant.Runner);
                    var armored=ZombieAI.Spawn(new Vector3(5,0,8),null,null,1,ZombieVariant.Armored);
                    Check(runner && armored && runner.Health<game.balance.zombie.health && armored.Health>game.balance.zombie.health,"runner and armored health differ from standard infected");
                    float armoredBefore=armored.Health;armored.TakeHit(25,false,false,Vector3.forward);
                    Check(Mathf.Abs(armoredBefore-armored.Health-25*game.balance.zombieVariants[2].bodyDamage)<.01f,"armored infected resists body shots");
                    armoredBefore=armored.Health;armored.TakeHit(25,true,false,Vector3.forward);
                    Check(Mathf.Abs(armoredBefore-armored.Health-25)<.01f,"focused headshots bypass body armor");
                    UnityEngine.Object.Destroy(runner.gameObject);UnityEngine.Object.Destroy(armored.gameObject);
                    game.Player.combat.Reload(); phase=3;
                } else if(phase==3 && elapsed>9) {
                    Check(!game.Player.combat.Reloading && game.Player.combat.Magazine==game.balance.weapon.magazineSize,"reload transfers reserve ammunition");
                    game.Survival.Add(ResourceKind.Scrap,10);game.Survival.Add(ResourceKind.Electronics,4);
                    Check(game.Survival.Craft(2),"repair kit crafting"); Check(game.Survival.Count(ResourceKind.RepairKit)==1,"repair kit inventory");
                    Teleport(new Vector3(805,0,0)); phase=4;
                } else if(phase==4 && elapsed>11) {
                    Check(game.Map.LoadedChunks==9,"stream boundary keeps chunk count bounded");
                    Check(UnityEngine.Object.FindObjectsByType<EnterableBuilding>(FindObjectsSortMode.None).Length==54,"old chunks unloaded");
                    string fixture="{\"elements\":[{\"type\":\"node\",\"id\":9001,\"lat\":37.4989,\"lon\":127.0286,\"tags\":{\"amenity\":\"police\"}},{\"type\":\"node\",\"id\":9004,\"lat\":37.4989,\"lon\":127.0296,\"tags\":{\"shop\":\"convenience\",\"name\":\"동네 편의점\"}},{\"type\":\"way\",\"id\":9002,\"tags\":{\"highway\":\"residential\"},\"geometry\":[{\"lat\":37.4989,\"lon\":127.0286},{\"lat\":37.4990,\"lon\":127.0286}]},{\"type\":\"way\",\"id\":9003,\"center\":{\"lat\":37.4989,\"lon\":127.0296},\"tags\":{\"building\":\"apartments\",\"building:levels\":\"5\"},\"geometry\":[{\"lat\":37.49885,\"lon\":127.02955},{\"lat\":37.49885,\"lon\":127.02965},{\"lat\":37.49895,\"lon\":127.02965},{\"lat\":37.49895,\"lon\":127.02955},{\"lat\":37.49885,\"lon\":127.02955}]},{\"type\":\"way\",\"id\":9005,\"tags\":{\"leisure\":\"park\"},\"geometry\":[{\"lat\":37.49885,\"lon\":127.03055},{\"lat\":37.49885,\"lon\":127.03065},{\"lat\":37.49895,\"lon\":127.03065},{\"lat\":37.49895,\"lon\":127.03055},{\"lat\":37.49885,\"lon\":127.03055}]}]}";
                    Check(RealWorldMapManager.TryParse(fixture,out var mapFixture),"OSM node and road geometry parsed");
                    Transform originChunk=null; foreach(Transform child in game.Map.transform)if(child.position==Vector3.zero)originChunk=child;
                    typeof(RealWorldMapManager).GetMethod("ApplyMap",System.Reflection.BindingFlags.NonPublic|System.Reflection.BindingFlags.Instance).Invoke(game.Map,new object[]{originChunk.gameObject,Vector2Int.zero,mapFixture});
                    Check(game.Map.Status.Contains("시설 2") && game.Map.Status.Contains("도로 1") && game.Map.Status.Contains("건물 1") && game.Map.Status.Contains("공원·물가 1"),"OSM fixture creates projected facilities, road, footprint and park: "+game.Map.Status);
                    Check(game.Map.Buildings.Count==1 && game.Map.Buildings[0].Floors==5 && game.Map.Buildings[0].HeightReported && game.Map.Buildings[0].Playable && game.Map.Buildings[0].GetComponentInChildren<LootBox>()?.facility==Facility.Convenience && game.Map.Buildings[0].BuildingName=="동네 편의점","mapped five-floor building uses its real convenience-store POI and playable ground floor");
                    Check(game.Map.Surfaces.Count==1 && !game.Map.Surfaces[0].Water,"mapped park uses its OSM polygon");
                    Teleport(game.Survival.Tower.position+new Vector3(0,0,-3));game.Map.BuildNavigation(game.Player.transform.position);
                    game.balance.defenseSeconds=3; game.balance.signalWindowSeconds=.5f; Check(game.Survival.ActivateTower(),"transmitter consumes repair kit and starts defense");
                    Check(game.Survival.Count(ResourceKind.RepairKit)==0,"repair kit consumed once"); phase=5;
                } else if(phase==5 && elapsed>13) {
                    Check(!game.Survival.Victory && game.Survival.SignalSeconds<=0 && game.Survival.Remaining>2,"loss of radio signal pauses evacuation");
                    game.balance.signalWindowSeconds=20;game.Player.SetAimInput(Vector2.up);game.Player.SetFocusInput(true);phase=6;
                } else if(phase==6 && elapsed>20) {
                    Check(game.Survival.SignalSeconds>0,"focused aim at transmitter restores radio signal");
                    Check(game.Survival.Victory,"defense completes victory loop");
                    game.Campaign.ReturnHome();
                    Check(game.Campaign.CompletedOperations==1 && game.Running && game.Campaign.AtHome,"extraction continues persistent campaign at shelter");
                    game.Campaign.ReturnHome();Check(game.Campaign.CompletedOperations==1,"extraction rewards cannot be duplicated");
                    game.Survival.Add(ResourceKind.Scrap,20);game.Survival.Add(ResourceKind.Electronics,10);game.Survival.Add(ResourceKind.Food,5);
                    Check(game.Campaign.Upgrade(true) && game.Campaign.WorkshopLevel==1,"workshop upgrade spends resources");
                    float alertBeforeRest=game.Journey.Alert;Check(game.Campaign.Rest() && game.Journey.Alert<alertBeforeRest,"shelter rest consumes food and calms pursuit");
                    game.Survival.Add(ResourceKind.Water,1);int water=game.Survival.Count(ResourceKind.Water);game.Campaign.SpendStamina(30);float tired=game.Campaign.Stamina;game.Campaign.Drink();
                    Check(game.Survival.Count(ResourceKind.Water)==water-1 && game.Campaign.Stamina>=tired+24.9f,"water restores stamina and is consumed once");
                    var scooter=new GameObject("Battery check scooter").AddComponent<RideableVehicle>();scooter.Initialize(game,game.balance.vehicles[1],SurvivalCampaign.Home+Vector3.forward*3,null,Color.blue);
                    scooter.Restore(scooter.transform.position,0);Teleport(scooter.transform.position+Vector3.right);
                    game.Survival.Add(ResourceKind.Battery,1);Check(scooter.Charge() && game.Survival.Count(ResourceKind.Battery)==0 && scooter.RemainingRange>0,"found battery recharges scooter");
                    UnityEngine.Object.Destroy(scooter.gameObject);
                    Teleport(SurvivalCampaign.Home+Vector3.forward*2);game.Map.BuildNavigation(game.Player.transform.position);
                    Check(!game.Survival.UseFlare(),"flare cannot be thrown without inventory");
                    Check(game.Survival.Craft(4) && game.Survival.Count(ResourceKind.SignalFlare)==1,"flare can be crafted from electronics and scrap");
                    Check(game.Survival.UseFlare() && game.Survival.Count(ResourceKind.SignalFlare)==0,"crafted flare consumes once and creates a decoy");
                    Check(game.Campaign.AcceptRelief() && !game.Campaign.AcceptRelief(),"shelter accepts one relief contract at a time");
                    var reliefBox=new GameObject("Relief contract check").AddComponent<LootBox>();reliefBox.transform.position=Vector3.zero;
                    reliefBox.Initialize(game.Campaign.CurrentRelief.facility,"test-relief",null);Teleport(Vector3.forward);
                    Check(!game.Campaign.DeliverRelief() && reliefBox.TryOpen() && game.Campaign.ReliefRecovered,"only fresh matching facility loot completes recovery");
                    Teleport(SurvivalCampaign.Home+Vector3.forward*2);
                    game.Campaign.SavePath=Path.GetFullPath("Logs/campaign-check-"+Guid.NewGuid()+".json");
                    typeof(SurvivalCampaign).GetProperty("PersistenceEnabled").SetValue(game.Campaign,true);
                    game.Pressure.RecordNoise(SurvivalCampaign.Home,40);float savedHeat=game.Pressure.At(Vector2Int.zero);
                    Check(game.Campaign.SaveNow(),"atomic campaign save");
                    int food=game.Survival.Count(ResourceKind.Food);Check(game.Campaign.SaveNow(),"backup checkpoint created");
                    game.Survival.Add(ResourceKind.Food,90);game.Pressure.Restore(null);Check(game.Campaign.Load() && game.Survival.Count(ResourceKind.Food)==food,"inventory and progress restore");
                    Check(Mathf.Abs(game.Pressure.At(Vector2Int.zero)-savedHeat)<.01f,"district pressure survives campaign save and reload");
                    Check(game.Campaign.ReliefActive && game.Campaign.ReliefRecovered,"relief recovery survives reload");
                    int reliefCount=game.Campaign.CompletedReliefContracts;Check(game.Campaign.DeliverRelief() && game.Campaign.CompletedReliefContracts==reliefCount+1 && !game.Campaign.DeliverRelief(),"relief reward can be claimed once");
                    File.WriteAllText(game.Campaign.SavePath,"{broken");Check(game.Campaign.Load() && game.Campaign.CompletedOperations==1,"corrupt primary recovers valid backup");
                    Check(game.Campaign.SaveNow() && SurvivalCampaign.Parse(File.ReadAllText(game.Campaign.SavePath+".bak")).completedOperations==1,"saving after recovery preserves valid backup");
                    bool rejected=false;try{SurvivalCampaign.Parse("{}");}catch(InvalidDataException){rejected=true;}Check(rejected,"malformed campaign rejected");
                    typeof(SurvivalCampaign).GetProperty("PersistenceEnabled").SetValue(game.Campaign,false);
                    Directory.CreateDirectory("Logs"); ScreenCapture.CaptureScreenshot(Path.GetFullPath("Logs/playcheck-victory.png")); phase=7;
                } else if(phase==7 && elapsed>22) {
                    game.Campaign.TogglePanel();Teleport(Vector3.zero);
                    foreach(var zombie in ZombieAI.Active.ToArray())if(zombie)UnityEngine.Object.Destroy(zombie.gameObject);
                    searchBox=new GameObject("Careful search check").AddComponent<LootBox>();searchBox.transform.position=Vector3.forward;
                    searchBox.Initialize(Facility.Police,"test-careful",null);game.balance.carefulSearchSeconds=.2f;
                    game.Survival.Interact(true);Check(game.Survival.Searching,"careful search starts timed interaction");game.Player.Damage(1);phase=8;
                } else if(phase==8 && elapsed>23) {
                    Check(!game.Survival.Searching && !searchBox.Opened,"damage cancels careful search without consuming loot");
                    searchScrap=game.Survival.Count(ResourceKind.Scrap);searchBattery=game.Survival.Count(ResourceKind.Battery);searchAlert=game.Journey.Alert;game.Survival.Interact(true);phase=9;
                } else if(phase==9 && elapsed>24) {
                    Check(searchBox.Opened && game.Survival.Count(ResourceKind.Scrap)>=searchScrap+2,"completed careful search grants extra components");
                    Check(game.Survival.Count(ResourceKind.Battery)==searchBattery+1,"careful search in transit district grants battery bonus");
                    Check(Mathf.Abs(game.Journey.Alert-searchAlert)<.001f,"careful search avoids extra pursuit");
                    Check(!game.Campaign.SpendStamina(101),"insufficient stamina rejects melee cost");
                    var sample=Resources.Load<TextAsset>("MapSnapshots/Gangnam");Check(RealWorldMapManager.TryParse(sample.text,out var mappedSample),"bundled Gangnam snapshot parses in Play Mode");
                    Transform sampleChunk=null;foreach(Transform child in game.Map.transform)if(child.position==Vector3.zero)sampleChunk=child;
                    typeof(RealWorldMapManager).GetMethod("ApplyMap",System.Reflection.BindingFlags.NonPublic|System.Reflection.BindingFlags.Instance).Invoke(game.Map,new object[]{sampleChunk.gameObject,Vector2Int.zero,mappedSample});
                    Check(game.Map.Buildings.Count>=25 && game.Map.Buildings.Count<=91 && game.Map.CurrentChunkMapped,"real Gangnam snapshot creates bounded mapped buildings");
                    Teleport(new Vector3(2405,0,0));typeof(RealWorldMapManager).GetMethod("Refresh",System.Reflection.BindingFlags.NonPublic|System.Reflection.BindingFlags.Instance).Invoke(game.Map,null);
                    Check(game.Map.Buildings.Count==0 && game.Map.Surfaces.Count==0 && game.Map.LoadedChunks==9 && !game.Map.CurrentChunkMapped,"streaming releases distant mapped buildings and parks");Finish();
                }
                if(EditorApplication.timeSinceStartup-wallStart>90) {Check(false,"playtest timeout");Finish();}
            } catch(Exception e) {failed=true;results.Add(e.ToString());Finish();}
        }
        static void Finish() { EditorApplication.update-=Tick; Application.logMessageReceived-=Log; Directory.CreateDirectory("Logs"); File.WriteAllLines("Logs/playchecks.txt",results); SessionState.SetBool("SeoulChecksFailed",failed); EditorApplication.ExitPlaymode(); }
    }
}
