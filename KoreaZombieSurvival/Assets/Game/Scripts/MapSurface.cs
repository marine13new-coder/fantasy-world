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
