using UnityEngine;

namespace LittleHero
{
    /// <summary>
    /// إضاءة نهارية متغيرة + سماء نجوم ديناميكية.
    /// </summary>
    public class DayNightCycle : MonoBehaviour
    {
        [Range(0f, 1f)] public float TimeOfDay = 0.35f;

        Light _sun;
        Camera _cam;

        static readonly Color DaySky = new Color(0.45f, 0.72f, 0.95f);
        static readonly Color DuskSky = new Color(0.85f, 0.45f, 0.35f);
        static readonly Color NightSky = new Color(0.05f, 0.07f, 0.16f);

        void Start()
        {
            var sunGo = GameObject.Find("Sun") ?? new GameObject("Sun");
            _sun = sunGo.GetComponent<Light>() ?? sunGo.AddComponent<Light>();
            _sun.type = LightType.Directional;
            _sun.shadows = LightShadows.Soft;
            _cam = Camera.main;
        }

        void Update()
        {
            float t = TimeOfDay;
            if (_sun != null)
            {
                _sun.transform.rotation = Quaternion.Euler((t * 360f) - 90f, 40f, 0f);
                _sun.intensity = Mathf.Lerp(0.12f, 1.15f, DayFactor(t));
                _sun.color = Color.Lerp(new Color(0.35f, 0.45f, 0.8f), Color.white, DayFactor(t));
            }
            if (_cam != null)
            {
                Color sky = t < 0.5f
                    ? Color.Lerp(DuskSky, DaySky, t * 2f)
                    : Color.Lerp(DaySky, NightSky, (t - 0.5f) * 2f);
                if (t > 0.78f) sky = Color.Lerp(sky, NightSky, (t - 0.78f) / 0.22f);
                _cam.backgroundColor = sky;
            }
            RenderSettings.fog = true;
            RenderSettings.fogColor = _cam != null ? _cam.backgroundColor : DaySky;
            RenderSettings.ambientLight = Color.Lerp(new Color(0.12f, 0.14f, 0.28f), new Color(0.65f, 0.75f, 0.85f), DayFactor(t));

            var gm = GameManager.Instance;
            if (gm == null) return;
            var world = GetComponent<WorldBuilder>();
            if (world == null || world.Stars == null) return;
            float starAlpha = Mathf.Clamp01((t - 0.55f) / 0.25f);
            foreach (var star in world.Stars)
            {
                if (star != null) star.SetNightAlpha(starAlpha);
            }
        }

        static float DayFactor(float t)
        {
            return 1f - Mathf.Abs(t - 0.38f) * 1.6f;
        }
    }
}
