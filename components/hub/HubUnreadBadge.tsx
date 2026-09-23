'use client';

type HubUnreadBadgeProps = {
  count: number;
  isAr: boolean;
  pulse?: boolean;
  className?: string;
};

export default function HubUnreadBadge({
  count,
  isAr,
  pulse = false,
  className = '',
}: HubUnreadBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={`ms-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white ${
        pulse ? 'animate-pulse ring-2 ring-rose-300' : ''
      } ${className}`}
      title={isAr ? 'تحديثات غير مقروءة' : 'Unread updates'}
      aria-label={
        isAr ? `${count} تحديثات غير مقروءة` : `${count} unread updates`
      }
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function HubNewLabel({ isAr }: { isAr: boolean }) {
  return (
    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
      {isAr ? 'جديد' : 'New'}
    </span>
  );
}
