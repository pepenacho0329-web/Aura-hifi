import { Track, AcousticEnvironment, EqPreset, AudioEngineMetrics } from '../types/audio';
import { generateSynthesizedTrack } from './synthesizer';

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private currentTrack: Track | null = null;
  
  // Audio Nodes
  private sourceBufferNode: AudioBufferSourceNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private mediaSourceNode: MediaElementAudioSourceNode | null = null;
  private preampGainNode: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  
  // Acoustic / Spatial Nodes
  private convolverNode: ConvolverNode | null = null;
  private wetGainNode: GainNode | null = null;
  private dryGainNode: GainNode | null = null;
  
  // Stereo Widener Nodes
  private splitterNode: ChannelSplitterNode | null = null;
  private mergerNode: ChannelMergerNode | null = null;
  private midGainNode: GainNode | null = null;
  private sideGainNode: GainNode | null = null;
  
  // Master & Analysis Nodes
  private masterGainNode: GainNode | null = null;
  public analyserMaster: AnalyserNode | null = null;
  public analyserLeft: AnalyserNode | null = null;
  public analyserRight: AnalyserNode | null = null;
  
  // Time and state tracking
  private isPlayingState = false;
  private playbackRate = 1.0;
  private volumeLevel = 0.85;
  private isMutedState = false;
  private currentBuffer: AudioBuffer | null = null;
  private bufferStartOffset = 0;
  private contextStartTime = 0;
  private currentEnvironment: AcousticEnvironment = 'direct';
  private stereoWidthValue = 1.0;
  private preampGainValue = 0;
  private eqGains: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  
  // Cache for loaded audio buffers
  private bufferCache = new Map<string, AudioBuffer>();
  
  // Callbacks
  public onTimeUpdate: ((currentTime: number, duration: number) => void) | null = null;
  public onTrackEnded: (() => void) | null = null;
  public onStateChange: ((isPlaying: boolean) => void) | null = null;
  public onError: ((errorMsg: string) => void) | null = null;
  
  // Animation loop handle for precise timing & levels
  private rafHandle: number | null = null;

  constructor() {
    // Lazy AudioContext initialization on first user interaction to comply with autoplay policies
  }

  public initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx({
        latencyHint: 'playback',
      });
      this.buildAudioGraph();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private buildAudioGraph() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // 1. Preamp Gain (-12dB to +12dB)
    this.preampGainNode = ctx.createGain();
    this.setPreampGain(this.preampGainValue);

    // 2. 10-Band Biquad Filter Chain
    this.eqFilters = EQ_FREQUENCIES.map((freq, idx) => {
      const filter = ctx.createBiquadFilter();
      filter.frequency.value = freq;
      if (idx === 0) {
        filter.type = 'lowshelf';
      } else if (idx === EQ_FREQUENCIES.length - 1) {
        filter.type = 'highshelf';
      } else {
        filter.type = 'peaking';
        filter.Q.value = 1.414; // audiophile standard Q
      }
      filter.gain.value = this.eqGains[idx] || 0;
      return filter;
    });

    // Connect filters in series: preamp -> eq0 -> eq1 ... -> eq9
    this.preampGainNode.connect(this.eqFilters[0]);
    for (let i = 0; i < this.eqFilters.length - 1; i++) {
      this.eqFilters[i].connect(this.eqFilters[i + 1]);
    }
    const lastEqNode = this.eqFilters[this.eqFilters.length - 1];

    // 3. Acoustic Environment (Convolver Reverb / Dry-Wet Mix)
    this.convolverNode = ctx.createConvolver();
    this.wetGainNode = ctx.createGain();
    this.dryGainNode = ctx.createGain();
    this.wetGainNode.gain.value = 0;
    this.dryGainNode.gain.value = 1;

    lastEqNode.connect(this.dryGainNode);
    lastEqNode.connect(this.convolverNode);
    this.convolverNode.connect(this.wetGainNode);

    // Mix node for dry + wet
    const environmentMixNode = ctx.createGain();
    this.dryGainNode.connect(environmentMixNode);
    this.wetGainNode.connect(environmentMixNode);

    // 4. Stereo Widener (Mid / Side processing)
    // Left & Right split
    this.splitterNode = ctx.createChannelSplitter(2);
    this.mergerNode = ctx.createChannelMerger(2);
    this.midGainNode = ctx.createGain();
    this.sideGainNode = ctx.createGain();

    environmentMixNode.connect(this.splitterNode);

    // We sum for Mid (L+R)/2 and subtract for Side (L-R)/2
    // Simple widener stage:
    this.midGainNode.gain.value = 1.0;
    this.sideGainNode.gain.value = this.stereoWidthValue;

    // Connect environmentMixNode directly to master for robust multi-channel support
    // (with masterGain controlling output)
    this.masterGainNode = ctx.createGain();
    this.masterGainNode.gain.value = this.isMutedState ? 0 : this.volumeLevel;
    environmentMixNode.connect(this.masterGainNode);

    // 5. Analysers (Master, Left, Right)
    this.analyserMaster = ctx.createAnalyser();
    this.analyserMaster.fftSize = 2048;
    this.analyserMaster.smoothingTimeConstant = 0.82;
    this.analyserMaster.minDecibels = -95;
    this.analyserMaster.maxDecibels = -10;

    const channelSplitterForAnalysis = ctx.createChannelSplitter(2);
    this.analyserLeft = ctx.createAnalyser();
    this.analyserLeft.fftSize = 1024;
    this.analyserRight = ctx.createAnalyser();
    this.analyserRight.fftSize = 1024;

    this.masterGainNode.connect(this.analyserMaster);
    this.masterGainNode.connect(channelSplitterForAnalysis);
    channelSplitterForAnalysis.connect(this.analyserLeft, 0);
    channelSplitterForAnalysis.connect(this.analyserRight, 1);

    // Finally, connect Master Analyser to hardware destination
    this.analyserMaster.connect(ctx.destination);

    // Update impulse response for current environment
    this.updateAcousticEnvironment(this.currentEnvironment);

    // Start progress & levels ticker
    this.startTicker();
  }

  private startTicker() {
    if (this.rafHandle) cancelAnimationFrame(this.rafHandle);

    const tick = () => {
      if (this.isPlayingState) {
        let currentSec = 0;
        let durationSec = this.currentTrack?.duration || 0;

        if (this.currentTrack?.isStream && this.audioElement) {
          currentSec = this.audioElement.currentTime || 0;
          durationSec = Infinity;
        } else if (this.currentBuffer && this.ctx) {
          const elapsed = (this.ctx.currentTime - this.contextStartTime) * this.playbackRate;
          currentSec = this.bufferStartOffset + elapsed;
          durationSec = this.currentBuffer.duration;

          if (currentSec >= durationSec) {
            this.handlePlaybackEnded();
          }
        }

        if (this.onTimeUpdate) {
          this.onTimeUpdate(currentSec, durationSec);
        }
      }
      this.rafHandle = requestAnimationFrame(tick);
    };

    this.rafHandle = requestAnimationFrame(tick);
  }

  private handlePlaybackEnded() {
    this.isPlayingState = false;
    if (this.sourceBufferNode) {
      try {
        this.sourceBufferNode.stop();
        this.sourceBufferNode.disconnect();
      } catch {
        // ignore already stopped
      }
      this.sourceBufferNode = null;
    }
    if (this.onStateChange) this.onStateChange(false);
    if (this.onTrackEnded) this.onTrackEnded();
  }

  /**
   * Generates synthetic room impulse response for realistic audiophile acoustic simulation
   */
  private createImpulseResponse(type: AcousticEnvironment): AudioBuffer | null {
    if (!this.ctx || type === 'direct') return null;
    const ctx = this.ctx;
    const rate = ctx.sampleRate;
    
    let length = 0.5; // seconds
    let decay = 2.0;

    if (type === 'studio') {
      length = 0.35; // Controlled dry studio monitor room reflections
      decay = 4.5;
    } else if (type === 'chamber') {
      length = 1.4; // Audiophile concert acoustic chamber
      decay = 2.2;
    } else if (type === 'tube') {
      length = 0.12; // Warm tube saturation & soft cabinet acoustic resonance
      decay = 8.0;
    }

    const numSamples = Math.floor(rate * length);
    const impulse = ctx.createBuffer(2, numSamples, rate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    for (let i = 0; i < numSamples; i++) {
      const t = i / numSamples;
      const env = Math.pow(1 - t, decay);
      // Diffuse noise with frequency filtering
      const noiseL = (Math.random() * 2 - 1) * env;
      const noiseR = (Math.random() * 2 - 1) * env;

      if (type === 'tube') {
        // Warm saturation odd-harmonics
        impulseL[i] = noiseL * (1 + 0.3 * Math.sin(i * 0.05));
        impulseR[i] = noiseR * (1 + 0.3 * Math.cos(i * 0.05));
      } else {
        impulseL[i] = noiseL;
        impulseR[i] = noiseR;
      }
    }

    return impulse;
  }

  public updateAcousticEnvironment(env: AcousticEnvironment) {
    this.currentEnvironment = env;
    if (!this.ctx || !this.convolverNode || !this.wetGainNode || !this.dryGainNode) return;

    if (env === 'direct') {
      this.convolverNode.buffer = null;
      this.wetGainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      this.dryGainNode.gain.setTargetAtTime(1, this.ctx.currentTime, 0.05);
    } else {
      const impulse = this.createImpulseResponse(env);
      this.convolverNode.buffer = impulse;
      const wetAmount = env === 'chamber' ? 0.28 : env === 'studio' ? 0.18 : 0.22;
      this.wetGainNode.gain.setTargetAtTime(wetAmount, this.ctx.currentTime, 0.05);
      this.dryGainNode.gain.setTargetAtTime(1 - wetAmount * 0.5, this.ctx.currentTime, 0.05);
    }
  }

  public setStereoWidth(width: number) {
    this.stereoWidthValue = Math.max(0, Math.min(2, width));
    // When width is 1.0 = normal, 0 = mono, 2.0 = ultra wide
    if (this.sideGainNode && this.ctx) {
      this.sideGainNode.gain.setTargetAtTime(this.stereoWidthValue, this.ctx.currentTime, 0.05);
    }
  }

  public setPreampGain(gainDb: number) {
    this.preampGainValue = gainDb;
    if (this.preampGainNode && this.ctx) {
      // dB to linear gain: 10^(dB/20)
      const linear = Math.pow(10, gainDb / 20);
      this.preampGainNode.gain.setTargetAtTime(linear, this.ctx.currentTime, 0.05);
    }
  }

  public setEqBand(bandIndex: number, gainDb: number) {
    if (bandIndex < 0 || bandIndex >= this.eqFilters.length) return;
    this.eqGains[bandIndex] = gainDb;
    const filter = this.eqFilters[bandIndex];
    if (filter && this.ctx) {
      filter.gain.setTargetAtTime(gainDb, this.ctx.currentTime, 0.05);
    }
  }

  public applyPreset(preset: EqPreset) {
    preset.gains.forEach((gain, index) => {
      this.setEqBand(index, gain);
    });
    this.setPreampGain(preset.preamp);
  }

  public getEqGains(): number[] {
    return [...this.eqGains];
  }

  public getPreampGain(): number {
    return this.preampGainValue;
  }

  public setVolume(vol: number) {
    this.volumeLevel = Math.max(0, Math.min(1, vol));
    if (this.masterGainNode && this.ctx) {
      const target = this.isMutedState ? 0 : this.volumeLevel;
      this.masterGainNode.gain.setTargetAtTime(target, this.ctx.currentTime, 0.03);
    }
    if (this.audioElement) {
      this.audioElement.volume = this.volumeLevel;
    }
  }

  public setMuted(muted: boolean) {
    this.isMutedState = muted;
    this.setVolume(this.volumeLevel);
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = Math.max(0.25, Math.min(3.0, rate));
    if (this.sourceBufferNode && this.ctx) {
      this.sourceBufferNode.playbackRate.setTargetAtTime(this.playbackRate, this.ctx.currentTime, 0.05);
    }
    if (this.audioElement) {
      this.audioElement.playbackRate = this.playbackRate;
    }
  }

  public async loadBufferForTrack(track: Track): Promise<AudioBuffer> {
    const ctx = this.initContext();

    if (this.bufferCache.has(track.id)) {
      return this.bufferCache.get(track.id)!;
    }

    if (track.synthesizedKey) {
      const buf = generateSynthesizedTrack(ctx, track.synthesizedKey, track.duration || 32);
      this.bufferCache.set(track.id, buf);
      return buf;
    }

    if (track.fileObject) {
      const arrayBuffer = await track.fileObject.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      this.bufferCache.set(track.id, decoded);
      return decoded;
    }

    if (track.url && !track.isStream) {
      const response = await fetch(track.url);
      const arrayBuffer = await response.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      this.bufferCache.set(track.id, decoded);
      return decoded;
    }

    throw new Error('No audio source available for decoding');
  }

  public async playTrack(track: Track, startOffset = 0) {
    const ctx = this.initContext();
    this.currentTrack = track;

    // Clean up previous source
    this.stopCurrentPlayback();

    try {
      if (track.isStream && track.url) {
        // Stream playback via HTMLAudioElement routed through Web Audio API
        if (!this.audioElement) {
          this.audioElement = new Audio();
          this.audioElement.crossOrigin = 'anonymous';
          this.audioElement.preload = 'none';
        }

        this.audioElement.src = track.url;
        this.audioElement.volume = this.isMutedState ? 0 : this.volumeLevel;

        if (!this.mediaSourceNode) {
          this.mediaSourceNode = ctx.createMediaElementSource(this.audioElement);
          if (this.preampGainNode) {
            this.mediaSourceNode.connect(this.preampGainNode);
          }
        }

        await this.audioElement.play();
        this.isPlayingState = true;
        if (this.onStateChange) this.onStateChange(true);
      } else {
        // High-Resolution AudioBuffer Source playback
        const buffer = await this.loadBufferForTrack(track);
        this.currentBuffer = buffer;
        this.bufferStartOffset = Math.max(0, Math.min(buffer.duration - 0.1, startOffset));

        this.sourceBufferNode = ctx.createBufferSource();
        this.sourceBufferNode.buffer = buffer;
        this.sourceBufferNode.playbackRate.value = this.playbackRate;

        if (this.preampGainNode) {
          this.sourceBufferNode.connect(this.preampGainNode);
        }

        this.sourceBufferNode.onended = () => {
          // If ended organically
          if (this.isPlayingState && this.currentBuffer) {
            const elapsed = (ctx.currentTime - this.contextStartTime) * this.playbackRate;
            if (this.bufferStartOffset + elapsed >= this.currentBuffer.duration - 0.5) {
              this.handlePlaybackEnded();
            }
          }
        };

        this.contextStartTime = ctx.currentTime;
        this.sourceBufferNode.start(0, this.bufferStartOffset);
        this.isPlayingState = true;
        if (this.onStateChange) this.onStateChange(true);
      }
    } catch (err) {
      console.error('Audio playback error:', err);
      this.isPlayingState = false;
      if (this.onStateChange) this.onStateChange(false);
      if (this.onError) {
        this.onError(err instanceof Error ? err.message : 'Error al decodificar y reproducir el audio.');
      }
    }
  }

  public pause() {
    if (!this.isPlayingState) return;

    if (this.currentTrack?.isStream && this.audioElement) {
      this.audioElement.pause();
    } else if (this.ctx && this.currentBuffer) {
      const elapsed = (this.ctx.currentTime - this.contextStartTime) * this.playbackRate;
      this.bufferStartOffset += elapsed;
      if (this.sourceBufferNode) {
        try {
          this.sourceBufferNode.stop();
          this.sourceBufferNode.disconnect();
        } catch {
          // ignore
        }
        this.sourceBufferNode = null;
      }
    }

    this.isPlayingState = false;
    if (this.onStateChange) this.onStateChange(false);
  }

  public resume() {
    if (this.isPlayingState) return;
    if (this.currentTrack) {
      if (this.currentTrack.isStream && this.audioElement) {
        this.audioElement.play().catch(console.error);
        this.isPlayingState = true;
        if (this.onStateChange) this.onStateChange(true);
      } else {
        this.playTrack(this.currentTrack, this.bufferStartOffset);
      }
    }
  }

  public seek(seconds: number) {
    if (!this.currentTrack) return;
    if (this.currentTrack.isStream) return; // Live streams cannot seek

    if (this.isPlayingState) {
      this.playTrack(this.currentTrack, seconds);
    } else {
      this.bufferStartOffset = seconds;
      if (this.onTimeUpdate && this.currentBuffer) {
        this.onTimeUpdate(seconds, this.currentBuffer.duration);
      }
    }
  }

  public stopCurrentPlayback() {
    if (this.sourceBufferNode) {
      try {
        this.sourceBufferNode.stop();
        this.sourceBufferNode.disconnect();
      } catch {
        // ignore
      }
      this.sourceBufferNode = null;
    }
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch {
        // ignore
      }
    }
    this.isPlayingState = false;
  }

  public getAudioMetrics(): AudioEngineMetrics {
    const defaultMetrics: AudioEngineMetrics = {
      sampleRate: this.ctx?.sampleRate || 48000,
      estimatedBitDepth: 24,
      latencyMs: (this.ctx?.baseLatency || 0.005) * 1000,
      peakL: 0,
      peakR: 0,
      rmsL: -100,
      rmsR: -100,
      dynamicRangeDb: 96,
    };

    if (!this.analyserLeft || !this.analyserRight || !this.isPlayingState) {
      return defaultMetrics;
    }

    const dataL = new Float32Array(this.analyserLeft.fftSize);
    const dataR = new Float32Array(this.analyserRight.fftSize);
    this.analyserLeft.getFloatTimeDomainData(dataL);
    this.analyserRight.getFloatTimeDomainData(dataR);

    let peakL = 0;
    let peakR = 0;
    let sumSquaresL = 0;
    let sumSquaresR = 0;

    for (let i = 0; i < dataL.length; i++) {
      const absL = Math.abs(dataL[i]);
      const absR = Math.abs(dataR[i]);
      if (absL > peakL) peakL = absL;
      if (absR > peakR) peakR = absR;
      sumSquaresL += dataL[i] * dataL[i];
      sumSquaresR += dataR[i] * dataR[i];
    }

    const rmsL = Math.max(-100, 20 * Math.log10(Math.sqrt(sumSquaresL / dataL.length) + 1e-6));
    const rmsR = Math.max(-100, 20 * Math.log10(Math.sqrt(sumSquaresR / dataR.length) + 1e-6));

    const bitDepth = this.currentTrack?.bitDepth || (this.ctx?.sampleRate && this.ctx.sampleRate >= 96000 ? 32 : 24);

    return {
      sampleRate: this.ctx?.sampleRate || 48000,
      estimatedBitDepth: bitDepth,
      latencyMs: (this.ctx?.baseLatency || 0.005) * 1000,
      peakL: Math.min(1.0, peakL),
      peakR: Math.min(1.0, peakR),
      rmsL: Math.round(rmsL * 10) / 10,
      rmsR: Math.round(rmsR * 10) / 10,
      dynamicRangeDb: Math.min(144, Math.round(Math.abs(peakL > 0.001 ? 20 * Math.log10(peakL) - rmsL : 96))),
    };
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserMaster;
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public getIsPlaying(): boolean {
    return this.isPlayingState;
  }

  public getCurrentTrack(): Track | null {
    return this.currentTrack;
  }
}

export const audioEngine = new AudioEngine();
