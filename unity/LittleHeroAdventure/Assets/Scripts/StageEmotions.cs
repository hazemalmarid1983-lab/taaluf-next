using System.Collections;
using UnityEngine;

namespace LittleHero
{
    /// <summary>المرحلة الثالثة: تعبير وجه وعلى الطفل اختيار المشاعر الصحيحة.</summary>
    public class StageEmotions : MonoBehaviour
    {
        static readonly string[] Emotions = { "joy", "sad", "fear", "anger" };
        string _current;
        bool _answered;
        int _choice = -1;
        float _shownAt;

        public IEnumerator Run(WorldBuilder world)
        {
            for (int i = 0; i < Emotions.Length; i++)
            {
                _current = Emotions[i];
                _answered = false;
                _choice = -1;
                _shownAt = Time.time;
                var creature = world.Creatures[i % world.Creatures.Length];
                creature.ShowEmotion(_current);
                float timeout = 8f;
                while (!_answered && timeout > 0f)
                {
                    timeout -= Time.deltaTime;
                    yield return null;
                }
                bool ok = _answered && Emotions[Mathf.Clamp(_choice, 0, Emotions.Length - 1)] == _current;
                GameManager.Instance.RecordTrial("emotions", _current, ok, (Time.time - _shownAt) * 1000f);
                yield return new WaitForSeconds(0.35f);
            }
        }

        public void Choose(int index)
        {
            if (_answered) return;
            _choice = index;
            _answered = true;
        }

        void OnGUI()
        {
            if (GameManager.Instance == null || GameManager.Instance.Stage != AdventureStage.Emotions) return;
            GUILayout.BeginArea(new Rect(16, 250, 420, 120));
            GUILayout.Label("ما شعور الصديق؟");
            GUILayout.BeginHorizontal();
            string[] ar = { "فرح", "حزن", "خوف", "غضب" };
            for (int i = 0; i < ar.Length; i++)
            {
                if (GUILayout.Button(ar[i])) Choose(i);
            }
            GUILayout.EndHorizontal();
            GUILayout.EndArea();
        }
    }
}
