import React, { useState } from 'react';
import { EQ_FREQUENCIES, audioEngine } from '../audio/audioEngine';
import { EQ_PRESETS } from '../data/audioData';
import { EqPreset, AcousticEnvironment } from '../types/audio';
import { useTheme } from '../context/ThemeContext';
import { Sliders, RotateCcw, Waves, Sparkles } from 'lucide-react';

interface EqualizerPanelProps {
  eqGains: number[];
  preampGain: number;
  onBandChange: (index: number, gain: number) => void;
  onPreampChange: (gain: number) => void;
  onPresetSelect: (preset: EqPreset) => void;
  onReset: () => void;
  acousticEnv: AcousticEnvironment;
  onAcousticEnvChange: (env: AcousticEnvironment) => void;
  stereoWidth: number;
  onStereoWidthChange: (width: number) => void;
}

export const EqualizerPanel: React.FC<EqualizerPanelProps> = ({
  eqGains,
  preampGain,
  onBandChange,
  onPreampChange,
  onPresetSelect,
  onReset,
  acousticEnv,
  onAcousticEnvChange,
  stereoWidth,
  onStereoWidthChange,
}) => {
  const { themeConfig } = useTheme();
  const [selectedPresetId, setSelectedPresetId] = useState<string>('harman');
  const [isBypassed, setIsBypassed] = useState<boolean>(false);

  // SVG Frequency Curve calculations
  const svgWidth = 480;
  const svgHeight = 70;
  const paddingX = 20;

  const points = eqGains.map((gain, idx) => {
    const x = paddingX + (idx / (eqGains.length - 1)) * (svgWidth - 2 * paddingX);
    const normalizedGain = isBypassed ? 0 : Math.max(-12, Math.min(12, gain + preampGain));
    const y = svgHeight / 2 - (normalizedGain / 12) * (svgHeight / 2 - 8);
    return `${x},${y}`;
  });

  const curvePath = `M ${points.join(' L ')}`;

  const handleSelectPreset = (preset: EqPreset) => {
    setSelectedPresetId(preset.id);
    onPresetSelect(preset);
  };

  const handleToggleBypass = () => {
    const nextBypass = !isBypassed;
    setIsBypassed(nextBypass);
    if (nextBypass) {
      eqGains.forEach((_, idx) => audioEngine.setEqBand(idx, 0));
      audioEngine.setPreampGain(0);
    } else {
      eqGains.forEach((g, idx) => audioEngine.setEqBand(idx, g));
      audioEngine.setPreampGain(preampGain);
    }
  };

  const formatFreqLabel = (hz: number) => {
    if (hz >= 1000) return `${hz / 1000}k`;
    return `${hz}`;
  };

  return (
    <div
      className="rounded-2xl border p-5 shadow-2xl backdrop-blur-md flex flex-col gap-6 transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Header & Preset Selector */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b"
        style={{ borderColor: 'var(--color-border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl border"
            style={{
              backgroundColor: 'var(--color-accent-dim)',
              borderColor: 'var(--color-accent-border)',
              color: 'var(--color-accent)',
            }}
          >
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
              Ecualizador Paramétrico de 10 Bandas
              <span
                className="text-[11px] font-mono font-normal"
                style={{ color: 'var(--color-accent)' }}
              >
                (±12 dB Studio Precision)
              </span>
            </h2>
            <p className="text-xs text-neutral-400">
              Calibración de respuesta de frecuencia y modelado de transductores
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleToggleBypass}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
              isBypassed
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'text-neutral-300 hover:text-neutral-100'
            }`}
            style={
              !isBypassed
                ? {
                    backgroundColor: 'var(--color-bg-alt)',
                    borderColor: 'var(--color-border)',
                  }
                : undefined
            }
          >
            {isBypassed ? 'EQ Desactivado (Bypass)' : 'EQ Activo'}
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white rounded-lg transition-colors border"
            style={{
              backgroundColor: 'var(--color-bg-alt)',
              borderColor: 'var(--color-border)',
            }}
            title="Reiniciar bandas a 0 dB"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>
        </div>
      </div>

      {/* Presets Bar */}
      <div>
        <label className="text-xs text-neutral-400 font-medium mb-2 block">
          Perfiles de Sonido Audiófilo:
        </label>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {EQ_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all border"
                style={
                  isSelected
                    ? {
                        backgroundColor: 'var(--color-accent)',
                        color: 'var(--color-accent-text-contrast)',
                        borderColor: 'var(--color-accent-hover)',
                        boxShadow: `0 4px 14px ${themeConfig.cssVariables['--color-accent-dim']}`,
                        fontWeight: 600,
                      }
                    : {
                        backgroundColor: 'var(--color-bg-base)',
                        color: '#a1a1aa',
                        borderColor: 'var(--color-border-subtle)',
                      }
                }
                title={preset.description}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Frequency Response Curve Graph */}
      <div
        className="rounded-xl border p-3 relative overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-base)',
          borderColor: 'var(--color-border-subtle)',
        }}
      >
        <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono-numbers mb-1">
          <span>+12 dB</span>
          <span className="font-sans" style={{ color: 'var(--color-accent)' }}>
            Curva de Transferencia Acústica (dB vs Hz)
          </span>
          <span>-12 dB</span>
        </div>
        <div className="h-16 w-full relative">
          <svg
            className="w-full h-full"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
          >
            {/* Center zero line */}
            <line
              x1="0"
              y1={svgHeight / 2}
              x2={svgWidth}
              y2={svgHeight / 2}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeDasharray="4 4"
            />
            {/* Filled area below curve */}
            <path
              d={`${curvePath} L ${svgWidth - paddingX},${svgHeight / 2} L ${paddingX},${svgHeight / 2} Z`}
              fill={themeConfig.cssVariables['--color-accent-dim']}
            />
            {/* Response line */}
            <path
              d={curvePath}
              fill="none"
              stroke={themeConfig.cssVariables['--color-accent']}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* 10 Band Equalizer Sliders + Preamp */}
      <div className="grid grid-cols-11 gap-2 pt-2">
        {/* Preamp Column */}
        <div
          className="flex flex-col items-center justify-between h-56 rounded-xl p-2 border"
          style={{
            backgroundColor: 'var(--color-bg-base)',
            borderColor: 'var(--color-border-subtle)',
          }}
        >
          <span
            className="text-[10px] font-mono-numbers font-medium"
            style={{ color: 'var(--color-accent)' }}
          >
            {preampGain > 0 ? `+${preampGain.toFixed(1)}` : preampGain.toFixed(1)}
          </span>
          <div className="h-36 flex items-center justify-center relative">
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={preampGain}
              onChange={(e) => onPreampChange(parseFloat(e.target.value))}
              className="slider-vertical h-32 w-4"
              style={{
                writingMode: 'vertical-lr',
                direction: 'rtl',
              }}
              title="Preamplificador general (-12dB a +12dB)"
            />
          </div>
          <div className="text-center">
            <span className="text-[10px] font-semibold text-neutral-300 block">PREAMP</span>
            <span className="text-[9px] text-neutral-500">Ganancia</span>
          </div>
        </div>

        {/* 10 Frequency Sliders */}
        {EQ_FREQUENCIES.map((freq, idx) => {
          const gain = eqGains[idx] || 0;
          return (
            <div
              key={freq}
              className="flex flex-col items-center justify-between h-56 rounded-xl p-2 border transition-colors group"
              style={{
                backgroundColor: 'var(--color-bg-base)',
                borderColor: 'var(--color-border-subtle)',
              }}
              onDoubleClick={() => onBandChange(idx, 0)}
              title={`Banda ${formatFreqLabel(freq)} Hz: ${gain > 0 ? `+${gain}` : gain} dB (Doble clic para 0dB)`}
            >
              <span
                className="text-[10px] font-mono-numbers font-medium"
                style={{
                  color: gain !== 0 ? 'var(--color-accent)' : '#71717a',
                }}
              >
                {gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1)}
              </span>

              <div className="h-36 flex items-center justify-center relative">
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={gain}
                  onChange={(e) => onBandChange(idx, parseFloat(e.target.value))}
                  className="slider-vertical h-32 w-4"
                  style={{
                    writingMode: 'vertical-lr',
                    direction: 'rtl',
                  }}
                />
              </div>

              <div className="text-center">
                <span className="text-[11px] font-mono font-medium text-neutral-200 block">
                  {formatFreqLabel(freq)}
                </span>
                <span className="text-[9px] text-neutral-500">Hz</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* DSP Soundstage Stage: Acoustic Environment & Stereo Width */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t"
        style={{ borderColor: 'var(--color-border-subtle)' }}
      >
        {/* Acoustic Environment Room Simulation */}
        <div
          className="p-3.5 rounded-xl border flex flex-col gap-2.5"
          style={{
            backgroundColor: 'var(--color-bg-base)',
            borderColor: 'var(--color-border-subtle)',
          }}
        >
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-300">
            <Waves className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            <span>Escenario Acústico & Convolución Espacial</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { id: 'direct', label: 'Bypass Directo', desc: 'Respuesta Pura' },
              { id: 'studio', label: 'Estudio Monitor', desc: 'Reflexión Seca' },
              { id: 'chamber', label: 'Cámara Sinfónica', desc: 'Espacio Abierto' },
              { id: 'tube', label: 'Etapa Válvula', desc: 'Armónicos Cálidos' },
            ].map((env) => {
              const isActive = acousticEnv === env.id;
              return (
                <button
                  key={env.id}
                  onClick={() => onAcousticEnvChange(env.id as AcousticEnvironment)}
                  className="p-2 rounded-lg text-left transition-all border"
                  style={
                    isActive
                      ? {
                          backgroundColor: 'var(--color-accent-dim)',
                          borderColor: 'var(--color-accent-border)',
                          color: 'var(--color-accent-light)',
                        }
                      : {
                          backgroundColor: 'var(--color-bg-card)',
                          borderColor: 'var(--color-border-subtle)',
                          color: '#a1a1aa',
                        }
                  }
                >
                  <span
                    className="text-xs font-semibold block"
                    style={{ color: isActive ? 'var(--color-accent-light)' : '#e5e5e7' }}
                  >
                    {env.label}
                  </span>
                  <span className="text-[10px] text-neutral-500 block">{env.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stereo Widening & Spatial Image */}
        <div
          className="p-3.5 rounded-xl border flex flex-col justify-between gap-2.5"
          style={{
            backgroundColor: 'var(--color-bg-base)',
            borderColor: 'var(--color-border-subtle)',
          }}
        >
          <div className="flex items-center justify-between text-xs font-medium text-neutral-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
              <span>Amplitud de Imagen Estéreo (Soundstage Width)</span>
            </div>
            <span
              className="text-xs font-mono-numbers font-bold"
              style={{ color: 'var(--color-accent)' }}
            >
              {Math.round(stereoWidth * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-neutral-500">Mono (0%)</span>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={stereoWidth}
              onChange={(e) => onStereoWidthChange(parseFloat(e.target.value))}
              className="flex-1 h-2 rounded-lg"
              style={{
                backgroundColor: 'var(--color-bg-alt)',
                accentColor: 'var(--color-accent)',
              }}
            />
            <span className="text-[11px] text-neutral-500">Ultra-Ancho (200%)</span>
          </div>

          <div className="flex justify-between text-[10px] text-neutral-500 pt-1">
            <span>Enfoque Central Focal</span>
            <span>Estéreo Natural (100%)</span>
            <span>Inmersión Binaural</span>
          </div>
        </div>
      </div>
    </div>
  );
};
