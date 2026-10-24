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
