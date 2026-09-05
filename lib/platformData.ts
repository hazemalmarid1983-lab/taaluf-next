/**
 * مركز بيانات المنصة — الإدارة ترى الجميع؛ الأدوار الأخرى لا تصل لهذه القوائم.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { getHubDataDir } from '@/lib/hubDataDir';

export type PlatformUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type PlatformStudent = {
  id: string;
  name: string;
  age?: number;
  dob?: string;
  parentEmail?: string;
  parentName?: string;
  specialistEmail?: string;
  createdAt: string;
  source: 'parent' | 'specialist' | 'admin';
};

export type PlatformAssessment = {
  id: string;
  studentId?: string;
  studentName: string;
  percentage: number;
  classification: string;
  totalScore: number;
  maxScore: number;
  savedAt: string;
  byRole?: string;
  byEmail?: string;
};

export type PlatformBooking = {
  id: string;
  slotId: string;
  slotLabel: string;
  studentName: string;
  paidAt: string;
  byEmail?: string;
};

export type PlatformPayment = {
  id: string;
  product: string;
  amount: number;
  currency: string;
  studentName?: string;
  at: string;
  byEmail?: string;
};

type Hub = {
  students: PlatformStudent[];
  assessments: PlatformAssessment[];
  bookings: PlatformBooking[];
  payments: PlatformPayment[];
};

const DATA_DIR = getHubDataDir();
const DATA_FILE = path.join(DATA_DIR, 'platform-hub.json');

const memory: Hub = {
  students: [],
  assessments: [],
  bookings: [],
  payments: [],
};

let loaded = false;

async function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Hub;
    memory.students = parsed.students || [];
    memory.assessments = parsed.assessments || [];
    memory.bookings = parsed.bookings || [];
    memory.payments = parsed.payments || [];
  } catch {
    /* empty hub */
  }
}

async function persist() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(memory, null, 2), 'utf8');
  } catch {
    /* ignore disk errors in demo */
  }
}

export const DIRECTORY_USERS: PlatformUser[] = [
  {
    id: 'usr_admin',
    email: 'admin@taaluf.local',
    name: 'حازم',
    role: 'admin',
  },
  {
    id: 'usr_advisor',
    email: 'samer@taaluf.local',
    name: 'د. سامر',
    role: 'scientific_advisor',
  },
  {
    id: 'usr_specialist',
    email: 'specialist@taaluf.local',
    name: 'أخصائي تآلف',
    role: 'specialist',
  },
  {
    id: 'usr_teacher',
    email: 'teacher@taaluf.local',
    name: 'معلّم تآلف',
    role: 'teacher',
  },
  {
    id: 'usr_parent',
    email: 'parent@taaluf.local',
    name: 'ولي أمر',
    role: 'parent',
  },
  {
    id: 'usr_specialist_guest',
    email: 'guest-specialist@taaluf.local',
    name: 'مختص (بعد الدفع)',
    role: 'specialist',
  },
];

export async function getHub(): Promise<Hub> {
  await ensureLoaded();
  return {
    students: [...memory.students],
    assessments: [...memory.assessments],
    bookings: [...memory.bookings],
    payments: [...memory.payments],
  };
}

export async function addStudent(row: PlatformStudent) {
  await ensureLoaded();
  memory.students = [row, ...memory.students.filter((s) => s.id !== row.id)].slice(
    0,
    200
  );
  await persist();
  return row;
}

export async function addAssessment(row: PlatformAssessment) {
  await ensureLoaded();
  memory.assessments = [row, ...memory.assessments].slice(0, 200);
  await persist();
  return row;
}

export async function addBooking(row: PlatformBooking) {
  await ensureLoaded();
  memory.bookings = [row, ...memory.bookings].slice(0, 200);
  await persist();
  return row;
}

export async function addPayment(row: PlatformPayment) {
  await ensureLoaded();
  memory.payments = [row, ...memory.payments].slice(0, 200);
  await persist();
  return row;
}

export async function getAdminOverview() {
  const hub = await getHub();
  return {
    users: DIRECTORY_USERS,
    ...hub,
    counts: {
      users: DIRECTORY_USERS.length,
      students: hub.students.length,
      assessments: hub.assessments.length,
      bookings: hub.bookings.length,
      payments: hub.payments.length,
    },
  };
}
