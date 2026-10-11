/**
 * High-resolution procedural audio buffer synthesizer.
 * Generates true multi-channel studio-grade musical audio in-memory
 * matching the host audio hardware's native sample rate (44.1kHz up to 192kHz).
 */

export function generateSynthesizedTrack(
  ctx: AudioContext,
  trackKey: string,
  durationSec: number = 32
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const numFrames = Math.floor(sampleRate * durationSec);
  const buffer = ctx.createBuffer(2, numFrames, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  if (trackKey === 'aura_nocturne') {
    // Ambient Neo-Classical / Cinematic Piano & String pad
    const chords = [
      [146.83, 220.0, 261.63, 329.63], // Dm9
      [130.81, 196.0, 246.94, 329.63], // Cmaj9
      [116.54, 174.61, 220.0, 261.63], // Bbmaj7
      [110.0, 164.81, 196.0, 246.94]   // Am7
    ];
    const chordDuration = 8; // seconds per chord

    for (let i = 0; i < numFrames; i++) {
      const t = i / sampleRate;
      const chordIndex = Math.floor((t % (chords.length * chordDuration)) / chordDuration);
      const chord = chords[chordIndex];
      const chordTime = t % chordDuration;
      const env = Math.exp(-0.8 * chordTime) * 0.45 + 0.15;

      let sampleL = 0;
      let sampleR = 0;

      // Pad layers with subtle vibrato and stereo chorus
      for (let noteIdx = 0; noteIdx < chord.length; noteIdx++) {
        const freq = chord[noteIdx];
        const detuneL = Math.sin(t * 0.3 + noteIdx) * 0.6;
        const detuneR = Math.cos(t * 0.35 + noteIdx) * 0.6;

        const wave1L = Math.sin(2 * Math.PI * (freq + detuneL) * t);
        const wave2L = 0.5 * Math.sin(4 * Math.PI * (freq * 0.999) * t);
        const wave1R = Math.sin(2 * Math.PI * (freq + detuneR) * t);
        const wave2R = 0.5 * Math.sin(4 * Math.PI * (freq * 1.001) * t);

        const pan = (noteIdx / (chord.length - 1)) * 0.6 - 0.3; // -0.3 to +0.3
        sampleL += (wave1L + wave2L) * (0.5 - pan * 0.5);
        sampleR += (wave1R + wave2R) * (0.5 + pan * 0.5);
      }

      // Arpeggio / High chime sparkle
      const arpSpeed = 4; // 4 notes per second
      const noteInChord = Math.floor(t * arpSpeed) % chord.length;
      const arpFreq = chord[noteInChord] * 2;
      const arpTime = (t * arpSpeed) % 1;
      const arpEnv = Math.exp(-5.0 * arpTime) * 0.35;
      const arpPan = Math.sin(t * 1.5) * 0.5;
      const arpSample = Math.sin(2 * Math.PI * arpFreq * t) + 0.3 * Math.sin(4 * Math.PI * arpFreq * t);

      sampleL += arpSample * arpEnv * (0.5 - arpPan * 0.5);
      sampleR += arpSample * arpEnv * (0.5 + arpPan * 0.5);

      // Deep sub bass warmth
      const subBassFreq = chord[0] * 0.5;
      const sub = Math.sin(2 * Math.PI * subBassFreq * t) * 0.4;
      sampleL += sub;
      sampleR += sub;

      // Master limiting & envelope
      const globalFadeIn = Math.min(1, t / 1.5);
      const globalFadeOut = Math.min(1, (durationSec - t) / 2.0);
      const envelope = globalFadeIn * globalFadeOut * 0.28;

      left[i] = Math.max(-0.95, Math.min(0.95, sampleL * envelope * env));
      right[i] = Math.max(-0.95, Math.min(0.95, sampleR * envelope * env));
    }
  } else if (trackKey === 'cyber_resonance') {
    // Synthwave / Cyberpunk 192kHz Audiophile Test with crisp attack and sub-bass
    const bpm = 110;
    const beatSec = 60 / bpm;
    const notes = [55.0, 65.41, 73.42, 82.41]; // A1, C2, D2, E2 (Bass)

    for (let i = 0; i < numFrames; i++) {
      const t = i / sampleRate;
      const beat = (t / beatSec);
      const step16 = Math.floor(beat * 4);
      const stepTime = (beat * 4) % 1;

      let sampleL = 0;
      let sampleR = 0;

      // Heavy analog sub kick on quarter notes
      const kickTime = beat % 1;
      if (kickTime < 0.4) {
        const kickPitch = 120 * Math.exp(-22 * kickTime) + 42;
        const kickAmp = Math.exp(-8 * kickTime) * 0.8;
        const kickWave = Math.sin(2 * Math.PI * kickPitch * kickTime);
        sampleL += kickWave * kickAmp;
        sampleR += kickWave * kickAmp;
      }

      // Rolling 16th note synth bassline
      const bassNote = notes[Math.floor(beat / 4) % notes.length];
      const bassOctave = (step16 % 4 === 2 || step16 % 4 === 3) ? 2 : 1;
      const bassFreq = bassNote * bassOctave;
      const bassAmp = Math.exp(-6 * stepTime) * 0.5;
      // Rich sawtooth simulation with 5 harmonics
      let bassWave = 0;
      for (let h = 1; h <= 5; h++) {
        bassWave += (1 / h) * Math.sin(2 * Math.PI * (bassFreq * h) * t);
      }
      sampleL += bassWave * bassAmp * 0.7;
      sampleR += bassWave * bassAmp * 0.7;

      // High-Frequency Hi-Res Sparkle Chords
      const chordIndex = Math.floor(beat / 8) % 4;
      const leadFreqs = [440, 523.25, 659.25, 783.99];
      const leadFreq = leadFreqs[chordIndex] * (1 + 0.005 * Math.sin(t * 8));
      const leadPan = Math.sin(t * 2);
      const leadTone = (Math.sin(2 * Math.PI * leadFreq * t) + 0.4 * Math.sin(4 * Math.PI * leadFreq * t)) * 0.25;
      sampleL += leadTone * (0.5 - leadPan * 0.4);
      sampleR += leadTone * (0.5 + leadPan * 0.4);

      // Stereo Hi-Hat (Crisp 10kHz+ noise burst on 8th offbeats)
      const hatBeat = (beat * 2) % 1;
      if (Math.floor(beat * 2) % 2 === 1 && hatBeat < 0.15) {
        const noise = (Math.random() * 2 - 1) * Math.exp(-30 * hatBeat) * 0.18;
        sampleL += noise * 0.8;
        sampleR += noise * 1.2;
      }

      const globalFadeIn = Math.min(1, t / 1.0);
      const globalFadeOut = Math.min(1, (durationSec - t) / 2.0);
      const vol = globalFadeIn * globalFadeOut * 0.32;

      left[i] = Math.max(-0.95, Math.min(0.95, sampleL * vol));
      right[i] = Math.max(-0.95, Math.min(0.95, sampleR * vol));
    }
  } else if (trackKey === 'velvet_jazz') {
    // Warm Rhodes & Acoustic Double Bass Jazz Groove
    const bpm = 84;
    const beatSec = 60 / bpm;

    for (let i = 0; i < numFrames; i++) {
      const t = i / sampleRate;
      const beat = t / beatSec;
      const bar = beat / 4;

      // Rhodes chords (Fmaj7 -> Em7 -> Dm7 -> Cmaj7)
      const progressions = [
        [174.61, 220.0, 261.63, 329.63], // Fmaj7
        [164.81, 196.0, 246.94, 293.66], // Em7
        [146.83, 174.61, 220.0, 261.63], // Dm7
        [130.81, 164.81, 196.0, 246.94]  // Cmaj7
      ];
      const chordIdx = Math.floor(bar) % 4;
      const currentChord = progressions[chordIdx];
      const strokeTime = (beat % 2);
      const rhodesEnv = Math.exp(-2.2 * strokeTime) * 0.4;

      let rhodesL = 0;
      let rhodesR = 0;
      for (let k = 0; k < currentChord.length; k++) {
        const f = currentChord[k];
        // Bell-like Rhodes tone with fundamental + soft 2nd/3rd/4th harmonics
        const rTone = Math.sin(2 * Math.PI * f * t) +
          0.3 * Math.sin(4 * Math.PI * f * t) +
          0.1 * Math.sin(6 * Math.PI * f * t);
        const pan = (k % 2 === 0 ? -0.3 : 0.3);
        rhodesL += rTone * (0.5 - pan);
        rhodesR += rTone * (0.5 + pan);
      }

      // Walking Acoustic Bass
      const bassBeats = [65.41, 73.42, 82.41, 87.31];
      const bassFreq = bassBeats[Math.floor(beat) % 4] * 0.75;
      const bassPluck = (beat % 1);
      const bassEnv = Math.exp(-3.5 * bassPluck) * 0.55;
      const bassWave = Math.sin(2 * Math.PI * bassFreq * t) + 0.35 * Math.sin(4 * Math.PI * bassFreq * t);

      // Warm vinyl crackle simulation
      const crackle = (Math.random() > 0.997 ? (Math.random() * 2 - 1) * 0.04 : 0);

      const mixL = (rhodesL * rhodesEnv + bassWave * bassEnv + crackle) * 0.35;
      const mixR = (rhodesR * rhodesEnv + bassWave * bassEnv + crackle) * 0.35;

      const fade = Math.min(1, t / 1.5) * Math.min(1, (durationSec - t) / 2.0);
      left[i] = Math.max(-0.95, Math.min(0.95, mixL * fade));
      right[i] = Math.max(-0.95, Math.min(0.95, mixR * fade));
    }
  } else {
    // Binaural 432Hz Golden Ratio (Hi-Res Soundstage)
    for (let i = 0; i < numFrames; i++) {
      const t = i / sampleRate;
      const baseFreq = 432.0; // Sacred tuning / Solfeggio
      const binauralBeat = 7.83; // Schumann resonance (7.83 Hz)

      // Left ear: 432 Hz, Right ear: 432 + 7.83 Hz
      const toneL = Math.sin(2 * Math.PI * baseFreq * t);
      const toneR = Math.sin(2 * Math.PI * (baseFreq + binauralBeat) * t);

      // Warm harmonic sub-drone: 216Hz and 108Hz
      const subDrone = 0.5 * Math.sin(2 * Math.PI * 216.0 * t) + 0.3 * Math.sin(2 * Math.PI * 108.0 * t);

      // Shimmer overtone (432 * 1.5 = 648 Hz, 432 * 2 = 864 Hz)
      const shimmer = 0.2 * Math.sin(2 * Math.PI * 648.0 * t + Math.sin(t * 0.5)) +
                      0.15 * Math.sin(2 * Math.PI * 864.0 * t);

      // Slow breathing swell
      const breath = 0.7 + 0.3 * Math.sin(t * 0.4);

      const fade = Math.min(1, t / 2.0) * Math.min(1, (durationSec - t) / 2.5);
      const mixL = (toneL * 0.4 + subDrone * 0.4 + shimmer * 0.2) * breath * fade * 0.4;
      const mixR = (toneR * 0.4 + subDrone * 0.4 + shimmer * 0.2) * breath * fade * 0.4;

      left[i] = Math.max(-0.95, Math.min(0.95, mixL));
      right[i] = Math.max(-0.95, Math.min(0.95, mixR));
    }
  }

  return buffer;
}
