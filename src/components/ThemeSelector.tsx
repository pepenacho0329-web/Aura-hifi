import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ThemeId } from '../types/theme';
import { Palette, Check, Sparkles } from 'lucide-react';

export const ThemeSelector: React.FC = () => {
  const { currentTheme, themeConfig, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectTheme = (id: ThemeId) => {
    setTheme(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all border shadow-sm"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderColor: isOpen ? 'var(--color-accent)' : 'var(--color-border)',
          color: 'var(--color-accent-light)',
        }}
        title="Personalizar tema de color de la interfaz"
      >
        <Palette className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
        
        {/* Swatch color dot */}
        <span
          className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
          style={{
            backgroundColor: themeConfig.swatchColor,
            boxShadow: `0 0 6px ${themeConfig.swatchColor}`,
          }}
        />

        <span className="hidden sm:inline font-medium text-neutral-200">
          {themeConfig.name}
        </span>

        <span
          className={`text-[9px] text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>

      {/* Floating Theme Popover */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl border shadow-2xl z-50 p-3 backdrop-blur-xl animate-fade-in"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderColor: 'var(--color-border)',
            boxShadow: `0 20px 40px rgba(0, 0, 0, 0.7), 0 0 25px ${themeConfig.cssVariables['--color-accent-dim']}`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
              <span className="text-xs font-bold text-neutral-200">
                Temas Visuales Audiófilos
              </span>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">
              5 paletas de estudio
            </span>
          </div>

          {/* Theme List */}
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {availableThemes.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  className="w-full text-left p-2.5 rounded-xl transition-all border flex items-start gap-3 group relative overflow-hidden"
                  style={{
                    backgroundColor: isSelected
                      ? theme.cssVariables['--color-accent-dim']
                      : 'var(--color-bg-base)',
                    borderColor: isSelected
                      ? theme.cssVariables['--color-accent-border']
                      : 'var(--color-border-subtle)',
                  }}
                >
                  {/* Swatch circle with glowing ring */}
                  <div className="pt-0.5 shrink-0">
                    <span
                      className={`w-4 h-4 rounded-full block transition-transform group-hover:scale-110 ${
                        isSelected ? 'ring-2 ring-offset-2 ring-offset-neutral-900' : ''
                      }`}
                      style={{
                        backgroundColor: theme.swatchColor,
                        boxShadow: `0 0 8px ${theme.swatchColor}80`,
                        borderColor: theme.swatchColor,
                      }}
                    />
                  </div>

                  {/* Title & Description */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-semibold transition-colors"
                        style={{
                          color: isSelected ? theme.cssVariables['--color-accent-light'] : '#e5e5e7',
                        }}
                      >
                        {theme.name}
                      </span>
                      {isSelected && (
                        <Check
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: theme.cssVariables['--color-accent'] }}
                        />
                      )}
                    </div>

                    <span
                      className="text-[10px] font-medium block mt-0.5"
                      style={{
                        color: isSelected ? theme.cssVariables['--color-accent'] : '#a1a1aa',
                      }}
                    >
                      {theme.tagline}
                    </span>

                    <p className="text-[10px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {theme.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div
            className="pt-2.5 mt-2 border-t text-[10px] text-neutral-400 flex items-center justify-between"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            <span>Persistencia automática</span>
            <span className="font-mono text-[9px] text-neutral-500">HTML5 LocalStorage</span>
          </div>
        </div>
      )}
    </div>
  );
};
