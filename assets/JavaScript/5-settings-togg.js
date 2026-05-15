
/* ═══════════════════════════════════════════════════════════════════════════

  #5  SETTINGS & TOGGLES
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