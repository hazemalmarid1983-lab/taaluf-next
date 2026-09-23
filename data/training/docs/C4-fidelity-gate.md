# C4 — Pre-Activity Fidelity Gate (Pass 02)

**حالة:** إعادة تقييم عبر `TAALUF_DIGITAL_FIDELITY_FRAMEWORK_v1.0.md` — **توثيق فقط**  
**السابق:** [`C4-training-candidate.md`](./C4-training-candidate.md) (Pass 01)  
**لا** Activity · **لا** Engine · **لا** JSON · **لا** candidate

---

## Gate step 1 — Canon target

**المصدر:** `data/taalof_criteria_v3.json` (نقل المعنى دون إعادة صياغة).

| الحقل | النص |
|--------|------|
| **المعيار** | C4 — فهم التعليمات المركبة (خطوتان فأكثر) |
| **السؤال** | هل ينفذ الطفل تعليماً من **خطوتين متتاليتين** **بالترتيب الصحيح**؟ |
| **level 0** | ينفذ تعليماً من خطوتين **بالترتيب الصحيح** **دون تذكير**. |
| **level 1** | ينفذ الخطوتين بعد **إعادة التعليم** أو **تجزئته إلى خطوتين منفصلتين**. |
| **level 2** | ينفذ **الخطوة الأولى فقط** ويتوقف أو **يخلط الترتيب** حتى مع **التذكير**. |
| **level 3** | **لا يتابع** سلسلة من خطوتين ويترك المهمة فور سماع أكثر من فعل. |
| **recommendation** | تدريب متدرج على تسلسل التعليمات مع **جداول بصرية قصيرة** ثم **سحب الدعم**. |
| **autoGoal** | أن ينفذ الطفل تعليماً من **خطوتين مألوفتين** **بالترتيب الصحيح** بنسبة نجاح **80%** خلال **3 أشهر**. |

**Gate outcome (step 1):** **PASS** — Canon target واضح في JSON.

---

## Gate step 2 — Observable behavior

**ما يجب **ملاحظته** لادّعاء «شاهدنا السلوك المستهدف» (استنتاج تشغيلي من Canon + §22 — **ليس** ادعاءً أن اللمس = تنفيذ):**

| مكوّن | السلوك القابل للملاحظة (Canon-aligned) |
|--------|----------------------------------------|
| **فهم التعليمات** | يبقى في المهمة عند سماع **أكثر من فعل** في تعليمة واحدة (**≠** level 3: ترك فوري). |
| **الخطوة 1** | ينفّذ **الفعل/الهدف الأول** (level 2: قد **يتوقف** بعدها). |
| **الخطوة 2** | ينفّذ **الفعل/الهدف الثاني** بعد الأول (level 2: **خلط ترتيب** أو **أولى فقط**). |
| **الترتيب الصحيح** | ترتيب 1→2 **كما في التعليمة** (level 0: **دون تذكير**). |
| **تذكير** | level 1–2: **تذكير**؛ level 0: **دون تذكير**. |
| **تجزئة / إعادة تعليم** | level 1: بعد **إعادة التعليم** أو **تجزئة** إلى خطوتين **منفصلتين**. |

**فصل صريح:**

- **لمس/اختيار على الشاشة** = **استجابة رقمية** — **لا يُ equate تلقائيًا** بتنفيذ واقعي (§5.2 C4؛ `C4-training-candidate` §6).
- **تنفيذ واقعي** = حركات/أفعال **جسدية** في البيئة (§22 H Direct مثال).

**Gate outcome (step 2):** **PASS** — observable behavior **مُعرَّف**؛ **ADVISOR DECISION REQUIRED** لترجمة كل مكوّن إلى **trial fields** (step 5).

---

## Gate step 3 — Digital representation

### A. Preparatory — ترتيب صور/اختيارات على الشاشة

| بُعد | التحليل |
|------|---------|
| **يقيس** | تمييز A ثم B **بالترتيب** بعد محفّز لغوي/بصري؛ Core metrics على **تفاعلات الشاشة**. |
| **لا يثبت** | تنفيذ **خطوتين ماديتين** بالترتيب؛ level 0 «دون تذكير» **Canon**؛ إتقان C4 (§22 K). |
| **تدريب؟** | **نعم** كـ **Preparatory** (§22 H؛ §5.2 C4) — **إن** وُسم و**لا** يُ equate بـ C4 mastery. |
| **بيان أداء؟** | **مؤشر تدريب رقمي** — **≠** حالة تقييم C4 (**ADVISOR DECISION REQUIRED**). |
| **equating risk** | **عالٍ:** «لمستان صحيحتان» = «نفّذ خذ ثم ضع». |

### B. Direct — تنفيذ فعلي + مراقب

| بُعد | التحليل |
|------|---------|
| **يقيس** | **step1/step2** مرصودان؛ ترتيب؛ تذكير/تجزئة **بشري** (Canon 1–2). |
| **لا يثبت** | ما **لا يراه** المراقب؛ تعميم بيئات (**§22 L**). |
| **تدريب؟** | **نعم** — أقرب **Direct** leg (§22 H). |
| **بيان أداء؟** | **أقرب** لـ Canon — **ADVISOR DECISION REQUIRED** قبل ربط assessment. |
| **equating risk** | **متوسط:** variance المراقب؛ تعريف «مألوف» (`autoGoal`). |

### C. Hybrid — شاشة تنظم + تنفيذ فعلي + مراقب

| بُعد | التحليل |
|------|---------|
| **يقيس** | جدول/تعليمة رقمية (`recommendation`) + **Direct leg** مرصود. |
| **لا يثبت** | الجزء الرقمي وحده؛ C4 دون **سحب** الجدول (§22 G). |
| **تدريب؟** | **نعم** — §22 P **Hybrid** (PROPOSED). |
| **بيان أداء؟** | **Hybrid label** — Direct leg فقط **مرشح** لادّعاء أقوى. |
| **equating risk** | **عالٍ** إن اُستخدمت metrics الشاشة لـ mastery دون Direct leg. |

**Gate outcome (step 3):** **PASS (analysis complete)** — **لا** اختيار نموذج نهائي → **ADVISOR DECISION REQUIRED** (Blocking #1).

---

## Gate step 4 — C3 boundary (implementation)

**C3 Canon:** تعليمة **لفظية خطوة واحدة** — تنفيذ (تعال، اجلس، أعطني).

**C3 منفّذ (`listen-then-tap`):**

- `engineType`: `receptive_choice`
- `mode`: `receptive_instruction` — **prompt = فعل واحد** (`target.labelAr`)
- **trial واحد** → **استجابة واحدة** (`buildCommTrialSpec` — لمسة/اختيار واحد)
- `criterionIds`: **["C3"]** فقط

**C4 Canon:** **تعليمة واحدة** تحتوي **خطوتين متتاليتين** + **ترتيب**.

| | **C3** | **C4** |
|---|--------|--------|
| تعليمات | **واحدة** / **فعل واحد** | **مركّبة** / **فعلان+** **بترتيب** |
| استجابة | **one-shot** | **سلسلة** (1 ثم 2) |
| failure mode | عدم فهم **خطوة واحدة** | **أولى فقط** / **خلط ترتيب** / **ترك** (levels 2–3) |

**لماذا لا «لمستين» على `listen-then-tap`؟**

1. **Canon:** C4 ≠ C3 — §21 C يستبعد المركّب من C3.
2. **Engine:** لا `step2`، لا `sequenceOrder`، لا تعليمة **مركّبة** في prompt.
3. **Fidelity:** لمسة ثانية **Preparatory** فقط — **≠** Direct (§5.2 C4) **دون** قرار علمي.
4. **Governance:** توسيع C3 media يخلط **criterion fidelity** (Framework §3 C11/C25 lesson).

**Gate outcome (step 4):** **PASS** — boundary **صريح**؛ **لا** extend `listen-then-tap`.

---

## Gate step 5 — Measurement model (تصميم فقط)

| عنصر | وصف مقترح | التصنيف |
|--------|-----------|---------|
| **trial** | وحدة = **محاولة واحدة** على تعليمة **مركّبة** (2 خطوات) | **ADVISOR DECISION REQUIRED** (trial = سلسلة كاملة vs خطوة = trial؟) |
| **step1Outcome** | نُفّذت الخطوة 1؟ (yes/no/partial) | **PROVISIONAL** (§22 J — **غير** في `TrainingTrial`) |
| **step2Outcome** | نُفّذت الخطوة 2؟ | **PROVISIONAL** |
| **sequenceOrder** | correct / reversed / partial / none | **PROVISIONAL** |
| **prompt / reteach / segmentation** | Canon level 1 (إعادة/تجزئة)؛ level 2 (تذكير) | **ADVISOR DECISION REQUIRED** — **≠** `TrainingPromptLevel` افتراضيًا |
| **correct (sequence)** | تسلسل كامل صحيح | **IMPLEMENTABLE DESIGN** *إذا* عُرّف trial — على **Core** `correct` |
| **responseTimeMs** | زمن حتى إكمال **السلسلة** أو per-step | **ADVISOR DECISION REQUIRED** |
| **Core metrics** | accuracy, independence, promptBreakdown | **IMPLEMENTABLE DESIGN** (موجود) — **معنى** independence لـ C4 **ADVISOR** |

**Gate outcome (step 5):** **CONDITIONAL** — Core **قابل**؛ criterion-specific **PROVISIONAL/ADVISOR** → Blocking #2.

---

## Gate step 6 — Assistance semantics

| مفهوم | Canon C4 | `listen-then-tap` / `receptive_choice` |
|--------|----------|------------------------------------------|
| **تذكير** | level 2؛ level 0 = **دون تذكير** | **لا** حقل «reminder» — **لا** mapping |
| **إعادة تعليم / تجزئة** | level 1 | **لا** بروتوكول segmentation في engine |
| **TrainingPromptLevel** | **غير معرّف** في Canon | `visual_hint`, `reduced_choices`, `direct_visual_assistance`, `no_response` — **زمني** على الشاشة (`COMM_CHOICE_ASSISTANCE_SCHEDULE`) |
| **مراقب** | ضمني في Direct/Hybrid | C3: **auto** prompting؛ C1 tap: **observer** optional — **≠** C4 Canon assistance |

**Mismatch:**

- Canon **تذكير/تجزئة** = **بروتوكول بشري/تعليمي** (§22 I: **لا تُربَط** بـ Prompting الرقمي).
- `TrainingPromptLevel` الحالي = **مساعدة رقمية** أو **مراقب** (C15/tap) — **لا** يميّز reteach vs reminder vs visual schedule fade.

**Gate outcome (step 6):** **FAIL (unresolved)** — Blocking #3.

---

## Gate step 7 — Fidelity decision

**القرار الواحد:**

## **NEEDS SCIENTIFIC DECISION**

**البوابة:** classification + measurement + assistance **غير محسومة** → **Stop rule** (Framework — Pre-Activity Fidelity Gate).

### القرارات التي **تمنع** Activity Design (قليلة، محددة)

1. **Criterion–Behavior Fidelity (§22 N · §5.2 C4):** هل مسار C4 المعتمد = **(أ)** Preparatory رقمي فقط، **(ب)** Hybrid (شاشة + تنفيذ مرصود)، **(ج)** Direct بشري فقط — وأي leg **يُسمح** أن يغذّي `TrackedGoal` / التقارير؟

2. **تعريف المحاولة والنجاح:** trial = **سلسلة كاملة**؟ ما الذي يعد «**بالترتيب الصحيح**» operacionalized — وهل **step1/step2/sequenceOrder** **إلزامية** أم Core `correct` فقط؟

3. **Assistance:** كيف يُسجَّل **تذكير** و**تجزئة/إعادة تعليم** Canon **دون** equatingها بـ `TrainingPromptLevel` الزمني للـ receptive_choice؟

**NOT:** NEEDS CANON CLARIFICATION — نص Canon **كافٍ**؛ الغموض **تشغيلي/منهجي**.

**NOT:** READY FOR ACTIVITY DESIGN.

---

## Gate step 8 — Proposed Activity Design

**القرار ≠ READY** → **لا** مواصفة تنفيذية.

### بديلان للمستشار (اختيار — لا تنفيذ)

| | **بديل 1 — Hybrid (§22 P)** | **بديل 2 — Preparatory رقمي (§22 H)** |
|---|---------------------------|--------------------------------------|
| **activity type** | تعليمة مركّبة + **جدول بصري** قصير + **تنفيذ جسدي** متسلسل | تعليمة مركّبة + **لمستان/ترتيب** على الشاشة |
| **trial structure** | **ADVISOR:** trial = سلسلة كاملة | trial = ترتيب رقمي كامل |
| **child action** | فعل 1 → فعل 2 **في الغرفة** | A ثم B **على الشاشة** |
| **observer** | **تسجيل** steps + reminder/segmentation | optional؛ غالبًا auto-prompt **≠** Canon |
| **data captured** | step outcomes + sequence + prompt **بشري** | Core metrics + sequenceOrder **PROVISIONAL** |
| **generalization** | **ADVISOR** — بيئة/شخص | **لا** يُclaim C4 mastery |

---

## Gate summary (Framework chain)

| خطوة البوابة | النتيجة |
|--------------|---------|
| Canon target | **PASS** |
| Observable behavior | **PASS** (مع ADVISOR على fields) |
| Digital representation | **PASS** analysis — **no model selected** |
| Fidelity analysis (C3 boundary) | **PASS** |
| Classification | **UNCLEAR** بين Preparatory-only vs Hybrid-Direct leg |
| Measurement model | **PARTIAL** (Core yes؛ criterion-specific ADVISOR) |
| Assistance model | **UNRESOLVED** |
| Generalization | **ADVISOR** (لم يُعرَض — **Stop**) |
| Advisor decision | **REQUIRED** (3 blockers أعلاه) |
| → Activity Design | **NO** |

---

## مراجع

- [`C4-training-candidate.md`](./C4-training-candidate.md) — Pass 01  
- [`docs/scientific/TAALUF_DIGITAL_FIDELITY_FRAMEWORK_v1.0.md`](../../../docs/scientific/TAALUF_DIGITAL_FIDELITY_FRAMEWORK_v1.0.md)  
- `docs/scientific/TAALOF_TRAINING_METHODOLOGY_v1.0.md` §22  
- `communication-language.json` — `listen-then-tap` (C3)

*C4 Pass 02 — Fidelity Gate Reassessment — توثيق فقط.*
