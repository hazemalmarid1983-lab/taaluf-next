# C15 — التقليد الحركي والاجتماعي

**حالة الوثيقة:** مواصفة تدريب تآلف — **PROVISIONAL / PENDING SCIENTIFIC REVIEW**  
**الجمهور:** مراجعة المستشار العلمي (د. سامر)  
**نطاق التنفيذ المرجعي:** فصل `motor-social-imitation`، وسيلة `observer-imitation`، بروتوكول `observer-imitation-v1`  
**مرجع منهجي موسّع:** `docs/scientific/TAALOF_TRAINING_METHODOLOGY_v1.0.md` — §39  
**تصنيف المهارات:** `data/training/docs/C15-skill-classification.md`  
**محاذاة Canon ↔ Training (Pass 04):** `data/training/docs/C15-alignment-governance.md`

---

## 1. تعريف المعيار

| الحقل | القيمة (من Canon / `taalof_criteria_v3` كما يُحمَّل في المشروع) |
|--------|------------------------------------------------------------------|
| **criterionId** | `C15` |
| **الاسم العربي** | التقليد الحركي والاجتماعي |
| **السؤال / الوصف** | هل يقلد الطفل حركة بسيطة أو تعبيراً اجتماعياً بعد نموذج مباشر؟ |
| **المجال** | التفاعل والاندماج الاجتماعي واللعب |
| **مستويات التقييم (0–3)** | **0 — مستقر:** يقلد حركات كبيرة وصغيرة وتعبيراً وجهياً بسيطاً بعد النموذج مباشرة. **1 — متوسط:** يقلد الحركة بعد تكرار النموذج أو مع مساعدة جزئية على بدء الحركة. **2 — شديد:** يقلد حركة واحدة مألوفة فقط ويحتاج توجيهاً جسدياً لبقية الحركات. **3 — شديد جداً:** لا يقلد الحركات أو التعابير حتى مع التوجيه الجسدي المتكرر. |
| **autoGoal (Canon)** | أن يقلد الطفل 5 حركات كبيرة مألوفة بعد نموذج واحد بنسبة نجاح 80% خلال 3 أشهر. |
| **recommendation (Canon)** | يُوصى ببرنامج تقليد حركي متدرج (كبير ثم دقيق ثم اجتماعي) ضمن اللعب. |

> **تنبيه:** هذه الأقسام **لا تعيد صياغة** معيار التقييم؛ تنقل ما هو موجود في مصدر المعايير داخل المشروع. التفكيك التدريبي في §39 من المنهجية مُوسَم **PROPOSED / PENDING SCIENTIFIC REVIEW**.

---

## 2. نطاق هذه المواصفة

- تصف **تصميم التدريب الرقمي–الهجين (Hybrid)** في تآلف لمعيار C15، وليست **تعريفًا تشخيصيًا** جديدًا ولا **بديلًا** لأداة التقييم السريري.
- **لا تُ equate** نتائج جلسة `observer-imitation` بإتقان C15 في الحياة اليومية (انظر أيضًا `OBSERVER_IMITATION_SESSION_DISCLAIMER_AR` في الكود).
- Pass 03 **توثيقي/تحليلي** — لا يغيّر محرك C15 ولا `TrainingTrial` ولا مقاييس المنظومة العامة.

---

## 3. المهارات المستهدفة

### Target Skills (ماذا يقلد؟ — قابلة لـ `TrainingPlanAssignment.skillIds`)

| الرمز | skillId | الحركات المربوطة في التنفيذ (Pass 02) |
|--------|---------|----------------------------------------|
| **S1** — التقليد الحركي الإجمالي | `skill-c15-s1-gross` | `hands_up`, `clap`, `wave` |
| **S2** — التقليد الحركي المحدد/الدقيق | `skill-c15-s2-fine` | `touch_nose`, `touch_head` |
| **S3** — التقليد الاجتماعي | `skill-c15-s3-social` | `smile` |

**قواعد الدمج (منفّذة):** S1 فقط → pool S1؛ S2 فقط → pool S2؛ S3 فقط → pool S3؛ اتحاد المجموعات عند اختيار عدة مهارات (`lib/training/c15SkillMovementMap.ts`).

### Progression Dimensions (كيف يُقدَّم التدريب؟ — **غير** Target Skills)

| الرمز | skillId | المعنى التصميمي |
|--------|---------|------------------|
| **S4** | `skill-c15-s4-replay` | محور **إعادة النموذج** (replay) |
| **S5** | `skill-c15-s5-fading` | محور **تلاشي المساعدة** (fading / prompt) |

- **S4/S5 ليستا Target Skills** في Plan Builder / `assignment.skillIds` للخطط الجديدة.
- **لا يتحكمان** في اختيار الحركة في المحرك (Pass 02).
- **لا يوجد** بروتوكول تنفيذي معتمد لـ S4/S5 (لا equating تلقائي بين `modelReplays` ونجاح، ولا بين `promptLevel` وبروتوكول fading).

---

## 4. المهارات الفرعية القابلة للملاحظة

**لا قائمة علمية نهائية هنا** — فقط استنتاج من التنفيذ والمنهجية المُوسَمة مقترحة.

| السلوك / المهمة الفرعية | التصنيف | ملاحظة |
|-------------------------|---------|--------|
| ينتبه إلى النموذج على الشاشة (نص/صوت/رسم توضيحي) | **موجود فعليًا** | مرحلة `model`؛ TTS لـ `movement.titleAr` |
| يشاهد الحركة المعروضة | **موجود فعليًا** | `ObserverImitationModelVisual` + تعليمات «شاهد النموذج» |
| يبدأ التنفيذ بعد عرض النموذج | **موجود فعليًا** | انتقال يدوي «الطفل ينفّذ الحركة»؛ **لا** قياس تلقائي لـ «مباشرة بعد النموذج» |
| يؤدي الحركة المستهدفة (جسديًا خارج الشاشة) | **موجود فعليًا** | مرحلة `perform` — **لا** رؤية حاسوبية للجسم |
| يُسجَّل نجاح/عدم نجاح التقليد | **موجود فعليًا** | قرار المراقب (زر نجح / لم ينجح) |
| يؤدي مع مستوى مساعدة مختلف | **موجود فعليًا** | اختيار `PromptHierarchyLevel` → `promptLevel` |
| إعادة النموذج قبل الاستجابة | **موجود فعليًا** | زر «إعادة النموذج»؛ `modelReplays` على المحاولة |
| يقلّل الاعتماد على المساعدة عبر جلسات | **مقترح تصميميًا** | S5 metadata؛ **لا** fading algorithm |
| تقليد حركات كبيرة / دقيقة / تعبير اجتماعي (Canon level 0) | **يحتاج مراجعة علمية** | مذكور في Canon؛ التطبيق يغطي 6 حركات MVP فقط |
| تقليد «بعد نموذج واحد مباشرة» (level 0) | **يحتاج مراجعة علمية** | Canon؛ التطبيق لا يفرّق latency عن المساعدة (§39 I) |
| تقليد بعد تكرار نموذج (level 1) | **يحتاج مراجعة علمية** | `modelReplays` **≠** `promptLevel` (منفّذ صراحة) |
| دقة شكل الحركة (full/partial/none) | **مقترح تصميميًا** | المنهجية §39 J — **غير** حقول في `TrainingTrial` |
| التعميم / الصيانة | **يحتاج مراجعة علمية** | غير مقاس في النشاط الحالي |

---

## 5. الهدف التدريبي القابل للقياس

### Taaluf Design Hypothesis (مؤقت — **ليس** ادعاءً سريريًا)

> **في جلسة `observer-imitation`، بعد عرض نموذج رقمي (illustration) لحركة مُحددة ضمن pool المهارة المختارة (S1–S3)، يُنفّذ الطفل حركة جسدية مماثلة في بيئة يُراقب فيها أداؤه بشريًا، ويُسجَّل لكل محاولة: نجاح التقليد (correct)، مستوى المساعدة (promptLevel)، زمن من بدء مرحلة التنفيذ حتى فتح شاشة التسجيل (responseTimeMs)، ومعرّف الحركة (movementId).**

**حدود صريحة:**

- **لا** يُفترض أن تحقيق دقة عالية في 5 محاولات على الشاشة = إتقان C15 في اللعب أو المنزل.
- **لا** يُ equate النشاط بـ `autoGoal` Canon (5 كبيرة، 80%، 3 أشهر) دون قرار علمي منفصل.

---

## 6. التدرج

### الموجود فعليًا

| البعد | الوصف |
|--------|--------|
| **difficulty 1–3** | في `config` الافتراضي و`resolveMediaRuntimeConfig`. عند **غياب** `skillIds` على الجلسة: difficulty 1 → حركات `gross` فقط؛ 2 → `gross` + `fine`؛ 3 → كل الحركات الست (`observerImitationCatalog.ts`). |
| **skillIds (S1–S3)** | عند وجود target skills: **movementIdsOverride** من اتحاد S1–S3 **يُقدَّم على** فلتر difficulty (`observerImitationEngine.ts`). |
| **الحركة** | 6 حركات MVP؛ `modelType: illustration`؛ `Temporary MVP Asset`. |
| **مدة النموذج** | `modelDurationMs` / `displayDurationMs` (افتراضي 3500 ms) — **لا** fade تلقائي إلزامي في UX؛ انتقال يدوي. |
| **عدد المحاولات** | `trialCount: 5` (افتراضي الفصل). |
| **المساعدة** | تسجيل المراقب فقط — **لا** اشتقاق من latency أو replays (`observerImitationEngine.ts`, `observerImitationObserverFlow.ts`). |
| **التعزيز** | `reinforcement: true` في config؛ رسائل «أحسنت!» / «نحاول مرة أخرى» (~700 ms). |
| **replay** | `replayAllowed: true`؛ `modelReplays` على المحاولة — **لا** بروتوكول S4. |

### مقترحات مستقبلية (كلها **PROVISIONAL / DESIGN HYPOTHESIS**)

- تعقيد الحركة (novel vs familiar) — Canon يذكر «مألوفة» في `autoGoal`؛ التطبيق لا يفرّق.
- مدة/وضوح النموذج — **DESIGN HYPOTHESIS**
- تأخير بين النموذج والاستجابة كمتغير سريري (`latencyAfterModelMs` في §39 J) — **DESIGN HYPOTHESIS**؛ غير مُنفَّذ كمعيار نجاح.
- تنويع الحركات والسياق — **DESIGN HYPOTHESIS**
- الانتقال إلى نموذج بشري / فيديو — **DESIGN HYPOTHESIS**؛ `ObserverImitationModelType` يدعم `video`/`animated` **دون** أصول نهائية.
- التعميم والصيانة — **ADVISOR DECISION REQUIRED** (§11).

**S4 (replay) و S5 (fading):** أبعاد progression **غير تنفيذية** حاليًا — **PROVISIONAL** حتى بروتوكول معتمد.

---

## 7. النشاط الحالي (Observer Imitation)

**تصنيف الفصل:** Hybrid — «نموذج رقمي ثم تنفيذ جسدي مع تسجيل المراقب» (`motor-social-imitation.json`).

### تدفق الجلسة (UI ↔ منطق)

| المرحلة (مواصفة) | التنفيذ |
|-------------------|---------|
| **WELCOME** | `ObserverImitationActivity` — phase `welcome`؛ `ObserverImitationWelcome` + disclaimer |
| **MODEL** | `ObserverImitationPlayArea` — phase `model` |
| **CHILD_PERFORMS** | phase `perform` |
| **OBSERVER_RECORDS** | phase `observe` — اختيار مستوى المساعدة + نجح/لم ينجح |
| **REINFORCEMENT** | phase `reinforcement` |
| **NEXT_TRIAL** | `commitObserverImitationTrial` → `startObserverImitationTrial` أو إنهاء |
| **COMPLETE** | phase `complete`؛ `calculateSessionMetrics`؛ disclaimer |

**المراقب** هو من يسجل مستوى المساعدة ونجاح التقليد؛ **لا** scoring تلقائي من الكamera أو الحساسات.

**سلسلة البيانات (integrity):**  
`TrainingPlanAssignment.skillIds` → `TrainingSession.skillIds` → `movementIdsOverride` → `settings.trials[].movementId` → `TrainingTrial.movementId` (عند الالتزام).

---

## 8. دلالة مستويات المساعدة

### المستويات المعروضة للمراقب (من `lib/promptHierarchy.ts`)

| المستوى | التسمية العربية في UI |
|---------|------------------------|
| `independent` | مستقل |
| `gestural` | إيمائي |
| `verbal` | لفظي |
| `partial_physical` | جسدي جزئي |
| `full_physical` | جسدي كامل |
| `no_response` | لا يستجيب |

**تخزين:** `PromptHierarchyLevel` → `TrainingPromptLevel` عبر `promptHierarchyToTrainingLevel` (`observerImitationObserverFlow.ts`).

### الفرق بين الحقول على المحاولة

| الحقل | المعنى في التنفيذ |
|--------|-------------------|
| **correct** | `false` إذا `no_response`؛ وإلا قيمة «نجح» من المراقب |
| **promptLevel** | **اختيار المراقب فقط** — لا يُشتق من `modelReplays` أو زمن الانتظار |
| **responseTimeMs** | من بدء phase `perform` حتى التسجيل — **≠** latency بعد انتهاء النموذج بالمعنى السريري في §39 |

> **لم يثبت من المصادر الحالية** أن هذا التسلسل الستّي يمثل ترتيبًا علميًا عالميًا موحّدًا؛ المشروع يستخدمه **للتسجيل الموحّد** مع Home Classroom hierarchy. المنهجية §39 I تفصل **latency ≠ prompting** — **Evidence Base (منهجية داخلية)**.

---

## 9. القياس

### ما تقيسه الجلسة (من `calculateSessionMetrics` + حقول المحاولة)

- **عدد المحاولات** (`totalTrials`)
- **الصحيح / الخاطئ** (`correctCount`, `incorrectCount`, `correct` per trial)
- **الدقة** (`accuracy` — % المحاولات `correct`)
- **الاستقلالية** (`independence` — % محاولات `promptLevel === independent`؛ `trainingIndependencePercentage`)
- **متوسط زمن الاستجابة** (`averageResponseTimeMs` حيث وُجد `responseTimeMs`)
- **توزيع المساعدة** (`promptBreakdown`)
- **نتائج فردية:** `movementId`, `movementCategory`, `modelReplays`, `promptLevel`, `responseTimeMs`, `recordedAt`

**تقدم تقني إضافي (PROVISIONAL indicator):** `TrainingProgress.masteryLevel` من `deriveTrainingMasteryLevel` — **ليس** إتقان C15 سريريًا (`sessionPersistence.ts`).

**ربط الأهداف (Product rule):** `trainingGoalCurrentIncrement` — +1 / +2 / +5 على `TrackedGoal.current` حسب `independence` — **Taaluf Product Rule / Provisional**.

### ما لا تقيسه الجلسة

- التقليد في الحياة اليومية أو اللعب الطبيعي
- التعميم عبر الأشخاص أو البيئات
- دقة شكل الحركة (full/partial) كحقل معياري
- «مباشرة بعد نموذج واحد» بالمعنى المستخدم في level 0 Canon
- التقليد دون وجود مراقب
- الصيانة طويلة المدى
- **الإتقان السريري** لمعيار C15 أو مستواه 0–3 في التقييم

---

## 10. معيار الإتقان

- **`autoGoal` في Canon** (5 كبيرة، 80%، 3 أشهر) **≠** منطق إتقان التطبيق.
- **`deriveTrainingMasteryLevel`:** `mastered` عند ≥3 جلسات مكتملة **و** accuracy ≥80 **و** independence ≥70 — **مؤشر تقدم تقني** معلّق صراحة في التعليقات البرمجية.
- **5/5 correct** في جلسة واحدة **لا تعني** إتقان C15.

| القرار | الحالة |
|--------|--------|
| عدد المحاولات (5) | **MVP design** (config الفصل) |
| نسبة الدقة (80% في masteryLevel) | **تحتاج مراجعة** — اشتقاق تقني |
| نسبة الاستقلالية (70% في masteryLevel) | **تحتاج مراجعة** — تعريف = `independent` فقط |
| ثبات الأداء عبر الجلسات | **يحتاج تعريف** |
| التعميم | **يحتاج تعريف** |
| الصيانة | **يحتاج تعريف** |
| مواءمة `autoGoal` Canon مع التدريب الرقمي | **Advisor Decision Required** |

---

## 11. التعميم

النشاط الحالي يقيس أداءً **داخل بيئة رقمية مهيأة** مع **تنفيذ جسدي مراقَب**؛ **لا** يقيس تعميمًا.

| مسار مقترح | الحالة |
|------------|--------|
| **A. داخل النشاط الرقمي** (حركات/سياقات جديدة، difficulty) | **DESIGN HYPOTHESIS** — جزء من difficulty/pool موجود |
| **B. مع نموذج بشري** | **ADVISOR DECISION REQUIRED** — §39 H: Direct vs Preparatory |
| **C. شخص/سياق مختلف** | **ADVISOR DECISION REQUIRED** |
| **D. نشاط طبيعي / لعب** | **ADVISOR DECISION REQUIRED** — `recommendation` Canon |
| **E. متابعة الصيانة** | **ADVISOR DECISION REQUIRED** — §39 M |

**لا تنفيذ** لأي مسار في Pass 03.

---

## 12. التكيّف (Adaptation)

### ما يمكن للتطبيق «معرفته» من بيانات الجلسة

- الدقة والاستقلالية وتوزيع `promptLevel`
- `responseTimeMs` (تعريف UX أعلاه)
- `movementId` / `movementCategory` per trial
- `modelReplays` per trial
- `skillIds` على الجلسة وربطها بـ pool الحركة (Pass 02)
- `difficulty`, `completedSessions`, `masteryLevel` التقني

### ما لا يستطيع إثباته من تلقاء نفسه

- انتقال المهارة إلى المنزل أو المدرسة
- التقليد مع شخص جديد أو بدون شاشة
- التعميم الاجتماعي (C16 territory)
- أن illustration = «نموذج مباشر» بالمعنى السريري الكامل

**أي منطق adaptation مستقبلي** (اختيار حركة تلقائي، رفع difficulty، fading) = **Design Hypothesis** حتى اعتماد علمي.

---

## 13. Evidence Base / Design Hypothesis / Advisor Decision Required

| العنصر | التصنيف | السبب / المصدر |
|--------|---------|----------------|
| C15 = تقليد حركة/تعبير **بعد نموذج مباشر** | **Evidence Base** | Canon — question، levels، §39 A |
| مستويات 0–3 (نموذج/مساعدة/توجيه) | **Evidence Base** | Canon levels — **تطبيق التدريب لا ي mapها آلياً** |
| `autoGoal` (5 كبيرة، 80%، 3 أشهر) | **Evidence Base (Canon)** + **Advisor Decision** لتطبيقها رقمياً | Canon + §39 K |
| `recommendation` (كبير → دقيق → اجتماعي) | **Evidence Base (Canon)** | recommendation |
| النمذجة قبل الاستجابة | **Evidence Base** | جوهر السؤال؛ §39 B |
| Hybrid: نموذج رقمي + تنفيذ جسدي مرصود | **Evidence Base (منهجية §39 H)** + **Advisor Decision** لـ Direct/Preparatory | `motor-social-imitation.json`؛ §39 |
| latency ≠ prompting | **Evidence Base (منهجية §39 I)** | مذكور صراحة؛ منفّذ جزئياً (لا auto-prompt) |
| S1/S2/S3 كتقسيم تشغيلي | **Taaluf Design Model** | `c15SkillClassification.ts`؛ JSON `c15SkillModel` — **PROVISIONAL** |
| ربط S1–S3 بـ 6 movementIds | **Taaluf Design Hypothesis** | `c15SkillMovementMap.ts` — MVP set |
| difficulty 1–3 → فئات gross/fine/social | **Taaluf Design** | `observerImitationCatalog.ts` |
| 5 محاولات / session | **Taaluf Design (MVP)** | `config.trialCount` |
| illustration كنموذج | **Taaluf Design Hypothesis** | §39: فيديو/avatar = قرار مفتوح |
| `modelReplays` | **Taaluf Design (تسجيل)** | **≠** S4 protocol |
| `promptLevel` observer | **Taaluf Design (تسجيل)** | **≠** S5 fading protocol |
| +1/+2/+5 على TrackedGoal | **Taaluf Product Rule / Provisional** | `goalFeedback.ts` |
| `masteryLevel` emerging→mastered | **Taaluf Product Rule / Provisional** | `deriveTrainingMasteryLevel` |
| mastery threshold (80/70/3 sessions) | **Advisor Decision Required** | لا يطابق `autoGoal` كاملاً |
| generalization / maintenance | **Advisor Decision Required** | §39 L–M؛ §39 N |
| observer-imitation = Direct training للمعيار أم أداة فرعية؟ | **Advisor Decision Required** | §39 H؛ disclaimer الجلسة |
| حدود C14 / C16 | **Advisor Decision Required** | §39 C، N |
| Subskills في §39 E | **PROPOSED في المنهجية** | **ليس** Canon خام |

**مراجع خارجية (أدبيات ABA/نمذجة):** **لم يثبت من المصادر الحالية في المشروع — يحتاج مراجعة/مصدرًا** إن طُلب اقتباس académique.

---

## 14. المخاطر العلمية / التفسيرية

- نجاح داخل الشاشة **قد لا يعكس** الأداء في اللعب أو مع أقران.
- **promptLevel** و**correct** يعتمدان على **حكم المراقب** — variance بين مراقبين.
- **responseTimeMs** لا يساوي «استجابة مباشرة بعد النموذج» في Canon level 0.
- **6 حركات** لا تمثل مجال التقليد الكامل (كبير+صغير+وجه+اجتماعي على نطاق level 0).
- **التعميم** غير مقاس.
- **5 محاولات × جلسة** و**3 جلسات → mastered** قرارات **MVP** — **ليست** معيارًا علميًا مثبتًا.
- equating **digital progress** بـ **C15 level 0** خطر **False positive** (§39 methodology tensions).
- **S4/S5** في metadata قد يُساء فهمهما كمهارات مُقاسة — mitigated في Pass 01/02 docs.

---

## 15. قرارات مطلوبة من د. سامر

1. **اعتماد S1/S2/S3** كتقسيم تشغيلي أم تعديله (أسماء، حدود gross/fine/social)؟
2. **المهارات الفرعية** القابلة للملاحظة التي يجب اعتمادها رسميًا في التقارير؟
3. **الهدف التدريبي التشغيلي** — هل صيغة Taaluf Design Hypothesis في §5 كافية أم تُستبدل؟
4. **معيار mastery** — `autoGoal` Canon vs `deriveTrainingMasteryLevel` vs level 0 (كبير+صغير+وجه+مباشرة)؟
5. **تعريف الاستقلالية** — هل `independent` في hierarchy = استقلالية level 0 Canon؟
6. **شروط الانتقال** بين difficulty 1–3 (أو إلغاء difficulty لصالح skillIds فقط)؟
7. **متى** الانتقال من النموذج الرقمي (illustration) إلى **نموذج بشري** — Direct vs Preparatory؟
8. **شروط التعميم** (A→E في §11)؟
9. **شروط maintenance** بعد mastery؟
10. **observer-imitation:** تدريب **مباشر** للمعيار C15 أم **أداة تدريب** لمهارات فرعية مرتبطة؟
11. **equating** `modelReplays` / level 1 Canon (تكرار نموذج)؟
12. **equating** جلسة واحدة 100% accuracy ب**تحديث goal +5** — هل مقبول سريريًا؟

---

*آخر مراجعة توثيقية: C15 Pass 03 — Skill-to-Content integrity مذكور في §7؛ لا تغيير تنفيذي في هذا Pass.*
