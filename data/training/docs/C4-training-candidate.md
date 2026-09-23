# C4 — فهم التعليمات المركبة

**Pass 01 — Training Candidate Definition**  
**حالة:** توثيق مرشح فقط — **لا** skill/media في JSON، **لا** engine، **لا** candidate في `trainingCandidates`.  
**Pass 02 — Fidelity Gate:** [`C4-fidelity-gate.md`](./C4-fidelity-gate.md)  
**مراجع:** `data/taalof_criteria_v3.json`، `docs/scientific/TAALOF_TRAINING_METHODOLOGY_v1.0.md` §22، [`TAALUF_DIGITAL_FIDELITY_FRAMEWORK_v1.0.md`](../../../docs/scientific/TAALUF_DIGITAL_FIDELITY_FRAMEWORK_v1.0.md)، فصل `communication-language` (C3: `listen-then-tap`)، `lib/training/communicationChoiceEngine.ts`.

---

## 1. Canon

المصدر: `data/taalof_criteria_v3.json` — **نقل حرفي للمعنى دون إعادة صياغة.**

| الحقل | النص |
|--------|------|
| **id** | C4 |
| **name / title** | فهم التعليمات المركبة (خطوتان فأكثر) |
| **domain** | التواصل الاستجابي والتعبيري |
| **question / description** | هل ينفذ الطفل تعليماً من خطوتين متتاليتين بالترتيب الصحيح؟ |
| **level 0 — مستقر** | ينفذ تعليماً من خطوتين بالترتيب الصحيح دون تذكير. |
| **level 1 — متوسط** | ينفذ الخطوتين بعد إعادة التعليم أو تجزئته إلى خطوتين منفصلتين. |
| **level 2 — شديد** | ينفذ الخطوة الأولى فقط ويتوقف أو يخلط الترتيب حتى مع التذكير. |
| **level 3 — شديد جداً** | لا يتابع سلسلة من خطوتين ويترك المهمة فور سماع أكثر من فعل. |
| **recommendation** | يُوصى بتدريب متدرج على تسلسل التعليمات مع جداول بصرية قصيرة ثم سحب الدعم. |
| **autoGoal** | أن ينفذ الطفل تعليماً من خطوتين مألوفتين بالترتيب الصحيح بنسبة نجاح 80% خلال 3 أشهر. |
| **referralRecommendation** | يُوصى بتدريب متدرج على تسلسل التعليمات مع جداول بصرية قصيرة ثم سحب الدعم. |
| **ageBands** | 3-4، 5-6، 7-9، 10-12 |

> §22 المنهجية يوسّم التفكيك B–P **PROPOSED / PENDING SCIENTIFIC REVIEW** — ليس Canon خام.

---

## 2. حدود C4

### ما يميّز C4 في Canon

- **تعليمة واحدة** تحتوي **خطوتين متتاليتين** + **الترتيب الصحيح** + **الإكمال** (ليس خطوة واحدة فقط).
- الاسم والسؤال يذكران «**خطوتان فأكثر**»؛ **`autoGoal`** يحدّ **خطوتين مألوفتين** فقط.

### C3 (من Canon)

- **فهم التعليمات اللفظية البسيطة (خطوة واحدة)** — السؤال: «هل ينفذ الطفل تعليماً لفظياً من خطوة واحدة مثل: تعال، اجلس، أعطني؟»
- level 0: تنفيذ **خطوة واحدة** في بيئات مختلفة **دون تكرار أو إشارة**.
- §21 المنهجية: **تعليمات مركبة (خطوتان فأكثر) — معيار C4** (خارج C3).

### C2 (من Canon)

- **الاستجابة للنداء باسمه والالتفات** — السؤال عن **الالتفات/النظر للمنادي** عند **اسمه**، وليس تنفيذ **سلسلة أفعال** استقبالية.
- نشاط تآلف الحالي `name-call-tap` (C2) = proxy رقمي للنداء — **≠** C4.

### معايير قريبة (من المنهجية §22 C و§5.2)

| معيار | تمييز عن C4 (من المصادر) |
|--------|---------------------------|
| **C3** | خطوة **واحدة**؛ تنفيذ فعل واحد |
| **C5** | **تعبير** جمل وظيفية — **≠** استقبال وتنفيذ تسلسل |
| **C6** | **إشارة/لمس تواصلي** نحو هدف — **≠** تسلسل خطوتين من تعليمة مركّبة |
| **C15** | **تقليد** بعد نموذج — **≠** **compliance** بتعليمات مركّبة (§39 C15 vs C3/C4) |

**لا يُفترض:** أن أي «نشاط فيه خطوتان على الشاشة» = C4 دون مطابقة سلوك Canon (ترتيب + تنفيذ + تذكير/تجزئة كما في levels).

---

## 3. Candidate Skill

**كل ما يلي: TAALUF DESIGN HYPOTHESIS — غير مسجّل في JSON.**

### Skill 1 (أساسي)

| الحقل | القيمة المقترحة |
|--------|------------------|
| **id مقترح** | `skill-receptive-two-step-sequence` |
| **الاسم** | فهم وتنفيذ تعليمة من خطوتين بالترتيب |
| **Observable behavior (تشغيلي مؤقت)** | عند تقديم تعليمة مركّبة (مثلاً فعلان في جملة واحدة أو جدول خطوتين)، ينجز **الخطوة 1 ثم 2** **بالترتيب** ضمن نافذة مهمة محددة. |
| **ارتباط C4** | يطابق السؤال Canon: «خطوتين متتاليتين **بالترتيب الصحيح**». |
| **الفرق عن C3** | C3 = **هدف/فعل واحد** لكل تعليمة؛ C4 = **سلسلة** + **ترتيب** + **متابعة** بعد الخطوة الأولى (levels 2–3 Canon). |

### Skill 2 (تمهيدي — اختياري في التصميم)

| الحقل | القيمة المقترحة |
|--------|------------------|
| **id مقترح** | `skill-visual-two-step-schedule` |
| **الاسم** | متابعة جدول بصري قصير (خطوتان) قبل/مع التعليمة |
| **Observable behavior** | يتبع تمثيلاً بصرياً لخطوتين (1→2) ثم ينتقل للاستجابة — إطار **`recommendation`** Canon (جداول بصرية). |
| **ارتباط C4** | يدعم **تدرج** level 1 (تجزئة) و**سحب الدعم** — **لا** يُ equate وحده بإتقان C4 (§22 K). |
| **الفرق عن C3** | C3 skill الحالي `skill-receptive-one-step` = **لمسة/اختيار واحد** يطابق **تعليمة واحدة** (`listen-then-tap`). |

---

## 4. Candidate Media

**نوع نشاط مقترح — ليس قرارًا نهائيًا ولا تنفيذًا.**

### خيار A — `receptive_sequence` (امتداد منطقي لـ `receptive_choice`)

| عنصر | وصف مقترح |
|--------|-----------|
| **stimulus** | تعليمة مركّبة (صوت TTS +/− نص/جدول بصري خطوتين)؛ pool أفعال/أهداف (قد يُست reused من `actions` في catalog). |
| **instruction** | جملة **خطوتين** (مثال منهجية §22: «خذ … **ثم** ضع …») — **Canon لا يثبت أمثلة محددة في JSON**. |
| **child response** | **لمستان/اختياران متتاليان** على الشاشة **بالترتيب** (أول الهدف A، ثم B) — **≠** تنفيذ مادي تلقائيًا. |
| **scoring** | `step1Outcome`, `step2Outcome`, `sequenceOrder` (مقترح §22 J — **غير موجود** في `TrainingTrial` اليوم)؛ fallback مؤقت: `correct` = ترتيب كامل صحيح فقط. |
| **assistance** | رقمي: `TrainingPromptLevel` + جدول `COMM_CHOICE_ASSISTANCE_SCHEDULE` **إن** بقي نموذج choice؛ أو تسجيل مراقب (مثل tap-to-request observer) — **قرار مفتوح**. |

### خيار B — Hybrid (من §22 P)

| عنصر | وصف مقترح |
|--------|-----------|
| **stimulus** | تعليمة على الشاشة + جدول بصري (Skill 2). |
| **instruction** | نفس Canon — خطوتان. |
| **child response** | **تنفيذ جسدي متسلسل** في الغرفة (مثلاً أخذ → وضع) مع **تسجيل مراقب** لكل خطوة. |
| **scoring** | مراقب: نجاح/ترتيب/تذكير — **Criterion-specific** §22 J. |
| **assistance** | Canon level 1: **إعادة تعليم / تجزئة**؛ level 2: **تذكير** — **لا** تُ equate تلقائيًا بـ `promptLevel` الرقمي (§22 I). |

### خيار C — Preparatory فقط

- ترتيب صور/أيقونات بعد تعليمة — §22 H: **Preparatory**؛ §5.2: **≠** تنفيذ خطوتين ماديتين.

**لا يُختار هنا** بين A/B/C — **Activity Design** لاحقًا بعد §12.

---

## 5. C3 → C4 Boundary

| البعد | C3 | C4 |
|--------|----|----|
| **نوع التعليمات** | Canon: **لفظية بسيطة، خطوة واحدة** (تعال، اجلس، أعطني) | Canon: **مركّبة، خطوتان متتاليتان** (الاسم: خطوتان **فأكثر**) |
| **عدد الخطوات** | **1** (Canon + `autoGoal`: **3** تعليمات **منفصلة** كل منها خطوة واحدة) | **2+** في **تعليمة واحدة**؛ `autoGoal`: **2** مألوفتان |
| **الاستجابة (Canon)** | **تنفيذ** تعليمة لفظية → **فعل** | **تنفيذ الخطوتين بالترتيب**؛ level 2: **أولى فقط** / **خلط ترتيب** |
| **ما يقيس (Canon)** | فهم + تنفيذ **خطوة واحدة**؛ استقلالية دون تكرار/إشارة (0) | **تسلسل + ترتيب**؛ دون **تذكير** (0)؛ مع **إعادة/تجزئة** (1) |
| **ما لا يقيس** | تعليمات **مركّبة** — **C4** (§21 C) | خطوة **واحدة** فقط — **C3** (§22 C) |
| **تآلف C3 المنفّذ (`listen-then-tap`)** | `engineType`: `receptive_choice`؛ `mode`: `receptive_instruction`؛ **prompt واحد** = `target.labelAr` (فعل واحد من pool `actions`)؛ **محاولة = لمسة واحدة** صحيحة | **لا يوجد** نشاط C4؛ **لا** محاولتان مرتبطتان بتعليمة واحدة في engine الحالي |

---

## 6. Digital Fidelity Risk

### ما يقيسه نشاط «اختيار/لمس متسلسل على الشاشة» فعليًا

- تمييز **هدف A ثم B** بعد **محفّز لغوي/بصري** يذكر خطوتين.
- **دقة ترتيب** تفاعلات الشاشة (`correct` على مستوى trial واحد إذا عُرّف «كامل/جزئي»).
- **Core metrics** الموجودة: `responseTimeMs`, `promptLevel`, `independence` — على **مهمة رقمية**.

### ما يقيسه Canon C4

- **تنفيذ** خطوتين **بالترتيب** — في §22 و§5.2: **أخذ فعلي ثم وضع فعلي** = أقرب **Direct**؛ **اختيار صورتين بالترتيب** = **Preparatory** (§5.2 C4؛ §22 H).

### التصنيف

| مسار | تصنيف (من المنهجية) |
|------|------------------------|
| `receptive_choice` **خطوة واحدة** (C3 الحالي) | **Preparatory** بالنسبة لتنفيذ لفظي → فعل (§21 H) |
| **لمستان متتاليتان** على الشاشة | **Preparatory** أو **Digital Substitute** — **لا يثبت C4 وحده** (§22 K) |
| **تنفيذ جسدي متسلسل + مراقب** | **Direct (جزئي)** / **Hybrid** (§22 H, P) |

**الحسم بين Preparatory vs Direct للنسخة الرقمية:** **ADVISOR DECISION REQUIRED** (§22 N نقطة 1).

---

## 7. Assistance

**لا hierarchy جديدة** — استخدام البنية الحالية فقط.

### رقمي (موجود لـ `receptive_choice` / `listen-then-tap`)

- `TrainingPromptLevel`: `independent`, `visual_hint`, `reduced_choices`, `direct_visual_assistance`, `no_response` — عبر `resolveTrialPromptLevel` + `COMM_CHOICE_ASSISTANCE_SCHEDULE` (`communicationChoiceEngine.ts`).
- **`listen-then-tap`:** `prompting: true` — مساعدة **زمنية** على الشاشة، **≠** «تذكير» Canon C4 level 2.

### بشري / Canon (C4 levels 1–2)

- **إعادة التعليم / تجزئة** (level 1)، **تذكير** (level 2)، **جداول بصرية** (`recommendation`) — §22 I: **بروتوكول منفصل**؛ **لا تُربَط** تلقائيًا بـ PromptLevel الرقمي.

### `tap-to-request` (مرجع C1)

- **مراقب** يختار `PromptHierarchyLevel` → `TrainingPromptLevel` — نمط قابل للاقتباس في **Hybrid C4** فقط إذا اعُتمِد scientifically.

**C4 candidate:** تسجيل **independent** vs **prompt** — ممكن **تقنيًا** عبر الحقول الحالية؛ **معنى Canon** (تذكير vs تجزئة) — **ADVISOR DECISION REQUIRED**.

---

## 8. Measurement

### قابل للقياس رقميًا (Core — موجود في المنظومة)

| مقياس | ملاحظة C4 |
|--------|-----------|
| **correct** | على **trial** — يحتاج تعريف: «trial = سلسلة كاملة» vs «trial = خطوة» |
| **responseTimeMs** | زمن حتى إكمال **آخر** خطوة أو **كل** خطوة — **غير محدد** في engine |
| **promptLevel** | مساعدة **رقمية/مراقب** — **≠** تذكير Canon دون mapping |
| **sequence completion** | **غير موجود** كحقل — مقترح §22 J (`step1Outcome`, `step2Outcome`, `sequenceOrder`) |

### ما لا يمكن **إثباته** من الشاشة وحدها (§22 C, K, §5.2)

- تنفيذ **فعلين ماديين** بالترتيب في البيئة.
- **دون تذكير** بالمعنى Canon level 0.
- **بيئات مختلفة** / **تعميم**.
- إتقان **`autoGoal`** (80% / 3 أشهر / **مألوفة**) — **Advisor Decision Required**.

---

## 9. Mastery

**ممنوع threshold نهائي.** الأسئلة التالية فقط:

| موضوع | الحالة |
|--------|--------|
| عدد المحاولات | **Advisor Decision Required** |
| accuracy | **Advisor Decision Required** (Core vs «ترتيب صحيح») |
| independence | **Advisor Decision Required** (digital vs دون تذكير Canon) |
| consistency across sessions | **Advisor Decision Required** |
| generalization | **Advisor Decision Required** |

Canon **`autoGoal`:** خطوتان مألوفتان، 80%، 3 أشهر — **CANON**؛ **لا** يُ translate تلقائيًا إلى `deriveTrainingMasteryLevel` أو أي product rule.

---

## 10. Generalization

**مسار مفاهيمي فقط — لا تنفيذ.**

1. **Digital:** تسلسل على الشاشة (Preparatory/Substitute — إن اعُتمِد).
2. **Human-mediated:** تعليمة حية + تنفيذ جسدي متسلسل + مراقب (Hybrid/Direct).
3. **Natural context:** تعليمات يومية من شخص مختلف، بيئة مختلفة، **دون** جدول كامل (§22 L).

---

## 11. Governance

| العنصر | التصنيف |
|--------|---------|
| Canon C4 | **CANON** |
| Candidate Skill (§3) | **TAALUF DESIGN HYPOTHESIS** |
| Candidate Media (§4) | **TAALUF DESIGN HYPOTHESIS** |
| C3/C4 boundary | **ADVISOR DECISION REQUIRED** (ترجمة تشغيلية للفصل one-step vs two-step في UI/engine) |
| Digital fidelity (Direct vs Preparatory) | **ADVISOR DECISION REQUIRED** |
| Mastery | **ADVISOR DECISION REQUIRED** |
| Generalization | **ADVISOR DECISION REQUIRED** |
| §22 Subskills / Criterion-specific fields | **TAALUF DESIGN HYPOTHESIS** (منهجية PROPOSED) |
| `listen-then-tap` كأساس C4 | **NOT VALID** — م mapped إلى **C3** فقط (`criterionIds: ["C3"]`) |

---

## 12. قرار البناء

### **NEEDS SCIENTIFIC DECISION**

**الأسباب (من المصادر، دون حل):**

1. المنهجية §22 **Verdict:** **C4 — NEEDS SCIENTIFIC REVIEW** — و§22 N يفرض قرار **Criterion–Behavior Fidelity** (Direct/Hybrid vs Preparatory رقمي فقط).
2. Canon يفرق **تنفيذ متسلسل** عن **level 1–2** (تجزئة/تذكير) — **لا** بروتوكول تسجيل معتمد في Training Engine اليوم.
3. **`autoGoal`** (2 مألوفتان، 80%) vs الاسم «**فأكثر**» — **Advisor Decision Required** قبل تصميم المحتوى.
4. C3 المنفّذ (`listen-then-tap`) **Preparatory** لـ C3 — **لا يُ extended** إلى C4 دون قرار علمي صريح (§21 H، §5.2 C4).

**ليس READY FOR DESIGN** حتى يُحسم على الأقل: (أ) Direct/Hybrid vs رقمي تمهيدي فقط، (ب) تعريف trial/step ونجاح «بالترتيب»، (ج) equating المساعدة الرقمية vs تذكير/تجزئة Canon.

**NEEDS CANON CLARIFICATION** — **غير مطلوب** كحالة أولى: نص Canon **واضح** في السؤال والlevels؛ الغموض **تشغيلي/منهجي** (fidelity, mastery)، لا نقص في JSON.

---

*Pass 01 — لا كود، لا JSON، لا candidate في `getTrainingCandidatesForCriterion`.*
