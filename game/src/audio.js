// Synthesised sound: no audio files, everything comes from WebAudio oscillators
// and filtered noise. Wind howls over the resort, the engine hums with speed,
// sirens wail while the police chase, and short blips mark punches and pickups.

export function createAudio() {
  let ctx = null;
  let master = null;
  let windGain = null;
  let engineOsc = null;
  let engineGain = null;
  let sirenOsc = null;
  let sirenGain = null;
  let muted = false;
  let started = false;

  function ensure() {
    if (started) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);

      // Wind: looped white noise through a low-pass filter.
      const length = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      windGain = ctx.createGain();
      windGain.gain.value = 0.05;
      noise.connect(filter);
      filter.connect(windGain);
      windGain.connect(master);
      noise.start();

      // Engine: a sawtooth whose pitch follows speed.
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 55;
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      const engineFilter = ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.value = 700;
      engineOsc.connect(engineFilter);
      engineFilter.connect(engineGain);
      engineGain.connect(master);
      engineOsc.start();

      // Siren: two alternating tones, quiet until the wanted level rises.
      sirenOsc = ctx.createOscillator();
      sirenOsc.type = 'triangle';
      sirenOsc.frequency.value = 700;
      sirenGain = ctx.createGain();
      sirenGain.gain.value = 0;
      sirenOsc.connect(sirenGain);
      sirenGain.connect(master);
      sirenOsc.start();

      started = true;
      return true;
    } catch {
      return false;
    }
  }

  function blip(freq, duration, type, volume, slideTo) {
    if (!started || muted) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  return {
    unlock() {
      ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    },
    setMuted(value) {
      muted = value;
      if (master) master.gain.value = value ? 0 : 0.5;
    },
    isMuted() {
      return muted;
    },
    /** Called every frame: engine pitch, wind strength, siren wail. */
    update({ speed, driving, wanted, blizzard, time }) {
      if (!started || muted) return;
      try {
        engineGain.gain.value = driving ? 0.05 + Math.min(0.06, speed * 0.00008) : 0;
        engineOsc.frequency.value = 55 + speed * 0.22;
        windGain.gain.value = 0.03 + blizzard * 0.06;
        if (wanted > 0) {
          sirenGain.gain.value = 0.035;
          sirenOsc.frequency.value = Math.sin(time * 4) > 0 ? 820 : 620;
        } else {
          sirenGain.gain.value = 0;
        }
      } catch {
        // Ignore audio errors mid-frame.
      }
    },
    punch() {
      blip(160, 0.12, 'square', 0.18, 70);
    },
    hit() {
      blip(110, 0.18, 'sawtooth', 0.2, 55);
    },
    pickup() {
      blip(660, 0.12, 'sine', 0.2, 990);
    },
    cash() {
      blip(880, 0.1, 'sine', 0.2);
      setTimeout(() => blip(1320, 0.14, 'sine', 0.2), 90);
    },
    missionDone() {
      [523, 659, 784, 1046].forEach((freq, i) => {
        setTimeout(() => blip(freq, 0.18, 'triangle', 0.22), i * 110);
      });
    },
    busted() {
      blip(440, 0.5, 'sawtooth', 0.2, 110);
    },
    crash() {
      blip(90, 0.25, 'square', 0.25, 40);
    },
  };
}
