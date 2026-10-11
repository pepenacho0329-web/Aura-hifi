import React, { useRef, useState } from 'react';
import { Track } from '../types/audio';
import { useTheme } from '../context/ThemeContext';
import {
  Play,
  Pause,
  Upload,
  Search,
  Cloud,
  Heart,
  Info,
  Trash2,
  FileAudio,
  FolderOpen,
  Image as ImageIcon,
} from 'lucide-react';

interface PlaylistProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onSelectTrack: (track: Track) => void;
  onImportFiles: (files: FileList) => void;
  onRemoveTrack: (trackId: string) => void;
  onToggleFavorite: (trackId: string) => void;
  onOpenCloudModal: () => void;
  onInspectMetadata: (track: Track) => void;
  onOpenFolderModal: () => void;
  onOpenCoverModal?: (track: Track) => void;
}

export const Playlist: React.FC<PlaylistProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onSelectTrack,
  onImportFiles,
  onRemoveTrack,
  onToggleFavorite,
  onOpenCloudModal,
  onInspectMetadata,
  onOpenFolderModal,
  onOpenCoverModal,
}) => {
  const { themeConfig } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'hires' | 'streams' | 'favorites' | 'local'>('all');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onImportFiles(e.dataTransfer.files);
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs || !isFinite(secs)) return 'En Vivo';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const filteredTracks = tracks.filter((track) => {
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.album.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.format.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'hires') {
      return (
        track.format === 'FLAC' ||
        track.format === 'DSD' ||
        track.format === 'WAV' ||
        (track.sampleRate && track.sampleRate >= 88200)
      );
    }
    if (filterTab === 'streams') {
      return track.isStream || track.cloudSource === 'radio' || track.cloudSource === 'custom_url';
    }
    if (filterTab === 'favorites') {
      return !!track.isFavorite;
    }
    if (filterTab === 'local') {
      return track.cloudSource === 'local';
    }

    return true;
  });

  return (
    <div
      className="rounded-2xl border p-5 shadow-2xl backdrop-blur-md flex flex-col gap-4 transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Top Header & Actions */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b"
        style={{ borderColor: 'var(--color-border-subtle)' }}
      >
        <div>
          <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
            Biblioteca de Audio Multiformato
            <span className="text-xs font-mono text-neutral-400 font-normal">
              ({tracks.length} {tracks.length === 1 ? 'pista' : 'pistas'})
            </span>
          </h3>
          <p className="text-xs text-neutral-400">
            Decodificación de FLAC, WAV, DSD, ALAC, MP3, AAC y transmisiones en la nube
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Folder Permission / Scanner Trigger */}
          <button
            onClick={onOpenFolderModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border shadow-sm"
            style={{
              backgroundColor: 'var(--color-bg-base)',
              borderColor: 'var(--color-accent-border)',
              color: 'var(--color-accent)',
            }}
            title="Conceder permiso a carpeta de archivos del sistema para buscar audio"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Escanear Carpeta</span>
          </button>

          {/* Cloud Streaming Trigger */}
          <button
            onClick={onOpenCloudModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border"
            style={{
              backgroundColor: 'var(--color-bg-base)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-accent)',
            }}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Streaming & Nube</span>
          </button>

          {/* Local File Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-sm"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-accent-text-contrast)',
              boxShadow: `0 2px 10px ${themeConfig.cssVariables['--color-accent-dim']}`,
            }}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar Archivos</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.flac,.wav,.dsf,.dff,.alac,.m4a,.mp3,.aac,.ogg,.opus,.aiff"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer group"
        onClick={onOpenFolderModal}
        style={{
          borderColor: isDragOver ? 'var(--color-accent)' : 'var(--color-border-subtle)',
          backgroundColor: isDragOver ? 'var(--color-accent-dim)' : 'var(--color-bg-base)',
        }}
      >
        <p className="text-xs text-neutral-300 flex items-center justify-center gap-2 flex-wrap">
          <FileAudio className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
          <span>Arrastra y suelta tus archivos aquí, o haz clic para</span>
          <span
            className="font-bold underline cursor-pointer"
            style={{ color: 'var(--color-accent)' }}
          >
            Conceder permiso a una Carpeta de Música
          </span>
        </p>
        <p className="text-[10px] text-neutral-500 mt-0.5">
          Escaneo recursivo local de subdirectorios (FLAC, WAV, DSD, ALAC, MP3) sin subir datos a servidores
        </p>
      </div>

      {/* Search & Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por título, artista, formato..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border text-neutral-100 placeholder:text-neutral-600 text-xs focus:outline-none transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-base)',
              borderColor: 'var(--color-border-subtle)',
            }}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'hires', label: 'Hi-Res Master' },
            { id: 'streams', label: 'Streaming' },
            { id: 'favorites', label: 'Favoritas' },
            { id: 'local', label: 'Locales' },
          ].map((tab) => {
            const isActive = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors border"
                style={
                  isActive
                    ? {
                        backgroundColor: 'var(--color-accent-dim)',
                        borderColor: 'var(--color-accent-border)',
                        color: 'var(--color-accent-light)',
                      }
                    : {
                        backgroundColor: 'transparent',
                        borderColor: 'transparent',
                        color: '#a1a1aa',
                      }
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tracks List */}
      <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
        {filteredTracks.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-xs">
            No se encontraron pistas que coincidan con los criterios de búsqueda.
          </div>
        ) : (
          filteredTracks.map((track) => {
            const isSelected = currentTrack?.id === track.id;
            const isCurrentlyPlaying = isSelected && isPlaying;

            return (
              <div
                key={track.id}
                className="group flex items-center justify-between p-2.5 rounded-xl transition-all border"
                style={
                  isSelected
                    ? {
                        backgroundColor: 'var(--color-accent-dim)',
                        borderColor: 'var(--color-accent-border)',
                      }
                    : {
                        backgroundColor: 'var(--color-bg-base)',
                        borderColor: 'var(--color-border-subtle)',
                      }
                }
              >
                {/* Album Cover Thumbnail & Play Action */}
                <div
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  onClick={() => onSelectTrack(track)}
                >
                  <div
                    className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border shadow-md group/cover"
                    style={{
                      borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border-subtle)',
                      backgroundColor: 'var(--color-bg-base)',
                    }}
                  >
                    <img
                      src={track.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Play/Pause Overlay */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all ${
                        isCurrentlyPlaying ? 'bg-black/50' : 'bg-black/30 opacity-0 group-hover/cover:opacity-100'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shadow"
                        style={{
                          backgroundColor: 'var(--color-accent)',
                          color: 'var(--color-accent-text-contrast)',
                        }}
                      >
                        {isCurrentlyPlaying ? (
                          <Pause className="w-3 h-3 fill-current" />
                        ) : (
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-100 truncate">
                        {track.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 truncate">
                      <span className="truncate">{track.artist}</span>
                      <span className="text-neutral-600">·</span>
                      <span className="truncate text-neutral-500">{track.album}</span>
                    </div>
                  </div>
                </div>

                {/* Technical Badges and Actions */}
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  {/* Format & Hi-Res Specs */}
                  <div className="text-right hidden sm:block">
                    <span
                      className="text-[10px] font-mono font-bold block"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      {track.format}{' '}
                      {track.sampleRate ? `${(track.sampleRate / 1000).toFixed(1)}k` : ''}
                    </span>
                    <span className="text-[9px] font-mono text-neutral-500 block">
                      {track.bitDepth ? `${track.bitDepth}-Bit` : ''} · {track.bitrate ? `${track.bitrate}k` : ''}
                    </span>
                  </div>

                  {/* Duration */}
                  <span className="text-xs font-mono-numbers text-neutral-400 w-11 text-right">
                    {formatDuration(track.duration)}
                  </span>

                  {/* Cover Art Viewer / Changer */}
                  <button
                    onClick={() =>
                      onOpenCoverModal ? onOpenCoverModal(track) : onInspectMetadata(track)
                    }
                    className="p-1.5 text-neutral-500 hover:text-neutral-200 transition-colors"
                    title="Ver o cambiar carátula del álbum en alta resolución"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>

                  {/* Metadata inspector */}
                  <button
                    onClick={() => onInspectMetadata(track)}
                    className="p-1.5 text-neutral-500 hover:text-neutral-200 transition-colors"
                    title="Ver ficha técnica de audio"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>

                  {/* Favorite Toggle */}
                  <button
                    onClick={() => onToggleFavorite(track.id)}
                    className="p-1.5 transition-colors"
                    style={{
                      color: track.isFavorite ? 'var(--color-accent)' : '#71717a',
                    }}
                    title="Favorita"
                  >
                    <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? 'fill-current' : ''}`} />
                  </button>

                  {/* Remove Track */}
                  {tracks.length > 1 && (
                    <button
                      onClick={() => onRemoveTrack(track.id)}
                      className="p-1.5 text-neutral-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                      title="Quitar de la lista"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
