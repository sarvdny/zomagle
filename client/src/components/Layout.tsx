import React, { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket.js';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected } = useSocket();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-bg-primary overflow-x-hidden text-text-primary transition-colors duration-200">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg-primary border-b border-border transition-colors duration-200">
        <div className="h-14 w-full px-margin-desktop flex items-center justify-between">
          <span className="font-headline-sm text-headline-sm tracking-tight text-text-primary">Zomagle</span>
          <div className="flex items-center gap-space-md">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md hover:bg-bg-tertiary transition-colors flex items-center justify-center text-text-secondary hover:text-text-primary"
              aria-label="Toggle theme"
            >
              <span className="material-symbols-outlined text-[20px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-bg-secondary border border-border">
              <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-danger'}`}></span>
              <span className="font-label-sm text-label-sm text-text-primary">
                {isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col items-center justify-center relative pt-14">
        {children}
      </main>
      
      <footer className="w-full border-t border-border bg-bg-secondary py-space-sm px-margin-desktop transition-colors duration-200">
        <div className="w-full flex items-center justify-center gap-space-md font-label-sm text-label-sm text-text-muted">
          <span>Zomagle</span>
          <span className="text-border">·</span>
          <span>Private</span>
          <span className="text-border">·</span>
          <span>P2P</span>
        </div>
      </footer>
    </div>
  );
};
