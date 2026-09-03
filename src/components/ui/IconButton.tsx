import { type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: the button has no text, so it needs an accessible name. */
  label: string;
}

export function IconButton({ label, className, type, ...props }: IconButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-9 cursor-pointer items-center justify-center rounded-lg',
        'text-app-muted transition hover:bg-app-surface hover:text-app-text',
        'disabled:pointer-events-none disabled:opacity-30',
        className
      )}
      {...props}
    />
  );
}
