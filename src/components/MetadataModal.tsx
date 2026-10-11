import React from 'react';
import { Track } from '../types/audio';
import { FileText, Cpu, CheckCircle2, ShieldCheck, Disc3, Layers, Music } from 'lucide-react';

interface MetadataModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MetadataModal: React.FC<MetadataModalProps> = ({ track, isOpen, onClose }) => {
  if (!isOpen || !track) return null;

  const nyquistFreq = track.sampleRate ? track.sampleRate / 2 : 24000;
  const isHiRes = (track.sampleRate && track.sampleRate >= 88200) ||
                  (track.bitDepth && track.bitDepth >= 24) ||
                  track.format === 'FLAC' ||
                  track.format === 'DSD';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                Ficha Técnica del Flujo de Audio
                {isHiRes && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                    HI-RES DECODER
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-neutral-400">
                Parámetros acústicos y especificaciones de decodificación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-100 p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* Track Summary */}
          <div className="flex items-center gap-3 p-3 bg-neutral-950/70 rounded-xl border border-neutral-800/80">
            <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
              <Music className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-neutral-100 text-sm truncate">{track.title}</h4>
              <p className="text-neutral-400 truncate">{track.artist} — {track.album}</p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500 font-mono">
                <span>{track.genre || 'Audiophile'}</span>
                <span>·</span>
                <span>{track.year || 2026}</span>
              </div>
            </div>
          </div>

          {/* Technical Specs Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 bg-neutral-950/50 rounded-xl border border-neutral-800/60">
              <span className="text-[10px] text-neutral-500 font-mono uppercase block">Formato / Códec</span>
              <span className="text-neutral-200 font-mono font-semibold text-sm mt-0.5 block">
                {track.format}
              </span>
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                {track.isStream ? 'Flujo de red continuo' : 'Contenedor sin compresión con pérdida'}
              </span>
            </div>

            <div className="p-2.5 bg-neutral-950/50 rounded-xl border border-neutral-800/60">
              <span className="text-[10px] text-neutral-500 font-mono uppercase block">Frecuencia de Muestreo</span>
              <span className="text-amber-400 font-mono font-semibold text-sm mt-0.5 block">
                {track.sampleRate ? `${(track.sampleRate / 1000).toFixed(1)} kHz` : '48.0 kHz'}
              </span>
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                Límite Nyquist: {(nyquistFreq / 1000).toFixed(1)} kHz
              </span>
            </div>

            <div className="p-2.5 bg-neutral-950/50 rounded-xl border border-neutral-800/60">
              <span className="text-[10px] text-neutral-500 font-mono uppercase block">Profundidad de Bits</span>
              <span className="text-emerald-400 font-mono font-semibold text-sm mt-0.5 block">
                {track.bitDepth ? `${track.bitDepth}-Bit` : '24-Bit Float'}
              </span>
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                {track.bitDepth && track.bitDepth >= 24 ? 'Calidad Máster de Estudio' : 'Calidad CD estándar'}
              </span>
            </div>

            <div className="p-2.5 bg-neutral-950/50 rounded-xl border border-neutral-800/60">
              <span className="text-[10px] text-neutral-500 font-mono uppercase block">Tasa de Bits (Bitrate)</span>
              <span className="text-sky-400 font-mono font-semibold text-sm mt-0.5 block">
                {track.bitrate ? `${track.bitrate} kbps` : 'Variable'}
              </span>
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                Canales: {track.channels || 2} (Estéreo L/R)
              </span>
            </div>
          </div>

          {/* Engine Architecture Details */}
          <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/70 space-y-1.5">
            <span className="text-[10px] font-mono font-semibold text-neutral-400 uppercase block">
              Cadena de Procesamiento DSP de AuraHiFi:
            </span>
            <ul className="text-[11px] text-neutral-400 space-y-1 list-disc list-inside">
              <li>Decodificación nativa PCM de coma flotante de 32/64 bits.</li>
              <li>Filtros IIR Biquad de fase mínima de 10 bandas con Q simétrico.</li>
              <li>Simulación de convolución de impulsos acústicos por hardware.</li>
              <li>Sincronización con el reloj maestro de salida del hardware de audio.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
