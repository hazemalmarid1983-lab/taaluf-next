using System.Collections;
using UnityEngine;

namespace LittleHero
{
    /// <summary>
    /// المرحلة الثانية: نجم يتحرك وعلى الطفل تتبعه.
    /// MediaPipe يعمل في صفحة Next.js ويرسل الإحداثيات عبر WebGLBridge.SetGaze.
    /// </summary>
    public class StageVisualTracking : MonoBehaviour
    {
        public bool GazeUsed { get; private set; }
        Vector2 _gaze = new Vector2(0.5f, 0.5f);
        bool _gazePresent;
        bool _manualHit;
        bool _manualMiss;

        public void SetGaze(float x, float y, bool present)
        {
            _gaze = new Vector2(x, y);
            _gazePresent = present;
            GazeUsed = GazeUsed || present;
        }

        public void MarkTracked(bool tracked)
        {
            if (tracked) _manualHit = true;
            else _manualMiss = true;
        }

        public IEnumerator Run(WorldBuilder world)
        {
            var star = world.Stars != null && world.Stars.Length > 0 ? world.Stars[0] : null;
            var cam = Camera.main;
            Vector3 center = world.StageSpot != null ? world.StageSpot.position : Vector3.forward * 4f;
            for (int level = 1; level <= 5; level++)
            {
                _manualHit = _manualMiss = false;
                float speed = 0.55f + level * 0.18f;
                if (star != null) star.BeginTrackingPath(center, speed);
                float elapsed = 0f;
                int samples = 0, near = 0;
                while (elapsed < 6f)
                {
                    elapsed += Time.deltaTime;
                    if (star != null && cam != null)
                    {
                        var vp = star.ViewportPoint(cam);
                        if (_gazePresent)
                        {
                            samples++;
                            if (Vector2.Distance(_gaze, new Vector2(vp.x, vp.y)) < 0.18f) near++;
                        }
                    }
                    if (_manualHit || _manualMiss) break;
                    yield return null;
                }
                bool success = _manualHit || (!_manualMiss && samples > 4 && near / (float)samples >= 0.45f);
                bool distracted = samples > 4 && near / (float)Mathf.Max(1, samples) < 0.45f;
                if (_manualMiss) { success = false; distracted = true; }
                GameManager.Instance.RecordTrial("tracking", "star_l" + level, success, elapsed * 1000f, distracted);
                yield return new WaitForSeconds(0.35f);
            }
            if (star != null) star.StopTrackingPath();
        }

        void OnGUI()
        {
            if (GameManager.Instance == null || GameManager.Instance.Stage != AdventureStage.Tracking) return;
            GUILayout.BeginArea(new Rect(16, 250, 360, 90));
            GUILayout.Label("تتبع النجم الذهبي بالعين");
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("تتبع ✓")) MarkTracked(true);
            if (GUILayout.Button("تشتت ✗")) MarkTracked(false);
            GUILayout.EndHorizontal();
            GUILayout.EndArea();
        }
    }
}
