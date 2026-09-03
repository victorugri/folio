import { type ReactNode } from 'react';
import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl';
import { useSettingsStore } from '@/store/settingsStore';
import { FONT_SIZE, type FontFamily, type ThemeName } from '@/types/settings';

const THEME_OPTIONS: readonly SegmentedOption<ThemeName>[] = [
  { value: 'light', label: 'Light' },
  { value: 'sepia', label: 'Sepia' },
  { value: 'dark', label: 'Dark' },
];

const FONT_OPTIONS: readonly SegmentedOption<FontFamily>[] = [
  { value: 'serif', label: 'Serif' },
  { value: 'sans', label: 'Sans' },
];

export function SettingsPanel() {
  const theme = useSettingsStore((state) => state.theme);
  const fontFamily = useSettingsStore((state) => state.fontFamily);
  const fontSize = useSettingsStore((state) => state.fontSize);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setFontFamily = useSettingsStore((state) => state.setFontFamily);
  const stepFontSize = useSettingsStore((state) => state.stepFontSize);

  return (
    <div className="space-y-4">
      <Field label="Theme">
        <SegmentedControl label="Theme" options={THEME_OPTIONS} value={theme} onChange={setTheme} />
      </Field>

      <Field label="Typeface">
        <SegmentedControl
          label="Typeface"
          options={FONT_OPTIONS}
          value={fontFamily}
          onChange={setFontFamily}
        />
      </Field>

      <Field label="Text size">
        <div className="flex items-center gap-1 rounded-lg bg-app-surface p-1">
          <StepButton
            label="Smaller text"
            onClick={() => stepFontSize(-FONT_SIZE.step)}
            disabled={fontSize <= FONT_SIZE.min}
          >
            A
          </StepButton>
          <span className="flex-1 text-center text-xs tabular-nums text-app-muted">
            {fontSize}%
          </span>
          <StepButton
            label="Larger text"
            onClick={() => stepFontSize(FONT_SIZE.step)}
            disabled={fontSize >= FONT_SIZE.max}
          >
            <span className="text-base">A</span>
          </StepButton>
        </div>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium tracking-wide text-app-muted uppercase">{label}</p>
      {children}
    </div>
  );
}

interface StepButtonProps {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}

function StepButton({ label, disabled, onClick, children }: StepButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-7 cursor-pointer items-center justify-center rounded-md text-xs font-semibold transition hover:bg-app-bg disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}
