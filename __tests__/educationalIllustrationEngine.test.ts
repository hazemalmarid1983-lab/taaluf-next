import { VOCABULARY_GROUPS } from '../lib/activityGenerator';
import { OBSERVER_IMITATION_MOVEMENTS } from '../lib/training/observerImitationCatalog';
import {
  educationalAssetCoverageReport,
  resolveEducationalAssetId,
} from '../lib/visuals/educationalAssets';
import { hasCommPictogramArt } from '../lib/training/commPictogramArt';

describe('educational illustration engine', () => {
  it('covers every vocabulary item used by the activity generator', () => {
    const ids = VOCABULARY_GROUPS.flatMap((group) =>
      group.items.map((item) => item.id)
    );
    const report = educationalAssetCoverageReport(ids);
    expect(report.complete).toBe(true);
    expect(report.missing).toEqual([]);
  });

  it('covers every observer imitation movement with a cartoon asset', () => {
    const ids = OBSERVER_IMITATION_MOVEMENTS.map((item) => item.movementId);
    const report = educationalAssetCoverageReport(ids);
    expect(report.complete).toBe(true);
  });

  it('resolves emoji and Arabic labels used by home classroom cards', () => {
    expect(resolveEducationalAssetId('🚗')).toBe('car');
    expect(resolveEducationalAssetId('كوب')).toBe('cup');
    expect(resolveEducationalAssetId('المس أنفك')).toBe('touch_nose');
    expect(resolveEducationalAssetId('illustration:clap')).toBe('clap');
  });

  it('keeps communication pictograms on the cartoon map', () => {
    for (const id of ['come', 'sit', 'give', 'car', 'cup', 'ball', 'book']) {
      expect(hasCommPictogramArt(id)).toBe(true);
    }
  });
});
