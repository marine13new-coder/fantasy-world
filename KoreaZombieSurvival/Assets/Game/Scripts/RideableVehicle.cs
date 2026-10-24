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
            if(data.noiseRadius>0 && Time.time>=nextNoise){ZombieAI.HearNoise(transform.position,data.noiseRadius);nextNoise=Time.time+3;}
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
