/* ═══════════════════════════════════════════════════════════════════════════
   §1  CSS INJECTION
   ─────────────────
   All CSS is authored here as a template literal and injected into a <style>
   element so the HTML file stays virtually empty.
 
   Design: retro-futuristic space arcade — deep navy blacks, electric cyan
   accents, Orbitron / Share Tech Mono for that 80s vector-game feel.
   ═══════════════════════════════════════════════════════════════════════════ */
(function injectCSS() {
    const css = `
    /* ── Google Fonts ── */
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&display=swap');

    /* ── CSS Custom Properties (design tokens) ── */
    :root {
      --bg:       #03030d;
      --panel:    #08081e;
      --border:   #1e2060;
      --accent:   #7FF6FF;
      --accent2:  #AFA9EC;
      --text:     #CCD6FF;
      --dim:      #4455AA;
      --danger:   #CC8888;
      --gold:     #FFD700;
      --shield:   #3399FF;
      --font-hud: 'Orbitron', monospace;
      --font-mono:'Share Tech Mono', monospace;
    }

    /* ── Global Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      width: 100%; height: 100%;
      overflow: hidden;
      background: var(--bg);
      font-family: var(--font-hud);
      user-select: none;
      -webkit-user-select: none;
    }

    /* ── Canvas fills viewport ── */
    #gc {
      display: block;
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
    }

    /* ══════════════════════════════════════════════════════════════
       HUD — top bar
       ══════════════════════════════════════════════════════════════ */
    #hud {
      position: fixed; top: 0; left: 0; right: 0; height: 52px;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px;
      background: linear-gradient(180deg, rgba(0,0,20,.95) 0%, transparent 100%);
      pointer-events: none; z-index: 10;
    }
    .hud-left, .hud-right { display: flex; gap: 24px; align-items: center; }
    .hud-center { display: flex; align-items: center; }
    .hud-stat { display: flex; flex-direction: column; align-items: center; gap: 1px; }
    .hud-label {
      font-size: 8px; letter-spacing: .18em; color: var(--dim);
      text-transform: uppercase; font-family: var(--font-mono);
    }
    .hud-val { font-size: 17px; font-weight: 700; color: var(--text); letter-spacing: .05em; }

    /* Level badge (center HUD) */
    #levelBadge {
      background: linear-gradient(135deg, #1a1060, #0d2060);
      border: 1px solid #3344AA; border-radius: 6px;
      padding: 4px 14px; text-align: center;
    }
    #levelBadge .hud-label { font-size: 9px; }
    #levelBadge .hud-val { font-size: 20px; color: var(--accent); }

    /* ══════════════════════════════════════════════════════════════
       SHIELD BAR — bottom center
       ══════════════════════════════════════════════════════════════ */
    #shieldBar {
      position: fixed; bottom: 14px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 8px; align-items: center;
      z-index: 10; pointer-events: none;
    }
    .shield-label {
      font-size: 8px; letter-spacing: .15em; color: #3355AA;
      font-family: var(--font-mono); margin-right: 4px;
    }
    .sDot {
      width: 12px; height: 12px; border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #7BD4FF, #2277CC);
      box-shadow: 0 0 8px var(--shield); transition: all .2s;
    }
    .sDot.empty { background: #0d1a2a; box-shadow: none; border: 1px solid #1a2a40; }

    /* ══════════════════════════════════════════════════════════════
       TOP BUTTONS — fullscreen + settings
       ══════════════════════════════════════════════════════════════ */
    #topButtons {
      position: fixed; top: 8px; right: 12px;
      display: flex; gap: 8px; z-index: 20;
    }
    .icon-btn {
      width: 36px; height: 36px; border-radius: 8px;
      border: 1px solid #223; background: rgba(0,0,20,.7);
      color: #667; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; transition: all .15s; backdrop-filter: blur(4px);
    }
    .icon-btn:hover { border-color: #446; color: #AAB; background: rgba(10,10,40,.9); }

    /* ══════════════════════════════════════════════════════════════
       OVERLAY — start / pause / game-over
       ══════════════════════════════════════════════════════════════ */
    #overlay {
      position: fixed; inset: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,10,.75); backdrop-filter: blur(6px); z-index: 30;
    }
    #overlayBox {
      background: linear-gradient(160deg, #08081e, #040414);
      border: 1px solid var(--border); border-radius: 16px;
      padding: 2.4rem 3rem; text-align: center;
      max-width: 420px; width: 90%;
      box-shadow: 0 0 60px rgba(60,60,200,.15), inset 0 1px 0 rgba(255,255,255,.04);
    }
    #overlayBox h2 { font-size: 24px; font-weight: 700; color: var(--accent2); margin-bottom: 10px; letter-spacing: .08em; }
    #overlayBox .sub { font-size: 11px; color: #556; letter-spacing: .12em; font-family: var(--font-mono); margin-bottom: 1.2rem; }
    #overlayBox p { font-size: 12px; color: #667; line-height: 1.9; margin-bottom: 1.5rem; font-family: var(--font-mono); }
    .btn-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
    .ovl-btn {
      padding: 9px 28px; font-size: 12px; cursor: pointer; border-radius: 8px;
      border: 1px solid #3a3580; background: transparent; color: var(--accent2);
      letter-spacing: .1em; font-family: var(--font-hud); transition: all .15s;
    }
    .ovl-btn:hover { background: #1a1840; color: #CECBF6; border-color: #6060C0; box-shadow: 0 0 20px rgba(100,100,220,.2); }
    .ovl-btn.danger { border-color: #803030; color: var(--danger); }
    .ovl-btn.danger:hover { background: #1a0808; color: #FFB0A0; border-color: #C04040; }
    .ovl-btn.primary { border-color: #5060D0; background: linear-gradient(135deg,#1a1860,#0d1040); }
    .ovl-btn.primary:hover { background: linear-gradient(135deg,#2a2870,#181858); box-shadow: 0 0 30px rgba(80,100,220,.25); }
    .divider { width: 100%; height: 1px; background: linear-gradient(90deg,transparent,#1a1a40,transparent); margin: 1rem 0; }
    .key-hint { font-size: 9px; color: #334; font-family: var(--font-mono); text-align: center; margin-top: 1.2rem; line-height: 1.8; }
    .key { background: #0d0d20; border: 1px solid #2a2a40; border-radius: 3px; padding: 1px 6px; color: #556; }

    /* ══════════════════════════════════════════════════════════════
       SETTINGS PANEL
       ══════════════════════════════════════════════════════════════ */
    #settingsPanel {
      position: fixed; inset: 0; display: none;
      align-items: center; justify-content: center;
      background: rgba(0,0,10,.85); backdrop-filter: blur(8px); z-index: 40;
    }
    #settingsPanel.open { display: flex; }
    #settingsBox {
      background: linear-gradient(160deg,#0a0a20,#050514);
      border: 1px solid var(--border); border-radius: 16px;
      padding: 2rem 2.5rem; max-width: 380px; width: 90%;
      box-shadow: 0 0 80px rgba(60,60,200,.12);
    }
    #settingsBox h3 { font-size: 15px; color: var(--accent2); margin-bottom: 1.5rem; letter-spacing: .12em; font-weight: 700; text-align: center; }
    .setting-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; font-size: 11px; color: #778; font-family: var(--font-mono); letter-spacing: .05em; }
    .setting-row span { color: #AAB; }
    .toggle-track { width: 42px; height: 22px; border-radius: 11px; background: #111; border: 1px solid #333; cursor: pointer; position: relative; transition: background .2s; }
    .toggle-track.on { background: #1a3060; border-color: #3360A0; }
    .toggle-knob { width: 16px; height: 16px; border-radius: 50%; background: #445; position: absolute; top: 2px; left: 2px; transition: transform .2s, background .2s; }
    .toggle-track.on .toggle-knob { transform: translateX(20px); background: #7BB8FF; }
    .volume-row { display: flex; align-items: center; gap: 10px; font-size: 11px; color: #778; font-family: var(--font-mono); margin-bottom: 1rem; }
    .volume-row span { min-width: 80px; color: #AAB; }
    input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 2px; background: #222; outline: none; cursor: pointer; flex: 1; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #5577CC; cursor: pointer; }
    .close-settings { margin-top: 1.5rem; width: 100%; padding: 8px; font-size: 11px; font-family: var(--font-hud); letter-spacing: .1em; cursor: pointer; background: transparent; border: 1px solid #2a2a50; border-radius: 8px; color: #667; transition: all .15s; }
    .close-settings:hover { border-color: #4a4a80; color: #AAB; }

    /* ══════════════════════════════════════════════════════════════
       SCORE POPUP — floats up on kill
       ══════════════════════════════════════════════════════════════ */
    .score-pop {
      position: fixed; pointer-events: none;
      font-size: 14px; font-family: var(--font-hud); font-weight: 700;
      z-index: 15; animation: scoreFloat 1.1s ease-out forwards;
    }
    @keyframes scoreFloat {
      0%   { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-55px); }
    }

    /* ══════════════════════════════════════════════════════════════
       LEVEL FLASH — big center text on level-up
       ══════════════════════════════════════════════════════════════ */
    #levelFlash {
      position: fixed; inset: 0;
      display: flex; align-items: center; justify-content: center;
      pointer-events: none; z-index: 20; opacity: 0; transition: opacity .3s;
    }
    #levelFlash.show { opacity: 1; }
    #levelFlash span { font-size: clamp(28px, 7vw, 52px); font-weight: 900; color: var(--accent); letter-spacing: .2em; text-shadow: 0 0 40px #3399FF, 0 0 80px #1155AA; }

    /* ══════════════════════════════════════════════════════════════
       SCANLINES — retro CRT overlay
       ══════════════════════════════════════════════════════════════ */
    #scanlines {
      position: fixed; inset: 0; pointer-events: none; z-index: 1;
      background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.06) 2px, rgba(0,0,0,.06) 4px);
      opacity: .4;
    }

    /* ══════════════════════════════════════════════════════════════
       MOBILE VIRTUAL CONTROLS
       Shown only on touch devices; positioned at bottom corners
       ══════════════════════════════════════════════════════════════ */
    #mobileControls {
      position: fixed; bottom: 0; left: 0; right: 0; height: 160px;
      display: none; pointer-events: none; z-index: 15;
    }
    #mobileControls.visible { display: block; }

    /* Left D-pad cluster */
    .dpad { position: absolute; bottom: 20px; left: 20px; width: 130px; height: 130px; pointer-events: all; }
    .dpad-btn {
      position: absolute; width: 40px; height: 40px; border-radius: 8px;
      background: rgba(60,80,200,.18); border: 1px solid rgba(100,130,255,.35);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; color: rgba(180,200,255,.7); cursor: pointer;
      backdrop-filter: blur(4px); transition: background .1s;
      -webkit-tap-highlight-color: transparent;
    }
    .dpad-btn:active, .dpad-btn.pressed { background: rgba(80,110,255,.35); }
    /* Positions within .dpad */
    #dUp    { top: 0;  left: 45px; }   /* top center  */
    #dLeft  { top: 45px; left: 0; }    /* mid left    */
    #dRight { top: 45px; left: 90px; } /* mid right   */
    #dDown  { top: 90px; left: 45px; } /* bottom center */

    /* Right action cluster */
    .apad { position: absolute; bottom: 20px; right: 20px; width: 130px; height: 130px; pointer-events: all; }
    #aFire  { position: absolute; top: 0;    left: 45px; border-radius: 50%; background: rgba(200,60,60,.22); border: 1px solid rgba(255,120,120,.4); }
    #aShield{ position: absolute; top: 45px; left: 0;    border-radius: 50%; background: rgba(40,100,200,.22); border: 1px solid rgba(100,180,255,.4); }
    #aThrust{ position: absolute; top: 45px; left: 90px; border-radius: 50%; background: rgba(60,200,100,.22); border: 1px solid rgba(120,255,160,.4); }

    /* Responsive tweaks */
    @media (max-width: 480px) {
      #overlayBox { padding: 1.6rem 1.4rem; }
      #overlayBox h2 { font-size: 18px; }
      .ovl-btn { padding: 8px 16px; font-size: 11px; }
      .hud-val { font-size: 13px; }
      #levelBadge .hud-val { font-size: 16px; }
    }
  `;

    // Create <style> node and append to <head>
    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
})();