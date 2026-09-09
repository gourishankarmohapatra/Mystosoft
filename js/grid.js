/* ============================================
   MYSTOSOFT - Three.js Perspective Grid
   Warping perspective grid with scroll velocity
   ============================================ */

function initGrid(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 2, 5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // Grid
  const gridSize = 40;
  const gridDivisions = 40;
  const gridMaterial = new THREE.LineBasicMaterial({
    color: 0x333333,
    transparent: true,
    opacity: 0.3,
  });

  const gridGeometry = new THREE.BufferGeometry();
  const gridPoints = [];

  for (let i = -gridSize / 2; i <= gridSize / 2; i += gridSize / gridDivisions) {
    gridPoints.push(-gridSize / 2, 0, i, gridSize / 2, 0, i);
    gridPoints.push(i, 0, -gridSize / 2, i, 0, gridSize / 2);
  }

  gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridPoints, 3));
  const grid = new THREE.LineSegments(gridGeometry, gridMaterial);
  grid.position.y = -1;
  scene.add(grid);

  // Scanning line
  const scanGeometry = new THREE.PlaneGeometry(gridSize, 0.05);
  const scanMaterial = new THREE.MeshBasicMaterial({
    color: 0xFF1A1A,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  });
  const scanLine = new THREE.Mesh(scanGeometry, scanMaterial);
  scanLine.rotation.x = -Math.PI / 2;
  scanLine.position.y = -0.99;
  scene.add(scanLine);

  // Glow behind scan
  const glowGeometry = new THREE.PlaneGeometry(gridSize, 0.8);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xFF1A1A,
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide,
  });
  const glowPlane = new THREE.Mesh(glowGeometry, glowMaterial);
  glowPlane.rotation.x = -Math.PI / 2;
  glowPlane.position.y = -0.98;
  scene.add(glowPlane);

  // Mouse and scroll
  let mouseX = 0, scrollVelocity = 0;
  let lastScroll = 0;

  canvas.parentElement.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
  });

  window.addEventListener('scroll', () => {
    const current = window.scrollY;
    scrollVelocity = Math.abs(current - lastScroll) * 0.01;
    lastScroll = current;
  }, { passive: true });

  // Animation
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.01;
    scrollVelocity *= 0.95;

    // Warp grid based on scroll velocity
    const warp = 1 + scrollVelocity * 0.5;
    grid.scale.set(1, 1, warp);
    grid.position.z = -scrollVelocity * 2;

    // Mouse parallax
    camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.03;

    // Animate scan line
    const scanZ = ((time * 3) % gridSize) - gridSize / 2;
    scanLine.position.z = scanZ;
    glowPlane.position.z = scanZ;

    // Pulse opacity
    scanMaterial.opacity = 0.4 + Math.sin(time * 4) * 0.2;
    glowMaterial.opacity = 0.05 + Math.sin(time * 3) * 0.03;

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
