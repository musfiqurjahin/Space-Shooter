/* ═══════════════════════════════════════════════════════════════════════════
  #3  WEB AUDIO ENGINE
   ─────────────────────
   All sounds are synthesized in real-time using the Web Audio API.
   No external audio files are needed — pure oscillators, noise buffers,
   filters, and gain envelopes.
 
   Architecture:
     AC (AudioContext) → sfxGain → destination
                       → musicGain → destination
   Separate gain buses let volume sliders control music/sfx independently.
   ═══════════════════════════════════════════════════════════════════════════ */

// One shared AudioContext for all audio
const AC = new (window.AudioContext || window.webkitAudioContext)();

// Master enable flags (toggled from Settings)
let musicOn = true, sfxOn = true;

/** Create a GainNode connected to speakers, return it */
function makeGain(val) {
    const g = AC.createGain();
    g.gain.value = val;
    g.connect(AC.destination);
    return g;
}

const musicGain = makeGain(0.40); // music bus — 40% volume
const sfxGain = makeGain(0.70); // SFX bus  — 70% volume

// ── Background Music ──────────────────────────────────────────────────────
// Procedural arpeggio: sawtooth oscillator steps through a pentatonic
// note sequence at BPM = 132, with a sustained bass drone underneath.
let musicNodes = []; // live nodes so stopMusic() can terminate them
let musicTO;         // setTimeout handle for arpeggio scheduler

function startMusic() {
    stopMusic();
    if (!musicOn) return;

    // A-minor pentatonic frequencies in Hz
    const notes = [55, 73.4, 87.3, 110, 146.8, 174.6, 220, 293.7];
    let step = 0;
    const beat = 60 / 132; // seconds per beat at 132 BPM

    // Recursive tick: plays one sawtooth note, schedules next beat
    function tick() {
        if (!musicOn) return;
        const osc = AC.createOscillator();
        const env = AC.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = notes[step % notes.length] * (step > 7 ? 2 : 1);
        env.gain.setValueAtTime(0.18, AC.currentTime);
        env.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + beat * 0.8);
        osc.connect(env);
        env.connect(musicGain);
        osc.start(); osc.stop(AC.currentTime + beat);
        step++;
        musicTO = setTimeout(tick, beat * 1000);
    }

    // Continuous bass drone — A0 (27.5 Hz) spacey rumble
    const bass = AC.createOscillator();
    const bassEnv = AC.createGain();
    bass.type = 'sine'; bass.frequency.value = 27.5;
    bassEnv.gain.value = 0.12;
    bass.connect(bassEnv); bassEnv.connect(musicGain);
    bass.start();
    musicNodes.push(bass);

    tick(); // kick off arpeggio
}

function stopMusic() {
    clearTimeout(musicTO);
    musicNodes.forEach(n => { try { n.stop(); } catch (e) { } });
    musicNodes = [];
}

// ── SFX: Laser shot — square wave sweep high→low ──────────────────────
function sfxShoot() {
    if (!sfxOn) return;
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(900, AC.currentTime);
    o.frequency.exponentialRampToValueAtTime(200, AC.currentTime + 0.08);
    g.gain.setValueAtTime(0.22, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + 0.09);
    o.connect(g); g.connect(sfxGain);
    o.start(); o.stop(AC.currentTime + 0.1);
}

// ── SFX: Big explosion — low-pass noise burst ─────────────────────────
function sfxExplodeBig() {
    if (!sfxOn) return;
    const buf = AC.createBuffer(1, AC.sampleRate * 0.35, AC.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.5);
    const s = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 400;
    s.buffer = buf; g.gain.value = 0.6;
    s.connect(f); f.connect(g); g.connect(sfxGain); s.start();
}

// ── SFX: Small explosion — bandpass noise burst ───────────────────────
function sfxExplodeSmall() {
    if (!sfxOn) return;
    const buf = AC.createBuffer(1, AC.sampleRate * 0.18, AC.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    const s = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 700;
    s.buffer = buf; g.gain.value = 0.35;
    s.connect(f); f.connect(g); g.connect(sfxGain); s.start();
}

// ── SFX: Shield ping — rising sine ───────────────────────────────────
function sfxShield() {
    if (!sfxOn) return;
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(400, AC.currentTime);
    o.frequency.exponentialRampToValueAtTime(800, AC.currentTime + 0.12);
    g.gain.setValueAtTime(0.18, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + 0.14);
    o.connect(g); g.connect(sfxGain);
    o.start(); o.stop(AC.currentTime + 0.15);
}

// ── SFX: Ship death — long low noise burst ───────────────────────────
function sfxDeath() {
    if (!sfxOn) return;
    const buf = AC.createBuffer(1, AC.sampleRate * 0.6, AC.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 0.8);
    const s = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 250;
    s.buffer = buf; g.gain.value = 0.7;
    s.connect(f); f.connect(g); g.connect(sfxGain); s.start();
}

// ── SFX: Level up — ascending triangle fanfare ────────────────────────
function sfxLevelUp() {
    if (!sfxOn) return;
    [261.6, 329.6, 392, 523.2].forEach((n, i) => {
        const o = AC.createOscillator(), g = AC.createGain();
        o.type = 'triangle'; o.frequency.value = n;
        g.gain.setValueAtTime(0, AC.currentTime + i * 0.1);
        g.gain.linearRampToValueAtTime(0.2, AC.currentTime + i * 0.1 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + i * 0.1 + 0.2);
        o.connect(g); g.connect(sfxGain);
        o.start(AC.currentTime + i * 0.1);
        o.stop(AC.currentTime + i * 0.1 + 0.22);
    });
}

// ── SFX: Powerup collect — rising sine arpeggio ───────────────────────
function sfxPowerup() {
    if (!sfxOn) return;
    [300, 450, 600, 900].forEach((n, i) => {
        const o = AC.createOscillator(), g = AC.createGain();
        o.type = 'sine'; o.frequency.value = n;
        g.gain.setValueAtTime(0.15, AC.currentTime + i * 0.06);
        g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + i * 0.06 + 0.12);
        o.connect(g); g.connect(sfxGain);
        o.start(AC.currentTime + i * 0.06);
        o.stop(AC.currentTime + i * 0.06 + 0.13);
    });
}

// ── SFX: Engine — sustained oscillator, ramps up on thrust ───────────
// One sawtooth oscillator is created when thrust starts and destroyed
// when it stops, giving a smooth rocket-engine rumble with no choppiness.
let engineOsc = null;
let engineGainNode = null;
let engineOn = false;

function startEngineSound() {
    if (!sfxOn || engineOn) return;
    engineOn = true;

    engineGainNode = AC.createGain();
    engineGainNode.gain.setValueAtTime(0, AC.currentTime);
    engineGainNode.connect(sfxGain);

    engineOsc = AC.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.setValueAtTime(55, AC.currentTime);
    engineOsc.connect(engineGainNode);
    engineOsc.start();

    // Ramp gain up — engine "gearing up" effect
    engineGainNode.gain.linearRampToValueAtTime(0.09, AC.currentTime + 0.08);

    sfxThrustStart(); // one-shot ignition whoosh
}

function stopEngineSound() {
    if (!engineOn) return;
    engineOn = false;
    if (engineGainNode) {
        engineGainNode.gain.linearRampToValueAtTime(0, AC.currentTime + 0.12);
        const g = engineGainNode;
        setTimeout(() => { try { g.disconnect(); } catch (e) { } }, 200);
    }
    if (engineOsc) { engineOsc.stop(AC.currentTime + 0.15); engineOsc = null; }
    engineGainNode = null;
}

/**
 * One-shot ignition whoosh — layered sawtooth sweep + noise burst.
 * Plays when the player first presses W.
 */
function sfxThrustStart() {
    if (!sfxOn) return;
    // Layer 1: sweeping oscillator
    const o1 = AC.createOscillator(), g1 = AC.createGain();
    o1.type = 'sawtooth';
    o1.frequency.setValueAtTime(80, AC.currentTime);
    o1.frequency.linearRampToValueAtTime(220, AC.currentTime + 0.18);
    o1.frequency.linearRampToValueAtTime(110, AC.currentTime + 0.35);
    g1.gain.setValueAtTime(0, AC.currentTime);
    g1.gain.linearRampToValueAtTime(0.18, AC.currentTime + 0.1);
    g1.gain.linearRampToValueAtTime(0, AC.currentTime + 0.38);
    o1.connect(g1); g1.connect(sfxGain);
    o1.start(); o1.stop(AC.currentTime + 0.4);
    // Layer 2: short bandpass noise burst
    const buf = AC.createBuffer(1, Math.floor(AC.sampleRate * 0.25), AC.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.2);
    const s = AC.createBufferSource(), gn = AC.createGain(), f = AC.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 180;
    s.buffer = buf; gn.gain.value = 0.28;
    s.connect(f); f.connect(gn); gn.connect(sfxGain); s.start();
}

/** Resume suspended AudioContext on first user gesture (browser policy) */
function resumeAC() { if (AC.state === 'suspended') AC.resume(); }