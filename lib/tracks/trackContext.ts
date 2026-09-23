/**
 * سياق المسار التربوي النشط — يفصل بيانات التوحد عن صعوبات التعلم
 */

import type { EducationalTrack } from './types';
import { LD_STORAGE } from './storageKeys';

export function getActiveTrack(): EducationalTrack {
  try {
    if (typeof localStorage === 'undefined') return 'developmental';
    const raw = localStorage.getItem(LD_STORAGE.activeTrack);
    if (raw === 'learning_disabilities') return 'learning_disabilities';
    return 'developmental';
  } catch {
    return 'developmental';
  }
}

export function setActiveTrack(track: EducationalTrack) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LD_STORAGE.activeTrack, track);
}

export function readLdActiveStudent(): {
  id: string;
  name: string;
  age?: number;
  dob?: string;
} | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(LD_STORAGE.activeStudent);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      id?: string;
      name?: string;
      age?: number;
      dob?: string;
    };
    if (!parsed?.id) return null;
    return {
      id: String(parsed.id),
      name: parsed.name || 'الطالب / الطالبة',
      age: parsed.age,
      dob: parsed.dob,
    };
  } catch {
    return null;
  }
}

export function saveLdActiveStudent(child: {
  id: string;
  name: string;
  age?: number;
  dob?: string;
}) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LD_STORAGE.activeStudent, JSON.stringify(child));
  setActiveTrack('learning_disabilities');
}

export function clearLdActiveStudent() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(LD_STORAGE.activeStudent);
}
