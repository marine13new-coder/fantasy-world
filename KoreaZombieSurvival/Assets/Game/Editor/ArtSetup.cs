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
