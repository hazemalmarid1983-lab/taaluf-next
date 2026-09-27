import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import EducationalIllustration from '../components/visuals/EducationalIllustration';
import { AUTISM_TOOLS_BANK, AUTISM_TOOL_DOMAINS } from '../lib/data/autismToolsBank';
import { listTrainingChapterIds, loadChapterById } from '../lib/training/loadChapter';
import {
  CRITERION_ILLUSTRATIONS,
  criterionIllustrationCoverage,
  illustrationIdForCriterion,
} from '../lib/visuals/criterionIllustrations';
import {
  EDUCATIONAL_ASSET_KIND,
  listEducationalAssetIds,
} from '../lib/visuals/educationalAssets';
import { buildProposedGoals } from '../lib/goalsEngine';
import {
  CRITERIA_LIST,
  DEVELOPMENTAL_DOMAINS,
  DOMAINS,
  criteriaByDevelopmentalDomain,
  type DevelopmentalDomainId,
} from '../types/taalof';

type Shape = { tag: string; fill: string | null; stroke: string | null };

function shapesOf(markup: string): Shape[] {
  const out: Shape[] = [];
  const re = /<(circle|ellipse|rect|path|polygon|polyline|line|text)\b([^>]*)>/g;
  for (const m of markup.matchAll(re)) {
    const attrs = m[2];
    out.push({
      tag: m[1],
      fill: /\sfill="([^"]*)"/.exec(attrs)?.[1] ?? null,
      stroke: /\sstroke="([^"]*)"/.exec(attrs)?.[1] ?? null,
    });
  }
  return out;
}

function isFilled(shape: Shape) {
  if (shape.fill) return shape.fill !== 'none';
  return !shape.stroke;
}

function hsl(hex: string) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
  return { s, l };
}

function isVividColor(hex: string) {
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return false;
  const { s, l } = hsl(hex);
  return s >= 0.4 && l >= 0.25 && l <= 0.85;
}

function render(asset: string) {
  return renderToStaticMarkup(createElement(EducationalIllustration, { asset }));
}

describe('ABA goal tree → illustration coverage', () => {
  it('links every canonical criterion to an illustrationId', () => {
    const missing = CRITERIA_LIST.filter((c) => !illustrationIdForCriterion(c.id)).map(
      (c) => c.id
    );
    expect(missing).toEqual([]);
  });

  it('keeps the four scoring axes intact alongside the nine domains', () => {
    expect(DOMAINS).toHaveLength(4);
  });
});

describe('nine developmental domains', () => {
  const APPROVED: Record<DevelopmentalDomainId, string[]> = {
    receptive_language: ['C2', 'C3', 'C4', 'C20'],
    expressive_language: ['C1', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'],
    self_help: ['C34', 'C35', 'C36'],
    social_skills: ['C11', 'C12', 'C13', 'C14', 'C16', 'C17', 'C18', 'C19'],
    gross_motor: ['C15'],
    fine_motor: [],
    cognitive_pre_academic: ['C21', 'C22', 'C23', 'C24', 'C25', 'C26', 'C27', 'C28', 'C29', 'C30'],
    adaptive_behavior: ['C31', 'C32', 'C37', 'C38', 'C39'],
    sensory_integration: ['C33', 'C40'],
  };

  it('declares exactly the nine official domains', () => {
    expect(DEVELOPMENTAL_DOMAINS.map((d) => d.en)).toEqual([
      'Receptive Language',
      'Expressive Language',
      'Self-Help & Independence',
      'Social Skills & Interaction',
      'Gross Motor Skills',
      'Fine Motor Skills',
      'Cognitive & Pre-Academic',
      'Adaptive Behavior',
      'Sensory Integration',
    ]);
    expect(DEVELOPMENTAL_DOMAINS.map((d) => d.id).sort()).toEqual(
      Object.keys(APPROVED).sort()
    );
    for (const d of DEVELOPMENTAL_DOMAINS) expect(d.ar).not.toBe('');
  });

  it('places all forty criteria under one of the nine domains', () => {
    const valid = new Set(DEVELOPMENTAL_DOMAINS.map((d) => d.id));
    const unplaced = CRITERIA_LIST.filter(
      (c) => !c.developmentalDomain || !valid.has(c.developmentalDomain)
    ).map((c) => c.id);
    expect(unplaced).toEqual([]);
  });

  it('matches the approved clinical distribution', () => {
    for (const d of DEVELOPMENTAL_DOMAINS) {
      expect({
        domain: d.id,
        ids: criteriaByDevelopmentalDomain(d.id).map((c) => c.id),
      }).toEqual({ domain: d.id, ids: APPROVED[d.id] });
    }
  });

  it('illustrates every goal in every domain with no gaps', () => {
    for (const row of criterionIllustrationCoverage()) {
      expect({ domain: row.domain, missing: row.missing }).toEqual({
        domain: row.domain,
        missing: [],
      });
      expect(row.illustrated).toBe(row.criteria);
      expect(row.domainIllustration).not.toBeNull();
    }
  });

  it('allows an empty domain only as a declared clinical gap', () => {
    const coverage = criterionIllustrationCoverage();
    const empty = coverage.filter((row) => row.criteria === 0).map((row) => row.domain);
    const declared = coverage.filter((row) => row.declaredGap).map((row) => row.domain);
    expect(empty).toEqual(declared);
    expect(declared).toEqual(['fine_motor']);
  });

  it('carries the developmental domain into proposed goals', () => {
    const scores = CRITERIA_LIST.map((c) => ({ criterionId: c.id, score: 3 }));
    const goals = buildProposedGoals(scores, 40);
    expect(goals).toHaveLength(40);
    for (const goal of goals) {
      expect(goal.developmentalDomain).toBe(
        CRITERIA_LIST.find((c) => c.id === goal.criterionId)?.developmentalDomain
      );
    }
  });

  it('keeps no orphan mapping for a criterion outside the bank', () => {
    const canonical = new Set(CRITERIA_LIST.map((c) => c.id));
    const orphans = Object.keys(CRITERION_ILLUSTRATIONS).filter((id) => !canonical.has(id));
    expect(orphans).toEqual([]);
  });

  it('illustrates every criterion targeted by a training chapter', () => {
    for (const chapterId of listTrainingChapterIds()) {
      const doc = loadChapterById(chapterId);
      const targeted = [
        ...doc.chapter.criterionIds,
        ...doc.skills.flatMap((skill) => skill.criterionIds),
      ];
      for (const id of targeted) {
        expect({ chapterId, id, asset: illustrationIdForCriterion(id) }).toEqual({
          chapterId,
          id,
          asset: expect.any(String),
        });
      }
    }
  });

  it('backs every tools-bank domain with at least one tool', () => {
    for (const domain of AUTISM_TOOL_DOMAINS) {
      expect({
        domain: domain.id,
        hasTool: AUTISM_TOOLS_BANK.some((tool) => tool.domain === domain.id),
      }).toEqual({ domain: domain.id, hasTool: true });
    }
  });
});

describe('illustration style: colorful cartoon, not abstract chart lines', () => {
  it('declares the registry as cartoon illustrations', () => {
    expect(EDUCATIONAL_ASSET_KIND).toBe('cartoon-illustration');
  });

  it.each(listEducationalAssetIds())('%s renders a filled, colorful SVG drawing', (id) => {
    const markup = render(id);
    expect(markup).toContain('<svg');

    const shapes = shapesOf(markup);
    const forbidden = shapes.filter((s) => ['line', 'polyline', 'text'].includes(s.tag));
    expect(forbidden).toEqual([]);

    const filled = shapes.filter(isFilled);
    const strokeOnly = shapes.filter((s) => !isFilled(s));
    expect(filled.length).toBeGreaterThanOrEqual(2);
    expect(filled.length).toBeGreaterThanOrEqual(strokeOnly.length);

    const fills = new Set(filled.map((s) => s.fill).filter((f): f is string => Boolean(f)));
    expect(fills.size).toBeGreaterThanOrEqual(2);
    expect([...fills].some(isVividColor)).toBe(true);
  });

  it('falls back to a placeholder only for unknown assets', () => {
    expect(render('not-a-real-asset')).not.toContain('<svg');
  });
});
