import { redirect } from 'next/navigation';

/** مدخل ولي الأمر إلى غرفة الجلسات التدريبية. */
export default function ParentTrainingEntryPage() {
  redirect('/dashboard/training');
}
