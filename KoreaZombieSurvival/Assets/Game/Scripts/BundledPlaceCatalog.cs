using System;
using System.Collections.Generic;
using UnityEngine;

namespace SeoulSurvival
{
    // Named places from the three ODbL map snapshots already shipped with the game.
    public static class BundledPlaceCatalog
    {
        sealed class Place { public string area,name; public double lat,lon; }
        static List<Place> places;
        static void Load()
        {
            if(places!=null)return;
            places=new List<Place>();
            foreach(var area in new[]{"Nowon","Jamsil","Gangnam"})
            {
                var source=Resources.Load<TextAsset>("MapSnapshots/"+area);
                if(!source || !RealWorldMapManager.TryParse(source.text,out var map))continue;
                string koreanArea=area=="Nowon"?"노원":area=="Jamsil"?"잠실":"강남";
                foreach(var element in map.elements)
                {
                    var name=element?.tags?.name;
                    if(string.IsNullOrWhiteSpace(name) || name.Length>80)continue;
                    double lat=element.lat!=0?element.lat:element.center?.lat??0;
                    double lon=element.lon!=0?element.lon:element.center?.lon??0;
                    if(lat<33 || lat>39 || lon<124 || lon>132)continue;
                    places.Add(new Place{area=koreanArea,name=name.Trim(),lat=lat,lon=lon});
                }
            }
        }
        public static bool TryResolve(string input,out string name,out double lat,out double lon)
        {
            name=null;lat=lon=0;
            if(string.IsNullOrWhiteSpace(input) || input.Length>80)return false;
            Load();string query=input.Trim();Place match=null;
            foreach(var place in places)
            {
                if(!query.Equals(place.name,StringComparison.OrdinalIgnoreCase) && !query.Equals(place.area+" "+place.name,StringComparison.OrdinalIgnoreCase))continue;
                if(match!=null && (Math.Abs(match.lat-place.lat)>30.0/111320 || Math.Abs(match.lon-place.lon)>30.0/90000))return false;
                match=place;
            }
            if(match==null)return false;
            name=match.name;lat=match.lat;lon=match.lon;return true;
        }
    }
}
