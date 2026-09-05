using System.Collections;
using UnityEngine;

namespace LittleHero
{
    public enum AdventureStage
    {
        Hub,
        Imitation,
        Tracking,
        Emotions,
        Results
    }

    /// <summary>
    /// إدارة المغامرة: البيئة → البطل والمخلوقات → المراحل الثلاث → التقييم.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        public AdventureStage Stage { get; private set; } = AdventureStage.Hub;
        public string ChildId = "child_local";
        public int SkinIndex;
        public int ShirtIndex;

        WorldBuilder _world;
        DayNightCycle _sky;
        EvaluationManager _eval;
        APIManager _api;
        StageImitation _imitation;
        StageVisualTracking _tracking;
        StageEmotions _emotions;
        string _startedAt;
        bool _busy;

        void Awake()
        {
            Instance = this;
            _world = GetComponent<WorldBuilder>();
            _sky = GetComponent<DayNightCycle>();
            _eval = GetComponent<EvaluationManager>();
            _api = GetComponent<APIManager>();
            _imitation = gameObject.AddComponent<StageImitation>();
            _tracking = gameObject.AddComponent<StageVisualTracking>();
            _emotions = gameObject.AddComponent<StageEmotions>();
        }

        IEnumerator Start()
        {
            yield return null;
            _world.Build();
            ApplyAppearance();
            _eval.ResetSession();
            _startedAt = System.DateTime.UtcNow.ToString("o");
            WebGLBridge.SendReady();
        }

        public void SetAppearance(int skin, int shirt)
        {
            SkinIndex = Mathf.Clamp(skin, 0, 3);
            ShirtIndex = Mathf.Clamp(shirt, 0, 3);
            ApplyAppearance();
        }

        public void SetTimeOfDay(float t)
        {
            if (_sky != null) _sky.TimeOfDay = t;
        }

        void ApplyAppearance()
        {
            if (_world != null && _world.Hero != null)
                _world.Hero.ApplyLook(SkinIndex, ShirtIndex);
        }

        public void StartAdventure()
        {
            if (_busy) return;
            _eval.ResetSession();
            _startedAt = System.DateTime.UtcNow.ToString("o");
            StartCoroutine(RunStages());
        }

        IEnumerator RunStages()
        {
            _busy = true;
            Stage = AdventureStage.Imitation;
            yield return _imitation.Run(_world);
            Stage = AdventureStage.Tracking;
            yield return _tracking.Run(_world);
            Stage = AdventureStage.Emotions;
            yield return _emotions.Run(_world);
            Stage = AdventureStage.Results;
            var json = _eval.BuildResultJson(_startedAt, _tracking.GazeUsed);
            _api.SubmitSession(ChildId, json);
            _busy = false;
        }

        public void RecordTrial(string stage, string promptId, bool success, float responseMs, bool distracted = false)
        {
            _eval.AddTrial(stage, promptId, success, responseMs, distracted);
        }

        void OnGUI()
        {
            GUILayout.BeginArea(new Rect(16, 16, 420, 220));
            GUILayout.Label("مغامرة البطل الصغير — " + Stage);
            GUILayout.Label("إضاءة النهار");
            if (_sky != null)
                _sky.TimeOfDay = GUILayout.HorizontalSlider(_sky.TimeOfDay, 0f, 1f);
            if (Stage == AdventureStage.Hub || Stage == AdventureStage.Results)
            {
                if (GUILayout.Button(Stage == AdventureStage.Results ? "إعادة المغامرة" : "ابدأ المغامرة"))
                    StartAdventure();
            }
            GUILayout.EndArea();
        }
    }
}
