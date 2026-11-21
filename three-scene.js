/**
 * IMPULZE Techfest 3D Engine with Dynamic Video Background & Parallax
 * Drives atmospheric particle embers, mouse parallax tilt, and scroll-linked depth.
 */

class TechfestUniverse {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = null;

    this.emberParticles = null;
    this.emberPositions = null;
    this.particleSpeeds = [];

    // Movement & scroll states
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.scrollProgress = 0;
    this.targetScrollProgress = 0;

    this.videoElement = document.getElementById('main-bg-video');
    this.videoContainer = document.getElementById('video-bg-container');

    this.init();
  }

  init() {
    if (typeof THREE === 'undefined') {
      setTimeout(() => this.init(), 100);
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene
    this.scene = new THREE.Scene();

    // Camera with cinematic perspective
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 30);

    // Renderer with transparent canvas
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    // Setup 3D elements
    this.setupLighting();
    this.createAtmosphericEmbers();

    // Bind event listeners
    this.bindEvents();

    // Animation Loop
    this.animate();
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambient);

    // Warm Sunset Light
    const sunLight = new THREE.DirectionalLight(0xffbe85, 1.4);
    sunLight.position.set(15, 12, 10);
    this.scene.add(sunLight);

    // Golden Point Light
    const goldLight = new THREE.PointLight(0xffa500, 1.8, 60);
    goldLight.position.set(0, 0, 15);
    this.scene.add(goldLight);
  }

  createAtmosphericEmbers() {
    // Floating Golden Embers & Sunset Dust Particles
    const particleCount = 320;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    this.particleSpeeds = [];

    const goldColor = new THREE.Color(0xffd57a);
    const coralColor = new THREE.Color(0xff5353);
    const warmWhite = new THREE.Color(0xfff7e6);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;

      const pick = Math.random();
      const col = pick > 0.6 ? goldColor : (pick > 0.3 ? coralColor : warmWhite);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      scales[i] = Math.random() * 2.0 + 0.8;
      this.particleSpeeds.push({
        vx: (Math.random() - 0.5) * 0.015,
        vy: 0.012 + Math.random() * 0.025,
        vz: (Math.random() - 0.5) * 0.01
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const mat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.emberParticles = new THREE.Points(geo, mat);
    this.emberPositions = positions;
    this.scene.add(this.emberParticles);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.onResize());

    // Mouse parallax tracking
    window.addEventListener('mousemove', (e) => {
      this.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Scroll tracking
    window.addEventListener('scroll', () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      this.targetScrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    }, { passive: true });
  }

  onResize() {
    if (!this.renderer || !this.camera) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Smooth lerps
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.06;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.06;
    this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.08;

    const sp = this.scrollProgress;

    // 1. Camera Tilt & Mouse Parallax
    this.camera.position.x = this.mouseX * 2.0;
    this.camera.position.y = -this.mouseY * 1.5 - sp * 2.0;
    this.camera.position.z = 30 - sp * 4.0;
    this.camera.lookAt(0, -sp * 1.0, 0);

    // 2. Dynamic Video Background Parallax Shift
    if (this.videoContainer) {
      const panX = this.mouseX * -14;
      const panY = this.mouseY * -10;
      this.videoContainer.style.transform = `scale(1.04) translate(${panX}px, ${panY}px)`;
    }

    // 3. Floating Embers Animation
    if (this.emberParticles && this.emberPositions) {
      const positions = this.emberPositions;
      const count = positions.length / 3;

      for (let i = 0; i < count; i++) {
        positions[i * 3] += this.particleSpeeds[i].vx + Math.sin(elapsedTime * 0.8 + i) * 0.006;
        positions[i * 3 + 1] += this.particleSpeeds[i].vy;
        positions[i * 3 + 2] += this.particleSpeeds[i].vz;

        // Reset if drifted too high
        if (positions[i * 3 + 1] > 22) {
          positions[i * 3 + 1] = -20;
          positions[i * 3] = (Math.random() - 0.5) * 60;
        }
      }
      this.emberParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }
}

window.TechfestUniverse = TechfestUniverse;
