'use client';

type Props = {
  count?: number;
  className?: string;
  showDotIfZero?: boolean;
};

export default function NotificationLabel({ count = 0, className = '', showDotIfZero = false }: Props) {
  const showDot = showDotIfZero && count === 0;
  const visible = count > 0 || showDot;

  if (!visible) return null;

  return (
    <span
      className={[
        'absolute -right-2 -top-3 min-w-[18px] h-[18px]',
        'rounded-full px-1.5 text-[10px] leading-[18px] text-white',
        'bg-rose-500/70',
        'flex items-center justify-center',
        className,
      ].join(' ')}
      aria-label={count > 0 ? `${count} notifications` : 'No notifications'}
    >
      {count > 0 ? count : ''}
    </span>
  );
}
