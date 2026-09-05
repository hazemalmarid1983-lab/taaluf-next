using System.Runtime.InteropServices;
using UnityEngine;

namespace LittleHero
{
    /// <summary>
    /// جسر WebGL ↔ صفحة تآلف (iframe). في المحرر تُطبع الرسائل في Console.
    /// </summary>
    public class WebGLBridge : MonoBehaviour
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")]
        static extern void TaalufSendToPage(string json);
#endif

        public static void SendJson(string json)
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            TaalufSendToPage(json);
#else
            Debug.Log("[LittleHero WebGL] " + json);
#endif
        }

        public static void SendReady()
        {
            SendJson("{\"source\":\"taaluf-little-hero\",\"payload\":{\"type\":\"ready\"}}");
        }

        /// <summary>يستدعى من JavaScript: WebGLBridge.SetGaze(x,y,present)</summary>
        public void SetGaze(string payload)
        {
            // payload: "x,y,1"
            if (string.IsNullOrEmpty(payload)) return;
            var p = payload.Split(',');
            if (p.Length < 3) return;
            float x, y;
            float.TryParse(p[0], out x);
            float.TryParse(p[1], out y);
            bool present = p[2] == "1" || p[2] == "true";
            var tracking = FindObjectOfType<StageVisualTracking>();
            if (tracking != null) tracking.SetGaze(x, y, present);
        }

        public void SetChildId(string id)
        {
            if (GameManager.Instance != null && !string.IsNullOrEmpty(id))
                GameManager.Instance.ChildId = id;
        }

        public void SetAppearance(string payload)
        {
            if (GameManager.Instance == null || string.IsNullOrEmpty(payload)) return;
            var p = payload.Split(',');
            int skin = 0, shirt = 0;
            if (p.Length > 0) int.TryParse(p[0], out skin);
            if (p.Length > 1) int.TryParse(p[1], out shirt);
            GameManager.Instance.SetAppearance(skin, shirt);
        }

        public void StartAdventureFromPage()
        {
            if (GameManager.Instance != null) GameManager.Instance.StartAdventure();
        }

        public void ChooseImitation(string index)
        {
            int i;
            if (int.TryParse(index, out i))
            {
                var s = FindObjectOfType<StageImitation>();
                if (s != null) s.Choose(i);
            }
        }

        public void ChooseEmotion(string index)
        {
            int i;
            if (int.TryParse(index, out i))
            {
                var s = FindObjectOfType<StageEmotions>();
                if (s != null) s.Choose(i);
            }
        }

        public void MarkTracking(string ok)
        {
            var s = FindObjectOfType<StageVisualTracking>();
            if (s != null) s.MarkTracked(ok == "1" || ok == "true");
        }

        public void SetTimeOfDay(string value)
        {
            float t;
            if (GameManager.Instance != null && float.TryParse(value, out t))
                GameManager.Instance.SetTimeOfDay(t);
        }
    }
}
