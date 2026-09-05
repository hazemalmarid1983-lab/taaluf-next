/** تسميات مختصرة للرادار حتى لا تُقصّ الحروف العربية في الرسم LTR */
const RADAR_DOMAIN_LABELS: Record<string, string> = {
  'التواصل الاستجابي والتعبيري': 'التواصل',
  'التفاعل والاندماج الاجتماعي واللعب': 'التفاعل واللعب',
  'النمو المعرفي والحلول الإدراكية': 'النمو المعرفي',
  'السلوك والتكيف والحواس واستقلالية الذات': 'السلوك والتكيف',
};

export function shortRadarDomainLabel(domain: string): string {
  return RADAR_DOMAIN_LABELS[domain] || domain;
}
