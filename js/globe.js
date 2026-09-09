/* ============================================
   MYSTOSOFT - Three.js Globe
   Interactive 3D globe with city nodes
   ============================================ */

function initGlobe(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.z = 3.2;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // Globe wireframe
  const globeGeometry = new THREE.IcosahedronGeometry(1, 3);
  const globeMaterial = new THREE.MeshBasicMaterial({
    color: 0x333333,
    wireframe: true,
    transparent: true,
    opacity: 0.15,
  });
  const globe = new THREE.Mesh(globeGeometry, globeMaterial);
  scene.add(globe);

  // Inner glow sphere
  const glowGeometry = new THREE.SphereGeometry(0.98, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xFF1A1A,
    transparent: true,
    opacity: 0.03,
  });
  const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
  scene.add(glowSphere);

  // City nodes data (lat, lng converted to 3D)
  const cities = [
    { name: 'Silicon Valley', lat: 37.3861, lng: -122.0839, ping: 12 },
    { name: 'London', lat: 51.5074, lng: -0.1278, ping: 45 },
    { name: 'Frankfurt', lat: 50.1109, lng: 8.6821, ping: 52 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503, ping: 89 },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198, ping: 76 },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093, ping: 110 },
  ];

  function latLngToVector3(lat, lng, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  // Create city markers
  const markerGroup = new THREE.Group();
  const markerPositions = [];
  cities.forEach(city => {
    const pos = latLngToVector3(city.lat, city.lng, 1.02);
    markerPositions.push(pos);

    // Marker dot
    const dotGeometry = new THREE.SphereGeometry(0.015, 8, 8);
    const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xFF1A1A });
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.copy(pos);
    markerGroup.add(dot);

    // Pulse ring
    const ringGeometry = new THREE.RingGeometry(0.02, 0.03, 16);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF1A1A,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(pos);
    ring.lookAt(new THREE.Vector3(0, 0, 0));
    ring.userData = { baseScale: 1, phase: Math.random() * Math.PI * 2 };
    markerGroup.add(ring);
  });
  scene.add(markerGroup);

  // Arc connections between cities
  const arcGroup = new THREE.Group();
  const arcConnections = [
    [0, 1], [0, 4], [1, 2], [2, 4], [3, 4], [4, 5], [0, 3]
  ];

  arcConnections.forEach(([i, j]) => {
    const start = markerPositions[i];
    const end = markerPositions[j];
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    mid.normalize().multiplyScalar(1.4);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(50);
    const arcGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const arcMaterial = new THREE.LineBasicMaterial({
      color: 0xFF1A1A,
      transparent: true,
      opacity: 0.2,
    });
    const arc = new THREE.Line(arcGeometry, arcMaterial);
    arcGroup.add(arc);
  });
  scene.add(arcGroup);

  // Particles along arcs
  const particleGroup = new THREE.Group();
  const particleData = [];
  arcConnections.forEach(([i, j], idx) => {
    const start = markerPositions[i];
    const end = markerPositions[j];
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    mid.normalize().multiplyScalar(1.4);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);

    for (let p = 0; p < 3; p++) {
      const particleGeometry = new THREE.SphereGeometry(0.005, 4, 4);
      const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xFF1A1A, transparent: true, opacity: 0.8 });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particleGroup.add(particle);
      particleData.push({
        mesh: particle,
        curve: curve,
        progress: Math.random(),
        speed: 0.002 + Math.random() * 0.003,
      });
    }
  });
  scene.add(particleGroup);

  // Mouse interaction
  let mouseX = 0, mouseY = 0;
  let targetRotX = 0, targetRotY = 0;
  canvas.parentElement.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  });

  // Tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'globe-tooltip';
  tooltip.style.cssText = 'position:absolute;display:none;background:rgba(0,0,0,0.9);border:1px solid rgba(255,26,26,0.3);border-radius:8px;padding:8px 12px;font-family:var(--font-mono);font-size:11px;color:#fff;pointer-events:none;z-index:10;white-space:nowrap;';
  canvas.parentElement.appendChild(tooltip);

  canvas.parentElement.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(markerGroup.children.filter(c => c.geometry.type === 'SphereGeometry'));
    if (intersects.length > 0) {
      const idx = markerGroup.children.indexOf(intersects[0].object);
      if (idx >= 0 && idx < cities.length) {
        const city = cities[idx];
        tooltip.innerHTML = `<span style="color:#FF1A1A">${city.name}</span> — ping: ${city.ping}ms`;
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
        tooltip.style.top = (e.clientY - rect.top - 10) + 'px';
      }
    } else {
      tooltip.style.display = 'none';
    }
  });

  // Animation loop
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.01;

    targetRotY = mouseX * 0.3;
    targetRotX = mouseY * 0.2;
    globe.rotation.y += (targetRotY - globe.rotation.y) * 0.02;
    globe.rotation.x += (targetRotX - globe.rotation.x) * 0.02;
    globe.rotation.y += 0.001;
    globe.rotation.x = Math.sin(time * 0.5) * 0.1;

    markerGroup.rotation.copy(globe.rotation);
    arcGroup.rotation.copy(globe.rotation);
    particleGroup.rotation.copy(globe.rotation);

    // Animate ring pulses
    markerGroup.children.forEach(child => {
      if (child.userData && child.userData.phase !== undefined) {
        const scale = 1 + Math.sin(time * 2 + child.userData.phase) * 0.3;
        child.scale.set(scale, scale, scale);
        child.material.opacity = 0.4 - Math.sin(time * 2 + child.userData.phase) * 0.2;
      }
    });

    // Animate particles
    particleData.forEach(p => {
      p.progress += p.speed;
      if (p.progress > 1) p.progress = 0;
      const point = p.curve.getPoint(p.progress);
      p.mesh.position.copy(point);
    });

    renderer.render(scene, camera);
  }
  animate();

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  });
}
