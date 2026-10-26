using UnityEngine;

/// <summary>
/// 유니티 6 소울본 1-오브젝트 부트스트랩 (Auto-Setup)
/// - 빈 씬에서도 단 하나의 오브젝트로 플레이어, 고딕 지형, 화톳불, 안개벽, 적, 보스, 카메라, UI를 자동 조립
/// - [Hot-Swap Asset Slots] Mixamo 모델 및 고음질 오디오 원클릭 교체 슬롯 탑재
/// </summary>
public class SoulsGameBootstrap : MonoBehaviour
{
    [Header("Hot-Swap Asset Slots")]
    [Tooltip("외부에서 다운로드한 Mixamo 3D 사냥꾼/기사 모델 프리팹을 슬롯에 넣으면 1초 만에 외형이 교체됩니다.")]
    public GameObject customPlayerModel;
    public RuntimeAnimatorController customAnimatorController;

    private void Awake()
    {
        SetupLightingAndAtmosphere();
        SetupGothicCourtyard();
        SetupBonfire();
        SetupFogGate();
        GameObject player = SetupPlayer();
        SetupCamera(player.transform);
        SetupEnemies();
        SetupBoss();
        SetupManagers();
    }

    private void SetupLightingAndAtmosphere()
    {
        RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
        RenderSettings.ambientLight = new Color(0.15f, 0.12f, 0.18f);
        RenderSettings.fog = true;
        RenderSettings.fogColor = new Color(0.08f, 0.04f, 0.09f);
        RenderSettings.fogDensity = 0.015f;

        // 붉은 월식 디렉셔널 라이트
        GameObject moonLightObj = new GameObject("BloodMoonLight");
        Light l = moonLightObj.AddComponent<Light>();
        l.type = LightType.Directional;
        l.color = new Color(0.95f, 0.15f, 0.3f);
        l.intensity = 1.4f;
        l.shadows = LightShadows.Soft;
        moonLightObj.transform.rotation = Quaternion.Euler(48f, 40f, 0f);

        // 거대한 붉은 월식 구체 (Sky Sphere)
        GameObject moon = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        moon.name = "BloodMoonSphere";
        moon.transform.position = new Vector3(80f, 110f, -140f);
        moon.transform.localScale = Vector3.one * 36f;
        Destroy(moon.GetComponent<Collider>());
        var mr = moon.GetComponent<MeshRenderer>();
        mr.material = new Material(Shader.Find("Standard"));
        mr.material.color = new Color(0.6f, 0.08f, 0.18f);
        mr.material.EnableKeyword("_EMISSION");
        mr.material.SetColor("_EmissionColor", new Color(0.8f, 0.1f, 0.2f));
    }

    private void SetupGothicCourtyard()
    {
        // 바닥 석판 (Ground)
        GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
        ground.name = "CathedralCourtyardGround";
        ground.transform.position = Vector3.zero;
        ground.transform.localScale = new Vector3(16f, 1f, 24f);
        var gMr = ground.GetComponent<MeshRenderer>();
        gMr.material = new Material(Shader.Find("Standard"));
        gMr.material.color = new Color(0.12f, 0.1f, 0.14f);
        gMr.material.SetFloat("_Glossiness", 0.35f);
        gMr.material.SetFloat("_Metallic", 0.2f);

        // 성벽 (Courtyard Walls)
        CreateWall(new Vector3(-42f, 9f, 0f), new Vector3(4f, 18f, 240f));
        CreateWall(new Vector3(42f, 9f, 0f), new Vector3(4f, 18f, 240f));
        CreateWall(new Vector3(0f, 9f, 118f), new Vector3(84f, 18f, 4f));
        CreateWall(new Vector3(0f, 9f, -135f), new Vector3(84f, 18f, 4f));

        // 고딕 기둥들 (Pillars)
        for (float z = -35f; z <= 85f; z += 35f)
        {
            CreatePillar(new Vector3(-24f, 0f, z));
            CreatePillar(new Vector3(24f, 0f, z));
        }
    }

    private void CreateWall(Vector3 pos, Vector3 scale)
    {
        GameObject wall = GameObject.CreatePrimitive(PrimitiveType.Cube);
        wall.name = "StoneWall";
        wall.transform.position = pos;
        wall.transform.localScale = scale;
        var mr = wall.GetComponent<MeshRenderer>();
        mr.material = new Material(Shader.Find("Standard"));
        mr.material.color = new Color(0.16f, 0.13f, 0.18f);
    }

    private void CreatePillar(Vector3 pos)
    {
        GameObject col = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        col.name = "GothicPillar";
        col.transform.position = pos + Vector3.up * 11f;
        col.transform.localScale = new Vector3(2.2f, 11f, 2.2f);
        var mr = col.GetComponent<MeshRenderer>();
        mr.material = new Material(Shader.Find("Standard"));
        mr.material.color = new Color(0.18f, 0.15f, 0.2f);
    }

    private void SetupBonfire()
    {
        GameObject bf = new GameObject("Bonfire");
        bf.transform.position = new Vector3(0, 0, 75f);

        GameObject ash = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        ash.transform.SetParent(bf.transform);
        ash.transform.localPosition = new Vector3(0, 0.2f, 0);
        ash.transform.localScale = new Vector3(3f, 0.4f, 3f);
        ash.GetComponent<MeshRenderer>().material.color = new Color(0.15f, 0.12f, 0.15f);

        // 나선검 (Coiled Sword)
        GameObject sword = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        sword.transform.SetParent(bf.transform);
        sword.transform.localPosition = new Vector3(0.1f, 1.6f, 0);
        sword.transform.localRotation = Quaternion.Euler(0, 0, 15f);
        sword.transform.localScale = new Vector3(0.15f, 1.8f, 0.15f);

        // 타오르는 불빛
        GameObject lightObj = new GameObject("BonfireLight");
        lightObj.transform.SetParent(bf.transform);
        lightObj.transform.localPosition = new Vector3(0, 1.5f, 0);
        Light l = lightObj.AddComponent<Light>();
        l.type = LightType.Point;
        l.color = new Color(0.95f, 0.5f, 0.15f);
        l.range = 18f;
        l.intensity = 2.4f;
    }

    private void SetupFogGate()
    {
        GameObject gate = GameObject.CreatePrimitive(PrimitiveType.Quad);
        gate.name = "FogGate";
        gate.transform.position = new Vector3(0, 8f, -50f);
        gate.transform.localScale = new Vector3(18f, 16f, 1f);
        var mr = gate.GetComponent<MeshRenderer>();
        mr.material = new Material(Shader.Find("Standard"));
        mr.material.color = new Color(0.95f, 0.95f, 0.98f, 0.85f);
        mr.material.SetFloat("_Mode", 3); // Transparent
    }

    private GameObject SetupPlayer()
    {
        GameObject player = new GameObject("HunterPlayer");
        player.tag = "Player";
        player.transform.position = new Vector3(0, 1f, 70f);

        CharacterController cc = player.AddComponent<CharacterController>();
        cc.center = new Vector3(0, 1f, 0);
        cc.radius = 0.45f;
        cc.height = 2.0f;

        SoulsAnimationController anim = player.AddComponent<SoulsAnimationController>();
        anim.custom3DModelPrefab = customPlayerModel;
        anim.mixamoAnimatorController = customAnimatorController;

        player.AddComponent<SoulsMovementController>();
        SoulsCombatSystem combat = player.AddComponent<SoulsCombatSystem>();

        // 프로시저럴 골격 트리 생성
        BuildPlayerBones(player.transform, combat);

        return player;
    }

    private void BuildPlayerBones(Transform root, SoulsCombatSystem combat)
    {
        // 골반
        GameObject hips = GameObject.CreatePrimitive(PrimitiveType.Cube);
        hips.name = "Hips";
        hips.transform.SetParent(root);
        hips.transform.localPosition = new Vector3(0, 1.1f, 0);
        hips.transform.localScale = new Vector3(0.7f, 0.4f, 0.45f);
        Destroy(hips.GetComponent<Collider>());
        hips.GetComponent<MeshRenderer>().material.color = new Color(0.12f, 0.1f, 0.14f);

        // 가슴
        GameObject chest = GameObject.CreatePrimitive(PrimitiveType.Cube);
        chest.name = "Chest";
        chest.transform.SetParent(hips.transform);
        chest.transform.localPosition = new Vector3(0, 0.65f, 0);
        chest.transform.localScale = new Vector3(1.2f, 1.8f, 1.1f);
        Destroy(chest.GetComponent<Collider>());
        chest.GetComponent<MeshRenderer>().material.color = new Color(0.15f, 0.12f, 0.18f);

        // 머리 & 트라이콘 모자
        GameObject head = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        head.name = "Head";
        head.transform.SetParent(chest.transform);
        head.transform.localPosition = new Vector3(0, 0.7f, 0);
        head.transform.localScale = new Vector3(0.6f, 0.4f, 0.6f);
        Destroy(head.GetComponent<Collider>());

        // 오른팔 (무기 장착)
        GameObject rArm = new GameObject("RightArm");
        rArm.transform.SetParent(chest.transform);
        rArm.transform.localPosition = new Vector3(0.7f, 0.4f, 0.1f);

        // 톱단도 무기 조립
        GameObject saw = new GameObject("SawCleaver");
        saw.transform.SetParent(rArm.transform);
        saw.transform.localPosition = new Vector3(0, -0.6f, 0.2f);
        GameObject blade = GameObject.CreatePrimitive(PrimitiveType.Cube);
        blade.transform.SetParent(saw.transform);
        blade.transform.localPosition = new Vector3(0, 0.2f, 0.6f);
        blade.transform.localScale = new Vector3(0.1f, 0.4f, 1.2f);
        Destroy(blade.GetComponent<Collider>());
        blade.GetComponent<MeshRenderer>().material.color = new Color(0.75f, 0.75f, 0.8f);

        combat.sawCleaverObject = saw;
        combat.weaponHinge = blade.transform;

        // 월광의 대검 조립
        GameObject ml = new GameObject("MoonlightGreatsword");
        ml.transform.SetParent(rArm.transform);
        ml.transform.localPosition = new Vector3(0, -0.6f, 0.2f);
        GameObject mlBlade = GameObject.CreatePrimitive(PrimitiveType.Cube);
        mlBlade.transform.SetParent(ml.transform);
        mlBlade.transform.localPosition = new Vector3(0, 0.2f, 1.2f);
        mlBlade.transform.localScale = new Vector3(0.14f, 0.5f, 2.4f);
        Destroy(mlBlade.GetComponent<Collider>());
        var mlMr = mlBlade.GetComponent<MeshRenderer>();
        mlMr.material = new Material(Shader.Find("Standard"));
        mlMr.material.color = new Color(0.1f, 0.8f, 0.9f);
        mlMr.material.EnableKeyword("_EMISSION");
        mlMr.material.SetColor("_EmissionColor", new Color(0.2f, 0.9f, 1.0f));

        combat.moonlightSwordObject = ml;
        ml.SetActive(false);

        // 왼팔
        GameObject lArm = new GameObject("LeftArm");
        lArm.transform.SetParent(chest.transform);
        lArm.transform.localPosition = new Vector3(-0.7f, 0.4f, 0.1f);

        // 다리
        GameObject lLeg = GameObject.CreatePrimitive(PrimitiveType.Cube);
        lLeg.name = "LeftLeg";
        lLeg.transform.SetParent(hips.transform);
        lLeg.transform.localPosition = new Vector3(-0.3f, -0.7f, 0);
        lLeg.transform.localScale = new Vector3(0.4f, 1.4f, 0.4f);
        Destroy(lLeg.GetComponent<Collider>());

        GameObject rLeg = GameObject.CreatePrimitive(PrimitiveType.Cube);
        rLeg.name = "RightLeg";
        rLeg.transform.SetParent(hips.transform);
        rLeg.transform.localPosition = new Vector3(0.3f, -0.7f, 0);
        rLeg.transform.localScale = new Vector3(0.4f, 1.4f, 0.4f);
        Destroy(rLeg.GetComponent<Collider>());

        // 코트 자락
        GameObject coat = GameObject.CreatePrimitive(PrimitiveType.Cube);
        coat.name = "CoatTail";
        coat.transform.SetParent(hips.transform);
        coat.transform.localPosition = new Vector3(0, -0.4f, -0.3f);
        coat.transform.localScale = new Vector3(1.1f, 1.6f, 0.15f);
        Destroy(coat.GetComponent<Collider>());
    }

    private void SetupCamera(Transform target)
    {
        Camera cam = Camera.main;
        if (cam == null)
        {
            GameObject camObj = new GameObject("Main Camera");
            cam = camObj.AddComponent<Camera>();
            camObj.tag = "MainCamera";
            camObj.AddComponent<AudioListener>();
        }

        SoulsLockOnCamera lockCam = cam.gameObject.GetComponent<SoulsLockOnCamera>();
        if (lockCam == null) lockCam = cam.gameObject.AddComponent<SoulsLockOnCamera>();
        lockCam.player = target;
    }

    private void SetupEnemies()
    {
        CreateKnight(new Vector3(-12f, 1f, 35f));
        CreateKnight(new Vector3(12f, 1f, 20f));
    }

    private void CreateKnight(Vector3 pos)
    {
        GameObject k = GameObject.CreatePrimitive(PrimitiveType.Capsule);
        k.name = "GothicKnight";
        k.transform.position = pos;
        var mr = k.GetComponent<MeshRenderer>();
        mr.material.color = new Color(0.18f, 0.22f, 0.28f);

        SoulsGothicAI ai = k.AddComponent<SoulsGothicAI>();
        ai.enemyName = "망자 성당 기사";
        ai.maxHp = 240f;
        ai.visualRoot = k.transform;

        // 검
        GameObject sw = GameObject.CreatePrimitive(PrimitiveType.Cube);
        sw.transform.SetParent(k.transform);
        sw.transform.localPosition = new Vector3(0.6f, 0.3f, 0.6f);
        sw.transform.localScale = new Vector3(0.1f, 0.2f, 1.8f);
        Destroy(sw.GetComponent<Collider>());
        ai.swordTransform = sw.transform;
    }

    private void SetupBoss()
    {
        GameObject b = GameObject.CreatePrimitive(PrimitiveType.Capsule);
        b.name = "LordMalakorBoss";
        b.transform.position = new Vector3(0, 2f, -95f);
        b.transform.localScale = new Vector3(2.2f, 2.2f, 2.2f);
        var mr = b.GetComponent<MeshRenderer>();
        mr.material.color = new Color(0.08f, 0.1f, 0.15f);

        SoulsGothicAI ai = b.AddComponent<SoulsGothicAI>();
        ai.enemyName = "심연의 기사 말라코르";
        ai.isBoss = true;
        ai.maxHp = 1950f;
        ai.attackDamage = 195f;
        ai.visualRoot = b.transform;

        // 4.2m 대검
        GameObject sw = GameObject.CreatePrimitive(PrimitiveType.Cube);
        sw.transform.SetParent(b.transform);
        sw.transform.localPosition = new Vector3(0.8f, 0.2f, 0.8f);
        sw.transform.localScale = new Vector3(0.15f, 0.3f, 2.2f);
        Destroy(sw.GetComponent<Collider>());
        ai.swordTransform = sw.transform;

        // 2페이즈 발광 라이트
        GameObject flObj = new GameObject("FlameLight");
        flObj.transform.SetParent(b.transform);
        flObj.transform.localPosition = new Vector3(0, 1.5f, 0);
        Light fl = flObj.AddComponent<Light>();
        fl.type = LightType.Point;
        fl.color = Color.red;
        fl.intensity = 0f;
        fl.range = 14f;
        ai.phase2FlameLight = fl;
    }

    private void SetupManagers()
    {
        if (FindAnyObjectByType<SoulsImpactAndJuice>() == null)
        {
            new GameObject("SoulsImpactAndJuice").AddComponent<SoulsImpactAndJuice>();
        }
        if (FindAnyObjectByType<SoulsTacticalAudio>() == null)
        {
            new GameObject("SoulsTacticalAudio").AddComponent<SoulsTacticalAudio>();
        }
        if (FindAnyObjectByType<SoulsUIManager>() == null)
        {
            new GameObject("SoulsUIManager").AddComponent<SoulsUIManager>();
        }
    }
}
