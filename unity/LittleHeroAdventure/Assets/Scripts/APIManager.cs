using UnityEngine;

namespace LittleHero
{
    /// <summary>
    /// التواصل مع منصة تآلف. لا تُوضع مفاتيح Airtable أو Gemini داخل Unity.
    /// WebGL يرسل النتيجة للأب (Next.js) عبر postMessage، والمنصة تحفظ في Airtable وlocalStorage.
    /// </summary>
    public class APIManager : MonoBehaviour
    {
        public void SubmitSession(string childId, string resultJson)
        {
            var envelope = "{\"source\":\"taaluf-little-hero\",\"payload\":{\"type\":\"complete\",\"childId\":\""
                           + Escape(childId) + "\",\"result\":" + resultJson + "}}";
            WebGLBridge.SendJson(envelope);
            Debug.Log("[LittleHero] session ready for Next.js /api/games/run\n" + envelope);
        }

        public void RequestGeminiEncouragement(string summary)
        {
            var envelope = "{\"source\":\"taaluf-little-hero\",\"payload\":{\"type\":\"askAi\",\"summary\":\""
                           + Escape(summary) + "\"}}";
            WebGLBridge.SendJson(envelope);
        }

        static string Escape(string s)
        {
            return (s ?? "").Replace("\\", "\\\\").Replace("\"", "\\\"");
        }
    }
}
