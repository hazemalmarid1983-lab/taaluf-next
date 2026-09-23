# Taaluf — Cross-Criterion Decision Matrix v1.0

**حالة:** حوكمة/منهجية — **PROVISIONAL**  
**الغرض:** فصل **قرارات عامة** (تُحسم مرة واحدة) عن **قرارات خاصة بمعيار** — **دون حل**  
**مبدأ:** **IMPLEMENTED ≠ SCIENTIFICALLY VALIDATED**

**مراجع:**  
`TAALUF_DIGITAL_FIDELITY_FRAMEWORK_v1.0.md` · `TAALOF_TRAINING_METHODOLOGY_v1.0.md` (§5.1–5.2) ·  
`C4-training-candidate.md` · `C4-fidelity-gate.md` ·  
`C15-training-specification.md` · `C15-alignment-governance.md` · `C15-skill-classification.md` ·  
`data/taalof_criteria_v3.json` · فصول التدريب الثلاثة · الأنشطة المنفّذة (11 media)

**معايير ذات تدريب/توثيق عميق في Pass 01–04:** C1, C2, C3, C4, C6, C8, C11, C15, C25  
**C4:** candidate + fidelity gate — **لا** implementation

---

## 1. Decision register

| Decision | Evidence in Criteria | Current Taaluf Implementation | Classification | Scope | Appears in (criteria/docs) |
|----------|----------------------|-------------------------------|----------------|-------|----------------------------|
| **تعريف Preparatory vs Direct vs Hybrid** | §5.2 (سلوك مستهدف / تمهيدي / substitute); §5.1 (Hybrid delivery) | Framework v1.0 يعكس §5.2؛ C15 JSON «Hybrid»؛ باقي comm/attention **غير موسوم** رسميًا في JSON | **GOVERNANCE — GENERAL** | **GLOBAL** | All trained C*؛ Framework §0–1؛ C15 spec §6؛ C4 gate §3 |
| **Digital Substitute vs Preparatory** | §5.2 صف 3؛ أمثلة C8/C9 | **لا** labeling في engine/JSON | **ADVISOR DECISION REQUIRED** | **GLOBAL** | C1,C6,C8؛ §5.2 |
| **Digital response = real-world behavior?** | §5.2 أمثلة C1,C3,C6,C11,C15,C4… | `correct` على **لمسة/اختيار**؛ C15 `correct` **مراقب** بعد تنفيذ جسدي **غير مرئي للجهاز** | **ADVISOR DECISION REQUIRED** | **GLOBAL** | C1–C3,C6,C8,C11,C15,C25؛ C4 gate |
| **هل Preparatory يصلح لـ TrackedGoal / UI «تقدم»؟** | Canon **لا** يذكر goal increments | `applyTrainingSessionToTrackedGoals` + `trainingGoalCurrentIncrement` (+1/+2/+5) **عام** | **ADVISOR DECISION REQUIRED** | **GLOBAL** | All trained C*؛ C15 governance §16 |
| **Training session result ↔ assessment criterion level (0–3)** | Canon levels **للتقييم** | **لا** كتابة assessment من training path | **ADVISOR DECISION REQUIRED** | **GLOBAL** | C15 alignment §19؛ Framework §3 |
| **Training goal vs Canon `autoGoal`** | `autoGoal` per criterion (C3: 3 one-step؛ C4: 2-step 80%； C15: 5 gross…) | `goalLinks` + plans؛ **لا** تحقق autoGoal حرفيًا | **ADVISOR DECISION REQUIRED** | **GLOBAL** | C1,C3,C4,C11,C15,C25؛ C15 governance §3 |
| **Trial definition (what counts as one trial)** | Canon **لا** ي define trial | `trialCount` per media (5–10 comm/attention؛ 5 C15)؛ **trial = one screen interaction** (comm) أو one observer cycle (C15) | **PROVISIONAL** | **GLOBAL** | All media؛ **C4 gate: ADVISOR** for sequence trials |
| **Step-level measurement (step1/step2/sequenceOrder)** | C4 levels 2–3 (first only / order)؛ §22 J PROPOSED | **غير موجود** في `TrainingTrial` | **ADVISOR DECISION REQUIRED** | **CRITERION-SPECIFIC** (C4 primary) | **C4**؛ §22 J |
| **Accuracy (% correct trials)** | Canon qualitative levels | `calculateAccuracy` — % `correct` | **IMPLEMENTED / LOCKED** | **GLOBAL** | All engines using sessionEngine |
| **Independence (% independent prompts)** | C3/C4 level 0 «دون تكرار/إشارة/تذكير» | `trainingIndependencePercentage` = % `promptLevel === independent` | **ADVISOR DECISION REQUIRED** | **GLOBAL** | C3,C4,C15؛ C4 gate §6 |
| **TrainingPromptLevel (digital timed assistance)** | Canon: إشارة، تكرار، تذكير، تجزئة، توجيه جسدي | `receptive_choice`: auto stages؛ tap-to-request/C15: **observer** | **IMPLEMENTED / LOCKED** (product) | **GLOBAL** | C1,C3,C6,C8,C15 |
| **Reminder (Canon)** | C4 level 2؛ C25 level 1 «تذكير» | **لا** field `reminder` | **ADVISOR DECISION REQUIRED** | **GLOBAL** | **C4**, C25؛ C4 gate §6 |
| **Reteach / segmentation (Canon)** | C4 level 1 | **لا** protocol | **ADVISOR DECISION REQUIRED** | **GLOBAL** | **C4**؛ §22 I |
| **Prompt vs reminder vs reteach mapping** | §22 I C4؛ §39 I C15 latency≠prompt | C15: `modelReplays` **≠** `promptLevel` (locked impl) | **ADVISOR DECISION REQUIRED** | **GLOBAL** | **C4**, **C15**؛ C15 governance §10 |
| **Model replay (S4 / level 1 C4/C15)** | C4 level 1 «إعادة التعليم»؛ C15 level 1 «تكرار النموذج» | C15: `modelReplays` counted؛ **≠** success criterion | **CRITERION-SPECIFIC** | **C15** (replay)； **C4** (reteach — not impl) | **C15**؛ C4 docs |
| **Response time semantics** | C3/C4 «مباشرة»؛ §39 latencyAfterModelMs | C15: perform→record UX؛ comm: elapsed in window | **ADVISOR DECISION REQUIRED** | **GLOBAL** | C3,C4,C15؛ C15 spec §8 |
| **Mastery (`masteryLevel` / thresholds)** | Canon **لا** `masteryLevel` | `deriveTrainingMasteryLevel` (80/70/3 sessions) — **PROVISIONAL** comment in code cited in docs | **PROVISIONAL** | **GLOBAL** | All persisted sessions؛ C15 governance §15 |
| **Mastery = criterion mastery?** | C15 §39 K؛ C4 §22 K Preparatory≠mastery | Disclaimers C15 UI؛ **no** assessment write | **ADVISOR DECISION REQUIRED** | **GLOBAL** | **C15** primary؛ all trained C* |
| **Generalization path** | recommendation/autoGoal often imply broader context | **NOT IMPLEMENTED** in training chapters | **ADVISOR DECISION REQUIRED** | **GLOBAL** | C4 §22 L； C15 spec §11； all Canon |
| **Maintenance** | §22 M C4； §39 M C15 | **NOT IMPLEMENTED** | **NOT YET RELEVANT** (no pathway) | **GLOBAL** | C4,C15 methodology |
| **Goal progress +1/+2/+5** | **لا** في Canon | `goalFeedback.ts` — independence thresholds | **PROVISIONAL** | **GLOBAL** | All goal-linked sessions |
| **Observer required vs optional** | Hybrid/Direct legs in §5.2 | **Required** C15； optional tap-to-request observer； **auto** comm prompting | **CRITERION-SPECIFIC** | **DOMAIN** (comm vs motor-social) | **C1**, **C15** |
| **Direct vs Preparatory for illustration/video model** | C15 question «نموذج مباشر» | C15 `modelType: illustration` | **ADVISOR DECISION REQUIRED** | **CRITERION-SPECIFIC** | **C15** |
| **S1/S2/S3 target skills vs Canon movement scope** | C15 level 0 gross+fine+face； autoGoal 5 gross | `c15SkillMovementMap` 6 movements | **ADVISOR DECISION REQUIRED** | **CRITERION-SPECIFIC** | **C15** |
| **S4/S5 progression vs executable protocol** | C4/C15 level 1 assistance concepts | S4/S5 **metadata only** — Pass 01 locked doc | **GOVERNANCE — GENERAL** (C15 chapter) | **CRITERION-SPECIFIC** | **C15** |
| **Sequence trial model (2-step instruction)** | C4 question + levels | **No** C4 media | **ADVISOR DECISION REQUIRED** | **CRITERION-SPECIFIC** | **C4** |
| **Receptive one-step vs verbal compliance** | C3 question **تنفيذ** لفظي | `listen-then-tap` = **picture tap** | **ADVISOR DECISION REQUIRED** | **CRITERION-SPECIFIC** | **C3** |
| **AAC symbol board vs real AAC** | C8 level 0 **تناول** للراشد | `symbol-board-request` = screen tap | **ADVISOR DECISION REQUIRED** | **CRITERION-SPECIFIC** | **C8** |
| **Pointing + gaze vs scene tap** | C6 level 0 **نظر** بين شيء وراشد | `point-to-item` = digital tap | **ADVISOR DECISION REQUIRED** | **CRITERION-SPECIFIC** | **C6** |
| **Name orienting vs character tap** | C2 **التفات/نظر** | `name-call-tap` | **ADVISOR DECISION REQUIRED** | **CRITERION-SPECIFIC** | **C2** |
| **Functional request word/symbol vs tap** | C1 **كلمة أو رمز** | `tap-to-request` primarily visual | **ADVISOR DECISION REQUIRED** | **CRITERION-SPECIFIC** | **C1** |
| **Joint attention vs visual tracking** | C11 **يشارك** interest | `follow-star` tracking | **ADVISOR DECISION REQUIRED** | **CRITERION-SPECIFIC** | **C11** |
| **Sustained attention 5 min vs short trials** | C25 autoGoal **5 minutes** | Trials 8–10 per session | **ADVISOR DECISION REQUIRED** | **CRITERION-SPECIFIC** | **C25** |
| **Attention chapter skills mapped to C25 only** | C25 task engagement | 5 media under **C25** candidate； C11 **follow-star only** | **IMPLEMENTED / LOCKED** (candidate resolver) | **DOMAIN** | **C11**, **C25** |
| **difficulty 1–3 vs assessment levels 0–3** | Canon 0–3 = severity | Product difficulty filters movement/pool | **GOVERNANCE — GENERAL** | **GLOBAL** | C15 governance §8； attention/comm |
| **skillIds on plan (target vs progression)** | **لا** في Canon | C15: S1–S3 target； S4/S5 excluded — **documented** | **IMPLEMENTED / LOCKED** | **CRITERION-SPECIFIC** | **C15** |
| **Fidelity gate before Activity Design** | §5.2 + Framework | C4 **blocked** NEEDS SCIENTIFIC DECISION | **GOVERNANCE — GENERAL** | **GLOBAL** | **C4** gate； Framework gate |
| **C4 fidelity path (Prep vs Hybrid)** | §22 H/P | **No** activity | **ADVISOR DECISION REQUIRED** | **CRITERION-SPECIFIC** | **C4** |

---

## 2. Decisions that must not be re-decided per criterion

*إذا حُسمت كـ **Global Advisor Decision**، لا يُعاد طرحها لكل Criterion إلا where **CRITERION-SPECIFIC** row says otherwise.*

| Topic | Why global |
|--------|------------|
| Preparatory / Direct / Hybrid **definitions** | §5.1–5.2 واحدة لـ C1–C40 |
| Digital response ↔ real behavior **default rule** | §5.2 repeated across criteria |
| promptLevel **≠** reminder/reteach/segmentation **unless mapped** | C4 §22 I + C15 replay≠prompt |
| `masteryLevel` / session metrics **≠** assessment level | C15 governance + Framework |
| Generalization **not implied** by session success | §22 L، C15 spec |
| Pre-Activity Fidelity Gate **before** new Activity | Framework； C4 Pass 02 |
| IMPLEMENTED metrics (**accuracy**, engine trial loop) | Shared `sessionEngine` — **validity** still ADVISOR |

---

## Global Advisor Decisions

*ظهرت في **≥2** criteria أو في Framework + **≥1** criterion doc — **قواعد عامة** محتملة ( **غير محسومة** ).*

1. **Criterion–Behavior Fidelity default:** متى يُسمح بlabel «تدريب Cx» على نشاط **Preparatory** دون disclaimer إلزامي ومسار Direct/Hybrid؟ (§5.2؛ C3,C6,C8,C11 + C4,C15)
2. **Digital response = evidence of real behavior?** — equating policy لـ `correct` / goal progress. (C1–C3,C6,C8,C11,C15,C25)
3. **`TrainingPromptLevel` / digital assistance vs Canon assistance** (تذكير، تجزئة، إشارة، تكرار تعليم، توجيه جسدي). (**C3** comm auto； **C4** gate； **C15** observer)
4. **Independence metric:** `% independent` = Canon «دون مساعدة/تذكير/إشارة»? (**C3**, **C4**, **C15**)
5. **`TrainingProgress.masteryLevel` / session success ↔ Canon mastery / `autoGoal`.** (**C15** governance； all sessions)
6. **Training session + goal increments (+1/+2/+5) ↔ assessment / Canon.** (All goal-linked)
7. **Generalization:** minimum evidence before claiming «progress toward criterion». (**C4**, **C15**, methodology)
8. **Hybrid labeling:** when is **observer + physical leg** required vs digital-only allowed? (**C15** locked Hybrid doc； **C4** candidate Hybrid)
9. **Trial definition (global default):** one trial = one user action vs one task episode — **before** criterion-specific sequence rules. (All media vs **C4**)
10. **Digital Substitute boundary** vs Preparatory (§5.2 row 3). (**C6**, **C8**, comm chapter PROVISIONAL notes)

---

## Criterion-Specific Decisions

*لا تُحل بالعامة أعلاه — أو خاصة بCanon/implementation واحد.*

### C1 — الطلب والتعبير عن الاحتياجات
- طلب **شفهي/رمز** vs **tap** expressive_choice؛ observer path vs auto-prompt. (`tap-to-request`)

### C2 — النداء والالتفات
- Tap شخصية vs **التفات + نظر** للمنادي. (`name-call-tap`)

### C3 — تعليمات خطوة واحدة
- **Picture receptive** vs **motor execution** of instruction. (`listen-then-tap` vs Canon question)

### C4 — تعليمات مركّبة
- Fidelity path: **Preparatory sequence tap** vs **Hybrid/Direct** (3 blockers in `C4-fidelity-gate.md`).
- Sequence **trial model**؛ step1/step2/sequenceOrder fields.
- **2 steps** in `autoGoal` vs «**فأكثر**» in title/question.

### C6 — الإشارة والإيماء
- Scene **tap** vs **point + gaze** to adult.

### C8 — رموز/صور للطلب
- Screen symbol vs **handing** symbol to partner (Canon level 0).

### C11 — الانتباه المشترك
- `follow-star` **tracking** vs **joint attention** with human point.

### C15 — التقليد الحركي والاجتماعي
- Illustration model = **Direct** «نموذج مباشر»? (governance #1)
- **S1/S2/S3** + 6 movements vs Canon level 0 / `autoGoal`.
- **S4/S5** — progression metadata only (locked classification doc).
- **`modelReplays` vs level 1** imitation / vs S4 protocol.
- Physical performance **not** sensed — observer-only Direct leg.

### C25 — الانتباه في المهمة
- **5-minute** engagement vs **short trial** sessions.
- Five media as **proxies** for one criterion — fidelity per media.

---

## Proposed Advisor Review Packet

### A. Global decisions (≤10)

1. Default **Preparatory** labeling and disclaimer policy for all digital activities tied to Canon.
2. Policy: **`correct` / goal progress** from digital response — allowed or forbidden without Direct/Hybrid leg?
3. **Unified assistance model:** map or **forbid mapping** between `TrainingPromptLevel` and Canon reminder/reteach/segmentation/gesture/physical.
4. Definition of **independence** in product metrics vs Canon level 0 across criteria.
5. **`masteryLevel` + thresholds** — product-only vs any link to criterion; relation to **`autoGoal`**.
6. **Training data → assessment** — explicit prohibition or allowed pathways.
7. **Generalization** minimum before UI/reporting claims.
8. When **Hybrid + observer** is **mandatory** vs optional for social/motor/communication criteria.
9. Global **trial** unit definition (single action vs multi-step episode).
10. **Digital Substitute** vs **Preparatory** classification rules (§5.2).

### B. Criterion-specific decisions (only what globals do not resolve)

| Criterion | Decisions for advisor |
|-----------|---------------------|
| **C1** | Tap/visual request vs verbal/symbol request in real context. |
| **C2** | Digital name-call tap vs orienting to caller. |
| **C3** | Receptive picture match vs executing one-step verbal instruction. |
| **C4** | Prep-only vs Hybrid; trial/sequence measurement; assistance recording; 2 vs 2+ steps scope. |
| **C6** | Digital tap vs point+gaze communication. |
| **C8** | Screen AAC vs deliver-to-partner AAC. |
| **C11** | Follow-star vs full joint attention criterion. |
| **C15** | Digital model Direct/Preparatory; S1–S3/movement vs Canon; replay vs mastery; observer as Direct leg. |
| **C25** | Duration-based Canon vs trial-based product; which media evidence counts. |

---

## Cross-document duplication map

| Recurring decision | Where it was scattered (now centralized here) |
|--------------------|-----------------------------------------------|
| Digital ≠ real behavior | §5.2 methodology； Framework §3 table； C15 spec/governance； C4 gate §3–4 |
| masteryLevel ≠ C15 | C15 governance §15； alignment matrix §19； Framework stop rule |
| prompt ≠ replay ≠ Canon assistance | C15 governance §10； C4 gate §6； §22 I / §39 I |
| Preparatory/Hybrid C15 | C15 spec §6–7； JSON chapter； Framework §3 C15 row |
| C3 vs C4 boundary | C4 candidate §5； C4 gate §4； §21 C / §22 C |
| autoGoal vs training | C15 governance §3； C4 gate §1； communication JSON PROVISIONAL |
| Generalization not measured | C15 spec §11； C4 §22 L； Framework layers |
| Fidelity gate stop | Framework gate； C4-fidelity-gate §7 |
| S4/S5 not target skills | C15-skill-classification； C15 governance §6 |
| +1/+2/+5 provisional | C15 governance §16； C15 spec §9 |

---

## Statistics (register above)

| Metric | Count |
|--------|------:|
| **Rows in decision register (§1)** | **35** |
| **GOVERNANCE — GENERAL** | **4** |
| **IMPLEMENTED / LOCKED** (product) | **4** |
| **PROVISIONAL** | **3** |
| **ADVISOR DECISION REQUIRED** | **22** |
| **CRITERION-SPECIFIC** (primary row tag) | **14** |
| **NOT YET RELEVANT** | **1** |
| **Global Advisor Decisions (§5 list)** | **10** |
| **Criterion-specific buckets (§6)** | **9** criteria with dedicated bullets |

*Counts are **documentation taxonomy** — not resolved decisions.*

---

*v1.0 — Cross-Criterion Decision Matrix 01 — documentation only.*
