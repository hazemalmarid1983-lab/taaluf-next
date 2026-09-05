/**
 * مركز تآلف السريري والبحثي — مساحة تعاون خاصة بين حازم (الإدارة)
 * ود. سامر (المستشار العلمي). ليست بوابة عامة للأخصائيين أو الأهل.
 */

import type { AdvisorGuideState } from '@/lib/advisorPlatformGuide';

export const HUB_PATH = '/hub';
export const HUB_NAME_AR = 'مركز تآلف السريري والبحثي';
export const HUB_NAME_EN = 'Taaluf Clinical & Research Hub';
export const HUB_ONBOARDING_POST_ID = 'hub_onboarding_meeting';

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
    titleAr: 'رئيس المجلس الاستشاري والسريري العام',
    titleEn: 'Chief Advisory & Clinical Council Chair',
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

export type HubMerhidDirectives = {
  text: string;
  updatedAt: string;
  updatedBy: string;
};

export type ClinicalHubSnapshot = {
  posts: HubPost[];
  mou: MouState;
  advisorGuide: AdvisorGuideState;
  merhidDirectives: HubMerhidDirectives;
};

export function isHubOnboardingPost(post: HubPost) {
  return post.id === HUB_ONBOARDING_POST_ID;
}

export type HubActor = {
  memberId: HubMemberId;
  role: HubSessionRole;
  nameAr: string;
  nameEn: string;
  titleAr: string;
  titleEn: string;
};

export { ADVISORY_MOU, ADVISORY_MOU_VERSION } from '@/lib/advisoryMouContent';
import { ADVISORY_MOU_VERSION } from '@/lib/advisoryMouContent';

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
