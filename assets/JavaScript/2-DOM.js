/* ═══════════════════════════════════════════════════════════════════════════
  #2  DOM BUILDER
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
//const fsBtn = el('button', { class: 'icon-btn', text: '⛶', title: 'Fullscreen' }, topButtons);
const settingsBtn = el('button', { class: 'icon-btn', text: '⚙', title: 'Settings' }, topButtons);

// 4. Level flash overlay
const levelFlash = el('div', { id: 'levelFlash' }, document.body);
const levelFlashText = el('span', {}, levelFlash);

// 5. Scanlines
el('div', { id: 'scanlines' }, document.body);

// 6. Top Scorer display (newly added-16/05/2026)
const topScorerEl = el('div', { id: 'topScorer' }, document.body);

// 7. Main overlay (start / pause / game over)  ← this already exists, just continue
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