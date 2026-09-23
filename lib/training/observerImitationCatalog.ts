/**
 * حركات نشاط observer-imitation (C15) — Temporary MVP Asset abstraction.
 * يمكن استبدال modelType لاحقاً بفيديو/animation دون تغيير العقد.
 */

import type {
  ObserverImitationModelType,
  ObserverImitationMovementCategory,
} from '@/lib/training/types';

export type ObserverImitationMovementDefinition = {
  movementId: string;
  titleAr: string;
  titleEn: string;
  category: ObserverImitationMovementCategory;
  modelType: ObserverImitationModelType;
  instructionsAr: string;
  instructionsEn: string;
  replayAllowed: boolean;
  /** مرجع أصل مستقبلي — MVP: illustration id */
  assetRef?: string;
};

export const OBSERVER_IMITATION_ASSET_NOTE =
  'Temporary MVP Asset — not Final Educational Asset';

export const OBSERVER_IMITATION_MOVEMENTS: ObserverImitationMovementDefinition[] =
  [
    {
      movementId: 'hands_up',
      titleAr: 'ارفع يديك',
      titleEn: 'Hands up',
      category: 'gross',
      modelType: 'illustration',
      instructionsAr: 'شاهد النموذج ثم نفّذ الحركة.',
      instructionsEn: 'Watch the model, then perform the movement.',
      replayAllowed: true,
      assetRef: 'illustration:hands_up',
    },
    {
      movementId: 'clap',
      titleAr: 'صفّق',
      titleEn: 'Clap',
      category: 'gross',
      modelType: 'illustration',
      instructionsAr: 'شاهد النموذج ثم صفّق.',
      instructionsEn: 'Watch the model, then clap.',
      replayAllowed: true,
      assetRef: 'illustration:clap',
    },
    {
      movementId: 'wave',
      titleAr: 'لوّح',
      titleEn: 'Wave',
      category: 'gross',
      modelType: 'illustration',
      instructionsAr: 'شاهد النموذج ثم لوّح بيدك.',
      instructionsEn: 'Watch the model, then wave.',
      replayAllowed: true,
      assetRef: 'illustration:wave',
    },
    {
      movementId: 'touch_nose',
      titleAr: 'المس أنفك',
      titleEn: 'Touch nose',
      category: 'fine',
      modelType: 'illustration',
      instructionsAr: 'شاهد النموذج ثم المس أنفك.',
      instructionsEn: 'Watch the model, then touch your nose.',
      replayAllowed: true,
      assetRef: 'illustration:touch_nose',
    },
    {
      movementId: 'touch_head',
      titleAr: 'المس رأسك',
      titleEn: 'Touch head',
      category: 'fine',
      modelType: 'illustration',
      instructionsAr: 'شاهد النموذج ثم المس رأسك.',
      instructionsEn: 'Watch the model, then touch your head.',
      replayAllowed: true,
      assetRef: 'illustration:touch_head',
    },
    {
      movementId: 'smile',
      titleAr: 'ابتسم',
      titleEn: 'Smile',
      category: 'social',
      modelType: 'illustration',
      instructionsAr: 'شاهد التعبير ثم ابتسم.',
      instructionsEn: 'Watch the expression, then smile.',
      replayAllowed: true,
      assetRef: 'illustration:smile',
    },
  ];

const MOVEMENT_BY_ID = new Map(
  OBSERVER_IMITATION_MOVEMENTS.map((item) => [item.movementId, item])
);

export function getObserverImitationMovement(
  movementId: string
): ObserverImitationMovementDefinition | undefined {
  return MOVEMENT_BY_ID.get(movementId);
}

export function listObserverImitationMovementsForDifficulty(
  difficulty: 1 | 2 | 3
): ObserverImitationMovementDefinition[] {
  if (difficulty === 1) {
    return OBSERVER_IMITATION_MOVEMENTS.filter((m) => m.category === 'gross');
  }
  if (difficulty === 2) {
    return OBSERVER_IMITATION_MOVEMENTS.filter(
      (m) => m.category === 'gross' || m.category === 'fine'
    );
  }
  return [...OBSERVER_IMITATION_MOVEMENTS];
}

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** يختار حركة لكل محاولة — deterministic حسب sessionSeed */
export function buildObserverImitationTrialMovements(input: {
  sessionSeed: string;
  trialCount: number;
  difficulty: 1 | 2 | 3;
  movementIdsOverride?: string[];
}): ObserverImitationMovementDefinition[] {
  const pool =
    input.movementIdsOverride?.length
      ? input.movementIdsOverride
          .map((id) => getObserverImitationMovement(id))
          .filter((m): m is ObserverImitationMovementDefinition => Boolean(m))
      : listObserverImitationMovementsForDifficulty(input.difficulty);

  if (pool.length === 0) {
    return [];
  }

  const trials: ObserverImitationMovementDefinition[] = [];
  let state = hashSeed(input.sessionSeed);

  for (let i = 0; i < input.trialCount; i += 1) {
    state = Math.imul(state ^ (i + 1), 2654435761) >>> 0;
    const index = state % pool.length;
    trials.push(pool[index]!);
  }

  return trials;
}
