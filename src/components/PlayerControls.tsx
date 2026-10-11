import React, { useState } from 'react';
import { Track } from '../types/audio';
import { useTheme } from '../context/ThemeContext';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Heart,
} from 'lucide-react';

interface PlayerControlsProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  playbackRate: number;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onSkipBack: (seconds: number) => void;
  onSkipForward: (seconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onToggleFavorite: (trackId: string) => void;
  onOpenCoverModal?: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffle,
  repeatMode,
  playbackRate,
  onPlayPause,
  onSeek,
  onPrev,
  onNext,
  onSkipBack,
  onSkipForward,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onCycleRepeat,
  onPlaybackRateChange,
  onToggleFavorite,
  onOpenCoverModal,
}) => {
  const { themeConfig } = useTheme();
  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isLiveStream = currentTrack?.isStream;
  const progressPercent = duration > 0 && isFinite(duration) ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLiveStream || duration <= 0 || !isFinite(duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    onSeek(pos * duration);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLiveStream || duration <= 0 || !isFinite(duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    setHoverSeekTime(pos * duration);
  };

  return (
    <div
      className="border-t px-4 py-3 sm:px-6 shadow-2xl backdrop-blur-xl sticky bottom-0 z-40 transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-header)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Progress Bar (Scrubber) */}
      {!isLiveStream ? (
        <div className="w-full mb-3 flex items-center gap-3">
          <span className="text-[11px] font-mono-numbers text-neutral-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>

          <div
            className="flex-1 h-3 flex items-center cursor-pointer group relative py-1"
            onClick={handleProgressClick}
            onMouseMove={handleProgressMouseMove}
            onMouseLeave={() => setHoverSeekTime(null)}
          >
            {/* Track background */}
            <div
              className="w-full h-1.5 rounded-full overflow-hidden relative group-hover:h-2 transition-all"
              style={{ backgroundColor: 'var(--color-border-subtle)' }}
            >
              {/* Progress filled */}
              <div
                className="h-full rounded-full relative transition-all"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: 'var(--color-accent)',
                  boxShadow: `0 0 10px ${themeConfig.cssVariables['--color-accent-glow']}`,
                }}
              />
            </div>

            {/* Hover tooltip */}
            {hoverSeekTime !== null && (
              <div
                className="absolute -top-7 transform -translate-x-1/2 text-neutral-200 text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none border"
                style={{
                  left: `${(hoverSeekTime / duration) * 100}%`,
                  backgroundColor: 'var(--color-bg-card)',
                  borderColor: 'var(--color-border)',
                }}
              >
                {formatTime(hoverSeekTime)}
              </div>
            )}
          </div>

          <span className="text-[11px] font-mono-numbers text-neutral-500 w-10">
            {formatTime(duration)}
          </span>
        </div>
      ) : (
        <div className="w-full mb-2 flex items-center justify-between text-xs px-2 text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-mono text-rose-400 font-semibold text-[11px]">EN VIVO (STREAM NUBE)</span>
          </div>
          <span className="font-mono text-[11px] text-neutral-500">
            Flujo continuo {currentTrack?.bitrate || 320} kbps
          </span>
        </div>
      )}

      {/* Main Controls Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Current Track Info */}
        <div className="flex items-center gap-3 min-w-0 w-full md:w-1/3">
          <div
            onClick={onOpenCoverModal}
            className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md border cursor-pointer hover:scale-105 transition-transform group/art"
            title="Ver o cambiar carátula del álbum en alta resolución"
            style={{
              backgroundColor: 'var(--color-bg-base)',
              borderColor: 'var(--color-border)',
            }}
          >
            {currentTrack?.coverUrl ? (
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover group-hover/art:brightness-110"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center font-mono text-xs font-bold"
                style={{ color: 'var(--color-accent)' }}
              >
                {currentTrack?.format || 'HI-FI'}
              </div>
            )}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-neutral-100 truncate">
                {currentTrack?.title || 'Selecciona una pista'}
              </h4>
              {currentTrack && (
                <button
                  onClick={() => onToggleFavorite(currentTrack.id)}
                  className="transition-colors"
                  style={{
                    color: currentTrack.isFavorite ? 'var(--color-accent)' : '#71717a',
                  }}
                  title="Favorito"
                >
                  <Heart className={`w-3.5 h-3.5 ${currentTrack.isFavorite ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-400 truncate">
              <span className="truncate">{currentTrack?.artist || 'AuraHiFi Studio'}</span>
              {currentTrack?.format && (
                <>
                  <span className="text-neutral-600">·</span>
                  <span
                    className="text-[10px] font-mono font-medium"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {currentTrack.format} {currentTrack.sampleRate ? `${currentTrack.sampleRate / 1000}k` : ''}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center Playback Buttons */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            onClick={onToggleShuffle}
            className="p-2 rounded-lg transition-colors border"
            style={
              isShuffle
                ? {
                    color: 'var(--color-accent-light)',
                    backgroundColor: 'var(--color-accent-dim)',
                    borderColor: 'var(--color-accent-border)',
                  }
                : {
                    color: '#a1a1aa',
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                  }
            }
            title="Reproducción aleatoria"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSkipBack(10)}
            className="p-2 text-neutral-400 hover:text-neutral-200 rounded-lg transition-colors hidden sm:block"
            title="Retroceder 10 segundos"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onPrev}
            className="p-2 text-neutral-300 hover:text-white rounded-lg transition-colors"
            title="Pista anterior"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={onPlayPause}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-accent-text-contrast)',
              boxShadow: `0 4px 18px ${themeConfig.cssVariables['--color-accent-glow']}`,
            }}
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-2 text-neutral-300 hover:text-white rounded-lg transition-colors"
            title="Siguiente pista"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={() => onSkipForward(10)}
            className="p-2 text-neutral-400 hover:text-neutral-200 rounded-lg transition-colors hidden sm:block"
            title="Avanzar 10 segundos"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={onCycleRepeat}
            className="p-2 rounded-lg transition-colors border"
            style={
              repeatMode !== 'off'
                ? {
                    color: 'var(--color-accent-light)',
                    backgroundColor: 'var(--color-accent-dim)',
                    borderColor: 'var(--color-accent-border)',
                  }
                : {
                    color: '#a1a1aa',
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                  }
            }
            title={`Repetición: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
        </div>

        {/* Right Tools: Speed, Volume */}
        <div className="flex items-center justify-end gap-3 w-full md:w-1/3">
          {/* Speed Selector */}
          <div
            className="hidden lg:flex items-center gap-1 border rounded-lg p-0.5 text-[10px] font-mono"
            style={{
              backgroundColor: 'var(--color-bg-base)',
              borderColor: 'var(--color-border)',
            }}
          >
            {[0.75, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => onPlaybackRateChange(rate)}
                className="px-1.5 py-0.5 rounded transition-colors"
                style={
                  playbackRate === rate
                    ? {
                        backgroundColor: 'var(--color-accent)',
                        color: 'var(--color-accent-text-contrast)',
                        fontWeight: 700,
                      }
                    : {
                        color: '#a1a1aa',
                      }
                }
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Volume Slider & Mute */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleMute}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 transition-colors"
              title={isMuted ? 'Desactivar silencio' : 'Silenciar'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-20 sm:w-28 h-1.5 rounded-lg cursor-pointer"
              style={{
                backgroundColor: 'var(--color-bg-alt)',
                accentColor: 'var(--color-accent)',
              }}
              title={`Volumen: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />

            <span className="text-[10px] font-mono-numbers text-neutral-500 w-8 text-right hidden sm:inline">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
