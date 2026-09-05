/**
 * مركز تآلف السريري والبحثي — مساحة تعاون خاصة بين حازم (الإدارة)
 * ود. سامر (المستشار العلمي). ليست بوابة عامة للأخصائيين أو الأهل.
 */

export const HUB_PATH = '/hub';
export const HUB_NAME_AR = 'مركز تآلف السريري والبحثي';
export const HUB_NAME_EN = 'Taaluf Clinical & Research Hub';

export type HubSessionRole = 'admin' | 'scientific_advisor';
export type HubMemberId = 'hazem' | 'samer';

export type HubPostCategory =
  | 'clinical_evaluation'
  | 'research_note'
  | 'sensory_metrics'
  | 'discussion';

export type HubPostStatus = 'pending' | 'approved';

export type HubMember = {
  id: HubMemberId;
  sessionRole: HubSessionRole;
  demoUserId: string;
  emails: readonly string[];
  nameAr: string;
  nameEn: string;
  titleAr: string;
  titleEn: string;
};

export const HUB_MEMBERS: Record<HubMemberId, HubMember> = {
  hazem: {
    id: 'hazem',
    sessionRole: 'admin',
    demoUserId: 'usr_admin',
    emails: ['admin@taaluf.local'],
    nameAr: 'حازم',
    nameEn: 'Hazem',
    titleAr: 'المدير التنفيذي · المشرف العام',
    titleEn: 'Administrator · Super admin',
  },
  samer: {
    id: 'samer',
    sessionRole: 'scientific_advisor',
    demoUserId: 'usr_advisor',
    emails: ['samer@taaluf.local', 'advisor@taaluf.local'],
    nameAr: 'د. سامر',
    nameEn: 'Dr. Samer',
    titleAr: 'المستشار العلمي',
    titleEn: 'Scientific Advisor',
  },
};

export const HUB_POST_CATEGORIES: Record<
  HubPostCategory,
  { ar: string; en: string }
> = {
  clinical_evaluation: {
    ar: 'تقييم سريري',
    en: 'Clinical evaluation',
  },
  research_note: {
    ar: 'ملاحظة بحثية',
    en: 'Research note',
  },
  sensory_metrics: {
    ar: 'مقترح مقاييس الغرف الحسية',
    en: 'Sensory room metrics proposal',
  },
  discussion: {
    ar: 'نقاش عام',
    en: 'Discussion',
  },
};

export type HubReply = {
  id: string;
  authorRole: HubSessionRole;
  authorName: string;
  authorMemberId: HubMemberId;
  body: string;
  createdAt: string;
};

export type HubPost = {
  id: string;
  category: HubPostCategory;
  title: string;
  body: string;
  status: HubPostStatus;
  authorRole: HubSessionRole;
  authorName: string;
  authorMemberId: HubMemberId;
  createdAt: string;
  updatedAt: string;
  statusChangedBy?: string;
  statusChangedAt?: string;
  replies: HubReply[];
};

export type MouPartySignOff = {
  memberId: HubMemberId;
  signed: boolean;
  signedAt?: string;
  signerName?: string;
};

export type MouState = {
  version: string;
  termYears: 2;
  hazem: MouPartySignOff;
  samer: MouPartySignOff;
};

export type MouOverallStatus =
  | 'pending'
  | 'awaiting_hazem'
  | 'awaiting_samer'
  | 'executed';

export type ClinicalHubSnapshot = {
  posts: HubPost[];
  mou: MouState;
};

export type HubActor = {
  memberId: HubMemberId;
  role: HubSessionRole;
  nameAr: string;
  nameEn: string;
  titleAr: string;
  titleEn: string;
};

export const ADVISORY_MOU_VERSION = '2026.2-strategic-advisory';

export const ADVISORY_MOU = {
  version: ADVISORY_MOU_VERSION,
  termYears: 2 as const,
  titleAr:
    'مذكرة تفاهم شراكة استراتيجية استشارية (المستشار العلمي والتشخيصي الرئيسي)',
  titleEn:
    'Strategic Advisory Partnership Memorandum of Understanding (Chief Scientific & Diagnostic Advisor)',
  preambleAr:
    'تُبرم هذه المذكرة («المذكرة») بين مركز تآلف للتأهيل والدعم النمائي («المركز»)، ويمثّله حازم بصفته المدير التنفيذي والمشرف العام («الإدارة»)، وبين د. سامر بصفته المستشار العلمي والتشخيصي الرئيسي المستقل («المستشار»). تبدأ المدة من تاريخ اعتماد الطرفين معاً وتستمر سنتين (٢) ميلاديتين، ما لم تُنهَ أو تُجدَّد بموافقة كتابية صريحة من الطرفين.',
  preambleEn:
    'This Memorandum of Understanding (the "MOU") is entered into between Taaluf Rehabilitation & Developmental Support Center (the "Center"), represented by Hazem as Chief Executive Officer and Super Administrator ("Admin"), and Dr. Samer as independent Chief Scientific & Diagnostic Advisor (the "Advisor"). The term commences upon dual sign-off by both parties and continues for two (2) calendar years, unless terminated or renewed by explicit written agreement of both parties.',
  clauses: [
    {
      id: 'appointment',
      titleAr: 'التعيين وطبيعة العلاقة',
      titleEn: 'Appointment & nature of engagement',
      bodyAr:
        'يُعيَّن المستشار بصفة «المستشار العلمي والتشخيصي الرئيسي» لمدة المذكرة. العلاقة استشارية واستراتيجية بحتة: ليست عقد توظيف، ولا شراكة تشغيلية، ولا وكالة تشخيصية سريرية. دور المستشار يقتصر على المراجعة العلمية، الاختبار في بيئات معزولة، والاقتراح عبر مركز تآلف السريري والبحثي. المنصة أداة تربوية وتأهيلية مساعدة؛ لا تُمنح للمستشار صلاحية إصدار تشخيصات طبية أو نفسية ملزمة أو تقديم خدمات علاجية مباشرة للأطفال أو الأسر.',
      bodyEn:
        "The Advisor is appointed as Chief Scientific & Diagnostic Advisor for the MOU term. The relationship is strictly advisory and strategic: it is not employment, not an operating partnership, and not a clinical diagnostic agency. The Advisor's role is limited to scientific review, testing in sandboxed environments, and proposal via the Taaluf Clinical & Research Hub. The platform is an educational and rehabilitative support tool; the Advisor is not authorized to issue binding medical or psychological diagnoses or deliver direct therapeutic services to children or families.",
    },
    {
      id: 'revenue',
      titleAr: 'توزيع الإيرادات',
      titleEn: 'Revenue allocation',
      bodyAr:
        'يُتفق على توزيع صافي الإيرادات القابلة للتوزيع الناتجة عن أنشطة المركز والمنصة المرتبطة بهذه الشراكة الاستشارية — بعد خصم التكاليف التشغيلية المباشرة والضرائب والرسوم القانونية المعتمدة — على النحو الآتي: سبعون بالمائة (٧٠٪) للمركز (حازم / الإدارة)، وثلاثون بالمائة (٣٠٪) للمستشار (د. سامر). يُحدَّد تعريف «صافي الإيرادات القابلة للتوزيع» ودورية التسوية (ربع سنوية أو حسب الاتفاق الكتابي) في ملحق مالي منفصل أو بيانات محاسبية معتمدة من الإدارة، مع حق المستشار في الاطلاع على ملخص التوزيع ذي الصلة.',
      bodyEn:
        'Net distributable revenue arising from Center and platform activities covered by this advisory partnership—after deduction of direct operating costs, taxes, and approved legal fees—shall be allocated as follows: seventy percent (70%) to the Center (Hazem / Admin) and thirty percent (30%) to the Advisor (Dr. Samer). The definition of "net distributable revenue," settlement cadence (quarterly or as otherwise agreed in writing), and supporting accounting statements shall be set forth in a separate financial schedule or Admin-approved summary, with the Advisor\'s right to review relevant allocation summaries.',
    },
    {
      id: 'equity',
      titleAr: 'حافز الملكية متدرجة الاستحقاق (٥٪)',
      titleEn: 'Vested equity incentive (5%)',
      bodyAr:
        'يُقرّ الطرفان بمنح المستشار حافز ملكية متدرجة الاستحقاق بنسبة خمسة بالمائة (٥٪) من حصة المركز في المنصة/الكيان ذي الصلة، تُستحق على مدى سنتي المذكرة، وترتبط حصرياً بتحقيق معالم بحثية وسريرية محددة مسبقاً للتحقق والاعتماد، تشمل — دون حصر —: (أ) إنجاز خطة التحقق السريري المعتمدة؛ (ب) تقديم مقترحات علمية معتمدة من الإدارة؛ (ج) المشاركة في التحقق من مقاييس الغرف الحسية والأدوات التقييمية؛ (د) استكمال مراجعات دورية موثّقة في غرفة الاجتماعات. لا تُنقل أي ملكية فعلية ولا حقوق تصويت إلا بعد تحقق المعالم واعتماد الإدارة كتابياً. يُفصَّل جدول الاستحقاق والمعالم في ملحق ملكية أو محضر اعتماد لاحق.',
      bodyEn:
        "The parties acknowledge a vested equity incentive of five percent (5%) of the Center's relevant platform/entity interest, vesting over the two-year MOU term and tied exclusively to predefined research and clinical validation milestones, including without limitation: (a) completion of the approved clinical validation plan; (b) delivery of Admin-approved scientific proposals; (c) participation in validation of sensory-room metrics and assessment instruments; and (d) completion of documented periodic reviews in the meeting room. No actual ownership or voting rights transfer until milestones are achieved and Admin provides written confirmation. Vesting schedule and milestones shall be detailed in an equity schedule or subsequent approval record.",
    },
    {
      id: 'governance',
      titleAr: 'الحوكمة وصلاحيات الوصول (RBAC)',
      titleEn: 'Governance & role-based access (RBAC)',
      bodyAr:
        'تُدار الشراكة عبر «مركز تآلف السريري والبحثي» — مساحة تعاون غير متزامنة خاصة بالطرفين. للمستشار صلاحيات «مراجعة / اختبار / اقتراح» (Review / Test / Propose) فقط: مراجعة غرفة الاجتماعات، اقتراح تقييمات وملاحظات ومقاييس حسية، واختبار الغرف الحسية وأدوات المختص في بيئات غير إنتاجية. تحتفظ الإدارة (حازم) حصرياً بصلاحيات «اعتماد / نشر / تعديل هيكلي» (Approve / Deploy / Structural Modification): اعتماد المقترحات، تعديلات البنية والشيفرة، نشر الإنتاج، ولوحة الإدارة العليا. لا يُنفَّذ أي مقترح — سريرياً أو بحثياً أو تقنياً — دون اعتماد صريح من الإدارة.',
      bodyEn:
        'The partnership is governed through the Taaluf Clinical & Research Hub—a private, asynchronous collaboration workspace for both parties. The Advisor holds Review / Test / Propose permissions only: access to the meeting room, submission of evaluations, notes, and sensory metrics proposals, and testing of sensory rooms and specialist tools in non-production environments. Admin (Hazem) retains exclusive Approve / Deploy / Structural Modification authority: proposal approval, platform structure and code changes, production deployment, and super-admin panel access. No proposal—clinical, research, or technical—shall be executed without explicit Admin approval.',
    },
    {
      id: 'approval',
      titleAr: 'سير اعتماد المقترحات',
      titleEn: 'Proposal approval workflow',
      bodyAr:
        'كل مقترح يُقدَّم عبر غرفة الاجتماعات يبدأ بحالة «قيد المراجعة». لا يُعدّ معتمداً للتنفيذ أو النشر أو الدمج في الإنتاج إلا بعد تبديل حالته إلى «معتمد» من الإدارة وحدها. اعتماد المقترح لا يمنح المستشار أي صلاحية نشر أو تعديل هيكلي. للإدارة حق رفض أي مقترح أو طلب مراجعات إضافية دون التزام بمبرر مكتوب، مع إمكانية توثيق المناقشة داخل الغرفة.',
      bodyEn:
        'Every proposal submitted through the meeting room begins in Pending status. It shall not be deemed approved for implementation, publication, or production integration until Admin alone toggles its status to Approved. Proposal approval does not grant the Advisor deploy or structural-modification rights. Admin may reject any proposal or request revisions without a written justification obligation, while discussion may be documented within the room.',
    },
    {
      id: 'confidentiality',
      titleAr: 'السرية وحماية البيانات',
      titleEn: 'Confidentiality & data protection',
      bodyAr:
        'يلتزم الطرفان بحماية سرية جميع المعلومات المتبادلة بموجب هذه المذكرة، بما في ذلك — دون حصر —: الشيفرة المصدرية للمنصة، بنية قواعد البيانات، تصميمات واجهات النظام، بيانات الأطفال وذويهم، سجلات التقييم، ومحتوى غرفة الاجتماعات. تُحظر مشاركة أي من ذلك مع طرف ثالث دون موافقة كتابية مسبقة من الإدارة، إلا حيث يفرض القانون خلاف ذلك. يلتزم المستشار بمعايير حماية البيانات المعمول بها في المركز وعدم نسخ أو استخراج البيانات خارج بيئة المركز المعتمدة.',
      bodyEn:
        "Both parties shall maintain strict confidentiality of all information exchanged under this MOU, including without limitation: platform source code, database architecture, system interface designs, child and family data, assessment records, and meeting-room content. None of the foregoing may be shared with any third party without Admin's prior written consent, except as required by law. The Advisor shall comply with the Center's data-protection standards and shall not copy or extract data outside the Center's approved environment.",
    },
    {
      id: 'ip',
      titleAr: 'الملكية الفكرية',
      titleEn: 'Intellectual property',
      bodyAr:
        'تبقى ملكية المنصة، الشيفرة، البنية التحتية، قواعد البيانات، العلامة التجارية «تآلف»، وكل المواد التقنية والتشغيلية المطوّرة أو المملوكة للمركز قبل أو خلال مدة المذكرة — حصرياً للمركز (حازم / الإدارة). المقترحات والملاحظات البحثية والسريرية التي يقدّمها المستشار تُرخّص للمركز ترخيصاً غير حصري، عالمياً، ومجانياً، للاستخدام التشغيلي والبحثي داخل المنصة، مع الإقرار بمصدرها الاستشاري. لا ينقل المستشار أي حقوق ملكية في المنصة إلا وفق بند حافز الملكية أعلاه عند استيفاء شروط الاستحقاق.',
      bodyEn:
        "Ownership of the platform, source code, infrastructure, databases, the \"Taaluf\" brand, and all technical and operational materials developed or owned by the Center before or during the MOU term remains exclusively with the Center (Hazem / Admin). Research and clinical proposals and notes submitted by the Advisor are licensed to the Center on a non-exclusive, worldwide, royalty-free basis for operational and research use within the platform, with advisory attribution. The Advisor transfers no ownership interest in the platform except pursuant to the equity incentive clause above upon satisfaction of vesting conditions.",
    },
    {
      id: 'term',
      titleAr: 'المدة والإنهاء والتجديد',
      titleEn: 'Term, termination & renewal',
      bodyAr:
        'مدة المذكرة سنتان (٢) ميلاديتان من تاريخ اعتماد الطرفين. لأي طرف إنهاء المذكرة بإشعار كتابي مدته ثلاثون (٣٠) يوماً، دون الإخلال بالالتزامات السرية وحقوق الملكية الفكرية وحقوق الإيرادات المستحقة حتى تاريخ الإنهاء. يُجدَّد التعاون فقط بموافقة كتابية صريحة. ينتهي حق الوصول إلى المركز السريري والبحثي مع انتهاء المذكرة أو إنهائها، ما لم يُتفق كتابياً على خلاف ذلك.',
      bodyEn:
        "The MOU term is two (2) calendar years from dual sign-off. Either party may terminate with thirty (30) days' written notice, without prejudice to confidentiality obligations, intellectual-property rights, and revenue entitlements accrued through the termination date. Renewal requires explicit written agreement. Access to the Clinical & Research Hub terminates upon expiry or termination unless otherwise agreed in writing.",
    },
  ],
  footerAr:
    'بالتأكيد أدناه يقرّ كل طرف بأنه قرأ هذه المذكرة وفهم بنودها — بما فيها توزيع الإيرادات (٧٠٪ / ٣٠٪)، حافز الملكية (٥٪)، وصلاحيات الحوكمة — ويوافق عليها. لا تُعد المذكرة نافذة إلا بعد اعتماد حازم (الإدارة) ود. سامر (المستشار) معاً.',
  footerEn:
    'By confirming below, each party acknowledges having read and understood this MOU—including the 70% / 30% revenue split, 5% vested equity incentive, and governance permissions—and agrees to be bound thereby. The MOU is not in force until both Hazem (Admin) and Dr. Samer (Advisor) have signed off.',
} as const;

export function emptyMouState(): MouState {
  return {
    version: ADVISORY_MOU_VERSION,
    termYears: 2,
    hazem: { memberId: 'hazem', signed: false },
    samer: { memberId: 'samer', signed: false },
  };
}

export function mouOverallStatus(mou: MouState): MouOverallStatus {
  if (mou.hazem.signed && mou.samer.signed) return 'executed';
  if (mou.samer.signed && !mou.hazem.signed) return 'awaiting_hazem';
  if (mou.hazem.signed && !mou.samer.signed) return 'awaiting_samer';
  return 'pending';
}

export function isHubSessionRole(
  role?: string | null
): role is HubSessionRole {
  return role === 'admin' || role === 'scientific_advisor';
}

export function canAccessClinicalHub(role?: string | null) {
  return isHubSessionRole(role);
}

export function canProposeOnHub(role?: string | null) {
  return isHubSessionRole(role);
}

export function canApproveHubProposal(role?: string | null) {
  return role === 'admin';
}

export function canModifyPlatformStructure(role?: string | null) {
  return role === 'admin';
}

export function canDeployProduction(role?: string | null) {
  return role === 'admin';
}

export function canAccessHubTestEnvironments(role?: string | null) {
  return isHubSessionRole(role);
}

export function isScientificAdvisorRole(role?: string | null) {
  return role === 'scientific_advisor';
}

export function hubMemberFromSession(user?: {
  id?: string | null;
  email?: string | null;
  role?: string | null;
  name?: string | null;
}): HubActor | null {
  if (!user || !isHubSessionRole(user.role)) return null;
  const email = String(user.email || '').trim().toLowerCase();
  const id = String(user.id || '');

  if (user.role === 'scientific_advisor') {
    return actorFromMember(HUB_MEMBERS.samer);
  }
  if (
    user.role === 'admin' ||
    HUB_MEMBERS.hazem.emails.includes(email) ||
    id === HUB_MEMBERS.hazem.demoUserId
  ) {
    return actorFromMember(HUB_MEMBERS.hazem);
  }
  return actorFromMember(HUB_MEMBERS.hazem);
}

function actorFromMember(member: HubMember): HubActor {
  return {
    memberId: member.id,
    role: member.sessionRole,
    nameAr: member.nameAr,
    nameEn: member.nameEn,
    titleAr: member.titleAr,
    titleEn: member.titleEn,
  };
}

export function displayNameForActor(actor: HubActor, isAr: boolean) {
  return isAr ? actor.nameAr : actor.nameEn;
}

export function isHubPostCategory(value: string): value is HubPostCategory {
  return value in HUB_POST_CATEGORIES;
}

export function isHubPostStatus(value: string): value is HubPostStatus {
  return value === 'pending' || value === 'approved';
}
