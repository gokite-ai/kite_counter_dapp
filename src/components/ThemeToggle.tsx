import React, { useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('kite_theme') as ThemeMode;
    if (saved) setTheme(saved);
  }, []);

  const switchTheme = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    localStorage.setItem('kite_theme', nextTheme);
    if (nextTheme === 'dark' || (nextTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900/60 p-1 text-xs">
      <button
        onClick={() => switchTheme('dark')}
        className={`px-2 py-1 rounded transition ${theme === 'dark' ? 'bg-neutral-800 text-neutral-100 font-bold' : 'text-neutral-400 hover:text-neutral-200'}`}
      >
        Dark
      </button>
      <button
        onClick={() => switchTheme('light')}
        className={`px-2 py-1 rounded transition ${theme === 'light' ? 'bg-neutral-800 text-neutral-100 font-bold' : 'text-neutral-400 hover:text-neutral-200'}`}
      >
        Light
      </button>
      <button
        onClick={() => switchTheme('system')}
        className={`px-2 py-1 rounded transition ${theme === 'system' ? 'bg-neutral-800 text-neutral-100 font-bold' : 'text-neutral-400 hover:text-neutral-200'}`}
      >
        Auto
      </button>
    </div>
  );
};

export default ThemeToggle;
