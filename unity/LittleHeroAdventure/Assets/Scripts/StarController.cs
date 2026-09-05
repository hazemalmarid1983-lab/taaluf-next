using UnityEngine;

namespace LittleHero
{
    /// <summary>
    /// نجوم متلألئة تتحرك في السماء، ونجم المرحلة الثانية يتبع مساراً أمام الطفل.
    /// </summary>
    public class StarController : MonoBehaviour
    {
        float _phase;
        float _baseScale = 0.18f;
        Vector3 _home;
        Color _gold = new Color(1f, 0.9f, 0.35f);
        Renderer _rend;
        bool _trackingTarget;
        Vector3 _trackCenter;
        float _trackSpeed = 0.8f;

        public void Setup(int index)
        {
            _phase = index * 0.37f;
            _home = transform.position;
            _rend = GetComponent<Renderer>();
            WorldBuilder.Paint(gameObject, _gold);
            if (_rend != null)
            {
                _rend.material.EnableKeyword("_EMISSION");
                _rend.material.SetColor("_EmissionColor", _gold * 2.2f);
            }
        }

        public void SetNightAlpha(float a)
        {
            if (_rend == null) return;
            var c = _gold;
            c.a = Mathf.Clamp01(0.15f + a);
            _rend.material.color = c;
            transform.localScale = Vector3.one * (_baseScale * (0.4f + a));
        }

        public void BeginTrackingPath(Vector3 center, float speed)
        {
            _trackingTarget = true;
            _trackCenter = center;
            _trackSpeed = speed;
            _baseScale = 0.45f;
            transform.position = center + Vector3.up * 1.6f;
        }

        public void StopTrackingPath()
        {
            _trackingTarget = false;
            _baseScale = 0.18f;
            transform.position = _home;
        }

        public Vector3 ViewportPoint(Camera cam)
        {
            if (cam == null) return new Vector3(0.5f, 0.5f, 0f);
            return cam.WorldToViewportPoint(transform.position);
        }

        void Update()
        {
            _phase += Time.deltaTime;
            float twinkle = 0.85f + Mathf.Sin(_phase * 5.5f) * 0.15f;
            transform.localScale = Vector3.one * (_baseScale * twinkle);
            if (_trackingTarget)
            {
                float x = Mathf.Sin(_phase * _trackSpeed) * 2.8f;
                float y = 1.4f + Mathf.Cos(_phase * _trackSpeed * 0.7f) * 1.1f;
                transform.position = _trackCenter + new Vector3(x, y, 0.4f);
            }
            else
            {
                transform.position = _home + Vector3.up * Mathf.Sin(_phase + _home.x) * 0.15f;
            }
        }
    }
}
