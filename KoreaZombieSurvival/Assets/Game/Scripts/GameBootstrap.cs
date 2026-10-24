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
