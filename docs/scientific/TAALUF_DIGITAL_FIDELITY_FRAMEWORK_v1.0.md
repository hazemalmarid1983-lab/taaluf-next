# Taaluf — Digital Fidelity Framework v1.0

**حالة:** إطار حوكمة/تصميم تآلف — **PROVISIONAL**  
**الغرض:** توحيد تحليل **Criterion–Behavior Fidelity** قبل بناء أي Activity  
**ليس:** اعتمادًا علميًا نهائيًا، ولا بديلاً عن التقييم السريري، ولا آلية برمجية  

**مصادر:**  
`data/taalof_criteria_v3.json` · `docs/scientific/TAALOF_TRAINING_METHODOLOGY_v1.0.md` (§5.1، §5.2) ·  
`data/training/docs/C15-training-specification.md` · `data/training/docs/C15-alignment-governance.md` ·  
`data/training/docs/C4-training-candidate.md` · فصول التدريب الثلاثة · محركات/session flows المنفّذة  

---

## 0. علاقة المصطلحات (لا مصطلحات متنافسة)

| المصطلح في هذا الإطار | المصدر في المشروع |
|------------------------|-------------------|
| **Direct** | §5.2 — «تدريب/قياس **السلوك المستهدف مباشرة**»؛ أمثلة §5.2 تستخدم **Direct:** لسلوك واقعي/بشري |
| **Preparatory** | §5.2 — «تدريب **مهارة تمهيدية** مرتبطة — **لا تثبت** المعيار وحدها»؛ أمثلة C3، C11 (Follow Star)، C8… |
| **Hybrid** | §5.1 — **جمع** تدريب رقمي + بشري/واقعي؛ §5.2 C15: نموذج رقمي Preparatory + **تنفيذ جسدي مرصود** Direct |
| **Digital Substitute** | §5.2 — «استجابة رقمية بديلة» — **يُذكر عند الحاجة**؛ **ليس** طبقة رابعة في بوابة Pass 01 |

> §5.1 يذكر أيضًا **Digital-first** / **Human-mediated** كنموذج **تقديم** — يُكمّل (لا يستبدل) تصنيف fidelity §5.2.

---

## 1. طبقات Fidelity (A · B · C)

### A. Preparatory

| بُعد | الوصف |
|------|--------|
| **ما يفعله الطفل (typical)** | مهارة **جزئية** أو **بديلة رقمية** (تمييز، لمسة، تتبع، اختيار) **مرتبطة** بالمعيار دون أن تكون السلوك Canon كاملًا. |
| **ما تقيسه الشاشة** | Core Trial Metrics: `correct`, `responseTimeMs`, `promptLevel`, accuracy/independence — على **مهمة الشاشة**. |
| **ما لا تثبت الشاشة** | إتقان المعيار Canon؛ سلوك **واقعي** كامل (§5.2). |
| **مراقب** | **اختياري** — حسب النشاط (C1 tap-to-request observer؛ C15 **لا** يُصنَّف Preparatory وحده). |
| **ربط بالهدف (`TrackedGoal`)** | **ممكن** كمؤشر تدريب — **ADVISOR DECISION REQUIRED** إن اُ equate بـ criterion level. |
| **تعميم** | **لا** — §5.2 + وثائق C15/C4: تعميم **مرحلة لاحقة**؛ Preparatory **لا يكفي** وحده. |

### B. Direct

| بُعد | الوصف |
|------|--------|
| **ما يفعله الطفل** | السلوك الذي **يسأل عنه المعيار** (تنفيذ فعل، تقليد جسدي، إشارة مع نظر… — **في الواقع** أو بمحاكاة **معتمدة منهجيًا**). |
| **ما تقيسه الشاشة** | **قد لا تقيس شيئًا** إذا كان Direct **كله** خارج الشاشة — أو تُسجّل metadata جلسة فقط. |
| **ما لا تثبت الشاشة** | كل ما **خارج** تعريف السلوك المباشر المعتمد. |
| **مراقب** | **غالبًا نعم** عندما Direct = جسدي/اجتماعي (C15 observer flow؛ §22 C4). |
| **ربط بالهدف** | **ADVISOR DECISION REQUIRED** قبل equating بـ assessment. |
| **تعميم** | يتطلب **مسارًا منفصلًا** (بيئة/شخص) — **ADVISOR DECISION REQUIRED**. |

### C. Hybrid

| بُعد | الوصف |
|------|--------|
| **ما يفعله الطفل** | **جزء رقمي** (نموذج، تعليمات، جدول، مهمة شاشة) + **جزء واقعي/بشري** (تنفيذ، مراقبة، سياق). |
| **ما تقيسه الشاشة** | جزء الرقمي + **Core metrics** على ما يُعرّف كـ trial رقمي. |
| **ما لا تثبت الشاشة** | الجزء **Direct** من Canon **دون** مراقبة/تعريف معتمد (مثال C15: تنفيذ جسدي **لا** تُراه الكamera). |
| **مراقب** | **مطلوب** عندما Direct leg = مرصود (C15: **نعم** — `observerImitationObserverFlow`). |
| **ربط بالهدف** | مسموح **كمؤشر تدريب** مع disclaimer (C15 presentation) — **≠** mastery Canon. |
| **تعميم** | **ADVISOR DECISION REQUIRED** — Hybrid **لا يستبدل** generalization plan. |

**قاعدة:** لا تُسند طبقة إلى نشاط **إلا** بسند من §5.2 أو وثيقة معيار/فصل **صريحة**؛ وإلا **UNCLEAR**.

---

## 2. Fidelity Test (Design / Governance — ليس «معيارًا علميًا مثبتًا»)

يُطبَّق على **أي** criterion قبل Activity Design:

1. **ما السلوك المستهدف فعليًا؟** (Canon: question + levels — `taalof_criteria_v3.json`)
2. **هل يستطيع الطفل أداء السلوك نفسه داخل الجهاز؟** (فعليًا vs تمثيل/اختيار)
3. **هل استجابة الشاشة = السلوك أم اختيار/بديل عنه؟** (§5.2)
4. **هل يحتاج الأداء شخصًا/بيئة حقيقية؟** (§5.1 Human-mediated / Hybrid)
5. **هل يمكن للمراقب تسجيل الأداء؟** (prompt hierarchy موجود — `lib/promptHierarchy.ts`)
6. **هل يمكن قياس assistance؟** (Core: `TrainingPromptLevel`؛ Canon assistance **قد** ≠ prompt — C15/C4 docs)
7. **هل يمكن قياس generalization؟** (غالبًا **لا** داخل جلسة واحدة — **ADVISOR DECISION REQUIRED**)
8. **هل النتيجة بيان تدريب أم تقييم؟** (Training session **≠** Criterion level — C15 governance §19)
9. **هل هناك خطر equating digital response ↔ real-world behavior?** (§5.2 أمثلة)

**مخرجات إلزامية:** `Preliminary fidelity classification` + `Advisor Decision Required` إن لم يُحسم.

---

## 3. تطبيق على المعايير ذات تدريب منفّذ

| Criterion | Canon target behavior (ملخص) | النشاط الحالي | Digital response | Real-world behavior | Classification | السبب (مصدر) | أكبر risk | Advisor? |
|-----------|-------------------------------|---------------|------------------|---------------------|----------------|--------------|-----------|----------|
| **C1** | طلب **كلمة/رمز** بدل سحب/صراخ | `tap-to-request` (`expressive_choice`) | لمس بطاقة حاجة؛ مساعدة رقمية و/أو **مراقب** (`TapToRequestPlayArea`) | طلب **شفهي/رمز** مع شريك في موقف حاجة | **UNCLEAR** | §5.2 C1: اختيار صورة **≠** طلب وظيفي؛ المنهجية §C1 تقترح Hybrid — **لم يُعتمد** رسميًا للنشاط | equating لمسة = طلب Canon | **نعم** |
| **C2** | **التفات/نظر** للمنادي عند **اسمه** | `name-call-tap` | لمس وجه/شخصية بعد ndاء صوتي/بصري | التفات + نظر **للمنادي** في بيئات مختلفة | **PREPARATORY** | proxy رقمي — لا يلتفت/ينظر للراشد (JSON skill: «محاكاة رقمية») | equating tap = orienting | **نعم** |
| **C3** | **تنفيذ** تعليمة **لفظية خطوة واحدة** (تعال، اجلس…) | `listen-then-tap` | لمس صورة تطابق **فعلًا واحدًا** (`receptive_instruction`) | تنفيذ **حركة/فعل** في السياق | **PREPARATORY** | §5.2 C3 صريح؛ §21 H: اختيار صورة **≠** جلوس فعلي | equating receptive tap = compliance | **نعم** |
| **C6** | **إشارة/إيماء** + **نظر** بين شيء وراشد | `point-to-item` | لمس عنصر في **مشهد رقمي** | إشارة **إصبع** + تواصل بصري | **PREPARATORY** | §5.2 C6 صريح | لا نظر للراشد؛ لا إشارة جسدية | **نعم** |
| **C8** | اختيار **رمز/صورة** و**تناول** للراشد عند الحاجة | `symbol-board-request` | لمس رمز على لوحة | AAC/صورة **في موقف حقيقي** + شريك | **PREPARATORY** | §5.2 C8: Preparatory = تمييز/اختيار؛ Direct = موقف + تناول | equating screen AAC = field AAC | **نعم** |
| **C11** | **انتباه مشترك** — نظر لما **يشير** إليه الآخر + تناوب | `follow-star` (+ C25 يشارك نفس media) | تتبع/لمس **هدف على الشاشة** | شخص **يشير** → نظر + shared attention | **PREPARATORY** | §5.2 C11: Follow Star **≠** تغطية C11 كاملة | equating tracking = joint attention | **نعم** |
| **C15** | **تقليد** حركة/تعبير **بعد نموذج مباشر** | `observer-imitation` | illustration + TTS؛ **لا** scoring تلقائي للجسد | **تنفيذ جسدي** + مراقب | **HYBRID** | فصل JSON: Hybrid؛ §5.2 C15؛ `C15-training-specification` §2/§7 — **دون تعديل** تصنيف الوثائق | نجاح شاشة ≠ C15 level 0؛ disclaimer | **نعم** |
| **C25** | **بقاء** في مهمة موجهة **~5 دق** دون نهوض متكرر | 5 وسائط attention (`follow-star` … `wait-then-touch`) | محاولات **قصيرة** (8–10 trials) على شاشة | engagement في **مهمة واقعية** مدة Canon | **PREPARATORY** | §5.2 (C25 analog): بقاء أمام شاشة **≠** engagement مهمة فعلية | equating trial accuracy = 5 min sustained attention | **نعم** |

**ملاحظات تنفيذية (وصفية فقط):**

- `communicationChoiceEngine`: مساعدة **زمنية** على الشاشة (`COMM_CHOICE_ASSISTANCE_SCHEDULE`) — **≠** مساعدة Canon C3/C4 (تذكير/تجزئة) دون قرار.
- C15: `modelReplays` **≠** `promptLevel` — `C15-alignment-governance`.
- C11 vs C25: **نفس** `follow-star` candidate — fidelity **للمعيار** يختلف؛ لا يُ deduce من mediaId وحده.

---

## 4. C4 — مثال Fidelity (لا Activity)

**Canon:** خطوتان **متتاليتان** **بالترتيب** (`C4-training-candidate` §1).

### لماذا `listen-then-tap` **لا يثبت** C4؟

- م mapped إلى **C3** فقط (`criterionIds: ["C3"]`).
- **محاولة واحدة** = **لمسة واحدة** بعد prompt **فعل واحد** (`buildCommTrialSpec` — pool `actions`).
- Canon C4 = **سلسلة** + **ترتيب** + **متابعة** بعد الخطوة 1 — §22 C.

### ماذا **يمكن** أن يثبت (Preparatory — §22 H)؟

- **اختيار/لمس متسلسل** على الشاشة بعد تعليمة مركّبة — §5.2 C4: **≠** خطوتان **ماديتان**؛ §22 K: **≠** mastery C4.

### ما الذي يحتاج **تنفيذًا فعليًا** (Direct leg)?

- §22 H: «أخذ فعلي ثم وضع فعلي» — **تنفيذ جسدي متسلسل** (مراقَب).

### متى **Hybrid** ضروري (من §22 P — مقترح)؟

- عندما يُقبل **جدول بصري/تعليمة رقمية** + **قياس التنفيذ** خارج/مع الشاشة — **ADVISOR DECISION REQUIRED** قبل تصميم.

### قرارات د. سامر (§22 N — دون حل)

- Direct vs Preparatory للنسخة الرقمية.
- تعريف trial / `sequenceOrder` / step outcomes.
- equating `autoGoal` (2 مألوفتان) vs «فأكثر» في الاسم.

**Canon ≠ Training:** لا candidate C4 — **ADVISOR DECISION REQUIRED** (مسجل في `C4-training-candidate` §12).

---

## 5. تعارضات (لا حل)

| تعارض | التسجيل |
|--------|---------|
| Canon C3 = **تنفيذ لفظي** vs `listen-then-tap` = **receptive choice** | **ADVISOR DECISION REQUIRED** |
| Canon C15 level 0 vs `masteryLevel` product | **ADVISOR DECISION REQUIRED** (C15 governance) |
| Canon C25 **5 دقائق** vs جلسات **trials قصيرة** | **ADVISOR DECISION REQUIRED** |
| C1 Canon **كلمة/رمز** vs **tap** primarily | **ADVISOR DECISION REQUIRED** |

---

## 6. Governance

| Decision | Classification |
|----------|----------------|
| تعريف **Preparatory** (§5.2 صف 2 + أمثلة) | **Taaluf Governance** (هذا الإطار يعكس §5.2) |
| تعريف **Direct** (§5.2 صف 1 + أمثلة Direct:) | **Taaluf Governance** |
| تعريف **Hybrid** (§5.1 + §5.2 C15) | **Taaluf Governance** |
| اعتبار **Digital Choice** دليلًا على **Real Behavior** | **Advisor Decision Required** |
| **استخدام Observer** | **حسب طبيعة السلوك** (مطلوب C15 Hybrid leg؛ اختياري C1 tap observer؛ غالبًا لا C3 auto-prompt) |
| **Mastery** | **Advisor Decision Required** |
| **Generalization** | **Advisor Decision Required** |
| **Substitute** vs Preparatory | **Advisor Decision Required** عند الحدود (§5.2 C8) |

---

## Pre-Activity Fidelity Gate

**بوابة منهجية قبل التطوير — ليست آلية برمجية.**

```
Canon target (taalof_criteria_v3)
    ↓
observable behavior (Canon + § functional — بدون إعادة صياغة معيار)
    ↓
digital representation (ما يمكن/ما يُقترح على الشاشة)
    ↓
fidelity analysis (§5.2 + Fidelity Test §2)
    ↓
classification: PREPARATORY | DIRECT | HYBRID | UNCLEAR
    ↓
measurement model (Core Trial Metrics vs criterion-specific — §22 J style)
    ↓
assistance model (TrainingPromptLevel vs Canon assistance — لا دمج تلقائي)
    ↓
generalization requirement (مسار مفاهيمي — خارج الجلسة إن لزم)
    ↓
advisor decision if unresolved
    ↓
Activity Design (خارج نطاق هذا الإطار)
```

**Stop rules:**

- **UNCLEAR** أو **ADVISOR DECISION REQUIRED** على fidelity → **لا** يُ treat كـ «جاهز للإتقان» أو assessment.
- **Preparatory** → **لا** equating جلسة رقمية بـ Canon level 0 **دون** قرار (§5.2؛ C15 disclaimer).

---

## المراجع السريعة للمحتوى المنفّذ

| mediaId | engineType | session flow |
|---------|------------|--------------|
| `tap-to-request`, `symbol-board-request`, `listen-then-tap`, `point-to-item`, `name-call-tap` | `expressive_choice` / `receptive_choice` | `communicationChoiceSessionFlow` |
| `follow-star` | `visual_tracking` | `followStarSessionFlow` |
| `match-me` | `matching` | `matchMeSessionFlow` |
| `where-did-it-go` | `visual_memory` | `whereDidItGoSessionFlow` |
| `find-the-target` | `visual_search` | `findTheTargetSessionFlow` |
| `wait-then-touch` | `response_control` | `waitThenTouchSessionFlow` |
| `observer-imitation` | `observer_imitation` | `observerImitationSessionFlow` |

---

*v1.0 — Digital Fidelity Framework 01 — توثيق فقط.*
