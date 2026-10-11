import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  AudioDevice,
  detectAudioDevices,
  requestAudioPermissions,
  subscribeToDeviceChanges,
} from '../utils/audioDevices';
import { audioEngine } from '../audio/audioEngine';
import {
  Volume2,
  Mic,
  Headphones,
  Speaker,
  CheckCircle2,
  RefreshCw,
  Zap,
  Check,
  Shield,
  Activity,
  Radio,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface AudioDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceSelected?: (type: 'input' | 'output', device: AudioDevice) => void;
}

export const AudioDeviceModal: React.FC<AudioDeviceModalProps> = ({
  isOpen,
  onClose,
  onDeviceSelected,
}) => {
  const { themeConfig } = useTheme();
  const [inputs, setInputs] = useState<AudioDevice[]>([]);
  const [outputs, setOutputs] = useState<AudioDevice[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [selectedOutput, setSelectedOutput] = useState<string>('default');
  const [selectedInput, setSelectedInput] = useState<string>('default');
  const [isTestingTone, setIsTestingTone] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Real-time microphone input level monitoring
  const [isMonitoringInput, setIsMonitoringInput] = useState<boolean>(false);
  const [inputLevelDb, setInputLevelDb] = useState<number>(-60);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const loadDevices = async () => {
    setIsRefreshing(true);
    const result = await detectAudioDevices();
    setInputs(result.inputs);
    setOutputs(result.outputs);
    setHasPermission(result.hasPermission);
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadDevices();
      const unsubscribe = subscribeToDeviceChanges(() => {
        loadDevices();
      });
      return () => {
        unsubscribe();
        stopInputMonitoring();
      };
    }
  }, [isOpen]);

  // Clean up input monitoring on close
  const stopInputMonitoring = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    setIsMonitoringInput(false);
    setInputLevelDb(-60);
  };

  const toggleInputMonitoring = async () => {
    if (isMonitoringInput) {
      stopInputMonitoring();
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio:
          selectedInput === 'default'
            ? true
            : { deviceId: { exact: selectedInput } },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      micStreamRef.current = stream;

      const audioCtx = audioEngine.initContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      setIsMonitoringInput(true);

      const checkLevel = () => {
        analyser.getByteTimeDomainData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          const sample = (buffer[i] - 128) / 128;
          sum += sample * sample;
        }
        const rms = Math.sqrt(sum / buffer.length);
        const db = rms > 0.001 ? 20 * Math.log10(rms) : -60;
        setInputLevelDb(Math.max(-60, Math.min(0, Math.round(db))));

        if (micStreamRef.current) {
          animFrameRef.current = requestAnimationFrame(checkLevel);
        }
      };

      checkLevel();
      // Reload devices to update hardware labels with permission
      loadDevices();
    } catch (err) {
      console.warn('Could not start input level monitoring:', err);
      setIsMonitoringInput(false);
    }
  };

  const handleRequestHardwareLabels = async () => {
    const granted = await requestAudioPermissions();
    if (granted) {
      await loadDevices();
    }
  };

  const handleSelectOutputDevice = (out: AudioDevice) => {
    setSelectedOutput(out.deviceId);
    if (onDeviceSelected) onDeviceSelected('output', out);
    // Try setting output sink ID on audio element if available
    try {
      const audioEl = (audioEngine as any).audioElement;
      if (audioEl && typeof audioEl.setSinkId === 'function') {
        audioEl.setSinkId(out.deviceId);
      }
    } catch {
      // not supported in all browsers
    }
  };

  const handleSelectInputDevice = (inp: AudioDevice) => {
    setSelectedInput(inp.deviceId);
    if (onDeviceSelected) onDeviceSelected('input', inp);
    if (isMonitoringInput) {
      stopInputMonitoring();
    }
  };

  const playTestTone = () => {
    try {
      const ctx = audioEngine.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.55);
      setIsTestingTone(true);
      setTimeout(() => setIsTestingTone(false), 600);
    } catch (err) {
      console.warn('Tone test error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="rounded-2xl border w-full max-w-xl shadow-2xl overflow-hidden flex flex-col"
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
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                Detección de Entrada y Salida de Audio
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded border text-emerald-400 border-emerald-500/30 bg-emerald-500/10 flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Activo
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Monitoreo de puertos DAC, auriculares, altavoces y entradas de línea
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopInputMonitoring();
              onClose();
            }}
            className="text-neutral-400 hover:text-neutral-100 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs overflow-y-auto max-h-[75vh]">
          {/* Permission Prompt Banner if needed */}
          {!hasPermission && (
            <div
              className="p-3 rounded-xl border flex items-center justify-between gap-3 text-xs"
              style={{
                backgroundColor: 'var(--color-bg-base)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-neutral-300">
                  Concede permiso para revelar los nombres específicos de tus tarjetas de sonido y DACs externos.
                </span>
              </div>
              <button
                onClick={handleRequestHardwareLabels}
                className="px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all border"
                style={{
                  backgroundColor: 'var(--color-accent-dim)',
                  borderColor: 'var(--color-accent-border)',
                  color: 'var(--color-accent-light)',
                }}
              >
                Revelar Nombres
              </button>
            </div>
          )}

          {/* Outputs Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200 uppercase font-mono tracking-wider flex items-center gap-2">
                <Speaker className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                <span>Salidas de Audio Detectadas ({outputs.length})</span>
              </span>
              <button
                onClick={loadDevices}
                className="text-[11px] text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition-colors"
                title="Actualizar lista de dispositivos"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {outputs.map((out) => {
                const isSelected = selectedOutput === out.deviceId;
                return (
                  <div
                    key={out.deviceId}
                    onClick={() => handleSelectOutputDevice(out)}
                    className="p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all"
                    style={{
                      backgroundColor: isSelected ? 'var(--color-accent-dim)' : 'var(--color-bg-base)',
                      borderColor: isSelected ? 'var(--color-accent-border)' : 'var(--color-border-subtle)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Speaker className="w-4 h-4 text-neutral-400" />
                      <div>
                        <span className="text-xs font-semibold text-neutral-100 block">
                          {out.label}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {out.isDefault ? 'Salida por defecto del sistema' : 'Dispositivo estéreo DAC'}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test tone button */}
          <div
            className="p-3.5 rounded-xl border flex items-center justify-between"
            style={{
              backgroundColor: 'var(--color-bg-base)',
              borderColor: 'var(--color-border-subtle)',
            }}
          >
            <div>
              <span className="font-semibold text-neutral-200 block">Probar Señal Acústica DAC</span>
              <span className="text-[11px] text-neutral-500">
                Emite un barrido sinusoidal de 440Hz a 880Hz para verificar los transductores
              </span>
            </div>
            <button
              onClick={playTestTone}
              className="px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-accent-text-contrast)',
              }}
            >
              <Zap className={`w-3.5 h-3.5 ${isTestingTone ? 'animate-ping' : ''}`} />
              <span>{isTestingTone ? 'Emitiendo...' : 'Probar Sonido'}</span>
            </button>
          </div>

          {/* Inputs Section */}
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200 uppercase font-mono tracking-wider flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-400" />
                <span>Entradas de Audio Detectadas ({inputs.length})</span>
              </span>
              <button
                onClick={toggleInputMonitoring}
                className="text-[11px] px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all"
                style={{
                  backgroundColor: isMonitoringInput ? 'rgba(16, 185, 129, 0.2)' : 'var(--color-bg-base)',
                  borderColor: isMonitoringInput ? '#10b981' : 'var(--color-border)',
                  color: isMonitoringInput ? '#34d399' : '#a1a1aa',
                }}
              >
                <Activity className={`w-3 h-3 ${isMonitoringInput ? 'animate-pulse' : ''}`} />
                <span>{isMonitoringInput ? 'Detener Medición' : 'Medir Nivel en Vivo'}</span>
              </button>
            </div>

            {/* Live Input VU Meter Bar */}
            {isMonitoringInput && (
              <div
                className="p-3 rounded-xl border space-y-2 animate-fade-in"
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                }}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Entrada en Tiempo Real:
                  </span>
                  <span className="text-emerald-400 font-bold">{inputLevelDb} dB</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-700">
                  <div
                    className="h-full rounded-full transition-all duration-75"
                    style={{
                      width: `${Math.max(4, Math.min(100, ((inputLevelDb + 60) / 60) * 100))}%`,
                      backgroundColor:
                        inputLevelDb > -6 ? '#ef4444' : inputLevelDb > -18 ? '#f59e0b' : '#10b981',
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-neutral-500">
                  <span>-60 dB</span>
                  <span>-36 dB</span>
                  <span>-18 dB</span>
                  <span>-6 dB</span>
                  <span>0 dB (Pico)</span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              {inputs.map((inp) => {
                const isSelected = selectedInput === inp.deviceId;
                return (
                  <div
                    key={inp.deviceId}
                    onClick={() => handleSelectInputDevice(inp)}
                    className="p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all"
                    style={{
                      backgroundColor: isSelected ? 'var(--color-accent-dim)' : 'var(--color-bg-base)',
                      borderColor: isSelected ? 'var(--color-accent-border)' : 'var(--color-border-subtle)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Mic className="w-4 h-4 text-neutral-400" />
                      <div>
                        <span className="text-xs font-semibold text-neutral-100 block">
                          {inp.label}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {inp.isDefault ? 'Entrada activa por defecto' : 'Entrada analógica'}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                    )}
                  </div>
                );
              })}
            </div>
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
          <div className="flex items-center gap-2 text-neutral-400 font-mono text-[10px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Muestreo Hardware: {audioEngine.getContext()?.sampleRate || 48000} Hz · 32-bit Float</span>
          </div>

          <button
            onClick={() => {
              stopInputMonitoring();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold border shadow-sm transition-all"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-accent-text-contrast)',
              borderColor: 'var(--color-accent)',
            }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
