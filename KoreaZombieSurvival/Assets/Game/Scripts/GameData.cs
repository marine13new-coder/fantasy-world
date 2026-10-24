using System;
using UnityEngine;

namespace SeoulSurvival
{
    public enum Facility { Police, FireStation, Convenience, School, Office, Housing }
    public enum PlayerState { Idle, Move, FocusAim, Shoot, MeleeSwing, Reload, Interact, Dead }
    public enum ZombieState { Idle, Patrol, Chase, Attack, HeadshotStun, Dead }
    public enum ZombieVariant { Common, Runner, Armored }
    public enum ResourceKind { Ammo, GunParts, Medkit, AxeUpgrade, Food, Stamina, Scrap, Electronics, RepairKit, ScoutRifle, Water, Battery, SignalFlare }
    public enum SoundKind { Shot, Headshot, Empty, Reload, Axe, Groan, Loot, Siren }
    [Serializable] public class WeaponData
    {
        public int magazineSize = 12, startingReserve = 36;
        public float damage = 25, headshotMultiplier = 4, instantKillChance = .15f;
        public float focusSeconds = .6f, shotInterval = .25f, reloadSeconds = 1.6f;
        public float range = 40, spreadDegrees = 12, noiseRadius = 30;
        public float meleeDamage = 40, meleeRange = 2.7f, meleeArc = 105, meleeInterval = .65f;
    }
    [Serializable] public class ZombieData
    {
        public float health = 100, speed = 2.3f, vision = 18, damage = 12, attackInterval = 1.2f;
        public int maxAlive = 70;
    }
    [Serializable] public class ZombieVariantData
    {
        public float health=1, speed=1, bodyDamage=1, attackDamage=1;
    }
    [Serializable] public class JourneyTuning
    {
        public float encounterSeconds=90,lateEncounterSeconds=25,extraZombieStrength=.5f;
        public float runnerStart=.25f,armoredStart=.65f,runnerChance=.35f,armoredChance=.18f;
        public string[] chapterTitles={"1장 · 마지막 연락", "2장 · 동네의 생존자", "3장 · 봉쇄선을 넘어서", "4장 · 약속 장소의 신호"};
        public int startEnemies=1,endEnemies=5;
        public float reunionHoldSeconds=45,reunionRadius=75,reunionWaveSeconds=8;
        public int reunionWaveSize=3;
    }
    [Serializable] public class PursuitTuning
    {
        public float quickSearchNoise=32, carefulSearchNoise=8;
        public float quickSearchAlert=.08f, gunshotAlert=.015f, restRecovery=.2f, decayPerMinute=.025f;
    }
    [Serializable] public class VehicleData
    {
        public string name;
        public float speed=9,rangeMeters=0,noiseRadius=0,staminaPerSecond=0;
    }
    [Serializable] public class JourneyChoiceData
    {
        public string label;
        public ItemAmount cost,reward;
        public float staminaCost,alertChange,noiseRadius;
        public int zombies;
    }
    [Serializable] public class JourneyEventData
    {
        public float progress;
        public string title,description;
        public JourneyChoiceData first,second;
    }
    [Serializable] public class ItemAmount
    {
        public ResourceKind item; public int count;
        public ItemAmount(ResourceKind item, int count) { this.item = item; this.count = count; }
    }
    [Serializable] public class LootTable { public Facility facility; public ItemAmount[] items; }
    [Serializable] public class DistrictLootBonus { public string districtName; public ItemAmount item; }
    [Serializable] public class ReliefContractData
    {
        public Facility facility; public string title; public ItemAmount reward;
    }
    [Serializable] public class Recipe
    {
        public string name; public ItemAmount[] costs; public ResourceKind output; public int count = 1; public bool barricade;
    }
    [Serializable] public class GameBalance
    {
        public WeaponData weapon = new WeaponData();
        public WeaponData scoutRifle = new WeaponData{magazineSize=20,startingReserve=0,damage=42,headshotMultiplier=3.5f,focusSeconds=.9f,shotInterval=.18f,reloadSeconds=2.4f,range=65,spreadDegrees=7,noiseRadius=50};
        public ZombieData zombie = new ZombieData();
        public ZombieVariantData[] zombieVariants={new ZombieVariantData(),new ZombieVariantData{health=.65f,speed=1.65f,attackDamage=.8f},new ZombieVariantData{health=2,speed=.7f,bodyDamage=.35f,attackDamage=1.4f}};
        public JourneyTuning journey=new JourneyTuning(); public PursuitTuning pursuit=new PursuitTuning();
        public VehicleData[] vehicles={new VehicleData{name="접이식 자전거",speed=9,staminaPerSecond=.7f},new VehicleData{name="배달 전기 스쿠터",speed=15,rangeMeters=3500,noiseRadius=18}};
        public JourneyEventData[] journeyEvents={
            new JourneyEventData{progress=.22f,title="주택가 임시 진료소",description="대피 주민이 식량을 요청합니다. 약품을 나눌 여유가 있다고 합니다.",first=new JourneyChoiceData{label="식량 1개를 건네고 구급상자 1개 받기",cost=new ItemAmount(ResourceKind.Food,1),reward=new ItemAmount(ResourceKind.Medkit,1)},second=new JourneyChoiceData{label="물자를 지키고 떠나기"}},
            new JourneyEventData{progress=.78f,title="한강 접근 · 봉쇄선",description="진행 방향에 봉쇄선이 보입니다. 조용히 돌아가거나 경보를 울리고 밀어붙일 수 있습니다.",first=new JourneyChoiceData{label="골목 우회 · 기력 35 소모 / 추격 감소",staminaCost=35,alertChange=-.1f},second=new JourneyChoiceData{label="경보 속 돌파 · 즉시 좀비 4마리 / 추격 증가",noiseRadius=50,zombies=4,alertChange=.15f}},
            new JourneyEventData{progress=.94f,title="목적지 인근 무전 중계",description="안전한 연락에는 전자부품이 필요합니다. 공개 송신은 더 멀리 들립니다.",first=new JourneyChoiceData{label="전자부품 2개로 암호화 송신 / 추격 감소",cost=new ItemAmount(ResourceKind.Electronics,2),alertChange=-.2f},second=new JourneyChoiceData{label="공개 송신 · 즉시 좀비 5마리 / 추격 증가",noiseRadius=60,zombies=5,alertChange=.2f}}
        };
        public float playerHealth = 100, moveSpeed = 6, defenseSeconds = 60, daySeconds = 1200;
        public float signalWindowSeconds = 20, signalLockSeconds = 1.2f;
        public float hungerPerMinute = 3, staminaRecovery = 12, meleeStamina = 18, carefulSearchSeconds = 2.5f;
        public float flareNoiseRadius=45, flareDuration=8;
        public LootTable[] loot = {
            new LootTable { facility = Facility.Police, items = new[] {new ItemAmount(ResourceKind.Ammo,24),new ItemAmount(ResourceKind.GunParts,2)} },
            new LootTable { facility = Facility.FireStation, items = new[] {new ItemAmount(ResourceKind.Medkit,2),new ItemAmount(ResourceKind.AxeUpgrade,1)} },
            new LootTable { facility = Facility.Convenience, items = new[] {new ItemAmount(ResourceKind.Food,3),new ItemAmount(ResourceKind.Stamina,1),new ItemAmount(ResourceKind.Water,2)} },
            new LootTable { facility = Facility.School, items = new[] {new ItemAmount(ResourceKind.Scrap,6),new ItemAmount(ResourceKind.Electronics,3)} },
            new LootTable { facility = Facility.Office, items = new[] {new ItemAmount(ResourceKind.Scrap,6),new ItemAmount(ResourceKind.Electronics,3),new ItemAmount(ResourceKind.Battery,1)} },
            new LootTable { facility = Facility.Housing, items = new[] {new ItemAmount(ResourceKind.Food,2),new ItemAmount(ResourceKind.Scrap,3),new ItemAmount(ResourceKind.Water,1)} }
        };
        public DistrictLootBonus[] carefulDistrictBonus={
            new DistrictLootBonus{districtName="환승 거점",item=new ItemAmount(ResourceKind.Battery,1)},
            new DistrictLootBonus{districtName="주택 골목",item=new ItemAmount(ResourceKind.Water,1)},
            new DistrictLootBonus{districtName="상업 거리",item=new ItemAmount(ResourceKind.Food,1)}
        };
        public ReliefContractData[] reliefContracts={
            new ReliefContractData{facility=Facility.Police,title="경찰서 · 치안 물자 회수",reward=new ItemAmount(ResourceKind.Medkit,1)},
            new ReliefContractData{facility=Facility.FireStation,title="소방서 · 구조 장비 회수",reward=new ItemAmount(ResourceKind.Food,2)},
            new ReliefContractData{facility=Facility.Convenience,title="편의점 · 비상 식량 회수",reward=new ItemAmount(ResourceKind.Scrap,3)},
            new ReliefContractData{facility=Facility.School,title="학교 · 대피소 부품 회수",reward=new ItemAmount(ResourceKind.Electronics,2)}
        };
        public Recipe[] recipes = {
            new Recipe { name="탄약 12발", costs=new[]{new ItemAmount(ResourceKind.Scrap,2)}, output=ResourceKind.Ammo,count=12 },
            new Recipe { name="바리케이드", costs=new[]{new ItemAmount(ResourceKind.Scrap,2)}, barricade=true },
            new Recipe { name="송신기 수리 키트", costs=new[]{new ItemAmount(ResourceKind.Scrap,6),new ItemAmount(ResourceKind.Electronics,4)},output=ResourceKind.RepairKit },
            new Recipe { name="현장 조립 소총", costs=new[]{new ItemAmount(ResourceKind.GunParts,2),new ItemAmount(ResourceKind.Scrap,4)},output=ResourceKind.ScoutRifle },
            new Recipe { name="유인 신호탄", costs=new[]{new ItemAmount(ResourceKind.Scrap,2),new ItemAmount(ResourceKind.Electronics,1)},output=ResourceKind.SignalFlare }
        };
        public void Validate()
        {
            if(zombieVariants==null || zombieVariants.Length==0)zombieVariants=new GameBalance().zombieVariants;
            if(journey!=null && (journey.chapterTitles==null || journey.chapterTitles.Length==0))journey.chapterTitles=new JourneyTuning().chapterTitles;
            if(journey==null)journey=new JourneyTuning();if(pursuit==null)pursuit=new PursuitTuning();if(journey.lateEncounterSeconds==0)journey.lateEncounterSeconds=25;if(journey.reunionHoldSeconds==0 && journey.reunionRadius==0){journey.reunionHoldSeconds=45;journey.reunionRadius=75;journey.reunionWaveSeconds=8;journey.reunionWaveSize=3;}if(scoutRifle==null)scoutRifle=new WeaponData{magazineSize=20,damage=42,range=65};if(vehicles==null)vehicles=new VehicleData[0];if(journeyEvents==null || journeyEvents.Length==0)journeyEvents=new GameBalance().journeyEvents;if(reliefContracts==null || reliefContracts.Length==0)reliefContracts=new GameBalance().reliefContracts;if(carefulDistrictBonus==null || carefulDistrictBonus.Length==0)carefulDistrictBonus=new GameBalance().carefulDistrictBonus;if(flareNoiseRadius==0 && flareDuration==0){flareNoiseRadius=45;flareDuration=8;}
            if (weapon == null || zombie == null || journey == null || loot == null || recipes == null || weapon.magazineSize < 1 || weapon.focusSeconds <= 0 || weapon.reloadSeconds <= 0 || weapon.shotInterval <= 0 || weapon.meleeInterval <= 0 || scoutRifle.magazineSize<1 || scoutRifle.focusSeconds<=0 || scoutRifle.reloadSeconds<=0 || zombie.health <= 0 || zombie.attackInterval <= 0 || zombie.maxAlive < 1 || journey.encounterSeconds<=0 || journey.lateEncounterSeconds<=0 || journey.startEnemies<0 || journey.endEnemies<journey.startEnemies || journey.extraZombieStrength<0 || journey.reunionHoldSeconds<=0 || journey.reunionRadius<60 || journey.reunionWaveSeconds<=0 || journey.reunionWaveSize<0 || journey.reunionWaveSize>12 || playerHealth <= 0 || defenseSeconds <= 0 || daySeconds <= 0)
                throw new ArgumentException("Invalid game balance: positive timings, health, magazine and population required.");
            if(zombieVariants.Length!=3)throw new ArgumentException("Three zombie variants required");
            foreach(var variant in zombieVariants)if(variant==null || float.IsNaN(variant.health) || float.IsInfinity(variant.health) || float.IsNaN(variant.speed) || float.IsInfinity(variant.speed) || float.IsNaN(variant.bodyDamage) || float.IsInfinity(variant.bodyDamage) || float.IsNaN(variant.attackDamage) || float.IsInfinity(variant.attackDamage) || variant.health<=0 || variant.speed<=0 || variant.bodyDamage<=0 || variant.attackDamage<=0)throw new ArgumentException("Invalid zombie variant");
            if(journey.runnerStart<0 || journey.armoredStart<=journey.runnerStart || journey.armoredStart>1 || journey.runnerChance<0 || journey.armoredChance<0 || journey.runnerChance+journey.armoredChance>1)throw new ArgumentException("Invalid encounter variants");
            if(journey.chapterTitles.Length!=4)throw new ArgumentException("Four journey chapters required");foreach(var chapter in journey.chapterTitles)if(string.IsNullOrWhiteSpace(chapter))throw new ArgumentException("Journey chapter title missing");
            foreach (var table in loot) { if(table == null || table.items == null) throw new ArgumentException("Invalid loot table"); foreach(var item in table.items) if(item == null || item.count < 0) throw new ArgumentException("Invalid loot count"); }
            if(carefulDistrictBonus.Length!=3)throw new ArgumentException("Three district loot bonuses required");foreach(var bonus in carefulDistrictBonus)if(bonus==null || string.IsNullOrWhiteSpace(bonus.districtName) || bonus.item==null || bonus.item.count<1 || !Enum.IsDefined(typeof(ResourceKind),bonus.item.item) || bonus.item.item==ResourceKind.Ammo)throw new ArgumentException("Invalid district bonus");
            foreach(var contract in reliefContracts)if(contract==null || !Enum.IsDefined(typeof(Facility),contract.facility) || string.IsNullOrWhiteSpace(contract.title) || contract.reward==null || !Enum.IsDefined(typeof(ResourceKind),contract.reward.item) || contract.reward.count<1 || contract.reward.item==ResourceKind.Ammo)throw new ArgumentException("Invalid relief contract");
            if(signalWindowSeconds<=0 || signalLockSeconds<=0)throw new ArgumentException("Signal timings must be positive");
            if(hungerPerMinute<0 || staminaRecovery<=0 || meleeStamina<=0 || carefulSearchSeconds<=0 || flareNoiseRadius<=0 || flareDuration<=0)throw new ArgumentException("Survival rates invalid");
            if(pursuit.quickSearchNoise<0 || pursuit.carefulSearchNoise<0 || pursuit.quickSearchAlert<0 || pursuit.gunshotAlert<0 || pursuit.restRecovery<0 || pursuit.decayPerMinute<0)throw new ArgumentException("Pursuit tuning invalid");
            foreach(var vehicle in vehicles)if(vehicle==null || string.IsNullOrWhiteSpace(vehicle.name) || vehicle.speed<=0 || vehicle.rangeMeters<0 || vehicle.noiseRadius<0 || vehicle.staminaPerSecond<0)throw new ArgumentException("Vehicle data invalid");
            if(journeyEvents.Length>8)throw new ArgumentException("Too many journey events");float last=0;foreach(var scene in journeyEvents){if(scene==null || scene.progress<=last || scene.progress>=1 || string.IsNullOrWhiteSpace(scene.title) || scene.first==null || scene.second==null)throw new ArgumentException("Journey event invalid");last=scene.progress;foreach(var choice in new[]{scene.first,scene.second})if(string.IsNullOrWhiteSpace(choice.label) || choice.staminaCost<0 || choice.noiseRadius<0 || choice.zombies<0 || choice.zombies>12 || float.IsNaN(choice.alertChange) || (choice.cost!=null && (choice.cost.count<0 || choice.cost.count>0 && choice.cost.item==ResourceKind.Ammo)) || (choice.reward!=null && choice.reward.count<0))throw new ArgumentException("Journey choice invalid");}
            foreach(var recipe in recipes) { if(recipe == null || recipe.costs == null || recipe.count < 1) throw new ArgumentException("Invalid recipe"); foreach(var cost in recipe.costs) if(cost == null || cost.count < 1) throw new ArgumentException("Invalid recipe cost"); }
        }
    }
    [Serializable] public class PresentationSlots
    {
        public GameObject playerPrefab, zombiePrefab, lootPrefab, barricadePrefab, helicopterPrefab, pistolPrefab, riflePrefab, axePrefab, bicyclePrefab, scooterPrefab, muzzlePrefab, impactPrefab, flarePrefab;
        public GameObject runnerZombiePrefab, armoredZombiePrefab;
        public GameObject[] buildingPrefabs = new GameObject[6];
        public RuntimeAnimatorController playerAnimator, zombieAnimator;
        public AudioClip shot, headshot, empty, reload, axe, groan, loot, siren, dayBgm, nightBgm;
    }
}
