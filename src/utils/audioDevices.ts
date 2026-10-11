/**
 * Audio Hardware Input & Output Device Detector & Manager
 * Real-time detection of microphones, line-ins, DACs, headphones, and speakers.
 */

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
  isDefault: boolean;
  groupId?: string;
}

export interface AudioDeviceSummary {
  inputs: AudioDevice[];
  outputs: AudioDevice[];
  activeInput: AudioDevice | null;
  activeOutput: AudioDevice | null;
  hasHardwarePermission: boolean;
}

let deviceChangeListeners: (() => void)[] = [];
let isListeningToDeviceChange = false;

function setupDeviceChangeListener() {
  if (typeof navigator !== 'undefined' && navigator.mediaDevices && !isListeningToDeviceChange) {
    try {
      navigator.mediaDevices.addEventListener('devicechange', () => {
        deviceChangeListeners.forEach((fn) => fn());
      });
      isListeningToDeviceChange = true;
    } catch {
      // not supported in some environments
    }
  }
}

export function subscribeToDeviceChanges(callback: () => void): () => void {
  setupDeviceChangeListener();
  deviceChangeListeners.push(callback);
  return () => {
    deviceChangeListeners = deviceChangeListeners.filter((fn) => fn !== callback);
  };
}

export async function requestAudioPermissions(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop tracks immediately to avoid keeping microphone open
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (err) {
    console.warn('Microphone permission request skipped or denied:', err);
    return false;
  }
}

export async function detectAudioDevices(): Promise<{
  inputs: AudioDevice[];
  outputs: AudioDevice[];
  hasPermission: boolean;
}> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
    return {
      inputs: [
        {
          deviceId: 'default',
          label: 'Entrada predeterminada del sistema',
          kind: 'audioinput',
          isDefault: true,
        },
      ],
      outputs: [
        {
          deviceId: 'default',
          label: 'Salida de audio DAC principal',
          kind: 'audiooutput',
          isDefault: true,
        },
      ],
      hasPermission: false,
    };
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const inputs: AudioDevice[] = [];
    const outputs: AudioDevice[] = [];
    let hasExplicitLabels = false;

    devices.forEach((d, idx) => {
      const isNamed = !!d.label && d.label.trim().length > 0;
      if (isNamed) hasExplicitLabels = true;

      if (d.kind === 'audioinput') {
        inputs.push({
          deviceId: d.deviceId || `input-${idx}`,
          label:
            d.label ||
            (idx === 0
              ? 'Micrófono principal / Entrada analógica'
              : `Entrada de audio auxiliar ${inputs.length + 1}`),
          kind: 'audioinput',
          isDefault: d.deviceId === 'default' || inputs.length === 0,
          groupId: d.groupId,
        });
      } else if (d.kind === 'audiooutput') {
        outputs.push({
          deviceId: d.deviceId || `output-${idx}`,
          label:
            d.label ||
            (idx === 0
              ? 'Salida DAC principal / Altavoces'
              : `Dispositivo de salida de audio ${outputs.length + 1}`),
          kind: 'audiooutput',
          isDefault: d.deviceId === 'default' || outputs.length === 0,
          groupId: d.groupId,
        });
      }
    });

    if (inputs.length === 0) {
      inputs.push({
        deviceId: 'default',
        label: 'Micrófono / Entrada de línea',
        kind: 'audioinput',
        isDefault: true,
      });
    }
    if (outputs.length === 0) {
      outputs.push({
        deviceId: 'default',
        label: 'Salida estéreo DAC / Auriculares',
        kind: 'audiooutput',
        isDefault: true,
      });
    }

    return { inputs, outputs, hasPermission: hasExplicitLabels };
  } catch (err) {
    console.warn('Device enumeration error:', err);
    return {
      inputs: [
        {
          deviceId: 'default',
          label: 'Entrada de audio',
          kind: 'audioinput',
          isDefault: true,
        },
      ],
      outputs: [
        {
          deviceId: 'default',
          label: 'Salida estéreo DAC',
          kind: 'audiooutput',
          isDefault: true,
        },
      ],
      hasPermission: false,
    };
  }
}
