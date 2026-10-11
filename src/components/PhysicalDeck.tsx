import React, { useState } from 'react';
import { Track } from '../types/audio';
import { useTheme } from '../context/ThemeContext';
import {
  Disc,
  Play,
  Pause,
  Maximize2,
  RotateCcw,
  Volume2,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { CoverArtModal } from './CoverArtModal';

export type DeckMode = 'vinyl' | 'cassette' | 'cd';

interface PhysicalDeckProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek?: (seconds: number) => void;
  onUpdateCoverArt?: (trackId: string, newCoverUrl: string) => void;
}

const DECK_STORAGE_KEY = 'aurahifi_deck_mode';

export const PhysicalDeck: React.FC<PhysicalDeckProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  onUpdateCoverArt,
}) => {
  const { themeConfig } = useTheme();
  const [deckMode, setDeckMode] = useState<DeckMode>(() => {
    const saved = localStorage.getItem(DECK_STORAGE_KEY);
    if (saved === 'vinyl' || saved === 'cassette' || saved === 'cd') {
      return saved as DeckMode;
    }
    return 'vinyl';
  });

  const [rpmSpeed, setRpmSpeed] = useState<'33' | '45' | '78'>('33');
  const [cassetteSide, setCassetteSide] = useState<'A' | 'B'>('A');
  const [isCoverModalOpen, setIsCoverModalOpen] = useState<boolean>(false);
  const [isCdTrayOpen, setIsCdTrayOpen] = useState<boolean>(false);

  const handleSelectMode = (mode: DeckMode) => {
    setDeckMode(mode);
    localStorage.setItem(DECK_STORAGE_KEY, mode);
  };

  const progress =
    duration > 0 && isFinite(duration)
      ? Math.min(1, Math.max(0, currentTime / duration))
      : 0;

  // Tonearm angle calculation for Vinyl (Rest: 0deg, Outer groove: 22deg, Run-out groove: 38deg)
  const tonearmAngle = isPlaying ? 22 + progress * 16 : 0;

  // Cassette tape spool radii
  const minTapeR = 18;
  const maxTapeR = 42;
  const leftTapeRadius =
    cassetteSide === 'A'
      ? maxTapeR - progress * (maxTapeR - minTapeR)
      : minTapeR + progress * (maxTapeR - minTapeR);
  const rightTapeRadius =
    cassetteSide === 'A'
      ? minTapeR + progress * (maxTapeR - minTapeR)
      : maxTapeR - progress * (maxTapeR - minTapeR);

  // CD Laser sled position (percentage across radial travel)
  const laserTravelPercent = 25 + progress * 55;

  const coverImage =
    currentTrack?.coverUrl ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';

  const handleCoverArtUpdated = (trackId: string, newUrl: string) => {
    if (onUpdateCoverArt) {
      onUpdateCoverArt(trackId, newUrl);
    }
  };

  return (
    <div
      className="rounded-2xl border p-4 sm:p-5 shadow-2xl backdrop-blur-md flex flex-col gap-4 transition-colors overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Deck Mode Switcher Bar */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b"
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
            <Disc className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-100 flex items-center gap-2">
              Cubierta Física Interactiva
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-accent)',
                }}
              >
                {deckMode === 'vinyl'
                  ? 'TOCADISCOS VINILO'
                  : deckMode === 'cassette'
                  ? 'PLETINA CASSETTE'
                  : 'LECTOR CD TRANSPORT'}
              </span>
            </h3>
            <span className="text-[10px] text-neutral-400">
              Haz clic en la carátula para verla en alta resolución o personalizar portada
            </span>
          </div>
        </div>

        {/* Mode Selector Segmented Tabs */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl border self-start sm:self-auto"
          style={{
            backgroundColor: 'var(--color-bg-base)',
            borderColor: 'var(--color-border-subtle)',
          }}
        >
          <button
            onClick={() => handleSelectMode('vinyl')}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all"
            style={
              deckMode === 'vinyl'
                ? {
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-accent-text-contrast)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }
                : { color: '#a1a1aa' }
            }
          >
            <span>💿</span>
            <span>Vinilo</span>
          </button>

          <button
            onClick={() => handleSelectMode('cassette')}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all"
            style={
              deckMode === 'cassette'
                ? {
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-accent-text-contrast)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }
                : { color: '#a1a1aa' }
            }
          >
            <span>📼</span>
            <span>Cassette</span>
          </button>

          <button
            onClick={() => handleSelectMode('cd')}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all"
            style={
              deckMode === 'cd'
                ? {
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-accent-text-contrast)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }
                : { color: '#a1a1aa' }
            }
          >
            <span>📀</span>
            <span>CD Audio</span>
          </button>
        </div>
      </div>

      {/* Main Presentation Viewport with Physical Artwork Sleeve integration */}
      <div
        className="w-full relative rounded-2xl border p-4 sm:p-6 flex flex-col md:flex-row items-center justify-around gap-6 min-h-[300px] overflow-hidden select-none"
        style={{
          backgroundColor: 'var(--color-bg-base)',
          borderColor: 'var(--color-border-subtle)',
          boxShadow: 'inset 0 0 50px rgba(0, 0, 0, 0.9)',
        }}
      >
        {/* ======================================================== */}
        {/* 1. MODO VINILO                                           */}
        {/* ======================================================== */}
        {deckMode === 'vinyl' && (
          <>
            {/* Turntable Plinth */}
            <div className="relative w-64 sm:w-80 h-64 sm:h-80 flex items-center justify-center shrink-0">
              {/* Platter Strobe Rim */}
              <div
                className="absolute inset-0 rounded-full border-4 border-dashed opacity-40"
                style={{
                  borderColor: isPlaying ? 'var(--color-accent)' : '#3f3f46',
                  animation: isPlaying ? 'spin-vinyl-33 12s linear infinite' : 'none',
                }}
              />

              {/* Vinyl Record */}
              <div
                onClick={onTogglePlay}
                className="relative w-56 sm:w-72 h-56 sm:h-72 rounded-full vinyl-grooves cursor-pointer flex items-center justify-center shadow-2xl transition-transform hover:scale-[1.01]"
                style={{
                  animation: isPlaying
                    ? `spin-vinyl-33 ${
                        rpmSpeed === '78'
                          ? '0.77s'
                          : rpmSpeed === '45'
                          ? '1.33s'
                          : '1.8s'
                      } linear infinite`
                    : 'none',
                }}
                title={
                  isPlaying
                    ? 'Hacer clic para pausar vinilo'
                    : 'Hacer clic para girar vinilo'
                }
              >
                {/* Vinyl Light Gloss Reflection */}
                <div
                  className="absolute inset-0 rounded-full pointer-events-none opacity-20"
                  style={{
                    background:
                      'conic-gradient(from 45deg, transparent 0deg, rgba(255,255,255,0.4) 60deg, transparent 120deg, transparent 180deg, rgba(255,255,255,0.4) 240deg, transparent 300deg)',
                  }}
                />

                {/* Center Vinyl Paper Label with REAL ALBUM ARTWORK! */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCoverModalOpen(true);
                  }}
                  className="w-24 sm:w-28 h-24 sm:h-28 rounded-full border-2 border-amber-500/60 overflow-hidden relative shadow-inner flex items-center justify-center group/label cursor-pointer"
                  title="Ver carátula del vinilo en alta resolución"
                >
                  <img
                    src={coverImage}
                    alt={currentTrack?.title}
                    className="w-full h-full object-cover group-hover/label:scale-110 transition-transform"
                  />
                  {/* Dark circular overlay with track info */}
                  <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center p-1 text-center">
                    <span className="text-[7px] font-mono font-bold text-amber-300 uppercase tracking-widest">
                      {rpmSpeed} RPM
                    </span>
                    <span className="text-[8px] font-bold text-white truncate w-16 block leading-tight">
                      {currentTrack?.title}
                    </span>
                  </div>
                  {/* Spindle hole */}
                  <div className="w-3.5 h-3.5 rounded-full bg-neutral-950 border border-neutral-700 shadow-inner z-10" />
                </div>
              </div>

              {/* Tonearm Assembly */}
              <div
                onClick={onTogglePlay}
                className="absolute -top-3 -right-2 sm:right-0 w-24 h-56 cursor-pointer transition-transform duration-700 ease-out z-20"
                style={{
                  transformOrigin: '20px 20px',
                  transform: `rotate(${tonearmAngle}deg)`,
                }}
                title="Brazo fonocaptor (clic para bajar/levantar aguja)"
              >
                <div
                  className="w-10 h-10 rounded-full border-2 shadow-xl flex items-center justify-center"
                  style={{
                    backgroundColor: '#1f1f23',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full border shadow"
                    style={{
                      backgroundColor: 'var(--color-accent)',
                      borderColor: '#18181b',
                    }}
                  />
                </div>
                <div className="w-1.5 h-36 bg-gradient-to-r from-neutral-300 via-neutral-100 to-neutral-400 rounded-full ml-4 shadow-md" />
                <div className="w-5 h-9 bg-neutral-900 border border-neutral-600 rounded-t-sm ml-2.5 -mt-1 flex flex-col items-center justify-end p-0.5 shadow-lg">
                  <div
                    className="w-2.5 h-3 rounded-sm"
                    style={{ backgroundColor: 'var(--color-accent)' }}
                  />
                  {isPlaying && (
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-0.5 animate-ping"
                      style={{ backgroundColor: 'var(--color-accent)' }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Vinyl LP Sleeve / Carátula de Vinilo */}
            <div className="flex flex-col items-center">
              <div
                onClick={() => setIsCoverModalOpen(true)}
                className="group relative w-44 sm:w-52 h-44 sm:h-52 rounded-xl overflow-hidden border-2 shadow-2xl cursor-pointer transition-transform hover:scale-105"
                style={{ borderColor: 'var(--color-border)' }}
                title="Hacer clic para ampliar carátula en alta resolución"
              >
                <img
                  src={coverImage}
                  alt={currentTrack?.title}
                  className="w-full h-full object-cover group-hover:brightness-110 transition-all"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center justify-between">
                    <span>Funda LP 12"</span>
                    <span className="text-[8px] bg-black/60 px-1 py-0.2 rounded">Ver / Cambiar</span>
                  </span>
                  <h4 className="text-xs font-bold text-white truncate">
                    {currentTrack?.title}
                  </h4>
                  <span className="text-[10px] text-neutral-300 truncate">
                    {currentTrack?.artist}
                  </span>
                </div>
                <div className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Turntable Speed Controller */}
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={onTogglePlay}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-mono font-bold transition-all"
                  style={{
                    backgroundColor: isPlaying
                      ? 'var(--color-accent)'
                      : 'var(--color-bg-card)',
                    color: isPlaying
                      ? 'var(--color-accent-text-contrast)'
                      : 'var(--color-accent-light)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  {isPlaying ? (
                    <Pause className="w-3 h-3 fill-current" />
                  ) : (
                    <Play className="w-3 h-3 fill-current" />
                  )}
                  <span>{isPlaying ? `${rpmSpeed} RPM ON` : 'MOTOR OFF'}</span>
                </button>

                <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-0.5 rounded-lg text-xs font-mono">
                  {(['33', '45', '78'] as const).map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setRpmSpeed(spd)}
                      className="px-2 py-0.5 rounded transition-colors"
                      style={
                        rpmSpeed === spd
                          ? {
                              backgroundColor: 'var(--color-accent)',
                              color: 'var(--color-accent-text-contrast)',
                              fontWeight: 700,
                            }
                          : { color: '#71717a' }
                      }
                    >
                      {spd}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ======================================================== */}
        {/* 2. MODO CASSETTE                                         */}
        {/* ======================================================== */}
        {deckMode === 'cassette' && (
          <div className="w-full max-w-xl flex flex-col sm:flex-row items-center justify-around gap-6">
            {/* Cassette Tape Shell */}
            <div
              className="relative w-72 sm:w-80 h-48 sm:h-52 rounded-2xl border-4 p-3 shadow-2xl flex flex-col justify-between overflow-hidden shrink-0"
              style={{
                backgroundColor: '#16161a',
                borderColor: '#2e2e36',
                boxShadow:
                  'inset 0 0 30px rgba(0, 0, 0, 0.9), 0 15px 35px rgba(0,0,0,0.8)',
              }}
            >
              {/* Paper Label Upper Area */}
              <div
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl p-2 shadow-md flex items-center justify-between"
                style={{
                  background: 'linear-gradient(180deg, #222228 0%, #17171c 100%)',
                }}
              >
                <div className="min-w-0 flex-1 mr-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setCassetteSide(cassetteSide === 'A' ? 'B' : 'A')
                      }
                      className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded transition-transform active:scale-95"
                      style={{
                        backgroundColor: 'var(--color-accent)',
                        color: 'var(--color-accent-text-contrast)',
                      }}
                      title="Voltear cara de cassette (A/B)"
                    >
                      LADO {cassetteSide}
                    </button>
                    <span className="text-[9px] font-mono text-neutral-400">
                      CrO2 70µs · DOLBY NR
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-neutral-100 truncate mt-0.5">
                    {currentTrack?.title}
                  </h4>
                </div>

                {/* Mini Album Cover Sticker on Tape */}
                <div
                  onClick={() => setIsCoverModalOpen(true)}
                  className="w-10 h-10 rounded-md overflow-hidden border border-neutral-600 shrink-0 cursor-pointer shadow hover:scale-105 transition-transform"
                  title="Ver carátula del cassette"
                >
                  <img
                    src={coverImage}
                    alt={currentTrack?.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Tape Window with Dual Rotating Spools */}
              <div
                className="w-full h-20 rounded-xl border-2 relative flex items-center justify-between px-8 overflow-hidden shadow-inner cursor-pointer"
                onClick={onTogglePlay}
                style={{
                  backgroundColor: 'rgba(8, 8, 10, 0.95)',
                  borderColor: '#27272e',
                }}
              >
                {/* Left Spool Reel */}
                <div className="relative flex items-center justify-center">
                  <div
                    className="absolute rounded-full transition-all duration-300"
                    style={{
                      width: `${leftTapeRadius * 1.8}px`,
                      height: `${leftTapeRadius * 1.8}px`,
                      backgroundColor: '#382218',
                    }}
                  />
                  <div
                    className="w-10 h-10 rounded-full bg-neutral-200 border-2 border-neutral-400 flex items-center justify-center shadow-md relative z-10"
                    style={{
                      animation: isPlaying
                        ? 'spin-vinyl-33 1.2s linear infinite'
                        : 'none',
                    }}
                  >
                    <div className="w-8 h-1.5 bg-neutral-800 rounded-sm absolute" />
                    <div className="w-1.5 h-8 bg-neutral-800 rounded-sm absolute" />
                  </div>
                </div>

                {/* Right Spool Reel */}
                <div className="relative flex items-center justify-center">
                  <div
                    className="absolute rounded-full transition-all duration-300"
                    style={{
                      width: `${rightTapeRadius * 1.8}px`,
                      height: `${rightTapeRadius * 1.8}px`,
                      backgroundColor: '#382218',
                    }}
                  />
                  <div
                    className="w-10 h-10 rounded-full bg-neutral-200 border-2 border-neutral-400 flex items-center justify-center shadow-md relative z-10"
                    style={{
                      animation: isPlaying
                        ? 'spin-vinyl-33 1.2s linear infinite'
                        : 'none',
                    }}
                  >
                    <div className="w-8 h-1.5 bg-neutral-800 rounded-sm absolute" />
                    <div className="w-1.5 h-8 bg-neutral-800 rounded-sm absolute" />
                  </div>
                </div>
              </div>

              {/* Tape Transport Footer */}
              <div className="w-full flex items-center justify-between px-4 pt-0.5 text-[9px] font-mono text-neutral-400">
                <span>MOTOR {isPlaying ? 'ACTIVO' : 'PAUSA'}</span>
                <span style={{ color: 'var(--color-accent)' }}>
                  CONTADOR:{' '}
                  {Math.floor(currentTime * 10)
                    .toString()
                    .padStart(4, '0')}
                </span>
              </div>
            </div>

            {/* Cassette J-Card Box Artwork */}
            <div
              onClick={() => setIsCoverModalOpen(true)}
              className="group relative w-36 sm:w-44 h-48 sm:h-52 rounded-xl overflow-hidden border-2 shadow-2xl cursor-pointer transition-transform hover:scale-105"
              style={{ borderColor: 'var(--color-border)' }}
              title="Hacer clic para ampliar carátula J-Card"
            >
              <img
                src={coverImage}
                alt={currentTrack?.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                <span className="text-[9px] font-mono text-amber-400 font-bold flex items-center justify-between">
                  <span>ESTUCHE J-CARD</span>
                  <span className="text-[8px] bg-black/60 px-1 py-0.2 rounded">Ver / Cambiar</span>
                </span>
                <span className="text-xs font-bold text-white truncate">
                  {currentTrack?.title}
                </span>
                <span className="text-[10px] text-neutral-300 truncate">
                  {currentTrack?.artist}
                </span>
              </div>
              <div className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. MODO CD AUDIO                                         */}
        {/* ======================================================== */}
        {deckMode === 'cd' && (
          <div className="w-full max-w-xl flex flex-col sm:flex-row items-center justify-around gap-6">
            {/* CD Transport Player Top Well */}
            <div
              className="relative w-64 sm:w-72 h-64 sm:h-72 rounded-2xl border-2 p-3 shadow-2xl flex items-center justify-center overflow-hidden shrink-0"
              style={{
                backgroundColor: '#121216',
                borderColor: 'var(--color-border)',
              }}
            >
              <div
                className="relative w-56 sm:w-64 h-56 sm:h-64 rounded-full border flex items-center justify-center shadow-inner overflow-hidden cursor-pointer"
                onClick={onTogglePlay}
                style={{ backgroundColor: '#07070a', borderColor: '#27272e' }}
              >
                {/* Laser Linear Rail & Pickup Sled */}
                <div
                  className="absolute top-1/2 h-5 w-7 bg-neutral-800 border border-neutral-600 rounded-sm -translate-y-1/2 pointer-events-none transition-all duration-300 z-10 flex items-center justify-center"
                  style={{ left: `${laserTravelPercent}%` }}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPlaying
                        ? 'animate-laser bg-sky-400 shadow-sky-400'
                        : 'bg-neutral-600'
                    }`}
                  />
                </div>

                {/* Spinning Compact Disc with REAL ALBUM ARTWORK SILKSCREEN! */}
                <div
                  className="relative w-52 sm:w-60 h-52 sm:h-60 rounded-full cd-surface flex items-center justify-center shadow-2xl"
                  style={{
                    animation: isPlaying
                      ? 'spin-cd-fast 0.65s linear infinite'
                      : 'none',
                  }}
                >
                  {/* Holographic diffraction sheen */}
                  <div className="absolute inset-0 rounded-full animate-hologram pointer-events-none opacity-40 mix-blend-color-dodge" />

                  {/* Silkscreen Cover Picture Layer */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCoverModalOpen(true);
                    }}
                    className="w-32 sm:w-36 h-32 sm:h-36 rounded-full overflow-hidden border border-white/20 relative shadow-md cursor-pointer hover:scale-105 transition-transform"
                    title="Ver carátula serigrafiada del CD"
                  >
                    <img
                      src={coverImage}
                      alt={currentTrack?.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                  </div>

                  {/* Center Clamping Hub */}
                  <div className="absolute w-16 h-16 rounded-full bg-neutral-900 border-2 border-neutral-500 flex flex-col items-center justify-center text-center shadow-2xl z-20">
                    <span className="text-[7px] font-mono font-bold text-amber-300">
                      CD-DA
                    </span>
                    <div className="w-4 h-4 rounded-full bg-neutral-950 border border-neutral-600 mt-0.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* CD Jewel Case Packaging Artwork */}
            <div
              onClick={() => setIsCoverModalOpen(true)}
              className="group relative w-44 sm:w-52 h-44 sm:h-52 rounded-xl overflow-hidden border-2 shadow-2xl cursor-pointer transition-transform hover:scale-105"
              style={{ borderColor: 'var(--color-border)' }}
              title="Hacer clic para ampliar carátula Jewel Case CD"
            >
              <img
                src={coverImage}
                alt={currentTrack?.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                <span className="text-[9px] font-mono text-sky-400 font-bold uppercase flex items-center justify-between">
                  <span>Jewel Box CD</span>
                  <span className="text-[8px] bg-black/60 px-1 py-0.2 rounded">Ver / Cambiar</span>
                </span>
                <span className="text-xs font-bold text-white truncate">
                  {currentTrack?.title}
                </span>
                <span className="text-[10px] text-neutral-300 truncate">
                  {currentTrack?.artist}
                </span>
              </div>
              <div className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive High-Res Album Cover Viewer Modal */}
      <CoverArtModal
        track={currentTrack}
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        onUpdateCoverArt={handleCoverArtUpdated}
      />
    </div>
  );
};
