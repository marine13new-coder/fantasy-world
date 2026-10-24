using UnityEngine;
using Unity.Cinemachine;
namespace SeoulSurvival
{
    public sealed class QuarterViewCamera : MonoBehaviour
    {
        public Transform target; public Vector3 offset=new Vector3(14,23,-18); public float follow=10;
        public float explorationZoom=11, focusZoom=9;
        CinemachineImpulseSource impulse;Camera lens;Vector3 anchor;
        void Awake() {
            impulse=gameObject.AddComponent<CinemachineImpulseSource>();
            impulse.ImpulseDefinition.ImpulseType=CinemachineImpulseDefinition.ImpulseTypes.Uniform;
            impulse.ImpulseDefinition.ImpulseShape=CinemachineImpulseDefinition.ImpulseShapes.Recoil;
            impulse.ImpulseDefinition.ImpulseDuration=.18f;
        }
        void Start() { lens=GetComponent<Camera>(); lens.orthographic=true; lens.orthographicSize=explorationZoom; lens.farClipPlane=220; lens.backgroundColor=new Color(.05f,.08f,.1f); if(target)anchor=target.position+offset; }
        public void Shake(float strength) { if(impulse)impulse.GenerateImpulseWithVelocity(new Vector3(strength*.5f,strength,0)); }
        void LateUpdate() {
            if(!target || !lens)return;
            float focus=GameBootstrap.Instance.Player.combat.Focus;
            var destination=target.position+offset+target.forward*focus*2;
            anchor=Vector3.Lerp(anchor,destination,1-Mathf.Exp(-follow*Time.unscaledDeltaTime));
            lens.orthographicSize=Mathf.Lerp(lens.orthographicSize,Mathf.Lerp(explorationZoom,focusZoom,focus),1-Mathf.Exp(-5*Time.unscaledDeltaTime));
            CinemachineImpulseManager.Instance.GetImpulseAt(target.position,false,1,out var displacement,out var rotation);
            transform.SetPositionAndRotation(anchor+displacement,Quaternion.LookRotation(-offset)*rotation);
        }
    }
}
