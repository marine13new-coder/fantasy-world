using UnityEngine;
namespace SeoulSurvival
{
    public sealed class AnimationBridge : MonoBehaviour
    {
        public Animator optionalAnimator; public RuntimeAnimatorController optionalController; public Transform visual;
        Vector3 rest; float speed, impulse;
        public void Initialize(Transform model, RuntimeAnimatorController controller)
        {
            visual=model; rest=model.localPosition; optionalAnimator=model.GetComponentInChildren<Animator>(); optionalController=controller;
            if(controller) { if(!optionalAnimator) optionalAnimator=model.gameObject.AddComponent<Animator>(); optionalAnimator.runtimeAnimatorController=controller; }
            if(optionalAnimator) optionalAnimator.applyRootMotion=false;
        }
        bool Has(string name) { if(!optionalAnimator || !optionalAnimator.runtimeAnimatorController)return false; foreach(var p in optionalAnimator.parameters) if(p.name==name)return true; return false; }
        public void Motion(float value,bool aiming) { speed=value; if(Has("Speed")) optionalAnimator.SetFloat("Speed",value); if(Has("IsAiming"))optionalAnimator.SetBool("IsAiming",aiming); }
        public void Attack() { impulse=.2f; if(Has("AttackTrigger"))optionalAnimator.SetTrigger("AttackTrigger"); }
        public void Die(bool headshot) { if(Has("HeadshotDie"))optionalAnimator.SetBool("HeadshotDie",headshot); if(Has("DieTrigger"))optionalAnimator.SetTrigger("DieTrigger"); }
        void Update() { if(!visual)return; impulse=Mathf.MoveTowards(impulse,0,Time.deltaTime); bool animated=optionalAnimator && optionalAnimator.runtimeAnimatorController;visual.localPosition=rest+Vector3.up*Mathf.Sin(Time.time*12)*Mathf.Min(speed,1)*(animated?0:.045f); visual.localRotation=Quaternion.Euler(impulse*100,0,animated?0:Mathf.Sin(Time.time*8)*Mathf.Min(speed,1)*3); }
    }
}
