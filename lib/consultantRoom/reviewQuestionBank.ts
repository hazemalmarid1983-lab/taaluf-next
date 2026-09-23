import type { ReviewQuestionDefinition } from '@/lib/consultantRoom/types';

/** بنك أسئلة المراجعة — مستخرج من TAALOF_TRAINING_METHODOLOGY_v1.0.md (C1–C34) */
export const REVIEW_QUESTION_BANK: readonly ReviewQuestionDefinition[] = [
  {
    id: 'screening-thresholds',
    sectionId: 'general-principles',
    question:
      'هل منطق عتبات الفرز (متوازن / متوسط / مرتفع) وتوزيع الأسئلة على الأبعاد الأربعة يتوافق مع الممارسة التربوية المعترف بها؟',
    responseType: 'yes_no',
  },
  {
    id: 'disclaimer-language',
    sectionId: 'safety-scientific-boundaries',
    question:
      'هل لغة «ملامح» و«مؤشرات» و«استراتيجيات» — بدلاً من «تشخيص» — كافية وواضحة في كل التقارير؟',
    responseType: 'yes_no',
  },
  {
    id: 'canon-validity',
    sectionId: 'goals-criteria-measurement',
    question:
      'هل صياغة المعايير في المصدر القانوني JSON (C1–C40) ومستوياتها (٠–٣)، ضمن نطاق المراجعة المنهجية الحالية (C1–C34)، تعكس بدقة الممارسات التربوية–التأهيلية المعتمدة؟',
    responseType: 'yes_no',
  },
  {
    id: 'fusion-weights',
    sectionId: 'goals-criteria-measurement',
    question:
      'هل أوزان دمج درجات المختص والأهل والألعاب (٢ : ١ : ١.٥) منطقية منهجياً؟',
    responseType: 'yes_no',
  },
  {
    id: 'goal-generation',
    sectionId: 'goals-criteria-measurement',
    question:
      'هل منطق توليد أهداف SMART من البنود ≥٢ وصياغتها التربوية مناسبان للمتابعة الأسبوعية؟',
    responseType: 'yes_no',
  },
  {
    id: 'gas-scale',
    sectionId: 'goals-criteria-measurement',
    question:
      'هل مقياس GAS المستخدم لمقارنة التقدم بين الجلسات مناسب للسياق التربوي لمنصة تآلف؟',
    responseType: 'yes_no',
  },
  {
    id: 'iep-approval',
    sectionId: 'goals-criteria-measurement',
    question:
      'ما معايير الاعتماد العلمي المقترحة لخطط IEP قبل اعتبارها جاهزة للاستخدام الميداني؟',
    responseType: 'review_note',
  },
  {
    id: 'training-activities',
    sectionId: 'digital-real-training',
    question:
      'هل أنشطة الانتباه والتركيز وربطها بخطط التدريب يتوافق مع المنهجية العلاجية المتوقعة؟',
    responseType: 'yes_no',
  },
  {
    id: 'sensory-metrics',
    sectionId: 'safety-scientific-boundaries',
    question:
      'ما المقاييس العلمية المناسبة لتسجيل استجابة الطفل في الغرف الحسية التجريبية؟',
    responseType: 'review_note',
  },
  {
    id: 'merhid-boundaries',
    sectionId: 'safety-scientific-boundaries',
    question:
      'ما الحدود العلمية والأخلاقية المناسبة لدور مرشد تآلف (Merhid) في دعم المستشار والمختص؟',
    responseType: 'review_note',
  },
  {
    id: 'GENERAL-03',
    sectionId: 'general-principles',
    question:
      'هل يُطبَّق مبدأ Criterion–Behavior Fidelity (§5.2) بشكل صارم لمنع ادعاء قياس المعيار من نشاط تمهيدي؟',
    responseType: 'yes_no',
  },
  {
    id: 'GENERAL-04',
    sectionId: 'general-principles',
    question:
      'هل يُمنع تحويل autoGoal تلقائيًا إلى Mastery دون قرار علمي صريح من المستشار؟',
    responseType: 'yes_no',
  },
  {
    id: 'DIGITAL-02',
    sectionId: 'digital-real-training',
    question:
      'هل التصنيف Direct / Preparatory / Substitute / Hybrid مقترح بشكل متسق عبر المعايير C1–C34؟',
    responseType: 'yes_no',
  },
  {
    id: 'DIGITAL-03',
    sectionId: 'digital-real-training',
    question:
      'هل يُسمح للنشاط الرقمي بالادعاء Direct Mastery دون تحقق في سياق حقيقي آمن؟',
    responseType: 'yes_no',
  },
  {
    id: 'SAFETY-03',
    sectionId: 'safety-scientific-boundaries',
    question:
      'هل تُمنع المنصة من إثارة ضيق حسي أو نوبات غضب عمدًا بهدف القياس (C32/C33/C34)؟',
    responseType: 'yes_no',
  },
  {
    id: 'SAFETY-04',
    sectionId: 'safety-scientific-boundaries',
    question:
      'هل تُسجَّل حقول القياس السلوكي المقترحة كوصفية غير تشخيصية ولا تُستخدم كمعيار سريري؟',
    responseType: 'yes_no',
  },
  {
    id: 'C1-01',
    sectionId: 'social-cognitive',
    criterionId: 'C1',
    question:
      'صحة تفكيك Subskills (6 عناصر مقترحة)',
    responseType: 'review_note',
  },
  {
    id: 'C1-02',
    sectionId: 'social-cognitive',
    criterionId: 'C1',
    question:
      'تحويل autoGoal إلى معايير إتقان تشغيلية',
    responseType: 'review_note',
  },
  {
    id: 'C1-03',
    sectionId: 'social-cognitive',
    criterionId: 'C1',
    question:
      'إمكانية تدريب «الطلب الوظيفي» عبر أنشطة رقمية فقط vs الحاجة لتدريب ميداني',
    responseType: 'review_note',
  },
  {
    id: 'C1-04',
    sectionId: 'social-cognitive',
    criterionId: 'C1',
    question:
      'بروتوكول تسجيل المساعدة البشرية (حث لفظي/إشاري)',
    responseType: 'review_note',
  },
  {
    id: 'C1-05',
    sectionId: 'social-cognitive',
    criterionId: 'C1',
    question:
      'تعريف تشغيلي لـ request_modality وربطه بالقياس',
    responseType: 'review_note',
  },
  {
    id: 'C1-06',
    sectionId: 'social-cognitive',
    criterionId: 'C1',
    question:
      'معايير التعميم والمحافظة',
    responseType: 'review_note',
  },
  {
    id: 'C2-01',
    sectionId: 'social-cognitive',
    criterionId: 'C2',
    question:
      'صحة تفكيك Subskills (4 عناصر مقترحة)',
    responseType: 'review_note',
  },
  {
    id: 'C2-02',
    sectionId: 'social-cognitive',
    criterionId: 'C2',
    question:
      'Criterion–Behavior Fidelity — تصنيف الأنشطة الرقمية كتمهيدية',
    responseType: 'review_note',
  },
  {
    id: 'C2-03',
    sectionId: 'social-cognitive',
    criterionId: 'C2',
    question:
      'Turn AND Look: هل النجاح في C2 يتطلب كليهما أم توجد حالات يُقبل فيها أحدهما؟',
    responseType: 'review_note',
  },
  {
    id: 'C2-04',
    sectionId: 'social-cognitive',
    criterionId: 'C2',
    question:
      'بروتوكول تسجيل المساعدة البشرية (تكرار، رفع صوت، لمس، معزز)',
    responseType: 'review_note',
  },
  {
    id: 'C2-05',
    sectionId: 'social-cognitive',
    criterionId: 'C2',
    question:
      'تعريف تشغيلي لـ turn / look وربطهما بالقياس',
    responseType: 'review_note',
  },
  {
    id: 'C2-06',
    sectionId: 'social-cognitive',
    criterionId: 'C2',
    question:
      'معايير التعميم والمحافظة',
    responseType: 'review_note',
  },
  {
    id: 'C3-01',
    sectionId: 'social-cognitive',
    criterionId: 'C3',
    question:
      'صحة تفكيك Subskills (7 عناصر مقترحة)',
    responseType: 'review_note',
  },
  {
    id: 'C3-02',
    sectionId: 'social-cognitive',
    criterionId: 'C3',
    question:
      'Criterion–Behavior Fidelity — Digital receptive vs Real-world execution',
    responseType: 'review_note',
  },
  {
    id: 'C3-03',
    sectionId: 'social-cognitive',
    criterionId: 'C3',
    question:
      'تعريف instructionId / instructionType / executionOutcome',
    responseType: 'review_note',
  },
  {
    id: 'C3-04',
    sectionId: 'social-cognitive',
    criterionId: 'C3',
    question:
      'Hybrid — حدود التدريب الرقمي الاستقبالي vs التنفيذ الواقعي',
    responseType: 'review_note',
  },
  {
    id: 'C3-05',
    sectionId: 'social-cognitive',
    criterionId: 'C3',
    question:
      'بروتوكول المساعدة البشرية (تكرار، إشارة، توجيه جسدي)',
    responseType: 'review_note',
  },
  {
    id: 'C3-06',
    sectionId: 'social-cognitive',
    criterionId: 'C3',
    question:
      'معايير التعميم والمحافظة',
    responseType: 'review_note',
  },
  {
    id: 'C4-01',
    sectionId: 'social-cognitive',
    criterionId: 'C4',
    question:
      'Criterion–Behavior Fidelity:: هل يُقبل أي نشاط رقمي كقياس Direct لـ C4؟ أم Hybrid إلزامي مع تنفيذ فعلي متسلسل؟ (Direct vs Preparatory vs Digital Substitute)',
    responseType: 'review_note',
  },
  {
    id: 'C4-02',
    sectionId: 'social-cognitive',
    criterionId: 'C4',
    question:
      'تعريف النجاح التشغيلي:: «بالترتيب الصحيح» + «تعليمتان مألوفتان» + «دون تذكير» — ترجمة تشغيلية إلى Trial/Mastery وبروتوكول الجداول البصرية',
    responseType: 'review_note',
  },
  {
    id: 'C4-03',
    sectionId: 'social-cognitive',
    criterionId: 'C4',
    question:
      'نطاق التسلسل:: البدء بخطوتين (autoGoal) vs «فأكثر» في الاسم/السؤال — متى يُوسَّع إلى 3+ خطوات؟',
    responseType: 'review_note',
  },
  {
    id: 'C5-01',
    sectionId: 'social-cognitive',
    criterionId: 'C5',
    question:
      'Criterion–Behavior Fidelity:: ما الذي يُعد Direct لـ C5؟ (إنتاج منطوق/AAC في تواصل) vs Preparatory/Substitute (ترتيب كلمات/اختيار جملة) — وهل Hybrid إلزامي؟',
    responseType: 'review_note',
  },
  {
    id: 'C5-02',
    sectionId: 'social-cognitive',
    criterionId: 'C5',
    question:
      'نطاق الوظائف في الإتقان:: autoGoal (طلب/وصف) vs السؤال/المستوى 0 (+ رفض) — مسألة قرار علمي — لا تُصحَّح في JSON',
    responseType: 'review_note',
  },
  {
    id: 'C5-03',
    sectionId: 'social-cognitive',
    criterionId: 'C5',
    question:
      'AAC وتعريف «الجملة الوظيفية»:: vocal فقط؟ AAC؟ إشارة + كلمة؟ «مقاطع غير مكتملة» (2) — حدود wordCount / sentenceFunctional',
    responseType: 'review_note',
  },
  {
    id: 'C6-01',
    sectionId: 'social-cognitive',
    criterionId: 'C6',
    question:
      'Criterion–Behavior Fidelity + Direct vs Preparatory:: هل أي نشاط رقمي = Direct لـ C6؟ أم Hybrid/Human-mediated إلزامي لإثبات إشارة + نظر للراشد (وتبادل النظر في المستوى 0)؟',
    responseType: 'review_note',
  },
  {
    id: 'C6-02',
    sectionId: 'social-cognitive',
    criterionId: 'C6',
    question:
      'نطاق autoGoal vs السؤال:: autoGoal (شيء + نظر) vs السؤال (+ لفت انتباه) — قرار علمي مفتوح — لا تُصحَّح في JSON',
    responseType: 'review_note',
  },
  {
    id: 'C6-03',
    sectionId: 'social-cognitive',
    criterionId: 'C6',
    question:
      'تبادل النظر / انتباه مشترك:: هل «النظر للراشد» (autoGoal) = «يحول نظره بين الشيء والراشد» (0)؟ وكيف يُقاس تشغيليًا — بشري vs رقمي؟',
    responseType: 'review_note',
  },
  {
    id: 'C7-01',
    sectionId: 'social-cognitive',
    criterionId: 'C7',
    question:
      'Criterion–Behavior Fidelity + Delivery Model:: هل أي نشاط رقمي = Direct لـ C7؟ أم Hybrid/Human-mediated إلزامي لإثبات حوار متعدد الدورات مع مبادرة وملاءمة سياق؟',
    responseType: 'review_note',
  },
  {
    id: 'C7-02',
    sectionId: 'social-cognitive',
    criterionId: 'C7',
    question:
      'نطاق autoGoal vs السؤال/المستويات:: «أكثر من دورة» vs «دورتين»؛ «سؤال/جواب أو تعليق/رد» vs «إجابة ثم تعليق أو سؤال»؛ هل المبادرة شرط إتقان؟ — قرار علمي مفتوح — لا تُصحَّح في JSON',
    responseType: 'review_note',
  },
  {
    id: 'C7-03',
    sectionId: 'social-cognitive',
    criterionId: 'C7',
    question:
      '«بما يناسب السياق» + turnCount:: كيف يُعرَّف تشغيليًا «ملاءمة السياق»؟ ومن يقيّمها (بشري vs رقمي)؟ وهل «دورتان» = دورتان متتاليتان أم تراكمية في جلسة؟',
    responseType: 'review_note',
  },
  {
    id: 'C8-01',
    sectionId: 'social-cognitive',
    criterionId: 'C8',
    question:
      'Criterion–Behavior Fidelity + Delivery Model (Direct vs Hybrid/Human-mediated):: هل اختيار رمز على الشاشة/الجهاز = Direct؟ أم تناول للراشد + عند الحاجة + راشد/أسرة إلزامية؟',
    responseType: 'review_note',
  },
  {
    id: 'C8-02',
    sectionId: 'social-cognitive',
    criterionId: 'C8',
    question:
      'autoGoal vs level 0:: هل autoGoal (رمز واحد + يومي + 80%) كافٍ؟ أم يجب مناسبة + استقلالية + عند الحاجة + handover/initiation؟ — قرار علمي مفتوح — لا تُصحَّح في JSON',
    responseType: 'review_note',
  },
  {
    id: 'C8-03',
    sectionId: 'social-cognitive',
    criterionId: 'C8',
    question:
      'AAC vocal output + التداخل مع C1:: هل إخراج vocal من جهاز = Direct دون «يناول»؟ وكيف يُفصل طلب AAC عن طلب لفظي (C1)؟',
    responseType: 'review_note',
  },
  {
    id: 'C9-01',
    sectionId: 'social-cognitive',
    criterionId: 'C9',
    question:
      'Criterion–Behavior Fidelity + Direct vs Hybrid:: هل أي نشاط رقمي = Direct؟ أم Human-mediated إلزامي لتقييم وظيفي vs صدى + antecedent؟',
    responseType: 'review_note',
  },
  {
    id: 'C9-02',
    sectionId: 'social-cognitive',
    criterionId: 'C9',
    question:
      'autoGoal vs level 0 / question:: 4/5 استبدال vs مناسب + صدى نادر + لا يعيق — وفرص بمساعدة — قرار علمي مفتوح',
    responseType: 'review_note',
  },
  {
    id: 'C9-03',
    sectionId: 'social-cognitive',
    criterionId: 'C9',
    question:
      'تعريف الصدى vs الكلام الوظيفي + opportunity + antecedent + delayed echolalia + scripting + C5 overlap: التوترات الستة (§C) + مخاطر علمية:',
    responseType: 'review_note',
  },
  {
    id: 'C10-01',
    sectionId: 'social-cognitive',
    criterionId: 'C10',
    question:
      'من هو المستمع المرجعي؟: غير مألوف (question) vs مألوف (autoGoal) vs معظم (0)',
    responseType: 'review_note',
  },
  {
    id: 'C10-02',
    sectionId: 'social-cognitive',
    criterionId: 'C10',
    question:
      'intelligibility vs articulation/target sounds: — الاسم + question + recommendation',
    responseType: 'review_note',
  },
  {
    id: 'C10-03',
    sectionId: 'social-cognitive',
    criterionId: 'C10',
    question:
      'ASR:: Preparatory/Substitute أم Direct؟ — ASR ≠ مستمع غير مألوف',
    responseType: 'review_note',
  },
  {
    id: 'C11-01',
    sectionId: 'social-cognitive',
    criterionId: 'C11',
    question:
      'Composite bundle: — referent gaze + share interest + [gaze alternation] — إلزامي للDirect/Mastery؟',
    responseType: 'review_note',
  },
  {
    id: 'C11-02',
    sectionId: 'social-cognitive',
    criterionId: 'C11',
    question:
      'autoGoal vs level 0/question: — إصبع، «ونشاط المشاركة»، فوراً، 80%، فرص، شاشة vs حقيقي',
    responseType: 'review_note',
  },
  {
    id: 'C11-03',
    sectionId: 'social-cognitive',
    criterionId: 'C11',
    question:
      'Direct vs Hybrid: — هل أي tracking رقمي (Follow Star) = Direct؟',
    responseType: 'review_note',
  },
  {
    id: 'C12-01',
    sectionId: 'social-cognitive',
    criterionId: 'C12',
    question:
      'Mastery:: هل «3 ثوانٍ» + 80% عند طلب/حديث كافٍ؟ أم يلزم «مناسب متكرر دون انزعاج» + لعب من level 0/question؟',
    responseType: 'review_note',
  },
  {
    id: 'C12-02',
    sectionId: 'social-cognitive',
    criterionId: 'C12',
    question:
      'Direct/Fidelity:: هل نظر للcamera/avatar/وجه على الشاشة = Direct؟ أم Human-mediated إلزامي؟',
    responseType: 'review_note',
  },
  {
    id: 'C12-03',
    sectionId: 'social-cognitive',
    criterionId: 'C12',
    question:
      'الحدود:: متى C12 vs C2 / C6 / C11 / C13؟',
    responseType: 'review_note',
  },
  {
    id: 'C12-04',
    sectionId: 'social-cognitive',
    criterionId: 'C12',
    question:
      'توتر مصدر — question: (حديث + لعب) vs autoGoal (طلب + حديث — لا لعب)',
    responseType: 'review_note',
  },
  {
    id: 'C12-05',
    sectionId: 'social-cognitive',
    criterionId: 'C12',
    question:
      'توتر مصدر — level 0: (مناسب، متكرر، دون انزعاج) vs autoGoal (3 ث، 80%)',
    responseType: 'review_note',
  },
  {
    id: 'C12-06',
    sectionId: 'social-cognitive',
    criterionId: 'C12',
    question:
      'توتر مصدر — level 1: (بعد مناداة/معزز) — Pre-mastery vs «نجاح جزئي»؟',
    responseType: 'review_note',
  },
  {
    id: 'C12-07',
    sectionId: 'social-cognitive',
    criterionId: 'C12',
    question:
      'توتر مصدر — recommendation = referralRecommendation: — اقتراح لا معيار',
    responseType: 'review_note',
  },
  {
    id: 'C13-01',
    sectionId: 'social-cognitive',
    criterionId: 'C13',
    question:
      'Mastery:: هل autoGoal الحالي (نظر OR مشاركة أداة، مرة/جلسة لعب) كافٍ؟ أم يجب أن يطابق level 0/question (اقتراب + دعوة + مشاركة)؟',
    responseType: 'review_note',
  },
  {
    id: 'C13-02',
    sectionId: 'social-cognitive',
    criterionId: 'C13',
    question:
      'C12 boundary:: هل «النظر» جزء من C13 أم يجب أن يبقى ضمن C12 (eye contact) فقط؟',
    responseType: 'review_note',
  },
  {
    id: 'C13-03',
    sectionId: 'social-cognitive',
    criterionId: 'C13',
    question:
      'Initiation vs response vs facilitation:: كيف نميّز المبادرة الحقيقية عن استجابة القرين (level 1) أو التيسير/السيناريو (recommendation)؟',
    responseType: 'review_note',
  },
  {
    id: 'C13-04',
    sectionId: 'social-cognitive',
    criterionId: 'C13',
    question:
      'توتر مصدر — question/0: vs autoGoal — اقتراب، دعوة، نظر، تفاعل قصير',
    responseType: 'review_note',
  },
  {
    id: 'C13-05',
    sectionId: 'social-cognitive',
    criterionId: 'C13',
    question:
      'توتر مصدر — level 1: (استجابة ≠ مبادرة) vs autoGoal',
    responseType: 'review_note',
  },
  {
    id: 'C13-06',
    sectionId: 'social-cognitive',
    criterionId: 'C13',
    question:
      'توتر مصدر — recommendation = referralRecommendation: — تيسير ≠ معيار',
    responseType: 'review_note',
  },
  {
    id: 'C13-07',
    sectionId: 'social-cognitive',
    criterionId: 'C13',
    question:
      'توتر مصدر — «جلسة»: vs «جلسة لعب» — تعريف فرصة',
    responseType: 'review_note',
  },
  {
    id: 'C14-01',
    sectionId: 'social-cognitive',
    criterionId: 'C14',
    question:
      'Bundle:: هل «تبادل الدور» شرط للMastery؟ أم التمثيل الرمزي وحده كافٍ؟',
    responseType: 'review_note',
  },
  {
    id: 'C14-02',
    sectionId: 'social-cognitive',
    criterionId: 'C14',
    question:
      'Mastery:: هل autoGoal الحالي (دور واحد، 2 د، 4/5) كافٍ؟ أم يجب التوافق مع level 0 (مشهد + تبادل + راشد/قرين)؟',
    responseType: 'review_note',
  },
  {
    id: 'C14-03',
    sectionId: 'social-cognitive',
    criterionId: 'C14',
    question:
      'Model/facilitation:: كيف نميّز التدريب بالنموذج/التيسير (recommendation) عن اللعب الرمزي المستقل؟',
    responseType: 'review_note',
  },
  {
    id: 'C14-04',
    sectionId: 'social-cognitive',
    criterionId: 'C14',
    question:
      'توتر مصدر — question/0: vs autoGoal — تبادل دور، شريك، استقلالية',
    responseType: 'review_note',
  },
  {
    id: 'C14-05',
    sectionId: 'social-cognitive',
    criterionId: 'C14',
    question:
      'توتر مصدر — 4/5: vs 80% — تعريف «جلسة» و«فرصة»',
    responseType: 'review_note',
  },
  {
    id: 'C14-06',
    sectionId: 'social-cognitive',
    criterionId: 'C14',
    question:
      'توتر مصدر — level 1: (بعد نموذج) — ≠ mastery',
    responseType: 'review_note',
  },
  {
    id: 'C14-07',
    sectionId: 'social-cognitive',
    criterionId: 'C14',
    question:
      'توتر مصدر — recommendation = referralRecommendation: — اقتراح لا معيار',
    responseType: 'review_note',
  },
  {
    id: 'C15-01',
    sectionId: 'social-cognitive',
    criterionId: 'C15',
    question:
      'Mastery:: هل autoGoal الحالي (5 كبيرة مألوفة، 80%، نموذج واحد) كافٍ؟ أم يجب أن يشمل نطاق level 0 (كبير+صغير+وجه + مباشرة)؟',
    responseType: 'review_note',
  },
  {
    id: 'C15-02',
    sectionId: 'social-cognitive',
    criterionId: 'C15',
    question:
      'Direct/Fidelity:: هل النموذج عبر فيديو/avatar يمكن اعتباره Direct؟ أم Preparatory إلزاميًا؟',
    responseType: 'review_note',
  },
  {
    id: 'C15-03',
    sectionId: 'social-cognitive',
    criterionId: 'C15',
    question:
      'الحدود:: كيف نفصل imitation في C15 عن pretend play في C14 والاستجابة الاجتماعية في C16؟',
    responseType: 'review_note',
  },
  {
    id: 'C15-04',
    sectionId: 'social-cognitive',
    criterionId: 'C15',
    question:
      'توتر مصدر — level 0: vs autoGoal — صغير/وجه/اجتماعي، مباشرة، 80%',
    responseType: 'review_note',
  },
  {
    id: 'C15-05',
    sectionId: 'social-cognitive',
    criterionId: 'C15',
    question:
      'توتر مصدر — level 1: vs Mastery — تكرار/مساعدة',
    responseType: 'review_note',
  },
  {
    id: 'C15-06',
    sectionId: 'social-cognitive',
    criterionId: 'C15',
    question:
      'توتر مصدر — recommendation: (متدرج) vs autoGoal (ضيق)',
    responseType: 'review_note',
  },
  {
    id: 'C15-07',
    sectionId: 'social-cognitive',
    criterionId: 'C15',
    question:
      'توتر مصدر — «نموذج مباشر»: — حي vs فيديو/avatar',
    responseType: 'review_note',
  },
  {
    id: 'C16-01',
    sectionId: 'social-cognitive',
    criterionId: 'C16',
    question:
      'Mastery:: هل autoGoal (ابتسام OR تلويح، 4/5 عند التحية) كافٍ؟ أم يلزم level 0/question (ترحيب + استقبال/مدح + دون حث)؟',
    responseType: 'review_note',
  },
  {
    id: 'C16-02',
    sectionId: 'social-cognitive',
    criterionId: 'C16',
    question:
      'Direct/Fidelity:: هل سيناريو/اختيار رقمي = Direct؟ أم رد في موقف حي إلزامي؟',
    responseType: 'review_note',
  },
  {
    id: 'C16-03',
    sectionId: 'social-cognitive',
    criterionId: 'C16',
    question:
      'الحدود:: كيف نفصل C16 (social response) عن C15 (imitation) وC13 (مبادرة) وC6 (إيماء طلب ≠ تلويح رد ترحيب)؟',
    responseType: 'review_note',
  },
  {
    id: 'C16-04',
    sectionId: 'social-cognitive',
    criterionId: 'C16',
    question:
      'توتر مصدر — autoGoal vs level 0: 2. استقبال vs مدح',
    responseType: 'review_note',
  },
  {
    id: 'C16-05',
    sectionId: 'social-cognitive',
    criterionId: 'C16',
    question:
      'توتر مصدر — ترحيب/تحية vs ابتسام/تلويح: 4. دون حث vs عدم استبعاد prompting',
    responseType: 'review_note',
  },
  {
    id: 'C16-06',
    sectionId: 'social-cognitive',
    criterionId: 'C16',
    question:
      'توتر مصدر — تعريف «الموقف»: في 4/5',
    responseType: 'review_note',
  },
  {
    id: 'C16-07',
    sectionId: 'social-cognitive',
    criterionId: 'C16',
    question:
      'توتر مصدر — OR bundle: — شكل واحد كافٍ؟',
    responseType: 'review_note',
  },
  {
    id: 'C17-01',
    sectionId: 'social-cognitive',
    criterionId: 'C17',
    question:
      'Mastery / bundle:: هل autoGoal (تسمية فرح/حزن 80% من صورة/موقف) كافٍ؟ أم يلزم level 0/question (تعبير ذاتي AND تمييز ≥2 + غضب + تسمية OR إشارة + دون حث)؟',
    responseType: 'review_note',
  },
  {
    id: 'C17-02',
    sectionId: 'social-cognitive',
    criterionId: 'C17',
    question:
      'Direct/Fidelity:: هل تمييز من صورة/شاشة = Direct؟ أم التعبير/التمييز في موقف حي مع شريك إلزامي لل Mastery؟',
    responseType: 'review_note',
  },
  {
    id: 'C17-03',
    sectionId: 'social-cognitive',
    criterionId: 'C17',
    question:
      'الحدود:: كيف نفصل C17 عن C15 (تقليد تعبير) وC16 (ابتسام ≠ تسمية) وC12 (نظر ≠ قراءة عاطفية)؟',
    responseType: 'review_note',
  },
  {
    id: 'C17-04',
    sectionId: 'social-cognitive',
    criterionId: 'C17',
    question:
      'توتر مصدر — autoGoal vs level 0/question: 2. التعبير الذاتي vs تمييز مشاعر الآخرين',
    responseType: 'review_note',
  },
  {
    id: 'C17-05',
    sectionId: 'social-cognitive',
    criterionId: 'C17',
    question:
      'توتر مصدر — فرح/حزن vs غضب: 4. تسمية OR إشارة vs «يسمي»',
    responseType: 'review_note',
  },
  {
    id: 'C17-06',
    sectionId: 'social-cognitive',
    criterionId: 'C17',
    question:
      'توتر مصدر — وجه/موقف vs صورة: 6. prompting vs الاستقلالية',
    responseType: 'review_note',
  },
  {
    id: 'C17-07',
    sectionId: 'social-cognitive',
    criterionId: 'C17',
    question:
      'توتر مصدر — تعريف opportunity/trial: لـ 80%',
    responseType: 'review_note',
  },
  {
    id: 'C17-08',
    sectionId: 'social-cognitive',
    criterionId: 'C17',
    question:
      'توتر مصدر — bundle AND: — هل تمييز فقط كافٍ؟',
    responseType: 'review_note',
  },
  {
    id: 'C18-01',
    sectionId: 'social-cognitive',
    criterionId: 'C18',
    question:
      'Mastery / bundle:: هل autoGoal (أداة واحدة، دقيقتان، 80%) كافٍ؟ أم يلزم level 0/question (أداة OR مساحة + إكمال حتى النهاية + دون طلب)؟',
    responseType: 'review_note',
  },
  {
    id: 'C18-02',
    sectionId: 'social-cognitive',
    criterionId: 'C18',
    question:
      'Direct/Fidelity:: هل أي لعب جماعي رقمي = Direct؟ أم مشاركة مادية + شريك حقيقي إلزامي لل Mastery؟',
    responseType: 'review_note',
  },
  {
    id: 'C18-03',
    sectionId: 'social-cognitive',
    criterionId: 'C18',
    question:
      'الحدود:: كيف نفصل C18 عن C13 (initiation) وC14 (pretend/role exchange) وC19 (turn waiting)؟',
    responseType: 'review_note',
  },
  {
    id: 'C18-04',
    sectionId: 'social-cognitive',
    criterionId: 'C18',
    question:
      'توتر مصدر — أداة OR مساحة: vs «أداة واحدة»',
    responseType: 'review_note',
  },
  {
    id: 'C18-05',
    sectionId: 'social-cognitive',
    criterionId: 'C18',
    question:
      'توتر مصدر — حتى النهاية: vs لدقيقتين',
    responseType: 'review_note',
  },
  {
    id: 'C18-06',
    sectionId: 'social-cognitive',
    criterionId: 'C18',
    question:
      'توتر مصدر — prompting: (1) vs autoGoal لا يستبعد',
    responseType: 'review_note',
  },
  {
    id: 'C18-07',
    sectionId: 'social-cognitive',
    criterionId: 'C18',
    question:
      'توتر مصدر — تعريف opportunity/trial: لـ 80%',
    responseType: 'review_note',
  },
  {
    id: 'C18-08',
    sectionId: 'social-cognitive',
    criterionId: 'C18',
    question:
      'توتر مصدر — مشاركة: وحدها vs إكمال إلزامي',
    responseType: 'review_note',
  },
  {
    id: 'C18-09',
    sectionId: 'social-cognitive',
    criterionId: 'C18',
    question:
      'توتر مصدر — «شخص آخر»: — راشد/قرين',
    responseType: 'review_note',
  },
  {
    id: 'C19-01',
    sectionId: 'social-cognitive',
    criterionId: 'C19',
    question:
      'Mastery / bundle:: هل autoGoal (30 ث، مؤقت بصري، 4/5) كافٍ؟ أم يلزم level 0/question (دون أخذ دور غيره + دون مغادرة/يكمل + إشارة قصيرة دون scaffold ثقيل)؟',
    responseType: 'review_note',
  },
  {
    id: 'C19-02',
    sectionId: 'social-cognitive',
    criterionId: 'C19',
    question:
      'Direct/Fidelity / مؤقت:: هل المؤقت البصري = assist (Preparatory) أم جزء مقبول من Direct؟ وهل 30 ث على شاشة = Direct أم Hybrid إلزامي مع حلقة حقيقية؟',
    responseType: 'review_note',
  },
  {
    id: 'C19-03',
    sectionId: 'social-cognitive',
    criterionId: 'C19',
    question:
      'الحدود:: كيف نفصل C19 (turn waiting) عن C18 (cooperative sharing) وC14 (role exchange) وC3 (تعليمة «انتظر»)؟',
    responseType: 'review_note',
  },
  {
    id: 'C19-04',
    sectionId: 'social-cognitive',
    criterionId: 'C19',
    question:
      'توتر مصدر — question/level 0 vs autoGoal: 2. 30 ث vs حتى/استمرار/يكمل',
    responseType: 'review_note',
  },
  {
    id: 'C19-05',
    sectionId: 'social-cognitive',
    criterionId: 'C19',
    question:
      'توتر مصدر — المؤقت: البصري — scaffold vs mastery condition',
    responseType: 'review_note',
  },
  {
    id: 'C19-06',
    sectionId: 'social-cognitive',
    criterionId: 'C19',
    question:
      'توتر مصدر — prompting: (1) vs autoGoal',
    responseType: 'review_note',
  },
  {
    id: 'C19-07',
    sectionId: 'social-cognitive',
    criterionId: 'C19',
    question:
      'توتر مصدر — 4/5: فرص — opportunity',
    responseType: 'review_note',
  },
  {
    id: 'C19-08',
    sectionId: 'social-cognitive',
    criterionId: 'C19',
    question:
      'توتر مصدر — «نشاط: جماعي» — حجم المجموعة',
    responseType: 'review_note',
  },
  {
    id: 'C19-09',
    sectionId: 'social-cognitive',
    criterionId: 'C19',
    question:
      'توتر مصدر — 30: ث كافية vs قياس امتناع/استمرار',
    responseType: 'review_note',
  },
  {
    id: 'C20-01',
    sectionId: 'social-cognitive',
    criterionId: 'C20',
    question:
      'هل نموذج الأقران في autoGoal شرط تدريبي فقط أم يسمح باحتسابه ضمن الإتقان؟',
    responseType: 'review_note',
  },
  {
    id: 'C20-02',
    sectionId: 'social-cognitive',
    criterionId: 'C20',
    question:
      'هل عدم مناداة الطفل باسمه هو جوهر C20 أم أن الجوهر الأوسع هو الاستجابة للتعليم الجماعي؟',
    responseType: 'review_note',
  },
  {
    id: 'C20-03',
    sectionId: 'social-cognitive',
    criterionId: 'C20',
    question:
      'هل الإشارة البصرية للمجموعة مساعدة مقبولة في القياس أم يجب سحبها عند تقييم الاستقلالية؟',
    responseType: 'review_note',
  },
  {
    id: 'C20-04',
    sectionId: 'social-cognitive',
    criterionId: 'C20',
    question:
      'توتر مصدر — Level 0 vs Level 1 vs autoGoal: — نموذج أقران',
    responseType: 'review_note',
  },
  {
    id: 'C20-05',
    sectionId: 'social-cognitive',
    criterionId: 'C20',
    question:
      'توتر مصدر — نداء: فردي vs تعليم جماعي — الجوهر',
    responseType: 'review_note',
  },
  {
    id: 'C20-06',
    sectionId: 'social-cognitive',
    criterionId: 'C20',
    question:
      'توتر مصدر — إشارة: بصرية — assist vs measure',
    responseType: 'review_note',
  },
  {
    id: 'C20-07',
    sectionId: 'social-cognitive',
    criterionId: 'C20',
    question:
      'توتر مصدر — 80%: — opportunity',
    responseType: 'review_note',
  },
  {
    id: 'C21-01',
    sectionId: 'social-cognitive',
    criterionId: 'C21',
    question:
      'هل المطابقة والتصنيف مهارة واحدة أم مساران منفصلان؟',
    responseType: 'review_note',
  },
  {
    id: 'C21-02',
    sectionId: 'social-cognitive',
    criterionId: 'C21',
    question:
      'ما المقصود تحديدًا بالمطابقة المفهومية وتصنيف عنصرين متشابهين؟',
    responseType: 'review_note',
  },
  {
    id: 'C21-03',
    sectionId: 'social-cognitive',
    criterionId: 'C21',
    question:
      'هل autoGoal الحالي هدف أولي أم يمثل الإتقان النهائي؟',
    responseType: 'review_note',
  },
  {
    id: 'C22-01',
    sectionId: 'social-cognitive',
    criterionId: 'C22',
    question:
      'هل الألوان والأشكال مساران مستقلان داخل C22 أم يكفي إتقان أحدهما؟',
    responseType: 'review_note',
  },
  {
    id: 'C22-02',
    sectionId: 'social-cognitive',
    criterionId: 'C22',
    question:
      'هل autoGoal الخاص بـ 3 ألوان هدف أولي أم يمثل الإتقان المقصود؟',
    responseType: 'review_note',
  },
  {
    id: 'C22-03',
    sectionId: 'social-cognitive',
    criterionId: 'C22',
    question:
      'هل النموذج والمقارنة جنبًا إلى جنب مرحلة تدريبية فقط أم يسمح بهما عند تحديد الإتقان؟',
    responseType: 'review_note',
  },
  {
    id: 'C23-01',
    sectionId: 'social-cognitive',
    criterionId: 'C23',
    question:
      'هل إعطاء الكمية المطلوبة جزء أساسي من إتقان C23 أم أن العد واحد-لواحد يكفي كهدف أولي؟',
    responseType: 'review_note',
  },
  {
    id: 'C23-02',
    sectionId: 'social-cognitive',
    criterionId: 'C23',
    question:
      'هل فهم العدد ككمية/Cardinality مكون مستقل يجب قياسه؟',
    responseType: 'review_note',
  },
  {
    id: 'C23-03',
    sectionId: 'social-cognitive',
    criterionId: 'C23',
    question:
      'هل المواد الملموسة شرط للـ Direct measurement أم يمكن للنشاط الرقمي وحده إثبات الإتقان؟',
    responseType: 'review_note',
  },
  {
    id: 'C24-01',
    sectionId: 'social-cognitive',
    criterionId: 'C24',
    question:
      'هل طلب المساعدة مسار بديل مكافئ لحل المشكلة أم مهارة وظيفية مختلفة؟',
    responseType: 'review_note',
  },
  {
    id: 'C24-02',
    sectionId: 'social-cognitive',
    criterionId: 'C24',
    question:
      'ما تعريف «الحل المناسب»؟ وهل مجرد المحاولة نجاح أم يجب تقدم/إكمال؟',
    responseType: 'review_note',
  },
  {
    id: 'C24-03',
    sectionId: 'social-cognitive',
    criterionId: 'C24',
    question:
      'هل تغيير الاستراتيجية بعد الفشل جزء من C24 أم تكفي محاولة مناسبة واحدة؟',
    responseType: 'review_note',
  },
  {
    id: 'C25-01',
    sectionId: 'social-cognitive',
    criterionId: 'C25',
    question:
      'ما التعريف التشغيلي لـ «منتبهاً للمهمة»؟',
    responseType: 'review_note',
  },
  {
    id: 'C25-02',
    sectionId: 'social-cognitive',
    criterionId: 'C25',
    question:
      'هل 5 د في مهمة مفضلة و مهمة موجهة تمثلان نفس الإتقان؟',
    responseType: 'review_note',
  },
  {
    id: 'C25-03',
    sectionId: 'social-cognitive',
    criterionId: 'C25',
    question:
      'هل إعادة التوجيه اللفظي النادر مقبولة في Level 0، وما تعريف «نادر»؟',
    responseType: 'review_note',
  },
  {
    id: 'C25-04',
    sectionId: 'social-cognitive',
    criterionId: 'C25',
    question:
      'هل الأنشطة الحالية تمثل تدريبًا على مكونات C25 أم Activities مباشرة للمعيار؟',
    responseType: 'review_note',
  },
  {
    id: 'C26-01',
    sectionId: 'social-cognitive',
    criterionId: 'C26',
    question:
      'هل تذكر العناصر وتنفيذ الخطوات مساران مستقلان أم مظهران متكافئان؟',
    responseType: 'review_note',
  },
  {
    id: 'C26-02',
    sectionId: 'social-cognitive',
    criterionId: 'C26',
    question:
      'هل مصطلح «الذاكرة العاملة» مناسب، أم نلتزم بالوصف السلوكي المحدد؟',
    responseType: 'review_note',
  },
  {
    id: 'C26-03',
    sectionId: 'social-cognitive',
    criterionId: 'C26',
    question:
      'هل autoGoal (3 خطوات) هدف أولي أم يجب أن يشمل مسار العناصر؟',
    responseType: 'review_note',
  },
  {
    id: 'C26-04',
    sectionId: 'social-cognitive',
    criterionId: 'C26',
    question:
      'هل Match Me و Where Did It Go تمهيديان فقط لـ C26، أم يجب ألا يحمل أي منهما C26 حتى يوجد نشاط مخصص للتسلسل؟',
    responseType: 'review_note',
  },
  {
    id: 'C27-01',
    sectionId: 'social-cognitive',
    criterionId: 'C27',
    question:
      'هل اللون والشكل والفئة الوظيفية مسارات فرعية لمهارة واحدة أم مهارات مختلفة؟',
    responseType: 'review_note',
  },
  {
    id: 'C27-02',
    sectionId: 'social-cognitive',
    criterionId: 'C27',
    question:
      'كيف نفصل C27 علميًا عن مكوّن التصنيف في C21؟',
    responseType: 'review_note',
  },
  {
    id: 'C27-03',
    sectionId: 'social-cognitive',
    criterionId: 'C27',
    question:
      'هل إتقان C27 يتطلب الاستقلالية كما يوحي Level 0، أم يكفي 80% في autoGoal مع/بدون مساعدة؟',
    responseType: 'review_note',
  },
  {
    id: 'C28-01',
    sectionId: 'social-cognitive',
    criterionId: 'C28',
    question:
      'هل فوق/تحت/بجانب مهارة واحدة متعددة المسارات أم ثلاثة مسارات فرعية مستقلة؟',
    responseType: 'review_note',
  },
  {
    id: 'C28-02',
    sectionId: 'social-cognitive',
    criterionId: 'C28',
    question:
      'هل يجب أن يكون القياس Direct قائمًا على تنفيذ الطفل للموقع فعليًا وليس اختيار إجابة رقمية؟',
    responseType: 'review_note',
  },
  {
    id: 'C28-03',
    sectionId: 'social-cognitive',
    criterionId: 'C28',
    question:
      'هل معيار الإتقان هو استقلالية Level 0 أم 80% في autoGoal، وكيف نتعامل مع المساعدة؟',
    responseType: 'review_note',
  },
  {
    id: 'C29-01',
    sectionId: 'social-cognitive',
    criterionId: 'C29',
    question:
      'هل إعادة البناء والنسخ مساران مختلفان أم مهارة واحدة؟',
    responseType: 'review_note',
  },
  {
    id: 'C29-02',
    sectionId: 'social-cognitive',
    criterionId: 'C29',
    question:
      'هل بقاء النموذج أمام الطفل شرط للإتقان، أم يجب لاحقًا قياس إعادة الإنتاج بعد إزالة النموذج؟',
    responseType: 'review_note',
  },
  {
    id: 'C29-03',
    sectionId: 'social-cognitive',
    criterionId: 'C29',
    question:
      'أين: ينتهي C29 ويبدأ C26 عندما يُزال النموذج ويعتمد الطفل على التذكر؟',
    responseType: 'review_note',
  },
  {
    id: 'C30-01',
    sectionId: 'social-cognitive',
    criterionId: 'C30',
    question:
      'هل تغيير قاعدة التصنيف من لون إلى شكل يمثل تعريفًا تشغيليًا مناسبًا لـC30، أم نحتاج أمثلة أخرى للمرونة خارج الفرز؟',
    responseType: 'review_note',
  },
  {
    id: 'C30-02',
    sectionId: 'social-cognitive',
    criterionId: 'C30',
    question:
      'هل C27 هو تطبيق القاعدة وC30 هو تغيير القاعدة كحد منهجي رسمي؟',
    responseType: 'review_note',
  },
  {
    id: 'C30-03',
    sectionId: 'social-cognitive',
    criterionId: 'C30',
    question:
      'هل النموذج/الإشارة البصرية شروط للتدريب أم مساعدة يجب تلاشيها عند قياس الإتقان؟',
    responseType: 'review_note',
  },
  {
    id: 'C31-01',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C31',
    question:
      'هل الجدول البصري شرط مقبول للإتقان في C31، أم يجب اعتباره دعمًا يُخفَّ تدريجيًا؟',
    responseType: 'review_note',
  },
  {
    id: 'C31-02',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C31',
    question:
      'ما تعريف نجاح الانتقال: الوصول، بدء النشاط الجديد، الاستمرار، أم مجموعة منها؟',
    responseType: 'review_note',
  },
  {
    id: 'C31-03',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C31',
    question:
      'هل C31 هو التكيف السلوكي مع تغيير النشاط/المكان، بينما C30 هو المرونة في تغيير قاعدة المهمة، وهل نعتمد هذا كحد منهجي؟',
    responseType: 'review_note',
  },
  {
    id: 'C32-01',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C32',
    question:
      'ما التعريف التشغيلي لـ«يهدأ» و«التعافي» في C32؟',
    responseType: 'review_note',
  },
  {
    id: 'C32-02',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C32',
    question:
      'هل استخدام استراتيجية تهدئة مع دعم لفظي/بصري يُعد إتقانًا، أم يجب قياس تلاشي الدعم؟',
    responseType: 'review_note',
  },
  {
    id: 'C32-03',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C32',
    question:
      'هل العودة إلى النشاط/الروتين جزء من mastery أم يكفي انخفاض الاستثارة؟',
    responseType: 'review_note',
  },
  {
    id: 'C32-04',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C32',
    question:
      'ما الحالات التي يجب فيها إيقاف المهمة وعدم محاولة القياس الرقمي عند وجود إيذاء ذاتي أو خطر على الطفل/الآخرين؟',
    responseType: 'review_note',
  },
  {
    id: 'C33-01',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C33',
    question:
      'هل 3 دقائق مع مثير معدّل تمثل Mastery؟',
    responseType: 'review_note',
  },
  {
    id: 'C33-02',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C33',
    question:
      'هل البقاء يكفي أم يجب قياس المشاركة؟',
    responseType: 'review_note',
  },
  {
    id: 'C33-03',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C33',
    question:
      'كيف تُفصل المثيرات السمعية والبصرية واللمسية والخامات؟',
    responseType: 'review_note',
  },
  {
    id: 'C33-04',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C33',
    question:
      'ما تعريف «النجاح»؟',
    responseType: 'review_note',
  },
  {
    id: 'C33-05',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C33',
    question:
      'كيف نُصنّف تعديل البيئة مقابل الدعم/المساعدة؟',
    responseType: 'review_note',
  },
  {
    id: 'C33-06',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C33',
    question:
      'ما شروط السلامة والتوقف التي يجب اعتمادها؟',
    responseType: 'review_note',
  },
  {
    id: 'C34-01',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C34',
    question:
      'هل C34 معيار واحد أم يجب تفكيكه إلى التعبير عن الحاجة + استخدام الحمام + النظافة/غسل اليدين؟',
    responseType: 'review_note',
  },
  {
    id: 'C34-02',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C34',
    question:
      'هل autoGoal الحالي (تعبير عن الحاجة بكلمة أو رمز قبل التبول، 80% خلال 3 أشهر) هدف فرعي أم Mastery أولي لـ C34؟',
    responseType: 'review_note',
  },
  {
    id: 'C34-03',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C34',
    question:
      'هل استخدام جدول الحمام دعمًا بيئيًا (scheduleUsed) أم Prompt يُسجَّل في promptLevel؟',
    responseType: 'review_note',
  },
  {
    id: 'C34-04',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C34',
    question:
      'ما تعريف «الاستقلالية» في C34 — خاصة عند Level 0 (استخدام تلقائي + تنظيف + غسل يدين)؟',
    responseType: 'review_note',
  },
  {
    id: 'C34-05',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C34',
    question:
      'هل يجب أن يشمل Mastery الملابس والتنظيف وغسل اليدين أم تُترك كمهارات فرعية منفصلة؟',
    responseType: 'review_note',
  },
  {
    id: 'C34-06',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C34',
    question:
      'هل التعبير عن الحاجة يُقاس منفصلًا عن تنفيذ روتين الحمام والانتقال إليه، أم ضمن معيار واحد؟',
    responseType: 'review_note',
  },
  {
    id: 'C34-07',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C34',
    question:
      'هل الاستجابة للتعليمات أثناء روتين الحمام جزءًا من C34 أم تُحال إلى معايير التعليمات (C3/C4)؟',
    responseType: 'review_note',
  },
  {
    id: 'C34-08',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C34',
    question:
      'المستويات 0–3 تخلط التواصل واستخدام الحمام والتحكم والملابس والنظافة وغسل اليدين ومستوى المساعدة — هل تحتاج إعادة صياغة قبل الاعتماد؟',
    responseType: 'review_note',
  },
  {
    id: 'C34-09',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C34',
    question:
      'هل المكونات التسعة المقترحة (التعرف، التعبير، الانتقال، التسلسل، الملابس، التنظيف، اليدين، تلاشي الجدول/التذكير، التعميم) بنية صالحة أم يُفضَّل تجميع/دمج بعضها؟',
    responseType: 'review_note',
  },
  {
    id: 'C34-10',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C34',
    question:
      'عند Level 2 (جدول زمني من الوالد + مساعدة كاملة): هل الجدول scaffold تدريبي أم قيدًا على الإتقان؟',
    responseType: 'review_note',
  },
  {
    id: 'C34-11',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C34',
    question:
      'كيف نفصل scheduleUsed وreminderUsed والدعم البصري (visualPromptUsed) والتوجيه اللفظي (verbalPromptUsed) والمساعدة الجسدية في التسجيل والتقييم؟',
    responseType: 'review_note',
  },
  {
    id: 'C34-12',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C34',
    question:
      'هل timeToInitiateSeconds وtimeToCompleteSeconds مؤشران أداء فقط، أم يُمنع احتسابهما كـ promptLevel؟',
    responseType: 'review_note',
  },
  {
    id: 'C34-13',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C34',
    question:
      'ما تعريف «النجاح» و«الفرصة» (opportunityCount/successCount) لحساب 80% — هل تشمل التعبير فقط أم الروتين الكامل؟',
    responseType: 'review_note',
  },
  {
    id: 'C34-14',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C34',
    question:
      'هل حقول القياس الـ31 المقترحة كافية ووصفية دون انجراف تشخيصي، وأيها إلزامي عند قياس الإتقان؟',
    responseType: 'review_note',
  },
  {
    id: 'C34-15',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C34',
    question:
      'ما مسار التعميم بين الأشخاص والأماكن واختلافات الروتين، ومتى يُقلَّل الاعتماد على الجدول/التذكير؟',
    responseType: 'review_note',
  },
  {
    id: 'C34-16',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C34',
    question:
      'ما معايير الصيانة (Maintenance) — هل ثبات 80% على شاشة يثبت استمرار استقلالية الحمام الوظيفية؟',
    responseType: 'review_note',
  },
  {
    id: 'C34-17',
    sectionId: 'behavioral-sensory-independence',
    criterionId: 'C34',
    question:
      'هل يُمنع ادعاء Direct Mastery من اختيار رمز الحمام أو ترتيب خطوات استخدامه على الشاشة (§5.2 / §96-H)؟',
    responseType: 'yes_no',
  },
  {
    id: 'C34-18',
    sectionId: 'digital-real-training',
    criterionId: 'C34',
    question:
      'ما حدود الدور الرقمي (Preparatory/Substitute) مقابل الممارسة الواقعية الآمنة في تقييم C34؟',
    responseType: 'review_note',
  },
  {
    id: 'C34-19',
    sectionId: 'digital-real-training',
    criterionId: 'C34',
    question:
      'هل تصنيف Direct/Preparatory/Substitute/Hybrid المقترح في §96-H مناسبًا لـ C34، وما المسار Hybrid المفضل؟',
    responseType: 'review_note',
  },
  {
    id: 'C34-20',
    sectionId: 'safety-scientific-boundaries',
    criterionId: 'C34',
    question:
      'هل وصف C34 كمعيار سلوكي/تربوي غير تشخيصي كافٍ لمنع استخدامه كبديل لتقييم طبي للتحكم بالإخراج؟',
    responseType: 'review_note',
  },
] as const;

/** معايير بلا قسم منهجي في الوثيقة المرجعية (لا أسئلة مستخرجة) */
export const CRITERIA_WITHOUT_METHODOLOGY_SECTION: readonly string[] = [];
