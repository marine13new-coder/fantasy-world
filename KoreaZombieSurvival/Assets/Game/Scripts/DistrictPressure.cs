using System;
using System.Collections.Generic;
using UnityEngine;

namespace SeoulSurvival
{
    [Serializable] public class DistrictHeatSave { public int x,y; public float heat; }

    public sealed class DistrictPressure : MonoBehaviour
    {
        readonly Dictionary<Vector2Int,float> heat=new Dictionary<Vector2Int,float>();
        readonly List<Vector2Int> keys=new List<Vector2Int>();
        GameBootstrap game;
        public IReadOnlyDictionary<Vector2Int,float> Heat=>heat;
        public void Initialize(GameBootstrap context){game=context;}
        public float At(Vector2Int chunk)=>heat.TryGetValue(chunk,out var value)?value:0;
        public static float DistanceToChunk(Vector3 point,Vector2Int chunk)
        {
            float x=Mathf.Max(0,Mathf.Abs(point.x-chunk.x*RealWorldMapManager.ChunkSize)-RealWorldMapManager.Radius);
            float z=Mathf.Max(0,Mathf.Abs(point.z-chunk.y*RealWorldMapManager.ChunkSize)-RealWorldMapManager.Radius);
            return Mathf.Sqrt(x*x+z*z);
        }
        public void RecordNoise(Vector3 position,float radius)
        {
            if(!game || !game.Running || radius<=0)return;
            var tuning=game.balance.districtPressure;var center=RealWorldMapManager.ChunkAt(position);
            for(int z=-1;z<=1;z++)for(int x=-1;x<=1;x++)
            {
                var chunk=center+new Vector2Int(x,z);float distance=DistanceToChunk(position,chunk);
                if(distance>=radius)continue;
                float gain=Mathf.Min(radius,180)*tuning.heatPerMetre*(1-distance/radius);
                if(gain<=0)continue;
                if(!heat.ContainsKey(chunk) && heat.Count>=64)
                {
                    var coldest=chunk;float value=float.MaxValue;
                    foreach(var entry in heat)if(entry.Value<value){coldest=entry.Key;value=entry.Value;}
                    if(gain<=value)continue;heat.Remove(coldest);
                }
                heat[chunk]=Mathf.Min(tuning.maximum,At(chunk)+gain);
            }
        }
        void Update()
        {
            if(!game || !game.Running || heat.Count==0)return;
            float decay=game.balance.districtPressure.decayPerMinute*Time.deltaTime/60;
            keys.Clear();keys.AddRange(heat.Keys);
            foreach(var key in keys){float value=heat[key]-decay;if(value<=.001f)heat.Remove(key);else heat[key]=value;}
        }
        public DistrictHeatSave[] Capture()
        {
            var result=new List<DistrictHeatSave>(heat.Count);
            foreach(var entry in heat)result.Add(new DistrictHeatSave{x=entry.Key.x,y=entry.Key.y,heat=entry.Value});
            return result.ToArray();
        }
        public void Restore(DistrictHeatSave[] saved)
        {
            heat.Clear();if(saved==null)return;
            foreach(var entry in saved)if(entry!=null && entry.heat>0)heat[new Vector2Int(entry.x,entry.y)]=entry.heat;
        }
    }
}
