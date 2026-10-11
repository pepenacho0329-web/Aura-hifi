export type AudioFormat = 'FLAC' | 'WAV' | 'DSD' | 'ALAC' | 'MP3' | 'AAC' | 'OGG' | 'OPUS' | 'STREAM';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  format: AudioFormat;
  sampleRate: number; // Hz, e.g. 96000, 192000, 44100
  bitDepth: number; // bits, e.g. 24, 32, 16
  bitrate: number; // kbps, e.g. 4608, 9216, 1411, 320
  channels: number; // 2 for stereo
  coverUrl?: string;
  url?: string;
  isStream?: boolean;
  streamType?: 'radio' | 'direct' | 'cloud';
  synthesizedKey?: string;
  fileObject?: File;
  cloudSource?: 'local' | 'demo' | 'radio' | 'dropbox' | 'gdrive' | 'onedrive' | 'custom_url';
  year?: number;
  genre?: string;
  isFavorite?: boolean;
}

export interface EqualizerBand {
  frequency: number;
  label: string;
  gain: number; // dB, -12 to +12
  q: number;
  type: BiquadFilterType;
}

export interface EqPreset {
  id: string;
  name: string;
  description: string;
  gains: number[]; // 10 bands
  preamp: number;
}

export type AcousticEnvironment = 'direct' | 'studio' | 'chamber' | 'tube';

export interface VisualizerMode {
  id: 'spectrum' | 'oscilloscope' | 'vectorscope' | 'vu_meters';
  label: string;
}

export interface AudioEngineMetrics {
  sampleRate: number;
  estimatedBitDepth: number;
  latencyMs: number;
  peakL: number; // 0 to 1
  peakR: number; // 0 to 1
  rmsL: number; // dB
  rmsR: number; // dB
  dynamicRangeDb: number;
}
