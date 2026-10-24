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
