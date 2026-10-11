import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../audio/audioEngine';
import { useTheme } from '../context/ThemeContext';
import { BarChart3, Activity, Disc, Gauge, Maximize2, Minimize2 } from 'lucide-react';

export type VisualizerTheme = 'amber' | 'cyan' | 'emerald' | 'silver' | 'ruby';
export type VisualizerType = 'spectrum' | 'oscilloscope' | 'vectorscope' | 'vu_meters';

interface VisualizerProps {
  isPlaying: boolean;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  isPlaying,
  onToggleFullscreen,
  isFullscreen = false,
}) => {
  const { themeConfig } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visType, setVisType] = useState<VisualizerType>('spectrum');
  
  // Local visualizer color theme state, initialized and synchronized with global theme
  const [theme, setTheme] = useState<VisualizerTheme>(() => {
    if (themeConfig.id === 'ruby-crimson') return 'ruby';
    return themeConfig.canvasTheme;
  });

  // Keep synced when global app theme changes
  useEffect(() => {
    if (themeConfig.id === 'ruby-crimson') {
      setTheme('ruby');
    } else {
      setTheme(themeConfig.canvasTheme);
    }
  }, [themeConfig.id, themeConfig.canvasTheme]);
  
  // Peak hold array for 64 spectrum bars
  const peaksRef = useRef<number[]>(new Array(64).fill(0));
  const peakDecayRef = useRef<number[]>(new Array(64).fill(0));

  // Visualizer color palettes
  const getThemeColors = (themeName: VisualizerTheme) => {
    switch (themeName) {
      case 'cyan':
        return {
          primary: '#06b6d4',
          secondary: '#3b82f6',
          peak: '#67e8f9',
          glow: 'rgba(6, 182, 212, 0.4)',
          bg: '#050a14',
          text: '#a5f3fc',
        };
      case 'emerald':
        return {
          primary: '#10b981',
          secondary: '#059669',
          peak: '#6ee7b7',
          glow: 'rgba(16, 185, 129, 0.4)',
          bg: '#040d09',
          text: '#a7f3d0',
        };
      case 'silver':
        return {
          primary: '#e4e4e7',
          secondary: '#a1a1aa',
          peak: '#ffffff',
          glow: 'rgba(255, 255, 255, 0.25)',
          bg: '#09090b',
          text: '#f4f4f5',
        };
      case 'ruby':
        return {
          primary: '#f43f5e',
          secondary: '#be123c',
          peak: '#fecdd3',
          glow: 'rgba(244, 63, 94, 0.45)',
          bg: '#0c0507',
          text: '#ffe4e6',
        };
      case 'amber':
      default:
        return {
          primary: '#f59e0b',
          secondary: '#d97706',
          peak: '#fde68a',
          glow: 'rgba(245, 158, 11, 0.45)',
          bg: '#0c0a06',
          text: '#fef3c7',
        };
    }
  };

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      animId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;
      const colors = getThemeColors(theme);

      // Background clear
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);

      // Grid lines / Audiophile display markings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridCols = 8;
      for (let i = 1; i < gridCols; i++) {
        const x = (width / gridCols) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      const gridRows = 4;
      for (let j = 1; j < gridRows; j++) {
        const y = (height / gridRows) * j;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const masterAnalyser = audioEngine.analyserMaster;
      const analyserL = audioEngine.analyserLeft;
      const analyserR = audioEngine.analyserRight;

      if (!masterAnalyser || !isPlaying) {
        // Idle ambient scan line
        ctx.strokeStyle = colors.glow;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const idleY = height / 2;
        ctx.moveTo(0, idleY);
        const time = Date.now() * 0.002;
        for (let x = 0; x < width; x += 10) {
          const dy = Math.sin(x * 0.03 + time) * 3;
          ctx.lineTo(x, idleY + dy);
        }
        ctx.stroke();

        // Standby text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ESTADO: EN ESPERA · MOTOR DAC LISTO', width / 2, height / 2 + 24);
        return;
      }

      if (visType === 'spectrum') {
        // 64-band Logarithmic Spectrum
        const bufferLength = masterAnalyser.frequencyBinCount;
        const freqData = new Uint8Array(bufferLength);
        masterAnalyser.getByteFrequencyData(freqData);

        const numBars = 64;
        const barSpacing = 2;
        const totalSpacing = barSpacing * (numBars - 1);
        const barWidth = Math.max(2, (width - totalSpacing) / numBars);

        // Pre-calculated logarithmic bin distribution
        for (let i = 0; i < numBars; i++) {
          const logIdx = Math.floor(Math.pow(i / numBars, 2.0) * (bufferLength * 0.8));
          const val = freqData[Math.min(bufferLength - 1, logIdx)] || 0;
          const barHeight = (val / 255) * (height - 20);

          const x = i * (barWidth + barSpacing);
          const y = height - barHeight;

          // Gradient for bar
          const grad = ctx.createLinearGradient(0, height, 0, y);
          grad.addColorStop(0, colors.secondary);
          grad.addColorStop(1, colors.primary);

          ctx.fillStyle = grad;
          ctx.fillRect(x, y, barWidth, barHeight);

          // Peak hold management
          if (val > peaksRef.current[i]) {
            peaksRef.current[i] = val;
            peakDecayRef.current[i] = 0;
          } else {
            peakDecayRef.current[i] += 0.8;
            peaksRef.current[i] = Math.max(0, peaksRef.current[i] - peakDecayRef.current[i]);
          }

          const peakY = height - (peaksRef.current[i] / 255) * (height - 20);
          ctx.fillStyle = colors.peak;
          ctx.fillRect(x, Math.max(2, peakY - 2), barWidth, 2);
        }
      } else if (visType === 'oscilloscope') {
        // Time-domain Oscilloscope
        const timeData = new Uint8Array(masterAnalyser.fftSize);
        masterAnalyser.getByteTimeDomainData(timeData);

        ctx.lineWidth = 2;
        ctx.strokeStyle = colors.primary;
        ctx.shadowColor = colors.primary;
        ctx.shadowBlur = 8;
        ctx.beginPath();

        const sliceWidth = width / timeData.length;
        let x = 0;

        for (let i = 0; i < timeData.length; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (visType === 'vectorscope') {
        // Stereo Phase Lissajous (Left vs Right)
        if (analyserL && analyserR) {
          const dataL = new Float32Array(analyserL.fftSize);
          const dataR = new Float32Array(analyserR.fftSize);
          analyserL.getFloatTimeDomainData(dataL);
          analyserR.getFloatTimeDomainData(dataR);

          const centerX = width / 2;
          const centerY = height / 2;
          const scale = Math.min(width, height) * 0.42;

          ctx.lineWidth = 1.2;
          ctx.strokeStyle = colors.primary;
          ctx.shadowColor = colors.primary;
          ctx.shadowBlur = 6;
          ctx.beginPath();

          for (let i = 0; i < dataL.length; i += 2) {
            const l = dataL[i];
            const r = dataR[i];
            const side = (l - r) * 0.7071;
            const mid = (l + r) * 0.7071;

            const px = centerX + side * scale;
            const py = centerY - mid * scale;

            if (i === 0) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          }
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Crosshair axes
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.beginPath();
          ctx.moveTo(centerX, centerY - scale);
          ctx.lineTo(centerX, centerY + scale);
          ctx.moveTo(centerX - scale, centerY);
          ctx.lineTo(centerX + scale, centerY);
          ctx.stroke();

          // Labels
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillText('+S (Mono)', centerX, centerY - scale - 6);
          ctx.fillText('-S', centerX, centerY + scale + 14);
          ctx.fillText('L', centerX - scale - 12, centerY + 3);
          ctx.fillText('R', centerX + scale + 6, centerY + 3);
        }
      } else if (visType === 'vu_meters') {
        // Dual Channel Analog VU Meters
        if (analyserL && analyserR) {
          const dataL = new Float32Array(analyserL.fftSize);
          const dataR = new Float32Array(analyserR.fftSize);
          analyserL.getFloatTimeDomainData(dataL);
          analyserR.getFloatTimeDomainData(dataR);

          let sumL = 0;
          let sumR = 0;
          for (let i = 0; i < dataL.length; i++) {
            sumL += dataL[i] * dataL[i];
            sumR += dataR[i] * dataR[i];
          }
          const rmsL = Math.sqrt(sumL / dataL.length);
          const rmsR = Math.sqrt(sumR / dataR.length);

          const dbL = Math.max(-60, 20 * Math.log10(rmsL + 1e-6));
          const dbR = Math.max(-60, 20 * Math.log10(rmsR + 1e-6));

          const meterHeight = 22;
          const meterWidth = width * 0.75;
          const startX = (width - meterWidth) / 2;

          const renderMeter = (dbVal: number, label: string, yPos: number) => {
            ctx.fillStyle = colors.text;
            ctx.font = '11px "JetBrains Mono", monospace';
            ctx.textAlign = 'right';
            ctx.fillText(label, startX - 12, yPos + 15);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(startX, yPos, meterWidth, meterHeight);

            const segments = 40;
            const segWidth = (meterWidth - (segments - 1) * 2) / segments;
            const normVal = Math.min(1, Math.max(0, (dbVal + 60) / 60));
            const activeSegments = Math.round(normVal * segments);

            for (let s = 0; s < segments; s++) {
              const segX = startX + s * (segWidth + 2);
              const isClip = s >= segments * 0.88;
              const isWarning = s >= segments * 0.72 && !isClip;

              if (s < activeSegments) {
                ctx.fillStyle = isClip ? '#ef4444' : isWarning ? '#f59e0b' : colors.primary;
              } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
              }
              ctx.fillRect(segX, yPos, segWidth, meterHeight);
            }

            ctx.textAlign = 'left';
            ctx.fillStyle = colors.text;
            ctx.fillText(`${dbVal.toFixed(1)} dB`, startX + meterWidth + 12, yPos + 15);
          };

          renderMeter(dbL, 'CH-L', height / 2 - 28);
          renderMeter(dbR, 'CH-R', height / 2 + 10);
        }
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [visType, theme, isPlaying]);

  // Handle high-dpi canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen]);

  return (
    <div
      className={`relative flex flex-col rounded-2xl border overflow-hidden shadow-2xl backdrop-blur-md transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-2xl' : 'w-full'
      }`}
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Visualizer Header Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{
          backgroundColor: 'var(--color-bg-header)',
          borderColor: 'var(--color-border-subtle)',
        }}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mode Switchers */}
          <button
            onClick={() => setVisType('spectrum')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors border"
            style={{
              backgroundColor: visType === 'spectrum' ? 'var(--color-accent-dim)' : 'transparent',
              borderColor: visType === 'spectrum' ? 'var(--color-accent-border)' : 'transparent',
              color: visType === 'spectrum' ? 'var(--color-accent-light)' : '#a1a1aa',
            }}
            title="Analizador de Espectro FFT"
          >
            <BarChart3 className="w-3.5 h-3.5" style={{ color: visType === 'spectrum' ? 'var(--color-accent)' : undefined }} />
            <span className="hidden sm:inline">Espectro RTA</span>
          </button>

          <button
            onClick={() => setVisType('oscilloscope')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors border"
            style={{
              backgroundColor: visType === 'oscilloscope' ? 'var(--color-accent-dim)' : 'transparent',
              borderColor: visType === 'oscilloscope' ? 'var(--color-accent-border)' : 'transparent',
              color: visType === 'oscilloscope' ? 'var(--color-accent-light)' : '#a1a1aa',
            }}
            title="Osciloscopio Forma de Onda"
          >
            <Activity className="w-3.5 h-3.5" style={{ color: visType === 'oscilloscope' ? 'var(--color-accent)' : undefined }} />
            <span className="hidden sm:inline">Osciloscopio</span>
          </button>

          <button
            onClick={() => setVisType('vectorscope')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors border"
            style={{
              backgroundColor: visType === 'vectorscope' ? 'var(--color-accent-dim)' : 'transparent',
              borderColor: visType === 'vectorscope' ? 'var(--color-accent-border)' : 'transparent',
              color: visType === 'vectorscope' ? 'var(--color-accent-light)' : '#a1a1aa',
            }}
            title="Goniómetro / Fase Estéreo"
          >
            <Disc className="w-3.5 h-3.5" style={{ color: visType === 'vectorscope' ? 'var(--color-accent)' : undefined }} />
            <span className="hidden sm:inline">Fase Estéreo</span>
          </button>

          <button
            onClick={() => setVisType('vu_meters')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors border"
            style={{
              backgroundColor: visType === 'vu_meters' ? 'var(--color-accent-dim)' : 'transparent',
              borderColor: visType === 'vu_meters' ? 'var(--color-accent-border)' : 'transparent',
              color: visType === 'vu_meters' ? 'var(--color-accent-light)' : '#a1a1aa',
            }}
            title="Vúmetros Analógicos L/R"
          >
            <Gauge className="w-3.5 h-3.5" style={{ color: visType === 'vu_meters' ? 'var(--color-accent)' : undefined }} />
            <span className="hidden sm:inline">Vúmetros VU</span>
          </button>
        </div>

        {/* Theme and Fullscreen Controls */}
        <div className="flex items-center gap-2">
          {/* Visualizer Quick Palette Switcher */}
          <div
            className="flex items-center gap-1 p-0.5 rounded-lg border"
            style={{
              backgroundColor: 'var(--color-bg-base)',
              borderColor: 'var(--color-border-subtle)',
            }}
          >
            {(['amber', 'cyan', 'emerald', 'silver', 'ruby'] as VisualizerTheme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`w-3.5 h-3.5 rounded-full transition-transform ${
                  theme === t ? 'scale-125 ring-2 ring-white/60' : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  backgroundColor:
                    t === 'amber'
                      ? '#f59e0b'
                      : t === 'cyan'
                      ? '#06b6d4'
                      : t === 'emerald'
                      ? '#10b981'
                      : t === 'ruby'
                      ? '#f43f5e'
                      : '#e4e4e7',
                }}
                title={`Modo de color visualizador: ${t}`}
              />
            ))}
          </div>

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded-lg transition-colors"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa de monitoreo'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className={`w-full relative ${isFullscreen ? 'flex-1 h-full' : 'h-48 sm:h-56'}`}>
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};
