import { cn } from '@/lib/cn';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-lg bg-app-surface p-1">
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium transition',
              // The accent fill rather than a lighter surface: on the dark
              // theme a 'raised' pill is darker than its track, which reads as
              // unselected.
              isSelected
                ? 'bg-app-accent text-app-accent-contrast'
                : 'text-app-muted hover:text-app-text'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
