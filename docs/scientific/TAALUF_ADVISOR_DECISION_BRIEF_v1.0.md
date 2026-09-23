# TAALUF — Advisor Decision Brief v1.0

**للعرض على المستشار العلمي — توثيق فقط**  
**مصادر:** Advisor Decision Packet v1.0 · Development Unblock Map v1.0 · Cross-Criterion Matrix · Digital Fidelity Framework · C4/C15 docs · Training Methodology v1.0  
**مبدأ:** **IMPLEMENTED ≠ SCIENTIFICALLY VALIDATED** — **لا** يُفترض في هذه الورقة أن المستشار حسم أي بند.

---

## 1. لماذا هذه الوثيقة؟

تآلف لديه طبقة تدريب منفّذة (11 نشاطًا، محرك جلسات، خطط)، لكن **معنى** القياس الرقمي وربطه بمعايير Canon 4.0 ما زال يحتاج حوكمة علمية. المطلوب من المستشار **ليس** مراجعة الكود، بل **حسم نقاط منهجية محددة** مسجّلة مسبقًا في وثائق Taaluf — قبل توسيع ادعاءات fidelity أو فتح معايير جديدة (مثل C4).

---

## 2. ما هو محسوم حاليًا؟

*(حسب المصادر — لا يعني اعتمادًا علميًا نهائيًا على كل metric.)*

| البند | كما هو موثّق |
|--------|----------------|
| **Canon 4.0** | **40** معيارًا في `data/taalof_criteria_v3.json` — مصدر Canon للتدريب/التقييم في المشروع. |
| **Training Engine** | مسار جلسات/محاولات/`TrainingTrial` منفّذ — **LOCKED** للصيانة ضمن الـ11 media. |
| **Training activities** | **11** media في 3 فصول (comm، attention، C15 observer-imitation). |
| **C15** | **IMPLEMENTED + DOCUMENTED + GOVERNANCE AUDITED** — نطاق مقفل؛ Hybrid في JSON/الوثائق؛ **لا Pass تصميم جديد** في Unblock Map. |
| **C4** | **Candidate + Fidelity Gate** (Pass 01–02) — **لا** Activity · **لا** JSON · **لا** engine · **لا** candidate في `trainingCandidates`. |
| **Digital Fidelity Framework v1.0** | إطار Preparatory / Direct / Hybrid + Fidelity Test + Pre-Activity Gate — **PROVISIONAL** حوكمة. |
| **Training ↔ Assessment** | مسار التدريب **لا** يكتب سجل تقييم (Tanawum levels 0–3) — Matrix / C15 alignment §19. |
| **التشخيص الطبي** | التدريب **ليس** تشخيصًا — تعليقات `sessionPersistence` وC15 disclaimer وFramework. |
| **منتج IMPLEMENTED (صحة validity تحت D03/D11)** | **L01** accuracy · **L02** `TrainingPromptLevel` · **L03** resolver C11/C25 · **L04** C15 `skillIds` S1–S3 — Matrix. |
| **حد C3/C4** | `listen-then-tap` = **C3** receptive one-step — **لا** يُمدّد لسلسلة C4 — C4 gate §4. |
| **بوابة قبل Activity Design** | Pre-Activity Fidelity Gate **موثّقة** (**D18** — عملية حوكمة). |

---

## 3. ما الذي يمكن أن يستمر دون قرار المستشار؟

*(Development Unblock Map · A-Maintenance Audit — **دون** تغيير semantics علمية.)*

- صيانة **11** Activity (engines/flows/UI/routes).
- **Plan Builder** لمعايير لها candidates (C1–C3, C6, C8, C11, C15, C25).
- **Session persistence** · **Progress** storage · عرض نتائج **تقني** مع disclaimers الموجودة (C15).
- **Training Bridge** (Home Classroom → تدريب متخصص) مع plan guard / mismatch.
- **Navigation / active child** · **tests** على سلوك **LOCKED**.
- **C15** ضمن S1–S3 و`c15SkillMovementMap` وobserver flow — **بدون** S4/S5 executable.
- إصلاحات تقنية **لا** تغيّر: equating digital↔real، mastery Canon، generalization، assessment bridge، Canon assistance mapping، +1/+2/+5 policy، trial contract جديد.

---

## 4. القرارات المطلوبة من المستشار

*ترتيب **dependency** (Packet §5) — **لا** ranking.*

| ID | القرار | السؤال الذي يحتاج إجابة | لماذا يهم؟ | ما الذي سيفتحه؟ (حسب الوثائق) |
|----|--------|-------------------------|------------|-------------------------------|
| **D01** | Prep / Direct / Hybrid | متى يُوسَم نشاط/جلسة بكل طبقة؟ | comm/attention غير موسومة؛ C15 Hybrid؛ C4 path | **D02**, **D16**, **C04a**, **C15a**, labeling فصول |
| **D03** | Digital response = real behavior? | هل `correct`/نجاح جلسة = سلوك Canon دون Direct/Hybrid leg؟ | §5.2؛ كل trained C* | **D04–D07**, **D09**, **C01–C11**, **C25**, **C04a**, validity **L01** |
| **D02** | Substitute vs Preparatory | حد §5.2 صف 3 | C1,C6,C8 | **C06**, **C08**, labeling comm |
| **D11** | Assistance taxonomy | تذكير/تجزئة/reteach vs `TrainingPromptLevel` vs schedule رقمي | C4 gate §6؛ C15 replay≠prompt | **C04a/b**, **D10**, **D12**, **D19**, validity **L02** |
| **D04** | Training ↔ Assessment | منع أو السماح بجسر training → assessment 0–3 | C15 alignment §19 | **D05**, **D09**, reporting مستقبلي |
| **D09** | Mastery ↔ criterion | هل `mastered` يُمنع من equating Cx؟ | C15 §39 K؛ C4 §22 K | **D14**, **D08** policy, reporting |
| **D08** | masteryLevel thresholds | هل 80/70/3 product-only؟ | PROVISIONAL في docs/code cite | **TrainingProgress** semantics |
| **D06** | Preparatory ↔ TrackedGoal | هل Preparatory يحدّث `TrackedGoal.current`؟ | Canon لا increments | **D07** |
| **D07** | +1/+2/+5 | هل rule الاستقلالية معتمد منهجيًا؟ | C15 governance §16 | Goal progress UI sign-off |
| **D10** | Independence metric | `% independent` = Canon level 0؟ | C3,C4,C15 | **C03**, **C04b** interpretation |
| **D13** | Global trial definition | trial = فعل واحد vs حلقة متعددة الخطوات؟ | C4 blocker #2؛ C25 | **C04b**, **C25** |
| **D12** | responseTimeMs | vs «مباشرة» Canon / `latencyAfterModelMs` | C15 spec §8 | ادعاءات immediacy |
| **D05** | Training goal ↔ autoGoal | ترجمة plan دون ادعاء Canon | goalLinks | **C04c**, **C15b** |
| **D16** | Observer / Hybrid leg | متى observer + leg واقعي **إلزامي**؟ | C15 required؛ C1 optional؛ C4 Hybrid | **C04a**, **C15a**, C1 policy |
| **D14** | Generalization | minimum evidence قبل «تقدم toward criterion» | NOT IMPLEMENTED | مسارات تعميم؛ **D15** |
| **D15** | Maintenance | متى مسار maintenance مطلوب؟ | NOT YET RELEVANT | برامج post-mastery |
| **D17** | difficulty 1–3 vs levels 0–3 | منع الخلط في UI/reports | C15 governance §8 | labeling UX |
| **D19** | modelReplays / reteach | vs Canon level 1 / S4 | C15 governance | **C15c**؛ C4 reteach |
| **D18** | Fidelity Gate process | تأكيد إلزام البوابة قبل Activity Design | Framework؛ C4 blocked | معايير **جديدة** — C4 re-run بعد subset علمي |
| **C04a** | C4 fidelity path | Preparatory sequence vs Hybrid/Direct | Gate blockers | **Activity Design** C4 |
| **C04b** | C4 trial + sequence fields | trial model؛ step1/step2/sequenceOrder | Gate blocker #2 | C4 spec/impl مستقبلي |
| **C04c** | C4 autoGoal scope | 2 steps vs «فأكثر» | Canon text | أهداف C4 |
| **C15a** | C15 model Direct? | illustration = Direct «نموذج مباشر»? | governance Q1 | تصنيف C15 model |
| **C15b** | C15 scope | S1–S3 / 6 movements vs level 0 / autoGoal | governance Q2 | Plan Builder علمي C15 |
| **C15c** | S4/S5 protocol | متى executable | metadata only now | S4/S5 training path |
| **C01** | C1 proxy | tap vs كلمة/رمز وظيفي | C1 Canon | C1 fidelity claims |
| **C02** | C2 proxy | tap vs التفات+نظر | C2 | C2 claims |
| **C03** | C3 proxy | receptive vs تنفيذ لفظي | C3 | C3 claims |
| **C06** | C6 proxy | tap vs إشارة+نظر | C6 | C6 claims |
| **C08** | C8 proxy | screen AAC vs تناول | C8 | C8 claims |
| **C11** | C11 proxy | tracking vs joint attention | C11 | C11 claims |
| **C25** | C25 duration | 5 د vs trials قصيرة | C25 autoGoal | C25 metrics alignment |

---

## 5. القرار المطلوب بصيغة سهلة للمستشار

*(خيارات **من المصادر فقط** — بدون recommendation.)*

### D01 — Preparatory / Direct / Hybrid

**السؤال:** ما التعريف التشغيلي المعتمد ومتى يُوسَم نشاط/جلسة بكل من Preparatory و Direct و Hybrid?

**السياق المختصر:** §5.1–5.2 في Methodology؛ Framework يعكس التعريفات؛ C15 **Hybrid** في JSON؛ فصل comm/attention **بدون** labeling رسمي في JSON. C04a وC15a وD16 تتوقف على التصنيف.

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** §5.2 — ثلاث مستويات fidelity (Preparatory / Direct / Hybrid) كما في Framework §0–1.
- **الخيار B:** §5.1 — نماذج تقديم (Digital-first / Human-mediated) **تكمّل** §5.2 ولا تستبدله — Framework §0.
- **الخيار C:** C15 chapter وJSON «Hybrid» كمرجع تطبيقي لـ C15؛ §22 P C4 **Hybrid مقترح** — C4 candidate ( **ADVISOR** قبل تصميم).

**أثر الاختيار:** C1–C11,C15,C25,C4 labeling؛ Plan Builder؛ C04a؛ C15a؛ D02؛ D16.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### D03 — Digital response = real behavior?

**السؤال:** هل يُسمح أن `correct` أو نجاح جلسة يُفسَّر كسلوك Canon **دون** Direct/Hybrid leg معتمد?

**السياق المختصر:** §5.2 أمثلة متعددة؛ `correct` على لمسة/اختيار؛ C15 `correct` بعد تنفيذ جسدي **غير مرئي للجهاز**. Matrix: **ADVISOR DECISION REQUIRED** — GLOBAL.

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** Preparatory فقط + disclaimer إلزامي — Framework stop rule (Packet D03).
- **الخيار B:** Hybrid/Direct leg مطلوب لادعاءات أقوى — §22 C4، C15 spec (Packet D03).

**أثر الاختيار:** D04–D07، D09؛ C01–C11، C25، C04a؛ L01 validity؛ goal/mastery chain.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### D02 — Digital Substitute vs Preparatory

**السؤال:** أين حد **Digital Substitute** (§5.2 صف 3) مقابل Preparatory?

**السياق المختصر:** **لا** labeling في engine/JSON؛ §5.2 C8/C6. **يعتمد على D01.**

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** §5.2 — «استجابة رقمية بديلة» (Substitute).
- **الخيار B:** §5.2 — «مهارة تمهيدية» (Preparatory).

**أثر الاختيار:** C1,C6,C8؛ C06، C08.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### D11 — Assistance taxonomy

**السؤال:** كيف يُسجَّل تذكير / تجزئة / إعادة تعليم Canon مقابل `TrainingPromptLevel` والجدول الرقمي?

**السياق المختصر:** C4 gate §6؛ C15 `modelReplays` **≠** `promptLevel` (locked impl). **لا** field `reminder` في المنتج — Matrix.

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** حقول منفصلة — §22 J **PROPOSED** (Packet D11).
- **الخيار B:** **منع** mapping بين promptLevel وCanon assistance (Packet D11).
- **الخيار C:** Canon assistance **observer-only** (Packet D11).

**أثر الاختيار:** C3 auto-prompt؛ C04a/b؛ C15، C25؛ D10، D12، D19؛ L02 validity.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### D04 — Training ↔ Assessment

**السؤال:** هل يُمنع منهجيًا أي مسار من training → assessment record (levels 0–3)?

**السياق المختصر:** Canon levels للتقييم؛ C15 alignment §19؛ التنفيذ الحالي: **no write**. **يعتمد على D03.**

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** فصل تام — current impl (Packet D04).
- **الخيار B:** جسور محددة — **غير منفذة**، ADVISOR only (Packet D04).

**أثر الاختيار:** D05، D09؛ Tanawum/reporting مستقبلي؛ C15 governance claims.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### D09 — Mastery ↔ criterion

**السؤال:** هل يُمنع لغويًا/منهجيًا أن `TrainingProgress.mastered` يُ equate بإتقان معيار Canon?

**السياق المختصر:** C15 §39 K؛ C4 §22 K؛ disclaimers C15؛ حقل `masteryLevel` persists. **يعتمد على D04، D03.**

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** إعادة تسمية tiers (Packet D09).
- **الخيار B:** disclaimer إلزامي (Packet D09).
- **الخيار C:** decouple من criterion ids (Packet D09).

**أثر الاختيار:** D14 claims؛ reporting؛ D08 policy؛ كل persisted sessions.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### D08 — masteryLevel thresholds

**السؤال:** هل عتبات 80/70/3 sessions تبقى **product-only**?

**السياق المختصر:** PROVISIONAL — comment in docs cited from code. **يعتمد على D09.**

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** PROVISIONAL forever (Packet D08).
- **الخيار B:** advisor-defined bands (Packet D08).
- **الخيار C:** remove `mastered` label (Packet D08).

**أثر الاختيار:** TrainingProgress UI/storage.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### D06 — Preparatory ↔ TrackedGoal

**السؤال:** هل جلسة Preparatory تُحدّث `TrackedGoal.current`?

**السياق المختصر:** Canon لا يذكر goal increments. **يعتمد على D03، D01.**

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** allow with tag (Packet D06).
- **الخيار B:** deny for Preparatory-only (Packet D06).
- **الخيار C:** allow only if Hybrid Direct leg documented — Framework stop rule (Packet D06).

**أثر الاختيار:** D07؛ all goal-linked sessions.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### D07 — +1/+2/+5

**السؤال:** هل increments من `% independence` (70→5, 40→2, else→1) **معتمدة** methodologically?

**السياق المختصر:** PROVISIONAL product؛ C15 governance §16. **يعتمد على D06، D03.**

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** retain PROVISIONAL (Packet D07).
- **الخيار B:** replace with advisor rule (Packet D07).
- **الخيار C:** disable until D03 resolved (Packet D07).

**أثر الاختيار:** Goals UX؛ goal progress sign-off.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### D10 — Independence metric

**السؤال:** هل `% independent` (= `% promptLevel===independent`) = Canon «دون مساعدة/تذكير/إشارة»?

**السياق المختصر:** C3/C4 level 0؛ C4 gate §6. **يعتمد على D11.**

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** status quo — `% promptLevel===independent` only (Packet D10).
- **الخيار B:** expanded definition — ADVISOR (Packet D10).

**أثر الاختيار:** D07، D08، D09 inputs؛ C03، C04b.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### D13 — Global trial definition

**السؤال:** Trial = one user action vs multi-step episode (sequence)?

**السياق المختصر:** `trialCount` في كل media؛ C4 gate blocker #2. **مستقل**؛ C04b يعتمد عليه.

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** status quo comm/C15 — one interaction/cycle (Packet D13).
- **الخيار B:** sequence-as-one-trial — C4 docs (Packet D13).

**أثر الاختيار:** C04b؛ C25؛ contract `TrainingTrial` مستقبلي.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### D12 — responseTimeMs

**السؤال:** ما تعريف `responseTimeMs` المعتمد vs «مباشرة» Canon و`latencyAfterModelMs` (C15)?

**السياق المختصر:** C15 spec §8؛ §39 I. **يعتمد على D11.**

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** UX-only — current docs (Packet D12).
- **الخيار B:** add model-offset metric — §22 J PROPOSED، **not impl** (Packet D12).

**أثر الاختيار:** C3,C4,C15 claims on immediacy.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### D05 — Training goal ↔ autoGoal

**السؤال:** كيف تُترجم `autoGoal` إلى أهداف/plan **دون** ادعاء تحقيق Canon?

**السياق المختصر:** C3/C4/C15/C25 نصوص؛ `goalLinks` لا تحقق حرفيًا. **يعتمد على D04، D03.**

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** parallel labels (training vs Canon goal) — **مقترح docs only** (Packet D05).

**أثر الاختيار:** Plan Builder؛ IEP؛ C04c؛ C15b.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### D16 — Observer / Hybrid leg requirement

**السؤال:** متى **إلزامي** observer + physical/social leg vs digital-only مسموح?

**السياق المختصر:** C15 observer **required**؛ C1 observer **optional**؛ C4 candidate Hybrid. **يعتمد على D01، D03.**

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** §5.2 Direct/Hybrid examples (Packet D16).
- **الخيار B:** C15 governance Q1 (Packet D16).

**أثر الاختيار:** C1,C15,C04a؛ C15a.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### D14 — Generalization

**السؤال:** ما minimum evidence قبل ادعاء «progress toward criterion» / phase تعميم?

**السياق المختصر:** §22 L؛ C15 spec §11 — **NOT IMPLEMENTED**. **يعتمد على D09، D04.**

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** methodology §L **PROPOSED** paths only (Packet D14).

**أثر الاختيار:** C4,C15 future pathways؛ D15.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### D15 — Maintenance

**السؤال:** متى يُعرّف مسار maintenance/retention مطلوبًا?

**السياق المختصر:** §22 M C4؛ §39 M C15 — **NOT YET RELEVANT**. **يعتمد على D14.**

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** §22 M, §39 M **PROPOSED** (Packet D15).

**أثر الاختيار:** Post-mastery programs (مستقبلي).

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### D17 — difficulty vs assessment levels

**السؤال:** كيف نمنع equating product difficulty 1–3 مع severity assessment 0–3 في UI/reports?

**السياق المختصر:** C15 governance §8.

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** rename product axis (Packet D17).
- **الخيار B:** separate labels — docs (Packet D17).

**أثر الاختيار:** C15, comm, attention UX.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### D19 — modelReplays / reteach

**السؤال:** ما معنى `modelReplays` vs Canon reteach / S4 / level 1 (C15/C4)?

**السياق المختصر:** C15 governance؛ replay **≠** promptLevel locked. **يعتمد على D11.**

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** count only — current (Packet D19).
- **الخيار B:** map to assistance — **forbidden without D11** (Packet D19).
- **الخيار C:** S4 protocol future (Packet D19).

**أثر الاختيار:** C15c؛ C4 reteach protocol.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### D18 — Pre-Activity Fidelity Gate (process)

**السؤال:** (GOVERNANCE) تأكيد أن البوابة **إلزامية** قبل Activity Design — **موثّقة**؛ هل يُطلب تأكيد المستشار أم الاكتفاء بالعملية الحالية?

**السياق المختصر:** Framework gate؛ C4 **NEEDS SCIENTIFIC DECISION**؛ C04a يتوقف على subset **D01,D03,D11,D13** علميًا.

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** keep gate — current docs (Packet D18).

**أثر الاختيار:** معايير جديدة؛ re-run C4 gate بعد قرارات علمية.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### C04a — C4 fidelity path

**السؤال:** Preparatory sequence tap vs Hybrid/Direct لـ C4?

**السياق المختصر:** C4-fidelity-gate blockers؛ **لا** activity. **يعتمد على D01,D03,D16,D11.**

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** §22 H Preparatory sequence — C4 candidate/gate.
- **الخيار B:** §22 P Hybrid — **ADVISOR DECISION REQUIRED** (Framework §4).

**أثر الاختيار:** C4 Activity Design gate؛ C04b.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### C04b — C4 trial + sequence measurement

**السؤال:** trial model لـ 2-step instruction؛ step1/step2/sequenceOrder?

**السياق المختصر:** Gate blocker #2؛ **غير موجود** في `TrainingTrial`. **يعتمد على D13، C04a.**

**الخيارات الموجودة في وثائق Taaluf:**
- **الخيار A:** §22 J **PROPOSED** fields — Matrix / gate.

**أثر الاختيار:** C4 technical spec؛ impl مستقبلي.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### C04c — C4 autoGoal scope

**السؤال:** `autoGoal` **خطوتين** vs عنوان «**فأكثر**»?

**السياق المختصر:** Canon JSON؛ C4 gate §1. **يعتمد على D05.**

**الخيارات الموجودة في وثائق Taaluf:**
- *(مسجّل في C4 docs / Matrix — ADVISOR — بدون حسم في المصادر.)*

**أثر الاختيار:** أهداف/plan C4.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### C15a — C15 model Direct?

**السؤال:** هل `modelType: illustration` = Direct «نموذج مباشر»?

**السياق المختصر:** C15-alignment-governance Q1. **يعتمد على D01، D16.** **لا** إعادة تصميم C15.

**الخيارات الموجودة في وثائق Taaluf:**
- *( governance Q1 — ADVISOR — Packet C15a.)*

**أثر الاختيار:** تصنيف fidelity C15؛ C15b framing.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### C15b — C15 S1–S3 / movements vs Canon

**السؤال:** هل S1/S2/S3 + 6 movements تغطي Canon level 0 / `autoGoal` (5 gross…)?

**السياق المختصر:** `c15SkillMovementMap`؛ governance Q2. **يعتمد على D05، C15a.**

**أثر الاختيار:** Plan Builder sign-off C15؛ movement scope.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### C15c — S4/S5 progression

**السؤال:** متى يصبح protocol S4/S5 **executable** (ليس metadata فقط)?

**السياق المختصر:** C15-skill-classification؛ S4/S5 excluded from target pool. **يعتمد على D11، D19.**

**أثر الاختيار:** توسيع C15 training path — **ليس** صيانة مقفلة حالية.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### C01 — C1 tap vs verbal/symbol request

**السؤال:** هل `tap-to-request` مقبول كـ Preparatory للطلب **كلمة/رمز**?

**السياق المختصر:** Canon C1؛ Framework C1 **UNCLEAR**. **يعتمد على D03، D16.**

**أثر الاختيار:** C1 fidelity claims؛ tap-to-request labeling.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### C02 — C2 orienting

**السؤال:** tap شخصية vs **التفات + نظر** للمنادي?

**السياق المختصر:** Framework **PREPARATORY**. **يعتمد على D03.**

**أثر الاختيار:** C2 claims.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### C03 — C3 receptive vs execute

**السؤال:** picture receptive vs **تنفيذ** تعليمة لفظية خطوة واحدة?

**السياق المختصر:** §5.2 C3؛ `listen-then-tap`. **يعتمد على D03، D01.**

**أثر الاختيار:** C3 labeling؛ حد C3/C4.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### C06 — C6 point + gaze

**السؤال:** scene tap vs **إشارة + نظر** للراشد?

**السياق المختصر:** §5.2 C6. **يعتمد على D03، D02.**

**أثر الاختيار:** C6 claims.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### C08 — C8 AAC deliver

**السؤال:** screen symbol vs **تناول** رمز للراشد (level 0)?

**السياق المختصر:** §5.2 C8. **يعتمد على D03، D02.**

**أثر الاختيار:** C8 claims.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### C11 — C11 joint attention

**السؤال:** visual tracking (`follow-star`) vs **انتباه مشترك** كامل?

**السياق المختصر:** §5.2 C11؛ media مشترك مع C25. **يعتمد على D03، D01.**

**أثر الاختيار:** C11 claims؛ L03 interpretation.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

### C25 — C25 five minutes vs trials

**السؤال:** Canon **~5 دقائق** engagement vs جلسات **trials** قصيرة (8–10)?

**السياق المختصر:** Framework §3 C25؛ 5 media. **يعتمد على D13، D03.**

**أثر الاختيار:** C25 metric alignment؛ attention chapter.

**قرار المستشار:**  
**ملاحظات المستشار:**

---

## 6. C4 — قرار مستقل

**الحالة الحالية (موثّقة):**
- **Candidate** (`C4-training-candidate.md`) — Pass 01.
- **Fidelity Gate** (`C4-fidelity-gate.md`) — Pass 02 — **NEEDS SCIENTIFIC DECISION**.
- **لا** Activity Design · **لا** JSON · **لا** Engine · **لا** Sequence Trial في المنتج.

**القرارات المطلوبة قبل فتح C4 (ربط IDs):**

| موضوع Gate | ID في Advisor Packet |
|------------|----------------------|
| Fidelity path (Prep vs Hybrid/Direct) | **C04a** (+ **D01**, **D03**, **D16**, **D11**) |
| Trial definition + sequence measurement | **D13** → **C04b** |
| Assistance / reminder / reteach recording | **D11** → **C04b** |
| autoGoal «2» vs «فأكثر» | **C04c** (+ **D05**) |

**ما يبقى مغلقًا حتى قرارات موثّقة:** Activity Design، JSON chapter، engine، حقول trial sequence.

---

## 7. C15 — ما يحتاجه المستشار وما لا يحتاجه

**لا يحتاج المستشار:**
- إعادة تصميم C15 أو Pass جديد.
- صيانة **observer-imitation** (S1–S3، observer flow، skillIds map، disclaimers) — **A** في Unblock Map.

**قرارات مفتوحة (توسيع claims / مستقبل — لا توقف الصيانة):**

| موضوع | ID |
|--------|-----|
| Direct/Preparatory/Hybrid — نموذج illustration | **C15a** (+ **D01**, **D16**) |
| S1–S3 / movements vs Canon level 0 / autoGoal | **C15b** (+ **D05**) |
| modelReplays / reteach / S4 | **D19** → **C15c** (+ **D11**) |
| equating mastery / goals / digital success | **D03**, **D09**, **D08**, **D06**, **D07** |
| generalization claims | **D14** (C15 spec §11) |

**C15 Hybrid** في JSON/الوثائق — **لا** إعادة تصنيف في هذه الورقة.

---

## 8. ما لا نحتاج قرارًا بشأنه الآن

- صيانة **11** Activity والـ engines/flows **LOCKED**.
- إصلاحات تقنية **لا** تغيّر semantics (plan guard، persistence، bridge mismatch).
- **Tests** · **navigation** · **active child**.
- **Plan Builder** wiring لmedia موجودة (بدون تغيير goal/mastery policy).
- **C15** صيانة نطاق S1–S3.
- توثيق **B-only** لمعايير بدون training (candidate + gate template).
- **D15** maintenance — **NOT YET RELEVANT** (لا مسار maintenance منفّذ).

---

## 9. قاعدة الحوكمة

> **لا تتحول أي نقطة `ADVISOR DECISION REQUIRED` إلى `IMPLEMENTED` أو `LOCKED` إلا بعد وجود قرار موثّق من المستشار** (إدخال في Advisor Decision Packet + تاريخ + نطاق).  
> **IMPLEMENTED** الحالي (**L01–L04**) يبقى product-locked؛ **validity** علميًا تحت **D03** / **D11** حتى يُحسم.

---

## 10. كيف نستخدم هذه الوثيقة؟

- تُرسل للمستشار عند دخوله — قراءة سريعة للأسئلة المفتوحة وحقول «قرار المستشار».
- **لا** توقف مسار **A** (صيانة التدريب المنفّذ) — Unblock Map §3.
- عند وصول قرار: يُسجَّل كـ **Governance record** ثم يُعاد **Fidelity Gate** / يُفتح المسار المقابل (مثل C4 بعد C04a–D13 subset).

---

## 11. Appendix — Decision Source Map

| Decision ID | مصدر رئيسي | Gate / criterion |
|-------------|------------|------------------|
| D01 | Matrix R01؛ Framework §0–1؛ Methodology §5.1–5.2 | GLOBAL؛ C04a؛ C15a |
| D02 | Matrix R02؛ §5.2 | C6,C8؛ C06,C08 |
| D03 | Matrix R03؛ Framework §3؛ §5.2 | ALL trained؛ C4 gate |
| D04 | Matrix R05؛ C15 alignment §19 | Assessment bridge |
| D05 | Matrix R06 | C04c؛ C15b؛ Plan Builder |
| D06 | Matrix R04 | TrackedGoal |
| D07 | Matrix R21؛ C15 governance §16 | Goals UX |
| D08 | Matrix R17 | TrainingProgress |
| D09 | Matrix R18؛ C15 §39 K | Mastery؛ D14 |
| D10 | Matrix R10؛ C4 gate §6 | C03,C04b |
| D11 | Matrix R12–14؛ C4 §22 I； C15 §10 | C04a/b； L02 |
| D12 | Matrix R16؛ C15 spec §8 | C3,C4,C15 |
| D13 | Matrix R07؛ C4 gate blocker #2 | C04b； C25 |
| D14 | Matrix R19； §22 L； C15 spec §11 | Generalization |
| D15 | Matrix R20； §22 M / §39 M | Maintenance |
| D16 | Matrix R22 | C1,C15,C04a |
| D17 | Matrix R35； C15 governance §8 | UX labeling |
| D18 | Matrix R37； Framework gate | New criteria |
| D19 | Matrix R15； C15 governance | C15c； C4 reteach |
| C04a | Matrix R38； C4-fidelity-gate | **C4** Activity Design |
| C04b | Matrix R08,R26； C4-fidelity-gate | **C4** measurement |
| C04c | Matrix R06 slice； C4 gate §1 | **C4** goals |
| C15a | Matrix R23； C15-alignment-governance Q1 | **C15** model |
| C15b | Matrix R24； governance Q2 | **C15** scope |
| C15c | Matrix R25； C15-skill-classification | **C15** S4/S5 |
| C01–C03,C06,C08,C11,C25 | Matrix §6؛ Framework §3 | Per criterion |
| L01 | Matrix R09 | Validity under D03 |
| L02 | Matrix R11 | Validity under D11 |
| L03 | Matrix R34 | C11,C25 resolver |
| L04 | Matrix R36 | C15 skillIds |

---

*v1.0 — Advisor Decision Brief — documentation only.*
