import React, { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket.js';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="w-full min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] selection:bg-[var(--color-accent)] selection:text-[var(--color-accent-foreground)] overflow-hidden">
      {children}
    </div>
  );
};
