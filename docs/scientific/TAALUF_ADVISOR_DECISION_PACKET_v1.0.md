# Taaluf — Advisor Decision Packet v1.0

**Consolidation of:** `TAALUF_CROSS_CRITERION_DECISION_MATRIX_v1.0.md` §1  
**حالة:** **غير محسوم** — للعرض على المستشار العلمي — **لا** يحل أي قرار  
**مبدأ:** **IMPLEMENTED ≠ SCIENTIFICALLY VALIDATED**

---

## Coverage note (35 vs 38)

- **سجل Matrix §1:** **38** صفًا (`R01`–`R38`).
- **إحصاء Matrix «35»:** يُقصد **قرارات تحتاج حوكمة/مستشار** — يستثني **`R09`, `R11`, `R34`, `R36`** (IMPLEMENTED/LOCKED منتج) و **`R20`** (NOT YET RELEVANT) → **38 − 4 = 34**؛ مع **`R01`, `R17`, `R35`, `R37`** كـ GOVERNANCE/PROVISIONAL تُعامل **35** كعدد **تقريبي** للبند «غير LOCKED».
- **Consolidation:** **كل** `R01`–`R38` **مُدرَج** — **لا** سقوط.

---

## 1. Consolidation table

| ID | Consolidated Decision | Original Rows | Scope | Criteria Affected | Dependency |
|----|---------------------|---------------|-------|-------------------|------------|
| **D01** | **تعريف وتطبيق Preparatory / Direct / Hybrid** (§5.1–5.2) | R01 | GLOBAL | C1–C3,C6,C8,C11,C15,C25,C4 | INDEPENDENT |
| **D02** | **Digital Substitute** vs Preparatory (§5.2 صف 3) | R02 | GLOBAL | C1,C6,C8 (+ §5.2 others) | DEPENDS ON **D01** |
| **D03** | **هل الاستجابة الرقمية (`correct`) تُ equate بالسلوك الواقعي؟** | R03 | GLOBAL | C1–C3,C6,C8,C11,C15,C25,C4 | INDEPENDENT |
| **D04** | **فصل Training session ↔ Assessment level (0–3)** | R05 | GLOBAL | All trained + C4 | DEPENDS ON **D03** |
| **D05** | **Training operational goal / plan ↔ Canon `autoGoal`** | R06 | GLOBAL | C1,C3,C4,C11,C15,C25 | DEPENDS ON **D04**, **D03** |
| **D06** | **Preparatory activity ↔ `TrackedGoal` / UI تقدم** | R04 | GLOBAL | All goal-linked | DEPENDS ON **D03**, **D01** |
| **D07** | **Goal progress +1/+2/+5** (product rule) | R21 | GLOBAL | All goal-linked | DEPENDS ON **D06**, **D03** |
| **D08** | **`masteryLevel` thresholds (80/70/3)** — product validity | R17 | GLOBAL | All persisted sessions | PROVISIONAL — DEPENDS ON **D09** |
| **D09** | **`masteryLevel` / session success ↔ Canon mastery / `autoGoal`** | R18 | GLOBAL | C15 primary؛ all | DEPENDS ON **D04**, **D03** |
| **D10** | **Independence metric ↔ Canon «دون مساعدة/تذكير/إشارة»** | R10 | GLOBAL | C3,C4,C15 | DEPENDS ON **D11** |
| **D11** | **Canon assistance (تذكير، تجزئة، إعادة تعليم، إشارة، جسدي) ↔ `TrainingPromptLevel` / digital schedule** | R12, R13, R14 | GLOBAL | C3,C4,C15,C25 | INDEPENDENT |
| **D12** | **`responseTimeMs` semantics** (latency vs UX window) | R16 | GLOBAL | C3,C4,C15 | DEPENDS ON **D11** (C15 §39 I) |
| **D13** | **Global trial definition** (one action vs episode) | R07 | GLOBAL | All media؛ C4 prerequisite | INDEPENDENT |
| **D14** | **Generalization — minimum evidence قبل ادعاء تقدم** | R19 | GLOBAL | C4,C15؛ methodology | DEPENDS ON **D09**, **D04** |
| **D15** | **Maintenance pathway** | R20 | GLOBAL | C4,C15 methodology | DEPENDS ON **D14** — NOT YET RELEVANT |
| **D16** | **متى Hybrid يتطلب مراقب + leg واقعي vs digital-only** | R22 | DOMAIN | C1,C15؛ C4 candidate | DEPENDS ON **D01**, **D03** |
| **D17** | **Product `difficulty` 1–3 ↔ assessment levels 0–3** (منع الخلط) | R35 | GLOBAL | C15, attention, comm | INDEPENDENT |
| **D18** | **Pre-Activity Fidelity Gate** (process — GOVERNANCE) | R37 | GLOBAL | C4 blocked؛ future C* | INDEPENDENT (process) |
| **D19** | **`modelReplays` / reteach ↔ Canon level 1 / S4** | R15 | CRITERION | C15؛ C4 (reteach) | DEPENDS ON **D11** |
| **C01** | **C1:** tap/visual request vs **كلمة/رمز** طلب وظيفي | R31 | CRITERION | C1 | DEPENDS ON **D03**, **D16** |
| **C02** | **C2:** tap شخصية vs **التفات + نظر** للمنادي | R30 | CRITERION | C2 | DEPENDS ON **D03** |
| **C03** | **C3:** receptive picture vs **تنفيذ** تعليمة لفظية خطوة واحدة | R27 | CRITERION | C3 | DEPENDS ON **D03**, **D01** |
| **C04a** | **C4:** fidelity path — Preparatory sequence vs Hybrid/Direct | R38 (+ R26 context) | CRITERION | C4 | DEPENDS ON **D01**, **D03**, **D16**, **D11** |
| **C04b** | **C4:** sequence **trial model** + step/sequence fields | R08, R26 | CRITERION | C4 | DEPENDS ON **D13**, **C04a** |
| **C04c** | **C4:** `autoGoal` **2** vs title «**فأكثر**» | R06 (C4 slice) | CRITERION | C4 | DEPENDS ON **D05** |
| **C06** | **C6:** scene tap vs **إشارة + نظر** للراشد | R29 | CRITERION | C6 | DEPENDS ON **D03**, **D02** |
| **C08** | **C8:** screen symbol vs **تناول** رمز للراشد | R28 | CRITERION | C8 | DEPENDS ON **D03**, **D02** |
| **C11** | **C11:** visual tracking vs **انتباه مشترك** | R32 | CRITERION | C11 | DEPENDS ON **D03**, **D01** |
| **C15a** | **C15:** illustration/video model = **Direct «نموذج مباشر»**? | R23 | CRITERION | C15 | DEPENDS ON **D01**, **D16** |
| **C15b** | **C15:** S1/S2/S3 + 6 movements vs Canon level 0 / `autoGoal` | R24 | CRITERION | C15 | DEPENDS ON **D05**, **C15a** |
| **C15c** | **C15:** S4/S5 progression — متى protocol executable | R25 | CRITERION | C15 | DEPENDS ON **D11**, **D19** |
| **C25** | **C25:** **5 دقائق** engagement vs **trials** قصيرة | R33 | CRITERION | C25 | DEPENDS ON **D13**, **D03** |
| **L01** | **Accuracy `%`** — IMPLEMENTED (validity under D03) | R09 | GLOBAL | All engines | DEPENDS ON **D03** (validity only) |
| **L02** | **`TrainingPromptLevel` + digital schedule** — IMPLEMENTED | R11 | GLOBAL | C1,C3,C6,C8,C15 | DEPENDS ON **D11** |
| **L03** | **Candidate resolver C11/C25 media split** — IMPLEMENTED | R34 | DOMAIN | C11,C25 | DEPENDS ON **C11**, **C25** |
| **L04** | **C15 `skillIds` target vs S4/S5** — IMPLEMENTED doc | R36 | CRITERION | C15 | DEPENDS ON **C15c** |

**Counts after consolidation:** **19** advisor-facing consolidated IDs (**D01–D19**, **C01–C15c**, **C04a–c**) + **4** locked rows (**L01–L04**) = **23** nodes covering **38** originals.

---

## 2. Global Advisor Decisions (independent core)

### D01 — Preparatory / Direct / Hybrid

| | |
|--|--|
| **السؤال** | ما التعريف التشغيلي المعتمد لـ Preparatory و Direct و Hybrid، ومتى يُوسَم نشاط/جلسة بكل منها؟ |
| **لماذا قرار** | §5.1–5.2؛ C15 Hybrid في JSON؛ comm/attention **غير موسوم** — خطر خلط fidelity. |
| **المتأثر** | C1–C11,C15,C25,C4؛ Framework؛ Plan Builder labels. |
| **يتوقف إن لم يُحسم** | C04a؛ C15a؛ D02؛ D16؛ labeling new activities. |
| **خيارات في المصادر فقط** | §5.2 ثلاث مستويات fidelity؛ §5.1 ثلاثة delivery models؛ C15 chapter «Hybrid»؛ §22 P C4 Hybrid مقترح. |

### D02 — Digital Substitute vs Preparatory

| | |
|--|--|
| **السؤال** | أين حد **Substitute** (§5.2 صف 3) مقابل Preparatory؟ |
| **لماذا** | §5.2 C8/C6؛ **لا** labeling في المنتج. |
| **المتأثر** | C1,C6,C8؛ comm PROVISIONAL notes. |
| **يتوقف** | C06,C08؛ equating risk labeling. |
| **خيارات** | §5.2 «استجابة رقمية بديلة» vs «مهارة تمهيدية». |

### D03 — Digital response = real behavior?

| | |
|--|--|
| **السؤال** | هل يُسمح أن `correct` / نجاح جلسة يُفسَّر كسلوك Canon دون Direct/Hybrid leg؟ |
| **لماذا** | §5.2 أمثلة متعددة؛ `correct` على لمسة في comm. |
| **المتأثر** | **All** trained C*؛ C4 gate؛ goal/mastery chain. |
| **يتوقف** | D04–D07,D09؛ C01–C11,C25,C04a؛ validity of L01. |
| **خيارات** | Preparatory only + disclaimer (Framework stop rule)； Hybrid/Direct leg required for stronger claims (§22 C4, C15 spec). |

### D04 — Training ↔ Assessment (levels 0–3)

| | |
|--|--|
| **السؤال** | هل يُمنع **منهجيًا** أي مسار من training → assessment record؟ |
| **لماذا** | C15 alignment §19؛ Canon levels للتقييم. |
| **المتأثر** | Tanawum/assessment integration (future)； reporting. |
| **يتوقف** | D05,D09؛ C15 governance claims. |
| **خيارات** | فصل تام (current impl: no write)； جسور محددة ( **غير منفذة** — ADVISOR only). |

### D05 — Training goal ↔ Canon `autoGoal`

| | |
|--|--|
| **السؤال** | كيف تُترجم `autoGoal` إلى أهداف/plan دون ادعاء تحقيق Canon؟ |
| **لماذا** | C3/C4/C15/C25 نصوص مختلفة؛ `goalLinks` لا تتحقق حرفيًا. |
| **المتأثر** | Plan Builder؛ IEP goals. |
| **يتوقف** | C04c؛ C15b؛ D07 labeling. |
| **خيارات** | parallel labels (training vs Canon goal) — **مقترح docs only**. |

### D06 — Preparatory ↔ TrackedGoal

| | |
|--|--|
| **السؤال** | هل جلسة **Preparatory** تُحدّث `TrackedGoal.current`؟ |
| **لماذا** | R04؛ Canon لا يذكر increments. |
| **المتأثر** | All goal-linked sessions. |
| **يتوقف** | D07. |
| **خيارات** | allow with tag؛ deny for Preparatory-only؛ allow only if Hybrid Direct leg documented (sources: Framework stop rule — **لا** حسم). |

### D07 — +1/+2/+5

| | |
|--|--|
| **السؤال** | هل increments tied to `independence` **معتمدة** methodologically؟ |
| **لماذا** | PROVISIONAL product؛ C15 governance §16. |
| **المتأثر** | Goals UX. |
| **يتوقف** | Scientific sign-off on goal progress UI. |
| **خيارات** | retain PROVISIONAL؛ replace with advisor rule؛ disable until D03 resolved. |

### D08 — `masteryLevel` thresholds

| | |
|--|--|
| **السؤال** | هل 80/70/3 sessions **تبقى** product-only؟ |
| **لماذا** | R17 PROVISIONAL؛ code comments in docs. |
| **المتأثر** | TrainingProgress UI/storage. |
| **يتوقف** | D09 implementation policy. |
| **خيارات** | PROVISIONAL forever؛ advisor-defined bands؛ remove `mastered` label. |

### D09 — Mastery ↔ criterion

| | |
|--|--|
| **السؤال** | هل `mastered` **يُمنع** linguistically من equating Cx؟ |
| **لماذا** | C15 §39 K； C4 §22 K； disclaimers exist but product field persists. |
| **المتأثر** | C15 primary؛ all criteria. |
| **يتوقف** | D14 claims؛ parent/specialist reporting. |
| **خيارات** | rename tiers； mandatory disclaimer； decouple from criterion ids. |

### D10 — Independence metric

| | |
|--|--|
| **السؤال** | `% independent` = Canon independence? |
| **لماذا** | C3/C4 level 0؛ C4 gate §6. |
| **المتأثر** | D07,D08,D09 inputs. |
| **يتوقف** | C03,C04b interpretation. |
| **خيارات** | `% promptLevel===independent` only (current)； expanded definition (ADVISOR). |

### D11 — Assistance taxonomy

| | |
|--|--|
| **السؤال** | كيف يُسجَّل **تذكير/تجزئة/إعادة تعليم** vs `TrainingPromptLevel` vs digital schedule? |
| **لماذا** | R12–R14； §22 I； C15 replay≠prompt **locked**. |
| **المتأثر** | C3 auto-prompt； C4,C15,C25. |
| **يتوقف** | C04a,C04b； D19； L02 validity. |
| **خيارات** | separate fields (§22 J PROPOSED)； forbid mapping； observer-only for Canon assistance. |

### D12 — Response time

| | |
|--|--|
| **السؤال** | ما تعريف `responseTimeMs` المعتمد vs «مباشرة» Canon / `latencyAfterModelMs`? |
| **لماذا** | C15 spec §8； §39 I. |
| **المتأثر** | C3,C4,C15. |
| **يتوقف** | Criterion claims on immediacy. |
| **خيارات** | UX-only (current docs)； add model-offset metric (PROPOSED §22 J — **not impl**). |

### D13 — Trial definition (global)

| | |
|--|--|
| **السؤال** | Trial = one user action vs multi-step episode? |
| **لماذا** | All `trialCount`； C4 gate blocker #2. |
| **المتأثر** | All media؛ **C04b** depends. |
| **يتوقف** | C04b； C25 duration mapping. |
| **خيارات** | status quo comm/C15； sequence-as-one-trial (C4 docs). |

### D14 — Generalization

| | |
|--|--|
| **السؤال** | ما minimum evidence قبل «progress toward criterion» / generalization phase? |
| **لماذا** | §22 L； C15 spec §11； **NOT IMPLEMENTED**. |
| **المتأثر** | C4,C15؛ future pathways. |
| **يتوقف** | D15； maintenance planning. |
| **خيارات** | methodology §L/M PROPOSED paths only. |

### D15 — Maintenance

| | |
|--|--|
| **السؤال** | (NOT YET RELEVANT) define when maintenance pathway required. |
| **لماذا** | R20. |
| **المتأثر** | C4,C15 long-term. |
| **يتوقف** | Post-mastery programs. |
| **خيارات** | §22 M, §39 M PROPOSED. |

### D16 — Observer / Hybrid leg requirement

| | |
|--|--|
| **السؤال** | متى **إلزامي** observer + physical/social leg vs digital-only? |
| **لماذا قرار** | C15 required؛ C1 optional؛ C4 candidate Hybrid. |
| **المتأثر** | C1,C15,C04a. |
| **يتوقف** | C15a； new Hybrid designs. |
| **خيارات** | §5.2 Direct/Hybrid examples； C15 governance Q1. |

### D17 — difficulty vs assessment levels

| | |
|--|--|
| **السؤال** | منع equating product difficulty 1–3 مع severity 0–3 في UI/reports? |
| **لماذا** | C15 governance §8. |
| **المتأثر** | C15, comm, attention UX. |
| **يتوقف** | Misinterpretation only (governance). |
| **خيارات** | rename product axis； separate labels (docs). |

### D18 — Fidelity Gate (process)

| | |
|--|--|
| **السؤال** | (GOVERNANCE) confirm gate mandatory before Activity Design — **already documented**. |
| **لماذا** | Framework； C4 NEEDS SCIENTIFIC DECISION. |
| **المتأثر** | New criteria (C4…). |
| **يتوقف** | C04a until D03,D01,D11,D13 subset resolved. |
| **خيارات** | keep gate (current docs). |

### D19 — Model replay / reteach

| | |
|--|--|
| **السؤال** | معنى `modelReplays` vs Canon reteach / S4 / level 1 C15/C4. |
| **لماذا** | R15； C15 governance. |
| **المتأثر** | C15； C4 (if reteach protocol). |
| **يتوقف** | C15c. |
| **خيارات** | count only (current)； map to assistance (forbidden without D11)； S4 protocol future. |

---

## 3. Criterion-Specific Decisions

### C1 — `C01`
- **سؤال:** هل `tap-to-request` (expressive_choice) يُ accepted كـ Preparatory للطلب **كلمة/رمز**؟
- **خاص:** Canon C1 **شفهي/رمز** functional request.
- **يتوقف:** C1 fidelity sign-off؛ observer policy (D16).
- **مصدر:** Matrix R31； §5.2 C1； comm JSON.

### C2 — `C02`
- **سؤال:** Tap `name-call-tap` vs orienting to caller.
- **خاص:** Canon **التفات + نظر**.
- **يتوقف:** C2 activity validity claims.
- **مصدر:** R30； JSON skill «محاكاة رقمية».

### C3 — `C03`
- **سؤال:** `listen-then-tap` receptive vs **تنفيذ** instruction.
- **خاص:** Canon **تنفيذ** لفظي.
- **يتوقف:** C3 criterion labeling on media.
- **مصدر:** R27； §21 H； C3 candidate mapping.

### C4 — `C04a`, `C04b`, `C04c`
- **C04a:** Prep sequence vs Hybrid/Direct — **C4-fidelity-gate** blockers 1,16.
- **C04b:** trial + step1/step2/sequenceOrder — gate blocker 2.
- **C04c:** 2 steps in autoGoal vs «فأكثر» — Canon text.
- **يتوقف:** **Activity Design** (gate: NO).
- **مصدر:** C4-fidelity-gate； C4-training-candidate； §22.

### C6 — `C06`
- **سؤال:** `point-to-item` vs point + gaze (§5.2 C6).
- **مصدر:** R29.

### C8 — `C08`
- **سؤال:** Symbol tap vs deliver to partner (Canon 0).
- **مصدر:** R28； §5.2 C8 Direct/Prep/Substitute.

### C11 — `C11`
- **سؤال:** `follow-star` vs joint attention (§5.2 C11).
- **مصدر:** R32； attention chapter.

### C15 — `C15a`, `C15b`, `C15c`
- **C15a:** illustration = Direct model? — **C15-alignment-governance** Q1.
- **C15b:** S1–S3 / 6 movements vs level 0 / autoGoal — governance Q2.
- **C15c:** S4/S5 executable protocol — **C15-skill-classification** (metadata only now).
- **مصدر:** C15 spec/governance/classification — **لا تعديل** تصنيفات Pass 01–04.

### C25 — `C25`
- **سؤال:** 5-minute Canon vs short trial sessions.
- **مصدر:** R33； C25 autoGoal； 5 media.

---

## 4. Decision Dependencies (from docs)

```
D01 (Prep/Direct/Hybrid taxonomy)
 ├── D02 (Substitute boundary)
 ├── D16 (observer / Hybrid leg)
 │    ├── C15a (C15 model Direct?)
 │    └── C04a (C4 fidelity path)
 ├── C03, C11 (activity class)
 └── C04a

D03 (digital response = real behavior?)
 ├── D04 (training ↔ assessment)
 │    ├── D05 (autoGoal mapping)
 │    │    ├── C04c
 │    │    └── C15b
 │    └── D09 (mastery ↔ criterion)
 │         ├── D08 (thresholds validity)
 │         └── D14 (generalization)
 │              └── D15 (maintenance)
 ├── D06 (Preparatory ↔ TrackedGoal)
 │    └── D07 (+1/+2/+5)
 ├── D10 (independence) ← D11
 ├── C01–C08, C11, C25, C04a
 └── L01 (accuracy validity)

D11 (assistance taxonomy)
 ├── D10, D12
 ├── D19 (replay/reteach)
 │    └── C15c
 ├── C04a, C04b
 └── L02 (promptLevel product)

D13 (global trial definition)
 ├── C04b
 └── C25

D18 (Fidelity Gate process)
 └── C04a / C04b (blocked until scientific subset of D01,D03,D11,D13)

C04b ── DEPENDS ON ── C04a + D13
```

---

## 5. Minimum Advisor Packet (dependency order)

1. **D01** — taxonomy Prep/Direct/Hybrid  
2. **D03** — digital response equating policy  
3. **D02** — Substitute vs Preparatory (after D01)  
4. **D11** — assistance / prompt / reminder / reteach  
5. **D04** — training vs assessment separation  
6. **D09** — mastery semantics (with **D08** thresholds)  
7. **D06** → **D07** — goal updates & increments  
8. **D10** → **D12** — independence & response time (after D11)  
9. **D13** — global trial unit  
10. **D16** — observer/Hybrid requirement  
11. **D05** — autoGoal operational mapping  
12. **D14** → **D15** — generalization & maintenance  
13. **D17** — difficulty labeling (governance)  
14. **D19** — replay/reteach  
15. **C04a** → **C04b** → **C04c** — C4 chain  
16. **C15a** → **C15b** → **C15c** — C15 chain  
17. **C03, C01, C02, C06, C08, C11, C25** — per-criterion fidelity (after D03/D01)  
18. **D18** — acknowledge gate (process — no vote unless challenged)  
19. **L01–L04** — confirm IMPLEMENTED rows stay PROVISIONAL validity until D03/D11  

---

## 6. Post-Decision Impact

| Decision | If resolved | What can proceed | What remains blocked |
|----------|-------------|------------------|----------------------|
| **D01** | Labeling rules fixed | Fidelity docs for new C*； C04a/C15a **framing** | Does not alone unlock C4 Activity Design |
| **D03** | Equating policy set | Goal/mastery **wording**； C01–C11,C25 **claims** | C4 still needs C04a |
| **D11** | Assistance model set | C04b measurement spec； C15c S4/S5 path **design** | Engine change **out of scope** here |
| **D13** | Trial unit defined | C04b； C25 metric alignment **design** | C4 Activity Design |
| **C04a** | Path chosen (Prep/Hybrid/Direct) | C4 **Activity Design** gate re-run | C04b fields if Hybrid/Direct |
| **C04b** | Step/sequence model set | C4 technical spec draft | Implementation (future pass) |
| **C15a** | Model Direct/Prep | C15 governance closure **partial** | C15b content scope |
| **C15b** | Movement/skill scope | Plan Builder **scientific** sign-off C15 | Assessment equating (D04/D09) |
| **D04/D09** | Separation/enforcement | Reporting rules | Auto assessment update |
| **D14** | Generalization rule | Maintenance (D15) planning | Field generalization activities |
| **Per C01–C03…** | Criterion proxy accepted/rejected | **Label** existing media | Changing impl (not this task) |

*«If resolved» = advisor documents choice — **لا** تنبؤ بالخيار.*

---

## 7. Governance Rule

> **لا يتم تحويل `ADVISOR DECISION REQUIRED` إلى `IMPLEMENTED` أو `LOCKED` دون قرار موثّق** (Advisor Decision Packet entry + date + scope).  
> **IMPLEMENTED** الحالي (**L01–L04**) يبقى **product-locked** حتى **D03/D11** (validity) — **≠ SCIENTIFICALLY VALIDATED**.

---

## 8. Row index (R01–R38 → consolidated)

| R# | Matrix decision (short) | → ID |
|----|-------------------------|-----|
| R01 | Prep/Direct/Hybrid defs | D01 |
| R02 | Substitute vs Prep | D02 |
| R03 | Digital = real? | D03 |
| R04 | Prep ↔ TrackedGoal | D06 |
| R05 | Session ↔ assessment | D04 |
| R06 | Goal ↔ autoGoal | D05 (+ C04c) |
| R07 | Trial definition | D13 |
| R08 | Step/sequence C4 | C04b |
| R09 | Accuracy | L01 |
| R10 | Independence | D10 |
| R11 | TrainingPromptLevel | L02 |
| R12 | Reminder | D11 |
| R13 | Reteach/segmentation | D11 |
| R14 | Prompt mapping | D11 |
| R15 | Model replay | D19 |
| R16 | Response time | D12 |
| R17 | masteryLevel thresholds | D08 |
| R18 | Mastery = criterion | D09 |
| R19 | Generalization | D14 |
| R20 | Maintenance | D15 |
| R21 | +1/+2/+5 | D07 |
| R22 | Observer optional/required | D16 |
| R23 | C15 model Direct? | C15a |
| R24 | C15 S1–S3/movements | C15b |
| R25 | C15 S4/S5 protocol | C15c |
| R26 | C4 sequence trial | C04b |
| R27 | C3 receptive vs execute | C03 |
| R28 | C8 AAC | C08 |
| R29 | C6 point+gaze | C06 |
| R30 | C2 orienting | C02 |
| R31 | C1 request | C01 |
| R32 | C11 joint attention | C11 |
| R33 | C25 5 min | C25 |
| R34 | C11/C25 candidates | L03 |
| R35 | difficulty vs levels | D17 |
| R36 | C15 skillIds | L04 |
| R37 | Fidelity gate | D18 |
| R38 | C4 fidelity path | C04a |

---

*v1.0 — Advisor Decision Consolidation 01 — documentation only.*
