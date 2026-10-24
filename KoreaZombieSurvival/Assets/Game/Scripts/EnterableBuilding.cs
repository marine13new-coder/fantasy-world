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
