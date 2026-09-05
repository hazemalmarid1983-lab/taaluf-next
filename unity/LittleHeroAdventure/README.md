# مغامرة البطل الصغير — Unity 2022 LTS

مشروع Unity 3D لمنصة تآلف. العالم والشخصيات يُولَّدان بالكود (لا حاجة لنماذج FBX).

## فتح المشروع

1. ثبّت **Unity 2022.3 LTS** (أو أحدث).
2. Unity Hub → Add → المجلد `unity/LittleHeroAdventure`.
3. بعد الاستيراد: افتح `Assets/Scenes/MainScene.unity` واضغط Play.
4. القائمة **تآلف → إنشاء المشهد الرئيسي** إن أردت إعادة بناء المشهد.

## التحكم في المحرر

- محور WASD لتحريك البطل في الساحة.
- شريط الإضاءة أعلى اليسار (نهار / غروب / ليل ونجوم).
- **ابدأ المغامرة**: تقليد → تتبع النجم → المشاعر.

## تصدير WebGL ودمجه مع Next.js

1. File → Build Settings → WebGL → Switch Platform.
2. Player Settings: Product Name = `Little Hero Adventure`, WebGL Memory Size مناسب (مثلاً 512).
3. Build إلى المجلد:

```
taaluf-next/public/games/little-hero/
```

يجب أن يظهر `index.html` و`Build/` و`TemplateData/`.

4. في المنصة: `/dashboard/games` → مغامرة البطل الصغير. إن وُجد البناء تُحمَّل اللعبة داخل iframe، وإلا تُستخدم النسخة المضمّنة في المتصفح.

## الجسر مع تآلف

Unity **لا يحتوي مفاتيح** Airtable أو Gemini.

بعد انتهاء المراحل يُرسل `postMessage` إلى الصفحة الأب، ثم Next.js يحفظ عبر `/api/games/run` (Airtable إن وُجد، و`localStorage`).

رسائل JavaScript المتوقعة:

- `SetChildId(id)`
- `SetAppearance("skin,shirt")`
- `StartAdventureFromPage`
- `SetGaze("x,y,1")` من MediaPipe في الصفحة
- `ChooseImitation(index)` / `ChooseEmotion(index)` / `MarkTracking("1")`

## الملفات

| ملف | الدور |
|---|---|
| `GameManager.cs` | إدارة المراحل |
| `PlayerController.cs` | البطل وتخصيص المظهر |
| `CharacterController.cs` | المخلوقات الأربعة (`CuteCreatureController`) |
| `StarController.cs` | النجوم والتتبع |
| `EvaluationManager.cs` | دقة التقليد / التتبع / المشاعر / التشتت |
| `APIManager.cs` | إرسال النتيجة للمنصة |
| `MainScene.unity` | المشهد الرئيسي |

ليست تشخيصاً طبياً. تقدير النظر عبر MediaPipe تجريبي وللتجربة فقط.
