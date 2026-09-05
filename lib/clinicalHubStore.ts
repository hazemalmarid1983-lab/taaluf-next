import { promises as fs } from 'fs';
import path from 'path';
import { getHubDataDir } from '@/lib/hubDataDir';
import {
  DEFAULT_HUB_MERHID_DIRECTIVES_AR,
  emptyAdvisorGuideState,
  isAdvisorGuideComplete,
  type AdvisorGuideSectionId,
} from '@/lib/advisorPlatformGuide';
import {
  emptyMouState,
  HUB_MEMBERS,
  HUB_ONBOARDING_POST_ID,
  type ClinicalHubSnapshot,
  type HubMemberId,
  type HubMerhidDirectives,
  type HubPost,
  type HubPostCategory,
  type HubPostStatus,
  type HubReply,
  type HubSessionRole,
  type MouState,
} from '@/lib/clinicalHub';

const DATA_DIR = getHubDataDir();
const DATA_FILE = path.join(DATA_DIR, 'clinical-hub.json');

const memory: ClinicalHubSnapshot = {
  posts: [],
  mou: emptyMouState(),
  advisorGuide: emptyAdvisorGuideState(),
  merhidDirectives: {
    text: DEFAULT_HUB_MERHID_DIRECTIVES_AR,
    updatedAt: new Date(0).toISOString(),
    updatedBy: HUB_MEMBERS.hazem.nameAr,
  },
};

let loaded = false;

function nowIso() {
  return new Date().toISOString();
}

function defaultMerhidDirectives(): HubMerhidDirectives {
  const createdAt = nowIso();
  return {
    text: DEFAULT_HUB_MERHID_DIRECTIVES_AR,
    updatedAt: createdAt,
    updatedBy: HUB_MEMBERS.hazem.nameAr,
  };
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function seedOnboardingMeetingPost(): HubPost {
  const createdAt = nowIso();
  return {
    id: HUB_ONBOARDING_POST_ID,
    category: 'discussion',
    title: 'الاجتماع الأول — تعريف شامل بمنصة تآلف ومحتواها',
    body: 'اقرأ الأقسام أدناه ثم شارك ملاحظاتك واقتراحاتك في خانة الدردشة. مرشد تآلف متاح بجوارك (بتوجيه الإدارة) للإجابة عن أي سؤال يخص المنصة.',
    status: 'approved',
    authorRole: 'admin',
    authorName: HUB_MEMBERS.hazem.nameAr,
    authorMemberId: 'hazem',
    createdAt,
    updatedAt: createdAt,
    statusChangedBy: HUB_MEMBERS.hazem.nameAr,
    statusChangedAt: createdAt,
    replies: [],
  };
}

function ensureOnboardingPost() {
  const idx = memory.posts.findIndex((p) => p.id === HUB_ONBOARDING_POST_ID);
  const onboarding = seedOnboardingMeetingPost();
  if (idx >= 0) {
    memory.posts[idx] = {
      ...onboarding,
      replies: memory.posts[idx].replies,
      createdAt: memory.posts[idx].createdAt,
    };
  } else {
    memory.posts = [onboarding, ...memory.posts.filter((p) => p.id !== 'hub_welcome')];
  }
  memory.posts.sort((a, b) => {
    if (a.id === HUB_ONBOARDING_POST_ID) return -1;
    if (b.id === HUB_ONBOARDING_POST_ID) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

async function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<ClinicalHubSnapshot>;
    memory.posts = Array.isArray(parsed.posts) ? parsed.posts : [];
    const base = emptyMouState();
    const stored = parsed.mou;
    const versionChanged =
      stored?.version && stored.version !== base.version;
    memory.mou = versionChanged
      ? base
      : {
          ...base,
          ...(stored || {}),
          hazem: { ...base.hazem, ...(stored?.hazem || {}) },
          samer: { ...base.samer, ...(stored?.samer || {}) },
        };
    const guideBase = emptyAdvisorGuideState();
    const storedGuide = parsed.advisorGuide;
    const guideVersionChanged =
      storedGuide?.version && storedGuide.version !== guideBase.version;
    memory.advisorGuide = guideVersionChanged
      ? guideBase
      : {
          ...guideBase,
          ...(storedGuide || {}),
          sections: {
            ...guideBase.sections,
            ...(storedGuide?.sections || {}),
          },
        };
    const dirBase = defaultMerhidDirectives();
    memory.merhidDirectives = {
      ...dirBase,
      ...(parsed.merhidDirectives || {}),
      text: parsed.merhidDirectives?.text?.trim() || dirBase.text,
    };
    ensureOnboardingPost();
  } catch {
    memory.posts = [];
    memory.mou = emptyMouState();
    memory.advisorGuide = emptyAdvisorGuideState();
    memory.merhidDirectives = defaultMerhidDirectives();
    ensureOnboardingPost();
    await persist();
  }
  if (!memory.posts.some((p) => p.id === HUB_ONBOARDING_POST_ID)) {
    ensureOnboardingPost();
    await persist();
  }
}

async function persist() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(memory, null, 2), 'utf8');
  } catch {
    /* demo disk errors are non-fatal */
  }
}

function cloneSnapshot(): ClinicalHubSnapshot {
  return JSON.parse(JSON.stringify(memory)) as ClinicalHubSnapshot;
}

export async function getClinicalHubSnapshot(): Promise<ClinicalHubSnapshot> {
  await ensureLoaded();
  return cloneSnapshot();
}

export async function createHubPost(input: {
  category: HubPostCategory;
  title: string;
  body: string;
  authorRole: HubSessionRole;
  authorName: string;
  authorMemberId: HubMemberId;
}): Promise<HubPost> {
  await ensureLoaded();
  const createdAt = nowIso();
  const post: HubPost = {
    id: makeId('hub'),
    category: input.category,
    title: input.title.trim(),
    body: input.body.trim(),
    status: 'pending',
    authorRole: input.authorRole,
    authorName: input.authorName,
    authorMemberId: input.authorMemberId,
    createdAt,
    updatedAt: createdAt,
    replies: [],
  };
  memory.posts = [post, ...memory.posts].slice(0, 400);
  await persist();
  return { ...post, replies: [] };
}

export async function addHubReply(
  postId: string,
  input: {
    authorRole: HubSessionRole;
    authorName: string;
    authorMemberId: HubMemberId;
    body: string;
  }
): Promise<HubPost | null> {
  await ensureLoaded();
  const post = memory.posts.find((p) => p.id === postId);
  if (!post) return null;
  const reply: HubReply = {
    id: makeId('reply'),
    authorRole: input.authorRole,
    authorName: input.authorName,
    authorMemberId: input.authorMemberId,
    body: input.body.trim(),
    createdAt: nowIso(),
  };
  post.replies = [...post.replies, reply];
  post.updatedAt = reply.createdAt;
  await persist();
  return JSON.parse(JSON.stringify(post)) as HubPost;
}

export async function setHubPostStatus(
  postId: string,
  status: HubPostStatus,
  changedBy: string
): Promise<HubPost | null> {
  await ensureLoaded();
  const post = memory.posts.find((p) => p.id === postId);
  if (!post) return null;
  post.status = status;
  post.statusChangedBy = changedBy;
  post.statusChangedAt = nowIso();
  post.updatedAt = post.statusChangedAt;
  await persist();
  return JSON.parse(JSON.stringify(post)) as HubPost;
}

export async function signAdvisoryMou(
  memberId: HubMemberId,
  signerName: string
): Promise<MouState> {
  await ensureLoaded();
  const stamp = {
    memberId,
    signed: true,
    signedAt: nowIso(),
    signerName: signerName.trim(),
  };
  if (memberId === 'hazem') memory.mou.hazem = stamp;
  else memory.mou.samer = stamp;
  await persist();
  return JSON.parse(JSON.stringify(memory.mou)) as MouState;
}

export async function resetAdvisoryMou(): Promise<MouState> {
  await ensureLoaded();
  memory.mou = emptyMouState();
  await persist();
  return JSON.parse(JSON.stringify(memory.mou)) as MouState;
}

export async function acknowledgeAdvisorGuideSection(
  sectionId: AdvisorGuideSectionId,
  signerName: string
): Promise<ClinicalHubSnapshot['advisorGuide']> {
  await ensureLoaded();
  const stamp = {
    sectionId,
    acknowledged: true as const,
    acknowledgedAt: nowIso(),
    signerName: signerName.trim(),
  };
  memory.advisorGuide.sections[sectionId] = stamp;
  if (isAdvisorGuideComplete(memory.advisorGuide)) {
    memory.advisorGuide.completedAt = nowIso();
  }
  await persist();
  return JSON.parse(JSON.stringify(memory.advisorGuide));
}

export async function resetAdvisorGuide(): Promise<ClinicalHubSnapshot['advisorGuide']> {
  await ensureLoaded();
  memory.advisorGuide = emptyAdvisorGuideState();
  await persist();
  return JSON.parse(JSON.stringify(memory.advisorGuide));
}

export async function updateHubMerhidDirectives(
  text: string,
  updatedBy: string
): Promise<HubMerhidDirectives> {
  await ensureLoaded();
  memory.merhidDirectives = {
    text: text.trim(),
    updatedAt: nowIso(),
    updatedBy: updatedBy.trim(),
  };
  await persist();
  return JSON.parse(JSON.stringify(memory.merhidDirectives));
}
