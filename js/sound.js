/* ============================================
   MYSTOSOFT - Sound System
   Background music + CyberAudio SFX
   ============================================ */

// ---------- Background Music ----------
const BGMusic = {
  audio: null,
  muted: false,
  started: false,

  init() {
    this.audio = new Audio('assets/the_mountain-positive-story-131416.mp3');
    this.audio.loop = true;
    this.audio.volume = 0.4;
    this.audio.preload = 'auto';
    this.muted = localStorage.getItem('mystosoft_music_muted') === 'true';
    this.audio.muted = this.muted;
  },

  play() {
    if (!this.audio || this.started) return;
    this.audio.play().then(() => {
      this.started = true;
    }).catch(() => {});
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.audio) this.audio.muted = this.muted;
    localStorage.setItem('mystosoft_music_muted', this.muted);
    return !this.muted;
  },

  updateIcon(btn) {
    const iconPlaying = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>';
    const iconMuted = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
    btn.innerHTML = this.muted ? iconMuted : iconPlaying;
  }
};

// ---------- CyberAudio (click/hover SFX) ----------
const CyberAudio = {
  enabled: true,
  ctx: null,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {
      this.enabled = false;
    }
  },

  play(freq, type, duration, volume) {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq || 800, this.ctx.currentTime);
    gain.gain.setValueAtTime(volume || 0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (duration || 0.1));
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + (duration || 0.1));
  },

  clickTick() {
    this.play(1200, 'sine', 0.06, 0.03);
  },

  hoverTick() {
    this.play(600, 'sine', 0.04, 0.02);
  },

  submitSwish() {
    this.play(400, 'sine', 0.15, 0.04);
    setTimeout(() => this.play(600, 'sine', 0.1, 0.03), 50);
  },

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
};

// Initialize on first user interaction
document.addEventListener('click', () => {
  if (!CyberAudio.ctx) CyberAudio.init();
}, { once: true });

// Add sound events
document.addEventListener('DOMContentLoaded', () => {
  BGMusic.init();

  document.addEventListener('click', () => {
    BGMusic.play();
  }, { once: true });

  document.querySelectorAll('a, button:not(.sound-toggle), .filter-btn, .project-card').forEach(el => {
    el.addEventListener('click', () => CyberAudio.clickTick());
  });
  document.querySelectorAll('a, button:not(.sound-toggle), .filter-btn').forEach(el => {
    el.addEventListener('mouseenter', () => CyberAudio.hoverTick());
  });
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', () => CyberAudio.submitSwish());
  });

  const soundBtn = document.querySelector('.sound-toggle');
  if (soundBtn) {
    BGMusic.updateIcon(soundBtn);
    soundBtn.addEventListener('click', () => {
      if (!BGMusic.started) {
        BGMusic.play();
      } else {
        BGMusic.toggleMute();
      }
      BGMusic.updateIcon(soundBtn);
    });
  }
});
