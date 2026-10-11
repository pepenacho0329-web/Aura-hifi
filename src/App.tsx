/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Track, AcousticEnvironment, EqPreset } from './types/audio';
import { INITIAL_TRACKS, EQ_PRESETS } from './data/audioData';
import { audioEngine } from './audio/audioEngine';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ThemeSelector } from './components/ThemeSelector';
import { PhysicalDeck } from './components/PhysicalDeck';
import { Visualizer } from './components/Visualizer';
import { EqualizerPanel } from './components/EqualizerPanel';
import { DacMonitor } from './components/DacMonitor';
import { PlayerControls } from './components/PlayerControls';
import { Playlist } from './components/Playlist';
import { CloudStreamModal } from './components/CloudStreamModal';
import { MetadataModal } from './components/MetadataModal';
import { MobileExportModal } from './components/MobileExportModal';
import { FolderScanModal } from './components/FolderScanModal';
import { AudioDeviceModal } from './components/AudioDeviceModal';
import { CoverArtModal } from './components/CoverArtModal';
import {
  detectAudioDevices,
  subscribeToDeviceChanges,
  AudioDevice,
} from './utils/audioDevices';
import { extractAudioFileMetadata } from './utils/audioMetadata';
import {
  Sliders,
  Cloud,
  Headphones,
  ListMusic,
  Activity,
  Disc,
  BarChart3,
  Columns2,
  Smartphone,
  FolderOpen,
  Mic,
  Image as ImageIcon,
} from 'lucide-react';

function AuraHiFiApp() {
  const { themeConfig } = useTheme();
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(INITIAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(INITIAL_TRACKS[0]?.duration || 32);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('all');
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  // Equalizer & DSP Soundstage state
  const [eqGains, setEqGains] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [preampGain, setPreampGain] = useState<number>(0);
  const [acousticEnv, setAcousticEnv] = useState<AcousticEnvironment>('direct');
  const [stereoWidth, setStereoWidth] = useState<number>(1.0);

  // Modals & Panels
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState<boolean>(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState<boolean>(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState<boolean>(false);
  const [isAudioDeviceModalOpen, setIsAudioDeviceModalOpen] = useState<boolean>(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState<boolean>(false);
  const [trackForCoverModal, setTrackForCoverModal] = useState<Track | null>(null);

  const [inspectedTrack, setInspectedTrack] = useState<Track | null>(null);
  const [isFullscreenVis, setIsFullscreenVis] = useState<boolean>(false);

  // Audio Device Detection State
  const [detectedOutputLabel, setDetectedOutputLabel] = useState<string>('Salida DAC Principal');
  const [detectedInputLabel, setDetectedInputLabel] = useState<string>('Entrada Micrófono');

  // Navigation tabs for mobile / desktop layout
  const [activeTab, setActiveTab] = useState<'studio' | 'equalizer' | 'library'>('studio');

  // Studio Presentation Mode (Deck / Dual / Visualizer)
  const [studioPresentation, setStudioPresentation] = useState<'deck' | 'dual' | 'visualizer'>('dual');

  // Initialize engine listeners & Audio Hardware detection
  useEffect(() => {
    audioEngine.onTimeUpdate = (time, dur) => {
      setCurrentTime(time);
      if (dur && isFinite(dur)) {
        setDuration(dur);
      }
    };

    audioEngine.onStateChange = (playing) => {
      setIsPlaying(playing);
    };

    audioEngine.onTrackEnded = () => {
      handleNextTrack();
    };

    audioEngine.onError = (err) => {
      console.warn('Audio Engine warning:', err);
    };

    // Apply default Harman audiophile curve
    const defaultPreset = EQ_PRESETS[1];
    if (defaultPreset) {
      setEqGains([...defaultPreset.gains]);
      setPreampGain(defaultPreset.preamp);
      audioEngine.applyPreset(defaultPreset);
    }

    // Detect Audio Input and Output Devices on launch
    const refreshDevices = async () => {
      const { inputs, outputs } = await detectAudioDevices();
      const defOut = outputs.find((o) => o.isDefault) || outputs[0];
      const defIn = inputs.find((i) => i.isDefault) || inputs[0];
      if (defOut) setDetectedOutputLabel(defOut.label);
      if (defIn) setDetectedInputLabel(defIn.label);
    };

    refreshDevices();
    const unsub = subscribeToDeviceChanges(() => {
      refreshDevices();
    });

    return () => unsub();
  }, []);

  // Controls Handlers
  const handlePlayPause = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioEngine.pause();
    } else {
      if (audioEngine.getIsPlaying()) {
        audioEngine.resume();
      } else {
        audioEngine.playTrack(currentTrack, currentTime);
      }
    }
  };

  const handleSelectTrack = (track: Track) => {
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(track.duration || 0);
    audioEngine.playTrack(track, 0);
  };

  const handleNextTrack = () => {
    if (tracks.length === 0) return;
    if (repeatMode === 'one' && currentTrack) {
      audioEngine.playTrack(currentTrack, 0);
      return;
    }

    let nextIndex = 0;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } else {
      const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id);
      nextIndex = (currentIndex + 1) % tracks.length;
    }

    const nextTrack = tracks[nextIndex];
    if (nextTrack) {
      handleSelectTrack(nextTrack);
    }
  };

  const handlePrevTrack = () => {
    if (tracks.length === 0) return;
    if (currentTime > 3) {
      audioEngine.seek(0);
      return;
    }

    const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    const prevTrack = tracks[prevIndex];
    if (prevTrack) {
      handleSelectTrack(prevTrack);
    }
  };

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    audioEngine.seek(seconds);
  };

  const handleSkip = (seconds: number) => {
    const target = Math.max(0, Math.min(duration, currentTime + seconds));
    handleSeek(target);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    setIsMuted(false);
    audioEngine.setVolume(vol);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioEngine.setMuted(nextMuted);
  };

  const handleToggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const handleCycleRepeat = () => {
    const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
    const nextIdx = (modes.indexOf(repeatMode) + 1) % modes.length;
    setRepeatMode(modes[nextIdx]);
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    audioEngine.setPlaybackRate(rate);
  };

  // Equalizer handlers
  const handleBandChange = (index: number, gain: number) => {
    const newGains = [...eqGains];
    newGains[index] = gain;
    setEqGains(newGains);
    audioEngine.setEqBand(index, gain);
  };

  const handlePreampChange = (gain: number) => {
    setPreampGain(gain);
    audioEngine.setPreampGain(gain);
  };

  const handlePresetSelect = (preset: EqPreset) => {
    setEqGains([...preset.gains]);
    setPreampGain(preset.preamp);
    audioEngine.applyPreset(preset);
  };

  const handleResetEq = () => {
    const flatGains = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    setEqGains(flatGains);
    setPreampGain(0);
    flatGains.forEach((_, idx) => audioEngine.setEqBand(idx, 0));
    audioEngine.setPreampGain(0);
  };

  const handleAcousticEnvChange = (env: AcousticEnvironment) => {
    setAcousticEnv(env);
    audioEngine.updateAcousticEnvironment(env);
  };

  const handleStereoWidthChange = (width: number) => {
    setStereoWidth(width);
    audioEngine.setStereoWidth(width);
  };

  // Playlist handlers & Cover Art Extractor
  const handleImportFiles = async (files: FileList) => {
    const newTracks: Track[] = [];
    const imageFiles: File[] = [];

    // Separate image files from audio files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(ext)) {
        imageFiles.push(file);
      }
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(ext)) continue;

      const extension = ext.toUpperCase();
      let format: any = 'WAV';
      if (['FLAC'].includes(extension)) format = 'FLAC';
      else if (['DSF', 'DFF', 'DSD'].includes(extension)) format = 'DSD';
      else if (['ALAC', 'M4A'].includes(extension)) format = 'ALAC';
      else if (['MP3'].includes(extension)) format = 'MP3';
      else if (['AAC'].includes(extension)) format = 'AAC';
      else if (['OGG'].includes(extension)) format = 'OGG';
      else if (['OPUS'].includes(extension)) format = 'OPUS';

      const isHighRes = format === 'FLAC' || format === 'DSD' || format === 'WAV';
      const sampleRate = isHighRes ? 96000 : 44100;
      const bitDepth = isHighRes ? 24 : 16;
      const bitrate = isHighRes ? 4608 : 320;

      let title = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      let artist = 'Archivo Local Importado';
      let album = 'Almacenamiento Local';
      let coverUrl: string | undefined = undefined;

      // Extract embedded ID3/FLAC/MP4 cover art & metadata
      try {
        const meta = await extractAudioFileMetadata(file);
        if (meta.title) title = meta.title;
        if (meta.artist) artist = meta.artist;
        if (meta.album) album = meta.album;
        if (meta.coverUrl) coverUrl = meta.coverUrl;
      } catch (err) {
        console.warn('Metadata extraction error:', err);
      }

      // If companion image file exists and no embedded cover, use companion image
      if (!coverUrl && imageFiles.length > 0) {
        coverUrl = URL.createObjectURL(imageFiles[0]);
      }

      const trackItem: Track = {
        id: `local-${Date.now()}-${i}`,
        title,
        artist,
        album,
        duration: 0,
        format: format,
        sampleRate: sampleRate,
        bitDepth: bitDepth,
        bitrate: bitrate,
        channels: 2,
        coverUrl: coverUrl,
        fileObject: file,
        cloudSource: 'local',
        year: 2026,
        genre: 'Audio Hi-Res Descomprimido',
      };

      newTracks.push(trackItem);
    }

    if (newTracks.length > 0) {
      setTracks((prev) => [...newTracks, ...prev]);
      handleSelectTrack(newTracks[0]);
    }
  };

  const handleUpdateCoverArt = (trackId: string, newCoverUrl: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, coverUrl: newCoverUrl } : t))
    );
    if (currentTrack?.id === trackId) {
      setCurrentTrack((prev) => (prev ? { ...prev, coverUrl: newCoverUrl } : null));
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    if (currentTrack?.id === trackId) {
      const remaining = tracks.filter((t) => t.id !== trackId);
      if (remaining.length > 0) {
        handleSelectTrack(remaining[0]);
      } else {
        audioEngine.stopCurrentPlayback();
        setCurrentTrack(null);
      }
    }
  };

  const handleToggleFavorite = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isFavorite: !t.isFavorite } : t))
    );
    if (currentTrack?.id === trackId) {
      setCurrentTrack((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  };

  const handleAddCloudTrack = (newTrack: Track) => {
    setTracks((prev) => [newTrack, ...prev]);
  };

  const handleAddScannedTracks = (scannedTracks: Track[]) => {
    setTracks((prev) => [...scannedTracks, ...prev]);
  };

  const handleInspectMetadata = (track: Track) => {
    setInspectedTrack(track);
    setIsMetadataModalOpen(true);
  };

  const handleOpenCoverModal = (track?: Track) => {
    setTrackForCoverModal(track || currentTrack);
    setIsCoverModalOpen(true);
  };

  const handleDeviceSelected = (type: 'input' | 'output', device: AudioDevice) => {
    if (type === 'output') {
      setDetectedOutputLabel(device.label);
    } else {
      setDetectedInputLabel(device.label);
    }
  };

  return (
    <div
      className="min-h-screen text-neutral-100 flex flex-col justify-between transition-colors"
      style={{ backgroundColor: 'var(--color-bg-base)' }}
    >
      {/* Top Navigation Bar */}
      <header
        className="border-b backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between transition-colors"
        style={{
          backgroundColor: 'var(--color-bg-header)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-950 shadow-lg transition-transform hover:scale-105"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-accent-text-contrast)',
              boxShadow: `0 4px 14px ${themeConfig.cssVariables['--color-accent-dim']}`,
            }}
          >
            <Headphones className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Aura<span style={{ color: 'var(--color-accent)' }}>HiFi</span>
              </h1>
              <span
                className="text-[10px] font-mono px-1.5 py-0.2 rounded border hidden xs:inline"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-accent)',
                }}
              >
                Hi-Res 192k DAC
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              Decodificador Multiformato · Detección E/S · Carátulas de Álbum
            </p>
          </div>
        </div>

        {/* View Segmented Tabs */}
        <div
          className="flex items-center gap-1 p-1 border rounded-xl"
          style={{
            backgroundColor: 'var(--color-bg-base)',
            borderColor: 'var(--color-border)',
          }}
        >
          <button
            onClick={() => setActiveTab('studio')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
            style={
              activeTab === 'studio'
                ? {
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-accent-text-contrast)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }
                : {
                    color: '#a1a1aa',
                  }
            }
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Estudio</span>
          </button>

          <button
            onClick={() => setActiveTab('equalizer')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
            style={
              activeTab === 'equalizer'
                ? {
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-accent-text-contrast)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }
                : {
                    color: '#a1a1aa',
                  }
            }
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Ecualizador</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
            style={
              activeTab === 'library'
                ? {
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-accent-text-contrast)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }
                : {
                    color: '#a1a1aa',
                  }
            }
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Biblioteca ({tracks.length})</span>
          </button>
        </div>

        {/* Header Right Actions: Audio Device I/O Pill, Theme Selector, Folder, Cloud, Mobile */}
        <div className="flex items-center gap-2">
          {/* Audio Input & Output Detection Interactive Badge */}
          <button
            onClick={() => setIsAudioDeviceModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium rounded-xl border transition-all hover:scale-[1.02] shadow-sm"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-accent-light)',
            }}
            title="Detección de dispositivos de entrada y salida de audio"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Headphones className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
            <span className="hidden lg:inline truncate max-w-[110px]">
              {detectedOutputLabel}
            </span>
            <span className="hidden lg:inline text-neutral-500">|</span>
            <Mic className="w-3.5 h-3.5 text-emerald-400 hidden sm:inline" />
            <span className="hidden xl:inline truncate max-w-[90px] text-emerald-400">
              {detectedInputLabel}
            </span>
            <span className="lg:hidden text-[11px] font-bold">E/S Audio</span>
          </button>

          {/* Audiophile Theme Selector */}
          <ThemeSelector />

          {/* Folder Permission Scanner Button */}
          <button
            onClick={() => setIsFolderModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-accent-light)',
            }}
            title="Conceder permiso a carpeta de archivos para buscar música y carátulas"
          >
            <FolderOpen className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
            <span className="hidden md:inline">Carpeta</span>
          </button>

          {/* Cloud Streaming Button */}
          <button
            onClick={() => setIsCloudModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-accent-light)',
            }}
            title="Conectar servicio de streaming en la nube"
          >
            <Cloud className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
            <span className="hidden md:inline">Nube</span>
          </button>

          {/* Mobile APK & iOS Install Button */}
          <button
            onClick={() => setIsMobileModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all shadow-sm"
            style={{
              backgroundColor: 'var(--color-accent-dim)',
              borderColor: 'var(--color-accent-border)',
              color: 'var(--color-accent-light)',
            }}
            title="Instalar en Android APK o Apple iOS"
          >
            <Smartphone className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
            <span className="hidden sm:inline">APK/iOS</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top DAC Engine Status & Technical specs */}
        <DacMonitor
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onOpenAudioDeviceModal={() => setIsAudioDeviceModalOpen(true)}
          detectedOutputLabel={detectedOutputLabel}
          detectedInputLabel={detectedInputLabel}
        />

        {/* Studio View: Presentation Switcher & Split Grid */}
        {activeTab === 'studio' && (
          <div className="space-y-6">
            {/* Presentation Mode Selector Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-2 px-1">
              <span className="text-xs font-semibold text-neutral-300 flex items-center gap-2">
                <span>Modo de Presentación Visual:</span>
              </span>

              <div
                className="flex items-center gap-1 p-1 rounded-xl border text-xs"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <button
                  onClick={() => setStudioPresentation('deck')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all"
                  style={
                    studioPresentation === 'deck'
                      ? {
                          backgroundColor: 'var(--color-accent)',
                          color: 'var(--color-accent-text-contrast)',
                          fontWeight: 600,
                        }
                      : { color: '#a1a1aa' }
                  }
                  title="Presentación física interactiva de Cassette, Vinilo o CD"
                >
                  <Disc className="w-3.5 h-3.5" />
                  <span>Cubierta Mecánica</span>
                </button>

                <button
                  onClick={() => setStudioPresentation('visualizer')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all"
                  style={
                    studioPresentation === 'visualizer'
                      ? {
                          backgroundColor: 'var(--color-accent)',
                          color: 'var(--color-accent-text-contrast)',
                          fontWeight: 600,
                        }
                      : { color: '#a1a1aa' }
                  }
                  title="Analizador de espectro FFT RTA"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Espectro FFT</span>
                </button>

                <button
                  onClick={() => setStudioPresentation('dual')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all"
                  style={
                    studioPresentation === 'dual'
                      ? {
                          backgroundColor: 'var(--color-accent)',
                          color: 'var(--color-accent-text-contrast)',
                          fontWeight: 600,
                        }
                      : { color: '#a1a1aa' }
                  }
                  title="Vista dual: Cubierta física + Espectro en paralelo"
                >
                  <Columns2 className="w-3.5 h-3.5" />
                  <span>Vista Dual</span>
                </button>
              </div>
            </div>

            {/* Presentation Viewports */}
            {studioPresentation === 'deck' && (
              <PhysicalDeck
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                onTogglePlay={handlePlayPause}
                onSeek={handleSeek}
                onUpdateCoverArt={handleUpdateCoverArt}
              />
            )}

            {studioPresentation === 'visualizer' && (
              <Visualizer
                isPlaying={isPlaying}
                onToggleFullscreen={() => setIsFullscreenVis(!isFullscreenVis)}
                isFullscreen={isFullscreenVis}
              />
            )}

            {studioPresentation === 'dual' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                <PhysicalDeck
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  onTogglePlay={handlePlayPause}
                  onSeek={handleSeek}
                  onUpdateCoverArt={handleUpdateCoverArt}
                />
                <div className="flex flex-col">
                  <Visualizer
                    isPlaying={isPlaying}
                    onToggleFullscreen={() => setIsFullscreenVis(!isFullscreenVis)}
                    isFullscreen={isFullscreenVis}
                  />
                </div>
              </div>
            )}

            {/* Split Grid: Equalizer Overview + Quick Playlist */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <EqualizerPanel
                  eqGains={eqGains}
                  preampGain={preampGain}
                  onBandChange={handleBandChange}
                  onPreampChange={handlePreampChange}
                  onPresetSelect={handlePresetSelect}
                  onReset={handleResetEq}
                  acousticEnv={acousticEnv}
                  onAcousticEnvChange={handleAcousticEnvChange}
                  stereoWidth={stereoWidth}
                  onStereoWidthChange={handleStereoWidthChange}
                />
              </div>

              <div className="lg:col-span-5">
                <Playlist
                  tracks={tracks}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onSelectTrack={handleSelectTrack}
                  onImportFiles={handleImportFiles}
                  onRemoveTrack={handleRemoveTrack}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenCloudModal={() => setIsCloudModalOpen(true)}
                  onInspectMetadata={handleInspectMetadata}
                  onOpenFolderModal={() => setIsFolderModalOpen(true)}
                  onOpenCoverModal={handleOpenCoverModal}
                />
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Equalizer View */}
        {activeTab === 'equalizer' && (
          <div className="space-y-6">
            <EqualizerPanel
              eqGains={eqGains}
              preampGain={preampGain}
              onBandChange={handleBandChange}
              onPreampChange={handlePreampChange}
              onPresetSelect={handlePresetSelect}
              onReset={handleResetEq}
              acousticEnv={acousticEnv}
              onAcousticEnvChange={handleAcousticEnvChange}
              stereoWidth={stereoWidth}
              onStereoWidthChange={handleStereoWidthChange}
            />

            <PhysicalDeck
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onTogglePlay={handlePlayPause}
              onSeek={handleSeek}
              onUpdateCoverArt={handleUpdateCoverArt}
            />
          </div>
        )}

        {/* Dedicated Library View */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            <PhysicalDeck
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onTogglePlay={handlePlayPause}
              onSeek={handleSeek}
              onUpdateCoverArt={handleUpdateCoverArt}
            />

            <Playlist
              tracks={tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onSelectTrack={handleSelectTrack}
              onImportFiles={handleImportFiles}
              onRemoveTrack={handleRemoveTrack}
              onToggleFavorite={handleToggleFavorite}
              onOpenCloudModal={() => setIsCloudModalOpen(true)}
              onInspectMetadata={handleInspectMetadata}
              onOpenFolderModal={() => setIsFolderModalOpen(true)}
              onOpenCoverModal={handleOpenCoverModal}
            />
          </div>
        )}
      </main>

      {/* Sticky Bottom Audiophile Player Controls */}
      <PlayerControls
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        playbackRate={playbackRate}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onPrev={handlePrevTrack}
        onNext={handleNextTrack}
        onSkipBack={handleSkip}
        onSkipForward={handleSkip}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onToggleShuffle={handleToggleShuffle}
        onCycleRepeat={handleCycleRepeat}
        onPlaybackRateChange={handlePlaybackRateChange}
        onToggleFavorite={handleToggleFavorite}
        onOpenCoverModal={() => handleOpenCoverModal()}
      />

      {/* Cloud Streaming & Drive Connect Modal */}
      <CloudStreamModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        onAddTrack={handleAddCloudTrack}
        onPlayNow={handleSelectTrack}
      />

      {/* Technical Audio Metadata Modal */}
      <MetadataModal
        track={inspectedTrack}
        isOpen={isMetadataModalOpen}
        onClose={() => setIsMetadataModalOpen(false)}
      />

      {/* Native Mobile APK & iOS Modal */}
      <MobileExportModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
      />

      {/* Local Folder Permission Scanner Modal */}
      <FolderScanModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onAddTracks={handleAddScannedTracks}
        onPlayTrack={handleSelectTrack}
      />

      {/* Audio Input & Output Device Manager Modal */}
      <AudioDeviceModal
        isOpen={isAudioDeviceModalOpen}
        onClose={() => setIsAudioDeviceModalOpen(false)}
        onDeviceSelected={handleDeviceSelected}
      />

      {/* Cover Art High-Res Inspector & Custom Uploader Modal */}
      <CoverArtModal
        track={trackForCoverModal}
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        onUpdateCoverArt={handleUpdateCoverArt}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuraHiFiApp />
    </ThemeProvider>
  );
}
