import { promises as fs } from 'fs';
import path from 'path';
import { getHubDataDir } from '@/lib/hubDataDir';
import {
  emptyMouState,
  HUB_MEMBERS,
  type ClinicalHubSnapshot,
  type HubMemberId,
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
};

let loaded = false;

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function seedWelcomePost(): HubPost {
  const createdAt = nowIso();
  return {
    id: 'hub_welcome',
    category: 'discussion',
    title: 'افتتاح غرفة الاجتماعات',
    body: 'مساحة خاصة غير متزامنة بين حازم ود. سامر: تقييمات سريرية، ملاحظات بحثية، ومقترحات مقاييس الغرف الحسية. المقترحات تبدأ «قيد المراجعة» حتى يعتمدها المشرف العام.',
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
  } catch {
    memory.posts = [seedWelcomePost()];
    memory.mou = emptyMouState();
    await persist();
  }
  if (!memory.posts.length) {
    memory.posts = [seedWelcomePost()];
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
