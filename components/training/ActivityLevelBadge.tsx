export default function ActivityLevelBadge({
  level,
  tone = 'light',
}: {
  level: number;
  tone?: 'light' | 'dark';
}) {
  const shown = Math.max(1, Math.floor(Number.isFinite(level) ? level : 1));
  const toneClass =
    tone === 'dark'
      ? 'bg-white/15 text-white ring-white/25'
      : 'bg-white text-[#1F4E5A] ring-[#2E7D8E]/25';

  return (
    <p
      data-activity-level={shown}
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold shadow-sm ring-1 ${toneClass}`}
    >
      المستوى {shown}
    </p>
  );
}
