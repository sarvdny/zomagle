/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        accent: 'var(--color-accent)',
        'accent-foreground': 'var(--color-accent-foreground)',
        destructive: 'var(--color-destructive)',
        'destructive-foreground': 'var(--color-destructive-foreground)',
        muted: 'var(--color-muted)',
        'muted-foreground': 'var(--color-muted-foreground)',
        border: 'var(--color-border)',
      },
      borderRadius: {
        'DEFAULT': '0.125rem',
        'lg': '0.25rem',
        'xl': '0.5rem',
        'full': '0.75rem'
      },
      spacing: {
        'margin': '1rem',
        'space-sm': '0.5rem',
        'gutter-tablet': '1.25rem',
        'space-lg': '1.5rem',
        'space-xl': '2rem',
        'margin-tablet': '1.5rem',
        'space-xs': '0.25rem',
        'space-md': '1rem',
        'margin-desktop': '2rem',
        'gutter': '1rem',
        'gutter-desktop': '1.5rem'
      },
      fontFamily: {
        'headline-md': ['Geist', 'sans-serif'],
        'label-md': ['JetBrains Mono', 'monospace'],
        'body-md': ['Geist', 'sans-serif'],
        'body-lg': ['Geist', 'sans-serif'],
        'headline-sm': ['Geist', 'sans-serif'],
        'headline-lg': ['Geist', 'sans-serif'],
        'body-sm': ['Geist', 'sans-serif'],
        'label-sm': ['JetBrains Mono', 'monospace'],
        'caption': ['Geist', 'sans-serif'],
        'headline-lg-mobile': ['Geist', 'sans-serif']
      },
      fontSize: {
        'headline-md': ['20px', { lineHeight: '28px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'label-md': ['13px', { lineHeight: '18px', letterSpacing: '-0.01em', fontWeight: '500' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'headline-sm': ['16px', { lineHeight: '24px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'label-sm': ['11px', { lineHeight: '14px', letterSpacing: '0.02em', fontWeight: '500' }],
        'caption': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: '600' }]
      }
    }
  }
}
