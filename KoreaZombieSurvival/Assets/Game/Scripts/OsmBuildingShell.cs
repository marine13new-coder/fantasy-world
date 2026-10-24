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
