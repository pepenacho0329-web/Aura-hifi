import React, { useRef } from 'react';
import { Track } from '../types/audio';
import { useTheme } from '../context/ThemeContext';
import {
  Image as ImageIcon,
  Upload,
  Download,
  X,
  Disc,
  CheckCircle2,
  Sparkles,
  FileAudio,
} from 'lucide-react';

interface CoverArtModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCoverArt: (trackId: string, newCoverUrl: string) => void;
}

export const CoverArtModal: React.FC<CoverArtModalProps> = ({
  track,
  isOpen,
  onClose,
  onUpdateCoverArt,
}) => {
  const { themeConfig } = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen || !track) return null;

  const coverUrl =
    track.coverUrl ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=85';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newUrl = URL.createObjectURL(file);
      onUpdateCoverArt(track.id, newUrl);
    }
  };

  const handleDownloadCover = () => {
    const a = document.createElement('a');
    a.href = coverUrl;
    a.download = `${track.artist} - ${track.title} Cover.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="rounded-2xl border w-full max-w-xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{
            backgroundColor: 'var(--color-bg-header)',
            borderColor: 'var(--color-border-subtle)',
          }}
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
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                Carátula del Álbum en Alta Resolución
              </h2>
              <p className="text-xs text-neutral-400">
                Visualización y personalización de portada para audio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-100 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex flex-col items-center">
          {/* Main Large Artwork Preview */}
          <div
            className="relative w-64 sm:w-80 h-64 sm:h-80 rounded-2xl overflow-hidden border-2 shadow-2xl group flex items-center justify-center"
            style={{
              borderColor: 'var(--color-accent)',
              backgroundColor: 'var(--color-bg-base)',
            }}
          >
            <img
              src={coverUrl}
              alt={track.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
            />
            {/* Subtle gloss shine overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />
          </div>

          {/* Track Info & Technical Badge */}
          <div className="text-center space-y-1 w-full max-w-md">
            <h3 className="text-base font-bold text-neutral-100 truncate">{track.title}</h3>
            <p className="text-xs text-neutral-400 truncate">
              {track.artist} · <span className="text-neutral-500">{track.album}</span>
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded border"
                style={{
                  backgroundColor: 'var(--color-accent-dim)',
                  borderColor: 'var(--color-accent-border)',
                  color: 'var(--color-accent)',
                }}
              >
                {track.format} · {track.sampleRate ? `${track.sampleRate / 1000} kHz` : 'Hi-Res'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-700 bg-neutral-900 text-neutral-300">
                Arte Original de Estudio
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full justify-center">
            {/* Upload/Replace Cover Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all border"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-accent-text-contrast)',
                borderColor: 'var(--color-accent)',
              }}
            >
              <Upload className="w-4 h-4" />
              <span>Cambiar Carátula</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Download Cover Button */}
            <button
              onClick={handleDownloadCover}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-colors"
              style={{
                backgroundColor: 'var(--color-bg-base)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-accent-light)',
              }}
            >
              <Download className="w-4 h-4" />
              <span>Descargar Imagen</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className="p-4 border-t flex items-center justify-between"
          style={{
            backgroundColor: 'var(--color-bg-header)',
            borderColor: 'var(--color-border-subtle)',
          }}
        >
          <span className="text-[10px] font-mono text-neutral-500">
            Compatible con decodificación JPEG, PNG, WebP y etiquetas ID3v2 APIC / FLAC Block 6
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold border"
            style={{
              backgroundColor: 'var(--color-bg-base)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-accent-light)',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
