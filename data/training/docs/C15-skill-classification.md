# C15 — تصنيف المهارات (motor-social-imitation)

**مواصفة التدريب (Pass 03):** [`C15-training-specification.md`](./C15-training-specification.md)  
**محاذاة Canon ↔ Training (Pass 04):** [`C15-alignment-governance.md`](./C15-alignment-governance.md)

> **S4 و S5 ليسا Target Skills.** هما **Progression Dimensions** فقط (replay / fading) — لا تدخل `assignment.skillIds` ولا تتحكم في اختيار الحركة في المحرك.

## Target Skills — ماذا يقلد الطفل؟

| skillId | المهارة |
|---------|---------|
| `skill-c15-s1-gross` | C15-S1 — تقليد حركة كبيرة مألوفة |
| `skill-c15-s2-fine` | C15-S2 — تقليد حركة دقيقة |
| `skill-c15-s3-social` | C15-S3 — تقليد تعبير اجتماعي بسيط |

هذه فقط تدخل `TrainingPlanAssignment.skillIds` واختيار Plan Builder.

## Training / Progression Dimensions — كيف يُقدَّم التدريب؟

| skillId | البعد |
|---------|--------|
| `skill-c15-s4-replay` | تقليد بعد إعادة النموذج (بروتوكول replay) |
| `skill-c15-s5-fading` | تقليد مع تلاشي المساعدة (محور prompt/fading) |

تُعرَّف في `skills[]` و`goalLinks` في الفصل للمرجع المنهجي؛ **لا** تُختار كـ target skills و**لا** تُحفظ في `skillIds` للخطط الجديدة.

## حدود التنفيذ الحالي (Pass 01)

- **S4:** وجود زر إعادة النموذج و`modelReplays` على المحاولة **لا** يعني أن replay أصبح معيار نجاح معتمدًا أو أن S4 مُنفَّذ سريريًا.
- **S5:** تسجيل `promptLevel` يدويًا من المراقب **لا** يعني أن بروتوكول fading مُنفَّذ أو أن S5 مُقاس كإتقان.
- تحويل S4/S5 إلى **protocol executable** يحتاج قرارًا علميًا ومهمة تنفيذ لاحقة (خارج Pass 01).

PROVISIONAL DESIGN — Scientific Review Pending.
