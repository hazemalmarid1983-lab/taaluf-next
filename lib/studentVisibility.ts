import type { ClinicalActor } from '@/lib/clinicalAccess';

type StudentLike = { fields: unknown };

function field(record: StudentLike, key: 'parent_email' | 'specialist_email'): string {
  const value = (record.fields as Record<string, unknown> | null)?.[key];
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

/**
 * سجلات الطلاب المرئية للمستخدم: ولي الأمر يرى أطفاله فقط (بالبريد)،
 * والأخصائي يرى المسندين إليه أو غير المسندين، والإدارة والخبير التربوي الكل.
 */
export function filterStudentsForActor<T extends StudentLike>(records: T[], actor: ClinicalActor): T[] {
  const email = (actor.email || '').trim().toLowerCase();
  switch (actor.role) {
    case 'SUPER_ADMIN':
    case 'SCIENTIFIC_ADVISOR':
      return records;
    case 'SPECIALIST':
      return records.filter((r) => {
        const assigned = field(r, 'specialist_email');
        return !assigned || (Boolean(email) && assigned === email);
      });
    case 'PARENT':
      return email ? records.filter((r) => field(r, 'parent_email') === email) : [];
    default:
      return [];
  }
}
