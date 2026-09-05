using System.Collections.Generic;
using System.Text;
using UnityEngine;

namespace LittleHero
{
    [System.Serializable]
    public class TrialRecord
    {
        public string stage;
        public string promptId;
        public bool success;
        public float responseMs;
        public bool distracted;
        public string at;
    }

    /// <summary>
    /// يسجّل دقة التقليد، زمن الاستجابة، دقة المشاعر، والتشتت.
    /// </summary>
    public class EvaluationManager : MonoBehaviour
    {
        readonly List<TrialRecord> _trials = new List<TrialRecord>();

        public void ResetSession()
        {
            _trials.Clear();
        }

        public void AddTrial(string stage, string promptId, bool success, float responseMs, bool distracted)
        {
            _trials.Add(new TrialRecord
            {
                stage = stage,
                promptId = promptId,
                success = success,
                responseMs = responseMs,
                distracted = distracted,
                at = System.DateTime.UtcNow.ToString("o")
            });
        }

        public float Rate(string stage)
        {
            int n = 0, ok = 0;
            foreach (var t in _trials)
            {
                if (t.stage != stage) continue;
                n++;
                if (t.success) ok++;
            }
            return n == 0 ? 0f : ok / (float)n;
        }

        public float DistractionRate()
        {
            int n = 0, d = 0;
            foreach (var t in _trials)
            {
                if (t.stage != "tracking") continue;
                n++;
                if (t.distracted) d++;
            }
            return n == 0 ? 0f : d / (float)n;
        }

        public float AvgResponseMs()
        {
            if (_trials.Count == 0) return 0f;
            float s = 0f;
            foreach (var t in _trials) s += t.responseMs;
            return s / _trials.Count;
        }

        public int Score()
        {
            return Mathf.RoundToInt(Rate("imitation") * 40f + Rate("tracking") * 35f + Rate("emotions") * 25f);
        }

        public string BuildResultJson(string startedAt, bool gazeUsed)
        {
            float im = Rate("imitation");
            float tr = Rate("tracking");
            float em = Rate("emotions");
            var sb = new StringBuilder(1024);
            sb.Append("{\"gameCode\":\"little_hero\",\"score\":").Append(Score());
            sb.Append(",\"levelReached\":3,\"startedAt\":\"").Append(Esc(startedAt)).Append("\"");
            sb.Append(",\"endedAt\":\"").Append(Esc(System.DateTime.UtcNow.ToString("o"))).Append("\"");
            sb.Append(",\"metrics\":{");
            sb.Append("\"imitationRate\":").Append(im.ToString("0.###")).Append(',');
            sb.Append("\"trackingAccuracy\":").Append(tr.ToString("0.###")).Append(',');
            sb.Append("\"emotionAccuracy\":").Append(em.ToString("0.###")).Append(',');
            sb.Append("\"avgResponseMs\":").Append(AvgResponseMs().ToString("0"));
            sb.Append(",\"distractionRate\":").Append(DistractionRate().ToString("0.###"));
            sb.Append(",\"gazeUsed\":").Append(gazeUsed ? "true" : "false");
            sb.Append(",\"scoring\":\"child_playable\"");
            sb.Append(",\"linkedCriteria\":[\"C3\",\"C4\",\"C11\",\"C15\",\"C9\",\"C17\",\"C8\"]}");
            sb.Append(",\"trials\":[");
            for (int i = 0; i < _trials.Count; i++)
            {
                var t = _trials[i];
                if (i > 0) sb.Append(',');
                sb.Append("{\"stage\":\"").Append(t.stage).Append("\",\"promptId\":\"").Append(t.promptId);
                sb.Append("\",\"success\":").Append(t.success ? "true" : "false");
                sb.Append(",\"responseMs\":").Append(t.responseMs.ToString("0"));
                sb.Append(",\"distracted\":").Append(t.distracted ? "true" : "false");
                sb.Append(",\"at\":\"").Append(Esc(t.at)).Append("\"}");
            }
            sb.Append("]}");
            return sb.ToString();
        }

        static string Esc(string s)
        {
            return (s ?? "").Replace("\\", "\\\\").Replace("\"", "\\\"");
        }
    }
}
