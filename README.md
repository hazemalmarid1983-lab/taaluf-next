# تآلف (Next.js 14)

منصة تقييم تربوي لأطفال التوحد وصعوبات التعلم — 36 مؤشراً عبر 8 مجالات.

مسار ولي الأمر: فرز → استبيان → ألعاب → تقييم → تقرير.

## التشغيل

```bash
npm install
cp .env.example .env.local
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000)

### دخول تجريبي

| البريد | كلمة المرور | الدور |
|--------|-------------|--------|
| parent@taaluf.local | taaluf123 | ولي أمر |
| specialist@taaluf.local | taaluf123 | أخصائي |
| admin@taaluf.local | taaluf123 | إدارة |

## المسارات

- `/login?portal=parent` — بوابة الأهل
- `/parent` — لوحة المسار
- `/dashboard` — لوحة المختص
- `/dashboard/assessments/new` — تقييم 36 مؤشراً + دمج + AI + PDF

بدون مفاتيح Airtable: الحفظ يعمل محلياً في المتصفح. التقرير يحتاج `GEMINI_API_KEY` أو `OPENAI_API_KEY`.

## القالب النهائي (عمان · 14 أغسطس 2026)

المسارات المختصرة: `/assessment` `/games` `/messages` `/bookings` `/terms` `/privacy` `/faq` `/video-analysis` `/sensory-room/[childId]`.

الموافقات أربع طبقات. القانون الحاكم: سلطنة عمان / المركز العماني للتحكيم التجاري. التسعير بالدولار مع ريال عماني.

## مغامرة البطل الصغير

لعبة تقييم ثلاثية المراحل (تقليد، تتبع بصري، مشاعر) ضمن `/dashboard/games`.

- نسخة المتصفح تعمل فوراً داخل المنصة.
- مشروع Unity 2022 LTS في `unity/LittleHeroAdventure` — بعد تصدير WebGL انسخ البناء إلى `public/games/little-hero/`.
- التفاصيل: [`unity/LittleHeroAdventure/README.md`](unity/LittleHeroAdventure/README.md).
