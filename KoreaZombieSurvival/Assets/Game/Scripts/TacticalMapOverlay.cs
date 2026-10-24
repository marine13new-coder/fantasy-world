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
            var style=new GUIStyle(GUI.skin.label){font=WorldFactory.KoreanFont,fontSize=Expanded?16:12};GUI.Label(new Rect(rect.x+10,rect.y+8,size-20,24),Expanded?game.Map.AreaLabel+" · "+(game.Map.CurrentChunkMapped?"OSM 지도":"절차 지도"):"N ↑  지역도 · M 확대",style);
            GUI.BeginGroup(new Rect(rect.x+8,rect.y+36,size-16,size-44));float mapSize=size-16;float range=Expanded?350:105;var center=game.Player.transform.position;
            foreach(var surface in game.Map.Surfaces){if(!surface || (surface.transform.position-center).sqrMagnitude>range*range*2)continue;var outline=surface.Outline;for(int i=0;i<outline.Count;i++)Line(Point(surface.transform.TransformPoint(outline[i]),center,range,mapSize),Point(surface.transform.TransformPoint(outline[(i+1)%outline.Count]),center,range,mapSize),surface.Water?new Color(.18f,.6f,.85f):new Color(.3f,.75f,.4f),Expanded?3:2);}
            int drawn=0;foreach(var building in game.Map.Buildings){if(!building || building.Outline==null || (building.transform.position-center).sqrMagnitude>range*range || drawn++>=70)continue;var outline=building.Outline;for(int i=0;i<outline.Count;i++)Line(Point(building.transform.TransformPoint(outline[i]),center,range,mapSize),Point(building.transform.TransformPoint(outline[(i+1)%outline.Count]),center,range,mapSize),building.Playable?new Color(.72f,.58f,.3f):new Color(.48f,.5f,.51f),Expanded?2:1);}
            foreach(var road in game.Map.Roads){if((road.a-center).sqrMagnitude>range*range*5 && (road.b-center).sqrMagnitude>range*range*5)continue;Line(Point(road.a,center,range,mapSize),Point(road.b,center,range,mapSize),new Color(.45f,.53f,.55f),Expanded?3:2);}
            if(facilities!=null)foreach(var f in facilities)if(f && (f.transform.position-center).sqrMagnitude<range*range){var p=Point(f.transform.position,center,range,mapSize);bool objective=game.Campaign && game.Campaign.ReliefActive && !game.Campaign.ReliefRecovered && f.facility==game.Campaign.CurrentRelief.facility && !f.GetComponentInChildren<LootBox>().Opened;GUI.color=objective?Color.yellow:EnterableBuilding.Colors[(int)f.facility];float dot=objective?14:8;GUI.DrawTexture(new Rect(p.x-dot/2,p.y-dot/2,dot,dot),Texture2D.whiteTexture);GUI.color=Color.white;if(Expanded)GUI.Label(new Rect(p.x+8,p.y-8,95,24),objective?"의뢰 · 회수":new[]{"경찰","소방","편의점","학교","업무","주택"}[(int)f.facility],style);}
            Marker(SurvivalCampaign.Home,"거점",new Color(.4f,1,.85f));Marker(game.Survival.Tower.position,"송신탑",new Color(.9f,.5f,1));
            var player=Point(center,center,range,mapSize);GUI.color=new Color(.4f,1,.85f);GUI.DrawTexture(new Rect(player.x-3,player.y-3,6,6),Texture2D.whiteTexture);GUI.color=Color.white;
            GUI.EndGroup();if(nearby){var name=nearby.BuildingName;GUI.Box(new Rect(rect.x,rect.y+size+4,size,42),$"{name} · {nearby.Floors}층 {(nearby.HeightReported?"OSM 기록":"높이 추정")}{(nearby.Playable?" · 1층 진입 가능":"")}");}GUI.color=oldColor;GUI.matrix=Matrix4x4.identity;
            void Marker(Vector3 location,string text,Color color){var delta=location-center;if(delta.sqrMagnitude>range*range)return;var p=Point(location,center,range,mapSize);GUI.color=color;GUI.Label(new Rect(p.x-15,p.y-12,70,24),text,style);GUI.color=Color.white;}
        }
        static Vector2 Point(Vector3 point,Vector3 center,float range,float size)=>new Vector2(size/2+(point.x-center.x)*size/(range*2),size/2-(point.z-center.z)*size/(range*2));
        static void Line(Vector2 a,Vector2 b,Color color,float width){var matrix=GUI.matrix;var old=GUI.color;GUI.color=color;GUIUtility.RotateAroundPivot(Mathf.Atan2(b.y-a.y,b.x-a.x)*Mathf.Rad2Deg,a);GUI.DrawTexture(new Rect(a.x,a.y-width/2,(b-a).magnitude,width),Texture2D.whiteTexture);GUI.matrix=matrix;GUI.color=old;}
    }
}
