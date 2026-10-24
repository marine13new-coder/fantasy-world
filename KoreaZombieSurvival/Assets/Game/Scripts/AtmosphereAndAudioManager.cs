using System.Collections.Generic;
using UnityEngine;
namespace SeoulSurvival
{
    public sealed class AtmosphereAndAudioManager : MonoBehaviour
    {
        public AudioClip normalShot,headshotCrunch,emptyClick,reload,axe,groan,loot,siren,dayBgm,nightBgm;
        public Light sunlight,flashlight; public float DayFraction {get;private set;}
        public string Caption {get;private set;}="";
        GameBootstrap game; AudioSource effects,music; float captionUntil; readonly Dictionary<SoundKind,AudioClip> procedural=new Dictionary<SoundKind,AudioClip>();
        public void Initialize(GameBootstrap context)
        {
            game=context; var a=game.assets; normalShot=a.shot; headshotCrunch=a.headshot; emptyClick=a.empty; reload=a.reload; axe=a.axe; groan=a.groan; loot=a.loot; siren=a.siren; dayBgm=a.dayBgm; nightBgm=a.nightBgm;
            effects=gameObject.AddComponent<AudioSource>(); effects.spatialBlend=0; effects.volume=.5f;
            music=gameObject.AddComponent<AudioSource>(); music.loop=true; music.volume=.2f;
            sunlight=new GameObject("Day night sun").AddComponent<Light>(); sunlight.type=LightType.Directional; sunlight.shadows=LightShadows.Soft;
            flashlight=new GameObject("Tactical flashlight").AddComponent<Light>(); flashlight.transform.SetParent(game.Player.transform,false); flashlight.transform.localPosition=new Vector3(0,1.25f,.6f); flashlight.type=LightType.Spot; flashlight.range=32; flashlight.spotAngle=65; flashlight.intensity=4; flashlight.shadows=LightShadows.Soft;
            RenderSettings.fog=true; RenderSettings.fogMode=FogMode.ExponentialSquared;
        }
        void Update()
        {
            if(!game)return;
            DayFraction=((game.Campaign?game.Campaign.Elapsed:Time.time)/game.balance.daySeconds+.22f)%1;
            float day=Mathf.Clamp01(Mathf.Sin(DayFraction*Mathf.PI*2)*1.4f);
            sunlight.transform.rotation=Quaternion.Euler(Mathf.Lerp(-25,65,day),35,0); sunlight.intensity=Mathf.Lerp(.08f,1.1f,day); sunlight.color=Color.Lerp(new Color(.25f,.35f,.6f),new Color(1,.9f,.72f),day);
            RenderSettings.ambientLight=Color.Lerp(new Color(.055f,.075f,.12f),new Color(.5f,.55f,.6f),day);
            RenderSettings.fogColor=Color.Lerp(new Color(.025f,.045f,.07f),new Color(.28f,.35f,.38f),day); RenderSettings.fogDensity=Mathf.Lerp(.022f,.006f,day);
            flashlight.enabled=day<.35f;
            var clip=day<.35f?nightBgm:dayBgm; if(music.clip!=clip) { music.clip=clip; if(clip)music.Play(); else music.Stop(); }
            if(Time.unscaledTime>captionUntil)Caption="";
        }
        public void Play(SoundKind kind,Vector3 position,float noiseRadius=0,AudioClip overrideClip=null)
        {
            if(noiseRadius>0){ZombieAI.HearNoise(position,noiseRadius);if(game.Pressure)game.Pressure.RecordNoise(position,noiseRadius);}
            var clip=overrideClip ? overrideClip : kind==SoundKind.Shot?normalShot:kind==SoundKind.Headshot?headshotCrunch:kind==SoundKind.Empty?emptyClick:kind==SoundKind.Reload?reload:kind==SoundKind.Axe?axe:kind==SoundKind.Groan?groan:kind==SoundKind.Loot?loot:siren;
            if(!clip) { if(!procedural.TryGetValue(kind,out clip)) { clip=Synthesize(kind); procedural[kind]=clip; } }
            effects.PlayOneShot(clip,kind==SoundKind.Groan?.3f:.8f);
            Caption=kind==SoundKind.Shot?$"[탕! 총성 발생 - 반경 {noiseRadius:0}m 좀비 어그로!]":$"[{kind} · 소리 발생]"; captionUntil=Time.unscaledTime+2;
        }
        AudioClip Synthesize(SoundKind kind)
        {
            const int rate=22050; float duration=kind==SoundKind.Siren?1.5f:.16f; var samples=new float[(int)(rate*duration)]; var random=new System.Random((int)kind+17);
            for(int i=0;i<samples.Length;i++) { float t=(float)i/rate; float frequency=kind==SoundKind.Headshot?90:kind==SoundKind.Empty?1300:kind==SoundKind.Siren?600+Mathf.Sin(t*12)*250:kind==SoundKind.Loot?800:160; float tone=Mathf.Sin(2*Mathf.PI*frequency*t); float noise=(float)random.NextDouble()*2-1; samples[i]=(tone*.45f+noise*(kind==SoundKind.Shot?.55f:.15f))*Mathf.Exp(-t/(duration*.25f))*.5f; }
            var clip=AudioClip.Create("Generated "+kind,samples.Length,1,rate,false); clip.SetData(samples,0); return clip;
        }
        void OnDestroy() { foreach(var c in procedural.Values)Destroy(c); if(sunlight)Destroy(sunlight.gameObject); }
    }
}
