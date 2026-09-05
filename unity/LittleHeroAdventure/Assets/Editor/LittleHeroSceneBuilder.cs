using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using LittleHero;

namespace LittleHero.EditorTools
{
    public static class LittleHeroSceneBuilder
    {
        [MenuItem("تآلف/إنشاء المشهد الرئيسي")]
        public static void BuildMainScene()
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);
            var light = Object.FindObjectOfType<Light>();
            if (light != null)
            {
                light.name = "Sun";
                light.type = LightType.Directional;
                light.shadows = LightShadows.Soft;
            }
            var root = new GameObject("LittleHeroRoot");
            root.AddComponent<WorldBuilder>();
            root.AddComponent<DayNightCycle>();
            root.AddComponent<EvaluationManager>();
            root.AddComponent<APIManager>();
            root.AddComponent<GameManager>();
            root.AddComponent<WebGLBridge>();
            EditorSceneManager.SaveScene(scene, "Assets/Scenes/MainScene.unity");
            var scenes = new[] { new EditorBuildSettingsScene("Assets/Scenes/MainScene.unity", true) };
            EditorBuildSettings.scenes = scenes;
            Debug.Log("تم حفظ Assets/Scenes/MainScene.unity — اضغط Play.");
        }
    }
}
