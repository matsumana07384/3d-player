(() => {
  const COLORS = {
    custard: 0xF7DFA8,
    milk:    0xFFFDF6,
    latte:   0xF1E4CF,
    caramel: 0xE3B878,
    creamW:  0xFFF6E8,
    mint:    0x9ED9B5,
    mintD:   0x7BBF98,
    choco:   0x8B5E3C,
    chocoD:  0x6B4429,
    coral:   0xF2917E,
    cocoa:   0x5A3E2B,
    blush:   0xF8B8B0,
    ground:  0xFDF0D5,
  };

  const stage = document.getElementById('stage');
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 2.6, 8.5);
  camera.lookAt(0, 1.6, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);

  // --- lights -------------------------------------------------
  scene.add(new THREE.HemisphereLight(0xFFFBEF, 0xE8D5B0, 0.95));
  const sun = new THREE.DirectionalLight(0xFFFFFF, 0.75);
  sun.position.set(4, 8, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -6; sun.shadow.camera.right = 6;
  sun.shadow.camera.top = 6;  sun.shadow.camera.bottom = -6;
  scene.add(sun);

  // --- ground -------------------------------------------------
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(6, 48),
    new THREE.MeshStandardMaterial({ color: COLORS.ground, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(5.7, 6, 48),
    new THREE.MeshBasicMaterial({ color: COLORS.mint, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  scene.add(ring);

  // --- helpers ------------------------------------------------
  const mat = (color, rough = 0.85) =>
    new THREE.MeshStandardMaterial({ color, roughness: rough });

  function ball(r, color, sx = 1, sy = 1, sz = 1) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), mat(color));
    m.scale.set(sx, sy, sz);
    m.castShadow = true;
    return m;
  }

  // --- character ----------------------------------------------
  const chara = new THREE.Group();   // user-rotated
  const bouncer = new THREE.Group(); // animated (jump / bob)
  chara.add(bouncer);
  scene.add(chara);

  // meshes whose color follows the body-color picker
  const bodyColored = [];   // main body color
  const accentColored = []; // belly / feet (slightly darker accent)

  // body
  const body = ball(1.05, COLORS.milk, 1, 0.92, 0.92);
  body.position.y = 1.0;
  bouncer.add(body);
  bodyColored.push(body);

  // belly patch
  const belly = ball(0.72, COLORS.latte, 1, 0.9, 0.55);
  belly.position.set(0, 0.92, 0.52);
  bouncer.add(belly);
  accentColored.push(belly);

  // head group (tilts)
  const head = new THREE.Group();
  head.position.set(0, 2.35, 0);
  bouncer.add(head);

  const skull = ball(0.95, COLORS.milk, 1.08, 1, 1);
  head.add(skull);
  bodyColored.push(skull);

  // ▼ nose (small flattened cone, point down)
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.065, 0.085, 24), mat(COLORS.cocoa, 0.6));
  nose.rotation.x = Math.PI; // apex down → ▼
  nose.scale.z = 0.5;
  nose.position.set(0, 0.0, 0.94);
  nose.castShadow = true;
  head.add(nose);

  // ω mouth (two arcs right under the nose)
  const mouthGeo = new THREE.TorusGeometry(0.075, 0.02, 8, 20, Math.PI);
  const mouthMat = mat(COLORS.cocoa, 0.6);
  const mouthL = new THREE.Mesh(mouthGeo, mouthMat);
  const mouthR = new THREE.Mesh(mouthGeo, mouthMat);
  mouthL.rotation.z = Math.PI; // flip arc to open upward → ∪∪ = ω
  mouthR.rotation.z = Math.PI;
  mouthL.position.set(-0.073, -0.03, 0.945);
  mouthR.position.set( 0.073, -0.03, 0.945);
  head.add(mouthL, mouthR);

  // eyes (blink by scaling y)
  const eyeL = ball(0.05, 0x3A2A1E);
  const eyeR = eyeL.clone();
  eyeL.position.set(-0.38, 0.12, 0.86);
  eyeR.position.set( 0.38, 0.12, 0.86);
  head.add(eyeL, eyeR);

  // lop ears (pivot at top so they swing)
  function makeEar(side) {
    const pivot = new THREE.Group();
    pivot.position.set(0.92 * side, 0.75, 0.05);
    const ear = ball(0.34, COLORS.milk, 0.55, 1.4, 0.42);
    ear.position.y = -0.5;
    pivot.add(ear);
    bodyColored.push(ear);
    pivot.rotation.z = 0.4 * side; // drape outward
    head.add(pivot);
    return pivot;
  }
  const earL = makeEar(-1);
  const earR = makeEar(1);

  // beret, worn straight
  const beret = new THREE.Group();
  beret.position.set(0, 0.86, 0);
  const beretTop = ball(0.55, COLORS.choco, 1.05, 0.45, 1.05);
  const beretStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.16, 12), mat(COLORS.chocoD));
  beretStem.position.y = 0.26;
  beret.add(beretTop, beretStem);
  head.add(beret);

  // arms (shoulder pivots so they can swing / wave)
  function makeArm(side) {
    const pivot = new THREE.Group();
    pivot.position.set(0.8 * side, 1.55, 0.2);
    const arm = ball(0.3, COLORS.milk, 0.85, 1.15, 0.85);
    arm.position.y = -0.38;
    pivot.add(arm);
    bodyColored.push(arm);
    pivot.rotation.z = 0.3 * side; // rest slightly outward
    bouncer.add(pivot);
    return pivot;
  }
  const armL = makeArm(-1);
  const armR = makeArm(1);

  // feet (ankle pivots so they can tap)
  function makeFoot(side) {
    const pivot = new THREE.Group();
    pivot.position.set(0.45 * side, 0.42, 0.12);
    const foot = ball(0.34, COLORS.latte, 1, 0.7, 1.15);
    foot.position.set(0, -0.18, 0.18);
    pivot.add(foot);
    accentColored.push(foot);
    bouncer.add(pivot);
    return pivot;
  }
  const footL = makeFoot(-1);
  const footR = makeFoot(1);
  const footLHome = footL.position.clone();
  const footRHome = footR.position.clone();

  // tail (wags)
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.52, -0.85);
  const tail = ball(0.2, COLORS.milk, 1, 1, 1.3);
  tail.position.z = -0.12;
  tailPivot.add(tail);
  bodyColored.push(tail);
  bouncer.add(tailPivot);

  // * mark below the tail
  const star = new THREE.Group();
  const starBarGeo = new THREE.BoxGeometry(0.022, 0.15, 0.022);
  const starMat = mat(COLORS.cocoa, 0.6);
  for (let i = 0; i < 3; i++) {
    const bar = new THREE.Mesh(starBarGeo, starMat);
    bar.rotation.z = (Math.PI / 3) * i;
    star.add(bar);
  }
  star.position.set(0, 0.3, -0.78);
  star.rotation.x = -0.55; // follow the body surface
  bouncer.add(star);

  // --- interaction: drag to rotate ----------------------------
  let dragging = false, moved = 0, px = 0, py = 0;
  let velY = 0; // inertia

  stage.addEventListener('pointerdown', (e) => {
    dragging = true; moved = 0;
    px = e.clientX; py = e.clientY;
    stage.classList.add('grabbing');
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - px, dy = e.clientY - py;
    moved += Math.abs(dx) + Math.abs(dy);
    chara.rotation.y += dx * 0.008;
    chara.rotation.x = THREE.MathUtils.clamp(chara.rotation.x + dy * 0.004, -0.3, 0.25);
    velY = dx * 0.008;
    px = e.clientX; py = e.clientY;
  });
  stage.addEventListener('pointerup', () => {
    dragging = false;
    stage.classList.remove('grabbing');
    if (moved < 6) jump(); // it was a tap
  });

  // --- animation state machine ---------------------------------
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let jumpT = -1;   // 0..1 while jumping
  let spinT = -1;   // 0..1 while spinning
  let waveT = -1;   // 0..~1.6s while waving
  let bothWaveT = -1; // 0..~1.8s while waving both hands
  let kenkenpaT = -1; // 0..~2.1s while doing ken-ken-pa
  let winkT = -1;   // 0..~0.7s while winking
  let blinkT = 0;
  let nextBlink = 2.2;

  function jump() {
    if (jumpT < 0) jumpT = 0;
  }
  function spin() {
    if (spinT < 0) { spinT = 0; jump(); }
  }
  function wave() {
    if (waveT < 0) waveT = 0;
  }
  function bothWave() {
    if (bothWaveT < 0) bothWaveT = 0;
  }
  function kenkenpa() {
    if (kenkenpaT < 0) kenkenpaT = 0;
  }
  function wink() {
    if (winkT < 0) winkT = 0;
  }
  document.getElementById('btnJump').addEventListener('click', jump);
  document.getElementById('btnSpin').addEventListener('click', spin);
  document.getElementById('btnWave').addEventListener('click', wave);
  document.getElementById('btnBothWave').addEventListener('click', bothWave);
  document.getElementById('btnKenkenpa').addEventListener('click', kenkenpa);
  document.getElementById('btnWink').addEventListener('click', wink);

  // --- color pickers -------------------------------------------
  const bindColor = (id, apply) =>
    document.getElementById(id).addEventListener('input', (e) =>
      apply(new THREE.Color(e.target.value)));

  bindColor('bodyColor', (c) => {
    bodyColored.forEach((m) => m.material.color.copy(c));
    const accent = c.clone().offsetHSL(0, 0.08, -0.07); // belly & feet
    accentColored.forEach((m) => m.material.color.copy(accent));
  });
  bindColor('hatColor', (c) => {
    beretTop.material.color.copy(c);
    beretStem.material.color.copy(c.clone().offsetHSL(0, 0, -0.08));
  });
  bindColor('faceColor', (c) => {
    nose.material.color.copy(c);
    mouthMat.color.copy(c);
    eyeL.material.color.copy(c); // eyeR shares the material
    starMat.color.copy(c);       // おしりの*も連動
  });

  // --- main loop ------------------------------------------------
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // inertia
    if (!dragging) {
      chara.rotation.y += velY;
      velY *= 0.92;
      chara.rotation.x *= 0.95;
    }

    if (!reduceMotion) {
      // idle bob & breathing
      bouncer.position.y = Math.sin(t * 2.2) * 0.05;
      body.scale.y = 0.92 + Math.sin(t * 2.2) * 0.012;

      // head tilt
      head.rotation.z = Math.sin(t * 0.9) * 0.06;
      head.rotation.y = Math.sin(t * 0.6) * 0.08;

      // ears sway
      earL.rotation.z = -0.4 - Math.sin(t * 2.2 + 0.4) * 0.07;
      earR.rotation.z =  0.4 + Math.sin(t * 2.2) * 0.07;
      earL.rotation.x = earR.rotation.x = Math.sin(t * 2.2 + 1) * 0.06;

      // arms sway & feet tap
      armL.rotation.z = -0.3 + Math.sin(t * 2.2) * 0.12;
      armR.rotation.z =  0.3 - Math.sin(t * 2.2) * 0.12;
      footL.rotation.x = -Math.max(0, Math.sin(t * 3)) * 0.3;
      footR.rotation.x = -Math.max(0, -Math.sin(t * 3)) * 0.3;

      // tail wag
      tailPivot.rotation.y = Math.sin(t * 6) * 0.5;
    }

    // blinking
    nextBlink -= dt;
    if (nextBlink <= 0) { blinkT = 0.18; nextBlink = 2 + Math.random() * 3; }
    if (blinkT > 0) {
      blinkT -= dt;
      const s = blinkT > 0.09 ? 0.12 : 1;
      eyeL.scale.y = eyeR.scale.y = s;
    } else {
      eyeL.scale.y = eyeR.scale.y = 1;
    }

    // wink (right eye closed + playful head tilt)
    if (winkT >= 0) {
      winkT += dt;
      if (winkT > 0.7) winkT = -1;
      else {
        eyeR.scale.y = 0.12;
        head.rotation.z += Math.sin((winkT / 0.7) * Math.PI) * -0.18;
      }
    }

    // jump (squash & stretch)
    if (jumpT >= 0) {
      jumpT += dt * 1.6;
      if (jumpT >= 1) {
        jumpT = -1;
        bouncer.scale.set(1, 1, 1);
      } else {
        const h = Math.sin(jumpT * Math.PI);
        bouncer.position.y = h * 1.5;
        armL.rotation.z = -0.3 - h * 2.0; // ばんざい
        armR.rotation.z =  0.3 + h * 2.0;
        const stretch = 1 + h * 0.12;
        bouncer.scale.set(1 / Math.sqrt(stretch), stretch, 1 / Math.sqrt(stretch));
      }
    }

    // spin
    if (spinT >= 0) {
      spinT += dt * 1.4;
      if (spinT >= 1) spinT = -1;
      else chara.rotation.y += dt * 14 * Math.sin(spinT * Math.PI);
    }

    // wave (right arm up, swinging side to side)
    if (waveT >= 0) {
      waveT += dt;
      if (waveT > 1.6) waveT = -1;
      else armR.rotation.z = 2.2 + Math.sin(waveT * 16) * 0.35;
    }

    // both hands wave
    if (bothWaveT >= 0) {
      bothWaveT += dt;
      if (bothWaveT > 1.8) bothWaveT = -1;
      else {
        const swing = Math.sin(bothWaveT * 18) * 0.32;
        armL.rotation.z = -2.2 - swing;
        armR.rotation.z =  2.2 + swing;
        head.rotation.z += Math.sin(bothWaveT * 9) * 0.08;
      }
    }

    // ken-ken-pa: two one-foot hops, then a two-foot landing.
    if (kenkenpaT >= 0) {
      kenkenpaT += dt;
      const duration = 2.1;
      if (kenkenpaT > duration) {
        kenkenpaT = -1;
        chara.rotation.z = 0;
        footL.position.copy(footLHome);
        footR.position.copy(footRHome);
        footL.rotation.set(0, 0, 0);
        footR.rotation.set(0, 0, 0);
      } else {
        const step = kenkenpaT / (duration / 3);
        const phase = Math.min(2, Math.floor(step));
        const local = step - phase;
        const hop = Math.sin(local * Math.PI);

        bouncer.position.y = hop * (phase < 2 ? 0.65 : 0.45);
        head.rotation.z += Math.sin(kenkenpaT * 10) * 0.08;

        if (phase < 2) {
          const sideLean = phase === 0 ? -1 : 1;
          chara.rotation.z = sideLean * hop * 0.08;
          armL.rotation.z = -0.9 - hop * 0.5;
          armR.rotation.z =  0.9 + hop * 0.5;
          footL.position.copy(footLHome);
          footR.position.copy(footRHome);
          footL.rotation.z = 0;
          footR.rotation.z = 0;
          footL.rotation.x = phase === 0 ? -hop * 0.35 : -0.75 * hop;
          footR.rotation.x = phase === 0 ? -0.75 * hop : -hop * 0.35;
        } else {
          chara.rotation.z = 0;
          armL.rotation.z = -1.2 + hop * 0.25;
          armR.rotation.z =  1.2 - hop * 0.25;
          footL.position.set(footLHome.x - 0.16 * hop, footLHome.y, footLHome.z);
          footR.position.set(footRHome.x + 0.16 * hop, footRHome.y, footRHome.z);
          footL.rotation.x = 0;
          footR.rotation.x = 0;
          footL.rotation.z =  hop * 0.22;
          footR.rotation.z = -hop * 0.22;
        }
      }
    }

    renderer.render(scene, camera);
  }
  animate();

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
})();
