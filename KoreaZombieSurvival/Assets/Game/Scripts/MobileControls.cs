using UnityEngine;
namespace SeoulSurvival
{
    public sealed class MobileControls : MonoBehaviour
    {
        public bool previewInEditor; public float stickRadius=90;
        void Update()
        {
            if(!Application.isMobilePlatform && !previewInEditor)return;
            var game=GameBootstrap.Instance; if(!game || !game.Running)return;
            Vector2 move=Vector2.zero,aim=Vector2.zero; bool fire=false,focus=false;
            foreach(var touch in Input.touches) {
                if(touch.phase==TouchPhase.Ended || touch.phase==TouchPhase.Canceled)continue;
                var p=touch.position;
                if(p.x<Screen.width*.4f && p.y<Screen.height*.45f)move=Vector2.ClampMagnitude((p-new Vector2(130,150))/stickRadius,1);
                else if(p.x>Screen.width*.6f && p.y<Screen.height*.4f) { aim=Vector2.ClampMagnitude((p-new Vector2(Screen.width-140,150))/stickRadius,1); focus=true; fire=aim.magnitude>.85f && (!game.Player.combat.GunEquipped || game.Player.combat.Focus>=.999f); }
            }
            game.Player.SetMoveInput(move); game.Player.SetAimInput(aim); game.Player.SetFocusInput(focus); game.Player.SetFireInput(fire);
        }
        void OnGUI()
        {
            if(!Application.isMobilePlatform && !previewInEditor)return; var game=GameBootstrap.Instance; if(!game || !game.Running)return;
            GUI.Box(new Rect(40,Screen.height-240,180,180),"이동"); GUI.Box(new Rect(Screen.width-230,Screen.height-240,180,180),"조준 완료 후 끝까지 밀어 발사");
            if(GUI.Button(new Rect(Screen.width-110,230,100,60),"E 획득"))game.Survival.Interact();
            if(GUI.Button(new Rect(Screen.width-110,300,100,60),"R 장전"))game.Player.combat.Reload();
            if(GUI.Button(new Rect(Screen.width-110,370,100,60),"무기 변경"))game.Player.combat.CycleWeapon();
            if(GUI.Button(new Rect(Screen.width-220,230,100,60),"C 조합"))game.Survival.ToggleCrafting();
            if(GUI.Button(new Rect(Screen.width-220,300,100,60),"H 회복"))game.Survival.UseHealing();
            if(GUI.Button(new Rect(Screen.width-220,370,100,60),"정밀 분해"))game.Survival.Interact(true);
            if(GUI.Button(new Rect(Screen.width-330,230,100,60),"식사"))game.Campaign.Eat();
            if(GUI.Button(new Rect(Screen.width-330,300,100,60),"음료"))game.Campaign.Drink();
            if(GUI.Button(new Rect(Screen.width-330,370,100,60),"거점"))game.Campaign.TogglePanel();
            if(GUI.Button(new Rect(Screen.width-440,230,100,60),"유인탄"))game.Survival.UseFlare();
        }
        void OnDisable() { var p=GameBootstrap.Instance?.Player; if(p) {p.SetMoveInput(Vector2.zero);p.SetAimInput(Vector2.zero);p.SetFireInput(false);p.SetFocusInput(false);} }
    }
}
