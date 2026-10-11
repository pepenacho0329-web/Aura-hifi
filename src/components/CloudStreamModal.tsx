import React, { useState } from 'react';
import { Track } from '../types/audio';
import { CLOUD_PROVIDERS } from '../data/audioData';
import { Cloud, Radio, Link as LinkIcon, HardDrive, Plus, Check, Play, Globe } from 'lucide-react';

interface CloudStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrack: (track: Track) => void;
  onPlayNow: (track: Track) => void;
}

export const CloudStreamModal: React.FC<CloudStreamModalProps> = ({
  isOpen,
  onClose,
  onAddTrack,
  onPlayNow,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'cloud_drives' | 'radio'>('url');
  
  // Custom URL inputs
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [customFormat, setCustomFormat] = useState<'STREAM' | 'FLAC' | 'WAV' | 'MP3'>('STREAM');
  const [customSampleRate, setCustomSampleRate] = useState<number>(48000);
  
  // Cloud drive simulated connection states
  const [connectedDrives, setConnectedDrives] = useState<Record<string, boolean>>({
    gdrive: true,
    dropbox: true,
    onedrive: false,
    webdav: false,
  });

  if (!isOpen) return null;

  const handleAddCustomStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    const newTrack: Track = {
      id: `custom-stream-${Date.now()}`,
      title: customTitle.trim() || 'Flujo de Audio en la Nube',
      artist: customArtist.trim() || 'Servidor de Streaming Remoto',
      album: 'Transmisión Personal en Nube',
      duration: 0,
      format: customFormat,
      sampleRate: customSampleRate,
      bitDepth: customSampleRate >= 96000 ? 24 : 16,
      bitrate: customFormat === 'FLAC' ? 1411 : 320,
      channels: 2,
      url: customUrl.trim(),
      isStream: true,
      streamType: 'direct',
      cloudSource: 'custom_url',
      genre: 'Cloud Stream',
      year: 2026,
    };

    onAddTrack(newTrack);
    onPlayNow(newTrack);
    onClose();
  };

  const handleImportCloudFile = (providerId: string, file: { name: string; format: string; sampleRate: string }) => {
    const isFlac = file.format === 'FLAC';
    const isDsd = file.format === 'DSD';
    const sampleRate = isDsd ? 192000 : isFlac ? 96000 : 88200;

    // Use our synthesized key for instantaneous high-res playback demo simulation of the cloud file
    const synthesizedKey = isDsd ? 'cyber_resonance' : isFlac ? 'aura_nocturne' : 'velvet_jazz';

    const cloudTrack: Track = {
      id: `cloud-${providerId}-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      artist: `Biblioteca en la Nube (${providerId.toUpperCase()})`,
      album: 'Almacenamiento Conectado Hi-Res',
      duration: 32,
      format: file.format as any,
      sampleRate: sampleRate,
      bitDepth: isDsd ? 32 : 24,
      bitrate: isDsd ? 9216 : 4608,
      channels: 2,
      synthesizedKey: synthesizedKey,
      cloudSource: providerId as any,
      genre: 'Nube Lossless',
      year: 2026,
    };

    onAddTrack(cloudTrack);
    onPlayNow(cloudTrack);
    onClose();
  };

  const toggleDriveConnection = (id: string) => {
    setConnectedDrives((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100">
                Servicios de Streaming y Almacenamiento en la Nube
              </h2>
              <p className="text-xs text-neutral-400">
                Transmite desde URLs remotas, Icecast o monta tus bibliotecas Hi-Res de Google Drive y Dropbox
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-100 text-sm p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 px-6 bg-neutral-950/40">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'url'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Transmisión por URL Directa / Icecast</span>
          </button>

          <button
            onClick={() => setActiveTab('cloud_drives')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'cloud_drives'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Almacenamiento en la Nube (Drive / Dropbox)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'url' && (
            <form onSubmit={handleAddCustomStream} className="flex flex-col gap-4">
              <div className="p-3.5 bg-neutral-950/60 rounded-xl border border-neutral-800/80 text-xs text-neutral-300">
                <span className="font-semibold text-amber-400 block mb-1">
                  Soporte de Audio en Tiempo Real:
                </span>
                Introduce cualquier flujo de streaming en la nube (HTTP/HTTPS, Shoutcast, Icecast, AAC 320k, FLAC streaming o enlaces directos a archivos de audio).
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-300 block mb-1.5">
                  URL del Stream / Archivo en Nube *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://stream.server.org/live-audio o https://mi-nube.com/cancion.flac"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-100 placeholder:text-neutral-600 text-xs focus:outline-none focus:border-amber-500 transition-colors font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-300 block mb-1.5">
                    Título de la Transmisión o Canción
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Hi-Res Radio Estación Jazz"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-100 placeholder:text-neutral-600 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-300 block mb-1.5">
                    Artista / Emisora
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Estudio en Vivo"
                    value={customArtist}
                    onChange={(e) => setCustomArtist(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-100 placeholder:text-neutral-600 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-300 block mb-1.5">
                    Formato de Decodificación
                  </label>
                  <select
                    value={customFormat}
                    onChange={(e) => setCustomFormat(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="STREAM">Transmisión Continua (Icecast / WebStream)</option>
                    <option value="FLAC">FLAC Lossless (Flujo sin pérdida)</option>
                    <option value="WAV">WAV PCM Master</option>
                    <option value="MP3">MP3 320 kbps</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-300 block mb-1.5">
                    Tasa de Muestreo Esperada (DAC)
                  </label>
                  <select
                    value={customSampleRate}
                    onChange={(e) => setCustomSampleRate(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-500 font-mono"
                  >
                    <option value={44100}>44.1 kHz (CD Standard)</option>
                    <option value={48000}>48.0 kHz (Estándar Studio)</option>
                    <option value={88200}>88.2 kHz (Audiophile High-Res)</option>
                    <option value={96000}>96.0 kHz (Hi-Res Studio Master)</option>
                    <option value={192000}>192.0 kHz (Ultra Hi-Res Master)</option>
                  </select>
                </div>
              </div>

              {/* Sample quick streams */}
              <div className="pt-2">
                <span className="text-[11px] text-neutral-500 font-medium block mb-2">
                  Ejemplos rápidos para probar al instante:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'SomaFM Groove (320k)', url: 'https://ice1.somafm.com/groovesalad-256-mp3', title: 'Groove Salad Live', artist: 'SomaFM Network' },
                    { label: 'DefCon Radio (256k)', url: 'https://ice1.somafm.com/defcon-256-mp3', title: 'DEF CON Radio Stream', artist: 'DEF CON Underground' },
                    { label: 'Swiss Classic HQ', url: 'https://stream.srg-ssr.ch/m/rsc_de/mp3_128', title: 'Radio Swiss Classic', artist: 'SRG SSR Clásica' },
                  ].map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setCustomUrl(ex.url);
                        setCustomTitle(ex.title);
                        setCustomArtist(ex.artist);
                        setCustomFormat('STREAM');
                      }}
                      className="px-2.5 py-1 text-[11px] bg-neutral-950 hover:bg-neutral-800 text-neutral-300 rounded-lg border border-neutral-800 transition-colors"
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800 mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl transition-colors shadow-lg shadow-amber-500/20"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Conectar y Reproducir en Vivo</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'cloud_drives' && (
            <div className="flex flex-col gap-5">
              <p className="text-xs text-neutral-400">
                Conecta almacenes de archivos de audio de alta resolución. Puedes sincronizar carpetas y reproducir pistas con decodificación directa en tu navegador sin compresión.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CLOUD_PROVIDERS.map((provider) => {
                  const isConnected = connectedDrives[provider.id];
                  return (
                    <div
                      key={provider.id}
                      className="bg-neutral-950/70 rounded-xl border border-neutral-800 p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-neutral-100 flex items-center gap-2">
                            {provider.name}
                          </h4>
                          <button
                            onClick={() => toggleDriveConnection(provider.id)}
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-colors ${
                              isConnected
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                            }`}
                          >
                            {isConnected ? 'Sincronizado' : 'Conectar'}
                          </button>
                        </div>
                        <p className="text-[11px] text-neutral-400 mb-3">{provider.description}</p>

                        {/* File list preview */}
                        {isConnected && (
                          <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
                            <span className="text-[10px] uppercase font-mono text-neutral-500 block">
                              Archivos Hi-Res detectados:
                            </span>
                            {provider.sampleFiles.map((file, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-1.5 bg-neutral-900 rounded-lg hover:bg-neutral-800/80 transition-colors group cursor-pointer"
                                onClick={() => handleImportCloudFile(provider.id, file)}
                              >
                                <div className="truncate mr-2">
                                  <span className="text-xs text-neutral-200 block truncate group-hover:text-amber-400 transition-colors">
                                    {file.name}
                                  </span>
                                  <span className="text-[10px] text-neutral-500 font-mono">
                                    {file.sampleRate} · {file.size}
                                  </span>
                                </div>
                                <button
                                  className="p-1 text-neutral-400 group-hover:text-amber-400"
                                  title="Reproducir pista desde la nube"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
