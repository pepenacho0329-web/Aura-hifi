export type ThemeId = 'retro-amber' | 'midnight-blue' | 'minimalist-gray' | 'emerald-studio' | 'ruby-crimson';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  description: string;
  swatchColor: string; // for the selector button
  canvasTheme: 'amber' | 'cyan' | 'emerald' | 'silver';
  cssVariables: {
    '--color-bg-base': string;
    '--color-bg-card': string;
    '--color-bg-header': string;
    '--color-bg-alt': string;
    '--color-border': string;
    '--color-border-subtle': string;
    '--color-accent': string;
    '--color-accent-hover': string;
    '--color-accent-light': string;
    '--color-accent-dim': string;
    '--color-accent-border': string;
    '--color-accent-glow': string;
    '--color-accent-text-contrast': string;
    '--color-selection-bg': string;
    '--color-selection-text': string;
  };
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  'retro-amber': {
    id: 'retro-amber',
    name: 'Retro Amber',
    tagline: 'Válvulas & Medidores Analógicos',
    description: 'Tono cálido clásico inspirado en amplificadores a bulbos y el resplandor ámbar de McIntosh.',
    swatchColor: '#f59e0b',
    canvasTheme: 'amber',
    cssVariables: {
      '--color-bg-base': '#0a0907',
      '--color-bg-card': '#14120e',
      '--color-bg-header': '#0d0b08',
      '--color-bg-alt': '#1b1813',
      '--color-border': '#2a241a',
      '--color-border-subtle': '#1f1b13',
      '--color-accent': '#f59e0b',
      '--color-accent-hover': '#fbbf24',
      '--color-accent-light': '#fef3c7',
      '--color-accent-dim': 'rgba(245, 158, 11, 0.15)',
      '--color-accent-border': 'rgba(245, 158, 11, 0.35)',
      '--color-accent-glow': 'rgba(245, 158, 11, 0.45)',
      '--color-accent-text-contrast': '#0a0907',
      '--color-selection-bg': 'rgba(245, 158, 11, 0.25)',
      '--color-selection-text': '#fde68a',
    },
  },
  'midnight-blue': {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    tagline: 'Zafiro & Cian Espacial',
    description: 'Profundo azul cósmico con acentos zafiro y cian brillante, estilo DAC moderno Chord Electronics.',
    swatchColor: '#06b6d4',
    canvasTheme: 'cyan',
    cssVariables: {
      '--color-bg-base': '#060912',
      '--color-bg-card': '#0c1222',
      '--color-bg-header': '#080d19',
      '--color-bg-alt': '#131c33',
      '--color-border': '#1c294a',
      '--color-border-subtle': '#141e36',
      '--color-accent': '#06b6d4',
      '--color-accent-hover': '#22d3ee',
      '--color-accent-light': '#cffafe',
      '--color-accent-dim': 'rgba(6, 182, 212, 0.15)',
      '--color-accent-border': 'rgba(6, 182, 212, 0.35)',
      '--color-accent-glow': 'rgba(6, 182, 212, 0.45)',
      '--color-accent-text-contrast': '#060912',
      '--color-selection-bg': 'rgba(6, 182, 212, 0.25)',
      '--color-selection-text': '#a5f3fc',
    },
  },
  'minimalist-gray': {
    id: 'minimalist-gray',
    name: 'Minimalist Gray',
    tagline: 'Titanio & Monocromo Estudio',
    description: 'Estética sobria de estudio de grabación en grafito y titanio con acentos en plata pura de referencia.',
    swatchColor: '#e4e4e7',
    canvasTheme: 'silver',
    cssVariables: {
      '--color-bg-base': '#09090b',
      '--color-bg-card': '#141418',
      '--color-bg-header': '#0f0f12',
      '--color-bg-alt': '#1c1c22',
      '--color-border': '#272730',
      '--color-border-subtle': '#1e1e24',
      '--color-accent': '#e4e4e7',
      '--color-accent-hover': '#ffffff',
      '--color-accent-light': '#fafafa',
      '--color-accent-dim': 'rgba(228, 228, 231, 0.15)',
      '--color-accent-border': 'rgba(228, 228, 231, 0.35)',
      '--color-accent-glow': 'rgba(255, 255, 255, 0.35)',
      '--color-accent-text-contrast': '#09090b',
      '--color-selection-bg': 'rgba(228, 228, 231, 0.25)',
      '--color-selection-text': '#ffffff',
    },
  },
  'emerald-studio': {
    id: 'emerald-studio',
    name: 'Emerald Studio',
    tagline: 'Consola SSL & Cinta Master',
    description: 'Inspirado en legendarias consolas analógicas SSL, Studer y vúmetros LED esmeralda de precisión.',
    swatchColor: '#10b981',
    canvasTheme: 'emerald',
    cssVariables: {
      '--color-bg-base': '#050a07',
      '--color-bg-card': '#0b1610',
      '--color-bg-header': '#08100b',
      '--color-bg-alt': '#112219',
      '--color-border': '#193325',
      '--color-border-subtle': '#12251b',
      '--color-accent': '#10b981',
      '--color-accent-hover': '#34d399',
      '--color-accent-light': '#d1fae5',
      '--color-accent-dim': 'rgba(16, 185, 129, 0.15)',
      '--color-accent-border': 'rgba(16, 185, 129, 0.35)',
      '--color-accent-glow': 'rgba(16, 185, 129, 0.45)',
      '--color-accent-text-contrast': '#050a07',
      '--color-selection-bg': 'rgba(16, 185, 129, 0.25)',
      '--color-selection-text': '#a7f3d0',
    },
  },
  'ruby-crimson': {
    id: 'ruby-crimson',
    name: 'Ruby Crimson',
    tagline: 'Edición Audión & Rubí Noir',
    description: 'Atmósfera nocturna aterciopelada con destellos rubí cálidos inspirados en electrónicas high-end de Tokio.',
    swatchColor: '#f43f5e',
    canvasTheme: 'amber', // will use ruby glow
    cssVariables: {
      '--color-bg-base': '#0b0507',
      '--color-bg-card': '#170b0f',
      '--color-bg-header': '#10070a',
      '--color-bg-alt': '#241017',
      '--color-border': '#361823',
      '--color-border-subtle': '#28121a',
      '--color-accent': '#f43f5e',
      '--color-accent-hover': '#fb7185',
      '--color-accent-light': '#ffe4e6',
      '--color-accent-dim': 'rgba(244, 63, 94, 0.15)',
      '--color-accent-border': 'rgba(244, 63, 94, 0.35)',
      '--color-accent-glow': 'rgba(244, 63, 94, 0.45)',
      '--color-accent-text-contrast': '#0b0507',
      '--color-selection-bg': 'rgba(244, 63, 94, 0.25)',
      '--color-selection-text': '#fecdd3',
    },
  },
};
