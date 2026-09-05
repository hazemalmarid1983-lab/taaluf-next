import type {
  PlatformAssessment,
  PlatformBooking,
  PlatformPayment,
  PlatformStudent,
  PlatformUser,
} from '@/lib/platformData';

export type AdminChildRow = {
  id: string;
  name: string;
  age?: number;
  hasScreening: boolean;
  hasParentQ: boolean;
  hasAssessment: boolean;
  classification?: string;
  percentage?: number;
  goalsActive: number;
};

export type AdminParentRow = {
  email: string;
  name: string;
  children: AdminChildRow[];
  bookings: number;
  payments: number;
  howTheyWork: string;
};

export type AdminSpecialistRow = {
  email: string;
  name: string;
  role: string;
  cases: AdminChildRow[];
  assessmentsDone: number;
  avgPercentage: number | null;
  activeGoals: number;
  howTheyWork: string;
};

export type AdminProgress = {
  parentsCount: number;
  specialistsCount: number;
  childrenCount: number;
  screenedCount: number;
  assessedCount: number;
  avgScore: number | null;
  classificationBreakdown: Array<{ label: string; count: number }>;
  goalsActive: number;
  bookings: number;
};

export type AdminDashboardViews = {
  parents: AdminParentRow[];
  specialists: AdminSpecialistRow[];
  progress: AdminProgress;
};

export type AdminLocalSnapshot = {
  students: Array<{
    id: string;
    name: string;
    age?: number;
    dob?: string;
    parent_name?: string;
    parent_email?: string;
    specialist_email?: string;
  }>;
  assessments: Array<{
    id: string;
    studentId: string;
    studentName?: string;
    percentage: number;
    classification: string;
    savedAt: string;
  }>;
  goals: Array<{ childId?: string; status?: string }>;
  screeningChildId?: string;
  parentQChildIds: string[];
};

const PARENT_HOW =
  'يسجّل اسم الطفل، يكمل الفرز المجاني، يطّلع على النتيجة، ثم يختار تقييماً مدفوعاً أو متابعة أونلاين مع الكادر، مع إمكانية حجز موعد مع المختص.';

const SPECIALIST_HOW =
  'يسجّل حالة جديدة، يختار اسم الطفل من قائمة من يشرف عليهم، يفتح ملف البيانات، ويعمل على أهداف الطالب ويتابع تقدّمها.';

function emailKey(v?: string | null) {
  return String(v || '').trim().toLowerCase();
}

function latestAssessment(
  assessments: PlatformAssessment[],
  studentId: string,
  studentName?: string
) {
  return (
    assessments.find((a) => a.studentId === studentId) ||
    assessments.find(
      (a) =>
        studentName &&
        a.studentName &&
        a.studentName.trim() === studentName.trim()
    ) ||
    null
  );
}

export function buildAdminViews(input: {
  users: PlatformUser[];
  students: PlatformStudent[];
  assessments: PlatformAssessment[];
  bookings: PlatformBooking[];
  payments: PlatformPayment[];
  local?: AdminLocalSnapshot | null;
}): AdminDashboardViews {
  const students = [...input.students];
  const assessments = [...input.assessments];
  const screeningIds = new Set<string>();
  const parentQIds = new Set<string>();
  const goalCount = new Map<string, number>();

  if (input.local) {
    for (const s of input.local.students) {
      if (!students.some((x) => x.id === s.id)) {
        students.push({
          id: s.id,
          name: s.name,
          age: s.age,
          dob: s.dob,
          parentEmail: s.parent_email,
          parentName: s.parent_name,
          specialistEmail: s.specialist_email,
          createdAt: new Date().toISOString(),
          source: s.specialist_email ? 'specialist' : 'parent',
        });
      }
    }
    for (const a of input.local.assessments) {
      if (!assessments.some((x) => x.id === a.id)) {
        assessments.push({
          id: a.id,
          studentId: a.studentId,
          studentName: a.studentName || 'طالب',
          percentage: a.percentage,
          classification: a.classification,
          totalScore: 0,
          maxScore: 0,
          savedAt: a.savedAt,
        });
      }
    }
    if (input.local.screeningChildId) {
      screeningIds.add(input.local.screeningChildId);
    }
    input.local.parentQChildIds.forEach((id) => parentQIds.add(id));
    for (const g of input.local.goals) {
      if (!g.childId || g.status === 'done') continue;
      goalCount.set(g.childId, (goalCount.get(g.childId) || 0) + 1);
    }
  }

  const childRow = (s: PlatformStudent): AdminChildRow => {
    const a = latestAssessment(assessments, s.id, s.name);
    return {
      id: s.id,
      name: s.name,
      age: s.age,
      hasScreening: screeningIds.has(s.id),
      hasParentQ: parentQIds.has(s.id),
      hasAssessment: Boolean(a),
      classification: a?.classification,
      percentage: a?.percentage,
      goalsActive: goalCount.get(s.id) || 0,
    };
  };

  const parentUsers = input.users.filter((u) => u.role === 'parent');
  const specialistUsers = input.users.filter(
    (u) => u.role === 'specialist' || u.role === 'teacher'
  );

  const parents: AdminParentRow[] = parentUsers.map((u) => {
    const email = emailKey(u.email);
    const children = students
      .filter(
        (s) =>
          emailKey(s.parentEmail) === email ||
          (s.source === 'parent' && !s.parentEmail && email === 'parent@taaluf.local')
      )
      .map(childRow);
    return {
      email: u.email,
      name: u.name,
      children,
      bookings: input.bookings.filter((b) => emailKey(b.byEmail) === email)
        .length,
      payments: input.payments.filter((p) => emailKey(p.byEmail) === email)
        .length,
      howTheyWork: PARENT_HOW,
    };
  });

  const extraParentEmails = new Set(
    students
      .map((s) => emailKey(s.parentEmail))
      .filter((e) => e && !parentUsers.some((u) => emailKey(u.email) === e))
  );
  for (const email of extraParentEmails) {
    const sample = students.find((s) => emailKey(s.parentEmail) === email);
    parents.push({
      email,
      name: sample?.parentName || email,
      children: students.filter((s) => emailKey(s.parentEmail) === email).map(childRow),
      bookings: input.bookings.filter((b) => emailKey(b.byEmail) === email)
        .length,
      payments: input.payments.filter((p) => emailKey(p.byEmail) === email)
        .length,
      howTheyWork: PARENT_HOW,
    });
  }

  const specialists: AdminSpecialistRow[] = specialistUsers.map((u) => {
    const email = emailKey(u.email);
    const cases = students
      .filter(
        (s) =>
          emailKey(s.specialistEmail) === email ||
          (s.source === 'specialist' &&
            !s.specialistEmail &&
            email === 'specialist@taaluf.local')
      )
      .map(childRow);
    const done = cases.filter((c) => c.hasAssessment);
    const avg =
      done.length > 0
        ? Math.round(
            done.reduce((sum, c) => sum + (c.percentage || 0), 0) / done.length
          )
        : null;
    return {
      email: u.email,
      name: u.name,
      role: u.role,
      cases,
      assessmentsDone: done.length,
      avgPercentage: avg,
      activeGoals: cases.reduce((sum, c) => sum + c.goalsActive, 0),
      howTheyWork: SPECIALIST_HOW,
    };
  });

  const assessed = students.map(childRow).filter((c) => c.hasAssessment);
  const classMap = new Map<string, number>();
  for (const a of assessed) {
    const label = a.classification || 'غير مصنّف';
    classMap.set(label, (classMap.get(label) || 0) + 1);
  }

  const progress: AdminProgress = {
    parentsCount: parents.length,
    specialistsCount: specialists.length,
    childrenCount: students.length,
    screenedCount: students.map(childRow).filter((c) => c.hasScreening).length,
    assessedCount: assessed.length,
    avgScore:
      assessed.length > 0
        ? Math.round(
            assessed.reduce((sum, c) => sum + (c.percentage || 0), 0) /
              assessed.length
          )
        : null,
    classificationBreakdown: Array.from(classMap.entries()).map(
      ([label, count]) => ({ label, count })
    ),
    goalsActive: Array.from(goalCount.values()).reduce((a, b) => a + b, 0),
    bookings: input.bookings.length,
  };

  return { parents, specialists, progress };
}

export function readLocalAdminSnapshot(): AdminLocalSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const students = JSON.parse(
      localStorage.getItem('taaluf.students.v1') || '[]'
    );
    const assessments = JSON.parse(
      localStorage.getItem('taaluf.assessments.v1') || '[]'
    );
    const goals = JSON.parse(localStorage.getItem('taaluf.goals.v1') || '[]');
    const screening = JSON.parse(
      localStorage.getItem('taaluf.screening.v1') || 'null'
    );
    const parentQ = JSON.parse(
      localStorage.getItem('taaluf.parentAssessment.v1') || '[]'
    );
    const active = JSON.parse(
      localStorage.getItem('taaluf.activeStudent') || 'null'
    );
    const extraStudents = Array.isArray(students) ? [...students] : [];
    if (active?.id && !extraStudents.some((s: { id: string }) => s.id === active.id)) {
      extraStudents.push(active);
    }
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i) || '';
        if (!key.startsWith('taaluf.caseload.')) continue;
        const email = key.slice('taaluf.caseload.'.length);
        const ids = JSON.parse(localStorage.getItem(key) || '[]') as string[];
        for (const id of ids) {
          const row = extraStudents.find((s: { id: string }) => s.id === id);
          if (row && !row.specialist_email) row.specialist_email = email;
        }
      }
    } catch {
      /* ignore */
    }
    return {
      students: extraStudents,
      assessments: Array.isArray(assessments) ? assessments : [],
      goals: Array.isArray(goals) ? goals : [],
      screeningChildId: screening?.childId || undefined,
      parentQChildIds: Array.isArray(parentQ)
        ? parentQ.map((p: { childId?: string }) => String(p.childId || '')).filter(Boolean)
        : [],
    };
  } catch {
    return null;
  }
}
