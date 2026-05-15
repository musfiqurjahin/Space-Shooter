/* ═══════════════════════════════════════════════════════════════════════════
  #17 KEYBOARD INPUT
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