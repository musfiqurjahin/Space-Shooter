/* ═══════════════════════════════════════════════════════════════════════════
          ASTEROID BLASTER — Full JavaScript Edition
          ───────────────────────────────────────────────────────────────────────────
          ARCHITECTURE OVERVIEW
          ─────────────────────
          This file is intentionally ~95% JavaScript. HTML has only the bare
          minimum (DOCTYPE, head, canvas). Everything else — CSS injection, DOM
          construction, game logic, audio engine, rendering — is built in JS.
       
          Sections:
            §1  CSS INJECTION          — All styles built as a JS string, injected via <style>
            §2  DOM BUILDER            — HUD, overlay, shield bar, settings panel, buttons
            §3  WEB AUDIO ENGINE       — Procedural SFX + music (no audio files)
            §4  CANVAS / RESIZE        — Canvas sizing and viewport tracking
            §5  SETTINGS & TOGGLES     — Settings panel wiring, toggle helpers
            §6  FULLSCREEN             — Fullscreen API wrapper
            §7  HI-SCORE PERSISTENCE   — localStorage load/save
            §8  GAME STATE VARS        — All mutable game state in one place
            §9  MATH HELPERS           — rnd, rndInt, wrap, clamp, etc.
            §10 STAR FIELD             — Background parallax twinkle stars
            §11 SHIP FACTORY           — makeShip() returns a fresh player object
            §12 ASTEROID FACTORY       — Vertex generation + spawnAsteroid()
            §13 POWERUP FACTORY        — spawnPowerup() with type definitions
            §14 LEVEL INIT             — Reset arrays, spawn wave, respawn ship
            §15 UI HELPERS             — scorePopup, levelFlash, addShake
            §16 GAME FLOW              — startGame / pauseGame / resumeGame / quitGame
            §17 KEYBOARD INPUT         — keydown / keyup handlers + mobile touch
            §18 TOUCH / MOBILE CONTROLS— Virtual D-pad for phones/tablets
            §19 UPDATE LOOP            — Physics, collisions, state machine (runs every frame)
            §20 DRAW LOOP              — Canvas 2D rendering (runs every frame after update)
            §21 MAIN LOOP              — requestAnimationFrame wrapper
            §22 IDLE ANIMATION LOOP    — Stars-only loop on title/pause/gameover screens
          ═══════════════════════════════════════════════════════════════════════════ */



/* ═══════════════════════════════════════════════════════════════════════════
   §2  DOM BUILDER
   ─────────────────
   All HTML elements are created and configured via JavaScript.
   This keeps the HTML file minimal — only <canvas id="gc"> exists in body.
 
   Helper el(tag, attrs, parent) creates an element, sets attributes/text,
   appends to parent, and returns the element. Used throughout.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Create an element, apply attrs/text, optionally append to parent */
function el(tag, attrs = {}, parent = null) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'class') node.className = v;
        else node.setAttribute(k, v);
    }
    if (parent) parent.appendChild(node);
    return node;
}

/** Shorthand: create element with class + text */
function span(cls, txt, parent) { return el('span', { class: cls, text: txt }, parent); }

// ── Build DOM ────────────────────────────────────────────────────────────

// 1. HUD Bar
const hud = el('div', { id: 'hud' }, document.body);
const hudLeft = el('div', { class: 'hud-left' }, hud);
const hudCenter = el('div', { class: 'hud-center' }, hud);
const hudRight = el('div', { class: 'hud-right' }, hud);

function makeHudStat(parent, labelTxt, id) {
    const stat = el('div', { class: 'hud-stat' }, parent);
    span('hud-label', labelTxt, stat);
    return span('hud-val', '0', stat); // returns the value <span> so we can update it
}

const scoreEl = makeHudStat(hudLeft, 'Score', 'scoreEl');
const hiEl = makeHudStat(hudLeft, 'Hi-Score', 'hiEl');

// Level badge (center)
const levelBadge = el('div', { id: 'levelBadge' }, hudCenter);
span('hud-label', 'Level', levelBadge);
const levelEl = span('hud-val', '1', levelBadge);

const livesEl = makeHudStat(hudRight, 'Lives', 'livesEl');
const multEl = makeHudStat(hudRight, 'Mult', 'multEl');
multEl.textContent = '×1';

// 2. Shield Bar (bottom-center)
const shieldBar = el('div', { id: 'shieldBar' }, document.body);
span('shield-label', 'SHIELD', shieldBar);
const sDots = [0, 1, 2].map(() => el('div', { class: 'sDot' }, shieldBar));

// 3. Top buttons (fullscreen + settings)
const topButtons = el('div', { id: 'topButtons' }, document.body);
const fsBtn = el('button', { class: 'icon-btn', text: '⛶', title: 'Fullscreen' }, topButtons);
const settingsBtn = el('button', { class: 'icon-btn', text: '⚙', title: 'Settings' }, topButtons);

// 4. Level flash overlay
const levelFlash = el('div', { id: 'levelFlash' }, document.body);
const levelFlashText = el('span', {}, levelFlash);

// 5. Scanlines
el('div', { id: 'scanlines' }, document.body);

// 6. Main overlay (start / pause / game over)
const overlay = el('div', { id: 'overlay' }, document.body);
const overlayBox = el('div', { id: 'overlayBox' }, overlay);
const oTitle = el('h2', { text: 'ASTEROID BLASTER' }, overlayBox);
const oSub = el('div', { class: 'sub', text: 'ARCADE EDITION' }, overlayBox);
const oMsg = el('p', { html: 'Destroy all asteroids to advance.<br>Big rocks split — finish every piece!<br>Shield (S) blocks 3 hits. Combos multiply score!' }, overlayBox);

const mainBtnRow = el('div', { class: 'btn-row' }, overlayBox);
const startBtn = el('button', { class: 'ovl-btn primary', text: '▶ PLAY' }, mainBtnRow);

// Pause-only buttons (hidden until paused)
const pauseButtons = el('div', { style: 'display:none' }, overlayBox);
el('div', { class: 'divider' }, pauseButtons);
const pauseBtnRow = el('div', { class: 'btn-row' }, pauseButtons);
const resumeBtn = el('button', { class: 'ovl-btn primary', text: '▶ RESUME' }, pauseBtnRow);
const quitBtn = el('button', { class: 'ovl-btn danger', text: '✕ QUIT' }, pauseBtnRow);

// Keyboard hint row
const keyHint = el('div', { class: 'key-hint' }, overlayBox);
keyHint.innerHTML = `<span class="key">A</span>/<span class="key">D</span> rotate &nbsp;
  <span class="key">W</span> thrust &nbsp;
  <span class="key">Space</span> fire &nbsp;
  <span class="key">S</span> shield &nbsp;
  <span class="key">Esc</span> pause`;

// 7. Settings Panel
const settingsPanel = el('div', { id: 'settingsPanel' }, document.body);
const settingsBox = el('div', { id: 'settingsBox' }, settingsPanel);
el('h3', { text: '⚙ SETTINGS' }, settingsBox);

/** Build one toggle row: returns the track element */
function buildToggleRow(parent, label) {
    const row = el('div', { class: 'setting-row' }, parent);
    span('', label, row); // label span (empty class = inherits)
    const track = el('div', { class: 'toggle-track on' }, row);
    el('div', { class: 'toggle-knob' }, track);
    return track;
}

/** Build one volume slider row: returns the input element */
function buildVolumeRow(parent, label, defVal) {
    const row = el('div', { class: 'volume-row' }, parent);
    span('', label, row);
    const inp = el('input', { type: 'range', min: '0', max: '100', value: String(defVal) }, row);
    return inp;
}

const musicToggle = buildToggleRow(settingsBox, 'Music');
const sfxToggle = buildToggleRow(settingsBox, 'Sound FX');
const musicVolInput = buildVolumeRow(settingsBox, 'Music Vol', 40);
const sfxVolInput = buildVolumeRow(settingsBox, 'SFX Vol', 70);
el('div', { class: 'divider' }, settingsBox);
const scanlinesToggle = buildToggleRow(settingsBox, 'Scanlines');
const shakeToggle = buildToggleRow(settingsBox, 'Screenshake');
const particlesToggle = buildToggleRow(settingsBox, 'Particles');
el('div', { class: 'divider' }, settingsBox);
const settingsBtnRow = el('div', { class: 'btn-row' }, settingsBox);
const fsFromSettings = el('button', { class: 'ovl-btn', text: '⛶ Fullscreen' }, settingsBtnRow);
const resetHiScoreBtn = el('button', { class: 'ovl-btn danger', text: 'Reset Hi-Score' }, settingsBtnRow);
const closeSettingsBtn = el('button', { class: 'close-settings', text: 'CLOSE' }, settingsBox);

// 8. Mobile Virtual Controls
const mobileControls = el('div', { id: 'mobileControls' }, document.body);

// Left D-pad (rotate + thrust)
const dpad = el('div', { class: 'dpad' }, mobileControls);
const dUp = el('div', { class: 'dpad-btn', id: 'dUp', text: '▲' }, dpad);
const dLeft = el('div', { class: 'dpad-btn', id: 'dLeft', text: '◀' }, dpad);
const dRight = el('div', { class: 'dpad-btn', id: 'dRight', text: '▶' }, dpad);
const dDown = el('div', { class: 'dpad-btn', id: 'dDown', text: '▼' }, dpad);

// Right action pad (fire + shield)
const apad = el('div', { class: 'apad' }, mobileControls);
const aFire = el('div', { class: 'dpad-btn', id: 'aFire', text: '🔥' }, apad);
const aShield = el('div', { class: 'dpad-btn', id: 'aShield', text: '🛡' }, apad);
const aThrust = el('div', { class: 'dpad-btn', id: 'aThrust', text: '🚀' }, apad);

// Show mobile controls on touch devices
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    mobileControls.classList.add('visible');
}


/* ═══════════════════════════════════════════════════════════════════════════
   §3  WEB AUDIO ENGINE
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


/* ═══════════════════════════════════════════════════════════════════════════
   §4  CANVAS / RESIZE
   ─────────────────────
   The canvas was already in the HTML (<canvas id="gc">). We size it to fill
   the full viewport and listen for resize events.
   ═══════════════════════════════════════════════════════════════════════════ */

const canvas = document.getElementById('space');
const ctx = canvas.getContext('2d');
let W, H; // viewport dimensions — updated every resize

function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);


/* ═══════════════════════════════════════════════════════════════════════════
   §5  SETTINGS & TOGGLES
   ──────────────────────
   makeToggle(trackEl, initial, callback) wires click → toggle state → CSS.
   Volume sliders update the GainNode in real time.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Wire a toggle switch element.
 * @param {HTMLElement} trackEl — the .toggle-track div
 * @param {boolean}     initial — starting state
 * @param {Function}    cb      — called with new boolean state on each click
 * @returns {()=>boolean} — getter for current state
 */
function makeToggle(trackEl, initial, cb) {
    let state = initial;
    trackEl.classList.toggle('on', state);
    trackEl.addEventListener('click', () => {
        state = !state;
        trackEl.classList.toggle('on', state);
        cb(state);
    });
    return () => state;
}

// Wire all settings toggles
makeToggle(musicToggle, true, v => { musicOn = v; v ? startMusic() : stopMusic(); });
makeToggle(sfxToggle, true, v => { sfxOn = v; });
makeToggle(scanlinesToggle, true, v => { document.getElementById('scanlines').style.display = v ? 'block' : 'none'; });
makeToggle(shakeToggle, true, v => { shakeEnabled = v; });
makeToggle(particlesToggle, true, v => { particlesEnabled = v; });

// Volume sliders → update gain nodes live
musicVolInput.addEventListener('input', e => { musicGain.gain.value = e.target.value / 100; });
sfxVolInput.addEventListener('input', e => { sfxGain.gain.value = e.target.value / 100; });

// Reset hi-score
resetHiScoreBtn.addEventListener('click', () => {
    hiScore = 0; hiEl.textContent = '0'; localStorage.removeItem('abHi');
});

// Open / close settings panel
settingsBtn.addEventListener('click', () => settingsPanel.classList.add('open'));
closeSettingsBtn.addEventListener('click', () => settingsPanel.classList.remove('open'));
settingsPanel.addEventListener('click', e => { if (e.target === settingsPanel) settingsPanel.classList.remove('open'); });


/* ═══════════════════════════════════════════════════════════════════════════
   §6  FULLSCREEN
   ───────────────
   Wraps the Fullscreen API; updates button labels on change event.
   ═══════════════════════════════════════════════════════════════════════════ */

function toggleFS() {
    resumeAC();
    if (!document.fullscreenElement)
        document.documentElement.requestFullscreen().catch(() => { });
    else
        document.exitFullscreen();
}
fsBtn.addEventListener('click', toggleFS);
fsFromSettings.addEventListener('click', toggleFS);
document.addEventListener('fullscreenchange', () => {
    const isFS = !!document.fullscreenElement;
    fsBtn.textContent = isFS ? '⮹' : '⛶';
    fsFromSettings.textContent = isFS ? '⮹ Exit Fullscreen' : '⛶ Fullscreen';
});


/* ═══════════════════════════════════════════════════════════════════════════
   §7  HI-SCORE PERSISTENCE
   ─────────────────────────
   Stored in localStorage so it survives page refreshes.
   ═══════════════════════════════════════════════════════════════════════════ */

let hiScore = parseInt(localStorage.getItem('abHi') || '0');
hiEl.textContent = hiScore;


/* ═══════════════════════════════════════════════════════════════════════════
   §8  GAME STATE VARIABLES
   ─────────────────────────
   All mutable game state is declared here in one place so it's easy to
   find and reset on a new game.
   ═══════════════════════════════════════════════════════════════════════════ */

let keys = {};                     // held keyboard keys: { 'KeyW': true, ... }
let gameState = 'idle';            // 'idle' | 'playing' | 'paused' | 'dead'

let score = 0, lives = 3, level = 1;

// Object arrays
let ship, bullets, asteroids, particles, stars, powerups;

// Timers / cooldowns (in frames at ~60fps)
let shieldTimer = 0;             // used to drain shield slowly (not instantly)
let shootCooldown = 0;             // frames until next shot is allowed

// Combo / multiplier
let combo = 0, comboTimer = 0, multiplier = 1;

// Feature flags (toggled by settings panel)
let shakeEnabled = true, particlesEnabled = true;

// Screen shake state
let shakeX = 0, shakeY = 0, shakeMag = 0;

// Active powerup timers (frames remaining)
let multishotActive = 0, rapidActive = 0;

// requestAnimationFrame handle
let raf;

// Global frame counter for twinkling, shield pulses, etc.
let t = 0;

const rocketImg = new Image();
rocketImg.src = 'rocket.png'; // or paste base64 string here


/* ═══════════════════════════════════════════════════════════════════════════
   §9  MATH HELPERS
   ─────────────────
   Small utility functions used throughout the game.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Random float in [a, b) */
const rnd = (a, b) => Math.random() * (b - a) + a;
/** Random integer in [a, b] (inclusive) */
const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
/** Wrap value within [0, max) — used for toroidal space wrap-around */
const wrap = (v, max) => ((v % max) + max) % max;
/** Clamp value between lo and hi */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));


/* ═══════════════════════════════════════════════════════════════════════════
   §10 STAR FIELD
   ───────────────
   180 stars with individual twinkle speed, brightness, radius, and
   occasional colour (15% chance of a blue/purple tint).
   makeStars() rebuilds the field after each resize (called from startGame).
   ═══════════════════════════════════════════════════════════════════════════ */

function makeStars() {
    stars = Array.from({ length: 180 }, () => ({
        x: rnd(0, W),
        y: rnd(0, H),
        r: rnd(0.3, 1.8),
        brightness: rnd(0.1, 0.85),
        twinkleSpeed: rnd(0.008, 0.035),
        twinkleOffset: rnd(0, Math.PI * 2),
        hue: Math.random() < 0.15 ? rnd(200, 260) : 0  // 15% colored
    }));
}


/* ═══════════════════════════════════════════════════════════════════════════
   §11 SHIP FACTORY
   ─────────────────
   makeShip() returns a fresh player object at the center of the screen.
   Called at game start and after each respawn.
   ═══════════════════════════════════════════════════════════════════════════ */

function makeShip() {
    return {
        x: W / 2, y: H / 2,       // start at center
        vx: 0, vy: 0,              // at rest
        angle: -Math.PI / 2,       // pointing upward (angle 0 = right)
        thrusting: false,
        shieldLeft: 3,             // 3 shield charges max
        shieldOn: false,
        inv: 0                     // invincibility frames after respawn
    };
}


/* ═══════════════════════════════════════════════════════════════════════════
   §12 ASTEROID FACTORY
   ─────────────────────
   asteroidVerts(r) generates a random polygon with jagged radii.
   spawnAsteroid(x, y, size) returns a full asteroid object.
     size: 3 = large (r≈46), 2 = medium (r≈26), 1 = small (r≈13)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Generate polygon vertices for an asteroid.
 * Each vertex is at angle (i/n × 2π) with radius randomised ±40%.
 * @param {number} r — base radius
 * @returns {Array<[number,number]>} — array of [x,y] vertex pairs
 */
function asteroidVerts(r) {
    const n = rndInt(7, 13);  // 7–13 sides
    return Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        const dr = r * rnd(0.6, 1.4); // jag
        return [Math.cos(a) * dr, Math.sin(a) * dr];
    });
}

/**
 * Spawn a single asteroid at position (x, y) of the given size tier.
 * Speed scales with level so higher levels are harder.
 */
function spawnAsteroid(x, y, size) {
    const r = size === 3 ? 46 : size === 2 ? 26 : 13;
    const angle = rnd(0, Math.PI * 2);
    const spd = rnd(0.5, 1.4) * (1 + (level - 1) * 0.08);
    return {
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size, r,
        verts: asteroidVerts(r),
        rot: rnd(0, Math.PI * 2),
        rotSpeed: rnd(-0.03, 0.03),
        glow: rnd(0, Math.PI * 2),
        glowSpeed: rnd(0.025, 0.065)
    };
}


/* ═══════════════════════════════════════════════════════════════════════════
   §13 POWERUP FACTORY
   ────────────────────
   Four powerup types with distinct colours and icons:
     shield    — +1 shield charge
     multishot — 3-way spread for 5 seconds
     rapid     — halved shoot cooldown for 5 seconds
     bomb      — instantly clears all asteroids
   spawnPowerup(x, y) picks a random type and creates a drifting pickup.
   ═══════════════════════════════════════════════════════════════════════════ */

const POWERUP_TYPES = ['shield', 'multishot', 'rapid', 'bomb'];
const POWERUP_COLORS = { shield: '#3399FF', multishot: '#FFD700', rapid: '#FF6633', bomb: '#CC44FF' };
const POWERUP_ICONS = { shield: '⬡', multishot: '✦', rapid: '►', bomb: '✸' };

function spawnPowerup(x, y) {
    const type = POWERUP_TYPES[rndInt(0, POWERUP_TYPES.length - 1)];
    return {
        x, y,
        vx: rnd(-0.5, 0.5), vy: rnd(-0.5, 0.5),
        type,
        life: 600,           // disappears after ~10 seconds
        rot: 0, rotSpeed: rnd(0.02, 0.04),
        pulse: rnd(0, Math.PI * 2)
    };
}


/* ═══════════════════════════════════════════════════════════════════════════
   §14 LEVEL INIT
   ───────────────
   Reset all per-level arrays, spawn the asteroid wave, and re-create the
   ship with invincibility frames.
   Wave size: 3 + (level - 1), so level 1 has 3 rocks, level 5 has 7, etc.
   ═══════════════════════════════════════════════════════════════════════════ */

function initLevel() {
    bullets = []; particles = []; powerups = [];
    shieldTimer = 0; shootCooldown = 0;
    multishotActive = 0; rapidActive = 0;
    combo = 0; comboTimer = 0; multiplier = 1;
    multEl.textContent = '×1';

    // Respawn ship in centre with invincibility
    ship = makeShip();
    ship.inv = 180;

    // Spawn 3 + (level-1) large asteroids, each at least 150px from centre
    asteroids = [];
    const count = 3 + (level - 1);
    for (let i = 0; i < count; i++) {
        let x, y;
        do { x = rnd(0, W); y = rnd(0, H); }
        while (Math.hypot(x - W / 2, y - H / 2) < 150);
        asteroids.push(spawnAsteroid(x, y, 3));
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   §15 UI HELPERS
   ───────────────
   Small DOM/canvas utilities used during gameplay.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Create a floating score number that animates upward from (x, y).
 * The element removes itself after the CSS animation completes.
 */
function scorePopup(x, y, val, col) {
    const d = document.createElement('div');
    d.className = 'score-pop';
    d.style.cssText = `left:${x}px;top:${y}px;color:${col || '#CCD6FF'};text-shadow:0 0 12px ${col || '#CCD6FF'}`;
    d.textContent = (val > 0 ? '+' : '') + val + (multiplier > 1 ? ` ×${multiplier}` : '');
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 1200);
}

/**
 * Flash a large centred message (e.g. "LEVEL 2") for 1.6 seconds.
 * Uses the CSS .show class to fade in/out.
 */
function showLevelFlash(txt) {
    levelFlashText.textContent = txt;
    levelFlash.classList.add('show');
    setTimeout(() => levelFlash.classList.remove('show'), 1600);
}

/**
 * Request a screen shake of the given magnitude.
 * Takes the maximum so overlapping shakes don't stack multiplicatively.
 */
function addShake(mag) {
    if (shakeEnabled) shakeMag = Math.max(shakeMag, mag);
}


/* ═══════════════════════════════════════════════════════════════════════════
   §16 GAME FLOW
   ──────────────
   startGame  — reset everything, begin the game loop
   pauseGame  — freeze the game, show the pause overlay
   resumeGame — un-freeze, hide overlay
   quitGame   — return to title screen
   ═══════════════════════════════════════════════════════════════════════════ */

function startGame() {
    resumeAC();
    score = 0; lives = 3; level = 1;
    scoreEl.textContent = '0'; livesEl.textContent = '3';
    levelEl.textContent = '1'; multEl.textContent = '×1';
    overlay.style.display = 'none';
    pauseButtons.style.display = 'none';
    gameState = 'playing';
    makeStars();
    initLevel();
    startMusic();
    if (raf) cancelAnimationFrame(raf);
    loop(); // start main game loop
}

function pauseGame() {
    if (gameState !== 'playing') return;
    gameState = 'paused';
    stopEngineSound();
    oTitle.textContent = 'PAUSED';
    oSub.textContent = '';
    oMsg.innerHTML = 'Game is paused.<br>';
    startBtn.style.display = 'none';
    pauseButtons.style.display = 'block';
    overlay.style.display = 'flex';
}

function resumeGame() {
    gameState = 'playing';
    overlay.style.display = 'none';
    startBtn.style.display = 'inline-flex';
    pauseButtons.style.display = 'none';
}

function quitGame() {
    gameState = 'idle';
    stopMusic(); stopEngineSound();
    oTitle.textContent = 'ASTEROID BLASTER';
    oSub.textContent = 'ARCADE EDITION';
    oMsg.innerHTML = 'Destroy all asteroids to advance.<br>Big rocks split — finish every piece!<br>Shield (S) blocks 3 hits. Combos multiply score!';
    startBtn.textContent = '▶ PLAY';
    startBtn.style.display = 'inline-block';
    pauseButtons.style.display = 'none';
    overlay.style.display = 'flex';
    if (raf) cancelAnimationFrame(raf);
    idleLoop();
}

// Wire overlay buttons
startBtn.addEventListener('click', () => { resumeAC(); startGame(); });
resumeBtn.addEventListener('click', resumeGame);
quitBtn.addEventListener('click', quitGame);


/* ═══════════════════════════════════════════════════════════════════════════
   §17 KEYBOARD INPUT
   ───────────────────
   Track held keys in the `keys` object.
   Prevent default scrolling for game keys.
   Handle pause / fullscreen / music shortcuts.
   ═══════════════════════════════════════════════════════════════════════════ */

document.addEventListener('keydown', e => {
    keys[e.code] = true;
    // Stop browser scrolling on game control keys
    if (['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD',
        'ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(e.code))
        e.preventDefault();
    // Pause toggle
    if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameState === 'playing') pauseGame();
        else if (gameState === 'paused') resumeGame();
    }
    if (e.code === 'KeyF') toggleFS();
    if (e.code === 'KeyM') { musicOn = !musicOn; musicOn ? startMusic() : stopMusic(); }
});

document.addEventListener('keyup', e => {
    keys[e.code] = false;
    // Release W/ArrowUp → fade engine out
    if (e.code === 'KeyW' || e.code === 'ArrowUp') stopEngineSound();
});


/* ═══════════════════════════════════════════════════════════════════════════
   §18 TOUCH / MOBILE CONTROLS
   ─────────────────────────────
   Virtual buttons map touch events to the same `keys` object used by the
   keyboard handler. This means all game logic works identically for both
   input methods — zero code duplication.
 
   bindBtn(btnEl, keyCode) wires touchstart→keydown and touchend→keyup.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Bind a virtual button to a keyboard key code.
 * Fires the same keydown/keyup events as a real keyboard press.
 * @param {HTMLElement} btnEl  — the button DOM element
 * @param {string}      code   — KeyboardEvent.code string (e.g. 'KeyW')
 */
function bindBtn(btnEl, code) {
    function press(e) {
        e.preventDefault();
        keys[code] = true;
        btnEl.classList.add('pressed');
        // Mirror keyboard flow so SFX / engine triggers work correctly
        if (code === 'KeyW' && !engineOn) startEngineSound();
    }
    function release(e) {
        e.preventDefault();
        keys[code] = false;
        btnEl.classList.remove('pressed');
        if (code === 'KeyW') stopEngineSound();
    }
    btnEl.addEventListener('touchstart', press, { passive: false });
    btnEl.addEventListener('touchend', release, { passive: false });
    btnEl.addEventListener('touchcancel', release, { passive: false });
    // Mouse fallback for desktop testing of mobile UI
    btnEl.addEventListener('mousedown', press);
    btnEl.addEventListener('mouseup', release);
    btnEl.addEventListener('mouseleave', release);
}

// Wire each virtual button to its corresponding key code
bindBtn(dUp, 'KeyW');      // D-pad up    → thrust
bindBtn(dLeft, 'KeyA');      // D-pad left  → rotate left
bindBtn(dRight, 'KeyD');      // D-pad right → rotate right
bindBtn(dDown, 'KeyS');      // D-pad down  → shield
bindBtn(aFire, 'Space');     // Fire button → shoot
bindBtn(aShield, 'KeyS');      // Shield button (duplicate for convenience)
bindBtn(aThrust, 'KeyW');      // Thrust button (duplicate)


/* ═══════════════════════════════════════════════════════════════════════════
   §19 UPDATE LOOP
   ────────────────
   Called once per frame. Handles all game logic:
     • screen shake decay
     • combo timer
     • powerup duration countdown
     • player input → movement
     • rotation, thrust, drag, wrap
     • bullet firing + movement
     • asteroid movement + spin
     • powerup drift
     • particle movement + aging
     • bullet-asteroid collisions → scoring, splitting, debris
     • ship-asteroid collisions   → shield or death
     • ship-powerup collisions    → pickup effects
     • level completion check
     • shield HUD update
   ═══════════════════════════════════════════════════════════════════════════ */

function update() {
    if (gameState !== 'playing') return;
    t++; // global frame counter

    /* ── Screen shake: exponential decay each frame ── */
    shakeMag *= 0.88;
    shakeX = shakeMag * (Math.random() - 0.5) * 2;
    shakeY = shakeMag * (Math.random() - 0.5) * 2;

    /* ── Combo timer: reset combo after 90 idle frames ── */
    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer === 0) { combo = 0; multiplier = 1; multEl.textContent = '×1'; }
    }

    /* ── Powerup duration countdown ── */
    if (multishotActive > 0) multishotActive--;
    if (rapidActive > 0) rapidActive--;

    /* ── Read player input ── */
    const thrustPressed = keys['KeyW'] || keys['ArrowUp'];
    ship.thrusting = thrustPressed;
    ship.shieldOn = (keys['KeyS'] || keys['ArrowDown']) && ship.shieldLeft > 0;

    /* ── Rotation — 0.09 rad/frame (snappier than typical 0.058) ── */
    const ROT = 0.09;
    if (keys['KeyA'] || keys['ArrowLeft']) ship.angle -= ROT;
    if (keys['KeyD'] || keys['ArrowRight']) ship.angle += ROT;

    /* ── Thrust & engine sound ── */
    if (thrustPressed) {
        ship.vx += Math.cos(ship.angle) * 0.22;
        ship.vy += Math.sin(ship.angle) * 0.22;
        if (!engineOn) startEngineSound();

        // Exhaust particles fire backwards from the ship nose
        if (particlesEnabled) {
            for (let k = 0; k < 3; k++) {
                const spread = rnd(-0.45, 0.45);
                const spd = rnd(1.5, 3.5);
                const ta = ship.angle + Math.PI + spread;
                particles.push({
                    x: ship.x + Math.cos(ship.angle + Math.PI) * 14,
                    y: ship.y + Math.sin(ship.angle + Math.PI) * 14,
                    vx: Math.cos(ta) * spd, vy: Math.sin(ta) * spd,
                    life: rndInt(12, 28), maxLife: 22,
                    col: Math.random() < 0.5 ? '#EF9F27' : '#F05020',
                    size: rnd(1.5, 4), type: 'thrust'
                });
            }
        }
    } else {
        if (engineOn) stopEngineSound();
    }

    /* ── Speed cap (6 px/frame) + light drag ── */
    const spd = Math.hypot(ship.vx, ship.vy);
    if (spd > 6) { ship.vx = ship.vx / spd * 6; ship.vy = ship.vy / spd * 6; }
    ship.vx *= 0.983; ship.vy *= 0.983;

    // Toroidal screen wrap
    ship.x = wrap(ship.x + ship.vx, W);
    ship.y = wrap(ship.y + ship.vy, H);

    /* ── Shield drain (holds ~3 seconds before depleting) ── */
    if (ship.shieldOn) {
        shieldTimer++;
        if (shieldTimer >= 3) { ship.shieldLeft = Math.max(0, ship.shieldLeft - 0.01); shieldTimer = 0; }
    }

    if (ship.inv > 0) ship.inv--;

    /* ── Shooting ── */
    const cooldown = rapidActive > 0 ? 5 : 12;
    shootCooldown--;
    if (keys['Space'] && shootCooldown <= 0) {
        const angles = multishotActive > 0
            ? [ship.angle - 0.15, ship.angle, ship.angle + 0.15]
            : [ship.angle];
        angles.forEach(a => {
            bullets.push({
                x: ship.x + Math.cos(a) * 16,
                y: ship.y + Math.sin(a) * 16,
                vx: Math.cos(a) * 10 + ship.vx,
                vy: Math.sin(a) * 10 + ship.vy,
                life: 56
            });
        });
        sfxShoot();
        shootCooldown = cooldown;
    }

    /* ── Move bullets; despawn off-screen ── */
    for (const b of bullets) {
        b.x += b.vx; b.y += b.vy; b.life--;
        if (b.x < 0 || b.x > W || b.y < 0 || b.y > H) b.life = 0;
    }
    bullets = bullets.filter(b => b.life > 0);

    /* ── Move asteroids (toroidal wrap, spin, glow pulse) ── */
    for (const a of asteroids) {
        a.x = wrap(a.x + a.vx, W);
        a.y = wrap(a.y + a.vy, H);
        a.rot += a.rotSpeed;
        a.glow += a.glowSpeed;
    }

    /* ── Move powerups (toroidal wrap, spin, pulse) ── */
    for (const p of powerups) {
        p.x = wrap(p.x + p.vx, W);
        p.y = wrap(p.y + p.vy, H);
        p.rot += p.rotSpeed; p.pulse += 0.06; p.life--;
    }
    powerups = powerups.filter(p => p.life > 0);

    /* ── Age particles: apply friction and remove dead ones ── */
    for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.96; p.vy *= 0.96;
        p.life--;
    }
    particles = particles.filter(p => p.life > 0);

    /* ══════════════════════════════════════════════════════════════
       COLLISION: Bullet vs Asteroid
       We iterate backwards so splice doesn't corrupt indices.
       A 'continue outer' jumps past remaining bullets for a
       destroyed asteroid (one bullet kills one asteroid).
       ══════════════════════════════════════════════════════════════ */
    outer:
    for (let i = asteroids.length - 1; i >= 0; i--) {
        for (let j = bullets.length - 1; j >= 0; j--) {
            const a = asteroids[i], b = bullets[j];
            if (Math.hypot(a.x - b.x, a.y - b.y) < a.r) {

                // Score points with combo multiplier
                const base = a.size === 3 ? 20 : a.size === 2 ? 50 : 100;
                combo++; comboTimer = 90;
                if (combo >= 3) multiplier = Math.min(8, Math.floor(combo / 3) + 1);
                multEl.textContent = '×' + multiplier;
                const pts = base * multiplier;
                score += pts; scoreEl.textContent = score;
                if (score > hiScore) {
                    hiScore = score; hiEl.textContent = hiScore;
                    localStorage.setItem('abHi', hiScore);
                }

                const col = a.size === 3 ? '#5DCAA5' : a.size === 2 ? '#EF9F27' : '#F0997B';
                scorePopup(a.x, a.y - 20, pts, col);
                a.size === 3 ? sfxExplodeBig() : sfxExplodeSmall();
                addShake(a.size === 3 ? 7 : a.size === 2 ? 4 : 2);

                // Spawn debris particles
                if (particlesEnabled) {
                    const cnt = a.size === 3 ? 20 : a.size === 2 ? 14 : 8;
                    for (let k = 0; k < cnt; k++) {
                        const pa = rnd(0, Math.PI * 2), sp = rnd(1, 6);
                        particles.push({ x: a.x, y: a.y, vx: Math.cos(pa) * sp, vy: Math.sin(pa) * sp, life: rndInt(20, 55), maxLife: 42, col, size: rnd(1.5, 4), type: 'debris' });
                    }
                    // Expanding ring flash
                    particles.push({ x: a.x, y: a.y, r: 0, maxR: a.r * 2.8, life: 22, maxLife: 22, col, type: 'ring' });
                }

                // Large/medium → split into two of next smaller size
                if (a.size > 1) {
                    asteroids.push(spawnAsteroid(a.x, a.y, a.size - 1));
                    asteroids.push(spawnAsteroid(a.x, a.y, a.size - 1));
                }

                // 12% + 1%/level chance to drop a powerup
                if (Math.random() < 0.12 + level * 0.01) powerups.push(spawnPowerup(a.x, a.y));

                asteroids.splice(i, 1);
                bullets.splice(j, 1);
                continue outer;
            }
        }
    }

    /* ══════════════════════════════════════════════════════════════
       COLLISION: Ship vs Asteroid
       Ship collision circle radius ≈ 14px.
       If shield is active → deflect + drain.
       Otherwise → lose a life (or game over).
       ══════════════════════════════════════════════════════════════ */
    if (ship.inv <= 0) {
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const a = asteroids[i];
            if (Math.hypot(a.x - ship.x, a.y - ship.y) < a.r + 14) {
                if (ship.shieldOn && ship.shieldLeft > 0) {
                    // Shield deflection
                    sfxShield();
                    ship.shieldLeft = Math.max(0, ship.shieldLeft - 0.7);
                    const nx = ship.x - a.x, ny = ship.y - a.y;
                    const nl = Math.hypot(nx, ny) || 1;
                    asteroids[i].vx = -(nx / nl) * 2.8; asteroids[i].vy = -(ny / nl) * 2.8;
                    ship.vx += (nx / nl) * 1.8; ship.vy += (ny / nl) * 1.8;
                    addShake(3);
                    if (particlesEnabled) {
                        for (let k = 0; k < 12; k++) {
                            const pa = rnd(0, Math.PI * 2), sp = rnd(2, 5);
                            particles.push({ x: ship.x, y: ship.y, vx: Math.cos(pa) * sp, vy: Math.sin(pa) * sp, life: rndInt(15, 30), maxLife: 25, col: '#378ADD', size: rnd(1, 3), type: 'spark' });
                        }
                    }
                    break;
                }

                // No shield → death sequence
                sfxDeath(); stopEngineSound(); addShake(14);
                if (particlesEnabled) {
                    for (let k = 0; k < 30; k++) {
                        const pa = rnd(0, Math.PI * 2), sp = rnd(2, 8);
                        particles.push({ x: ship.x, y: ship.y, vx: Math.cos(pa) * sp, vy: Math.sin(pa) * sp, life: rndInt(35, 75), maxLife: 60, col: '#7F77DD', size: rnd(2, 6), type: 'debris' });
                    }
                    particles.push({ x: ship.x, y: ship.y, r: 0, maxR: 50, life: 28, maxLife: 28, col: '#AFA9EC', type: 'ring' });
                }

                lives--; livesEl.textContent = lives;

                if (lives <= 0) {
                    // ── GAME OVER ──
                    gameState = 'dead'; stopMusic();
                    oTitle.textContent = 'GAME OVER';
                    oSub.textContent = 'MISSION FAILED';
                    oMsg.innerHTML = `Score: <b style="color:#CCD6FF">${score}</b> &nbsp;|&nbsp; Hi: <b style="color:#7FF6FF">${hiScore}</b>`;
                    startBtn.textContent = '▶ PLAY AGAIN';
                    startBtn.style.display = 'inline-block';
                    pauseButtons.style.display = 'none';
                    overlay.style.display = 'flex';
                    return;
                }

                // Respawn with invincibility
                ship = makeShip(); ship.inv = 200;
                break;
            }
        }
    }

    /* ══════════════════════════════════════════════════════════════
       COLLISION: Ship vs Powerup  (pickup radius = 20px)
       ══════════════════════════════════════════════════════════════ */
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        if (Math.hypot(p.x - ship.x, p.y - ship.y) < 20) {
            sfxPowerup();
            switch (p.type) {
                case 'shield': ship.shieldLeft = Math.min(3, ship.shieldLeft + 1); break;
                case 'multishot': multishotActive = 300; break;  // 5 seconds
                case 'rapid': rapidActive = 300; break;
                case 'bomb':
                    // Clear every asteroid, award 10pts each
                    asteroids.forEach(a => {
                        const col = a.size === 3 ? '#5DCAA5' : a.size === 2 ? '#EF9F27' : '#F0997B';
                        if (particlesEnabled) {
                            for (let k = 0; k < 8; k++) {
                                const pa = rnd(0, Math.PI * 2), sp = rnd(1, 5);
                                particles.push({ x: a.x, y: a.y, vx: Math.cos(pa) * sp, vy: Math.sin(pa) * sp, life: rndInt(20, 45), maxLife: 35, col, size: rnd(1.5, 3), type: 'debris' });
                            }
                        }
                        score += 10 * multiplier;
                    });
                    scoreEl.textContent = score;
                    asteroids = []; addShake(12);
                    break;
            }
            // Pickup spark burst
            if (particlesEnabled) {
                const col = POWERUP_COLORS[p.type];
                for (let k = 0; k < 16; k++) {
                    const pa = rnd(0, Math.PI * 2), sp = rnd(2, 5);
                    particles.push({ x: p.x, y: p.y, vx: Math.cos(pa) * sp, vy: Math.sin(pa) * sp, life: rndInt(20, 40), maxLife: 35, col, size: rnd(1.5, 3.5), type: 'spark' });
                }
            }
            powerups.splice(i, 1);
        }
    }

    /* ── Level complete: all asteroids destroyed → advance ── */
    if (asteroids.length === 0) {
        level++; levelEl.textContent = level;
        sfxLevelUp(); showLevelFlash('LEVEL ' + level);
        initLevel();
    }

    /* ── Update shield HUD dots (each dot = 1 charge) ── */
    sDots.forEach((d, i) => d.classList.toggle('empty', i >= Math.ceil(ship.shieldLeft)));
}


/* ═══════════════════════════════════════════════════════════════════════════
   §20 DRAW LOOP
   ──────────────
   Renders one frame using Canvas 2D API.
 
   Draw order (painter's algorithm — later = on top):
     1. Clear + dark background
     2. Nebula glow gradients
     3. Stars (twinkling)
     4. Powerups (hexagon + icon + countdown arc)
     5. Particles (debris dots + expanding rings)
     6. Asteroids (jagged polygon + glow)
     7. Bullets (radial-gradient orb)
     8. Active powerup timers (corner text)
     9. Ship (polygon fallback; shield bubble if active)
    10. Life icons (bottom-left)
    11. Combo indicator (bottom-centre)
   ═══════════════════════════════════════════════════════════════════════════ */

function draw() {
    ctx.save(); // save state before applying screen-shake translate

    /* Screen shake offset applied to entire frame */
    ctx.translate(shakeX, shakeY);

    /* ── 1. Clear + background ── */
    ctx.clearRect(-10, -10, W + 20, H + 20);
    ctx.fillStyle = '#03030d';
    ctx.fillRect(-10, -10, W + 20, H + 20);

    /* ── 2. Nebula glow: two overlapping radial gradients ── */
    const ng1 = ctx.createRadialGradient(W * .3, H * .4, 0, W * .3, H * .4, W * .6);
    ng1.addColorStop(0, 'rgba(20,10,60,0.18)'); ng1.addColorStop(1, 'transparent');
    ctx.fillStyle = ng1; ctx.fillRect(0, 0, W, H);
    const ng2 = ctx.createRadialGradient(W * .75, H * .7, 0, W * .75, H * .7, W * .5);
    ng2.addColorStop(0, 'rgba(0,30,40,0.12)'); ng2.addColorStop(1, 'transparent');
    ctx.fillStyle = ng2; ctx.fillRect(0, 0, W, H);

    /* ── 3. Stars — each twinkles via sine wave on brightness ── */
    for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinkleOffset);
        ctx.globalAlpha = s.brightness * tw;
        ctx.fillStyle = s.hue ? `hsl(${s.hue},80%,80%)` : '#ffffff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* ── 4. Powerups — rotating hexagon with icon and arc countdown ── */
    for (const p of powerups) {
        const pulse = 0.6 + 0.4 * Math.sin(p.pulse);
        const col = POWERUP_COLORS[p.type];
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.shadowColor = col; ctx.shadowBlur = 14 * pulse;
        ctx.strokeStyle = col; ctx.lineWidth = 1.5;

        // Hexagon outline
        const r = 13;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = i / 6 * Math.PI * 2 - Math.PI / 6;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath(); ctx.stroke();

        // Translucent fill
        ctx.globalAlpha = 0.18 * pulse; ctx.fillStyle = col; ctx.fill();
        ctx.globalAlpha = 1;

        // Centre icon
        ctx.shadowBlur = 0; ctx.fillStyle = col;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(POWERUP_ICONS[p.type], 0, 0);

        // Countdown arc (shrinks as life decreases)
        ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.globalAlpha = 0.4;
        ctx.beginPath(); ctx.arc(0, 0, r + 4, 0, Math.PI * 2 * (p.life / 600)); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    /* ── 5. Particles ── */
    for (const p of particles) {
        if (p.type === 'ring') {
            // Expanding ring: radius grows, alpha fades
            const ratio = 1 - p.life / p.maxLife;
            p.r = p.maxR * ratio;
            ctx.globalAlpha = (p.life / p.maxLife) * 0.65;
            ctx.strokeStyle = p.col; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = 1;
        } else {
            // Dot particle: fades out as life drops
            const alpha = Math.min(1, p.life / (p.maxLife || 30));
            ctx.globalAlpha = alpha; ctx.fillStyle = p.col;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size || 2, 0, Math.PI * 2); ctx.fill();
        }
    }
    ctx.globalAlpha = 1;

    /* ── 6. Asteroids — jagged polygon outline with glow ── */
    for (const a of asteroids) {
        const glowPulse = 0.5 + 0.5 * Math.sin(a.glow);
        const col = a.size === 3 ? '#5DCAA5' : a.size === 2 ? '#EF9F27' : '#F0997B';
        ctx.save();
        ctx.translate(a.x, a.y); ctx.rotate(a.rot);
        ctx.shadowColor = col; ctx.shadowBlur = 10 + glowPulse * 8;
        ctx.strokeStyle = col; ctx.lineWidth = 1.8;
        // Dim fill
        ctx.globalAlpha = 0.08; ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(a.verts[0][0], a.verts[0][1]);
        for (const v of a.verts) ctx.lineTo(v[0], v[1]);
        ctx.closePath(); ctx.fill();
        // Bright outline
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(a.verts[0][0], a.verts[0][1]);
        for (const v of a.verts) ctx.lineTo(v[0], v[1]);
        ctx.closePath(); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    /* ── 7. Bullets — glowing orb using radial gradient ── */
    for (const b of bullets) {
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 5);
        grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.5, '#AFA9EC'); grad.addColorStop(1, 'transparent');
        ctx.shadowColor = '#AFA9EC'; ctx.shadowBlur = 12;
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    }

    /* ── 8. Active powerup timers — top-left corner text ── */
    let py = 64;
    if (multishotActive > 0) {
        ctx.font = '10px "Share Tech Mono"'; ctx.fillStyle = '#FFD700'; ctx.globalAlpha = 0.9;
        ctx.fillText(`✦ MULTISHOT ${Math.ceil(multishotActive / 60)}s`, 16, py);
        ctx.globalAlpha = 1; py += 16;
    }
    if (rapidActive > 0) {
        ctx.font = '10px "Share Tech Mono"'; ctx.fillStyle = '#FF6633'; ctx.globalAlpha = 0.9;
        ctx.fillText(`► RAPID FIRE ${Math.ceil(rapidActive / 60)}s`, 16, py);
        ctx.globalAlpha = 1;
    }

    /* ── 9. Ship ── */
    // Blink during invincibility: visible every other 8-frame window
    const showShip = ship.inv <= 0 || Math.floor(ship.inv / 8) % 2 === 0;
    if (showShip) {
        ctx.save();
        ctx.translate(ship.x, ship.y);
        ctx.rotate(ship.angle + Math.PI / 2); // +π/2 so 0° angle points up

        // Shield bubble — pulsing blue rings
        if (ship.shieldOn && ship.shieldLeft > 0) {
            const sp2 = 0.6 + 0.4 * Math.sin(t * 0.15);
            ctx.globalAlpha = sp2 * 0.5; ctx.strokeStyle = '#378ADD'; ctx.lineWidth = 3;
            ctx.shadowColor = '#378ADD'; ctx.shadowBlur = 22;
            ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = sp2 * 0.28; ctx.strokeStyle = '#85B7EB'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.stroke();
            for (let i = 0; i < 6; i++) {
                const sa = (i / 6) * Math.PI * 2 + t * 0.04, ea = sa + Math.PI / 4;
                ctx.globalAlpha = sp2 * 0.18; ctx.strokeStyle = '#B5D4F4'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(0, 0, 28, sa, ea); ctx.stroke();
            }
            ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        }

        // Ship body — rocket image with polygon fallback
        if (rocketImg.complete && rocketImg.naturalWidth > 0) {
            ctx.drawImage(rocketImg, -27, -33, 54, 66); // centered, 54×66px
        } else {
            ctx.strokeStyle = '#CECBF6'; ctx.lineWidth = 2;
            ctx.shadowColor = '#AFA9EC'; ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(0, -24);  // nose tip
            ctx.lineTo(16, 16);  // starboard wing
            ctx.lineTo(0, 8);    // tail center notch
            ctx.lineTo(-16, 16); // port wing
            ctx.closePath(); ctx.stroke();
        }


        // Thrust flame — animated orange/yellow triangle
        if (ship.thrusting) {
            const flicker = rnd(14, 22); // random flame length for flicker effect
            ctx.shadowColor = '#FF8030'; ctx.shadowBlur = 14;
            ctx.strokeStyle = '#EF9F27'; ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-8, 14);
            ctx.lineTo(0, 14 + flicker);
            ctx.lineTo(8, 14);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    /* ── 10. Life icons — small ship triangles bottom-left ── */
    for (let i = 0; i < lives; i++) {
        ctx.save();
        ctx.translate(16 + i * 24, H - 16);
        ctx.strokeStyle = '#CECBF6'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(0, -8);   // mini nose
        ctx.lineTo(5, 5);   // right
        ctx.lineTo(0, 2);   // tail notch
        ctx.lineTo(-5, 5);   // left
        ctx.closePath(); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    /* ── 11. Combo indicator — bottom-centre ── */
    if (combo >= 3) {
        const comboAlpha = Math.min(1, comboTimer / 20);
        ctx.save();
        ctx.globalAlpha = comboAlpha;
        ctx.font = `bold ${clamp(13, 10, 16)}px "Orbitron"`;
        ctx.fillStyle = '#FFD700'; ctx.textAlign = 'center';
        ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 16;
        ctx.fillText(`COMBO ×${multiplier}  (${combo} hits)`, W / 2, H - 30);
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    ctx.restore(); // pop the screen-shake translation
}


/* ═══════════════════════════════════════════════════════════════════════════
   §21 MAIN GAME LOOP
   ───────────────────
   requestAnimationFrame guarantees ~60fps and automatically pauses when
   the browser tab is hidden (no wasted CPU when not visible).
   ═══════════════════════════════════════════════════════════════════════════ */

function loop() {
    update(); // physics + game logic
    draw();   // canvas rendering
    raf = requestAnimationFrame(loop); // schedule next frame
}


/* ═══════════════════════════════════════════════════════════════════════════
   §22 IDLE ANIMATION LOOP
   ────────────────────────
   When not actively playing (title, paused, game-over), we still want the
   star field to twinkle. This lightweight loop only draws stars — no physics.
   It stops itself as soon as gameState becomes 'playing'.
   ═══════════════════════════════════════════════════════════════════════════ */

function idleLoop() {
    if (gameState === 'playing') return; // game loop has taken over — stop
    t++;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#03030d'; ctx.fillRect(0, 0, W, H);
    for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinkleOffset);
        ctx.globalAlpha = s.brightness * tw;
        ctx.fillStyle = s.hue ? `hsl(${s.hue},80%,80%)` : '#ffffff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(idleLoop);
}

// Bootstrap: generate stars and begin the idle animation immediately
makeStars();
idleLoop();