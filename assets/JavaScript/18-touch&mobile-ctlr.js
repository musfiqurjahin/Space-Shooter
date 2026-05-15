/* ═══════════════════════════════════════════════════════════════════════════
  #18 TOUCH / MOBILE CONTROLS
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