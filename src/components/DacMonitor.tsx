import React, { useEffect, useState } from 'react';
import { Track, AudioEngineMetrics } from '../types/audio';
import { audioEngine } from '../audio/audioEngine';
import { Cpu, Headphones, Mic, Volume2, SlidersHorizontal } from 'lucide-react';

interface DacMonitorProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onOpenAudioDeviceModal?: () => void;
  detectedOutputLabel?: string;
  detectedInputLabel?: string;
}

export const DacMonitor: React.FC<DacMonitorProps> = ({
  currentTrack,
  isPlaying,
  onOpenAudioDeviceModal,
  detectedOutputLabel,
  detectedInputLabel,
}) => {
  const [metrics, setMetrics] = useState<AudioEngineMetrics>({
    sampleRate: 48000,
    estimatedBitDepth: 24,
    latencyMs: 5.2,
    peakL: 0,
    peakR: 0,
    rmsL: -100,
    rmsR: -100,
    dynamicRangeDb: 108,
  });

  useEffect(() => {
    let timer: number;
    const updateMetrics = () => {
      const data = audioEngine.getAudioMetrics();
      setMetrics(data);
      timer = requestAnimationFrame(updateMetrics);
    };

    if (isPlaying) {
      timer = requestAnimationFrame(updateMetrics);
    } else {
      setMetrics((prev) => ({
        ...prev,
        peakL: 0,
        peakR: 0,
        rmsL: -100,
        rmsR: -100,
      }));
    }

    return () => {
      cancelAnimationFrame(timer);
    };
  }, [isPlaying]);

  const formatRate = (hz: number) => {
    if (hz >= 1000) return `${(hz / 1000).toFixed(1)} kHz`;
    return `${hz} Hz`;
  };

  const isHiRes =
    (currentTrack?.sampleRate && currentTrack.sampleRate >= 88200) ||
    (currentTrack?.bitDepth && currentTrack.bitDepth >= 24) ||
    currentTrack?.format === 'DSD' ||
    currentTrack?.format === 'FLAC';

  return (
    <div
      className="rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b gap-3"
        style={{ borderColor: 'var(--color-border-subtle)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="p-1.5 rounded-lg border"
            style={{
              backgroundColor: 'var(--color-accent-dim)',
              borderColor: 'var(--color-accent-border)',
              color: 'var(--color-accent)',
            }}
          >
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-neutral-100 flex items-center gap-2">
              Decodificador DAC & Salida de Audio Hi-Res
              {isHiRes && (
                <span
                  className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border"
                  style={{
                    backgroundColor: 'var(--color-accent-dim)',
                    borderColor: 'var(--color-accent-border)',
                    color: 'var(--color-accent-light)',
                  }}
                >
                  HI-RES AUDIO
                </span>
              )}
            </h3>
            <span className="text-[10px] text-neutral-400">
              Monitoreo en tiempo real de tasa de muestreo, profundidad de bits y dispositivos E/S
            </span>
          </div>
        </div>

        {/* Audio Devices Detected Pills + Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenAudioDeviceModal && (
            <button
              onClick={onOpenAudioDeviceModal}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded-lg border transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
              style={{
                backgroundColor: 'var(--color-bg-base)',
                borderColor: 'var(--color-accent-border)',
                color: 'var(--color-accent-light)',
              }}
              title="Configurar y probar dispositivos de entrada y salida detectados"
            >
              <Headphones className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
              <span className="truncate max-w-[130px] sm:max-w-[180px]">
                {detectedOutputLabel || 'Salida DAC'}
              </span>
              <span className="text-neutral-500">|</span>
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate max-w-[90px] sm:max-w-[140px] text-emerald-400">
                {detectedInputLabel || 'Entrada Mic'}
              </span>
            </button>
          )}

          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-mono"
            style={{
              backgroundColor: 'var(--color-bg-base)',
              borderColor: 'var(--color-border-subtle)',
            }}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'
              }`}
            />
            <span className="text-neutral-300">
              {isPlaying ? 'DAC ACTIVO' : 'EN ESPERA'}
            </span>
          </div>
        </div>
      </div>

      {/* DAC Specifications Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Input Format & Codec */}
        <div
          className="p-2.5 rounded-xl border"
          style={{
            backgroundColor: 'var(--color-bg-base)',
            borderColor: 'var(--color-border-subtle)',
          }}
        >
          <span className="text-[10px] text-neutral-500 block uppercase font-mono">
            Códec / Formato
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-sm font-bold text-neutral-100 font-mono">
              {currentTrack?.format || 'PCM WAV'}
            </span>
            <span className="text-[10px] text-neutral-400">
              {currentTrack?.isStream ? 'Live Stream' : 'Direct Stream'}
            </span>
          </div>
          <span
            className="text-[10px] font-mono mt-0.5 block truncate"
            style={{ color: 'var(--color-accent)' }}
          >
            {currentTrack?.bitrate
              ? `${currentTrack.bitrate} kbps`
              : 'Bitrate Variable'}
          </span>
        </div>

        {/* Source Sample Rate & Depth */}
        <div
          className="p-2.5 rounded-xl border"
          style={{
            backgroundColor: 'var(--color-bg-base)',
            borderColor: 'var(--color-border-subtle)',
          }}
        >
          <span className="text-[10px] text-neutral-500 block uppercase font-mono">
            Resolución Origen
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span
              className="text-sm font-bold font-mono"
              style={{ color: 'var(--color-accent)' }}
            >
              {formatRate(currentTrack?.sampleRate || 48000)}
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
            {currentTrack?.bitDepth
              ? `${currentTrack.bitDepth}-Bit Studio`
              : '24-Bit Float'}
          </span>
        </div>

        {/* DAC Engine Hardware Sample Rate */}
        <div
          className="p-2.5 rounded-xl border"
          style={{
            backgroundColor: 'var(--color-bg-base)',
            borderColor: 'var(--color-border-subtle)',
          }}
        >
          <span className="text-[10px] text-neutral-500 block uppercase font-mono">
            Frecuencia DAC Salida
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {formatRate(metrics.sampleRate)}
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
            Latencia: {metrics.latencyMs.toFixed(1)} ms
          </span>
        </div>

        {/* Dynamic Range & Headroom */}
        <div
          className="p-2.5 rounded-xl border"
          style={{
            backgroundColor: 'var(--color-bg-base)',
            borderColor: 'var(--color-border-subtle)',
          }}
        >
          <span className="text-[10px] text-neutral-500 block uppercase font-mono">
            Rango Dinámico / SNR
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-sm font-bold text-sky-400 font-mono">
              {metrics.dynamicRangeDb} dB
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
            {metrics.peakL > 0.98 ? 'Aviso de saturación' : 'Headroom Óptimo'}
          </span>
        </div>
      </div>

      {/* Real-time Level Bars */}
      <div
        className="mt-3 pt-3 border-t flex flex-col gap-1.5"
        style={{ borderColor: 'var(--color-border-subtle)' }}
      >
        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
          <span>SALIDA L/R RMS:</span>
          <span>
            L: {metrics.rmsL.toFixed(1)} dBFS · R: {metrics.rmsR.toFixed(1)} dBFS
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* L Channel Bar */}
          <div
            className="h-1.5 rounded-full overflow-hidden border"
            style={{
              backgroundColor: 'var(--color-bg-base)',
              borderColor: 'var(--color-border-subtle)',
            }}
          >
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-75"
              style={{ width: `${Math.min(100, metrics.peakL * 100)}%` }}
            />
          </div>
          {/* R Channel Bar */}
          <div
            className="h-1.5 rounded-full overflow-hidden border"
            style={{
              backgroundColor: 'var(--color-bg-base)',
              borderColor: 'var(--color-border-subtle)',
            }}
          >
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-75"
              style={{ width: `${Math.min(100, metrics.peakR * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
