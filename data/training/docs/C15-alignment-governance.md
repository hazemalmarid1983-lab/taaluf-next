# C15 — Canon ↔ Training Alignment & Governance Audit

**Pass 04 — توثيق فقط**  
**التاريخ المرجعي للمصادر:** `taalof_criteria_v3.json`، `motor-social-imitation.json`، كود `observer-imitation-v1`، `C15-training-specification.md`، `TAALOF_TRAINING_METHODOLOGY_v1.0.md` §39  

**تصنيفات مستخدمة (واحد لكل صف في «حالة الحوكمة»):**

| التصنيف | المعنى |
|---------|--------|
| **CANON** | موجود في Canon التقييم (`taalof_criteria_v3`) ولا يُ equate تلقائياً بتدريب |
| **IMPLEMENTED TRAINING** | منفّذ في تدريب تآلف وموثّق في الكود/JSON |
| **TAALUF DESIGN HYPOTHESIS** | قرار تصميم تآلف (قد يكون منفّذاً جزئياً) — **ليس** Canon |
| **PROVISIONAL PRODUCT RULE** | قاعدة منتج/تخزين مؤقتة — **ليس** إتقان سريري |
| **ADVISOR DECISION REQUIRED** | Canon و/أو المنهجية يقولان شيئاً والتطبيق شيئاً آخر، أو العلاقة غير محسومة |
| **NOT IMPLEMENTED** | مذكور في Canon/المنهجية ولا مسار تدريب منفّذ له |

**مبدأ:** لا حل للتناقضات هنا — تسجيل فقط.  
**عمود «حالة الحوكمة»:** تصنيف **واحد**؛ عند تعارض Canon ↔ Training يُستخدم **ADVISOR DECISION REQUIRED** (التفاصيل في عمودي Canon/Taaluf).

---

## مصفوفة المحاذاة

| # | المحور | Canon / Assessment (`taalof_criteria_v3` + §39 حيث يُنقل Canon) | Taaluf Training (`motor-social-imitation` + `observer-imitation`) | حالة الحوكمة |
|---|--------|------------------------------------------------------------------|-------------------------------------------------------------------|--------------|
| **1** | **تعريف C15** | `id` C15؛ الاسم «التقليد الحركي والاجتماعي»؛ السؤال: «هل يقلد الطفل حركة بسيطة أو تعبيراً اجتماعياً بعد نموذج مباشر؟»؛ المجال: التفاعل والاندماج الاجتماعي واللعب. | الفصل `criterionIds: ["C15"]`؛ الوسيلة `observer-imitation`؛ وصف Hybrid: نموذج رقمي → تنفيذ جسدي → تسجيل مراقب؛ disclaimer: لا equating بإتقان C15 (`observerImitationResultsPresentation.ts`). | **CANON** |
| **2** | **مستويات Canon (0–3)** | **0:** كبير+صغير+وجه **مباشرة** بعد النموذج. **1:** بعد **تكرار** النموذج أو **مساعدة جزئية** على البدء. **2:** حركة **واحدة** مألوفة + توجيه جسدي لبقية الحركات. **3:** لا تقليد حتى توجيه جسدي متكرر. | **لا** تُشتق `TrainingSession` أو `TrainingProgress` إلى level 0–3؛ **لا** حقل criterion level في محاولات C15. | **ADVISOR DECISION REQUIRED** |
| **3** | **autoGoal / recommendation** | **autoGoal:** 5 حركات **كبيرة مألوفة**، **نموذج واحد**، **80%**، **3 أشهر**. **recommendation:** برنامج متدرج **كبير → دقيق → اجتماعي** ضمن **اللعب**. | `goalLinks` تسمّي أهدافاً مرتبطة بـ S1–S5؛ `TrackedGoal` يُحدَّث بـ `applyTrainingSessionToTrackedGoals` **دون** نص `autoGoal` حرفياً؛ التدرج S1→S2→S3 **تصميمي** في JSON/skills وليس «ضمن اللعب» كبيئة. | **CANON** للنصين. التدريب **لا ينفّذ** `autoGoal` كهدف قابل للتحقق: **ADVISOR DECISION REQUIRED**. |
| **4** | **توقعات Canon للحركة/المحتوى** | Canon **لا يسمّي** حركات (`hands_up`…); يذكر: حركة **بسيطة**، **تعبير اجتماعي**، level 0: **كبير+صغير+وجه**، `autoGoal`: **كبيرة مألوفة** (5). §39 (PROPOSED): gross / fine / facial / social — **ليس** نص Canon خام. | 6 `movementIds` ثابتة؛ `Temporary MVP Asset`; `modelType: illustration`; `movementIds` في JSON + `c15SkillMovementMap.ts`. | Canon: **CANON** (وصف نوعي). المحتوى الست: **TAALUF DESIGN HYPOTHESIS** + **IMPLEMENTED TRAINING**. المحاذاة: **ADVISOR DECISION REQUIRED**. |
| **5** | **Taaluf S1 / S2 / S3** | Canon **لا يستخدم** skillIds S1–S3؛ §39 E subskills **مقترحة** في المنهجية (PROPOSED). | `skill-c15-s1-gross` / `s2-fine` / `s3-social`؛ Target Skills في `c15SkillClassification.ts`؛ Plan `skillIds`؛ pool حركة Pass 02. | **TAALUF DESIGN HYPOTHESIS** (منفّذ). مقابل Canon: **ADVISOR DECISION REQUIRED** (اعتماد التقسيم). |
| **6** | **Taaluf S4 / S5 (progression)** | Canon level **1** يذكر **تكرار النموذج** و**مساعدة جزئية** — **ليس** skillIds S4/S5. | S4 replay / S5 fading في `skills[]` و`goalLinks`؛ **لا** `assignment.skillIds`؛ **لا** بروتوكول؛ `modelReplays` ≠ S4 success؛ `promptLevel` ≠ S5 fading. | **TAALUF DESIGN HYPOTHESIS** (metadata). Canon conditions: **CANON**. بروتوكول progression: **NOT IMPLEMENTED**. **ADVISOR DECISION REQUIRED**. |
| **7** | **الحركات الست** | لا قائمة حركات في `taalof_criteria_v3`. | `hands_up`, `clap`, `wave`, `touch_nose`, `touch_head`, `smile` — catalog + JSON. | **IMPLEMENTED TRAINING**. مرجع Canon: **ADVISOR DECISION REQUIRED** (هل تمثل level 0 / `autoGoal`؟). |
| **8** | **difficulty 1–3** | Canon **لا يعرّف** difficulty 1–3 للمعيار (مستويات 0–3 = **شدة تقييم**). | `difficultyLevels: [1,2,3]`؛ `listObserverImitationMovementsForDifficulty`: 1=gross، 2=gross+fine، 3=الكل؛ يُتجاوَز بـ `skillIds` override. | **TAALUF DESIGN HYPOTHESIS** + **IMPLEMENTED TRAINING**. **ADVISOR DECISION REQUIRED** (لا equating مع levels 0–3). |
| **9** | **observer-controlled prompting** | level **1:** مساعدة **جزئية على بدء** الحركة؛ level **2–3:** توجيه **جسدي** (Canon). §39 I: `promptLevel` رقمي ≠ بالضرورة Canon assistance taxonomy. | المراقب يختار `PromptHierarchyLevel` → `promptLevel`؛ **لا** اشتقاق تلقائي (`observerImitationObserverFlow.ts`). | **IMPLEMENTED TRAINING**. مواءمة مع Canon levels: **ADVISOR DECISION REQUIRED**. |
| **10** | **modelReplays** | level **1:** تقليد **بعد تكرار النموذج**. §39: `modelRepeated` ≠ Mastery؛ latency ≠ prompt. | زر إعادة النموذج؛ `modelReplays` على `TrainingTrial`؛ **صريح:** لا mapping إلى `promptLevel`. | **IMPLEMENTED TRAINING** (تسجيل). Canon «تكرار»: **CANON**. العلاقة replay ↔ prompting ↔ level 1: **ADVISOR DECISION REQUIRED**. |
| **11** | **5 محاولات** | `autoGoal`: **5 حركات** على **3 أشهر** (فرص/opportunities — §39 K: تعريف opportunity **مفتوح**). | `trialCount: 5` **لكل جلسة** (`motor-social-imitation.json` config). | **IMPLEMENTED TRAINING** (5/session). Canon **5 movements / 80% / 3 months**: **CANON**. **ADVISOR DECISION REQUIRED** (لا equating). |
| **12** | **accuracy** | §39 J (PROPOSED): `imitationAccuracy` — **ليس** حقل Canon خام. التقييم السريري: دقة تقليد **qualitative** في levels. | `% trials` مع `correct === true` (`calculateSessionMetrics`). | **IMPLEMENTED TRAINING**. كـ proxy لـ C15: **ADVISOR DECISION REQUIRED**. |
| **13** | **independence** | level **0:** بعد نموذج **مباشرة** **دون** تكرار/مساعدة (§39 B، G). | `%` محاولات `promptLevel === independent` (`trainingIndependencePercentage`). | **IMPLEMENTED TRAINING**. كـ independence Canon level 0: **ADVISOR DECISION REQUIRED**. |
| **14** | **responseTimeMs** | §39 I: **`latencyAfterModelMs`** — تأخر بعد النموذج؛ **≠** prompting؛ level 0 «**مباشرة**». | من بدء phase `perform` حتى التسجيل (UX) — **≠** latency بعد انتهاء النموذج. | **IMPLEMENTED TRAINING** (تعريف UX). Canon latency: **NOT IMPLEMENTED**. **ADVISOR DECISION REQUIRED**. |
| **15** | **masteryLevel** | Canon: **لا** `masteryLevel` في JSON؛ §39 K: `autoGoal` + **level 1 ≠ Mastery**؛ §39: Substitute/Preparatory **≠** Mastery C15. | `deriveTrainingMasteryLevel`: ≥3 جلسات + accuracy≥80 + independence≥70 → `mastered`؛ تعليقات: **progress indicator فقط** (`sessionPersistence.ts`). | **PROVISIONAL PRODUCT RULE**. إتقان C15 Canon: **CANON** (via assessment). **ADVISOR DECISION REQUIRED** (ممنوع equating `mastered` بـ C15). |
| **16** | **+1 / +2 / +5 goal progress** | Canon **لا يذكر** increments على أهداف منتج. | `trainingGoalCurrentIncrement`: independence≥70 → +5؛ ≥40 → +2؛ else +1 (`goalFeedback.ts`). | **PROVISIONAL PRODUCT RULE**. علاقة بـ `autoGoal` / C15: **ADVISOR DECISION REQUIRED**. |
| **17** | **generalization** | §39 L (PROPOSED): مألوف→جديد، شخص/بيئة، كبير→دقيق→اجتماعي؛ **بعد** Mastery. | **لا** نشاط/ metric / plan step للتعميم في C15. | **NOT IMPLEMENTED** (تدريب). Canon/منهجية: **ADVISOR DECISION REQUIRED** (تعريف ومسار). |
| **18** | **maintenance** | §39 M (PROPOSED): متابعة في لعب/روتين؛ **≠** drill محدود؛ مراقبة عودة level 2–3. | **لا** مسار maintenance منفّذ لـ C15. | **NOT IMPLEMENTED** (تدريب). **ADVISOR DECISION REQUIRED**. |
| **19** | **نتيجة التدريب ↔ حالة تقييم C15** | حالة C15 = **level 0–3** من **assessment** (خارج محرك التدريب في هذا النطاق). | `TrainingSession` + `TrainingProgress` + optional `TrackedGoal` — **لا** كتابة إلى سجل تقييم C15/Tanawum في مسار observer-imitation. | **ADVISOR DECISION REQUIRED**. التدريب: **IMPLEMENTED TRAINING** (بيانات جلسة). التقييم: **CANON** (منفصل). |

---

## ملخص التعارضات المسجّلة (بدون حل)

| موضوع | Canon / المنهجية | Taaluf Training |
|--------|------------------|-----------------|
| محتوى الحركة | نوعي (كبير/صغير/وجه/اجتماعي؛ 5 كبيرة في autoGoal) | 6 IDs + S1/S2/S3 mapping |
| الإتقان | level 0 + `autoGoal` + assessment | `masteryLevel` + disclaimer جلسة |
| المساعدة vs replay | level 1 يجمع تكرار نموذج **و** مساعدة جزئية | `modelReplays` منفصل عن `promptLevel` |
| «مباشرة» | level 0 | `responseTimeMs` (تعريف UX مختلف) |
| الهدف | `autoGoal` نصي | 5 trials/session + goal increments |
| S4/S5 | مفاهيم في level 1 / progression | metadata فقط |

---

## Critical Governance Decisions

*قرارات يجب أن يراجعها د. سامر **قبل** اعتماد C15 كمرجع حوكمة لتصميم بقية المعايير.*

1. **هل يُسمح بربط `criterionIds: C15` على وسيلة تدريب Hybrid (illustration + observer) دون قرار Direct vs Preparatory؟** (§39 H؛ «نموذج مباشر» في Canon.)

2. **اعتماد S1/S2/S3 والحركات الست كتمثيل تشغيلي لـ Canon** (كبير/دقيق/اجتماعي) **أم** اعتبارها MVP لا تغطي level 0 ولا `autoGoal`؟

3. **هل `TrainingProgress.masteryLevel === mastered` يُمنع لغوياً/منتجياً من أي equating بـ C15 level 0 أو `autoGoal`؟** (thresholds 80/70/3 جلسات — **PROVISIONAL PRODUCT RULE**.)

4. **تعريف العلاقة بين `modelReplays` و level 1 Canon (تكرار النموذج)** — هل يبقى منفصلاً عن `promptLevel` أم يُطلب بروتوكول S4 موحّد؟

5. **هل نتائج جلسة observer-imitation تُسمح أن تُحدّث `TrackedGoal` (+1/+2/+5) دون مسار assessment؟** (فصل التدريب عن التقييم — §19.)

6. **معيار الهدف التدريبي المعتمد:** `autoGoal` Canon vs هدف Taaluf Design Hypothesis (§5 في `C15-training-specification.md`) vs كلاهما مع labels مختلفة.

7. **متى يُطلب Generalization / Maintenance كبوابة قبل «mastered» product؟** (حالياً **NOT IMPLEMENTED** — خطر over-claim.)

8. **هل difficulty 1–3 تبقى محور تدرج منتج مستقل عن assessment levels 0–3؟** (منع الخلط في واجهات التقارير والـ Bridge مستقبلاً.)

9. **حدود C15 vs C14 (pretend) vs C16 (social response)** عند اختيار «smile» كحركة S3 — **False positive** في §39.

10. **هل observer-imitation يُصنَّف رسمياً:** تدريب **مباشر** للمعيار C15، أم **أداة فرعية** Preparatory لا تُحدّث ادعاءات تقييم؟

---

## مراجع داخل المشروع

| مصدر | استخدام في هذه الوثيقة |
|------|-------------------------|
| `data/taalof_criteria_v3.json` | Canon C15 (§1–3، 4 جزئياً) |
| `data/training/chapters/motor-social-imitation.json` | Taaluf chapter/media/config |
| `data/training/docs/C15-training-specification.md` | Pass 03 — تفصيل تنفيذي |
| `data/training/docs/C15-skill-classification.md` | S1–S3 vs S4–S5 |
| `docs/scientific/TAALUF_TRAINING_METHODOLOGY_v1.0.md` §39 | نقل Canon + **PROPOSED** (يُوسَم؛ ليس Canon خام) |
| `lib/training/c15SkillClassification.ts` | Target vs progression |
| `lib/training/c15SkillMovementMap.ts` | S1–S3 → movements |
| `lib/training/observerImitationEngine.ts` | trials, skillIds, no auto prompt |
| `lib/training/observerImitationSessionFlow.ts` | session.skillIds → settings |
| `lib/training/observerImitationResultsPresentation.ts` | disclaimer جلسة |
| `lib/training/sessionPersistence.ts` | masteryLevel |
| `lib/training/goalFeedback.ts` | +1/+2/+5 |

**Pass 04:** لا تغيير كود. للمواصفة التفصيلية: [`C15-training-specification.md`](./C15-training-specification.md).
