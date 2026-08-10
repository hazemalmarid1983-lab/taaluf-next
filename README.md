# تآلف (Next.js 14)

منصة تقييم أطفال التوحد وصعوبات التعلم — 24 مؤشراً عبر 8 مجالات.

المصدر الرسمي للمعايير والدليل:
- `data/taalof_criteria.json` (من مجلد «تقييم الحوت»)
- `docs/AIRTABLE_VERCEL_GUIDE.md`

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
| specialist@taaluf.local | taaluf123 | أخصائي |
| teacher@taaluf.local | taaluf123 | معلّم |
| parent@taaluf.local | taaluf123 | ولي أمر |

## المسارات

- `/login` — NextAuth
- `/dashboard` — لوحة التحكم
- `/dashboard/students/new` — إضافة طالب
- `/dashboard/assessments/new` — تقييم 24 مؤشراً + Radar + AI + PDF

## API (حسب الدليل)

- `GET/POST /api/airtable/students`
- `POST /api/airtable/assessments`
- `GET /api/airtable/criteria`
- `POST /api/ai/analyze`

## Airtable — TaalofDB

أنشئ الجداول: `Students` · `Specialists` · `Assessments` · `AssessmentCriteria` · `Reports` · `ParentSurveys`  
ثم عبّئ `.env.local` بـ `AIRTABLE_API_KEY` و `AIRTABLE_BASE_ID`.

بدون مفاتيح: الحفظ يعمل محلياً. تحليل AI يحتاج `OPENAI_API_KEY`.

## Vercel

ارفع المستودع → أضف متغيرات البيئة من `.env.example` → Deploy.
