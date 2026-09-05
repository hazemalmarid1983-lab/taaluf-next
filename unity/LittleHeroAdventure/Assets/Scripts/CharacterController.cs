using System.Collections;
using UnityEngine;

namespace LittleHero
{
    public enum CreatureKind
    {
        Bear,
        Rabbit,
        Cat,
        Bird
    }

    /// <summary>
    /// المخلوقات اللطيفة (دبدوب، أرنب، قطة، طائر) مع حركة وصوت إجرائي.
    /// الملف CharacterController.cs كما طُلب — الاسم CuteCreatureController لتفادي تعارض UnityEngine.CharacterController.
    /// </summary>
    public class CuteCreatureController : MonoBehaviour
    {
        public CreatureKind Kind;
        AudioSource _audio;
        Transform _body;
        Color _color;
        float _bob;

        public void Build(CreatureKind kind)
        {
            Kind = kind;
            _audio = gameObject.AddComponent<AudioSource>();
            _audio.playOnAwake = false;
            _audio.spatialBlend = 0.6f;
            switch (kind)
            {
                case CreatureKind.Bear:
                    _color = new Color(0.55f, 0.35f, 0.17f);
                    AddPart(PrimitiveType.Sphere, Vector3.up * 0.7f, Vector3.one * 1.4f, _color);
                    AddPart(PrimitiveType.Sphere, new Vector3(-0.45f, 1.25f, 0f), Vector3.one * 0.35f, _color);
                    AddPart(PrimitiveType.Sphere, new Vector3(0.45f, 1.25f, 0f), Vector3.one * 0.35f, _color);
                    break;
                case CreatureKind.Rabbit:
                    _color = new Color(0.96f, 0.88f, 0.76f);
                    AddPart(PrimitiveType.Sphere, Vector3.up * 0.55f, Vector3.one * 1.05f, _color);
                    AddPart(PrimitiveType.Capsule, new Vector3(-0.18f, 1.35f, 0f), new Vector3(0.18f, 0.45f, 0.18f), _color);
                    AddPart(PrimitiveType.Capsule, new Vector3(0.18f, 1.35f, 0f), new Vector3(0.18f, 0.45f, 0.18f), _color);
                    break;
                case CreatureKind.Cat:
                    _color = new Color(0.89f, 0.61f, 0.24f);
                    AddPart(PrimitiveType.Sphere, Vector3.up * 0.5f, new Vector3(1.1f, 0.85f, 0.8f), _color);
                    AddPart(PrimitiveType.Capsule, new Vector3(0.55f, 0.35f, -0.1f), new Vector3(0.12f, 0.45f, 0.12f), _color);
                    break;
                default:
                    _color = new Color(0.24f, 0.55f, 0.85f);
                    AddPart(PrimitiveType.Sphere, Vector3.up * 0.55f, new Vector3(0.9f, 0.55f, 0.7f), _color);
                    AddPart(PrimitiveType.Sphere, new Vector3(-0.45f, 0.7f, 0f), new Vector3(0.7f, 0.12f, 0.4f), _color);
                    AddPart(PrimitiveType.Sphere, new Vector3(0.45f, 0.7f, 0f), new Vector3(0.7f, 0.12f, 0.4f), _color);
                    break;
            }
            _body = transform;
        }

        void AddPart(PrimitiveType type, Vector3 localPos, Vector3 scale, Color color)
        {
            var p = GameObject.CreatePrimitive(type);
            p.transform.SetParent(transform, false);
            p.transform.localPosition = localPos;
            p.transform.localScale = scale;
            WorldBuilder.Paint(p, color);
            Object.Destroy(p.GetComponent<Collider>());
        }

        void Update()
        {
            _bob += Time.deltaTime;
            transform.position += Vector3.up * Mathf.Sin(_bob * 2f + (int)Kind) * 0.0025f;
        }

        public void PlayMove(string moveId)
        {
            StopAllCoroutines();
            StartCoroutine(MoveRoutine(moveId));
            PlayVoice();
        }

        public void ShowEmotion(string emotionId)
        {
            StopAllCoroutines();
            StartCoroutine(EmotionRoutine(emotionId));
            PlayVoice();
        }

        IEnumerator MoveRoutine(string moveId)
        {
            Vector3 origin = transform.localScale;
            Vector3 pos = transform.position;
            float t = 0f;
            while (t < 1.1f)
            {
                t += Time.deltaTime;
                float s = 1f + Mathf.Sin(t * 10f) * 0.12f;
                transform.localScale = moveId == "hands_up" ? new Vector3(origin.x, origin.y * (1f + t * 0.25f), origin.z) : origin * s;
                if (moveId == "wave" || moveId == "clap")
                    transform.rotation = Quaternion.Euler(0f, Mathf.Sin(t * 14f) * 25f, 0f);
                yield return null;
            }
            transform.localScale = origin;
            transform.position = pos;
            transform.rotation = Quaternion.identity;
        }

        IEnumerator EmotionRoutine(string emotionId)
        {
            Color flash = emotionId == "joy" ? Color.yellow
                : emotionId == "sad" ? new Color(0.4f, 0.55f, 0.9f)
                : emotionId == "fear" ? Color.white
                : new Color(0.9f, 0.25f, 0.2f);
            float t = 0f;
            while (t < 1.2f)
            {
                t += Time.deltaTime;
                transform.localScale = Vector3.one * (1f + Mathf.Sin(t * 8f) * 0.08f);
                yield return null;
            }
            transform.localScale = Vector3.one;
            foreach (var r in GetComponentsInChildren<Renderer>())
                r.material.color = Color.Lerp(r.material.color, flash, 0.25f);
        }

        public void PlayVoice()
        {
            if (_audio == null) return;
            _audio.pitch = Kind == CreatureKind.Bird ? 1.6f : Kind == CreatureKind.Bear ? 0.7f : 1.1f;
            _audio.clip = MakeTone(Kind == CreatureKind.Bird ? 880f : 420f + (int)Kind * 80f, 0.22f);
            _audio.Play();
        }

        static AudioClip MakeTone(float freq, float seconds)
        {
            int hz = 44100;
            int samples = Mathf.CeilToInt(hz * seconds);
            var clip = AudioClip.Create("tone", samples, 1, hz, false);
            var data = new float[samples];
            for (int i = 0; i < samples; i++)
            {
                float env = 1f - i / (float)samples;
                data[i] = Mathf.Sin(2f * Mathf.PI * freq * i / hz) * 0.25f * env;
            }
            clip.SetData(data, 0);
            return clip;
        }
    }
}
