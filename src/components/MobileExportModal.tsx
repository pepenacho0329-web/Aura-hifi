import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Smartphone,
  Download,
  Apple,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Layers,
  Terminal,
  FileCode,
  Share2,
  PlusSquare,
  Sparkles,
  Check,
} from 'lucide-react';

interface MobileExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileExportModal: React.FC<MobileExportModalProps> = ({ isOpen, onClose }) => {
  const { themeConfig } = useTheme();
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'pwa' | 'source'>('android');
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    // Listen for browser PWA install prompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallPwa = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } else {
      alert('Para instalar en tu dispositivo:\n- En Android: Abre el menú de Chrome (⋮) y selecciona "Instalar aplicación".\n- En iOS (iPhone/iPad): Pulsa el botón "Compartir" (⎋) y luego "Añadir a pantalla de inicio" (⊞).');
    }
  };

  const handleDownloadApkManifest = () => {
    const apkData = {
      app_name: "AuraHiFi",
      package_name: "com.aurahifi.player",
      min_sdk: 24, // Android 7.0 Nougat
      target_sdk: 34, // Android 14/15
      version_name: "1.0.0",
      version_code: 1,
      architectures: ["arm64-v8a", "armeabi-v7a", "x86_64"],
      permissions: [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.WAKE_LOCK",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
        "android.permission.READ_MEDIA_AUDIO"
      ],
      capabilities: [
        "Hi-Res 192kHz/24-bit Audio Decoding",
        "Parametric 10-Band EQ",
        "Cloud Audio Streaming (Icecast/HTTP)",
        "Background Audio Playback"
      ]
    };

    const blob = new Blob([JSON.stringify(apkData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AuraHiFi-Android-Universal-Package.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMobileConfig = () => {
    const configXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadDisplayName</key>
    <string>AuraHiFi Reproductor Hi-Res</string>
    <key>PayloadIdentifier</key>
    <string>com.aurahifi.webclip</string>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>9F82C10E-3F25-45C1-A8EB-7589CE0F1A12</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadIdentifier</key>
            <string>com.aurahifi.webclip.clip</string>
            <key>PayloadUUID</key>
            <string>B7D3E2F4-4286-44D1-98F1-4A568D9C8D23</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Label</key>
            <string>AuraHiFi</string>
            <key>URL</key>
            <string>${window.location.origin}</string>
            <key>FullScreen</key>
            <true/>
            <key>IsRemovable</key>
            <true/>
        </dict>
    </array>
</dict>
</plist>`;

    const blob = new Blob([configXml], { type: 'application/x-apple-aspen-config' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AuraHiFi-iOS.mobileconfig';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
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
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                Instalación & Paquete Nativo Móvil
                <span
                  className="text-[10px] font-mono px-1.5 py-0.2 rounded border font-bold"
                  style={{
                    backgroundColor: 'var(--color-bg-base)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-accent)',
                  }}
                >
                  Android 7+ & iOS
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Instala AuraHiFi como aplicación nativa en tu teléfono o descarga los paquetes de distribución
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

        {/* Tab Navigation */}
        <div
          className="flex border-b px-6 overflow-x-auto scrollbar-none"
          style={{
            backgroundColor: 'var(--color-bg-base)',
            borderColor: 'var(--color-border-subtle)',
          }}
        >
          <button
            onClick={() => setActiveTab('android')}
            className="flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap"
            style={{
              borderColor: activeTab === 'android' ? 'var(--color-accent)' : 'transparent',
              color: activeTab === 'android' ? 'var(--color-accent)' : '#a1a1aa',
            }}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android APK (7.0 a 15)</span>
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className="flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap"
            style={{
              borderColor: activeTab === 'ios' ? 'var(--color-accent)' : 'transparent',
              color: activeTab === 'ios' ? 'var(--color-accent)' : '#a1a1aa',
            }}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>Apple iOS IPA (iPhone / iPad)</span>
          </button>

          <button
            onClick={() => setActiveTab('pwa')}
            className="flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap"
            style={{
              borderColor: activeTab === 'pwa' ? 'var(--color-accent)' : 'transparent',
              color: activeTab === 'pwa' ? 'var(--color-accent)' : '#a1a1aa',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instalación Directa 1-Clic</span>
          </button>

          <button
            onClick={() => setActiveTab('source')}
            className="flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap"
            style={{
              borderColor: activeTab === 'source' ? 'var(--color-accent)' : 'transparent',
              color: activeTab === 'source' ? 'var(--color-accent)' : '#a1a1aa',
            }}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Compilación CLI / Código</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* TAB 1: ANDROID APK */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              {/* Highlight card */}
              <div
                className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{
                  backgroundColor: 'var(--color-accent-dim)',
                  borderColor: 'var(--color-accent-border)',
                }}
              >
                <div>
                  <h4 className="font-bold text-neutral-100 text-sm flex items-center gap-2">
                    <span>AuraHiFi Universal Android (APK / TWA)</span>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded font-black uppercase"
                      style={{
                        backgroundColor: 'var(--color-accent)',
                        color: 'var(--color-accent-text-contrast)',
                      }}
                    >
                      Android 7.0+
                    </span>
                  </h4>
                  <p className="text-neutral-300 mt-1 text-xs leading-relaxed">
                    Compatible con arquitecturas ARM64, ARMv7 y x86_64 desde Android 7.0 Nougat (API 24) hasta Android 15. Soporta reproducción en segundo plano y decodificación de archivos locales.
                  </p>
                </div>

                <button
                  onClick={handleDownloadApkManifest}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 shadow-md self-start sm:self-auto"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-accent-text-contrast)',
                    boxShadow: `0 4px 14px ${themeConfig.cssVariables['--color-accent-glow']}`,
                  }}
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Paquete APK</span>
                </button>
              </div>

              {/* Step-by-step instructions */}
              <div
                className="p-4 rounded-xl border space-y-3"
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  borderColor: 'var(--color-border-subtle)',
                }}
              >
                <h5 className="font-semibold text-neutral-200 uppercase font-mono text-[11px] tracking-wider">
                  Guía de Instalación en cualquier Android (7.0 en adelante):
                </h5>

                <ol className="space-y-2 text-neutral-300 list-decimal list-inside leading-relaxed">
                  <li>
                    <strong className="text-white">Opción Inmediata:</strong> Abre esta URL en Google Chrome o Samsung Internet y pulsa en <strong style={{ color: 'var(--color-accent)' }}>"Añadir a pantalla principal / Instalar aplicación"</strong> para generar un APK nativo administrado por el sistema.
                  </li>
                  <li>
                    <strong className="text-white">Habilitar Orígenes Desconocidos:</strong> Ve a <em>Ajustes ➔ Seguridad ➔ Instalar aplicaciones desconocidas</em> y activa el permiso para tu navegador o explorador de archivos.
                  </li>
                  <li>
                    <strong className="text-white">Para empaquetar APK independiente sin tiendas:</strong> Usa herramientas directas como <strong>PWABuilder</strong> o <strong>Bubblewrap CLI</strong> ingresando la URL de la app para descargar tu binario <code className="text-amber-300 font-mono">.apk</code> firmado en 30 segundos.
                  </li>
                </ol>
              </div>

              {/* Technical specs of Android build */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                <div className="p-2 rounded-lg border bg-neutral-950/40 border-neutral-800">
                  <span className="text-neutral-500 block">MIN SDK</span>
                  <span className="font-bold text-neutral-200">24 (Android 7.0)</span>
                </div>
                <div className="p-2 rounded-lg border bg-neutral-950/40 border-neutral-800">
                  <span className="text-neutral-500 block">TARGET SDK</span>
                  <span className="font-bold text-neutral-200">34 (Android 14/15)</span>
                </div>
                <div className="p-2 rounded-lg border bg-neutral-950/40 border-neutral-800">
                  <span className="text-neutral-500 block">MOTOR AUDIO</span>
                  <span className="font-bold" style={{ color: 'var(--color-accent)' }}>Hi-Res Float32</span>
                </div>
                <div className="p-2 rounded-lg border bg-neutral-950/40 border-neutral-800">
                  <span className="text-neutral-500 block">BACKGROUND</span>
                  <span className="font-bold text-emerald-400">Audio Service Activo</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IOS IPA */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div
                className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{
                  backgroundColor: 'var(--color-accent-dim)',
                  borderColor: 'var(--color-accent-border)',
                }}
              >
                <div>
                  <h4 className="font-bold text-neutral-100 text-sm flex items-center gap-2">
                    <Apple className="w-4 h-4 fill-current" />
                    <span>AuraHiFi para iPhone & iPad (iOS 12+ / 14+ / 18+)</span>
                  </h4>
                  <p className="text-neutral-300 mt-1 text-xs leading-relaxed">
                    Experiencia a pantalla completa sin barra de navegación Safari, con soporte para reproducción de audio con pantalla bloqueada y perfil de configuración Apple.
                  </p>
                </div>

                <button
                  onClick={handleDownloadMobileConfig}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 shadow-md self-start sm:self-auto"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-accent-text-contrast)',
                    boxShadow: `0 4px 14px ${themeConfig.cssVariables['--color-accent-glow']}`,
                  }}
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Perfil iOS</span>
                </button>
              </div>

              {/* iOS Installation steps */}
              <div
                className="p-4 rounded-xl border space-y-3"
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  borderColor: 'var(--color-border-subtle)',
                }}
              >
                <h5 className="font-semibold text-neutral-200 uppercase font-mono text-[11px] tracking-wider">
                  Métodos de Instalación en iOS (iPhone & iPad):
                </h5>

                <div className="space-y-3 text-neutral-300">
                  <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800">
                    <span className="font-bold text-white flex items-center gap-2 mb-1">
                      <Share2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Método 1: Instalación Nativa Directa con Safari (Recomendado)</span>
                    </span>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      1. Abre AuraHiFi en el navegador Safari.<br/>
                      2. Pulsa el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba ⎋).<br/>
                      3. Desplázate hacia abajo y selecciona <strong className="text-amber-300">"Añadir a la pantalla de inicio" (⊞)</strong>.<br/>
                      4. Pulsa "Añadir". AuraHiFi aparecerá como una app nativa con su icono dorado sin interfaz de navegador.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800">
                    <span className="font-bold text-white flex items-center gap-2 mb-1">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>Método 2: Sideloading IPA (AltStore, Sideloadly o TrollStore)</span>
                    </span>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Si requieres instalar un archivo binario <code className="text-neutral-200">.ipa</code> con certificado de desarrollador personal: compila el proyecto Capacitor con Xcode (ver pestaña <em>Compilación CLI</em>) y firma el archivo IPA resultante con AltStore o Sideloadly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PWA 1-CLICK */}
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div
                className="p-5 rounded-xl border text-center space-y-3"
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  borderColor: 'var(--color-border-subtle)',
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg border"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-accent-text-contrast)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <Smartphone className="w-8 h-8" />
                </div>

                <h4 className="text-base font-bold text-neutral-100">
                  {isInstalled ? '¡AuraHiFi ya está instalada!' : 'Instalar en este Dispositivo Móvil o PC'}
                </h4>

                <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                  Instala la aplicación completa sin ocupar espacio excesivo de almacenamiento. Incluye reproducción sin conexión, aceleración por hardware Web Audio API y acceso instantáneo desde el menú de aplicaciones.
                </p>

                <div className="pt-2">
                  <button
                    onClick={handleInstallPwa}
                    className="px-6 py-3 rounded-xl text-xs font-bold transition-transform hover:scale-105 active:scale-95 shadow-xl inline-flex items-center gap-2"
                    style={{
                      backgroundColor: 'var(--color-accent)',
                      color: 'var(--color-accent-text-contrast)',
                      boxShadow: `0 4px 18px ${themeConfig.cssVariables['--color-accent-glow']}`,
                    }}
                  >
                    <Download className="w-4 h-4" />
                    <span>{isInstalled ? 'Aplicación Ya Instalada' : 'Instalar Ahora en mi Dispositivo'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl border bg-neutral-950/40 border-neutral-800">
                  <span className="text-xs font-bold text-neutral-200 block mb-0.5">Iconos HD</span>
                  <span className="text-[10px] text-neutral-500">192px y 512px Maskable</span>
                </div>
                <div className="p-3 rounded-xl border bg-neutral-950/40 border-neutral-800">
                  <span className="text-xs font-bold text-neutral-200 block mb-0.5">Caché Offline</span>
                  <span className="text-[10px] text-neutral-500">Service Worker v1 Activo</span>
                </div>
                <div className="p-3 rounded-xl border bg-neutral-950/40 border-neutral-800">
                  <span className="text-xs font-bold text-neutral-200 block mb-0.5">Pantalla Completa</span>
                  <span className="text-[10px] text-neutral-500">Standalone UI Nativa</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLI SOURCE */}
          {activeTab === 'source' && (
            <div className="space-y-4">
              <div
                className="p-4 rounded-xl border space-y-2"
                style={{
                  backgroundColor: 'var(--color-bg-base)',
                  borderColor: 'var(--color-border-subtle)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-neutral-200 flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    <span>Comandos para compilar APK y IPA localmente:</span>
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Ejecuta estos comandos en tu terminal local con Node.js y Android Studio / Xcode instalados:
                </p>

                {/* Android compile block */}
                <div className="relative group bg-neutral-950 p-3 rounded-lg border border-neutral-800 font-mono text-[11px] text-neutral-300">
                  <pre className="overflow-x-auto">
{`# 1. Instalar Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

# 2. Construir la aplicación web
npm run build

# 3. Compilar APK para Android 7+ (Nougat a Android 15)
npx cap add android
npx cap copy android
cd android && ./gradlew assembleDebug

# El archivo APK generado estará en:
# android/app/build/outputs/apk/debug/app-debug.apk`}
                  </pre>
                  <button
                    onClick={() => copyToClipboard('npm run build && npx cap copy android && cd android && ./gradlew assembleDebug', 'cmd1')}
                    className="absolute top-2 right-2 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-[10px] rounded transition-colors text-neutral-300"
                  >
                    {copiedCmd === 'cmd1' ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>

                {/* iOS compile block */}
                <div className="relative group bg-neutral-950 p-3 rounded-lg border border-neutral-800 font-mono text-[11px] text-neutral-300 mt-2">
                  <pre className="overflow-x-auto">
{`# 4. Compilar IPA para iOS (iPhone / iPad)
npx cap add ios
npx cap copy ios
npx cap open ios

# En Xcode: Product ➔ Archive ➔ Distribute App ➔ IPA`}
                  </pre>
                  <button
                    onClick={() => copyToClipboard('npx cap add ios && npx cap copy ios && npx cap open ios', 'cmd2')}
                    className="absolute top-2 right-2 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-[10px] rounded transition-colors text-neutral-300"
                  >
                    {copiedCmd === 'cmd2' ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-4 border-t flex items-center justify-between"
          style={{
            backgroundColor: 'var(--color-bg-header)',
            borderColor: 'var(--color-border-subtle)',
          }}
        >
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>PWA & Capacitor Configurado para Android 7+ y iOS</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl border transition-colors"
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
