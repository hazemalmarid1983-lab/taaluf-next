import { EXTERNAL_TOOL_LINKS_ENABLED } from '../lib/featureFlags';
import {
  INTERNAL_TOOLS,
  internalToolById,
  recommendInternalTools,
} from '../lib/internalTools';

describe('internal tools catalogue', () => {
  it('keeps every destination inside the platform', () => {
    INTERNAL_TOOLS.forEach((tool) => {
      expect(tool.href.startsWith('/')).toBe(true);
      expect(tool.titleAr.trim()).not.toBe('');
      expect(tool.titleEn.trim()).not.toBe('');
      expect(tool.descAr.trim()).not.toBe('');
      expect(tool.descEn.trim()).not.toBe('');
      expect(tool.domains.length).toBeGreaterThan(0);
    });
  });

  it('exposes unique ids', () => {
    const ids = new Set(INTERNAL_TOOLS.map((tool) => tool.id));
    expect(ids.size).toBe(INTERNAL_TOOLS.length);
    expect(internalToolById('home_classroom')?.href).toBe(
      '/dashboard/home-classroom'
    );
    expect(internalToolById('regulation_hub')?.href).toBe(
      '/dashboard/home-classroom?calm=1'
    );
    expect(internalToolById('motor_tracing')?.href).toBe(
      '/dashboard/home-classroom?tracing=1'
    );
    expect(internalToolById('missing')).toBeUndefined();
  });

  it('disables external app links by default', () => {
    expect(EXTERNAL_TOOL_LINKS_ENABLED).toBe(false);
  });
});

describe('recommendInternalTools', () => {
  it('leads with the home classroom for a communication goal', () => {
    const tools = recommendInternalTools('أن يطابق الطالب بين الحيوانات الأليفة');
    expect(tools[0].domains).toContain('communication');
    expect(tools.map((tool) => tool.id)).toContain('home_classroom');
  });

  it('leads with the visual schedule for a daily routine goal', () => {
    const tools = recommendInternalTools('أن يتبع الطفل روتين ترتيب غرفته');
    expect(tools[0].id).toBe('visual_schedule');
  });

  it('includes the regulation hub for an emotional-regulation goal', () => {
    const tools = recommendInternalTools(
      'أن ينظم الطفل مشاعره عند الغضب',
      4
    );
    expect(tools.map((tool) => tool.id)).toContain('regulation_hub');
  });

  it('includes motor tracing for a fine-motor goal', () => {
    const tools = recommendInternalTools(
      'أن يتتبع الطفل خطوطاً وأشكالاً بدقة',
      5
    );
    expect(tools.map((tool) => tool.id)).toContain('motor_tracing');
  });

  it('leads with a social tool for a peer interaction goal', () => {
    const tools = recommendInternalTools('أن يشارك الطفل أقرانه في اللعب');
    expect(tools[0].domains).toContain('social');
  });

  it('always returns a usable list, even for an unmatched goal', () => {
    const tools = recommendInternalTools('xyz');
    expect(tools.length).toBe(3);
    expect(recommendInternalTools('xyz', 5)).toHaveLength(5);
  });

  it('pads the list with defaults when few domains match', () => {
    const tools = recommendInternalTools('أن يتبع الطفل روتين ترتيب غرفته', 4);
    const ids = new Set(tools.map((tool) => tool.id));
    expect(ids.size).toBe(4);
  });
});
