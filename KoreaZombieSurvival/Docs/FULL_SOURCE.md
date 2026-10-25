# 전체 자체 C# 소스

자동 생성 문서. 수정은 표시된 원본 파일에서 수행합니다.

## Assets/Game/Editor/ArtSetup.cs

```csharp
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Animations;
using UnityEngine;

namespace SeoulSurvival.Editor
{
    public static class ArtSetup
    {
        const string Root="Assets/Game/Art/Kenney/";
        [MenuItem("Seoul Survival/Apply licensed art")]
        public static void Apply()
        {
            Directory.CreateDirectory("Assets/Game/Resources/Props");Directory.CreateDirectory("Assets/Game/Art/Generated");AssetDatabase.Refresh();
            var boot=Object.FindFirstObjectByType<GameBootstrap>();if(!boot)return;
            string model=Root+"Characters/Model/characterMedium.fbx";
            foreach(string path in new[]{model,Root+"Characters/Animations/idle.fbx",Root+"Characters/Animations/run.fbx"}) {
                var importer=AssetImporter.GetAtPath(path) as ModelImporter;if(!importer)continue;
                if(importer.animationType!=ModelImporterAnimationType.Generic){importer.animationType=ModelImporterAnimationType.Generic;importer.importAnimation=true;importer.SaveAndReimport();}
            }
            var controller=AssetDatabase.LoadAssetAtPath<AnimatorController>("Assets/Game/Art/Generated/Survivor.controller");
            if(!controller) {
                controller=AnimatorController.CreateAnimatorControllerAtPath("Assets/Game/Art/Generated/Survivor.controller");controller.AddParameter("Speed",AnimatorControllerParameterType.Float);controller.AddParameter("IsAiming",AnimatorControllerParameterType.Bool);controller.AddParameter("AttackTrigger",AnimatorControllerParameterType.Trigger);controller.AddParameter("HeadshotDie",AnimatorControllerParameterType.Bool);
                var machine=controller.layers[0].stateMachine;var idle=machine.AddState("Idle");var run=machine.AddState("Run");idle.motion=Clip("idle");run.motion=Clip("run");machine.defaultState=idle;
                var walk=idle.AddTransition(run);walk.hasExitTime=false;walk.duration=.15f;walk.AddCondition(AnimatorConditionMode.Greater,.15f,"Speed");var stop=run.AddTransition(idle);stop.hasExitTime=false;stop.duration=.15f;stop.AddCondition(AnimatorConditionMode.Less,.15f,"Speed");
            }
            var player=Character(model,"survivorMaleB","Player");var zombie=Character(model,"zombieA","Zombie");
            if(!boot.assets.playerPrefab)boot.assets.playerPrefab=player;
            if(!boot.assets.zombiePrefab)boot.assets.zombiePrefab=zombie;
            if(!boot.assets.playerAnimator)boot.assets.playerAnimator=controller;if(!boot.assets.zombieAnimator)boot.assets.zombieAnimator=controller;
            var propMat=MakeMaterial("Props",Root+"Props/Textures/variation-a.png");
            string[] names={"chest","barrel","bedroll","workbench","tree","rock-a","tool-axe","fence-fortified"};string[] output={"Chest","Barrel","Bedroll","Workbench","Tree","Rock","Axe","Barricade"};float[] sizes={1.2f,1.1f,2,2,5,1.5f,1.1f,3.4f};
            for(int i=0;i<names.Length;i++) {
                string path="Assets/Game/Resources/Props/"+output[i]+".prefab";if(AssetDatabase.LoadAssetAtPath<GameObject>(path))continue;
                var source=AssetDatabase.LoadAssetAtPath<GameObject>(Root+"Props/"+names[i]+".fbx");if(!source)continue;
                var container=new GameObject(output[i]);var instance=Object.Instantiate(source,container.transform);Fit(instance,sizes[i],false);foreach(var r in instance.GetComponentsInChildren<Renderer>())r.sharedMaterial=propMat;
                if(output[i]=="Chest"||output[i]=="Barricade"){var col=container.AddComponent<BoxCollider>();col.size=output[i]=="Chest"?new Vector3(1.2f,.8f,.85f):new Vector3(3.4f,1.4f,.8f);col.center=Vector3.up*col.size.y/2;}
                PrefabUtility.SaveAsPrefabAsset(container,path);Object.DestroyImmediate(container);
            }
            if(!boot.assets.lootPrefab)boot.assets.lootPrefab=AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Game/Resources/Props/Chest.prefab");
            if(!boot.assets.barricadePrefab)boot.assets.barricadePrefab=AssetDatabase.LoadAssetAtPath<GameObject>("Assets/Game/Resources/Props/Barricade.prefab");
            EditorUtility.SetDirty(boot);AssetDatabase.SaveAssets();UnityEditor.SceneManagement.EditorSceneManager.SaveScene(boot.gameObject.scene);
            Debug.Log("SEOUL_LICENSED_ART_READY");
        }
        static AnimationClip Clip(string name)
        {
            var source=AssetDatabase.LoadAllAssetsAtPath(Root+"Characters/Animations/"+name+".fbx").OfType<AnimationClip>().FirstOrDefault(c=>!c.name.StartsWith("__preview"));if(!source)return null;
            var clip=Object.Instantiate(source);var settings=AnimationUtility.GetAnimationClipSettings(clip);settings.loopTime=true;AnimationUtility.SetAnimationClipSettings(clip,settings);AssetDatabase.CreateAsset(clip,"Assets/Game/Art/Generated/"+name+".anim");return clip;
        }
        static Material MakeMaterial(string name,string texture)
        {
            string path="Assets/Game/Art/Generated/"+name+".mat";var mat=AssetDatabase.LoadAssetAtPath<Material>(path);if(mat)return mat;
            mat=new Material(Shader.Find("Standard"));mat.mainTexture=AssetDatabase.LoadAssetAtPath<Texture2D>(texture);mat.SetFloat("_Glossiness",.12f);AssetDatabase.CreateAsset(mat,path);return mat;
        }
        static GameObject Character(string path,string skin,string name)
        {
            string output="Assets/Game/Art/Generated/"+name+".prefab";var existing=AssetDatabase.LoadAssetAtPath<GameObject>(output);
            if(existing){var contents=PrefabUtility.LoadPrefabContents(output);BindSkeleton(contents);PrefabUtility.SaveAsPrefabAsset(contents,output);PrefabUtility.UnloadPrefabContents(contents);return AssetDatabase.LoadAssetAtPath<GameObject>(output);}
            var container=new GameObject(name);var model=Object.Instantiate(AssetDatabase.LoadAssetAtPath<GameObject>(path),container.transform);Fit(model,1.85f,true);
            var mat=MakeMaterial(skin,Root+"Characters/Skins/"+skin+".png");foreach(var r in model.GetComponentsInChildren<Renderer>())r.sharedMaterial=mat;
            BindSkeleton(container);var prefab=PrefabUtility.SaveAsPrefabAsset(container,output);Object.DestroyImmediate(container);return prefab;
        }
        static void BindSkeleton(GameObject container)
        {
            // Kenney clips are relative to the skeleton Root, whose FBX unit scale is 100.
            var root=container.GetComponentsInChildren<Transform>().First(t=>t.name=="Root");
            if(!root.GetComponent<Animator>())root.gameObject.AddComponent<Animator>();
        }
        static void Fit(GameObject model,float size,bool height)
        {
            model.transform.localPosition=Vector3.zero;model.transform.localRotation=Quaternion.identity;var renderers=model.GetComponentsInChildren<Renderer>();if(renderers.Length==0)return;
            var b=renderers[0].bounds;foreach(var r in renderers)b.Encapsulate(r.bounds);float extent=height?b.size.y:Mathf.Max(b.size.x,b.size.y,b.size.z);model.transform.localScale*=size/Mathf.Max(.01f,extent);
            b=renderers[0].bounds;foreach(var r in renderers)b.Encapsulate(r.bounds);model.transform.localPosition-=new Vector3(b.center.x,b.min.y,b.center.z);
        }
    }
}
```

## Assets/Game/Editor/McpAutomation.cs

```csharp
using UnityEditor;
using UnityEngine;
using MCPForUnity.Editor.Services;
using MCPForUnity.Editor.Services.Transport;

namespace SeoulSurvival.Editor
{
    public static class McpAutomation
    {
        [InitializeOnLoadMethod]
        static void ConnectOnEditorOpen()
        {
            if(!Application.isBatchMode)
                EditorApplication.delayCall+=Connect;
        }
        [MenuItem("Seoul Survival/Connect local MCP")]
        public static async void Connect()
        {
            EditorPrefs.SetBool("MCPForUnity.UseHttpTransport",true);
            EditorPrefs.SetString("MCPForUnity.HttpUrl","http://127.0.0.1:8080");
            bool connected=await MCPServiceLocator.TransportManager.StartAsync(TransportMode.Http);
            Debug.Log(connected?"SEOUL_MCP_CONNECTED":"SEOUL_MCP_CONNECTION_FAILED");
        }
        public static void OpenAndConnect()
        {
            ProjectAutomation.Prepare(); Connect();
        }
    }
}
```

## Assets/Game/Editor/ProjectAutomation.cs

```csharp
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
```

## Assets/Game/Scripts/AnimationBridge.cs

```csharp
using UnityEngine;
namespace SeoulSurvival
{
    public sealed class AnimationBridge : MonoBehaviour
    {
        public Animator optionalAnimator; public RuntimeAnimatorController optionalController; public Transform visual;
        Vector3 rest; float speed, impulse;
        public void Initialize(Transform model, RuntimeAnimatorController controller)
        {
            visual=model; rest=model.localPosition; optionalAnimator=model.GetComponentInChildren<Animator>(); optionalController=controller;
            if(controller) { if(!optionalAnimator) optionalAnimator=model.gameObject.AddComponent<Animator>(); optionalAnimator.runtimeAnimatorController=controller; }
            if(optionalAnimator) optionalAnimator.applyRootMotion=false;
        }
        bool Has(string name) { if(!optionalAnimator || !optionalAnimator.runtimeAnimatorController)return false; foreach(var p in optionalAnimator.parameters) if(p.name==name)return true; return false; }
        public void Motion(float value,bool aiming) { speed=value; if(Has("Speed")) optionalAnimator.SetFloat("Speed",value); if(Has("IsAiming"))optionalAnimator.SetBool("IsAiming",aiming); }
        public void Attack() { impulse=.2f; if(Has("AttackTrigger"))optionalAnimator.SetTrigger("AttackTrigger"); }
        public void Die(bool headshot) { if(Has("HeadshotDie"))optionalAnimator.SetBool("HeadshotDie",headshot); if(Has("DieTrigger"))optionalAnimator.SetTrigger("DieTrigger"); }
        void Update() { if(!visual)return; impulse=Mathf.MoveTowards(impulse,0,Time.deltaTime); bool animated=optionalAnimator && optionalAnimator.runtimeAnimatorController;visual.localPosition=rest+Vector3.up*Mathf.Sin(Time.time*12)*Mathf.Min(speed,1)*(animated?0:.045f); visual.localRotation=Quaternion.Euler(impulse*100,0,animated?0:Mathf.Sin(Time.time*8)*Mathf.Min(speed,1)*3); }
    }
}
```

## Assets/Game/Scripts/AtmosphereAndAudioManager.cs

```csharp
using System.Collections.Generic;
using UnityEngine;
namespace SeoulSurvival
{
    public sealed class AtmosphereAndAudioManager : MonoBehaviour
    {
        public AudioClip normalShot,headshotCrunch,emptyClick,reload,axe,groan,loot,siren,dayBgm,nightBgm;
        public Light sunlight,flashlight; public float DayFraction {get;private set;}
        public string Caption {get;private set;}="";
        GameBootstrap game; AudioSource effects,music; float captionUntil; readonly Dictionary<SoundKind,AudioClip> procedural=new Dictionary<SoundKind,AudioClip>();
        public void Initialize(GameBootstrap context)
        {
            game=context; var a=game.assets; normalShot=a.shot; headshotCrunch=a.headshot; emptyClick=a.empty; reload=a.reload; axe=a.axe; groan=a.groan; loot=a.loot; siren=a.siren; dayBgm=a.dayBgm; nightBgm=a.nightBgm;
            effects=gameObject.AddComponent<AudioSource>(); effects.spatialBlend=0; effects.volume=.5f;
            music=gameObject.AddComponent<AudioSource>(); music.loop=true; music.volume=.2f;
            sunlight=new GameObject("Day night sun").AddComponent<Light>(); sunlight.type=LightType.Directional; sunlight.shadows=LightShadows.Soft;
            flashlight=new GameObject("Tactical flashlight").AddComponent<Light>(); flashlight.transform.SetParent(game.Player.transform,false); flashlight.transform.localPosition=new Vector3(0,1.25f,.6f); flashlight.type=LightType.Spot; flashlight.range=32; flashlight.spotAngle=65; flashlight.intensity=4; flashlight.shadows=LightShadows.Soft;
            RenderSettings.fog=true; RenderSettings.fogMode=FogMode.ExponentialSquared;
        }
        void Update()
        {
            if(!game)return;
            DayFraction=((game.Campaign?game.Campaign.Elapsed:Time.time)/game.balance.daySeconds+.22f)%1;
            float day=Mathf.Clamp01(Mathf.Sin(DayFraction*Mathf.PI*2)*1.4f);
            sunlight.transform.rotation=Quaternion.Euler(Mathf.Lerp(-25,65,day),35,0); sunlight.intensity=Mathf.Lerp(.08f,1.1f,day); sunlight.color=Color.Lerp(new Color(.25f,.35f,.6f),new Color(1,.9f,.72f),day);
            RenderSettings.ambientLight=Color.Lerp(new Color(.055f,.075f,.12f),new Color(.5f,.55f,.6f),day);
            RenderSettings.fogColor=Color.Lerp(new Color(.025f,.045f,.07f),new Color(.28f,.35f,.38f),day); RenderSettings.fogDensity=Mathf.Lerp(.022f,.006f,day);
            flashlight.enabled=day<.35f;
            var clip=day<.35f?nightBgm:dayBgm; if(music.clip!=clip) { music.clip=clip; if(clip)music.Play(); else music.Stop(); }
            if(Time.unscaledTime>captionUntil)Caption="";
        }
        public void Play(SoundKind kind,Vector3 position,float noiseRadius=0,AudioClip overrideClip=null)
        {
            if(noiseRadius>0){ZombieAI.HearNoise(position,noiseRadius);if(game.Pressure)game.Pressure.RecordNoise(position,noiseRadius);}
            var clip=overrideClip ? overrideClip : kind==SoundKind.Shot?normalShot:kind==SoundKind.Headshot?headshotCrunch:kind==SoundKind.Empty?emptyClick:kind==SoundKind.Reload?reload:kind==SoundKind.Axe?axe:kind==SoundKind.Groan?groan:kind==SoundKind.Loot?loot:siren;
            if(!clip) { if(!procedural.TryGetValue(kind,out clip)) { clip=Synthesize(kind); procedural[kind]=clip; } }
            effects.PlayOneShot(clip,kind==SoundKind.Groan?.3f:.8f);
            Caption=kind==SoundKind.Shot?$"[탕! 총성 발생 - 반경 {noiseRadius:0}m 좀비 어그로!]":$"[{kind} · 소리 발생]"; captionUntil=Time.unscaledTime+2;
        }
        AudioClip Synthesize(SoundKind kind)
        {
            const int rate=22050; float duration=kind==SoundKind.Siren?1.5f:.16f; var samples=new float[(int)(rate*duration)]; var random=new System.Random((int)kind+17);
            for(int i=0;i<samples.Length;i++) { float t=(float)i/rate; float frequency=kind==SoundKind.Headshot?90:kind==SoundKind.Empty?1300:kind==SoundKind.Siren?600+Mathf.Sin(t*12)*250:kind==SoundKind.Loot?800:160; float tone=Mathf.Sin(2*Mathf.PI*frequency*t); float noise=(float)random.NextDouble()*2-1; samples[i]=(tone*.45f+noise*(kind==SoundKind.Shot?.55f:.15f))*Mathf.Exp(-t/(duration*.25f))*.5f; }
            var clip=AudioClip.Create("Generated "+kind,samples.Length,1,rate,false); clip.SetData(samples,0); return clip;
        }
        void OnDestroy() { foreach(var c in procedural.Values)Destroy(c); if(sunlight)Destroy(sunlight.gameObject); }
    }
}
```

## Assets/Game/Scripts/BundledPlaceCatalog.cs

```csharp
using System;
using System.Collections.Generic;
using UnityEngine;

namespace SeoulSurvival
{
    // Named places from the three ODbL map snapshots already shipped with the game.
    public static class BundledPlaceCatalog
    {
        sealed class Place { public string area,name; public double lat,lon; }
        static List<Place> places;
        static void Load()
        {
            if(places!=null)return;
            places=new List<Place>();
            foreach(var area in new[]{"Nowon","Jamsil","Gangnam"})
            {
                var source=Resources.Load<TextAsset>("MapSnapshots/"+area);
                if(!source || !RealWorldMapManager.TryParse(source.text,out var map))continue;
                string koreanArea=area=="Nowon"?"노원":area=="Jamsil"?"잠실":"강남";
                foreach(var element in map.elements)
                {
                    var name=element?.tags?.name;
                    if(string.IsNullOrWhiteSpace(name) || name.Length>80)continue;
                    double lat=element.lat!=0?element.lat:element.center?.lat??0;
                    double lon=element.lon!=0?element.lon:element.center?.lon??0;
                    if(lat<33 || lat>39 || lon<124 || lon>132)continue;
                    places.Add(new Place{area=koreanArea,name=name.Trim(),lat=lat,lon=lon});
                }
            }
        }
        public static bool TryResolve(string input,out string name,out double lat,out double lon)
        {
            name=null;lat=lon=0;
            if(string.IsNullOrWhiteSpace(input) || input.Length>80)return false;
            Load();string query=input.Trim();Place match=null;
            foreach(var place in places)
            {
                if(!query.Equals(place.name,StringComparison.OrdinalIgnoreCase) && !query.Equals(place.area+" "+place.name,StringComparison.OrdinalIgnoreCase))continue;
                if(match!=null && (Math.Abs(match.lat-place.lat)>30.0/111320 || Math.Abs(match.lon-place.lon)>30.0/90000))return false;
                match=place;
            }
            if(match==null)return false;
            name=match.name;lat=match.lat;lon=match.lon;return true;
        }
    }
}
```

## Assets/Game/Scripts/CombatFeedback.cs

```csharp
using System.Collections.Generic;
using UnityEngine;

namespace SeoulSurvival
{
    public sealed class CombatFeedback : MonoBehaviour
    {
        [Header("Hot-Swap Asset Slots")] public GameObject optionalMuzzlePrefab,optionalImpactPrefab,optionalGunPrefab,optionalRiflePrefab,optionalAxePrefab;
        struct Impact {public Vector3 position;public float damage,until;public bool critical;}
        readonly List<Impact> impacts=new List<Impact>();
        PrecisionCombat combat;LineRenderer streak;Light flash;Transform socket;GameObject gun,rifle,axe;float flashUntil,recoil;
        public void Initialize(PrecisionCombat owner)
        {
            combat=owner;socket=new GameObject("Weapon socket").transform;socket.SetParent(transform,false);socket.localPosition=new Vector3(.32f,1.18f,.55f);
            gun=optionalGunPrefab?Instantiate(optionalGunPrefab,socket):WorldFactory.Box("Pistol",socket,Vector3.zero,new Vector3(.13f,.18f,.55f),new Color(.09f,.12f,.14f),false);
            rifle=optionalRiflePrefab?Instantiate(optionalRiflePrefab,socket):WorldFactory.Box("Scout rifle",socket,new Vector3(0,0,.18f),new Vector3(.14f,.17f,1.15f),new Color(.12f,.15f,.17f),false);
            var axePrefab=optionalAxePrefab?optionalAxePrefab:Resources.Load<GameObject>("Props/Axe");
            axe=axePrefab?Instantiate(axePrefab,socket):WorldFactory.Box("Axe",socket,Vector3.zero,new Vector3(.12f,.8f,.2f),Color.gray,false);
            foreach(var model in new[]{gun,rifle,axe})foreach(var c in model.GetComponentsInChildren<Collider>())c.enabled=false;
            axe.transform.localRotation=Quaternion.Euler(65,0,0);axe.transform.localPosition=new Vector3(0,-.2f,0);
            flash=socket.gameObject.AddComponent<Light>();flash.type=LightType.Point;flash.color=new Color(1,.63f,.18f);flash.range=5;flash.intensity=0;
            streak=new GameObject("Shot tracer").AddComponent<LineRenderer>();streak.transform.SetParent(transform,false);streak.positionCount=2;streak.startWidth=.045f;streak.endWidth=.012f;streak.sharedMaterial=Resources.Load<Material>("CombatLine");streak.enabled=false;
        }
        public void Shot(Vector3 start,Vector3 end)
        {
            flashUntil=Time.unscaledTime+.055f;recoil=1;streak.enabled=true;streak.positionCount=2;streak.SetPosition(0,start);streak.SetPosition(1,end);streak.startColor=new Color(1,.87f,.45f);streak.endColor=new Color(1,.4f,.12f);
            if(optionalMuzzlePrefab)Destroy(Instantiate(optionalMuzzlePrefab,start,transform.rotation),2);
            GameBootstrap.Instance.CameraRig.Shake(.065f);
        }
        public void Hit(Vector3 point,float damage,bool critical)
        {
            if(impacts.Count>=12)impacts.RemoveAt(0);impacts.Add(new Impact{position=point,damage=damage,critical=critical,until=Time.unscaledTime+.7f});
            if(optionalImpactPrefab)Destroy(Instantiate(optionalImpactPrefab,point,Quaternion.identity),2);
        }
        public void Swing(){recoil=2;}
        void LateUpdate()
        {
            if(!combat)return;gun.SetActive(combat.GunEquipped&&!combat.RifleEquipped);rifle.SetActive(combat.RifleEquipped);axe.SetActive(!combat.GunEquipped);
            recoil=Mathf.MoveTowards(recoil,0,Time.unscaledDeltaTime*8);socket.localRotation=Quaternion.Euler(-recoil*16,combat.GunEquipped?0:recoil*60,0);
            bool lit=Time.unscaledTime<flashUntil;flash.intensity=lit?3:0;streak.enabled=lit;
            impacts.RemoveAll(i=>i.until<Time.unscaledTime);
        }
        void OnGUI()
        {
            if(!Camera.main)return;var style=new GUIStyle(GUI.skin.label){font=WorldFactory.KoreanFont,fontSize=18,fontStyle=FontStyle.Bold,alignment=TextAnchor.MiddleCenter};
            foreach(var hit in impacts){var p=Camera.main.WorldToScreenPoint(hit.position+Vector3.up*(.8f+(.7f-hit.until+Time.unscaledTime)));if(p.z<=0)continue;style.normal.textColor=hit.critical?new Color(1,.67f,.26f):Color.white;GUI.Label(new Rect(p.x-70,Screen.height-p.y-20,140,35),hit.critical?$"헤드샷 {hit.damage:0}":$"{hit.damage:0}",style);}
        }
    }
}
```

## Assets/Game/Scripts/DistrictPressure.cs

```csharp
using System;
using System.Collections.Generic;
using UnityEngine;

namespace SeoulSurvival
{
    [Serializable] public class DistrictHeatSave { public int x,y; public float heat; }

    public sealed class DistrictPressure : MonoBehaviour
    {
        readonly Dictionary<Vector2Int,float> heat=new Dictionary<Vector2Int,float>();
        readonly List<Vector2Int> keys=new List<Vector2Int>();
        GameBootstrap game;
        public IReadOnlyDictionary<Vector2Int,float> Heat=>heat;
        public void Initialize(GameBootstrap context){game=context;}
        public float At(Vector2Int chunk)=>heat.TryGetValue(chunk,out var value)?value:0;
        public static float DistanceToChunk(Vector3 point,Vector2Int chunk)
        {
            float x=Mathf.Max(0,Mathf.Abs(point.x-chunk.x*RealWorldMapManager.ChunkSize)-RealWorldMapManager.Radius);
            float z=Mathf.Max(0,Mathf.Abs(point.z-chunk.y*RealWorldMapManager.ChunkSize)-RealWorldMapManager.Radius);
            return Mathf.Sqrt(x*x+z*z);
        }
        public void RecordNoise(Vector3 position,float radius)
        {
            if(!game || !game.Running || radius<=0)return;
            var tuning=game.balance.districtPressure;var center=RealWorldMapManager.ChunkAt(position);
            for(int z=-1;z<=1;z++)for(int x=-1;x<=1;x++)
            {
                var chunk=center+new Vector2Int(x,z);float distance=DistanceToChunk(position,chunk);
                if(distance>=radius)continue;
                float gain=Mathf.Min(radius,180)*tuning.heatPerMetre*(1-distance/radius);
                if(gain<=0)continue;
                if(!heat.ContainsKey(chunk) && heat.Count>=64)
                {
                    var coldest=chunk;float value=float.MaxValue;
                    foreach(var entry in heat)if(entry.Value<value){coldest=entry.Key;value=entry.Value;}
                    if(gain<=value)continue;heat.Remove(coldest);
                }
                heat[chunk]=Mathf.Min(tuning.maximum,At(chunk)+gain);
            }
        }
        void Update()
        {
            if(!game || !game.Running || heat.Count==0)return;
            float decay=game.balance.districtPressure.decayPerMinute*Time.deltaTime/60;
            keys.Clear();keys.AddRange(heat.Keys);
            foreach(var key in keys){float value=heat[key]-decay;if(value<=.001f)heat.Remove(key);else heat[key]=value;}
        }
        public DistrictHeatSave[] Capture()
        {
            var result=new List<DistrictHeatSave>(heat.Count);
            foreach(var entry in heat)result.Add(new DistrictHeatSave{x=entry.Key.x,y=entry.Key.y,heat=entry.Value});
            return result.ToArray();
        }
        public void Restore(DistrictHeatSave[] saved)
        {
            heat.Clear();if(saved==null)return;
            foreach(var entry in saved)if(entry!=null && entry.heat>0)heat[new Vector2Int(entry.x,entry.y)]=entry.heat;
        }
    }
}
```

## Assets/Game/Scripts/EnterableBuilding.cs

```csharp
using UnityEngine;
namespace SeoulSurvival
{
    public sealed class EnterableBuilding : MonoBehaviour
    {
        public Facility facility; public string persistentId; public GameObject optionalExteriorPrefab, optionalLootPrefab;
        public GameObject roof; public bool IsInside {get;private set;}
        public static readonly Color[] Colors={new Color(.12f,.35f,.7f),new Color(.7f,.15f,.1f),new Color(.85f,.65f,.12f),new Color(.2f,.55f,.3f),new Color(.38f,.43f,.48f),new Color(.42f,.25f,.16f)};
        public void Build(Facility kind,string id)
        {
            facility=kind; persistentId=id; var game=GameBootstrap.Instance;
            optionalExteriorPrefab=game.assets.buildingPrefabs.Length>(int)kind ? game.assets.buildingPrefabs[(int)kind] : null;
            optionalLootPrefab=game.assets.lootPrefab;
            if(optionalExteriorPrefab) {
                var shell=Instantiate(optionalExteriorPrefab,transform); roof=shell.transform.Find("Roof")?.gameObject;
            } else {
                var color=Colors[(int)kind];
                WorldFactory.Box("Floor",transform,new Vector3(0,-.02f,0),new Vector3(14,.1f,12),new Color(.34f,.34f,.3f));
                WorldFactory.Box("Back wall",transform,new Vector3(0,1.5f,6),new Vector3(14,3,.3f),color);
                WorldFactory.Box("West wall",transform,new Vector3(-7,1.5f,0),new Vector3(.3f,3,12),color);
                WorldFactory.Box("East wall",transform,new Vector3(7,1.5f,0),new Vector3(.3f,3,12),color);
                WorldFactory.Box("Front left",transform,new Vector3(-4.3f,1.5f,-6),new Vector3(5.4f,3,.3f),color);
                WorldFactory.Box("Front right",transform,new Vector3(4.3f,1.5f,-6),new Vector3(5.4f,3,.3f),color);
                WorldFactory.Box("Door lintel",transform,new Vector3(0,2.8f,-6),new Vector3(3.2f,.4f,.3f),color);
                WorldFactory.Box("Partition",transform,new Vector3(1,1.25f,2.5f),new Vector3(.2f,2.5f,6),color*.8f);
                WorldFactory.Box("Desk",transform,new Vector3(4,.45f,3),new Vector3(2,.9f,1),new Color(.35f,.23f,.12f));
                roof=WorldFactory.Box("Roof",transform,new Vector3(0,3.1f,0),new Vector3(14.6f,.22f,12.6f),color*.7f,false);
                string[] signs={"동네 파출소","119 안전센터","동네 편의점","우리 초등학교","지역 업무빌딩","다온 빌라"};
                WorldFactory.Box("Signboard",transform,new Vector3(0,3.4f,-6.3f),new Vector3(9,.85f,.15f),color,false);
                WorldFactory.Label(transform,signs[(int)kind],new Vector3(0,3.4f,-6.42f),Color.white,.14f);
                for(int side=-1;side<=1;side+=2){WorldFactory.Box("Window glass",transform,new Vector3(side*4.2f,1.8f,-6.18f),new Vector3(2.6f,1.1f,.04f),new Color(.25f,.52f,.59f),false);WorldFactory.Box("Window sill",transform,new Vector3(side*4.2f,1.2f,-6.24f),new Vector3(2.9f,.12f,.3f),Color.gray,false);}
                var prop=Resources.Load<GameObject>("Props/"+(kind==Facility.Housing?"Bedroll":"Workbench"));if(prop){var furnishing=Instantiate(prop,transform);furnishing.transform.localPosition=new Vector3(-4,0,4.5f);}
                WorldFactory.Box("Entry stripe",transform,new Vector3(0,.02f,-7),new Vector3(3,.05f,2),color,false);
            }
            var trigger=gameObject.AddComponent<BoxCollider>(); trigger.size=new Vector3(13.5f,3,11.6f); trigger.center=Vector3.up*1.5f; trigger.isTrigger=true;
            var box=new GameObject("LootBox"); box.transform.SetParent(transform,false); box.transform.localPosition=new Vector3(-4,0,2);
            var loot=box.AddComponent<LootBox>(); loot.Initialize(kind,id+"/loot",optionalLootPrefab);
            ZombieAI.Spawn(transform.TransformPoint(new Vector3(4,0,1)),transform,id+"/guard");
        }
        void Update()
        {
            var player=GameBootstrap.Instance?.Player; if(!player)return;
            // Geometric check also covers teleport/stream loading while already inside.
            var p=transform.InverseTransformPoint(player.transform.position); SetInside(Mathf.Abs(p.x)<6.85f && Mathf.Abs(p.z)<5.9f && p.y<3);
        }
        void OnTriggerEnter(Collider other) { if(other.GetComponent<TacticalPlayerController>())SetInside(true); }
        void OnTriggerExit(Collider other) { if(other.GetComponent<TacticalPlayerController>())SetInside(false); }
        void SetInside(bool inside) { IsInside=inside; if(roof && roof.activeSelf==inside)roof.SetActive(!inside); }
    }
}
```

## Assets/Game/Scripts/GameBalanceAsset.cs

```csharp
using UnityEngine;
namespace SeoulSurvival
{
    [CreateAssetMenu(menuName="Seoul Survival/Game Balance")]
    public sealed class GameBalanceAsset : ScriptableObject
    {
        public GameBalance values=new GameBalance();
        public GameBalance RuntimeCopy(){var copy=JsonUtility.FromJson<GameBalance>(JsonUtility.ToJson(values));copy.Validate();return copy;}
    }
}
```

## Assets/Game/Scripts/GameBootstrap.cs

```csharp
using UnityEngine;

namespace SeoulSurvival
{
    public sealed class GameBootstrap : MonoBehaviour
    {
        public static GameBootstrap Instance { get; private set; }
        public GameBalance balance = new GameBalance();
        public TextAsset balanceJson;
        public GameBalanceAsset balanceAsset;
        public PresentationSlots assets = new PresentationSlots();
        public bool loadResourceJson = true, useOnlineMap = true;
        public bool useBundledGangnamMap = true;
        public bool enablePersistence = true;
        public bool requireJourneySetup = true;
        public SurvivalCampaign Campaign {get;private set;}
        public TacticalPlayerController Player { get; private set; }
        public RealWorldMapManager Map { get; private set; }
        public SurvivalAndEscapeManager Survival { get; private set; }
        public AtmosphereAndAudioManager Atmosphere { get; private set; }
        public QuarterViewCamera CameraRig { get; private set; }
        public JourneyDirector Journey {get;private set;}
        public DistrictPressure Pressure {get;private set;}
        public bool Running => Player && Player.State != PlayerState.Dead && Survival && !Survival.Victory && (!Journey || Journey.Ready);
        void Awake()
        {
            if(Instance && Instance != this) { Destroy(gameObject); return; } Instance=this;
            Time.timeScale=1; Application.targetFrameRate=60; Application.runInBackground=true;
            var json=balanceJson ? balanceJson : loadResourceJson ? Resources.Load<TextAsset>("GameBalance") : null;
            if(json) { try { var loaded=JsonUtility.FromJson<GameBalance>(json.text); loaded.Validate(); balance=loaded; } catch(System.Exception e) { Debug.LogWarning("Balance JSON rejected; using Inspector defaults: "+e.Message); } }
            if(balanceAsset)balance=balanceAsset.RuntimeCopy();
            balance.Validate();
            Atmosphere=gameObject.AddComponent<AtmosphereAndAudioManager>();
            var player=new GameObject("Player"); player.transform.position=new Vector3(0,.15f,14);
            Player=player.AddComponent<TacticalPlayerController>(); Player.Initialize(this);
            var camera=UnityEngine.Camera.main;
            if(!camera) camera=new GameObject("Main Camera",typeof(Camera)).GetComponent<Camera>();
            camera.tag="MainCamera"; if(!camera.GetComponent<AudioListener>()) camera.gameObject.AddComponent<AudioListener>();
            CameraRig=camera.gameObject.AddComponent<QuarterViewCamera>(); CameraRig.target=Player.transform;
            Map=gameObject.AddComponent<RealWorldMapManager>(); Map.online=useOnlineMap; Map.useBundledGangnamMap=useBundledGangnamMap;Map.enabled=false;
            Survival=gameObject.AddComponent<SurvivalAndEscapeManager>(); Survival.Initialize(this);
            Pressure=gameObject.AddComponent<DistrictPressure>(); Pressure.Initialize(this);
            Campaign=gameObject.AddComponent<SurvivalCampaign>();
            Journey=gameObject.AddComponent<JourneyDirector>(); Journey.Initialize(this,requireJourneySetup,enablePersistence);
            Atmosphere.Initialize(this);
            gameObject.AddComponent<MobileControls>();
            gameObject.AddComponent<TacticalMapOverlay>();
        }
        void OnDestroy() { if(Instance==this) { Time.timeScale=1; Instance=null; WorldFactory.ReleaseMaterials(); } }
    }
}
```

## Assets/Game/Scripts/GameData.cs

```csharp
using System;
using UnityEngine;

namespace SeoulSurvival
{
    public enum Facility { Police, FireStation, Convenience, School, Office, Housing }
    public enum PlayerState { Idle, Move, FocusAim, Shoot, MeleeSwing, Reload, Interact, Dead }
    public enum ZombieState { Idle, Patrol, Chase, Attack, HeadshotStun, Dead }
    public enum ZombieVariant { Common, Runner, Armored }
    public enum ResourceKind { Ammo, GunParts, Medkit, AxeUpgrade, Food, Stamina, Scrap, Electronics, RepairKit, ScoutRifle, Water, Battery, SignalFlare }
    public enum SoundKind { Shot, Headshot, Empty, Reload, Axe, Groan, Loot, Siren }
    [Serializable] public class WeaponData
    {
        public int magazineSize = 12, startingReserve = 36;
        public float damage = 25, headshotMultiplier = 4, instantKillChance = .15f;
        public float focusSeconds = .6f, shotInterval = .25f, reloadSeconds = 1.6f;
        public float range = 40, spreadDegrees = 12, noiseRadius = 30;
        public float meleeDamage = 40, meleeRange = 2.7f, meleeArc = 105, meleeInterval = .65f;
    }
    [Serializable] public class ZombieData
    {
        public float health = 100, speed = 2.3f, vision = 18, damage = 12, attackInterval = 1.2f;
        public int maxAlive = 70;
    }
    [Serializable] public class ZombieVariantData
    {
        public float health=1, speed=1, bodyDamage=1, attackDamage=1;
    }
    [Serializable] public class JourneyTuning
    {
        public float encounterSeconds=90,lateEncounterSeconds=25,extraZombieStrength=.5f;
        public float runnerStart=.25f,armoredStart=.65f,runnerChance=.35f,armoredChance=.18f;
        public string[] chapterTitles={"1장 · 마지막 연락", "2장 · 동네의 생존자", "3장 · 봉쇄선을 넘어서", "4장 · 약속 장소의 신호"};
        public int startEnemies=1,endEnemies=5;
        public float reunionHoldSeconds=45,reunionRadius=75,reunionWaveSeconds=8;
        public int reunionWaveSize=3;
    }
    [Serializable] public class PursuitTuning
    {
        public float quickSearchNoise=32, carefulSearchNoise=8;
        public float quickSearchAlert=.08f, gunshotAlert=.015f, restRecovery=.2f, decayPerMinute=.025f;
    }
    [Serializable] public class DistrictPressureTuning
    {
        public float heatPerMetre=.004f, decayPerMinute=.04f, maximum=1, extraEnemies=4;
    }
    [Serializable] public class VehicleData
    {
        public string name;
        public float speed=9,rangeMeters=0,noiseRadius=0,staminaPerSecond=0;
    }
    [Serializable] public class JourneyChoiceData
    {
        public string label;
        public ItemAmount cost,reward;
        public float staminaCost,alertChange,noiseRadius;
        public int zombies;
    }
    [Serializable] public class JourneyEventData
    {
        public float progress;
        public string title,description;
        public JourneyChoiceData first,second;
    }
    [Serializable] public class ItemAmount
    {
        public ResourceKind item; public int count;
        public ItemAmount(ResourceKind item, int count) { this.item = item; this.count = count; }
    }
    [Serializable] public class LootTable { public Facility facility; public ItemAmount[] items; }
    [Serializable] public class DistrictLootBonus { public string districtName; public ItemAmount item; }
    [Serializable] public class ReliefContractData
    {
        public Facility facility; public string title; public ItemAmount reward;
    }
    [Serializable] public class Recipe
    {
        public string name; public ItemAmount[] costs; public ResourceKind output; public int count = 1; public bool barricade;
    }
    [Serializable] public class GameBalance
    {
        public WeaponData weapon = new WeaponData();
        public WeaponData scoutRifle = new WeaponData{magazineSize=20,startingReserve=0,damage=42,headshotMultiplier=3.5f,focusSeconds=.9f,shotInterval=.18f,reloadSeconds=2.4f,range=65,spreadDegrees=7,noiseRadius=50};
        public ZombieData zombie = new ZombieData();
        public ZombieVariantData[] zombieVariants={new ZombieVariantData(),new ZombieVariantData{health=.65f,speed=1.65f,attackDamage=.8f},new ZombieVariantData{health=2,speed=.7f,bodyDamage=.35f,attackDamage=1.4f}};
        public JourneyTuning journey=new JourneyTuning(); public PursuitTuning pursuit=new PursuitTuning(); public DistrictPressureTuning districtPressure=new DistrictPressureTuning();
        public VehicleData[] vehicles={new VehicleData{name="접이식 자전거",speed=9,staminaPerSecond=.7f},new VehicleData{name="배달 전기 스쿠터",speed=15,rangeMeters=3500,noiseRadius=18}};
        public JourneyEventData[] journeyEvents={
            new JourneyEventData{progress=.22f,title="주택가 임시 진료소",description="대피 주민이 식량을 요청합니다. 약품을 나눌 여유가 있다고 합니다.",first=new JourneyChoiceData{label="식량 1개를 건네고 구급상자 1개 받기",cost=new ItemAmount(ResourceKind.Food,1),reward=new ItemAmount(ResourceKind.Medkit,1)},second=new JourneyChoiceData{label="물자를 지키고 떠나기"}},
            new JourneyEventData{progress=.78f,title="한강 접근 · 봉쇄선",description="진행 방향에 봉쇄선이 보입니다. 조용히 돌아가거나 경보를 울리고 밀어붙일 수 있습니다.",first=new JourneyChoiceData{label="골목 우회 · 기력 35 소모 / 추격 감소",staminaCost=35,alertChange=-.1f},second=new JourneyChoiceData{label="경보 속 돌파 · 즉시 좀비 4마리 / 추격 증가",noiseRadius=50,zombies=4,alertChange=.15f}},
            new JourneyEventData{progress=.94f,title="목적지 인근 무전 중계",description="안전한 연락에는 전자부품이 필요합니다. 공개 송신은 더 멀리 들립니다.",first=new JourneyChoiceData{label="전자부품 2개로 암호화 송신 / 추격 감소",cost=new ItemAmount(ResourceKind.Electronics,2),alertChange=-.2f},second=new JourneyChoiceData{label="공개 송신 · 즉시 좀비 5마리 / 추격 증가",noiseRadius=60,zombies=5,alertChange=.2f}}
        };
        public float playerHealth = 100, moveSpeed = 6, defenseSeconds = 60, daySeconds = 1200;
        public float signalWindowSeconds = 20, signalLockSeconds = 1.2f;
        public float hungerPerMinute = 3, staminaRecovery = 12, meleeStamina = 18, carefulSearchSeconds = 2.5f;
        public float flareNoiseRadius=45, flareDuration=8;
        public LootTable[] loot = {
            new LootTable { facility = Facility.Police, items = new[] {new ItemAmount(ResourceKind.Ammo,24),new ItemAmount(ResourceKind.GunParts,2)} },
            new LootTable { facility = Facility.FireStation, items = new[] {new ItemAmount(ResourceKind.Medkit,2),new ItemAmount(ResourceKind.AxeUpgrade,1)} },
            new LootTable { facility = Facility.Convenience, items = new[] {new ItemAmount(ResourceKind.Food,3),new ItemAmount(ResourceKind.Stamina,1),new ItemAmount(ResourceKind.Water,2)} },
            new LootTable { facility = Facility.School, items = new[] {new ItemAmount(ResourceKind.Scrap,6),new ItemAmount(ResourceKind.Electronics,3)} },
            new LootTable { facility = Facility.Office, items = new[] {new ItemAmount(ResourceKind.Scrap,6),new ItemAmount(ResourceKind.Electronics,3),new ItemAmount(ResourceKind.Battery,1)} },
            new LootTable { facility = Facility.Housing, items = new[] {new ItemAmount(ResourceKind.Food,2),new ItemAmount(ResourceKind.Scrap,3),new ItemAmount(ResourceKind.Water,1)} }
        };
        public DistrictLootBonus[] carefulDistrictBonus={
            new DistrictLootBonus{districtName="환승 거점",item=new ItemAmount(ResourceKind.Battery,1)},
            new DistrictLootBonus{districtName="주택 골목",item=new ItemAmount(ResourceKind.Water,1)},
            new DistrictLootBonus{districtName="상업 거리",item=new ItemAmount(ResourceKind.Food,1)}
        };
        public ReliefContractData[] reliefContracts={
            new ReliefContractData{facility=Facility.Police,title="경찰서 · 치안 물자 회수",reward=new ItemAmount(ResourceKind.Medkit,1)},
            new ReliefContractData{facility=Facility.FireStation,title="소방서 · 구조 장비 회수",reward=new ItemAmount(ResourceKind.Food,2)},
            new ReliefContractData{facility=Facility.Convenience,title="편의점 · 비상 식량 회수",reward=new ItemAmount(ResourceKind.Scrap,3)},
            new ReliefContractData{facility=Facility.School,title="학교 · 대피소 부품 회수",reward=new ItemAmount(ResourceKind.Electronics,2)}
        };
        public Recipe[] recipes = {
            new Recipe { name="탄약 12발", costs=new[]{new ItemAmount(ResourceKind.Scrap,2)}, output=ResourceKind.Ammo,count=12 },
            new Recipe { name="바리케이드", costs=new[]{new ItemAmount(ResourceKind.Scrap,2)}, barricade=true },
            new Recipe { name="송신기 수리 키트", costs=new[]{new ItemAmount(ResourceKind.Scrap,6),new ItemAmount(ResourceKind.Electronics,4)},output=ResourceKind.RepairKit },
            new Recipe { name="현장 조립 소총", costs=new[]{new ItemAmount(ResourceKind.GunParts,2),new ItemAmount(ResourceKind.Scrap,4)},output=ResourceKind.ScoutRifle },
            new Recipe { name="유인 신호탄", costs=new[]{new ItemAmount(ResourceKind.Scrap,2),new ItemAmount(ResourceKind.Electronics,1)},output=ResourceKind.SignalFlare }
        };
        public void Validate()
        {
            if(zombieVariants==null || zombieVariants.Length==0)zombieVariants=new GameBalance().zombieVariants;
            if(journey!=null && (journey.chapterTitles==null || journey.chapterTitles.Length==0))journey.chapterTitles=new JourneyTuning().chapterTitles;
            if(journey==null)journey=new JourneyTuning();if(pursuit==null)pursuit=new PursuitTuning();if(districtPressure==null)districtPressure=new DistrictPressureTuning();if(journey.lateEncounterSeconds==0)journey.lateEncounterSeconds=25;if(journey.reunionHoldSeconds==0 && journey.reunionRadius==0){journey.reunionHoldSeconds=45;journey.reunionRadius=75;journey.reunionWaveSeconds=8;journey.reunionWaveSize=3;}if(scoutRifle==null)scoutRifle=new WeaponData{magazineSize=20,damage=42,range=65};if(vehicles==null)vehicles=new VehicleData[0];if(journeyEvents==null || journeyEvents.Length==0)journeyEvents=new GameBalance().journeyEvents;if(reliefContracts==null || reliefContracts.Length==0)reliefContracts=new GameBalance().reliefContracts;if(carefulDistrictBonus==null || carefulDistrictBonus.Length==0)carefulDistrictBonus=new GameBalance().carefulDistrictBonus;if(flareNoiseRadius==0 && flareDuration==0){flareNoiseRadius=45;flareDuration=8;}
            if (weapon == null || zombie == null || journey == null || loot == null || recipes == null || weapon.magazineSize < 1 || weapon.focusSeconds <= 0 || weapon.reloadSeconds <= 0 || weapon.shotInterval <= 0 || weapon.meleeInterval <= 0 || scoutRifle.magazineSize<1 || scoutRifle.focusSeconds<=0 || scoutRifle.reloadSeconds<=0 || zombie.health <= 0 || zombie.attackInterval <= 0 || zombie.maxAlive < 1 || journey.encounterSeconds<=0 || journey.lateEncounterSeconds<=0 || journey.startEnemies<0 || journey.endEnemies<journey.startEnemies || journey.extraZombieStrength<0 || journey.reunionHoldSeconds<=0 || journey.reunionRadius<60 || journey.reunionWaveSeconds<=0 || journey.reunionWaveSize<0 || journey.reunionWaveSize>12 || playerHealth <= 0 || defenseSeconds <= 0 || daySeconds <= 0)
                throw new ArgumentException("Invalid game balance: positive timings, health, magazine and population required.");
            if(zombieVariants.Length!=3)throw new ArgumentException("Three zombie variants required");
            foreach(var variant in zombieVariants)if(variant==null || float.IsNaN(variant.health) || float.IsInfinity(variant.health) || float.IsNaN(variant.speed) || float.IsInfinity(variant.speed) || float.IsNaN(variant.bodyDamage) || float.IsInfinity(variant.bodyDamage) || float.IsNaN(variant.attackDamage) || float.IsInfinity(variant.attackDamage) || variant.health<=0 || variant.speed<=0 || variant.bodyDamage<=0 || variant.attackDamage<=0)throw new ArgumentException("Invalid zombie variant");
            if(journey.runnerStart<0 || journey.armoredStart<=journey.runnerStart || journey.armoredStart>1 || journey.runnerChance<0 || journey.armoredChance<0 || journey.runnerChance+journey.armoredChance>1)throw new ArgumentException("Invalid encounter variants");
            if(journey.chapterTitles.Length!=4)throw new ArgumentException("Four journey chapters required");foreach(var chapter in journey.chapterTitles)if(string.IsNullOrWhiteSpace(chapter))throw new ArgumentException("Journey chapter title missing");
            foreach (var table in loot) { if(table == null || table.items == null) throw new ArgumentException("Invalid loot table"); foreach(var item in table.items) if(item == null || item.count < 0) throw new ArgumentException("Invalid loot count"); }
            if(carefulDistrictBonus.Length!=3)throw new ArgumentException("Three district loot bonuses required");foreach(var bonus in carefulDistrictBonus)if(bonus==null || string.IsNullOrWhiteSpace(bonus.districtName) || bonus.item==null || bonus.item.count<1 || !Enum.IsDefined(typeof(ResourceKind),bonus.item.item) || bonus.item.item==ResourceKind.Ammo)throw new ArgumentException("Invalid district bonus");
            foreach(var contract in reliefContracts)if(contract==null || !Enum.IsDefined(typeof(Facility),contract.facility) || string.IsNullOrWhiteSpace(contract.title) || contract.reward==null || !Enum.IsDefined(typeof(ResourceKind),contract.reward.item) || contract.reward.count<1 || contract.reward.item==ResourceKind.Ammo)throw new ArgumentException("Invalid relief contract");
            if(signalWindowSeconds<=0 || signalLockSeconds<=0)throw new ArgumentException("Signal timings must be positive");
            if(hungerPerMinute<0 || staminaRecovery<=0 || meleeStamina<=0 || carefulSearchSeconds<=0 || flareNoiseRadius<=0 || flareDuration<=0)throw new ArgumentException("Survival rates invalid");
            if(pursuit.quickSearchNoise<0 || pursuit.carefulSearchNoise<0 || pursuit.quickSearchAlert<0 || pursuit.gunshotAlert<0 || pursuit.restRecovery<0 || pursuit.decayPerMinute<0)throw new ArgumentException("Pursuit tuning invalid");
            if(float.IsNaN(districtPressure.heatPerMetre) || float.IsInfinity(districtPressure.heatPerMetre) || districtPressure.heatPerMetre<=0 || float.IsNaN(districtPressure.decayPerMinute) || float.IsInfinity(districtPressure.decayPerMinute) || districtPressure.decayPerMinute<=0 || float.IsNaN(districtPressure.maximum) || float.IsInfinity(districtPressure.maximum) || districtPressure.maximum<=0 || districtPressure.maximum>1 || float.IsNaN(districtPressure.extraEnemies) || float.IsInfinity(districtPressure.extraEnemies) || districtPressure.extraEnemies<0 || districtPressure.extraEnemies>12)throw new ArgumentException("District pressure tuning invalid");
            foreach(var vehicle in vehicles)if(vehicle==null || string.IsNullOrWhiteSpace(vehicle.name) || vehicle.speed<=0 || vehicle.rangeMeters<0 || vehicle.noiseRadius<0 || vehicle.staminaPerSecond<0)throw new ArgumentException("Vehicle data invalid");
            if(journeyEvents.Length>8)throw new ArgumentException("Too many journey events");float last=0;foreach(var scene in journeyEvents){if(scene==null || scene.progress<=last || scene.progress>=1 || string.IsNullOrWhiteSpace(scene.title) || scene.first==null || scene.second==null)throw new ArgumentException("Journey event invalid");last=scene.progress;foreach(var choice in new[]{scene.first,scene.second})if(string.IsNullOrWhiteSpace(choice.label) || choice.staminaCost<0 || choice.noiseRadius<0 || choice.zombies<0 || choice.zombies>12 || float.IsNaN(choice.alertChange) || (choice.cost!=null && (choice.cost.count<0 || choice.cost.count>0 && choice.cost.item==ResourceKind.Ammo)) || (choice.reward!=null && choice.reward.count<0))throw new ArgumentException("Journey choice invalid");}
            foreach(var recipe in recipes) { if(recipe == null || recipe.costs == null || recipe.count < 1) throw new ArgumentException("Invalid recipe"); foreach(var cost in recipe.costs) if(cost == null || cost.count < 1) throw new ArgumentException("Invalid recipe cost"); }
        }
    }
    [Serializable] public class PresentationSlots
    {
        public GameObject playerPrefab, zombiePrefab, lootPrefab, barricadePrefab, helicopterPrefab, pistolPrefab, riflePrefab, axePrefab, bicyclePrefab, scooterPrefab, muzzlePrefab, impactPrefab, flarePrefab;
        public GameObject runnerZombiePrefab, armoredZombiePrefab;
        public GameObject[] buildingPrefabs = new GameObject[6];
        public RuntimeAnimatorController playerAnimator, zombieAnimator;
        public AudioClip shot, headshot, empty, reload, axe, groan, loot, siren, dayBgm, nightBgm;
    }
}
```

## Assets/Game/Scripts/JourneyDirector.cs

```csharp
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
            float localHeat=game.Pressure.At(RealWorldMapManager.ChunkAt(game.Player.transform.position));
            int count=Mathf.Max(0,Mathf.RoundToInt(Mathf.Lerp(game.balance.journey.startEnemies,game.balance.journey.endEnemies,Progress)+alert*3+localHeat*game.balance.districtPressure.extraEnemies));
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
```

## Assets/Game/Scripts/LootBox.cs

```csharp
using UnityEngine;
namespace SeoulSurvival
{
    public sealed class LootBox : MonoBehaviour
    {
        public Facility facility; public string persistentId; public GameObject optionalPrefab; public bool Opened {get;private set;}
        public void Initialize(Facility kind,string id,GameObject prefab)
        {
            facility=kind; persistentId=id; optionalPrefab=prefab; Opened=GameBootstrap.Instance.Survival.Looted.Contains(id);
            if(prefab)Instantiate(prefab,transform); else WorldFactory.Box("Supply crate",transform,new Vector3(0,.4f,0),new Vector3(1.2f,.8f,.85f),Opened?Color.gray:new Color(.8f,.65f,.28f));
        }
        public bool TryOpen(bool careful=false)
        {
            if(Opened || Vector3.Distance(transform.position,GameBootstrap.Instance.Player.transform.position)>2.5f)return false;
            var game=GameBootstrap.Instance;var survival=game.Survival;
            foreach(var table in game.balance.loot)if(table.facility==facility)foreach(var item in table.items)survival.Add(item.item,item.count);
            if(careful){survival.Add(ResourceKind.Scrap,2);survival.Add(facility==Facility.Police?ResourceKind.GunParts:ResourceKind.Electronics,1);var bonus=game.balance.carefulDistrictBonus[RealWorldMapManager.DistrictKind(RealWorldMapManager.ChunkAt(transform.position))].item;survival.Add(bonus.item,bonus.count);}
            Opened=true; survival.Looted.Add(persistentId); game.Atmosphere.Play(SoundKind.Loot,transform.position,careful?0:game.balance.pursuit.quickSearchNoise);
            if(!careful && game.Journey)game.Journey.ChangeAlert(game.balance.pursuit.quickSearchAlert);
            if(game.Campaign){game.Campaign.RecordReliefLoot(facility);game.Campaign.SaveNow();}
            foreach(var renderer in GetComponentsInChildren<Renderer>())renderer.sharedMaterial=WorldFactory.Material(Color.gray);
            return true;
        }
    }
}
```

## Assets/Game/Scripts/MapSurface.cs

```csharp
using System.Collections.Generic;
using UnityEngine;

namespace SeoulSurvival
{
    public sealed class MapSurface : MonoBehaviour
    {
        public bool Water {get;private set;}
        public IReadOnlyList<Vector3> Outline {get;private set;}
        Mesh mesh;
        public bool Build(List<Vector3> outline,bool water)
        {
            Water=water;Outline=outline;
            mesh=OsmBuildingShell.RoofMesh(outline,water?.04f:.03f);
            if(mesh.triangles.Length<3)return false;
            gameObject.AddComponent<MeshFilter>().sharedMesh=mesh;
            gameObject.AddComponent<MeshRenderer>().sharedMaterial=WorldFactory.Material(water?new Color(.12f,.32f,.44f):new Color(.23f,.41f,.24f));
            return true;
        }
        void OnDestroy(){if(mesh)Destroy(mesh);}
    }
}
```

## Assets/Game/Scripts/MobileControls.cs

```csharp
using UnityEngine;
namespace SeoulSurvival
{
    public sealed class MobileControls : MonoBehaviour
    {
        public bool previewInEditor; public float stickRadius=90;
        void Update()
        {
            if(!Application.isMobilePlatform && !previewInEditor)return;
            var game=GameBootstrap.Instance; if(!game || !game.Running)return;
            Vector2 move=Vector2.zero,aim=Vector2.zero; bool fire=false,focus=false;
            foreach(var touch in Input.touches) {
                if(touch.phase==TouchPhase.Ended || touch.phase==TouchPhase.Canceled)continue;
                var p=touch.position;
                if(p.x<Screen.width*.4f && p.y<Screen.height*.45f)move=Vector2.ClampMagnitude((p-new Vector2(130,150))/stickRadius,1);
                else if(p.x>Screen.width*.6f && p.y<Screen.height*.4f) { aim=Vector2.ClampMagnitude((p-new Vector2(Screen.width-140,150))/stickRadius,1); focus=true; fire=aim.magnitude>.85f && (!game.Player.combat.GunEquipped || game.Player.combat.Focus>=.999f); }
            }
            game.Player.SetMoveInput(move); game.Player.SetAimInput(aim); game.Player.SetFocusInput(focus); game.Player.SetFireInput(fire);
        }
        void OnGUI()
        {
            if(!Application.isMobilePlatform && !previewInEditor)return; var game=GameBootstrap.Instance; if(!game || !game.Running)return;
            GUI.Box(new Rect(40,Screen.height-240,180,180),"이동"); GUI.Box(new Rect(Screen.width-230,Screen.height-240,180,180),"조준 완료 후 끝까지 밀어 발사");
            if(GUI.Button(new Rect(Screen.width-110,230,100,60),"E 획득"))game.Survival.Interact();
            if(GUI.Button(new Rect(Screen.width-110,300,100,60),"R 장전"))game.Player.combat.Reload();
            if(GUI.Button(new Rect(Screen.width-110,370,100,60),"무기 변경"))game.Player.combat.CycleWeapon();
            if(GUI.Button(new Rect(Screen.width-220,230,100,60),"C 조합"))game.Survival.ToggleCrafting();
            if(GUI.Button(new Rect(Screen.width-220,300,100,60),"H 회복"))game.Survival.UseHealing();
            if(GUI.Button(new Rect(Screen.width-220,370,100,60),"정밀 분해"))game.Survival.Interact(true);
            if(GUI.Button(new Rect(Screen.width-330,230,100,60),"식사"))game.Campaign.Eat();
            if(GUI.Button(new Rect(Screen.width-330,300,100,60),"음료"))game.Campaign.Drink();
            if(GUI.Button(new Rect(Screen.width-330,370,100,60),"거점"))game.Campaign.TogglePanel();
            if(GUI.Button(new Rect(Screen.width-440,230,100,60),"유인탄"))game.Survival.UseFlare();
        }
        void OnDisable() { var p=GameBootstrap.Instance?.Player; if(p) {p.SetMoveInput(Vector2.zero);p.SetAimInput(Vector2.zero);p.SetFireInput(false);p.SetFocusInput(false);} }
    }
}
```

## Assets/Game/Scripts/OsmBuildingShell.cs

```csharp
using System.Collections.Generic;
using LibTessDotNet;
using UnityEngine;

namespace SeoulSurvival
{
    // Context buildings preserve OSM outlines; playable interiors are separate EnterableBuilding components.
    public sealed class OsmBuildingShell : MonoBehaviour
    {
        readonly List<UnityEngine.Mesh> owned=new List<UnityEngine.Mesh>();
        readonly List<Renderer> cutaway=new List<Renderer>();Bounds bounds;float nextCheck;List<Vector3> outline;
        public int Floors {get;private set;} public bool HeightReported {get;private set;} public bool Playable {get;private set;} public bool IsInside {get;private set;} public string BuildingName {get;private set;} public Vector3 Entrance {get;private set;}
        public IReadOnlyList<Vector3> Outline=>outline;
        public float DistanceToFootprint(Vector3 world)
        {
            if(outline==null)return float.MaxValue;
            var point=transform.InverseTransformPoint(world);point.y=0;if(Contains(outline,point))return 0;
            float best=float.MaxValue;for(int i=0;i<outline.Count;i++){var a=outline[i];var b=outline[(i+1)%outline.Count];var segment=b-a;float t=Mathf.Clamp01(Vector3.Dot(point-a,segment)/Mathf.Max(.001f,segment.sqrMagnitude));best=Mathf.Min(best,Vector3.Distance(point,a+segment*t));}
            return best;
        }
        public static UnityEngine.Mesh RoofMesh(IList<Vector3> points,float height)
        {
            var contour=new ContourVertex[points.Count];
            for(int i=0;i<points.Count;i++)contour[i].Position=new Vec3(points[i].x,points[i].z,0);
            var tess=new Tess();tess.AddContour(contour);tess.Tessellate(WindingRule.EvenOdd,ElementType.Polygons,3);
            var vertices=new Vector3[tess.VertexCount];for(int i=0;i<vertices.Length;i++)vertices[i]=new Vector3(tess.Vertices[i].Position.X,height,tess.Vertices[i].Position.Y);
            var triangles=new int[tess.ElementCount*3];
            for(int i=0;i<triangles.Length;i+=3){int a=tess.Elements[i],b=tess.Elements[i+1],c=tess.Elements[i+2];if(Vector3.Cross(vertices[b]-vertices[a],vertices[c]-vertices[a]).y<0){int swap=b;b=c;c=swap;}triangles[i]=a;triangles[i+1]=b;triangles[i+2]=c;}
            var mesh=new UnityEngine.Mesh{name="OSM triangulated roof"};mesh.vertices=vertices;mesh.triangles=triangles;mesh.RecalculateNormals();return mesh;
        }
        public static bool Contains(IList<Vector3> polygon,Vector3 point)
        {
            bool inside=false;
            for(int i=0,j=polygon.Count-1;i<polygon.Count;j=i++)
            {
                var a=polygon[i];var b=polygon[j];
                if((a.z>point.z)!=(b.z>point.z) && point.x<(b.x-a.x)*(point.z-a.z)/(b.z-a.z)+a.x)inside=!inside;
            }
            return inside;
        }
        public void Build(List<Vector3> points,float height,Color color,bool playable=false,Facility facility=Facility.Housing,string id=null,string label=null,int floors=0,bool reported=false)
        {
            Playable=playable;Floors=floors;HeightReported=reported;BuildingName=string.IsNullOrWhiteSpace(label)?"지도 건물":label;outline=new List<Vector3>(points);
            float area=0;for(int i=0;i<points.Count;i++){var a=points[i];var b=points[(i+1)%points.Count];area+=a.x*b.z-b.x*a.z;}if(area<0)points.Reverse();
            var walls=new List<Vector3>();var wallTriangles=new List<int>();var windows=new List<Vector3>();var windowTriangles=new List<int>();var low=new List<Vector3>();var lowTriangles=new List<int>();
            int door=-1;float longest=4;if(playable)for(int i=0;i<points.Count;i++){float length=Vector3.Distance(points[i],points[(i+1)%points.Count]);if(length>longest){longest=length;door=i;}}
            for(int i=0;i<points.Count;i++) {
                var a=points[i];var b=points[(i+1)%points.Count];
                if(i==door) {
                    float opening=1.2f/longest;var left=Vector3.Lerp(a,b,.5f-opening);var right=Vector3.Lerp(a,b,.5f+opening);
                    Quad(low,lowTriangles,a,a+Vector3.up*1.1f,left+Vector3.up*1.1f,left);
                    Quad(low,lowTriangles,right,right+Vector3.up*1.1f,b+Vector3.up*1.1f,b);
                    Quad(walls,wallTriangles,a+Vector3.up*1.1f,a+Vector3.up*(height+.3f),left+Vector3.up*(height+.3f),left+Vector3.up*1.1f);
                    Quad(walls,wallTriangles,right+Vector3.up*1.1f,right+Vector3.up*(height+.3f),b+Vector3.up*(height+.3f),b+Vector3.up*1.1f);
                    Quad(walls,wallTriangles,left+Vector3.up*2.4f,left+Vector3.up*(height+.3f),right+Vector3.up*(height+.3f),right+Vector3.up*2.4f);
                } else {
                    Quad(low,lowTriangles,a,a+Vector3.up*1.1f,b+Vector3.up*1.1f,b);
                    Quad(walls,wallTriangles,a+Vector3.up*1.1f,a+Vector3.up*(height+.3f),b+Vector3.up*(height+.3f),b+Vector3.up*1.1f);
                }
                float length=Vector3.Distance(a,b);var outside=Vector3.Cross(Vector3.up,(b-a).normalized)*.025f;
                int columns=Mathf.Clamp(Mathf.FloorToInt(length/3),1,6),windowRows=Mathf.Clamp(Mathf.FloorToInt(height/2.8f),1,12);
                for(int floor=0;floor<windowRows;floor++)for(int column=0;column<columns;column++) {
                    if(i==door && floor==0 && (column+.5f)/columns>.3f && (column+.5f)/columns<.7f)continue;
                    float sill=(floor+.5f)*height/windowRows-.65f;
                    var left=Vector3.Lerp(a,b,(column+.18f)/columns)+outside+Vector3.up*sill;
                    var right=Vector3.Lerp(a,b,(column+.82f)/columns)+outside+Vector3.up*sill;
                    Quad(windows,windowTriangles,left,left+Vector3.up*1.3f,right+Vector3.up*1.3f,right);
                }
            }
            AddMesh("Low walls",MakeMesh(low,lowTriangles),color,true,false);
            AddMesh("Facade",MakeMesh(walls,wallTriangles),color,true);
            AddMesh("Windows",MakeMesh(windows,windowTriangles),new Color(.16f,.29f,.34f),false);
            var roofMesh=RoofMesh(points,height);AddMesh("Roof",roofMesh,new Color(.21f,.29f,.28f),false);
            Playable=playable && door>=0 && roofMesh.triangles.Length>=3;
            if(Playable)
            {
                AddMesh("Interior floor",RoofMesh(points,.025f),new Color(.33f,.32f,.29f),false,false);
                var entry=(points[door]+points[(door+1)%points.Count])*.5f;
                Entrance=transform.TransformPoint(entry);
                var vertices=roofMesh.vertices;var triangles=roofMesh.triangles;var inside=(vertices[triangles[0]]+vertices[triangles[1]]+vertices[triangles[2]])/3;inside.y=0;
                float nearest=float.MaxValue;for(int i=0;i<triangles.Length;i+=3){var candidate=(vertices[triangles[i]]+vertices[triangles[i+1]]+vertices[triangles[i+2]])/3;candidate.y=0;float distance=(candidate-entry).sqrMagnitude;if(distance>6 && distance<nearest){inside=candidate;nearest=distance;}}
                var box=new GameObject("Mapped ground-floor supplies");box.transform.SetParent(transform,false);box.transform.localPosition=inside;
                box.AddComponent<LootBox>().Initialize(facility,id+"/loot",GameBootstrap.Instance.assets.lootPrefab);
                WorldFactory.Box("Ground-floor counter",transform,Vector3.Lerp(entry,inside,.72f)+Vector3.up*.48f,new Vector3(1.2f,.9f,.55f),color*.7f,false);
                WorldFactory.Label(transform,"출입구 · 가상 1층",entry+Vector3.up*2.6f,Color.white,.07f);
            }
            bounds=cutaway[0].bounds;foreach(var r in cutaway)bounds.Encapsulate(r.bounds);
        }
        static void Quad(List<Vector3> v,List<int> t,Vector3 a,Vector3 b,Vector3 c,Vector3 d){int n=v.Count;v.AddRange(new[]{a,b,c,d});t.AddRange(new[]{n,n+1,n+2,n,n+2,n+3});}
        static UnityEngine.Mesh MakeMesh(List<Vector3> v,List<int> t){var m=new UnityEngine.Mesh();m.SetVertices(v);m.SetTriangles(t,0);m.RecalculateNormals();return m;}
        void AddMesh(string name,UnityEngine.Mesh mesh,Color color,bool collision,bool hideable=true)
        {
            owned.Add(mesh);var go=new GameObject(name);go.transform.SetParent(transform,false);go.AddComponent<MeshFilter>().sharedMesh=mesh;var renderer=go.AddComponent<MeshRenderer>();renderer.sharedMaterial=WorldFactory.Material(color);if(hideable)cutaway.Add(renderer);
            if(collision){go.layer=8;go.AddComponent<MeshCollider>().sharedMesh=mesh;}
        }
        void LateUpdate()
        {
            if(Time.unscaledTime<nextCheck || !GameBootstrap.Instance || !Camera.main)return;nextCheck=Time.unscaledTime+.1f;
            var player=GameBootstrap.Instance.Player.transform.position;var target=player+Vector3.up;var origin=Camera.main.transform.position;var delta=target-origin;
            IsInside=Playable && Mathf.Abs(player.y-transform.position.y)<3 && Contains(outline,transform.InverseTransformPoint(player));
            bool hidden=IsInside || bounds.IntersectRay(new Ray(origin,delta.normalized),out float distance) && distance<delta.magnitude;
            foreach(var r in cutaway)r.enabled=!hidden;
        }
        void OnDestroy(){foreach(var mesh in owned)if(mesh)Destroy(mesh);}
    }
}
```

## Assets/Game/Scripts/PrecisionCombat.cs

```csharp
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
```

## Assets/Game/Scripts/QuarterViewCamera.cs

```csharp
using UnityEngine;
using Unity.Cinemachine;
namespace SeoulSurvival
{
    public sealed class QuarterViewCamera : MonoBehaviour
    {
        public Transform target; public Vector3 offset=new Vector3(14,23,-18); public float follow=10;
        public float explorationZoom=11, focusZoom=9;
        CinemachineImpulseSource impulse;Camera lens;Vector3 anchor;
        void Awake() {
            impulse=gameObject.AddComponent<CinemachineImpulseSource>();
            impulse.ImpulseDefinition.ImpulseType=CinemachineImpulseDefinition.ImpulseTypes.Uniform;
            impulse.ImpulseDefinition.ImpulseShape=CinemachineImpulseDefinition.ImpulseShapes.Recoil;
            impulse.ImpulseDefinition.ImpulseDuration=.18f;
        }
        void Start() { lens=GetComponent<Camera>(); lens.orthographic=true; lens.orthographicSize=explorationZoom; lens.farClipPlane=220; lens.backgroundColor=new Color(.05f,.08f,.1f); if(target)anchor=target.position+offset; }
        public void Shake(float strength) { if(impulse)impulse.GenerateImpulseWithVelocity(new Vector3(strength*.5f,strength,0)); }
        void LateUpdate() {
            if(!target || !lens)return;
            float focus=GameBootstrap.Instance.Player.combat.Focus;
            var destination=target.position+offset+target.forward*focus*2;
            anchor=Vector3.Lerp(anchor,destination,1-Mathf.Exp(-follow*Time.unscaledDeltaTime));
            lens.orthographicSize=Mathf.Lerp(lens.orthographicSize,Mathf.Lerp(explorationZoom,focusZoom,focus),1-Mathf.Exp(-5*Time.unscaledDeltaTime));
            CinemachineImpulseManager.Instance.GetImpulseAt(target.position,false,1,out var displacement,out var rotation);
            transform.SetPositionAndRotation(anchor+displacement,Quaternion.LookRotation(-offset)*rotation);
        }
    }
}
```

## Assets/Game/Scripts/RealWorldMapManager.cs

```csharp
using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using UnityEngine;
using UnityEngine.AI;
using UnityEngine.Networking;

namespace SeoulSurvival
{
    public sealed class RealWorldMapManager : MonoBehaviour
    {
        [Serializable] public class OsmPoint { public double lat,lon; }
        [Serializable] public class OsmTags { public string amenity,shop,building,landuse,highway,leisure,natural,name,buildingLevels,height,levels,tunnel,layer; }
        [Serializable] public class OsmElement { public long id; public string type; public double lat,lon; public OsmPoint center; public OsmPoint[] geometry; public OsmTags tags; }
        [Serializable] public class OsmResponse { public OsmElement[] elements; }
        struct MappedFacility {public Vector3 position;public Facility kind;public string key,name;public bool matched;}
        public double latitude=37.4979, longitude=127.0276;
        public const float Radius=400, ChunkSize=800;
        public bool online=true,useBundledGangnamMap=true; public string endpoint="https://overpass-api.de/api/interpreter";
        public string Status {get;private set;}="절차 도시 준비 중";
        public string AreaLabel {get {var location=WorldToGeo(GameBootstrap.Instance.Player.transform.position);return $"현재 {location.x:F4}, {location.y:F4}";}}
        public struct RoadSegment {public Vector3 a,b;public Vector2Int chunk;public bool synthetic;}
        public readonly List<RoadSegment> Roads=new List<RoadSegment>();
        public readonly List<OsmBuildingShell> Buildings=new List<OsmBuildingShell>();
        public readonly List<MapSurface> Surfaces=new List<MapSurface>();
        readonly Dictionary<Vector2Int,GameObject> chunks=new Dictionary<Vector2Int,GameObject>();
        readonly HashSet<Vector2Int> mapped=new HashSet<Vector2Int>();
        readonly Queue<Vector2Int> requests=new Queue<Vector2Int>();
        NavMeshData navData; NavMeshDataInstance navInstance; Vector3 navCenter; bool navDirty=true; float nextCheck;
        public int LoadedChunks=>chunks.Count;
        public bool CurrentChunkMapped=>mapped.Contains(ChunkAt(GameBootstrap.Instance.Player.transform.position));
        public static Vector2Int ChunkAt(Vector3 position) => new Vector2Int(Mathf.FloorToInt((position.x+Radius)/ChunkSize),Mathf.FloorToInt((position.z+Radius)/ChunkSize));
        public static int DistrictKind(Vector2Int id) => ((id.x*17+id.y*31)%3+3)%3;
        public static string DistrictName(Vector2Int id) => new[]{"환승 거점","주택 골목","상업 거리"}[DistrictKind(id)];
        public Vector3 ToWorld(double lat,double lon) => new Vector3((float)((lon-longitude)*111320*Math.Cos(latitude*Math.PI/180)),0,(float)((lat-latitude)*111320));
        public Vector2 WorldToGeo(Vector3 p) => new Vector2((float)(latitude+p.z/111320),(float)(longitude+p.x/(111320*Math.Cos(latitude*Math.PI/180))));
        void Start() { Refresh(); StartCoroutine(DownloadQueue()); }
        void Update() { if(Time.time<nextCheck)return; nextCheck=Time.time+1; Refresh(); var pos=GameBootstrap.Instance.Player.transform.position; if(navDirty || Vector3.Distance(navCenter,pos)>35)BuildNavigation(pos); }
        void Refresh()
        {
            var center=ChunkAt(GameBootstrap.Instance.Player.transform.position);
            var remove=new List<Vector2Int>(); foreach(var pair in chunks)if(Mathf.Abs(pair.Key.x-center.x)>1 || Mathf.Abs(pair.Key.y-center.y)>1)remove.Add(pair.Key);
            foreach(var id in remove) { var chunk=chunks[id];Buildings.RemoveAll(b=>!b || b.transform.IsChildOf(chunk.transform));Surfaces.RemoveAll(s=>!s || s.transform.IsChildOf(chunk.transform));Destroy(chunk); chunks.Remove(id);mapped.Remove(id);Roads.RemoveAll(r=>r.chunk==id);navDirty=true; }
            var pending=new HashSet<Vector2Int>(requests); requests.Clear(); foreach(var id in pending)if(chunks.ContainsKey(id))requests.Enqueue(id);
            // Current chunk first: immediate playable fallback, network enrichment is asynchronous.
            Load(center); for(int z=-1;z<=1;z++)for(int x=-1;x<=1;x++)Load(center+new Vector2Int(x,z));
        }
        void Load(Vector2Int id)
        {
            if(chunks.ContainsKey(id))return;
            var root=new GameObject("Chunk "+id); root.transform.SetParent(transform); root.transform.position=new Vector3(id.x*ChunkSize,0,id.y*ChunkSize); chunks.Add(id,root);
            var ground=WorldFactory.Box("Ground",root.transform,new Vector3(0,-.3f,0),new Vector3(ChunkSize,.5f,ChunkSize),new Color(.25f,.27f,.27f)); ground.layer=8;
            int district=DistrictKind(id);
            WorldFactory.Box("Fallback avenue",root.transform,new Vector3(0,-.015f,0),new Vector3(12,.04f,ChunkSize),new Color(.12f,.14f,.16f),false);
            WorldFactory.Box("Fallback cross street",root.transform,new Vector3(0,-.01f,0),new Vector3(ChunkSize,.04f,12),new Color(.12f,.14f,.16f),false);
            Roads.Add(new RoadSegment{a=root.transform.position+Vector3.back*Radius,b=root.transform.position+Vector3.forward*Radius,chunk=id,synthetic=true});
            Roads.Add(new RoadSegment{a=root.transform.position+Vector3.left*Radius,b=root.transform.position+Vector3.right*Radius,chunk=id,synthetic=true});
            float branch=district==1?75:district==2?105:45;
            WorldFactory.Box("Fallback side street",root.transform,new Vector3(branch,-.012f,0),new Vector3(6,.035f,310),new Color(.14f,.16f,.17f),false);
            Roads.Add(new RoadSegment{a=root.transform.position+new Vector3(branch,0,-155),b=root.transform.position+new Vector3(branch,0,155),chunk=id,synthetic=true});
            if(district==0) {
                WorldFactory.Box("Transit stop roof",root.transform,new Vector3(-18,2.5f,-20),new Vector3(7,.2f,2),new Color(.19f,.43f,.52f),false);
                WorldFactory.Box("Transit stop bench",root.transform,new Vector3(-18,.5f,-20),new Vector3(5,1,.7f),new Color(.26f,.3f,.32f),false);
                WorldFactory.Label(root.transform,"버스 정류장 · 임시 대피",new Vector3(-18,3.2f,-20),Color.cyan,.12f);
            } else if(district==1) {
                WorldFactory.Box("Courtyard",root.transform,new Vector3(0,.01f,-105),new Vector3(55,.04f,38),new Color(.3f,.38f,.32f),false);
                for(int i=-1;i<=1;i++)WorldFactory.Box("Planter",root.transform,new Vector3(i*12,.4f,-105),new Vector3(3,.8f,4),new Color(.25f,.42f,.28f),false);
                WorldFactory.Label(root.transform,"주택가 공동 마당",new Vector3(0,1.8f,-105),Color.white,.15f);
            } else {
                for(int i=-1;i<=1;i++) {WorldFactory.Box("Market stall",root.transform,new Vector3(i*12,1,-60),new Vector3(7,2,3),new Color(.38f,.35f,.29f),false);WorldFactory.Box("Market awning",root.transform,new Vector3(i*12,2.2f,-60),new Vector3(8,.2f,4),new Color(.58f,.22f,.18f),false);}
                WorldFactory.Label(root.transform,"동네 상가 · 임시 시장",new Vector3(0,3.2f,-60),Color.yellow,.15f);
            }
            for(int i=-8;i<=8;i++)WorldFactory.Box("Road marking",root.transform,new Vector3(0,.02f,i*24),new Vector3(.16f,.02f,9),new Color(.8f,.7f,.3f),false);
            for(int side=-1;side<=1;side+=2) {
                WorldFactory.Box("Sidewalk",root.transform,new Vector3(side*9,0,50),new Vector3(5,.1f,120),new Color(.4f,.42f,.4f));
                for(int i=0;i<4;i++) {
                    float z=8+i*26;
                    WorldFactory.Box("Street lamp pole",root.transform,new Vector3(side*10,2.5f,z),new Vector3(.15f,5,.15f),new Color(.15f,.18f,.2f),false);
                    WorldFactory.Box("Street lamp",root.transform,new Vector3(side*9.3f,5,z),new Vector3(1.7f,.18f,.5f),new Color(.9f,.8f,.4f),false);
                }
                var car=new GameObject("Abandoned vehicle"); car.transform.SetParent(root.transform,false); car.transform.localPosition=new Vector3(side*4,0,42);
                WorldFactory.Box("Body",car.transform,new Vector3(0,.65f,0),new Vector3(1.8f,.7f,4),new Color(.25f,.32f,.3f));
                WorldFactory.Box("Cab",car.transform,new Vector3(0,1.25f,-.2f),new Vector3(1.6f,.6f,1.8f),new Color(.12f,.2f,.23f));
                foreach(var c in car.GetComponentsInChildren<Collider>())c.gameObject.layer=8;
            }
            for(int i=0;i<6;i++) {
                float spread=district==0?23:district==1?75:105;
                float start=district==0?22:district==1?-110:-90;
                float step=district==0?30:district==1?125:130;
                var location=new Vector3(i%2==0?-spread:spread,0,start+(i/2)*step);
                SpawnBuilding(root.transform,location,(Facility)i,$"{id.x}:{id.y}/fallback/{i}");
            }
            var tree=Resources.Load<GameObject>("Props/Tree");if(tree)for(int i=0;i<8;i++){var plant=Instantiate(tree,root.transform);plant.transform.localPosition=new Vector3(i%2==0?-38:38,0,10+i/2*26);}
            if(id==Vector2Int.zero && (GameBootstrap.Instance.Journey?.Plan==null || GameBootstrap.Instance.Journey.Plan.fromName==GameBootstrap.Instance.Journey.Plan.toName)) { ZombieAI.Spawn(root.transform.position+new Vector3(-3,0,34),root.transform,"origin/street/0"); ZombieAI.Spawn(root.transform.position+new Vector3(4,0,68),root.transform,"origin/street/1"); }
            navDirty=true;
            string snapshot=useBundledGangnamMap && id==Vector2Int.zero?SnapshotFor(latitude,longitude):null;
            var journey=GameBootstrap.Instance.Journey;
            if(useBundledGangnamMap && journey?.Ready==true && id==ChunkAt(ToWorld(journey.Plan.toLat,journey.Plan.toLon)))snapshot=SnapshotFor(journey.Plan.toLat,journey.Plan.toLon);
            if(snapshot!=null) {
                var sample=Resources.Load<TextAsset>("MapSnapshots/"+snapshot);
                if(sample && TryParse(sample.text,out var data))ApplyMap(root,id,data);
                else Status=snapshot+" 지도 표본 누락 · 폴백 도시";
            } else {if(online)requests.Enqueue(id); Status=online?DistrictName(id)+" · 지도 요청 대기":"오프라인 · "+DistrictName(id);}
        }
        public static string SnapshotFor(double lat,double lon)
        {
            if(Near(lat,lon,37.65637,127.06345))return "Nowon";
            if(Near(lat,lon,37.51333,127.10028))return "Jamsil";
            if(Near(lat,lon,37.4979,127.0276))return "Gangnam";
            return null;
        }
        static bool Near(double lat,double lon,double centerLat,double centerLon)
        {
            double north=(lat-centerLat)*111320,east=(lon-centerLon)*111320*Math.Cos(centerLat*Math.PI/180);
            return north*north+east*east<450*450;
        }
        void SpawnBuilding(Transform parent,Vector3 local,Facility kind,string key)
        {
            var go=new GameObject(kind+" · "+key); go.transform.SetParent(parent,false); go.transform.localPosition=local;
            go.AddComponent<EnterableBuilding>().Build(kind,key);
            foreach(var collider in go.GetComponentsInChildren<Collider>())if(!collider.isTrigger && !collider.GetComponentInParent<ZombieAI>())collider.gameObject.layer=8;
        }
        public void BuildNavigation(Vector3 center)
        {
            var bounds=new Bounds(new Vector3(center.x,3,center.z),new Vector3(180,20,180));
            var sources=new List<NavMeshBuildSource>(); NavMeshBuilder.CollectSources(bounds,1<<8,NavMeshCollectGeometry.PhysicsColliders,0,new List<NavMeshBuildMarkup>(),sources);
            var settings=NavMesh.GetSettingsByID(0); settings.overrideVoxelSize=true; settings.voxelSize=.25f; settings.agentRadius=.4f; settings.agentHeight=1.9f;
            var data=NavMeshBuilder.BuildNavMeshData(settings,sources,bounds,Vector3.zero,Quaternion.identity);
            if(data) { if(navInstance.valid)navInstance.Remove(); if(navData)Destroy(navData); navData=data; navInstance=NavMesh.AddNavMeshData(data); navCenter=center; navDirty=false; }
        }
        public void MarkNavigationDirty() { navDirty=true; }
        string CachePath(Vector2Int id) => Path.Combine(Application.persistentDataPath,"osm",$"v2_{latitude:F4}_{longitude:F4}_{id.x}_{id.y}.json");
        IEnumerator DownloadQueue()
        {
            while(true) {
                if(requests.Count==0) { yield return new WaitForSeconds(1); continue; }
                var id=requests.Dequeue(); if(!chunks.TryGetValue(id,out var root) || !root)continue;
                string json=null; string path=CachePath(id);
                try { if(File.Exists(path) && (DateTime.UtcNow-File.GetLastWriteTimeUtc(path)).TotalDays<7)json=File.ReadAllText(path); } catch(Exception e) { Debug.LogWarning("OSM cache read: "+e.Message); }
                if(json==null) {
                    string query=ChunkQuery(id);
                    using(var request=UnityWebRequest.Post(endpoint,new Dictionary<string,string>{{"data",query}})) {
                        request.timeout=15; yield return request.SendWebRequest();
                        if(request.result==UnityWebRequest.Result.Success && request.downloadedBytes<4*1024*1024)json=request.downloadHandler.text;
                        else Status="OSM 지연/실패 · 폴백 도시로 계속 플레이";
                    }
                    if(json!=null && TryParse(json,out _)) { try { Directory.CreateDirectory(Path.GetDirectoryName(path)); File.WriteAllText(path,json); var files=new DirectoryInfo(Path.GetDirectoryName(path)).GetFiles("*.json"); Array.Sort(files,(a,b)=>b.LastWriteTimeUtc.CompareTo(a.LastWriteTimeUtc)); for(int i=128;i<files.Length;i++)files[i].Delete(); }catch(Exception e){Debug.LogWarning("OSM cache write: "+e.Message);} }
                }
                if(root && json!=null && TryParse(json,out var response))ApplyMap(root,id,response);
                yield return new WaitForSeconds(3);
            }
        }
        public static bool TryParse(string json,out OsmResponse response)
        {
            response=null; if(string.IsNullOrWhiteSpace(json) || json.Length>4*1024*1024)return false;
            try {
                response=JsonUtility.FromJson<OsmResponse>(json.Replace("\"building:levels\"","\"buildingLevels\""));
                if(response?.elements==null || response.elements.Length>10000)return false;
                foreach(var e in response.elements)if(e!=null && e.geometry!=null && e.geometry.Length>0)
                {
                    double south=90,north=-90,west=180,east=-180;foreach(var point in e.geometry)if(point!=null && Valid(point.lat,point.lon)){south=Math.Min(south,point.lat);north=Math.Max(north,point.lat);west=Math.Min(west,point.lon);east=Math.Max(east,point.lon);}
                    if(north>=south && (e.center==null || e.center.lat<south || e.center.lat>north || e.center.lon<west || e.center.lon>east))e.center=new OsmPoint{lat=(north+south)/2,lon=(east+west)/2};
                }
                return true;
            }catch(ArgumentException){return false;}
        }
        public string ChunkQuery(Vector2Int id)
        {
            double north=latitude+(id.y*ChunkSize+Radius)/111320, south=latitude+(id.y*ChunkSize-Radius)/111320;
            double metresPerLongitude=111320*Math.Cos(latitude*Math.PI/180);
            double east=longitude+(id.x*ChunkSize+Radius)/metresPerLongitude, west=longitude+(id.x*ChunkSize-Radius)/metresPerLongitude;
            string box=string.Format(CultureInfo.InvariantCulture,"({0:F7},{1:F7},{2:F7},{3:F7})",south,west,north,east);
            return "[out:json][timeout:12];(way[highway]"+box+";nwr[amenity~\"police|fire_station|school\"]"+box+";nwr[shop=convenience]"+box+";way[building]"+box+";way[leisure=park]"+box+";way[natural=water]"+box+";);out body geom 2000;";
        }
        static bool Valid(double lat,double lon) => !double.IsNaN(lat) && !double.IsInfinity(lat) && !double.IsNaN(lon) && !double.IsInfinity(lon) && lat>=-90 && lat<=90 && lon>=-180 && lon<=180;
        void ApplyMap(GameObject root,Vector2Int id,OsmResponse response)
        {
            int facilities=0,footprints=0,segments=0,landscapes=0;
            var signedRoads=new HashSet<string>();
            var ordinary=new List<OsmElement>();
            var mappedFacilities=new List<MappedFacility>();
            foreach(var e in response.elements) {
                if(e==null || e.tags==null || e.id<=0)continue;
                if(!string.IsNullOrEmpty(e.tags.highway) && e.geometry!=null) {
                    if(e.tags.tunnel=="yes" || (int.TryParse(e.tags.layer,out int layer) && layer<0))continue;
                    for(int i=1;i<e.geometry.Length && segments<350;i++) {
                        var a=e.geometry[i-1]; var b=e.geometry[i]; if(a==null || b==null || !Valid(a.lat,a.lon) || !Valid(b.lat,b.lon))continue;
                        var p=ToWorld(a.lat,a.lon); var q=ToWorld(b.lat,b.lon); var mid=(p+q)/2; float length=Vector3.Distance(p,q);
                        if(ChunkAt(mid)!=id || length<.1f || length>300)continue;
                        float width=RoadWidth(e.tags.highway);
                        var pavement=WorldFactory.Box("OSM pavement",root.transform,mid-root.transform.position+Vector3.up*.018f,new Vector3(width+2.4f,.025f,length),new Color(.38f,.39f,.37f),false);pavement.transform.rotation=Quaternion.LookRotation(q-p);
                        var road=WorldFactory.Box("OSM road "+e.id,root.transform,mid-root.transform.position+Vector3.up*.055f,new Vector3(width,.05f,length),new Color(.1f,.12f,.14f),false);
                        road.transform.rotation=Quaternion.LookRotation(q-p); segments++;
                        Roads.Add(new RoadSegment{a=p,b=q,chunk=id});
                        if(signedRoads.Count<6 && length>10 && Vector3.Distance(mid,GameBootstrap.Instance.Player.transform.position)<120 && !string.IsNullOrWhiteSpace(e.tags.name) && e.tags.name.Length<=24 && signedRoads.Add(e.tags.name))
                        {
                            var sign=mid-root.transform.position+Vector3.right*(width*.5f+2);
                            WorldFactory.Box("Street-name post",root.transform,sign+Vector3.up*1.1f,new Vector3(.12f,2.2f,.12f),new Color(.28f,.32f,.35f),false);
                            WorldFactory.Label(root.transform,e.tags.name,sign+Vector3.up*2.4f,new Color(.68f,.94f,1),.08f);
                        }
                        if(width>=8 && length>10){var stripe=WorldFactory.Box("OSM center marking",root.transform,mid-root.transform.position+Vector3.up*.09f,new Vector3(.09f,.01f,length*.75f),new Color(.8f,.66f,.23f),false);stripe.transform.rotation=road.transform.rotation;}
                    }
                    continue;
                }
                if((e.tags.leisure=="park" || e.tags.natural=="water") && landscapes<12 && SpawnSurface(root.transform,id,e)) {landscapes++;continue;}
                if(!string.IsNullOrEmpty(e.tags.building) && e.geometry!=null && e.geometry.Length>=4 && e.center!=null && Valid(e.center.lat,e.center.lon))ordinary.Add(e);
                double lat=e.type=="node"?e.lat:e.center!=null?e.center.lat:double.NaN,lon=e.type=="node"?e.lon:e.center!=null?e.center.lon:double.NaN;
                if(!Valid(lat,lon))continue; var pos=ToWorld(lat,lon);
                if(ChunkAt(pos)!=id || mappedFacilities.Count>=20 || Vector3.Distance(pos,GameBootstrap.Instance.Player.transform.position)<25)continue;
                Facility kind;
                if(e.tags.amenity=="police")kind=Facility.Police;
                else if(e.tags.amenity=="fire_station")kind=Facility.FireStation;
                else if(e.tags.amenity=="school")kind=Facility.School;
                else if(e.tags.shop=="convenience")kind=Facility.Convenience;
                else continue;
                mappedFacilities.Add(new MappedFacility{position=pos,kind=kind,key=$"osm/{e.type}/{e.id}",name=e.tags.name});
            }
            ordinary.Sort((a,b)=>DistanceToPlayer(a).CompareTo(DistanceToPlayer(b)));
            foreach(var e in ordinary) {
                if(footprints>=90)break;
                var center=ToWorld(e.center.lat,e.center.lon);
                if(ChunkAt(center)!=id || Vector3.Distance(center,GameBootstrap.Instance.Player.transform.position)<12)continue;
                int match=-1;for(int i=0;i<mappedFacilities.Count;i++)if(!mappedFacilities[i].matched && FootprintContains(e,mappedFacilities[i].position)){match=i;break;}
                bool overlap=false;foreach(var existing in root.GetComponentsInChildren<EnterableBuilding>())if(Vector3.Distance(existing.transform.position,center)<14){overlap=true;break;}
                if(overlap && match<0)continue;
                if(SpawnFootprint(root.transform,e,footprints<6 || match>=0,match>=0?(Facility?)mappedFacilities[match].kind:null,match>=0?mappedFacilities[match].name:null))
                {
                    footprints++;
                    if(match>=0){var poi=mappedFacilities[match];poi.matched=true;mappedFacilities[match]=poi;facilities++;foreach(var existing in root.GetComponentsInChildren<EnterableBuilding>())if(existing.facility==poi.kind && existing.persistentId.Contains("/fallback/") && Vector3.Distance(existing.transform.position,center)<14)Destroy(existing.gameObject);}
                }
            }
            foreach(var poi in mappedFacilities)if(!poi.matched)
            {
                bool overlap=false;foreach(var existing in root.GetComponentsInChildren<EnterableBuilding>())if(Vector3.Distance(existing.transform.position,poi.position)<22){overlap=true;break;}
                if(!overlap){SpawnBuilding(root.transform,poi.position-root.transform.position,poi.kind,poi.key);facilities++;}
            }
            if(segments>0){foreach(Transform child in root.transform)if(child.name.StartsWith("Fallback ") || child.name=="Road marking" || child.name=="Sidewalk")Destroy(child.gameObject);Roads.RemoveAll(r=>r.chunk==id && r.synthetic);}
            if(segments+footprints+facilities+landscapes>0)mapped.Add(id);
            navDirty=true; Status=$"실제 OSM 도로 {segments} / 건물 {footprints} / 시설 {facilities} / 공원·물가 {landscapes} · 실내는 게임용";
        }
        float DistanceToPlayer(OsmElement e) => e.center==null?float.MaxValue:Vector3.Distance(ToWorld(e.center.lat,e.center.lon),GameBootstrap.Instance.Player.transform.position);
        bool FootprintContains(OsmElement building,Vector3 position)
        {
            if(building.geometry==null || building.geometry.Length<4 || building.geometry.Length>80)return false;
            var polygon=new List<Vector3>();foreach(var point in building.geometry){if(point==null || !Valid(point.lat,point.lon))return false;polygon.Add(ToWorld(point.lat,point.lon));}
            return OsmBuildingShell.Contains(polygon,position);
        }
        bool SpawnSurface(Transform parent,Vector2Int id,OsmElement e)
        {
            if(e.geometry==null || e.geometry.Length<4 || e.geometry.Length>128)return false;
            var polygon=new List<Vector3>();foreach(var point in e.geometry){if(point==null || !Valid(point.lat,point.lon))return false;polygon.Add(ToWorld(point.lat,point.lon));}
            if(Vector3.Distance(polygon[0],polygon[polygon.Count-1])>1)return false;polygon.RemoveAt(polygon.Count-1);
            var center=Vector3.zero;foreach(var point in polygon)center+=point;center/=polygon.Count;
            if(ChunkAt(center)!=id)return false;
            float span=0;foreach(var point in polygon)span=Mathf.Max(span,Vector3.Distance(point,center));if(span<2 || span>300)return false;
            var go=new GameObject(e.tags.natural=="water"?"OSM water":"OSM park");go.transform.SetParent(parent,false);go.transform.position=center;
            for(int i=0;i<polygon.Count;i++)polygon[i]-=center;
            var surface=go.AddComponent<MapSurface>();if(!surface.Build(polygon,e.tags.natural=="water")){Destroy(go);return false;}Surfaces.Add(surface);return true;
        }
        static float RoadWidth(string highway)
        {
            switch(highway){case "primary":case "secondary":return 11;case "tertiary":return 8;case "residential":case "service":return 5.5f;case "footway":case "path":return 2;default:return 4;}
        }
        public static float BuildingHeight(OsmTags tags,long id,out int floors,out bool reported)
        {
            floors=0;reported=false;
            var raw=tags?.buildingLevels??tags?.levels;
            if(int.TryParse(raw,NumberStyles.Integer,CultureInfo.InvariantCulture,out int parsed) && parsed>=1 && parsed<=200){floors=parsed;reported=true;}
            if(!string.IsNullOrWhiteSpace(tags?.height))
            {
                var numeric=tags.height.Trim().Replace(" m","").Replace("m","");
                if(float.TryParse(numeric,NumberStyles.Float,CultureInfo.InvariantCulture,out float metres) && metres>=2.5f && metres<=700)
                {reported=true;if(floors==0)floors=Mathf.Max(1,Mathf.RoundToInt(metres/3.1f));return metres;}
            }
            if(floors>0)return Mathf.Clamp(floors*3.1f,3,650);
            floors=2+(int)(id%4);return floors*3.1f;
        }
        bool SpawnFootprint(Transform parent,OsmElement e,bool playable,Facility? overrideFacility=null,string overrideName=null)
        {
            var points=new List<Vector3>();foreach(var p in e.geometry){if(p==null||!Valid(p.lat,p.lon))return false;var world=ToWorld(p.lat,p.lon);if(points.Count==0 || Vector3.Distance(points[points.Count-1],world)>.15f)points.Add(world);}
            if(points.Count>3 && Vector3.Distance(points[0],points[points.Count-1])<.2f)points.RemoveAt(points.Count-1);
            if(points.Count<3 || points.Count>80)return false;
            if(OsmBuildingShell.Contains(points,GameBootstrap.Instance.Player.transform.position))return false;
            var center=Vector3.zero;foreach(var p in points)center+=p;center/=points.Count;
            float span=0;foreach(var p in points)span=Mathf.Max(span,Vector3.Distance(p,center));if(span<2 || span>100)return false;
            int floors;bool reported;float height=BuildingHeight(e.tags,e.id,out floors,out reported);
            var shell=new GameObject("OSM building "+e.id);shell.transform.SetParent(parent,false);shell.transform.position=center;
            var color=new Color(.46f,.43f,.39f);if(e.tags.building=="apartments")color=new Color(.57f,.53f,.48f);
            Facility kind=overrideFacility??(e.tags.amenity=="police"?Facility.Police:e.tags.amenity=="fire_station"?Facility.FireStation:e.tags.amenity=="school"?Facility.School:e.tags.shop=="convenience"?Facility.Convenience:e.tags.building=="office" || e.tags.building=="commercial"?Facility.Office:Facility.Housing);
            for(int i=0;i<points.Count;i++)points[i]-=center;
            var building=shell.AddComponent<OsmBuildingShell>();building.Build(points,height,color,playable,kind,"osm/building/"+e.id,string.IsNullOrWhiteSpace(overrideName)?e.tags.name:overrideName,floors,reported);Buildings.Add(building);
            return true;
        }
        void OnDestroy() { StopAllCoroutines(); if(navInstance.valid)navInstance.Remove(); if(navData)Destroy(navData); }
    }
}
```

## Assets/Game/Scripts/RideableVehicle.cs

```csharp
using UnityEngine;

namespace SeoulSurvival
{
    public sealed class RideableVehicle : MonoBehaviour
    {
        public static RideableVehicle ActiveRide {get;private set;}
        public GameObject optionalPrefab;
        public string VehicleName=>data?.name;
        public float RemainingRange {get;private set;}
        public bool Riding=>ActiveRide==this;
        static int lastToggleFrame;
        GameBootstrap game;VehicleData data;float nextNoise;

        public void Initialize(GameBootstrap context,VehicleData settings,Vector3 position,GameObject prefab,Color color)
        {
            game=context;data=settings;optionalPrefab=prefab;RemainingRange=settings.rangeMeters;transform.position=position;
            var root=new GameObject("Vehicle visual").transform;root.SetParent(transform,false);
            if(optionalPrefab)
            {
                var model=Instantiate(optionalPrefab,root);foreach(var c in model.GetComponentsInChildren<Collider>())c.enabled=false;
            }
            else
            {
                WorldFactory.Box("Chassis",root,new Vector3(0,.65f,0),new Vector3(.55f,.18f,1.55f),color,false);
                WorldFactory.Box("Seat",root,new Vector3(0,.9f,-.35f),new Vector3(.5f,.16f,.45f),new Color(.06f,.08f,.09f),false);
                WorldFactory.Box("Handlebar",root,new Vector3(0,1.12f,.58f),new Vector3(.9f,.08f,.12f),Color.gray,false);
                foreach(float z in new[]{-.58f,.58f})WorldFactory.Box("Wheel",root,new Vector3(0,.32f,z),new Vector3(.17f,.64f,.65f),new Color(.05f,.06f,.07f),false);
            }
            WorldFactory.Label(transform,settings.name,new Vector3(0,1.9f,0),new Color(.48f,1,.86f),.1f);
        }
        public bool Toggle()
        {
            if(!game.Running || Time.frameCount==lastToggleFrame)return false;
            if(Riding){Dismount();lastToggleFrame=Time.frameCount;return true;}
            if(ActiveRide || Vector3.Distance(transform.position,game.Player.transform.position)>3 || (data.rangeMeters>0 && RemainingRange<=0))return false;
            ActiveRide=this;game.Player.combat.Cancel();transform.SetPositionAndRotation(game.Player.transform.position,game.Player.transform.rotation);lastToggleFrame=Time.frameCount;return true;
        }
        void Dismount(){transform.position=game.Player.transform.position+game.Player.transform.right*1.5f;ActiveRide=null;}
        public bool Charge()
        {
            if(Riding || data.rangeMeters<=0 || Vector3.Distance(transform.position,game.Player.transform.position)>3)return false;
            var fuel=game.Survival.Count(ResourceKind.Battery)>0?ResourceKind.Battery:ResourceKind.Electronics;
            if(game.Survival.Count(fuel)<1)return false;
            game.Survival.Inventory[fuel]--;RemainingRange=data.rangeMeters;return true;
        }
        public void Restore(Vector3 position,float range){transform.position=position;RemainingRange=Mathf.Clamp(range,0,data.rangeMeters);}
        void Update()
        {
            if(!game || !game.Running)return;
            if(Input.GetKeyDown(KeyCode.G))Toggle();
            if(Input.GetKeyDown(KeyCode.J))Charge();
            if(!Riding)return;
            var player=game.Player;var input=Application.isMobilePlatform?player.mobileMove:Vector2.ClampMagnitude(new Vector2(Input.GetAxisRaw("Horizontal"),Input.GetAxisRaw("Vertical"))+player.mobileMove,1);
            var right=Camera.main.transform.right;var forward=Camera.main.transform.forward;right.y=forward.y=0;
            var direction=(right.normalized*input.x+forward.normalized*input.y).normalized;
            if(direction.sqrMagnitude<.01f)return;
            if(data.staminaPerSecond>0 && !game.Campaign.SpendStamina(data.staminaPerSecond*Time.deltaTime)){Dismount();return;}
            if(data.rangeMeters>0 && RemainingRange<=0){Dismount();return;}
            var before=player.transform.position;
            player.body.Move(direction*data.speed*Time.deltaTime+Vector3.down*.3f*Time.deltaTime);
            var distance=Vector3.Distance(before,player.transform.position);if(data.rangeMeters>0)RemainingRange=Mathf.Max(0,RemainingRange-distance);
            player.transform.rotation=Quaternion.LookRotation(direction);transform.SetPositionAndRotation(player.transform.position,player.transform.rotation);
            if(data.noiseRadius>0 && Time.time>=nextNoise){ZombieAI.HearNoise(transform.position,data.noiseRadius);if(game.Pressure)game.Pressure.RecordNoise(transform.position,data.noiseRadius);nextNoise=Time.time+3;}
        }
        void OnGUI()
        {
            if(!game || !game.Running || (!Riding && Vector3.Distance(transform.position,game.Player.transform.position)>3))return;
            if(WorldFactory.KoreanFont)GUI.skin.font=WorldFactory.KoreanFont;
            float scale=Mathf.Clamp(Screen.height/900f,.65f,1.6f);GUI.matrix=Matrix4x4.Scale(Vector3.one*scale);float w=Screen.width/scale;
            var old=GUI.color;GUI.color=new Color(.025f,.055f,.07f,.94f);GUI.DrawTexture(new Rect(w-295,390,275,100),Texture2D.whiteTexture);GUI.color=old;
            GUI.Label(new Rect(w-282,394,255,26),Riding?data.name+" · 이동 중":data.name+" · 탑승 가능");
            GUI.Label(new Rect(w-282,418,255,24),data.rangeMeters>0?$"남은 주행 거리 {RemainingRange:0}m · 소음 {data.noiseRadius:0}m":"기력을 소모해 조용히 이동합니다");
            if(GUI.Button(new Rect(w-282,445,115,32),Riding?"내리기 G":"탑승 G"))Toggle();
            if(!Riding && data.rangeMeters>0 && GUI.Button(new Rect(w-160,445,125,32),"배터리 충전 J"))Charge();
            GUI.matrix=Matrix4x4.identity;
        }
        void OnDestroy(){if(Riding)ActiveRide=null;}
    }
}
```

## Assets/Game/Scripts/SurvivalAndEscapeManager.cs

```csharp
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
```

## Assets/Game/Scripts/SurvivalCampaign.cs

```csharp
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
```

## Assets/Game/Scripts/TacticalMapOverlay.cs

```csharp
using UnityEngine;
namespace SeoulSurvival
{
    public sealed class TacticalMapOverlay : MonoBehaviour
    {
        public static bool Expanded {get;private set;}
        EnterableBuilding[] facilities;OsmBuildingShell nearby;float nextRefresh;
        void Update(){var game=GameBootstrap.Instance;if(game.Journey && !game.Journey.Ready)return;if(Input.GetKeyDown(KeyCode.M))Expanded=!Expanded;if(Time.unscaledTime>=nextRefresh){nextRefresh=Time.unscaledTime+2;facilities=FindObjectsByType<EnterableBuilding>(FindObjectsSortMode.None);nearby=null;float best=25;foreach(var building in game.Map.Buildings)if(building){float distance=building.DistanceToFootprint(game.Player.transform.position);if(distance<best){best=distance;nearby=building;}}}}
        void OnDestroy(){Expanded=false;}
        void OnGUI()
        {
            var game=GameBootstrap.Instance;if(!game || !game.Player || (game.Journey && !game.Journey.Ready))return;
            float scale=Mathf.Clamp(Screen.height/900f,.65f,1.6f);GUI.matrix=Matrix4x4.Scale(Vector3.one*scale);float width=Screen.width/scale,height=Screen.height/scale;
            float size=Expanded?Mathf.Min(570,height-180):190;var rect=Expanded?new Rect(width/2-size/2,110,size,size):new Rect(width-size-20,184,size,size);
            var oldColor=GUI.color;GUI.color=new Color(.025f,.055f,.07f,.93f);GUI.DrawTexture(rect,Texture2D.whiteTexture);GUI.color=Color.white;
            var style=new GUIStyle(GUI.skin.label){font=WorldFactory.KoreanFont,fontSize=Expanded?16:12};float localHeat=game.Pressure.At(RealWorldMapManager.ChunkAt(game.Player.transform.position));GUI.Label(new Rect(rect.x+10,rect.y+8,size-20,24),Expanded?game.Map.AreaLabel+" · "+(game.Map.CurrentChunkMapped?"OSM 지도":"절차 지도")+$" · 감염 압력 {localHeat*100:0}%":"N ↑  지역도 · M 확대",style);
            GUI.BeginGroup(new Rect(rect.x+8,rect.y+36,size-16,size-44));float mapSize=size-16;float range=Expanded?350:105;var center=game.Player.transform.position;
            foreach(var entry in game.Pressure.Heat){var chunkCenter=new Vector3(entry.Key.x*RealWorldMapManager.ChunkSize,0,entry.Key.y*RealWorldMapManager.ChunkSize);if(Mathf.Abs(chunkCenter.x-center.x)>range+RealWorldMapManager.Radius || Mathf.Abs(chunkCenter.z-center.z)>range+RealWorldMapManager.Radius)continue;var a=Point(chunkCenter+new Vector3(-RealWorldMapManager.Radius,0,RealWorldMapManager.Radius),center,range,mapSize);var b=Point(chunkCenter+new Vector3(RealWorldMapManager.Radius,0,-RealWorldMapManager.Radius),center,range,mapSize);GUI.color=new Color(1,.18f,.1f,entry.Value*.24f);GUI.DrawTexture(new Rect(a.x,a.y,b.x-a.x,b.y-a.y),Texture2D.whiteTexture);GUI.color=Color.white;}
            foreach(var surface in game.Map.Surfaces){if(!surface || (surface.transform.position-center).sqrMagnitude>range*range*2)continue;var outline=surface.Outline;for(int i=0;i<outline.Count;i++)Line(Point(surface.transform.TransformPoint(outline[i]),center,range,mapSize),Point(surface.transform.TransformPoint(outline[(i+1)%outline.Count]),center,range,mapSize),surface.Water?new Color(.18f,.6f,.85f):new Color(.3f,.75f,.4f),Expanded?3:2);}
            int drawn=0;foreach(var building in game.Map.Buildings){if(!building || building.Outline==null || (building.transform.position-center).sqrMagnitude>range*range || drawn++>=70)continue;var outline=building.Outline;for(int i=0;i<outline.Count;i++)Line(Point(building.transform.TransformPoint(outline[i]),center,range,mapSize),Point(building.transform.TransformPoint(outline[(i+1)%outline.Count]),center,range,mapSize),building.Playable?new Color(.72f,.58f,.3f):new Color(.48f,.5f,.51f),Expanded?2:1);if(building.Playable){var door=Point(building.Entrance,center,range,mapSize);GUI.color=new Color(1,.78f,.24f);GUI.DrawTexture(new Rect(door.x-3,door.y-3,6,6),Texture2D.whiteTexture);GUI.color=Color.white;}}
            foreach(var road in game.Map.Roads){if((road.a-center).sqrMagnitude>range*range*5 && (road.b-center).sqrMagnitude>range*range*5)continue;Line(Point(road.a,center,range,mapSize),Point(road.b,center,range,mapSize),new Color(.45f,.53f,.55f),Expanded?3:2);}
            if(facilities!=null)foreach(var f in facilities)if(f && (f.transform.position-center).sqrMagnitude<range*range){var p=Point(f.transform.position,center,range,mapSize);bool objective=game.Campaign && game.Campaign.ReliefActive && !game.Campaign.ReliefRecovered && f.facility==game.Campaign.CurrentRelief.facility && !f.GetComponentInChildren<LootBox>().Opened;GUI.color=objective?Color.yellow:EnterableBuilding.Colors[(int)f.facility];float dot=objective?14:8;GUI.DrawTexture(new Rect(p.x-dot/2,p.y-dot/2,dot,dot),Texture2D.whiteTexture);GUI.color=Color.white;if(Expanded)GUI.Label(new Rect(p.x+8,p.y-8,95,24),objective?"의뢰 · 회수":new[]{"경찰","소방","편의점","학교","업무","주택"}[(int)f.facility],style);}
            Marker(SurvivalCampaign.Home,"거점",new Color(.4f,1,.85f));Marker(game.Survival.Tower.position,"송신탑",new Color(.9f,.5f,1));
            if(game.Journey && game.Journey.Ready && !game.Journey.Reached && game.Journey.Plan.fromName!=game.Journey.Plan.toName)
            {
                var goal=ObjectivePoint(game.Journey.Target,center,range,mapSize);var middle=new Vector2(mapSize/2,mapSize/2);
                Line(middle,goal,new Color(.95f,.75f,.2f,.65f),Expanded?2:1);
                GUI.color=new Color(1,.78f,.24f);GUI.DrawTexture(new Rect(goal.x-5,goal.y-5,10,10),Texture2D.whiteTexture);GUI.color=Color.white;
                if(Expanded)GUI.Label(new Rect(Mathf.Clamp(goal.x+8,0,mapSize-170),Mathf.Clamp(goal.y-27,0,mapSize-24),170,24),$"목적지 · 직선 {game.Journey.RemainingMetres/1000:0.0}km",style);
            }
            var player=Point(center,center,range,mapSize);GUI.color=new Color(.4f,1,.85f);GUI.DrawTexture(new Rect(player.x-3,player.y-3,6,6),Texture2D.whiteTexture);GUI.color=Color.white;
            GUI.EndGroup();if(nearby){var name=nearby.BuildingName;GUI.Box(new Rect(rect.x,rect.y+size+4,size,42),$"{name} · {nearby.Floors}층 {(nearby.HeightReported?"OSM 기록":"높이 추정")}{(nearby.Playable?" · 1층 진입 가능":"")}");}GUI.color=oldColor;GUI.matrix=Matrix4x4.identity;
            void Marker(Vector3 location,string text,Color color){var delta=location-center;if(delta.sqrMagnitude>range*range)return;var p=Point(location,center,range,mapSize);GUI.color=color;GUI.Label(new Rect(p.x-15,p.y-12,70,24),text,style);GUI.color=Color.white;}
        }
        static Vector2 Point(Vector3 point,Vector3 center,float range,float size)=>new Vector2(size/2+(point.x-center.x)*size/(range*2),size/2-(point.z-center.z)*size/(range*2));
        public static Vector2 ObjectivePoint(Vector3 target,Vector3 center,float range,float size)
        {
            var delta=target-center;float extent=Mathf.Max(Mathf.Abs(delta.x),Mathf.Abs(delta.z));
            float factor=extent>range?range/extent:1;var point=Point(center+delta*factor,center,range,size);
            return new Vector2(Mathf.Clamp(point.x,8,size-8),Mathf.Clamp(point.y,8,size-8));
        }
        static void Line(Vector2 a,Vector2 b,Color color,float width){var matrix=GUI.matrix;var old=GUI.color;GUI.color=color;GUIUtility.RotateAroundPivot(Mathf.Atan2(b.y-a.y,b.x-a.x)*Mathf.Rad2Deg,a);GUI.DrawTexture(new Rect(a.x,a.y-width/2,(b-a).magnitude,width),Texture2D.whiteTexture);GUI.matrix=matrix;GUI.color=old;}
    }
}
```

## Assets/Game/Scripts/TacticalPlayerController.cs

```csharp
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
```

## Assets/Game/Scripts/WorldFactory.cs

```csharp
using System.Collections.Generic;
using UnityEngine;

namespace SeoulSurvival
{
    public static class WorldFactory
    {
        static readonly Dictionary<Color, Material> materials = new Dictionary<Color, Material>();
        public static Font KoreanFont => Resources.Load<Font>("Fonts/NanumGothic");
        public static Material Material(Color color)
        {
            if (!materials.TryGetValue(color, out var mat) || !mat) {
                var template=Resources.Load<Material>("ProceduralSurface");
                mat = template ? new Material(template) : new Material(Shader.Find("Standard")); mat.color = color;
                mat.SetFloat("_Glossiness", .1f); materials[color] = mat;
            }
            return mat;
        }
        public static GameObject Box(string name, Transform parent, Vector3 position, Vector3 size, Color color, bool collider = true)
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Cube); go.name = name; go.transform.SetParent(parent,false);
            go.transform.localPosition = position; go.transform.localScale = size; go.GetComponent<Renderer>().sharedMaterial = Material(color);
            if(!collider) { go.GetComponent<Collider>().enabled = false; Object.Destroy(go.GetComponent<Collider>()); }
            return go;
        }
        public static Transform Visual(Transform parent, GameObject prefab, Color color)
        {
            if(prefab) { var model = Object.Instantiate(prefab,parent); model.transform.localPosition=Vector3.zero; foreach(var c in model.GetComponentsInChildren<Collider>())c.enabled=false; foreach(var rb in model.GetComponentsInChildren<Rigidbody>()){rb.isKinematic=true;rb.detectCollisions=false;} return model.transform; }
            var root = new GameObject("Procedural visual").transform; root.SetParent(parent,false);
            Box("Torso",root,new Vector3(0,1.05f,0),new Vector3(.65f,.9f,.4f),color,false);
            Box("Head",root,new Vector3(0,1.75f,0),Vector3.one*.42f,new Color(.7f,.65f,.5f),false);
            Box("Left leg",root,new Vector3(-.2f,.35f,0),new Vector3(.22f,.7f,.25f),color*.65f,false);
            Box("Right leg",root,new Vector3(.2f,.35f,0),new Vector3(.22f,.7f,.25f),color*.65f,false);
            Box("Arms / weapon",root,new Vector3(.4f,1.15f,.35f),new Vector3(.18f,.2f,.85f),Color.black,false);
            return root;
        }
        public static void Label(Transform parent, string text, Vector3 position, Color color, float size = .3f)
        {
            var go=new GameObject("Sign"); go.transform.SetParent(parent,false); go.transform.localPosition=position;
            var mesh=go.AddComponent<TextMesh>(); mesh.text=text; mesh.fontSize=42; mesh.characterSize=size; mesh.anchor=TextAnchor.MiddleCenter; mesh.color=color;
            if(KoreanFont){mesh.font=KoreanFont;go.GetComponent<MeshRenderer>().sharedMaterial=KoreanFont.material;}
        }
        public static void ReleaseMaterials() { foreach(var m in materials.Values) if(m) Object.Destroy(m); materials.Clear(); }
    }
}
```

## Assets/Game/Scripts/ZombieAI.cs

```csharp
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
```

