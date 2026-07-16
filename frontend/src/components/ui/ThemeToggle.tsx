'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type Theme } from '@/components/providers/ThemeProvider';

type ToggleVariant = 'compact' | 'segmented';

const options: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light',  icon: Sun,     label: 'Light' },
  { value: 'dark',   icon: Moon,    label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
];

export function ThemeToggle({ variant = 'segmented' }: { variant?: ToggleVariant }) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  if (variant === 'compact') {
    const Icon = resolvedTheme === 'dark' ? Sun : Moon;
    return (
      <button
        onClick={toggleTheme}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-all duration-[var(--duration-base)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
        title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-0.5"
      role="group"
      aria-label="Theme selection"
    >
      {options.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            title={`${label} theme`}
            aria-label={`${label} theme`}
            aria-pressed={isActive}
            className={`
              flex h-7 w-7 items-center justify-center rounded-md transition-all duration-[var(--duration-fast)]
              ${isActive
                ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
              }
            `}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
