# فصل صعوبات التعلم — مشروع مستقل (المرحلة القادمة)

> **الحالة الحالية:** الكود موجود في المستودع لكن **معطّل افتراضياً**  
> `NEXT_PUBLIC_LEARNING_DIFFICULTIES_ENABLED=false`

منصة **تآلف** في هذه المرحلة تركز على:
- التوحد
- الإعاقات النمائية
- المسار النمائي (فرز 12 · استبيان · ألعاب · تقييم 40 مؤشراً)

---

## راية التشغيل

| المتغير | القيمة | التأثير |
|---------|--------|---------|
| `NEXT_PUBLIC_LEARNING_DIFFICULTIES_ENABLED` | `false` (افتراضي) | إخفاء المسار الأكاديمي، إعادة توجيه `/dashboard/pathways` → `/dashboard/screening` |
| نفس المتغير | `true` | تفعيل المسار المزدوج (نمائي + أكاديمي) كما كان |

المنطق في: `lib/featureFlags.ts` · `middleware.ts` · `lib/parentJourney.ts` (`parentScreeningEntryHref`)

---

## ملفات المشروع المستقبلي (صعوبات التعلم)

عند إنشاء repo منفصل (مثلاً `taaluf-learning` أو `taalof-ld`)، انقل أو انسخ:

### مسارات (App Router)
- `app/dashboard/screening-learning/`
- `app/dashboard/academic-assessment/`
- `app/dashboard/academic-card/`
- `app/dashboard/pathways/` (بوابة المسار المزدوج)
- `app/dashboard/results/` (إن كان يربط المسارين)

### مكتبات
- `lib/learningScreeningEngine.ts`
- `lib/learningScreeningQuestions.ts`
- `lib/i18n/learningScreeningI18n.ts`
- `lib/academicAssessmentEngine.ts`
- `lib/academicFullQuestions.ts`
- `lib/academicFullI18n.ts`
- `lib/schoolPass.ts`
- أجزاء `academic` من `lib/childPathwayRecord.ts`

### مكوّنات
- `components/reports/AcademicAccommodationsCard.tsx`
- `components/SchoolPassCard.tsx`
- `components/records/DualPathwayRecord.tsx` (نسخة أكاديمية فقط)

### اختبارات
- `__tests__/learningScreening.test.ts`
- `__tests__/academicAssessment.test.ts`
- أجزاء أكاديمية من `__tests__/childPathwayRecord.test.ts`

### ما يبقى في تآلف (التوحد)
- `lib/screeningEngine.ts` · فرز 12 نمائي
- `data/taalof_screening.json`
- تقييم 40 مؤشر · IEP · الغرف الحسية · hub سريري

---

## خطوات الفصل الموصى بها

1. **Pilot الحالي:** اترك `LEARNING_DIFFICULTIES_ENABLED=false` على Vercel.
2. **Fork:** مستودع جديد + brand منفصل + criteria خاصة بصعوبات التعلم.
3. **قاعدة بيانات:** جداول Airtable منفصلة (Students LD · Assessments LD).
4. **إزالة تدريجية:** بعد استقرار المشروع المنفصل، احذف الملفات أعلاه من `taaluf-next`.

---

## Vercel — متغيرات Pilot (تآلف / توحد)

```
NEXT_PUBLIC_LEARNING_DIFFICULTIES_ENABLED=false
TAALUF_PILOT_MODE=true
NEXT_PUBLIC_PAYMENTS_DISABLED=true
ALLOW_DEMO_USERS=false
```
