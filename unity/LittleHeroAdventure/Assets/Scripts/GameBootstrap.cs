using UnityEngine;

namespace LittleHero
{
    /// <summary>
    /// يبني المشهد إجرائياً عند التشغيل حتى يعمل المشروع بدون نماذج FBX.
    /// </summary>
    public static class GameBootstrap
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Boot()
        {
            if (Object.FindObjectOfType<GameManager>() != null) return;

            var root = new GameObject("LittleHeroRoot");
            Object.DontDestroyOnLoad(root);
            root.AddComponent<WorldBuilder>();
            root.AddComponent<DayNightCycle>();
            root.AddComponent<EvaluationManager>();
            root.AddComponent<APIManager>();
            root.AddComponent<GameManager>();
            root.AddComponent<WebGLBridge>();
        }
    }
}
