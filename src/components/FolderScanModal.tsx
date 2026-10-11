import React, { useState, useRef } from 'react';
import { Track } from '../types/audio';
import { useTheme } from '../context/ThemeContext';
import {
  extractAudioFileMetadata,
  pairCompanionImagesWithTracks,
} from '../utils/audioMetadata';
import {
  FolderOpen,
  FolderSearch,
  CheckCircle2,
  ShieldCheck,
  FileAudio,
  HardDrive,
  RefreshCw,
  Plus,
  Play,
  Layers,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

interface FolderScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTracks: (tracks: Track[]) => void;
  onPlayTrack: (track: Track) => void;
}

interface ScannedAudioItem {
  file: File;
  relativePath: string;
  format: string;
  sizeMb: number;
  coverPreviewUrl?: string;
  parsedTitle?: string;
  parsedArtist?: string;
}

const AUDIO_EXTENSIONS = [
  '.flac',
  '.wav',
  '.dsf',
  '.dff',
  '.alac',
  '.m4a',
  '.mp3',
  '.aac',
  '.ogg',
  '.opus',
  '.aiff',
  '.webm',
];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.bmp'];

export const FolderScanModal: React.FC<FolderScanModalProps> = ({
  isOpen,
  onClose,
  onAddTracks,
  onPlayTrack,
}) => {
  const { themeConfig } = useTheme();
  const [folderName, setFolderName] = useState<string>(
    () => localStorage.getItem('aurahifi_last_folder') || ''
  );
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [scannedFiles, setScannedFiles] = useState<ScannedAudioItem[]>([]);
  const [scannedImages, setScannedImages] = useState<
    { file: File; relativePath: string }[]
  >([]);
  const [scanStatusText, setScanStatusText] = useState<string>('');

  const directoryInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const isAudioFile = (filename: string): boolean => {
    const lower = filename.toLowerCase();
    return AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext));
  };

  const isImageFile = (filename: string): boolean => {
    const lower = filename.toLowerCase();
    return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
  };

  const getFormatFromFilename = (filename: string): any => {
    const ext = filename.split('.').pop()?.toUpperCase() || 'WAV';
    if (['FLAC'].includes(ext)) return 'FLAC';
    if (['DSF', 'DFF', 'DSD'].includes(ext)) return 'DSD';
    if (['ALAC', 'M4A'].includes(ext)) return 'ALAC';
    if (['MP3'].includes(ext)) return 'MP3';
    if (['AAC'].includes(ext)) return 'AAC';
    if (['OGG'].includes(ext)) return 'OGG';
    if (['OPUS'].includes(ext)) return 'OPUS';
    return 'WAV';
  };

  // Modern File System Access API recursive scanner
  const handleRequestDirectoryPicker = async () => {
    setIsScanning(true);
    setScanStatusText('Solicitando permiso al sistema operativo...');

    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker({
          id: 'aurahifi-music-folder',
          mode: 'read',
          startIn: 'music',
        });

        if (dirHandle.requestPermission) {
          const perm = await dirHandle.requestPermission({ mode: 'read' });
          if (perm !== 'granted') {
            setIsScanning(false);
            setScanStatusText('Permiso denegado por el usuario.');
            return;
          }
        }

        setPermissionGranted(true);
        setFolderName(dirHandle.name);
        localStorage.setItem('aurahifi_last_folder', dirHandle.name);
        setScanStatusText(
          `Escaneando carpeta "${dirHandle.name}", subcarpetas y extrayendo carátulas...`
        );

        const foundAudio: ScannedAudioItem[] = [];
        const foundImages: { file: File; relativePath: string }[] = [];

        async function scanEntry(handle: any, currentPath = '') {
          for await (const entry of handle.values()) {
            if (entry.kind === 'file') {
              if (isAudioFile(entry.name)) {
                const file = await entry.getFile();
                foundAudio.push({
                  file,
                  relativePath: currentPath
                    ? `${currentPath}/${entry.name}`
                    : entry.name,
                  format: getFormatFromFilename(entry.name),
                  sizeMb: Math.round((file.size / (1024 * 1024)) * 10) / 10,
                });
              } else if (isImageFile(entry.name)) {
                const file = await entry.getFile();
                foundImages.push({
                  file,
                  relativePath: currentPath
                    ? `${currentPath}/${entry.name}`
                    : entry.name,
                });
              }
            } else if (entry.kind === 'directory') {
              const subPath = currentPath
                ? `${currentPath}/${entry.name}`
                : entry.name;
              await scanEntry(entry, subPath);
            }
          }
        }

        await scanEntry(dirHandle);

        // Extract metadata & covers for first batch of files
        for (let i = 0; i < Math.min(foundAudio.length, 12); i++) {
          try {
            const meta = await extractAudioFileMetadata(foundAudio[i].file);
            foundAudio[i].coverPreviewUrl = meta.coverUrl;
            if (meta.title) foundAudio[i].parsedTitle = meta.title;
            if (meta.artist) foundAudio[i].parsedArtist = meta.artist;
          } catch {
            // ignore
          }
        }

        setScannedFiles(foundAudio);
        setScannedImages(foundImages);
        setScanStatusText(
          `Escaneo completado: ${foundAudio.length} archivos de audio y ${foundImages.length} carátulas encontradas.`
        );
      } else {
        if (directoryInputRef.current) {
          directoryInputRef.current.click();
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Directory Picker error, falling back to input:', err);
        if (directoryInputRef.current) {
          directoryInputRef.current.click();
        }
      } else {
        setScanStatusText('Selección cancelada.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleDirectoryInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsScanning(true);

    const files = Array.from(e.target.files);
    const firstFile = files[0];
    const pathParts = (firstFile as any).webkitRelativePath?.split('/') || [];
    const rootFolder = pathParts.length > 1 ? pathParts[0] : 'Carpeta de Música';

    setFolderName(rootFolder);
    localStorage.setItem('aurahifi_last_folder', rootFolder);
    setPermissionGranted(true);

    const foundAudio: ScannedAudioItem[] = [];
    const foundImages: { file: File; relativePath: string }[] = [];

    for (const file of files) {
      if (isAudioFile(file.name)) {
        foundAudio.push({
          file,
          relativePath: (file as any).webkitRelativePath || file.name,
          format: getFormatFromFilename(file.name),
          sizeMb: Math.round((file.size / (1024 * 1024)) * 10) / 10,
        });
      } else if (isImageFile(file.name)) {
        foundImages.push({
          file,
          relativePath: (file as any).webkitRelativePath || file.name,
        });
      }
    }

    // Extract metadata preview for first items
    for (let i = 0; i < Math.min(foundAudio.length, 12); i++) {
      try {
        const meta = await extractAudioFileMetadata(foundAudio[i].file);
        foundAudio[i].coverPreviewUrl = meta.coverUrl;
        if (meta.title) foundAudio[i].parsedTitle = meta.title;
        if (meta.artist) foundAudio[i].parsedArtist = meta.artist;
      } catch {
        // ignore
      }
    }

    setScannedFiles(foundAudio);
    setScannedImages(foundImages);
    setIsScanning(false);
    setScanStatusText(
      `Permiso concedido. Se encontraron ${foundAudio.length} pistas y ${foundImages.length} imágenes de carátula.`
    );
  };

  const handleImportAll = async () => {
    if (scannedFiles.length === 0) return;
    setIsScanning(true);
    setScanStatusText('Decodificando carátulas e importando a la biblioteca...');

    const newTracks: Track[] = [];

    for (let idx = 0; idx < scannedFiles.length; idx++) {
      const item = scannedFiles[idx];
      const isHiRes =
        item.format === 'FLAC' || item.format === 'DSD' || item.format === 'WAV';
      const sampleRate = isHiRes ? 96000 : 44100;
      const bitDepth = isHiRes ? 24 : 16;
      const bitrate = isHiRes ? 4608 : 320;

      // Extract album / artist from relative path if available
      const parts = item.relativePath.split('/');
      let artist = 'Biblioteca Local';
      let album = folderName || 'Música Escaneada';
      let title = item.file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

      if (parts.length >= 3) {
        artist = parts[parts.length - 3];
        album = parts[parts.length - 2];
      } else if (parts.length === 2) {
        album = parts[0];
      }

      let coverUrl = item.coverPreviewUrl;

      // Extract embedded metadata & cover
      try {
        const meta = await extractAudioFileMetadata(item.file);
        if (meta.title) title = meta.title;
        if (meta.artist) artist = meta.artist;
        if (meta.album) album = meta.album;
        if (meta.coverUrl) coverUrl = meta.coverUrl;
      } catch {
        // ignore
      }

      newTracks.push({
        id: `folder-${Date.now()}-${idx}`,
        title,
        artist,
        album,
        duration: 0,
        format: item.format as any,
        sampleRate,
        bitDepth,
        bitrate,
        channels: 2,
        coverUrl,
        fileObject: item.file,
        cloudSource: 'local',
        year: 2026,
        genre: 'Audio Hi-Res',
      });
    }

    // Pair companion image covers if available
    pairCompanionImagesWithTracks(newTracks, scannedImages);

    onAddTracks(newTracks);
    if (newTracks.length > 0) {
      onPlayTrack(newTracks[0]);
    }
    setIsScanning(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="rounded-2xl border w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Modal Header */}
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
              <FolderSearch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                Conceder Permiso a Carpeta de Audio
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1"
                  style={{
                    backgroundColor: permissionGranted
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'var(--color-bg-base)',
                    borderColor: permissionGranted
                      ? 'rgba(16, 185, 129, 0.4)'
                      : 'var(--color-border)',
                    color: permissionGranted
                      ? '#34d399'
                      : 'var(--color-accent-light)',
                  }}
                >
                  {permissionGranted ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Permiso Concedido
                    </>
                  ) : (
                    'Permiso Requerido'
                  )}
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Búsqueda recursiva con extracción automática de carátulas de álbumes
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

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] text-xs">
          {/* Main Folder Picker Card */}
          <div
            className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{
              backgroundColor: 'var(--color-bg-base)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="space-y-1">
              <span className="text-xs font-semibold text-neutral-200 block">
                {folderName
                  ? `Carpeta Seleccionada: ${folderName}`
                  : 'Ninguna carpeta seleccionada actualmente'}
              </span>
              <p className="text-[11px] text-neutral-400">
                El navegador solicitará permiso seguro para leer archivos de música y carátulas (cover.jpg/png) en esta ruta.
              </p>
            </div>

            <button
              onClick={handleRequestDirectoryPicker}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 shadow-md self-start sm:self-auto"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-accent-text-contrast)',
                boxShadow: `0 4px 14px ${themeConfig.cssVariables['--color-accent-glow']}`,
              }}
            >
              {isScanning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FolderOpen className="w-4 h-4" />
              )}
              <span>
                {permissionGranted ? 'Cambiar Carpeta' : 'Seleccionar Carpeta'}
              </span>
            </button>

            {/* Hidden fallback directory file input */}
            <input
              ref={directoryInputRef}
              type="file"
              // @ts-ignore
              webkitdirectory=""
              // @ts-ignore
              directory=""
              multiple
              onChange={handleDirectoryInputChange}
              className="hidden"
            />
          </div>

          {/* Status Message */}
          {scanStatusText && (
            <div
              className="p-3 rounded-lg border flex items-center justify-between text-xs"
              style={{
                backgroundColor: 'var(--color-accent-dim)',
                borderColor: 'var(--color-accent-border)',
                color: 'var(--color-accent-light)',
              }}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className="w-4 h-4 shrink-0"
                  style={{ color: 'var(--color-accent)' }}
                />
                <span>{scanStatusText}</span>
              </div>
            </div>
          )}

          {/* Scanned Files List Preview with Album Covers! */}
          {scannedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-200">
                  Archivos de Audio Detectados ({scannedFiles.length}):
                </span>
                <span className="font-mono text-[10px] text-neutral-400">
                  Total:{' '}
                  {Math.round(
                    scannedFiles.reduce((acc, curr) => acc + curr.sizeMb, 0)
                  )}{' '}
                  MB
                </span>
              </div>

              <div
                className="max-h-56 overflow-y-auto space-y-1 rounded-xl p-2 border"
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  borderColor: 'var(--color-border-subtle)',
                }}
              >
                {scannedFiles.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/50 hover:bg-neutral-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 mr-2">
                      {item.coverPreviewUrl ? (
                        <img
                          src={item.coverPreviewUrl}
                          alt="Cover"
                          className="w-7 h-7 rounded object-cover border border-neutral-700 shrink-0"
                        />
                      ) : (
                        <FileAudio
                          className="w-4 h-4 shrink-0"
                          style={{ color: 'var(--color-accent)' }}
                        />
                      )}
                      <div className="min-w-0">
                        <span className="text-xs text-neutral-200 block truncate font-medium">
                          {item.parsedTitle || item.file.name}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono truncate block">
                          {item.parsedArtist
                            ? `${item.parsedArtist} · `
                            : ''}
                          {item.relativePath}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono text-[10px]">
                      <span
                        className="font-bold block"
                        style={{ color: 'var(--color-accent)' }}
                      >
                        {item.format}
                      </span>
                      <span className="text-neutral-500">{item.sizeMb} MB</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formats supported badge list */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] uppercase font-mono text-neutral-500 block">
              Formatos decodificables automáticamente:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'FLAC Hi-Res',
                'WAV PCM',
                'DSD / DSF',
                'ALAC',
                'AIFF',
                'MP3 320k',
                'AAC',
                'OGG',
                'OPUS',
              ].map((fmt) => (
                <span
                  key={fmt}
                  className="px-2 py-0.5 rounded text-[10px] font-mono border"
                  style={{
                    backgroundColor: 'var(--color-bg-base)',
                    borderColor: 'var(--color-border-subtle)',
                    color: '#a1a1aa',
                  }}
                >
                  {fmt}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="p-4 border-t flex items-center justify-between"
          style={{
            backgroundColor: 'var(--color-bg-header)',
            borderColor: 'var(--color-border-subtle)',
          }}
        >
          <div className="flex items-center gap-1.5 text-neutral-400 font-mono text-[10px]">
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
            <span>Extracción de carátulas ID3 / FLAC y emparejamiento automático</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border transition-colors"
              style={{
                backgroundColor: 'var(--color-bg-base)',
                borderColor: 'var(--color-border)',
                color: '#a1a1aa',
              }}
            >
              Cancelar
            </button>

            <button
              onClick={handleImportAll}
              disabled={scannedFiles.length === 0 || isScanning}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-accent-text-contrast)',
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Importar {scannedFiles.length} Canciones</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
