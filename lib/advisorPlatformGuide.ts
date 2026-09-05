/**
 * دليل تعريف المنصة للمستشار العلمي — محتوى أقسام + اعتماد تدريجي.
 */

export const ADVISOR_GUIDE_VERSION = '2026.1-platform-overview';

export type AdvisorGuideSection = {
  id: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  bodyAr: string;
  bodyEn: string;
  methodologyAr: readonly string[];
  methodologyEn: readonly string[];
  advisorRoleAr: string;
  advisorRoleEn: string;
  explore?: readonly {
    href: string;
    labelAr: string;
    labelEn: string;
  }[];
};

export const ADVISOR_PLATFORM_SECTIONS: readonly AdvisorGuideSection[] = [
  {
    id: 'welcome',
    titleAr: 'مرحباً بك في منصة تآلف',
    titleEn: 'Welcome to Taaluf',
    summaryAr: 'رسالة المنصة، أهدافها، والفئة المستهدفة.',
    summaryEn: 'Platform mission, goals, and target population.',
    bodyAr:
      '**تآلف** منصة تقييم **تربوي وتأهيلي رقمي** مخصّصة للأطفال (٣–١٢ سنة) ذوي **اضطرابات طيف التوحد** و**الإعاقات النمائية**، مقرها سلطنة عُمان. الهدف: تحويل الملاحظات السلوكية القابلة للرصد إلى **ملامح واضحة** و**استراتيجيات قابلة للتطبيق** في المنزل والمدرسة. أنت — بصفة **رئيس المجلس الاستشاري والسريري العام** — المرجع العلمي الأول لاعتماد أدوات التقييم، مقاييس النمو، وخطط التدخل الفردية (IEP) داخل المنصة.',
    bodyEn:
      '**Taaluf** is a **digital educational and rehabilitative assessment platform** for children (3–12) with **autism spectrum conditions** and **developmental disabilities**, based in the Sultanate of Oman. The goal is to turn observable behavioral indicators into **clear profiles** and **actionable strategies** for home and school. As **Chief Advisory & Clinical Council Chair**, you are the primary scientific authority for approving assessment tools, developmental metrics, and Individualized Education Plans (IEPs) on the Platform.',
    methodologyAr: [
      'تسجيل الدخول عبر بوابة المستشار: /login?portal=hub',
      'قراءة هذا الدليل قسماً قسماً والاعتماد على كل قسم',
      'توقيع اتفاقية الشراكة في تبويب «الشراكة والمذكرة»',
      'بدء العمل عبر غرفة الاجتماعات وبيئات الاختبار',
    ],
    methodologyEn: [
      'Sign in via the advisor portal: /login?portal=hub',
      'Read this guide section by section and acknowledge each',
      'Sign the partnership agreement under Partnership & MOU',
      'Begin work via the meeting room and test environments',
    ],
    advisorRoleAr:
      'اقرأ هذا القسم لتكوين صورة شاملة عن هوية المنصة ودورك الاستشاري قبل أي مراجعة علمية.',
    advisorRoleEn:
      'Read this section to form a complete picture of the Platform identity and your advisory role before any scientific review.',
  },
  {
    id: 'nature',
    titleAr: 'طبيعة المنصة والإخلاء التشخيصي',
    titleEn: 'Platform nature & diagnostic disclaimer',
    summaryAr: 'ما تفعله المنصة وما لا تفعله — حدود قانونية وتربوية.',
    summaryEn: 'What the Platform does and does not do — legal and educational boundaries.',
    bodyAr:
      'المنصة **أداة توجيهية تربوية** مبنية على **مؤشرات سلوكية قابلة للملاحظة** (Rubric 0–3). **لا تُعدّ** تشخيصاً طبيّاً أو نفسياً سريرياً مستقلاً، ولا تُغني عن التقييم المتخصص المباشر. اللغة المعتمدة: «ملامح»، «مؤشرات»، «استراتيجيات» — وليس «تشخيص» أو «إحالة طبية». دورك **استشاري–بحثي** لتعزيز جودة المؤشرات والتوصيات، لا لإصدار تشخيصات ملزمة.',
    bodyEn:
      'The Platform is an **educational guidance instrument** based on **observable behavioral indicators** (0–3 Rubric). It is **not** a standalone clinical medical or psychological diagnosis and does not replace specialist face-to-face assessment. Approved language: "profiles," "indicators," "strategies" — not "diagnosis" or "medical referral." Your role is **advisory–research** to enhance metric and recommendation quality, not to issue binding diagnoses.',
    methodologyAr: [
      'كل تقرير يتضمن إخلاء مسؤولية تربوي ثابت',
      'مرشد تآلف (Merhid) يلتزم بعدم التشخيص القاطع',
      'المقترحات في Hub تُراجع قبل أي نشر إنتاجي',
    ],
    methodologyEn: [
      'Every report includes a fixed educational disclaimer',
      'Merhid assistant avoids definitive diagnosis',
      'Hub proposals are reviewed before any production rollout',
    ],
    advisorRoleAr:
      'تحقق من أن أي مقترح علمي يحترم هذا الإطار — وعلّق في غرفة الاجتماعات عند أي صياغة تشخيصية.',
    advisorRoleEn:
      'Ensure every scientific proposal respects this frame — comment in the meeting room on any diagnostic wording.',
    explore: [
      { href: '/scientific-basis', labelAr: 'الأساس العلمي', labelEn: 'Scientific basis' },
      { href: '/legal', labelAr: 'الوثائق القانونية', labelEn: 'Legal documents' },
    ],
  },
  {
    id: 'roles',
    titleAr: 'الأدوار والمسارات داخل المنصة',
    titleEn: 'Roles & pathways on the Platform',
    summaryAr: 'ولي الأمر، المختص، الإدارة، والمستشار — من يفعل ماذا.',
    summaryEn: 'Parent, specialist, admin, and advisor — who does what.',
    bodyAr:
      '**ولي الأمر:** فرز مجاني → استبيان (٢٠ بنداً) → ألعاب → تقرير ومتابعة منزلية. **المختص/المعلّم:** تسجيل الطفل → تقييم شامل (٣٦ معياراً) → تقرير → أهداف SMART → متابعة. **الإدارة (حازم):** اعتماد المقترحات، النشر الإنتاجي، RBAC، لوحة الإدارة. **المستشار (أنت):** مراجعة علمية، اقتراح، اختبار في بيئات غير إنتاجية — **دون** اعتماد نهائي أو تعديل هيكلي.',
    bodyEn:
      '**Parent:** free screening → questionnaire (20 items) → games → report and home follow-up. **Specialist/teacher:** register child → comprehensive assessment (36 criteria) → report → SMART goals → follow-up. **Admin (Hazem):** proposal approval, production deploy, RBAC, admin panel. **Advisor (you):** scientific review, propose, test in non-production environments — **without** final approval or structural changes.',
    methodologyAr: [
      'كل دور له بوابة دخول منفصلة في /login',
      'Middleware يوجّه كل دور لمساره الافتراضي',
      'المستشار يُوجّه تلقائياً إلى /hub',
    ],
    methodologyEn: [
      'Each role has a separate login portal at /login',
      'Middleware routes each role to its default path',
      'The advisor is routed automatically to /hub',
    ],
    advisorRoleAr:
      'افهم حدود دورك مقابل المختص والإدارة — اعتمادك في Hub لا يعني نشراً تلقائياً.',
    advisorRoleEn:
      'Understand your boundaries vs. specialist and admin — your Hub acknowledgment does not mean automatic deployment.',
    explore: [
      { href: '/login', labelAr: 'بوابات الدخول', labelEn: 'Login portals' },
    ],
  },
  {
    id: 'screening',
    titleAr: 'الفرز والتوجيه المبكر',
    titleEn: 'Screening & early guidance',
    summaryAr: '١٢ سؤالاً عبر ٤ أبعاد — بوابة الدخول للعائلات.',
    summaryEn: '12 questions across 4 dimensions — family entry point.',
    bodyAr:
      '**الفرز** نقطة البداية لولي الأمر: **١٢ سؤالاً** موزّعة على أبعاد **لغوي، سلوكي، معرفي، حركي**. النتيجة: متوازن (<٢٥٪) · متوسط (٢٥–٤٩٪) · مرتفع (≥٥٠٪) → يُوصى بالتقييم الشامل. الفرز **مجاني** ولا يستبدل التقييم المتعدد المصادر.',
    bodyEn:
      '**Screening** is the parent entry point: **12 questions** across **language, behavior, cognitive, and motor** dimensions. Results: balanced (<25%) · moderate (25–49%) · elevated (≥50%) → comprehensive assessment recommended. Screening is **free** and does not replace multi-source assessment.',
    methodologyAr: [
      'ولي الأمر يكمل الموافقة ثم يسجّل الطفل',
      'الفرز في /dashboard/screening أو مسار /parent',
      'نتيجة مرتفعة تفتح مسار التقييم الشامل',
    ],
    methodologyEn: [
      'Parent completes consent then registers the child',
      'Screening at /dashboard/screening or /parent path',
      'Elevated result opens the comprehensive assessment path',
    ],
    advisorRoleAr:
      'راجع منطق العتبات والأسئلة — اقترح تحسينات عبر تصنيف «تقييم سريري» في غرفة الاجتماعات.',
    advisorRoleEn:
      'Review threshold logic and questions — propose improvements via "Clinical evaluation" in the meeting room.',
    explore: [
      {
        href: '/dashboard/screening',
        labelAr: 'معاينة الفرز',
        labelEn: 'Preview screening',
      },
    ],
  },
  {
    id: 'assessment',
    titleAr: 'التقييم الشامل — Canon 36',
    titleEn: 'Comprehensive assessment — Canon 36',
    summaryAr: '٣٦ معياراً · ٨ مجالات · مقياس ٠–٣.',
    summaryEn: '36 criteria · 8 domains · 0–3 scale.',
    bodyAr:
      'قلب المنصة: **٣٦ معياراً** (إصدار 3.0-unified) عبر **٨ مجالات** نمائية. كل معيار يُقيَّم ٠–٣ بوصف إجرائي لكل مستوى. المختص يُجري التقييم عبر `/dashboard/assessments/new` بعد تسجيل الطفل. المعايير مبنية على ممارسات تربوية–تأهيلية معترف بها.',
    bodyEn:
      'Platform core: **36 criteria** (version 3.0-unified) across **8 developmental domains**. Each criterion is scored 0–3 with procedural descriptors per level. The specialist runs assessment via `/dashboard/assessments/new` after registering the child. Criteria are grounded in recognized educational–rehabilitative practice.',
    methodologyAr: [
      'تسجيل الطفل → موافقة → تقييم جديد',
      'كل معيار: وصف + ٤ مستويات (٠–٣)',
      'CAT (تقييم تكيفي) مساعد اختياري للمختص',
    ],
    methodologyEn: [
      'Register child → consent → new assessment',
      'Each criterion: description + 4 levels (0–3)',
      'CAT (adaptive testing) optional assistant for specialists',
    ],
    advisorRoleAr:
      'هذا Canon المرجعي — راجع صحة المعايير ومواءمتها الأكاديمية قبل أي اعتماد علمي.',
    advisorRoleEn:
      'This is the reference Canon — review criterion validity and academic alignment before any scientific approval.',
    explore: [
      {
        href: '/dashboard/assessments/new',
        labelAr: 'معاينة التقييم',
        labelEn: 'Preview assessment',
      },
      {
        href: '/scientific-basis',
        labelAr: 'الأساس العلمي',
        labelEn: 'Scientific basis',
      },
    ],
  },
  {
    id: 'fusion',
    titleAr: 'دمج المصادر والتقارير',
    titleEn: 'Source fusion & reports',
    summaryAr: 'أخصائي + أهل + ألعاب → تقرير موحّد.',
    summaryEn: 'Specialist + parent + games → unified report.',
    bodyAr:
      '**Fusion:** دمج درجات **المختص (وزن ٢)** + **استبيان الأهل ٢٠ بنداً (وزن ١)** + **الألعاب التفاعلية (وزن ١.٥)** في تقرير واحد. التقرير PDF عربي يتضمن ملامح المجالات، استراتيجيات، وأهداف مقترحة — بلغة تربوية آمنة.',
    bodyEn:
      '**Fusion:** merges **specialist scores (weight 2)** + **parent questionnaire 20 items (weight 1)** + **interactive games (weight 1.5)** into one report. Arabic PDF report includes domain profiles, strategies, and suggested goals — in safe educational language.',
    methodologyAr: [
      'استبيان الأهل: /dashboard/parent-assessment',
      'الألعاب: تقليد، تتبع، البطل الصغير → درجات معايير',
      'التقرير: /assessment/report بعد اكتمال المصادر',
    ],
    methodologyEn: [
      'Parent questionnaire: /dashboard/parent-assessment',
      'Games: imitation, tracking, Little Hero → criterion scores',
      'Report: /assessment/report after sources complete',
    ],
    advisorRoleAr:
      'قيّم منطق الأوزان وصحة الدمج — اقترح تعديلات منهجية إن لزم.',
    advisorRoleEn:
      'Evaluate weight logic and fusion validity — propose methodological adjustments if needed.',
    explore: [
      {
        href: '/dashboard/parent-assessment',
        labelAr: 'استبيان الأهل',
        labelEn: 'Parent questionnaire',
      },
      { href: '/dashboard/games', labelAr: 'الألعاب', labelEn: 'Games' },
    ],
  },
  {
    id: 'goals',
    titleAr: 'الأهداف وخطط IEP',
    titleEn: 'Goals & IEP plans',
    summaryAr: 'أهداف SMART من البنود ≥٢ — متابعة GAS.',
    summaryEn: 'SMART goals from items ≥2 — GAS follow-up.',
    bodyAr:
      'من البنود ذات الدرجة ≥٢ تُولَّد **أهداف SMART** أسبوعية: baseline، target، أولوية. خطط **IEP** فردية قابلة للمتابعة في `/dashboard/goals`. أنت المرجع لاعتماد منطق توليد الأهداف وربطها بالمعايير.',
    bodyEn:
      'From items scored ≥2, **weekly SMART goals** are generated: baseline, target, priority. Individual **IEP** plans are trackable at `/dashboard/goals`. You are the authority for approving goal-generation logic and criterion linkage.',
    methodologyAr: [
      'محرك الأهداف يقرأ نتائج التقييم',
      'المختص/ولي الأمر يتابع التقدّم أسبوعياً',
      'GAS scale لمقارنة التقدّم بين الجلسات',
    ],
    methodologyEn: [
      'Goals engine reads assessment results',
      'Specialist/parent tracks weekly progress',
      'GAS scale compares progress across sessions',
    ],
    advisorRoleAr:
      'راجع صياغة الأهداف وملاءمتها التربوية — اقترح معايير اعتماد IEP في Hub.',
    advisorRoleEn:
      'Review goal wording and educational fit — propose IEP approval criteria in Hub.',
    explore: [
      { href: '/dashboard/goals', labelAr: 'لوحة الأهداف', labelEn: 'Goals board' },
    ],
  },
  {
    id: 'sensory',
    titleAr: 'الغرف الحسية',
    titleEn: 'Sensory rooms',
    summaryAr: '٩ بيئات تفاعلية — تجريب ومقاييس جلسة.',
    summaryEn: '9 interactive environments — pilot & session metrics.',
    bodyAr:
      '**٩ غرفاً حسية** (فقاعات، نجوم، تتبع، رمل، حيوانات، أمواج، مطر، مرآة…): بيئات **تجريبية** لقياس الاستجابة الحسية مع حدود آمنة للصوت والإضاءة. تُسجَّل مقاييس الجلسة (مدة، تفاعل، هدوء). **ليست** جزءاً رسمياً من Canon 36 لكنها محور **الدراسة الميدانية** في اتفاقيتك.',
    bodyEn:
      '**9 sensory rooms** (bubbles, stars, tracing, sand, animals, waves, rain, mirror…): **pilot** environments measuring sensory response with safe audio/light limits. Session metrics (duration, engagement, calm) are logged. **Not** part of official Canon 36 but central to your agreement\'s **field study**.',
    methodologyAr: [
      'الدخول من /sensory-rooms',
      'كل جلسة تُسجَّل محلياً مع مقاييس',
      'توصيات تلقائية حسب نمط الاستجابة',
    ],
    methodologyEn: [
      'Entry from /sensory-rooms',
      'Each session logged locally with metrics',
      'Automatic recommendations by response pattern',
    ],
    advisorRoleAr:
      'اختبر كل غرفة، وثّق المقاييس، وقدّم مقترحات «مقاييس الغرف الحسية» في Hub.',
    advisorRoleEn:
      'Test each room, document metrics, and submit "Sensory metrics" proposals in Hub.',
    explore: [
      { href: '/sensory-rooms', labelAr: 'فهرس الغرف', labelEn: 'Room index' },
    ],
  },
  {
    id: 'classroom',
    titleAr: 'الصف المنزلي والأدوات',
    titleEn: 'Home classroom & tools',
    summaryAr: 'أنشطة ABA/TEACCH رقمية + بنك أدوات.',
    summaryEn: 'Digital ABA/TEACCH activities + tools bank.',
    bodyAr:
      '**الصف المنزلي:** مطابقة، تمييز، تصنيف، تسمية — مع **تدرّج مساعدة** (Prompt Hierarchy). **بنك الأدوات:** استراتيجيات جاهزة للمختص والأهل. **مرشد تآلف (Merhid):** مساعد ذكي بحدود صارمة — لا تشخيص.',
    bodyEn:
      '**Home classroom:** matching, discrimination, sorting, labeling — with **prompt hierarchy**. **Tools bank:** ready strategies for specialists and parents. **Merhid assistant:** AI helper with strict limits — no diagnosis.',
    methodologyAr: [
      'الصف المنزلي: /dashboard/home-classroom',
      'بنك الأدوات: /dashboard/tools-bank',
      'Merhid متاح في Hub ب نطاق scientific_advisor',
    ],
    methodologyEn: [
      'Home classroom: /dashboard/home-classroom',
      'Tools bank: /dashboard/tools-bank',
      'Merhid available in Hub with scientific_advisor scope',
    ],
    advisorRoleAr:
      'جرّب الأنشطة وقيّم المنهجية التربوية — اقترح تحسينات في «ملاحظة بحثية».',
    advisorRoleEn:
      'Try activities and evaluate educational methodology — propose improvements as "Research note".',
    explore: [
      {
        href: '/dashboard/home-classroom',
        labelAr: 'الصف المنزلي',
        labelEn: 'Home classroom',
      },
      {
        href: '/dashboard/tools-bank',
        labelAr: 'بنك الأدوات',
        labelEn: 'Tools bank',
      },
    ],
  },
  {
    id: 'advisor_workflow',
    titleAr: 'دورك ومن أين تبدأ — سير العمل Async',
    titleEn: 'Your role & where to start — Async workflow',
    summaryAr: 'Hub، غرفة الاجتماعات، الاعتماد، والخطوات العملية.',
    summaryEn: 'Hub, meeting room, approval, and practical steps.',
    bodyAr:
      '**سير عملك (Async Mode):** (١) أكمل اعتماد كل أقسام هذا الدليل. (٢) وقّع اتفاقية الشراكة. (٣) **غرفة الاجتماعات:** قدّم مقترحات (تقييم سريري · ملاحظة بحثية · مقاييس حسية · نقاش) — تبدأ «قيد المراجعة». (٤) **حازم** يعتمد أو يرفض — لا نشر دون موافقته. (٥) اختبر في `/sensory-rooms` و`/dashboard` (وضع اختبار). **لا** تعديل هيكلي · **لا** `/admin`.',
    bodyEn:
      '**Your workflow (Async Mode):** (1) Complete acknowledgment of every guide section. (2) Sign the partnership agreement. (3) **Meeting room:** submit proposals (clinical evaluation · research note · sensory metrics · discussion) — they start as "Pending." (4) **Hazem** approves or rejects — no deploy without his consent. (5) Test in `/sensory-rooms` and `/dashboard` (test mode). **No** structural changes · **No** `/admin`.',
    methodologyAr: [
      'اقتراح → pending → اعتماد حازم → approved → قرار نشر',
      'الردود غير المتزامنة داخل كل منشور',
      'Merhid يساعدك في صياغة المقترحات',
      'الدراسة الميدانية للغرف الحسية = أولوية السنتين',
    ],
    methodologyEn: [
      'Proposal → pending → Hazem approval → approved → deploy decision',
      'Asynchronous replies within each post',
      'Merhid helps draft proposals',
      'Sensory room field study = two-year priority',
    ],
    advisorRoleAr:
      'بعد اعتماد هذا القسم — انتقل لتوقيع المذكرة ثم قدّم أول مقترح في غرفة الاجتماعات.',
    advisorRoleEn:
      'After acknowledging this section — proceed to sign the MOU, then submit your first meeting-room proposal.',
    explore: [
      { href: '/hub?focus=meeting', labelAr: 'غرفة الاجتماعات', labelEn: 'Meeting room' },
      {
        href: '/hub?focus=agreement',
        labelAr: 'اتفاقية الشراكة',
        labelEn: 'Partnership agreement',
      },
    ],
  },
] as const;

export type AdvisorGuideSectionId = (typeof ADVISOR_PLATFORM_SECTIONS)[number]['id'];

export type AdvisorGuideSectionAck = {
  sectionId: AdvisorGuideSectionId;
  acknowledged: boolean;
  acknowledgedAt?: string;
  signerName?: string;
};

export type AdvisorGuideState = {
  version: string;
  sections: Partial<Record<AdvisorGuideSectionId, AdvisorGuideSectionAck>>;
  completedAt?: string;
};

export function emptyAdvisorGuideState(): AdvisorGuideState {
  return { version: ADVISOR_GUIDE_VERSION, sections: {} };
}

export function advisorGuideSectionIds(): AdvisorGuideSectionId[] {
  return ADVISOR_PLATFORM_SECTIONS.map((s) => s.id);
}

export function advisorGuideProgress(state: AdvisorGuideState) {
  const total = ADVISOR_PLATFORM_SECTIONS.length;
  const completed = ADVISOR_PLATFORM_SECTIONS.filter(
    (s) => state.sections[s.id]?.acknowledged
  ).length;
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
}

export function isAdvisorGuideComplete(state: AdvisorGuideState) {
  const { completed, total } = advisorGuideProgress(state);
  return completed === total && total > 0;
}

export function nextUnacknowledgedSectionId(
  state: AdvisorGuideState
): AdvisorGuideSectionId | null {
  for (const section of ADVISOR_PLATFORM_SECTIONS) {
    if (!state.sections[section.id]?.acknowledged) return section.id;
  }
  return null;
}
