import Airtable, { FieldSet, Records } from 'airtable';

/**
 * عميل Airtable — مخطط TaalofDB حسب دليل التنفيذ 2.0
 * الجداول: Students · Specialists · Assessments · AssessmentCriteria · Reports · ParentSurveys
 */

const apiKey = process.env.AIRTABLE_API_KEY || '';
const baseId = process.env.AIRTABLE_BASE_ID || '';

export const TABLE_NAMES = {
  students: process.env.AIRTABLE_STUDENTS_TABLE || 'Students',
  specialists: process.env.AIRTABLE_SPECIALISTS_TABLE || 'Specialists',
  assessments: process.env.AIRTABLE_ASSESSMENTS_TABLE || 'Assessments',
  criteria: process.env.AIRTABLE_CRITERIA_TABLE || 'AssessmentCriteria',
  reports: process.env.AIRTABLE_REPORTS_TABLE || 'Reports',
  surveys: process.env.AIRTABLE_SURVEYS_TABLE || 'ParentSurveys',
} as const;

export function isAirtableConfigured() {
  return Boolean(apiKey && baseId);
}

function requireBase() {
  if (!apiKey || !baseId) {
    throw new Error('AIRTABLE_NOT_CONFIGURED: عيّن AIRTABLE_API_KEY و AIRTABLE_BASE_ID');
  }
  return new Airtable({ apiKey }).base(baseId);
}

/** جداول جاهزة للاستخدام المباشر (مثل الدليل) */
export function getTables() {
  const base = requireBase();
  return {
    students: base(TABLE_NAMES.students),
    specialists: base(TABLE_NAMES.specialists),
    assessments: base(TABLE_NAMES.assessments),
    criteria: base(TABLE_NAMES.criteria),
    reports: base(TABLE_NAMES.reports),
    surveys: base(TABLE_NAMES.surveys),
  };
}

/** توافق مع الاستيرادات `import { tables } from '@/lib/airtable'` */
export const tables = new Proxy({} as ReturnType<typeof getTables>, {
  get(_target, prop: string) {
    const t = getTables();
    return t[prop as keyof typeof t];
  },
});

export type StudentFields = {
  Name: string;
  DOB?: string;
  Gender?: string;
  ParentName?: string;
  ParentPhone?: string;
  ParentEmail?: string;
  Diagnosis?: string;
  Status?: string;
  Notes?: string;
};

export type AssessmentFields = {
  Student?: string[];
  Specialist?: string[];
  AssessmentDate?: string;
  AssessmentType?: string;
  TotalScore?: number;
  MaxScore?: number;
  Classification?: string;
  AIConfidence?: number;
  AIAnalysis?: string;
  Status?: string;
  /** تخزين مؤقت للدرجات إن لم يُنشأ صف لكل معيار */
  ScoresJSON?: string;
  DomainAveragesJSON?: string;
  NextAssessmentDate?: string;
};

export async function createStudent(fields: {
  name: string;
  dob: string;
  age?: number;
  parent_phone?: string;
  parent_name?: string;
  parent_email?: string;
  gender?: string;
  diagnosis?: string;
  notes?: string;
  center_code?: string;
  created_at?: string;
}) {
  const t = getTables();
  const [record] = await t.students.create([
    {
      fields: {
        Name: fields.name,
        DOB: fields.dob,
        Gender: fields.gender || '',
        ParentName: fields.parent_name || '',
        ParentPhone: fields.parent_phone || '',
        ParentEmail: fields.parent_email || '',
        Diagnosis: fields.diagnosis || '',
        Status: 'نشط',
        Notes: fields.notes || '',
      } as FieldSet,
    },
  ]);
  return {
    id: record.id,
    fields: {
      name: fields.name,
      dob: fields.dob,
      age: fields.age,
      parent_phone: fields.parent_phone,
      notes: fields.notes,
      ...record.fields,
    },
  };
}

export async function listStudents(maxRecords = 50) {
  const t = getTables();
  const rows: Records<FieldSet> = await t.students
    .select({ maxRecords })
    .all();
  return rows.map((r) => {
    const f = r.fields as Record<string, unknown>;
    return {
      id: r.id,
      fields: {
        name: String(f.Name || f.name || ''),
        dob: String(f.DOB || f.dob || ''),
        age: Number(f.Age || f.age || 0) || undefined,
        parent_phone: String(f.ParentPhone || f.parent_phone || ''),
        notes: String(f.Notes || f.notes || ''),
        gender: String(f.Gender || ''),
        diagnosis: String(f.Diagnosis || ''),
        status: String(f.Status || ''),
      },
    };
  });
}

export async function createAssessment(fields: {
  student_id: string;
  specialist_id?: string;
  scores_json: string;
  total_score?: number;
  percentage?: number;
  classification?: string;
  ai_analysis?: string;
  domain_averages_json?: string;
  assessment_date?: string;
  max_score?: number;
  ai_confidence?: number;
  next_assessment_date?: string;
}) {
  const t = getTables();
  const payload: FieldSet = {
    AssessmentDate: (fields.assessment_date || new Date().toISOString()).slice(
      0,
      10
    ),
    AssessmentType: 'أولي',
    TotalScore: fields.total_score ?? 0,
    MaxScore: fields.max_score ?? 72,
    Classification: fields.classification || '',
    AIConfidence: fields.ai_confidence ?? undefined,
    AIAnalysis: fields.ai_analysis || '',
    Status: 'مكتمل',
    ScoresJSON: fields.scores_json,
    DomainAveragesJSON: fields.domain_averages_json || '',
    NextAssessmentDate: fields.next_assessment_date || '',
  };

  // روابط Airtable — مصفوفة معرفات سجلات
  if (fields.student_id && !fields.student_id.startsWith('local_')) {
    payload.Student = [fields.student_id];
  }
  if (fields.specialist_id && !fields.specialist_id.startsWith('usr_')) {
    payload.Specialist = [fields.specialist_id];
  }

  const [record] = await t.assessments.create([{ fields: payload }]);
  return { id: record.id, fields: record.fields };
}

export async function createAssessmentCriteriaRows(
  assessmentId: string,
  rows: Array<{
    domain: string;
    criterionCode: string;
    criterionName: string;
    score: number;
    specialistNotes?: string;
    aiNotes?: string;
  }>
) {
  if (assessmentId.startsWith('local_')) return [];
  const t = getTables();
  const created = await t.criteria.create(
    rows.map((r) => ({
      fields: {
        Assessment: [assessmentId],
        Domain: r.domain,
        CriterionCode: r.criterionCode,
        CriterionName: r.criterionName,
        Score: r.score,
        SpecialistNotes: r.specialistNotes || '',
        AINotes: r.aiNotes || '',
      } as FieldSet,
    }))
  );
  return created.map((r) => ({ id: r.id, fields: r.fields }));
}

export async function findUserByEmail(email: string) {
  if (!isAirtableConfigured()) return null;
  const t = getTables();
  const safe = email.replace(/'/g, "\\'");
  const rows = await t.specialists
    .select({
      maxRecords: 1,
      filterByFormula: `LOWER({Email}) = '${safe.toLowerCase()}'`,
    })
    .all();
  if (!rows.length) return null;
  const f = rows[0].fields as Record<string, unknown>;
  return {
    id: rows[0].id,
    email: String(f.Email || ''),
    name: String(f.Name || ''),
    role: 'specialist',
    // TODO: migrate existing users to bcrypt hashes on next login
    password_hash: String(f.PasswordHash || f.password_hash || ''),
  };
}

/** إنشاء مستخدم/أخصائي مع تشفير كلمة المرور قبل التخزين */
export async function createSpecialistWithPassword(fields: {
  name: string;
  email: string;
  password: string;
  specialty?: string;
}) {
  const { hashPassword } = await import('@/lib/password');
  const password_hash = await hashPassword(fields.password);
  const t = getTables();
  const [record] = await t.specialists.create([
    {
      fields: {
        Name: fields.name,
        Email: fields.email,
        PasswordHash: password_hash,
        Specialty: fields.specialty || '',
      } as FieldSet,
    },
  ]);
  return { id: record.id, fields: record.fields };
}

export default function getBase() {
  return requireBase();
}
