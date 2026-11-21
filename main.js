/**
 * IMPULZE Techfest UI - Application Controller
 * Handles scroll choreography, card transitions, 3D card tilt,
 * procedural Web Audio synthesis, interactive modals, and background video sync.
 */

// --- 1. Procedural Web Audio Synthesizer ---
class TechAudioSynth {
  constructor() {
    this.ctx = null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.ctx = new AudioContext();
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playHover() {
    if (!this.ctx) return;
    this.resume();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.035);
    } catch (e) {}
  }

  playClick() {
    if (!this.ctx) return;
    this.resume();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(420, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }
}

const audio = new TechAudioSynth();

// --- 2. Scroll Choreography for Techfest 3D Cards & Video Sync ---
function initScrollChoreography() {
  const cardsContainer = document.getElementById('cards-viewport');
  const scrollCue = document.getElementById('bottom-scroll-cue');
  const bgVideo = document.getElementById('main-bg-video');

  if (bgVideo) {
    bgVideo.play().catch(() => {
      bgVideo.muted = true;
      bgVideo.play().catch(() => {});
    });
  }

  function updateScrollState() {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? scrollY / maxScroll : 0;

    // Fade out scroll cue
    if (scrollCue) {
      scrollCue.style.opacity = progress > 0.05 ? '0' : '1';
    }

    // Sync video time smoothly to scroll position
    if (bgVideo && bgVideo.duration) {
      const targetTime = progress * bgVideo.duration;
      if (Math.abs(bgVideo.currentTime - targetTime) > 0.35) {
        bgVideo.currentTime = targetTime;
      }
    }

    if (!cardsContainer) return;

    // Techfest Card Animation Thresholds:
    // 0.00 to 0.15: Hidden above in clouds
    // 0.15 to 0.72: Locked into center view for reading & interaction
    // 0.72 to 1.00: Floats away to reveal landscape
    if (progress < 0.15) {
      cardsContainer.className = 'cards-viewport-container state-hidden';
    } else if (progress >= 0.15 && progress <= 0.72) {
      cardsContainer.className = 'cards-viewport-container state-visible';
    } else {
      cardsContainer.className = 'cards-viewport-container state-passed';
    }
  }

  window.addEventListener('scroll', updateScrollState, { passive: true });
  updateScrollState();
}

// --- 3. Interactive 3D Card Mouse Tilt ---
function initCardTilt() {
  const cards = document.querySelectorAll('.scifi-armor-card');

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const tiltX = (y - centerY) / centerY * -10;
      const tiltY = (x - centerX) / centerX * 10;

      card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-8px) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// --- 4. Navigation & Scroll Jump Handlers ---
function initNavigation() {
  const btnHome = document.getElementById('nav-home');
  const btnAbout = document.getElementById('nav-about');
  const btnEvents = document.getElementById('nav-events');
  const btnContact = document.getElementById('nav-contact');

  // Segmented navbar links
  const topNavHome = document.getElementById('top-nav-home');
  const topNavTeam = document.getElementById('top-nav-team');
  const topNavAbout = document.getElementById('top-nav-about');
  const topNavEvents = document.getElementById('top-nav-events');
  const topNavGallery = document.getElementById('top-nav-gallery');

  const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

  const scrollToHome = (e) => {
    if (e) e.preventDefault();
    audio.playClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveNav(topNavHome);
  };

  const scrollToAbout = (e) => {
    if (e) e.preventDefault();
    audio.playClick();
    window.scrollTo({ top: maxScroll() * 0.42, behavior: 'smooth' });
    setActiveNav(topNavAbout);
  };

  function setActiveNav(activeEl) {
    document.querySelectorAll('.segmented-nav-item').forEach((el) => el.classList.remove('active'));
    if (activeEl) activeEl.classList.add('active');
  }

  if (btnHome) btnHome.addEventListener('click', scrollToHome);
  if (topNavHome) topNavHome.addEventListener('click', scrollToHome);

  if (btnAbout) btnAbout.addEventListener('click', scrollToAbout);
  if (topNavAbout) topNavAbout.addEventListener('click', scrollToAbout);

  // Modals
  const teamModal = document.getElementById('modal-team');
  const galleryModal = document.getElementById('modal-gallery');
  const workshopsModal = document.getElementById('modal-workshops');
  const competitionsModal = document.getElementById('modal-competitions');
  const contactModal = document.getElementById('modal-contact');

  function openModal(modal, navEl) {
    if (!modal) return;
    audio.playClick();
    if (navEl) setActiveNav(navEl);
    modal.classList.add('open');
  }

  if (topNavTeam) topNavTeam.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(teamModal, topNavTeam);
  });

  if (topNavGallery) topNavGallery.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(galleryModal, topNavGallery);
  });

  if (topNavEvents) topNavEvents.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(competitionsModal, topNavEvents);
  });

  if (btnEvents) btnEvents.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(competitionsModal);
  });

  if (btnContact) btnContact.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(contactModal);
  });

  const questionBtn = document.getElementById('btn-question-widget');
  if (questionBtn) questionBtn.addEventListener('click', () => openModal(contactModal));

  const subWorkshop = document.getElementById('subcard-workshops');
  const subCompetitions = document.getElementById('subcard-competitions');
  const btnExplore = document.getElementById('btn-explore-tracks');

  if (subWorkshop) subWorkshop.addEventListener('click', () => openModal(workshopsModal));
  if (subCompetitions) subCompetitions.addEventListener('click', () => openModal(competitionsModal));
  if (btnExplore) btnExplore.addEventListener('click', () => openModal(competitionsModal));

  // Close modals
  document.querySelectorAll('.modal-close-icon').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach((m) => m.classList.remove('open'));
    });
  });

  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach((m) => m.classList.remove('open'));
    }
  });

  // Sound triggers on interactive elements
  const hoverables = document.querySelectorAll('a, button, .subcard-item, .nav-dock-btn, .social-dock-link, .segmented-nav-item');
  hoverables.forEach((el) => {
    el.addEventListener('mouseenter', () => audio.playHover());
  });
}

// --- Initialize Everything ---
document.addEventListener('DOMContentLoaded', () => {
  // Start Three.js 3D Engine
  if (typeof TechfestUniverse !== 'undefined') {
    window.techfestEngine = new TechfestUniverse('webgl-canvas-container');
  }

  initScrollChoreography();
  initCardTilt();
  initNavigation();

  // Unlock Web Audio and background video on first gesture
  const unlockMedia = () => {
    audio.resume();
    const bgVideo = document.getElementById('main-bg-video');
    if (bgVideo && bgVideo.paused) {
      bgVideo.play().catch(() => {});
    }
    document.removeEventListener('click', unlockMedia);
    document.removeEventListener('scroll', unlockMedia);
  };
  document.addEventListener('click', unlockMedia);
  document.addEventListener('scroll', unlockMedia);
});
