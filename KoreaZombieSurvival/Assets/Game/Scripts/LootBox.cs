using UnityEngine;
namespace SeoulSurvival
{
    public sealed class LootBox : MonoBehaviour
    {
        public Facility facility; public string persistentId; public GameObject optionalPrefab; public bool Opened {get;private set;}
        public void Initialize(Facility kind,string id,GameObject prefab)
        {
            facility=kind; persistentId=id; optionalPrefab=prefab; Opened=GameBootstrap.Instance.Survival.Looted.Contains(id);
            if(prefab)Instantiate(prefab,transform); else WorldFactory.Box("Supply crate",transform,new Vector3(0,.4f,0),new Vector3(1.2f,.8f,.85f),Opened?Color.gray:new Color(.8f,.65f,.28f));
        }
        public bool TryOpen(bool careful=false)
        {
            if(Opened || Vector3.Distance(transform.position,GameBootstrap.Instance.Player.transform.position)>2.5f)return false;
            var game=GameBootstrap.Instance;var survival=game.Survival;
            foreach(var table in game.balance.loot)if(table.facility==facility)foreach(var item in table.items)survival.Add(item.item,item.count);
            if(careful){survival.Add(ResourceKind.Scrap,2);survival.Add(facility==Facility.Police?ResourceKind.GunParts:ResourceKind.Electronics,1);var bonus=game.balance.carefulDistrictBonus[RealWorldMapManager.DistrictKind(RealWorldMapManager.ChunkAt(transform.position))].item;survival.Add(bonus.item,bonus.count);}
            Opened=true; survival.Looted.Add(persistentId); game.Atmosphere.Play(SoundKind.Loot,transform.position,careful?0:game.balance.pursuit.quickSearchNoise);
            if(!careful && game.Journey)game.Journey.ChangeAlert(game.balance.pursuit.quickSearchAlert);
            if(game.Campaign){game.Campaign.RecordReliefLoot(facility);game.Campaign.SaveNow();}
            foreach(var renderer in GetComponentsInChildren<Renderer>())renderer.sharedMaterial=WorldFactory.Material(Color.gray);
            return true;
        }
    }
}
