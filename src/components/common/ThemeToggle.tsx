'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'party_theme';

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

export function readStoredTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    // private windows and blocked storage both land here
  }
  return 'system';
}

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const stored = readStoredTheme();
    setTheme(stored);
    apply(stored);
  }, []);

  const choose = (next: Theme) => {
    setTheme(next);
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // the choice still applies for this visit
    }
  };

  const options: Array<{ key: Theme; icon: React.ReactNode; label: string }> = [
    { key: 'light', icon: <Sun className="w-3.5 h-3.5" />, label: 'สว่าง' },
    { key: 'dark', icon: <Moon className="w-3.5 h-3.5" />, label: 'มืด' },
    { key: 'system', icon: <Monitor className="w-3.5 h-3.5" />, label: 'ตามเครื่อง' },
  ];

  return (
    <div
      className={`inline-flex items-center gap-0.5 p-0.5 rounded-full bg-surface2 border border-line ${className}`}
      role="group"
      aria-label="โหมดสีของหน้าจอ"
    >
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => choose(o.key)}
          title={o.label}
          aria-pressed={theme === o.key}
          className={`px-2 py-1 rounded-full transition ${
            theme === o.key
              ? 'bg-mint text-[rgb(var(--c-on-accent))] shadow'
              : 'text-ink-faint hover:text-ink'
          }`}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
};
