#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

/// <summary>
/// 유니티 에디터 원클릭 씬 생성 및 스탠드얼론 PC 빌드 도구 (BloodSouls)
/// </summary>
[InitializeOnLoad]
public static class AutoSetupBloodSoulsScene
{
    private const string ScenePath = "Assets/Scenes/BloodSoulsScene.unity";

    static AutoSetupBloodSoulsScene()
    {
        EditorApplication.delayCall += EnsureSceneExists;
    }

    [MenuItem("BloodSouls/▶ 1-Click Setup Blood Souls & Play", false, 1)]
    public static void SetupAndPlay()
    {
        CreateOrOpenScene();
        EditorApplication.isPlaying = true;
    }

    [MenuItem("BloodSouls/Create Blood Souls Scene Only", false, 2)]
    public static void CreateOrOpenScene()
    {
        Scene scene = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
        if (!scene.IsValid())
        {
            scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            // 단 하나의 SoulsGameBootstrap 오브젝트 생성
            GameObject bootstrapObj = new GameObject("SoulsGameBootstrap");
            bootstrapObj.AddComponent<SoulsGameBootstrap>();

            EditorSceneManager.SaveScene(scene, ScenePath);
            Debug.Log("<color=green>[BloodSouls] Successfully created BloodSoulsScene at " + ScenePath + "</color>");
        }
        else
        {
            SoulsGameBootstrap bootstrap = Object.FindAnyObjectByType<SoulsGameBootstrap>();
            if (bootstrap == null)
            {
                GameObject bootstrapObj = new GameObject("SoulsGameBootstrap");
                bootstrapObj.AddComponent<SoulsGameBootstrap>();
                EditorSceneManager.MarkSceneDirty(scene);
                EditorSceneManager.SaveScene(scene);
            }
        }

        AddSceneToBuildSettings(ScenePath);
    }

    [MenuItem("BloodSouls/🚀 Build Standalone Windows PC Exe", false, 3)]
    public static void BuildWindowsExe()
    {
        EnsureSceneExists();

        string buildDir = "Builds/BloodSouls";
        if (!System.IO.Directory.Exists(buildDir))
        {
            System.IO.Directory.CreateDirectory(buildDir);
        }

        string exePath = buildDir + "/BloodSouls.exe";
        string[] scenes = new string[] { ScenePath };

        BuildPlayerOptions buildOptions = new BuildPlayerOptions
        {
            scenes = scenes,
            locationPathName = exePath,
            target = BuildTarget.StandaloneWindows64,
            options = BuildOptions.None
        };

        Debug.Log("<color=yellow>[BloodSouls] Starting Windows 64-bit Standalone Build...</color>");
        var report = BuildPipeline.BuildPlayer(buildOptions);
        if (report.summary.result == UnityEditor.Build.Reporting.BuildResult.Succeeded)
        {
            Debug.Log("<color=green>[BloodSouls] Build Succeeded! " + exePath + " (" + report.summary.totalSize + " bytes)</color>");
        }
        else
        {
            Debug.LogError("[BloodSouls] Build Failed: " + report.summary.result);
        }
    }

    private static void EnsureSceneExists()
    {
        if (!System.IO.File.Exists(ScenePath))
        {
            CreateOrOpenScene();
        }
    }

    private static void AddSceneToBuildSettings(string path)
    {
        EditorBuildSettingsScene[] original = EditorBuildSettings.scenes;
        for (int i = 0; i < original.Length; i++)
        {
            if (original[i].path == path) return;
        }

        EditorBuildSettingsScene[] updated = new EditorBuildSettingsScene[original.Length + 1];
        for (int i = 0; i < original.Length; i++)
        {
            updated[i] = original[i];
        }
        updated[updated.Length - 1] = new EditorBuildSettingsScene(path, true);
        EditorBuildSettings.scenes = updated;
    }
}
#endif
