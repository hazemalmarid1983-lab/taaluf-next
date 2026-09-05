/**
 * وثيقة اتفاقية الشراكة الاستشارية والبحثية — منصة تآلف ود. سامر.
 * النص المعتمد للعرض في /hub واعتماد الطرفين إلكترونياً.
 */

export const ADVISORY_MOU_VERSION = '2026.4-partnership-agreement';

export const ADVISORY_MOU = {
  version: ADVISORY_MOU_VERSION,
  termYears: 2 as const,
  titleAr: 'وثيقة اتفاقية الشراكة الاستشارية والبحثية (منصة تآلف)',
  titleEn:
    'Advisory & Research Partnership Agreement (Taaluf Platform)',
  preambleAr:
    '**الطرف الأول:** منصة «تآلف» للتأهيل الرقمي والسريري، ويُمثلها **حازم** بصفته مالك المنصة ومطورها والمشرف العام عليها. **الطرف الثاني:** **الدكتور سامر**، بصفته استشاري التشخيص والتربية الخاصة. **المقدمة:** نظراً للرغبة المشتركة في تطوير قطاع التربية الخاصة والتدخل المبكر، واستثماراً للخبرات الأكاديمية والتشخيصية المتقدمة للطرف الثاني في دعم وتمكين البنية السريرية والبحثية لمنصة «تآلف»، فقد اتفق الطرفان وهما بأهليتهما المعتبرة على ما يلي:',
  preambleEn:
    '**First Party:** The "Taaluf" platform for digital and clinical rehabilitation, represented by **Hazem** as platform owner, developer, and super administrator. **Second Party:** **Dr. Samer**, acting as Special Education Diagnosis & Education Consultant. **Preamble:** In view of the shared desire to advance special education and early intervention, and to invest the Second Party\'s advanced academic and diagnostic expertise in supporting and enabling the clinical and research infrastructure of the "Taaluf" platform, the parties—being duly qualified—have agreed as follows:',
  clauses: [
    {
      id: 'title_and_role',
      titleAr: 'المسمى والموقع الاستشاري',
      titleEn: 'Advisory title & position',
      bodyAr:
        'يُعيَّن الطرف الثاني بصفة **«رئيس المجلس الاستشاري والسريري العام»** لمنصة تآلف. يُعتبر الطرف الثاني **المرجع العلمي والبحثي الأول** لاعتماد أدوات التشخيص، مقاييس النمو، وخطط التدخل الفردية (IEP) داخل المنصة.',
      bodyEn:
        'The Second Party is appointed as **Chief Advisory & Clinical Council Chair** of the Taaluf platform. The Second Party shall serve as the **primary scientific and research authority** for approving diagnostic instruments, developmental metrics, and Individualized Education Plans (IEPs) within the Platform.',
    },
    {
      id: 'term',
      titleAr: 'مدة التعاقد',
      titleEn: 'Contract term',
      bodyAr:
        'تبدأ هذه الاتفاقية اعتباراً من **تاريخ توقيعها** وتستمر لمدة **سنتين كاملتين (٢٤ شهراً)**. **تتجدد** الاتفاقية **تلقائياً** لفترات مماثلة ما لم يُخطر أحد الطرفين الآخر **كتابياً** برغبته في **عدم التجديد** قبل نهاية المدة **بشهرين (٢)**.',
      bodyEn:
        'This Agreement commences on the **date of execution** and continues for **two full years (24 months)**. The Agreement **renews automatically** for equivalent periods unless either party gives the other **written notice of non-renewal** at least **two (2) months** before the end of the current term.',
    },
    {
      id: 'scope_async',
      titleAr: 'نطاق العمل والمهام البحثية (Async Mode)',
      titleEn: 'Scope of work & research duties (Async Mode)',
      bodyAr:
        '**(١) الإشراف على الدراسة الميدانية:** قيادة وتوجيه البرنامج التجريبي الميداني لقياس أثر الغرف الحسية وتوثيق نتائجها علمياً لخدمة الأوراق البحثية والتقارير المؤسسية. **(٢) المراجعة الدورية:** التدقيق المستمر لأدوات التقييم الشامل ومواءمتها مع أحدث المعايير الأكاديمية والتشخيصية. **(٣) العمل غير المتزامن (Async Work):** تتم كافة الاستشارات، المراجعات، وتقديم الرأي العلمي عبر **بيئة العمل الرقمية المشفرة** المخصصة للطرفين — «مركز تآلف السريري والبحثي» — بما يضمن **السرية التامة** و**حرية التوقيت** بما يتناسب مع ظروف الطرف الثاني.',
      bodyEn:
        '**(1) Field-study supervision:** Leading and directing the pilot field program to measure sensory-room impact and document outcomes scientifically for research papers and institutional reports. **(2) Periodic review:** Continuous audit of comprehensive assessment tools and alignment with current academic and diagnostic standards. **(3) Asynchronous work (Async Mode):** All consultations, reviews, and scientific opinions shall be delivered via the parties\' dedicated **encrypted digital workspace**—the Taaluf Clinical & Research Hub—ensuring **full confidentiality** and **scheduling flexibility** suited to the Second Party\'s circumstances.',
    },
    {
      id: 'financial',
      titleAr: 'الحقوق المالية ومقابل الخدمات',
      titleEn: 'Financial rights & consideration',
      bodyAr:
        '**(١) عوائد الاستشارات والتقييمات:** يتقاضى الطرف الثاني نسبة **ثلاثون بالمائة (٣٠٪) صافية** من إيرادات أي **جلسة تقييم متقدمة** أو **استشارة تشخيصية تخصصية** يشرف عليها عبر المنصة، مقابل **سبعين بالمائة (٧٠٪)** للمنصة لتغطية التشغيل والتقنية. **(٢) حافز الشراكة البحثية المشروطة:** تُخصَّص للطرف الثاني نسبة **شراكة استشارية معنوية/تراكمية** قدرها **خمسة بالمائة (٥٪)** من المنصة، وتُفعَّل ك**حافز ولاء واستمرارية** مرتبط بإنجاز الدراسات الميدانية واعتماد الأبحاث على مدار السنتين.',
      bodyEn:
        '**(1) Consultation & assessment proceeds:** The Second Party shall receive a **net thirty percent (30%)** share of revenue from any **advanced assessment session** or **specialist diagnostic consultation** supervised through the Platform, with **seventy percent (70%)** retained by the Platform for operations and technology. **(2) Conditional research-partnership incentive:** A **symbolic/cumulative advisory partnership** stake of **five percent (5%)** in the Platform is allocated to the Second Party, activated as a **loyalty and continuity incentive** tied to completion of field studies and approval of research over the two-year term.',
    },
    {
      id: 'confidentiality_ip',
      titleAr: 'السرية والملكية الفكرية',
      titleEn: 'Confidentiality & intellectual property',
      bodyAr:
        '**(١) الملكية الفكرية:** يقر الطرف الثاني بأن كامل البنية التقنية، البرمجية، الأكواد، وتصميم واجهات المنصة هي **ملكية فكرية خالصة ومصونة للطرف الأول**. **(٢) السرية:** يلتزم الطرفان **التزاماً مطلقاً** بسرية بيانات الحالات، المستفيدين، وخصوصية العمل، و**لا يحق** لأي طرف الإفصاح عن تفاصيل التعاون التقني خارج نطاق المساحة المخصصة، إلا حيث يُلزم القانون خلاف ذلك.',
      bodyEn:
        '**(1) Intellectual property:** The Second Party acknowledges that all technical architecture, software, source code, and Platform interface design are the **exclusive and protected intellectual property of the First Party**. **(2) Confidentiality:** Both parties undertake **absolute confidentiality** regarding case data, beneficiaries, and the privacy of their collaboration. **Neither party** may disclose technical collaboration details outside the designated workspace, except where required by law.',
    },
  ],
  footerAr:
    '**التوقيع الإلكتروني:** بإدخال الاسم الكامل والضغط على «أؤكد التوقيع»، يُقرّ كل طرف باطلاعه على هذه الوثيقة وموافقته عليها بكامل بنودها، بما في ذلك المسمى الاستشاري، مدة التعاقد (٢٤ شهراً) والتجديد التلقائي، نطاق العمل غير المتزامن، التوزيع المالي (٧٠٪ / ٣٠٪)، وحافز الشراكة (٥٪). **لا تُعدّ الاتفاقية نافذة** إلا بعد توقيع **الطرف الأول (المطور)** و**الطرف الثاني (د. سامر)** **معاً**. التاريخ: ____ / ____ / 2026 م. النسخة: ' +
    ADVISORY_MOU_VERSION +
    '.',
  footerEn:
    '**Electronic execution:** By entering a full legal name and selecting "Confirm sign-off," each party confirms they have read and accept this Agreement in full, including the advisory title, the 24-month term with automatic renewal, asynchronous work scope, the 70% / 30% revenue split, and the 5% partnership incentive. **The Agreement is not effective** until both the **First Party (Developer)** and **Second Party (Dr. Samer)** have signed. Date: ____ / ____ / 2026. Version: ' +
    ADVISORY_MOU_VERSION +
    '.',
} as const;
