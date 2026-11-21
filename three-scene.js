/**
 * IMPULZE Techfest 3D Engine
 * Replicates the exact 3D camera movement, atmospheric mist, and scroll transition
 * of the Techfest website as demonstrated in the user screen recording.
 */

class TechfestUniverse {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = null;

    // Background planes & textures
    this.heroPlane = null;
    this.arenaPlane = null;
    this.fogParticles = null;
    this.emberParticles = null;

    // Movement & scroll states
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.scrollProgress = 0;
    this.targetScrollProgress = 0;

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

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    // Setup 3D elements
    this.setupLighting();
    this.createBackgroundLayers();
    this.createAtmosphericParticles();

    // Bind event listeners
    this.bindEvents();

    // Animation Loop
    this.animate();
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambient);

    // Warm Sunset Light
    const sunLight = new THREE.DirectionalLight(0xffbe85, 1.2);
    sunLight.position.set(15, 12, 10);
    this.scene.add(sunLight);

    // Golden Ambient Light
    const goldLight = new THREE.PointLight(0xffa500, 1.5, 60);
    goldLight.position.set(0, 0, 15);
    this.scene.add(goldLight);
  }

  createBackgroundLayers() {
    const textureLoader = new THREE.TextureLoader();

    // Plane geometry sized to cover the viewport cleanly at z = 0
    const planeGeo = new THREE.PlaneGeometry(64, 36);

    // 1. Deep Arena View (The grand temple with columns & hero)
    textureLoader.load('public/techfest-assets/deep_arena.jpg', (arenaTex) => {
      arenaTex.minFilter = THREE.LinearFilter;
      arenaTex.magFilter = THREE.LinearFilter;
      const arenaMat = new THREE.MeshBasicMaterial({
        map: arenaTex,
        transparent: true,
        opacity: 1.0,
        depthWrite: false
      });
      this.arenaPlane = new THREE.Mesh(planeGeo, arenaMat);
      this.arenaPlane.position.set(0, 0, 0);
      this.scene.add(this.arenaPlane);
    });

    // 2. Hero Fog View (The misty morning clouds & floating citadel)
    textureLoader.load('public/techfest-assets/hero_fog.jpg', (heroTex) => {
      heroTex.minFilter = THREE.LinearFilter;
      heroTex.magFilter = THREE.LinearFilter;
      const heroMat = new THREE.MeshBasicMaterial({
        map: heroTex,
        transparent: true,
        opacity: 1.0,
        depthWrite: false
      });
      this.heroPlane = new THREE.Mesh(planeGeo, heroMat);
      this.heroPlane.position.set(0, 0, 2);
      this.scene.add(this.heroPlane);
    });
  }

  createAtmosphericParticles() {
    // Floating Golden Embers & Dust Particles
    const particleCount = 280;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    this.particleSpeeds = [];

    const goldColor = new THREE.Color(0xffd57a);
    const coralColor = new THREE.Color(0xff6e59);
    const mistColor = new THREE.Color(0xffffff);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 55;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 2] = Math.random() * 25;

      const pick = Math.random();
      const col = pick > 0.6 ? goldColor : (pick > 0.3 ? coralColor : mistColor);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      scales[i] = Math.random() * 1.8 + 0.6;
      this.particleSpeeds.push({
        vx: (Math.random() - 0.5) * 0.015,
        vy: 0.01 + Math.random() * 0.02,
        vz: (Math.random() - 0.5) * 0.01
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const mat = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
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
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;
    this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.08;

    const sp = this.scrollProgress;

    // 1. Camera Zoom & Motion along Z axis on scroll
    // At sp = 0: Camera is at z = 30 (outside in misty clouds)
    // At sp = 0.5: Camera dives forward to z = 25 (entering temple)
    // At sp = 1.0: Camera moves down towards arena floor
    const targetCamZ = THREE.MathUtils.lerp(30, 24, sp);
    const targetCamY = THREE.MathUtils.lerp(0, -1.8 * sp, sp);

    // Apply smooth mouse parallax
    this.camera.position.x = this.mouseX * 1.5;
    this.camera.position.y = targetCamY - this.mouseY * 1.0;
    this.camera.position.z = targetCamZ;
    this.camera.lookAt(0, targetCamY * 0.5, 0);

    // 2. Background Transition between Hero Fog and Arena Temple
    if (this.heroPlane && this.arenaPlane) {
      // Hero plane fades out between scroll 0.08 and 0.45
      let fogOpacity = 1.0;
      if (sp < 0.08) {
        fogOpacity = 1.0;
      } else if (sp < 0.45) {
        fogOpacity = 1.0 - (sp - 0.08) / 0.37;
      } else {
        fogOpacity = 0.0;
      }
      this.heroPlane.material.opacity = Math.max(0, Math.min(1, fogOpacity));

      // Hero plane zooms slightly as you penetrate the fog
      const heroScale = 1.0 + sp * 0.18;
      this.heroPlane.scale.set(heroScale, heroScale, 1);

      // Arena plane scales into majestic full view
      const arenaScale = 1.0 + (1.0 - sp) * 0.08;
      this.arenaPlane.scale.set(arenaScale, arenaScale, 1);
    }

    // 3. Floating Embers Animation
    if (this.emberParticles && this.emberPositions) {
      const positions = this.emberPositions;
      const count = positions.length / 3;

      for (let i = 0; i < count; i++) {
        positions[i * 3] += this.particleSpeeds[i].vx + Math.sin(elapsedTime * 0.8 + i) * 0.005;
        positions[i * 3 + 1] += this.particleSpeeds[i].vy;
        positions[i * 3 + 2] += this.particleSpeeds[i].vz;

        // Reset if drifted too high
        if (positions[i * 3 + 1] > 20) {
          positions[i * 3 + 1] = -18;
          positions[i * 3] = (Math.random() - 0.5) * 55;
        }
      }
      this.emberParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }
}

window.TechfestUniverse = TechfestUniverse;
