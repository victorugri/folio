import { type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-app-accent text-app-accent-contrast hover:brightness-110',
  ghost: 'text-app-text hover:bg-app-surface',
};

export function Button({ variant = 'ghost', className, type, ...props }: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2',
        'text-sm font-medium transition disabled:pointer-events-none disabled:opacity-40',
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
}
