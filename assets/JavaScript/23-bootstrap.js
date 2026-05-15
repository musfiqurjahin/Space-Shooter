/* ═══════════════════════════════════════════════════════════════════════════
          ASTEROID BLASTER — Full JavaScript Edition
          ───────────────────────────────────────────────────────────────────────────
          ARCHITECTURE OVERVIEW
          ─────────────────────
          This file is intentionally ~95% JavaScript. HTML has only the bare
          minimum (DOCTYPE, head, canvas). Everything else — CSS injection, DOM
          construction, game logic, audio engine, rendering — is built in JS.
       
          Sections:
           #1  CSS INJECTION          — All styles built as a JS string, injected via <style>
           #2  DOM BUILDER            — HUD, overlay, shield bar, settings panel, buttons
           #3  WEB AUDIO ENGINE       — Procedural SFX + music (no audio files)
           #4  CANVAS / RESIZE        — Canvas sizing and viewport tracking
           #5  SETTINGS & TOGGLES     — Settings panel wiring, toggle helpers
           #6  FULLSCREEN             — Fullscreen API wrapper
           #7  HI-SCORE PERSISTENCE   — localStorage load/save
           #8  GAME STATE VARS        — All mutable game state in one place
           #9  MATH HELPERS           — rnd, rndInt, wrap, clamp, etc.
           #10 STAR FIELD             — Background parallax twinkle stars
           #11 SHIP FACTORY           — makeShip() returns a fresh player object
           #12 ASTEROID FACTORY       — Vertex generation + spawnAsteroid()
           #13 POWERUP FACTORY        — spawnPowerup() with type definitions
           #14 LEVEL INIT             — Reset arrays, spawn wave, respawn ship
           #15 UI HELPERS             — scorePopup, levelFlash, addShake
           #16 GAME FLOW              — startGame / pauseGame / resumeGame / quitGame
           #17 KEYBOARD INPUT         — keydown / keyup handlers + mobile touch
           #18 TOUCH / MOBILE CONTROLS— Virtual D-pad for phones/tablets
           #19 UPDATE LOOP            — Physics, collisions, state machine (runs every frame)
           #20 DRAW LOOP              — Canvas 2D rendering (runs every frame after update)
           #21 MAIN LOOP              — requestAnimationFrame wrapper
           #22 IDLE ANIMATION LOOP    — Stars-only loop on title/pause/gameover screens
          ═══════════════════════════════════════════════════════════════════════════ */
// Bootstrap: generate stars and begin the idle animation immediately
makeStars();
idleLoop();