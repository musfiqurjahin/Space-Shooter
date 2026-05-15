/* ═══════════════════════════════════════════════════════════════════════════
  #16 GAME FLOW
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
