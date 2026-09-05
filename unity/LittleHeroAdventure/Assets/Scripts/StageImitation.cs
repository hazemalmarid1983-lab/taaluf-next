using System.Collections;
using UnityEngine;

namespace LittleHero
{
    /// <summary>المرحلة الأولى: المخلوق يؤدي حركة وعلى الطفل اختيار التقليد الصحيح.</summary>
    public class StageImitation : MonoBehaviour
    {
        static readonly string[] Moves = { "hands_up", "clap", "touch_nose", "wave", "smile" };
        string _current;
        bool _answered;
        float _shownAt;
        int _choice = -1;

        public IEnumerator Run(WorldBuilder world)
        {
            for (int i = 0; i < Moves.Length; i++)
            {
                _current = Moves[i];
                _answered = false;
                _choice = -1;
                _shownAt = Time.time;
                var creature = world.Creatures[i % world.Creatures.Length];
                creature.PlayMove(_current);
                if (world.Hero != null) world.Hero.PlayPose(_current);
                float timeout = 8f;
                while (!_answered && timeout > 0f)
                {
                    timeout -= Time.deltaTime;
                    yield return null;
                }
                bool ok = _answered && Moves[Mathf.Clamp(_choice, 0, Moves.Length - 1)] == _current;
                GameManager.Instance.RecordTrial("imitation", _current, ok, (Time.time - _shownAt) * 1000f);
                yield return new WaitForSeconds(0.4f);
            }
        }

        /// <summary>يستدعى من واجهة الويب أو OnGUI: فهرس الحركة التي اختارها الطفل.</summary>
        public void Choose(int index)
        {
            if (_answered) return;
            _choice = index;
            _answered = true;
        }

        void OnGUI()
        {
            if (GameManager.Instance == null || GameManager.Instance.Stage != AdventureStage.Imitation) return;
            GUILayout.BeginArea(new Rect(16, 250, 460, 180));
            GUILayout.Label("قلّد الحركة: " + _current);
            GUILayout.BeginHorizontal();
            for (int i = 0; i < Moves.Length; i++)
            {
                if (GUILayout.Button(Moves[i])) Choose(i);
            }
            GUILayout.EndHorizontal();
            GUILayout.EndArea();
        }
    }
}
