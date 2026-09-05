using UnityEngine;

namespace LittleHero
{
    /// <summary>
    /// البطل الطفل: حركة بسيطة وتخصيص لون البشرة والملابس.
    /// </summary>
    public class PlayerController : MonoBehaviour
    {
        public float Speed = 4.2f;
        Transform _head;
        Transform _body;
        static readonly Color[] Skins =
        {
            new Color(0.97f, 0.84f, 0.72f),
            new Color(0.91f, 0.72f, 0.54f),
            new Color(0.78f, 0.53f, 0.26f),
            new Color(0.55f, 0.33f, 0.14f)
        };
        static readonly Color[] Shirts =
        {
            new Color(0.18f, 0.55f, 0.35f),
            new Color(0.24f, 0.55f, 0.85f),
            new Color(0.89f, 0.61f, 0.24f),
            new Color(0.77f, 0.36f, 0.48f)
        };

        void Awake()
        {
            _head = transform.Find("Head");
            _body = transform.Find("Body");
            ApplyLook(0, 0);
        }

        public void ApplyLook(int skin, int shirt)
        {
            if (_head != null) WorldBuilder.Paint(_head.gameObject, Skins[Mathf.Clamp(skin, 0, Skins.Length - 1)]);
            if (_body != null) WorldBuilder.Paint(_body.gameObject, Shirts[Mathf.Clamp(shirt, 0, Shirts.Length - 1)]);
        }

        void Update()
        {
            if (GameManager.Instance != null && GameManager.Instance.Stage != AdventureStage.Hub)
                return;

            var input = new Vector3(Input.GetAxisRaw("Horizontal"), 0f, Input.GetAxisRaw("Vertical"));
            if (input.sqrMagnitude < 0.01f) return;
            var dir = input.normalized;
            transform.position += dir * Speed * Time.deltaTime;
            transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(dir), 8f * Time.deltaTime);
        }

        public void PlayPose(string moveId)
        {
            StopAllCoroutines();
            StartCoroutine(PoseRoutine(moveId));
        }

        System.Collections.IEnumerator PoseRoutine(string moveId)
        {
            Vector3 origin = transform.localScale;
            float t = 0f;
            while (t < 0.7f)
            {
                t += Time.deltaTime;
                float wiggle = 1f + Mathf.Sin(t * 12f) * 0.08f;
                transform.localScale = moveId == "hands_up"
                    ? new Vector3(origin.x, origin.y * (1f + t * 0.15f), origin.z)
                    : origin * wiggle;
                yield return null;
            }
            transform.localScale = origin;
        }
    }
}
