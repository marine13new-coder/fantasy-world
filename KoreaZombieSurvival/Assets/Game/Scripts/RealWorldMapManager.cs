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
