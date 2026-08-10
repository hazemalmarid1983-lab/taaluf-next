# 🚀 دليل تنفيذ منصة "تآلف" - لبيئة Cursor + Airtable + Vercel
## الإصدار التنفيذي 2.0 | أغسطس 2026

---

## 1. 🏗️ هيكل المشروع (Project Structure)

```
taalof-platform/
├── 📁 app/                          # Next.js 14 App Router
│   ├── 📁 (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── 📁 dashboard/
│   │   ├── page.tsx                 # لوحة التحكم الرئيسية
│   │   ├── 📁 students/
│   │   │   ├── page.tsx             # قائمة الطلاب
│   │   │   ├── [id]/page.tsx        # ملف الطالب
│   │   │   └── new/page.tsx         # إضافة طالب جديد
│   │   ├── 📁 assessments/
│   │   │   ├── page.tsx             # قائمة التقييمات
│   │   │   ├── [id]/page.tsx        # صفحة التقييم
│   │   │   └── new/page.tsx         # تقييم جديد
│   │   ├── 📁 reports/
│   │   │   └── page.tsx             # التقارير والإحصائيات
│   │   └── layout.tsx               # تخطيط لوحة التحكم
│   ├── 📁 api/                      # API Routes
│   │   ├── 📁 airtable/
│   │   │   ├── students/route.ts
│   │   │   ├── assessments/route.ts
│   │   │   └── criteria/route.ts
│   │   ├── 📁 ai/
│   │   │   ├── analyze/route.ts     # تحليل AI
│   │   │   └── speech/route.ts      # تحليل الصوت
│   │   └── 📁 reports/
│   │       └── generate/route.ts    # توليد التقرير PDF
│   ├── layout.tsx
│   └── page.tsx                     # الصفحة الرئيسية
├── 📁 components/
│   ├── 📁 ui/                       # مكونات shadcn/ui
│   ├── 📁 assessment/
│   │   ├── CriteriaCard.tsx         # بطاقة معيار التقييم
│   │   ├── CriteriaSlider.tsx       # شريط التقييم 0-3
│   │   ├── RadarChart.tsx           # الرسم البياني الشعاعي
│   │   └── AssessmentForm.tsx       # نموذج التقييم الكامل
│   ├── 📁 students/
│   │   ├── StudentCard.tsx
│   │   └── StudentForm.tsx
│   └── 📁 reports/
│       └── ReportPDF.tsx
├── 📁 lib/
│   ├── airtable.ts                  # إعداد Airtable Client
│   ├── openai.ts                    # إعداد OpenAI Client
│   ├── auth.ts                      # إعداد NextAuth
│   └── utils.ts
├── 📁 types/
│   └── index.ts                     # تعريفات TypeScript
├── 📁 hooks/
│   ├── useAirtable.ts               # Custom Hook للـ Airtable
│   └── useAssessment.ts             # Custom Hook للتقييم
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── package.json
└── README.md
```

---

## 2. 🔧 إعداد Airtable (Database Schema)

### 2.1 قاعدة البيانات: "TaalofDB"

#### 📋 جدول: Students (الطلاب)
| الحقل | النوع | الوصف |
|-------|-------|-------|
| `ID` | AutoNumber | معرف فريد |
| `Name` | SingleLineText | اسم الطفل |
| `DOB` | Date | تاريخ الميلاد |
| `Age` | Formula | `DATETIME_DIFF(TODAY(), DOB, 'years')` |
| `Gender` | SingleSelect | ذكر / أنثى |
| `ParentName` | SingleLineText | اسم ولي الأمر |
| `ParentPhone` | Phone | هاتف ولي الأمر |
| `ParentEmail` | Email | بريد ولي الأمر |
| `Diagnosis` | SingleSelect | توحد / صعوبات تعلم / تأخر نمائي / نطق / ADHD |
| `Status` | SingleSelect | نشط / متوقف مؤقتاً / مغادر |
| `FaceImage` | Attachment | صورة الوجه |
| `Notes` | LongText | ملاحظات عامة |
| `CreatedAt` | CreatedTime | تاريخ الإنشاء |
| `Assessments` | LinkToAnotherRecord → Assessments | ربط بالتقييمات |

#### 📋 جدول: Specialists (الأخصائيين)
| الحقل | النوع | الوصف |
|-------|-------|-------|
| `ID` | AutoNumber | معرف فريد |
| `Name` | SingleLineText | اسم الأخصائي |
| `Email` | Email | البريد (للتسجيل) |
| `Specialty` | SingleSelect | تربية خاصة / نطق / نفسي / وظيفي |
| `Phone` | Phone | رقم الهاتف |
| `LicenseNumber` | SingleLineText | رقم الترخيص |
| `Status` | SingleSelect | نشط / غير نشط |
| `Assessments` | LinkToAnotherRecord → Assessments | ربط بالتقييمات |

#### 📋 جدول: Assessments (التقييمات)
| الحقل | النوع | الوصف |
|-------|-------|-------|
| `ID` | AutoNumber | معرف فريد |
| `Student` | LinkToAnotherRecord → Students | الطالب |
| `Specialist` | LinkToAnotherRecord → Specialists | الأخصائي |
| `AssessmentDate` | Date | تاريخ التقييم |
| `AssessmentType` | SingleSelect | أولي / متابعة / نهائي |
| `TotalScore` | Number | المجموع الكلي |
| `MaxScore` | Number | الحد الأقصى |
| `Percentage` | Formula | `(TotalScore / MaxScore) * 100` |
| `Classification` | SingleSelect | طبيعي / خفيف / متوسط / شديد / شديد جداً |
| `AIConfidence` | Number | نسبة ثقة AI (0-100) |
| `AIAnalysis` | LongText | تحليل AI التفصيلي |
| `VideoURL` | URL | رابط الفيديو |
| `AudioURL` | URL | رابط الصوت |
| `Status` | SingleSelect | مسودة / مكتمل / معتمد |
| `NextAssessmentDate` | Date | موعد التقييم القادم |
| `Criteria` | LinkToAnotherRecord → AssessmentCriteria | ربط بالمعايير |
| `Report` | LinkToAnotherRecord → Reports | ربط بالتقرير |
| `CreatedAt` | CreatedTime | تاريخ الإنشاء |

#### 📋 جدول: AssessmentCriteria (معايير التقييم)
| الحقل | النوع | الوصف |
|-------|-------|-------|
| `ID` | AutoNumber | معرف فريد |
| `Assessment` | LinkToAnotherRecord → Assessments | التقييم |
| `Domain` | SingleSelect | التربية الخاصة / النطق / النفسية / الوظيفية / التواصل / السلوك / الأكاديمي / التكيف |
| `CriterionCode` | SingleSelect | C1, C2, C3 ... C24 |
| `CriterionName` | SingleLineText | اسم المؤشر |
| `Score` | Number | الدرجة (0-3) |
| `AINotes` | LongText | ملاحظات AI |
| `SpecialistNotes` | LongText | ملاحظات الأخصائي |
| `Evidence` | Attachment | دليل (صورة/فيديو) |

#### 📋 جدول: Reports (التقارير)
| الحقل | النوع | الوصف |
|-------|-------|-------|
| `ID` | AutoNumber | معرف فريد |
| `Assessment` | LinkToAnotherRecord → Assessments | التقييم |
| `ReportPDF` | Attachment | ملف PDF |
| `GeneratedAt` | CreatedTime | تاريخ التوليد |
| `GeneratedBy` | SingleSelect | AI / أخصائي |

#### 📋 جدول: ParentSurveys (استبيانات الوالدين)
| الحقل | النوع | الوصف |
|-------|-------|-------|
| `ID` | AutoNumber | معرف فريد |
| `Student` | LinkToAnotherRecord → Students | الطالب |
| `ParentName` | SingleLineText | اسم الوالد |
| `Q1_EyeContact` | Number | 0-3 |
| `Q2_JointAttention` | Number | 0-3 |
| ... | ... | ... |
| `Q20_CalmDown` | Number | 0-3 |
| `TotalScore` | Number | المجموع |
| `SubmittedAt` | CreatedTime | تاريخ الإرسال |

#### 📋 جدول: Consents (الموافقات)
| الحقل | النوع | الوصف |
|-------|-------|-------|
| `User` | SingleLineText أو Link → Users | المستخدم |
| `Child` | SingleLineText أو Link → Students | الطفل |
| `ConsentType` | SingleLineText | نوع الموافقة (general_platform / assessment / data_privacy) |
| `ConsentText` | LongText | نص الموافقة المعروض |
| `AcceptedAt` | DateTime | وقت القبول |
| `IPAddress` | SingleLineText | عنوان IP |

#### 📋 جدول: AuditLog (سجل التدقيق)
| الحقل | النوع | الوصف |
|-------|-------|-------|
| `User` | Link → Users أو SingleLineText | المستخدم |
| `Action` | Single select | `login`, `logout`, `create_student`, `create_assessment`, `view_report`, `delete_data`, `consent_accepted` |
| `EntityType` | SingleLineText | `student`, `assessment`, `report`, `consent` |
| `EntityId` | SingleLineText | معرف الكيان |
| `IPAddress` | SingleLineText | عنوان IP |
| `Timestamp` | DateTime | وقت الحدث |
| `UserAgent` | SingleLineText | متصفح/عميل |

#### 📋 جدول: GameSessions (جلسات الألعاب)
| الحقل | النوع | الوصف |
|-------|-------|-------|
| `child_id` | SingleLineText | معرف الطفل |
| `game_code` | SingleLineText | `imitation` أو `visual_tracking` |
| `score` | Number | مجموع النقاط |
| `level_reached` | Number | أعلى مستوى وصل إليه |
| `metrics_json` | LongText | مقاييس JSON (دقة التتبع، معدل التقليد…) |
| `trials_json` | LongText | سجل المحاولات JSON |
| `started_at` | DateTime | بداية الجلسة |
| `ended_at` | DateTime | نهاية الجلسة |

#### 📋 جدول: Payments (المدفوعات)
| الحقل | النوع | الوصف |
|-------|-------|-------|
| `chargeId` | SingleLineText (أساسي) | معرف عملية Tap |
| `userId` | SingleLineText | المستخدم |
| `childId` | SingleLineText | الطفل |
| `amount` | Number | المبلغ |
| `currency` | Single select | `SAR`, `AED`, `EGP`, `USD` |
| `status` | Single select | `pending`, `captured`, `failed`, `refunded` |
| `description` | SingleLineText | وصف العملية |
| `createdAt` | DateTime | وقت الإنشاء |

#### 📋 جدول: Messages (الرسائل)
| الحقل | النوع | الوصف |
|-------|-------|-------|
| `From` | SingleLineText | معرف المرسل |
| `To` | SingleLineText | معرف المستلم |
| `ChildId` | SingleLineText | الطفل المرتبط |
| `Body` | LongText | نص الرسالة |
| `Read` | Checkbox | مقروءة؟ |
| `CreatedAt` | DateTime | وقت الإرسال |

---

## 3. ⚙️ ملفات الإعداد

### 3.1 `.env.local`
```env
# Airtable
AIRTABLE_API_KEY=patXXXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXXXX
AIRTABLE_BASE_NAME=TaalofDB

# OpenAI
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXX

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Vercel (يتم تعبئتها تلقائياً)
VERCEL_URL=
```

### 3.2 `lib/airtable.ts`
```typescript
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID!);

export const tables = {
  students: base('Students'),
  specialists: base('Specialists'),
  assessments: base('Assessments'),
  criteria: base('AssessmentCriteria'),
  reports: base('Reports'),
  surveys: base('ParentSurveys'),
};

export default base;
```

### 3.3 `lib/openai.ts`
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;
```

### 3.4 `types/index.ts`
```typescript
export interface Student {
  id: string;
  name: string;
  dob: string;
  age: number;
  gender: 'male' | 'female';
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  diagnosis: string;
  status: string;
  faceImage?: string;
  notes?: string;
  createdAt: string;
}

export interface Assessment {
  id: string;
  studentId: string;
  specialistId: string;
  assessmentDate: string;
  assessmentType: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  classification: string;
  aiConfidence?: number;
  aiAnalysis?: string;
  videoURL?: string;
  audioURL?: string;
  status: string;
  nextAssessmentDate?: string;
  createdAt: string;
}

export interface Criterion {
  id: string;
  assessmentId: string;
  domain: string;
  criterionCode: string;
  criterionName: string;
  score: number; // 0-3
  aiNotes?: string;
  specialistNotes?: string;
  evidence?: string[];
}

export interface AssessmentCriteria {
  code: string;
  name: string;
  domain: string;
  description: string;
  levels: {
    0: string;
    1: string;
    2: string;
    3: string;
  };
  recommendation: string;
}

export const CRITERIA_DEFINITIONS: AssessmentCriteria[] = [
  {
    code: 'C1',
    name: 'الاستجابة للتعليمات اللفظية (الامتثال)',
    domain: 'التربية الخاصة',
    description: 'قدرة الطفل على تنفيذ أمر لفظي مباشر خلال 5 ثوانٍ',
    levels: {
      0: 'ينفذ التعليمات فوراً وبشكل متسق (أكثر من 80% من الوقت)',
      1: 'ينفذها أحياناً، أو يحتاج إلى تكرار الأمر أكثر من مرة',
      2: 'يتجاهل التعليمات بشكل متكرر، أو يحتاج إلى مساعدة جسدية',
      3: 'لا يستجيب للتعليمات أبداً',
    },
    recommendation: 'استخدام التعزيز الإيجابي (مكافآت فورية) عند تنفيذ الأمر. تقسيم التعليمات المعقدة إلى خطوات بسيطة.',
  },
  {
    code: 'C2',
    name: 'الانتقال بين الأنشطة (المرونة)',
    domain: 'التربية الخاصة',
    description: 'رد فعل الطفل عند إنهاء نشاط محبوب والبدء في نشاط آخر',
    levels: {
      0: 'ينهي النشاط ويهيئ نفسه للانتقال دون مقاومة',
      1: 'يُظهر تذمراً لفظياً أو تأخيراً، لكنه يمثل خلال دقيقة',
      2: 'نوبة غضب تستمر لأكثر من 5 دقائق، أو يرفض الانتقال تماماً',
      3: 'نوبة غضب شديدة تستمر لأكثر من 15 دقيقة',
    },
    recommendation: 'استخدام "المؤقت البصري" (ساعة رملية ملونة) لإعطاء الطفل تحذيراً بصرياً قبل الانتقال بخمس دقائق.',
  },
  {
    code: 'C3',
    name: 'السلوكيات النمطية والحركات التكرارية',
    domain: 'التربية الخاصة',
    description: 'حركات متكررة بلا هدف أو التعلق الشديد بأشياء معينة',
    levels: {
      0: 'نادراً ما تظهر (مرة واحدة في الأسبوع أو أقل)',
      1: 'تظهر بشكل يومي ولكن يمكن مقاطعتها',
      2: 'تظهر بشكل مستمر ومكثف (أكثر من 50% من الوقت)',
      3: 'تستهكل كل الوقت وتمنع التواصل تماماً',
    },
    recommendation: 'إعادة توجيه الطاقة (استبدال الحركة غير المفيدة بتمارين حركية مفيدة)، وخلق بيئة حسية هادئة.',
  },
  {
    code: 'C4',
    name: 'المبادرة الاجتماعية والتفاعل مع الأقران',
    domain: 'التربية الخاصة',
    description: 'ميل الطفل للاقتراب من الآخرين للمشاركة في اللعب',
    levels: {
      0: 'يبادر بالتفاعل ويسعى لمشاركة ألعابه',
      1: 'يقبل التفاعل إذا بادر الآخرون، لكنه لا يبادر',
      2: 'يتجنب الاقتراب أو الاتصال البصري، وينعزل',
      3: 'لا يتعرف على الأطفال كبشر',
    },
    recommendation: 'خلق فرص للعب المتوازي (اللعب بجانب الطفل وليس معه) ثم التدرج إلى اللعب التعاوني.',
  },
  {
    code: 'C5',
    name: 'التواصل الاستقبالي (فهم اللغة)',
    domain: 'النطق والتخاطب',
    description: 'قدرة الطفل على فهم المفردات والجمل البسيطة',
    levels: {
      0: 'يفهم الجمل المركبة ويحدد الأشياء بالاسم (أكثر من 50 كلمة)',
      1: 'يفهم الأسماء والأفعال البسيطة، يحتاج إشارة بيدك',
      2: 'لا يفهم الكلمات إلا بصورة أو إشارة جسدية قوية',
      3: 'لا يستجيب للكلام أبداً',
    },
    recommendation: 'استخدام البطاقات المصورة (PECS) في البداية، والتحدث بجمل قصيرة جداً وبطيئة وواضحة.',
  },
  {
    code: 'C6',
    name: 'التواصل التعبيري (إنتاج اللغة)',
    domain: 'النطق والتخاطب',
    description: 'عدد الكلمات التي يستخدمها الطفل للتعبير عن رغبته',
    levels: {
      0: 'يستخدم جمل مفيدة (3 كلمات فأكثر) ويسرد قصة قصيرة',
      1: 'يستخدم كلمات مفردة (10-50 كلمة)، قد يظهر تأتأة أو لثغة',
      2: 'لا ينطق بكلمات مفهومة، يستخدم أصواتاً غير واضحة',
      3: 'لا ينطق أبداً، أو يكرر كلمات الآخرين دون فهم (إيكولاليا)',
    },
    recommendation: 'تشجيع التواصل من خلال "الاختيار بين شيئين" واستخدام الأغاني والأناشيد لتحفيز النطق.',
  },
  {
    code: 'C7',
    name: 'البراغماتية (الاستخدام الاجتماعي للغة)',
    domain: 'النطق والتخاطب',
    description: 'قدرة الطفل على استخدام اللغة في السياق الصحيح',
    levels: {
      0: 'يتبادل الحديث بمرونة، ويطرح أسئلة، يستخدم لغة مناسبة',
      1: 'يجيب على الأسئلة لكن لا يطرحها، صوت غير متناسق',
      2: 'يتحدث عن موضوع واحد فقط بغض النظر عن المحيط',
      3: 'لا يتفاعل مع من يخاطبه',
    },
    recommendation: 'القراءة التفاعلية (سؤال الطفل "ماذا يحدث في الصورة؟") والألعاب التمثيلية لتطوير مهارات الحوار.',
  },
  {
    code: 'C8',
    name: 'التنظيم الانفعالي',
    domain: 'النفسية',
    description: 'كيف يتعامل الطفل مع مشاعر الإحباط أو الغضب',
    levels: {
      0: 'يتجاوزها بمساعدة بسيطة أو بمفرده خلال 5 دقائق',
      1: 'يستجيب للتشتيت خلال 10 دقائق',
      2: 'نوبات غضب شديدة تستمر لأكثر من 15 دقيقة',
      3: 'يصاب عليه تهديد نفسه ذاتياً',
    },
    recommendation: 'تعليم الطفل "التنفس العميق" أو استخدام "ركن الهدوء" (Corner of Calm) مزود بألعاب حسية.',
  },
  {
    code: 'C9',
    name: 'الانتباه والتركيز',
    domain: 'النفسية',
    description: 'قدرة الطفل على التركيز في مهمة واحدة دون تشتت',
    levels: {
      0: 'يستطيع التركيز لأكثر من 10 دقائق ويكمل المهمة',
      1: 'ينتبه لكنه يشتت بسرعة، يحتاج تذكير متكرر',
      2: 'شديد التشتت، لا يستطيع الجلوس لإنهاء أي مهمة',
      3: 'لا يركز أكثر من دقيقتين',
    },
    recommendation: 'تقسيم المهمة إلى أجزاء صغيرة (3-5 دقائق) مع مكافأة فورية. مكتب عمل خالٍ من المثيرات.',
  },
  {
    code: 'C10',
    name: 'القلق والخوف من المجهول',
    domain: 'النفسية',
    description: 'مدى معاناة الطفل من مخاوف غير مبررة',
    levels: {
      0: 'مخاوف طبيعية متعلقة بعمره ويتجاوزها بسهولة',
      1: 'قلق واضح في مواقف معينة، يطمئن بوجود شخص مألوف',
      2: 'قلق دائم ومعيق يمنعه من المشاركة في أنشطة جديدة',
      3: 'أعراض جسدية (آلام بطن، تعرق) تمنعه من الذهاب للمدرسة',
    },
    recommendation: 'استخدام القصص الاجتماعية (Social Stories) لشرح المواقف الجديدة، وجدول يومي مصور يقلل المفاجآت.',
  },
  {
    code: 'C11',
    name: 'اللعب التخيلي والمرونة المعرفية',
    domain: 'النفسية',
    description: 'هل يستخدم الطفل خياله في اللعب أم يلتزم بالاستخدام الحرفي',
    levels: {
      0: 'يبتكر سيناريوهات خيالية معقدة ويغير الأدوار',
      1: 'يمارس اللعب التخيلي لكنه محدود أو يكرر نفس السيناريو',
      2: 'يفضل اللعب الحسي (تكديس المكعبات) أو المتكرر',
      3: 'لا يستخدم الخيال في اللعب أبداً',
    },
    recommendation: 'تشجيع اللعب التخيلي عن طريق المشاركة مع الطفل وتمثيل الأدوار أمامه.',
  },
  {
    code: 'C12',
    name: 'الحساسية الحسية',
    domain: 'الوظيفية',
    description: 'رد فعل الطفل تجاه المثيرات الحسية (صوت، ضوء، لمس)',
    levels: {
      0: 'يمر بمواقف حسية متنوعة دون إزعاج ملحوظ',
      1: 'يغطي أذنيه عند أصوات عالية، يتجنب بعض الأطعمة',
      2: 'ردود فعل هستيرية (صراخ، هروب) تجاه مثيرات حسية معينة',
      3: 'يمنعه من الذهاب لأماكن مزدحمة أو ارتداء ملابس معينة',
    },
    recommendation: 'تقديم "جدول حسي" (فرشاة أسنان ناعمة، سماعات عازلة). استخدام اللمس العميق (الضغط) كوسيلة للتهدئة.',
  },
  {
    code: 'C13',
    name: 'المهارات الحركية الدقيقة',
    domain: 'الوظيفية',
    description: 'قدرة الطفل على التحكم بأصابعه لإنجاز مهام دقيقة',
    levels: {
      0: 'يمسك القلم بشكل صحيح، ويرسم خطوطاً ودوائر، يفك الأزرار',
      1: 'يمسك القلم بقبضة خشناء، صعوبة في رسم الأشكال الهندسية',
      2: 'صعوبة شديدة في الإمساك بالأشياء الصغيرة',
      3: 'لا يستخدم اليدين بشكل وظيفي',
    },
    recommendation: 'اللعب بالمعجون (الطين) لتقوية عضلات الأصابع، واستخدام الملاقط لالتقاط الأشياء الصغيرة.',
  },
  {
    code: 'C14',
    name: 'المهارات الحركية الكبرى',
    domain: 'الوظيفية',
    description: 'قدرة الطفل على المشي، الجري، القفز، صعود السلالم',
    levels: {
      0: 'يمشي ويقفز ويتوازن بشكل يتناسب مع عمره',
      1: 'صعوبة في بعض المهارات (القفز على رجل واحدة)',
      2: 'يمشي بشكل غير ثابت، كثير السقوط',
      3: 'لا يمشي بشكل مستقل',
    },
    recommendation: 'المشي على خطوط مستقيمة، التدحرج على الأرض، القفز على الترامبولين، تمارين التوازن.',
  },
  {
    code: 'C15',
    name: 'التواصل البصري',
    domain: 'التواصل الاجتماعي',
    description: 'ينظر للوجه باستمرار ويتبع النظر',
    levels: {
      0: 'ينظر للوجه باستمرار، يتبع النظر',
      1: 'ينظر أحياناً، يتجنب الاتصال البصري المباشر',
      2: 'نادراً ما ينظر، يحتاج تذكير مستمر',
      3: 'لا ينظر للوجه أبداً، يركز على الأشياء',
    },
    recommendation: 'استخدام ألعاب "النظر في العين" التفاعلية، والتعزيز الإيجابي عند الاتصال البصري.',
  },
  {
    code: 'C16',
    name: 'الاستجابة الاجتماعية',
    domain: 'التواصل الاجتماعي',
    description: 'يستجيب للاسم ويتفاعل مع الآخرين',
    levels: {
      0: 'يستجيب للاسم، يتفاعل مع الآخرين',
      1: 'يستجيب أحياناً، يتأخر في الاستجابة',
      2: 'نادر الاستجابة، يحتاج محفزات قوية',
      3: 'لا يستجيب أبداً، يعيش في عالمه الخاص',
    },
    recommendation: 'استخدام أسماء مفضلة للطفل، والتعزيز الفوري عند الاستجابة.',
  },
  {
    code: 'C17',
    name: 'التعبير عن المشاعر',
    domain: 'التواصل الاجتماعي',
    description: 'يعبر عن الفرح والحزن والغضب بشكل مناسب',
    levels: {
      0: 'يعبر بشكل مناسب',
      1: 'تعبير محدود، يحتاج سياق واضح',
      2: 'تعبير غير ملائم (يضحك في مواقف حزينة)',
      3: 'لا يعبر عن المشاعر أبداً',
    },
    recommendation: 'تعليم التعرف على المشاعر باستخدام بطاقات وجوه، والتمثيل أمام الطفل.',
  },
  {
    code: 'C18',
    name: 'المقاومة للتغيير',
    domain: 'السلوك المقيد',
    description: 'يتقبل التغيير بسهولة أم يقلق',
    levels: {
      0: 'يتقبل التغيير بسهولة',
      1: 'يفضل الروتين لكن يتقبل التغيير',
      2: 'يقلق مع التغيير، يحتاج تحضير مسبق',
      3: 'نوبات غضب شديدة مع أي تغيير',
    },
    recommendation: 'استخدام جدول يومي مصور، وإعطاء تحذير مسبق قبل أي تغيير.',
  },
  {
    code: 'C19',
    name: 'الاهتمامات المقيدة',
    domain: 'السلوك المقيد',
    description: 'اهتمامات متنوعة أم شديدة بموضوع واحد',
    levels: {
      0: 'اهتمامات متنوعة ومناسبة للعمر',
      1: 'اهتمام شديد بموضوع معين',
      2: 'اهتمام شديد يتداخل مع الأنشطة الأخرى',
      3: 'اهتمام واحد فقط يستهلك كل الوقت',
    },
    recommendation: 'استخدام الاهتمام المفضل كمكافأة، وتوسيع الاهتمامات تدريجياً.',
  },
  {
    code: 'C20',
    name: 'القراءة',
    domain: 'الأكاديمي',
    description: 'يقرأ بسلاسة ويفهم ما يقرأ',
    levels: {
      0: 'يقرأ بسلاسة، يفهم ما يقرأ',
      1: 'يقرأ ببطء، يحتاج دعم',
      2: 'يقرأ كلمات بسيطة فقط',
      3: 'لا يعرف الحروف',
    },
    recommendation: 'استخدام الكتب المصورة، والقراءة الجهرية مع الطفل.',
  },
  {
    code: 'C21',
    name: 'الكتابة',
    domain: 'الأكاديمي',
    description: 'يكتب جمل، خط واضح',
    levels: {
      0: 'يكتب جمل، خط واضح',
      1: 'يكتب كلمات، خط غير واضح',
      2: 'يكتب حروف، صعوبة في التحكم بالقلم',
      3: 'لا يكتب أي شيء',
    },
    recommendation: 'تمارين تتبع النقاط، واللعب بالمعجون لتقوية العضلات.',
  },
  {
    code: 'C22',
    name: 'الرياضيات',
    domain: 'الأكاديمي',
    description: 'يحل مسائل مناسبة للعمر',
    levels: {
      0: 'يحل مسائل مناسبة للعمر',
      1: 'يحتاج دعم في العمليات',
      2: 'يعد فقط، لا يفهم العمليات',
      3: 'لا يعرف الأرقام',
    },
    recommendation: 'استخدام المكعبات والأشياء الملموسة لتعليم الأرقام.',
  },
  {
    code: 'C23',
    name: 'العناية الشخصية',
    domain: 'التكيف',
    description: 'يأكل، يلبس، يغسل يديه بمفرده',
    levels: {
      0: 'يأكل، يلبس، يغسل يديه بمفرده',
      1: 'يحتاج تذكير في بعض المهارات',
      2: 'يحتاج مساعدة في معظم المهارات',
      3: 'يعتمد كلياً على الآخرين',
    },
    recommendation: 'تقسيم المهمة إلى خطوات بصرية (PECS)، والتعزيز التدريجي.',
  },
  {
    code: 'C24',
    name: 'السلامة الشخصية',
    domain: 'التكيف',
    description: 'يعرف الخطر ويتجنب الأخطار',
    levels: {
      0: 'يعرف الخطر، يتجنب الأخطار',
      1: 'يحتاج تذكير بالسلامة',
      2: 'يتصرف بتهور أحياناً',
      3: 'لا يدرك الخطر أبداً',
    },
    recommendation: 'تعليم قواعد السلامة باستخدام القصص الاجتماعية والتمثيل.',
  },
];

export const DOMAINS = [
  'التربية الخاصة',
  'النطق والتخاطب',
  'النفسية',
  'الوظيفية',
  'التواصل الاجتماعي',
  'السلوك المقيد',
  'الأكاديمي',
  'التكيف',
];

export const CLASSIFICATIONS = [
  { label: 'طبيعي', min: 0, max: 15, color: '#2D8B5A' },
  { label: 'خفيف', min: 16, max: 30, color: '#4A90D9' },
  { label: 'متوسط', min: 31, max: 50, color: '#F5A623' },
  { label: 'شديد', min: 51, max: 70, color: '#E67E22' },
  { label: 'شديد جداً', min: 71, max: 100, color: '#E74C3C' },
];
```

---

## 4. 🔌 API Endpoints

### 4.1 `app/api/airtable/students/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { tables } from '@/lib/airtable';

export async function GET() {
  try {
    const records = await tables.students.select().all();
    const students = records.map((record) => ({
      id: record.id,
      ...record.fields,
    }));
    return NextResponse.json({ success: true, data: students });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const record = await tables.students.create([
      { fields: body },
    ]);
    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create student' },
      { status: 500 }
    );
  }
}
```

### 4.2 `app/api/ai/analyze/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import openai from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { criteriaScores, studentInfo } = await request.json();

    const prompt = `
أنت أخصائي تقييم متخصص في أطفال التوحد وصعوبات التعلم.

معلومات الطفل:
- الاسم: ${studentInfo.name}
- العمر: ${studentInfo.age}
- التشخيص: ${studentInfo.diagnosis}

درجات التقييم (0=مستقر, 1=متوسط, 2=شديد, 3=شديد جداً):
${JSON.stringify(criteriaScores, null, 2)}

المطلوب:
1. تحليل شامل للنتائج
2. تحديد نقاط القوة
3. تحديد نقاط الضعف
4. توصيات تربوية وتخاطبية ونفسية ووظيفية
5. خطة تدخل مقترحة
6. نسبة ثقة في التحليل (0-100)

قدم النتيجة بصيغة JSON:
{
  "analysis": "نص التحليل",
  "strengths": ["نقطة 1", "نقطة 2"],
  "weaknesses": ["نقطة 1", "نقطة 2"],
  "recommendations": {
    "special_education": "...",
    "speech": "...",
    "psychological": "...",
    "occupational": "..."
  },
  "intervention_plan": "...",
  "confidence": 85
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'أنت أخصائي تقييم متخصص. قدم تحليلاً علمياً دقيقاً باللغة العربية.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const aiResult = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json({ success: true, data: aiResult });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'AI analysis failed' },
      { status: 500 }
    );
  }
}
```

---

## 5. 🎨 تصميم الواجهة (Tailwind + shadcn/ui)

### 5.1 `components/assessment/CriteriaSlider.tsx`
```tsx
'use client';

import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

interface CriteriaSliderProps {
  criterion: {
    code: string;
    name: string;
    domain: string;
    levels: Record<number, string>;
  };
  value: number;
  onChange: (value: number) => void;
}

const LEVEL_COLORS = {
  0: 'bg-green-500',
  1: 'bg-blue-500',
  2: 'bg-orange-500',
  3: 'bg-red-500',
};

const LEVEL_LABELS = {
  0: 'مستقر',
  1: 'متوسط',
  2: 'شديد',
  3: 'شديد جداً',
};

export function CriteriaSlider({ criterion, value, onChange }: CriteriaSliderProps) {
  return (
    <div className="rounded-lg border p-4 space-y-4 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="outline" className="mb-1">
            {criterion.domain}
          </Badge>
          <h3 className="font-semibold text-lg">
            {criterion.code}: {criterion.name}
          </h3>
        </div>
        <Badge className={`${LEVEL_COLORS[value as keyof typeof LEVEL_COLORS]} text-white`}>
          {LEVEL_LABELS[value as keyof typeof LEVEL_LABELS]}
        </Badge>
      </div>

      <Slider
        value={[value]}
        onValueChange={(vals) => onChange(vals[0])}
        max={3}
        step={1}
        className="w-full"
      />

      <div className="grid grid-cols-2 gap-2 text-sm">
        {Object.entries(criterion.levels).map(([level, desc]) => (
          <div
            key={level}
            className={`p-2 rounded ${
              Number(level) === value ? 'bg-gray-100 border-2 border-primary' : ''
            }`}
          >
            <span className="font-medium">{LEVEL_LABELS[Number(level) as keyof typeof LEVEL_LABELS]}:</span>
            <span className="text-gray-600 mr-1">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5.2 `components/assessment/RadarChart.tsx`
```tsx
'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

interface RadarChartProps {
  data: {
    domain: string;
    score: number;
    maxScore: number;
  }[];
}

export function AssessmentRadarChart({ data }: RadarChartProps) {
  const chartData = data.map((item) => ({
    domain: item.domain,
    score: (item.score / item.maxScore) * 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={chartData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="domain" />
        <PolarRadiusAxis angle={30} domain={[0, 100]} />
        <Radar
          name="الدرجة"
          dataKey="score"
          stroke="#2D8B5A"
          fill="#2D8B5A"
          fillOpacity={0.3}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

---

## 6. 📦 package.json

```json
{
  "name": "taalof-platform",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "airtable": "^0.12.2",
    "openai": "^4.52.0",
    "next-auth": "^4.24.0",
    "recharts": "^2.12.0",
    "@radix-ui/react-slider": "^1.2.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.12.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.0"
  }
}
```

---

## 7. 🚀 خطوات النشر على Vercel

### 7.1 التحضير
```bash
# 1. إنشاء المشروع
npx create-next-app@latest taalof-platform --typescript --tailwind --eslint --app --src-dir

# 2. تثبيت المكتبات
cd taalof-platform
npm install airtable openai next-auth recharts @radix-ui/react-slider @radix-ui/react-dialog lucide-react

# 3. تثبيت shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add slider badge button card dialog input label select table textarea

# 4. إضافة ملف .env.local
```

### 7.2 النشر
```bash
# 1. رفع الكود على GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/taalof-platform.git
git push -u origin main

# 2. ربط المشروع بـ Vercel
# - ادخل إلى vercel.com
# - استورد المشروع من GitHub
# - أضف متغيرات البيئة (AIRTABLE_API_KEY, OPENAI_API_KEY, etc.)
# - اضغط Deploy
```

---

## 8. ⚠️ تحذيرات وتوصيات

### Airtable Limitations
| القيد | الحل |
|-------|------|
| 5 طلبات/ثانية (خطة مجانية) | ترقية لـ Pro أو استخدام caching |
| حجم الملفات المرفقة 5GB | استخدام Cloudinary للفيديوهات |
| لا يدعم WebSockets | استخدام SWR أو React Query للـ polling |

### AI Limitations
| القيد | الحل |
|-------|------|
| GPT-4o مكلف | استخدام GPT-4o-mini للتحليل الأولي |
| تحليل الفيديو غير مباشر | استخدام OpenAI Vision API للصور |
| تحليل الصوت | استخدام Whisper API للنسخ |

### Scaling
| المرحلة | القاعدة | الاستضافة |
|---------|---------|-----------|
| MVP (0-100 طفل) | Airtable | Vercel Hobby |
| Growth (100-1000) | Supabase PostgreSQL | Vercel Pro |
| Enterprise (1000+) | AWS RDS + S3 | Vercel Enterprise |

---

## 9. 📋 checklist قبل الإطلاق

- [ ] إنشاء قاعدة بيانات Airtable
- [ ] إضافة 24 مؤشر في جدول Criteria
- [ ] إعداد NextAuth للمصادقة
- [ ] اختبار API Endpoints
- [ ] اختبار تحليل AI
- [ ] تصميم تقرير PDF
- [ ] اختبار على 5 حالات حقيقية
- [ ] موافقة أخلاقية (IRB) إذا لزم
- [ ] سياسة خصوصية وشروط استخدام
- [ ] نسخ احتياطي يومي

---

**تم إعداد هذا الدليل لبيئة Cursor + Airtable + Vercel**
**التاريخ: أغسطس 2026**
**الإصدار: 2.0-Deploy**
