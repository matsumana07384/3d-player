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

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
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

  // --- character presets --------------------------------------
  // A character factory owns model construction and exposes only the parts
  // that the common player needs for interaction and animation.
  function createPompomCharacter() {
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

  // --- dress-up accessories ----------------------------------
  const ribbon = new THREE.Group();
  ribbon.position.set(-0.55, 0.58, 0.68);
  const ribbonMat = mat(COLORS.coral, 0.7);
  const ribbonL = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 12), ribbonMat);
  const ribbonR = ribbonL.clone();
  ribbonL.scale.set(1.4, 0.65, 0.25);
  ribbonR.scale.set(1.4, 0.65, 0.25);
  ribbonL.position.x = -0.18;
  ribbonR.position.x = 0.18;
  const ribbonKnot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 10), ribbonMat);
  ribbon.add(ribbonL, ribbonR, ribbonKnot);
  head.add(ribbon);

  const glasses = new THREE.Group();
  glasses.position.set(0, 0.1, 0.93);
  const glassesMat = new THREE.MeshBasicMaterial({ color: COLORS.cocoa, side: THREE.DoubleSide });
  const lensL = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 8, 24), glassesMat);
  const lensR = lensL.clone();
  lensL.position.x = -0.23;
  lensR.position.x = 0.23;
  const glassesBridge = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.035, 0.035), glassesMat);
  glasses.add(lensL, lensR, glassesBridge);
  head.add(glasses);

  const cape = new THREE.Group();
  cape.position.set(0, 1.55, -1.03);
  const capeMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 1.75),
    new THREE.MeshStandardMaterial({ color: COLORS.coral, roughness: 0.8, side: THREE.DoubleSide })
  );
  capeMesh.position.y = -0.35;
  cape.add(capeMesh);
  bouncer.add(cape);

  const catEars = new THREE.Group();
  const catEarMat = mat(COLORS.caramel, 0.8);
  const catEarL = new THREE.Mesh(new THREE.ConeGeometry(0.23, 0.65, 4), catEarMat);
  const catEarR = catEarL.clone();
  catEarL.position.set(-0.48, 0.92, 0);
  catEarR.position.set(0.48, 0.92, 0);
  catEars.add(catEarL, catEarR);
  head.add(catEars);
  ribbon.visible = false;
  glasses.visible = false;
  cape.visible = false;
  catEars.visible = false;

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

  // --- umbrella -------------------------------------------------
  // 傘は普段シーン直下（上空の待機位置）にあり、「もつ」でキャラクターの
  // 左手（armL）の子として付け替えられる。「はなす」で再びシーン直下に
  // 戻り、上空へ飛んでいくアニメーションをして待機位置へ帰る。
  //
  // 座標系：umbrella グループの原点＝持ち手（グリップ）。そこから軸(shaft)が
  // 上に伸び、頭上を覆うくらい大きな傘の傘布(canopyGroup)がその先に付く。
  // グリップは armL よりさらに外側・手前（z+方向）に置くことで、傘が
  // キャラクターの体やヒヨコ毛に隠れて「後ろに入り込む」のを防いでいる。
  const umbrellaShaftLen = 2.7;
  const umbrellaCanopyRadius = 1.75;
  const umbrellaCanopyHeight = 0.6;

  const umbrellaClosedScale = new THREE.Vector3(0.1, 1.5, 0.1);
  const umbrellaOpenScale = new THREE.Vector3(1, 1, 1);
  const umbrellaStorePos = new THREE.Vector3(-2.6, 5.6, 0.9); // 画面外・上空の待機位置
  const umbrellaHeldLocalPos = new THREE.Vector3(-0.4, -0.72, 0.42); // armL内でのグリップ位置
  const umbrellaHeldLocalRot = new THREE.Euler(-0.05, 0, 0.1);

  const umbrella = new THREE.Group();

  // 持ち手（フック状のカーブ）
  const umbrellaHandle = new THREE.Mesh(
    new THREE.TorusGeometry(0.17, 0.034, 8, 20, Math.PI * 1.4), mat(COLORS.chocoD, 0.5));
  umbrellaHandle.position.set(0, -0.05, 0);
  umbrellaHandle.rotation.z = Math.PI * 0.15;
  umbrellaHandle.castShadow = true;
  umbrella.add(umbrellaHandle);

  // 軸（シャフト）：グリップから頭上まで一直線に伸びる
  const umbrellaShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, umbrellaShaftLen, 10), mat(COLORS.cocoa, 0.5));
  umbrellaShaft.position.y = umbrellaShaftLen / 2;
  umbrellaShaft.castShadow = true;
  umbrella.add(umbrellaShaft);

  // 傘布（傘の開閉はこのグループごとスケールさせる）
  const canopyGroup = new THREE.Group();
  canopyGroup.position.y = umbrellaShaftLen + umbrellaCanopyHeight / 2;
  canopyGroup.scale.copy(umbrellaClosedScale);
  umbrella.add(canopyGroup);

  // 8枚パネルのカクカクした傘布（画像のような、骨が入った布の見た目）
  const canopyGeo = new THREE.ConeGeometry(umbrellaCanopyRadius, umbrellaCanopyHeight, 8, 1, true);
  const canopyMat = new THREE.MeshStandardMaterial({
    color: COLORS.mintD, roughness: 0.55, flatShading: true, side: THREE.DoubleSide, // デフォルトはグリーン
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.castShadow = true;
  canopyGroup.add(canopy);

  // 傘布の下側の陰影（裏地）— 画像のように内側が少し暗く見えるように
  const canopyInnerMat = new THREE.MeshStandardMaterial({
    color: 0x3d8b40, roughness: 0.7, flatShading: true, side: THREE.BackSide,
  });
  const canopyInner = new THREE.Mesh(canopyGeo, canopyInnerMat);
  canopyInner.scale.set(0.985, 0.985, 0.985);
  canopyGroup.add(canopyInner);

  // 縁の縫い目（トリム）
  const rimMat = mat(0x3d8b40, 0.6);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(umbrellaCanopyRadius, 0.045, 6, 8), rimMat);
  rim.position.y = -umbrellaCanopyHeight / 2;
  rim.rotation.x = Math.PI / 2;
  canopyGroup.add(rim);

  // 先端の石突き（開いた状態の高さに固定）
  const umbrellaTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.045, 0.2, 8), mat(COLORS.cocoa, 0.5));
  umbrellaTip.position.y = umbrellaShaftLen + umbrellaCanopyHeight + 0.1;
  umbrella.add(umbrellaTip);

  umbrella.position.copy(umbrellaStorePos);
  scene.add(umbrella);

    return {
      chara,
      bouncer,
      body,
      bodyColored,
      accentColored,
      head,
      nose,
      mouthMat,
      starMat,
      eyeL,
      eyeR,
      earL,
      earR,
      beretTop,
      beretStem,
      accessories: { beret, ribbon, glasses, cape, catEars },
      armL,
      armR,
      footL,
      footR,
      footLHome,
      footRHome,
      tailPivot,
      umbrella,
      canopyGroup,
      canopy,
      canopyInner,
      rim,
      umbrellaClosedScale,
      umbrellaOpenScale,
      umbrellaStorePos,
      umbrellaHeldLocalPos,
      umbrellaHeldLocalRot,
    };
  }

  // Add another factory here when a new character is introduced. The player
  // below remains unchanged as long as the factory returns the same contract.
  const characterFactories = {
    pompom: createPompomCharacter,
  };
  const characterName = document.body.dataset.character || 'pompom';
  const createCharacter = characterFactories[characterName] || characterFactories.pompom;
  const character = createCharacter();
  const {
    chara, bouncer, body, bodyColored, accentColored, head, nose, mouthMat,
    eyeL, eyeR, earL, earR, beretTop, beretStem, armL, armR, footL, footR,
    footLHome, footRHome,
    tailPivot, umbrella, canopyGroup, canopy, canopyInner, rim, starMat,
    accessories,
    umbrellaClosedScale, umbrellaOpenScale,
    umbrellaStorePos, umbrellaHeldLocalPos, umbrellaHeldLocalRot,
  } = character;
  // 逆立ち時に頭頂部が床へ届く高さ（モデルの頭頂部基準）
  const headSpinContactHeight = 3.6;

  // --- interaction: drag to rotate ----------------------------
  let dragging = false, moved = 0, px = 0, py = 0;
  let velY = 0; // inertia
  let photoMode = false;
  let selectedStamp = '💖';
  let activeFrameIndex = 0;
  let photoStamps = [];

  // 複数アニメーションの重複実行を防ぐための判定
  function isBusy() {
    return jumpT >= 0 || spinT >= 0 || waveT >= 0 || bothWaveT >= 0 || hopscotchT >= 0 || takeAwayT >= 0 || winkT >= 0 || touchT >= 0 || frontT >= 0 || headSpinT >= 0 || powerSpinT >= 0 ||
      umbrellaHoldT >= 0 || umbrellaOpenT >= 0 || umbrellaCloseT >= 0 || umbrellaReleaseT >= 0;
  }

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
  function showTapReaction(x, y) {
    const reaction = document.createElement('span');
    const reactions = ['💖', '✨', '⭐', '🌟'];
    reaction.className = 'tap-reaction';
    reaction.textContent = reactions[Math.floor(Math.random() * reactions.length)];
    reaction.style.left = `${x}px`;
    reaction.style.top = `${y}px`;
    document.body.appendChild(reaction);
    reaction.addEventListener('animationend', () => reaction.remove(), { once: true });
  }

  function playTouch(x = innerWidth / 2, y = innerHeight / 2) {
    if (isBusy()) return;
    touchScreen();
    showTapReaction(x, y);
  }

  stage.addEventListener('pointerup', (e) => {
    dragging = false;
    stage.classList.remove('grabbing');
    // タップ判定で、他のアニメーションが再生中でなければタッチイベントを発火
    if (moved < 6 && !isBusy()) {
      if (photoMode) placePhotoStamp(e.clientX, e.clientY);
      else playTouch(e.clientX, e.clientY);
    }
  });

  // --- animation state machine ---------------------------------
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let jumpT = -1;
  let spinT = -1;
  let waveT = -1;
  let bothWaveT = -1;
  let hopscotchT = -1;
  let takeAwayT = -1;
  let winkT = -1;
  let touchT = -1;  // タッチイベント用
  let frontT = -1;
  let frontFromX = 0;
  let frontFromY = 0;
  let frontFromZ = 0;
  let frontToY = 0;
  let frontPosFromZ = 0;
  let headSpinT = -1;
  let powerSpinT = -1;
  let powerSpinAngle = 0;
  let powerSpinFromX = 0;
  let powerSpinFromY = 0;
  let powerSpinFromZ = 0;
  let headTiltHoldX = 0;
  let headTiltHoldZ = 0;
  let blinkT = 0;
  let nextBlink = 2.2;

  // 傘の状態
  let umbrellaHoldT = -1;
  let umbrellaOpenT = -1;
  let umbrellaCloseT = -1;
  let umbrellaReleaseT = -1;
  let umbrellaHeld = false;
  let umbrellaOpen = false;
  let umbrellaPendingOpen = false; // ひらくボタン経由で持たせた場合、飛んできた直後に自動で開く

  function normalizeAngle(angle) {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
  }

  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  function jump() { if (!isBusy()) jumpT = 0; }
  function spin() { if (!isBusy()) { spinT = 0; jumpT = 0; } }
  function wave() { if (!isBusy()) waveT = 0; }
  function bothWave() { if (!isBusy()) bothWaveT = 0; }
  function hopscotch() {
    if (hopscotchT >= 0) return;
    // Hopscotchは単独で確実に始められるよう、残っている動作を止めて姿勢を整える。
    resetAnimationsForFront();
    hopscotchT = 0;
    chara.position.set(0, 0, 0);
    chara.rotation.set(0, 0, 0);
    bouncer.position.y = 0;
    bouncer.scale.set(1, 1, 1);
    head.rotation.set(0, 0, 0);
    footL.position.copy(footLHome);
    footR.position.copy(footRHome);
    footL.rotation.set(0, 0, 0);
    footR.rotation.set(0, 0, 0);
    setControlsHidden(true);
  }
  function takeAway() { if (!isBusy()) takeAwayT = 0; }
  function wink() { if (!isBusy()) winkT = 0; }
  function touchScreen() { if (!isBusy()) touchT = 0; }
  function randomPlay() {
    if (isBusy()) return;
    const actions = ['jump', 'wave', 'bothWave', 'hopscotch', 'wink', 'spin', 'headSpin', 'touch'];
    actionHandlers[actions[Math.floor(Math.random() * actions.length)]]();
  }

  // 上空の待機位置から左手へ、傘が飛んでくる
  function beginHoldFlight() {
    if (umbrella.parent !== scene) scene.add(umbrella);
    umbrella.position.copy(umbrellaStorePos);
    umbrella.rotation.set(0, 0, 0);
    umbrellaHoldT = 0;
  }
  function holdUmbrella() {
    if (isBusy() || umbrellaHeld) return;
    beginHoldFlight();
  }
  function openUmbrella() {
    if (isBusy()) return;
    if (!umbrellaHeld) {
      // 傘を持っていなければ、まず持たせてから自動で開く
      umbrellaPendingOpen = true;
      beginHoldFlight();
      return;
    }
    if (umbrellaOpen) return;
    umbrellaOpenT = 0;
  }
  function closeUmbrella() {
    if (isBusy()) return;
    if (!umbrellaHeld) {
      // 傘を持っていなければ、まず持たせる（持った直後はもともと閉じた状態）
      beginHoldFlight();
      return;
    }
    if (!umbrellaOpen) return;
    umbrellaCloseT = 0;
  }
  // 左手から離れ、上空へ飛んでいって待機位置に戻る
  function releaseUmbrella() {
    if (isBusy() || !umbrellaHeld) return;
    const worldPos = new THREE.Vector3();
    umbrella.getWorldPosition(worldPos);
    const worldQuat = new THREE.Quaternion();
    umbrella.getWorldQuaternion(worldQuat);
    scene.add(umbrella);
    umbrella.position.copy(worldPos);
    umbrella.quaternion.copy(worldQuat);
    umbrellaHeld = false;
    umbrellaReleaseT = 0;
  }

  function resetAnimationsForFront() {
    jumpT = -1;
    spinT = -1;
    waveT = -1;
    bothWaveT = -1;
    hopscotchT = -1;
    takeAwayT = -1;
    winkT = -1;
    touchT = -1;
    frontT = -1;
    headSpinT = -1;
    powerSpinT = -1;

    bouncer.scale.set(1, 1, 1);
    footL.position.copy(footLHome);
    footR.position.copy(footRHome);
    footL.rotation.set(0, 0, 0);
    footR.rotation.set(0, 0, 0);
    armL.rotation.set(0, 0, -0.3);
    armR.rotation.set(0, 0, 0.3);
    eyeR.scale.y = 1;

    headTiltHoldX = 0;
    headTiltHoldZ = 0;

    // 傘のアニメーション中に正面向くボタンが押された場合、破綻しない状態へスナップ
    umbrellaHoldT = -1;
    umbrellaOpenT = -1;
    umbrellaCloseT = -1;
    umbrellaReleaseT = -1;
    umbrellaPendingOpen = false;
    if (umbrellaHeld) {
      if (umbrella.parent !== armL) armL.add(umbrella);
      umbrella.position.copy(umbrellaHeldLocalPos);
      umbrella.rotation.copy(umbrellaHeldLocalRot);
    } else {
      if (umbrella.parent !== scene) scene.add(umbrella);
      umbrella.position.copy(umbrellaStorePos);
      umbrella.rotation.set(0, 0, 0);
    }
    canopyGroup.scale.copy(umbrellaOpen ? umbrellaOpenScale : umbrellaClosedScale);
  }

  function faceFront() {
    resetAnimationsForFront();
    frontT = 0;
    frontFromX = chara.rotation.x;
    frontFromY = normalizeAngle(chara.rotation.y);
    frontFromZ = chara.rotation.z;
    frontToY = frontFromY + normalizeAngle(-frontFromY);
    frontPosFromZ = chara.position.z;
    velY = 0;
  }
  function headSpin() {
    if (isBusy()) return;
    headSpinT = 0;
    headTiltHoldX = 0;
    headTiltHoldZ = 0;
  }
  function powerSpin() {
    if (isBusy()) return;
    powerSpinT = 0;
    powerSpinAngle = 0;
    powerSpinFromX = chara.rotation.x;
    powerSpinFromY = chara.rotation.y;
    powerSpinFromZ = chara.rotation.z;
    headTiltHoldX = 0;
    headTiltHoldZ = 0;
  }

  const controlsPanel = document.querySelector('.ui-bottom');
  const screenshotButton = document.getElementById('btnScreenshot');
  const photoFrame = document.getElementById('photoFrame');
  const photoStampsLayer = document.getElementById('photoStamps');
  const photoTools = document.getElementById('photoTools');
  const categoryTabs = document.querySelectorAll('.category-tab');
  const categoryPanels = document.querySelectorAll('.category-panel');
  const actionHandlers = {
    randomPlay,
    front: faceFront,
    jump,
    takeAway,
    wave,
    bothWave,
    hopscotch,
    wink,
    spin,
    headSpin,
    powerSpin,
    touch: playTouch,
    umbrellaHold: holdUmbrella,
    umbrellaOpen: openUmbrella,
    umbrellaClose: closeUmbrella,
    umbrellaRelease: releaseUmbrella,
  };
  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => actionHandlers[button.dataset.action]?.());
  });
  document.getElementById('btnKenkenpa').addEventListener('click', hopscotch);

  const accessoryButtons = document.querySelectorAll('.accessory-button');
  accessoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selected = button.dataset.accessory;
      Object.entries(accessories).forEach(([name, group]) => {
        group.visible = name === 'beret' || name === selected;
      });
      accessoryButtons.forEach((item) => item.classList.toggle('is-selected', item === button));
    });
  });

  const backgroundThemes = {
    day: ['#FFFDF5', '#FFF8E7', '#FCEFD2'],
    night: ['#5B5D9A', '#252744', '#11152D'],
    sea: ['#E9FFFF', '#8ED5E8', '#4C9FB9'],
    space: ['#4C397F', '#211D4F', '#100F2D'],
    candy: ['#FFF6FB', '#FFC6DC', '#F29AB8'],
  };
  document.querySelectorAll('.world-button').forEach((button) => {
    button.addEventListener('click', () => {
      const theme = button.dataset.background;
      if (!backgroundThemes[theme]) return;
      document.body.classList.remove(...Object.keys(backgroundThemes).map((name) => `theme-${name}`));
      document.body.classList.add(`theme-${theme}`);
      document.querySelectorAll('.world-button').forEach((item) =>
        item.classList.toggle('is-selected', item === button));
    });
  });

  const frameClasses = ['', 'frame-mint', 'frame-rainbow', 'frame-stars'];
  function updatePhotoFrame() {
    photoFrame.className = `photo-frame ${frameClasses[activeFrameIndex]}`;
  }
  function updatePhotoStamps() {
    photoStampsLayer.replaceChildren();
    photoStamps.forEach(({ emoji, x, y }) => {
      const stamp = document.createElement('span');
      stamp.className = 'photo-stamp';
      stamp.textContent = emoji;
      stamp.style.left = `${x}px`;
      stamp.style.top = `${y}px`;
      photoStampsLayer.appendChild(stamp);
    });
  }
  function placePhotoStamp(x, y) {
    photoStamps.push({ emoji: selectedStamp, x, y });
    updatePhotoStamps();
  }
  function enterPhotoMode() {
    photoMode = true;
    activeFrameIndex = 0;
    photoStamps = [];
    updatePhotoFrame();
    updatePhotoStamps();
    document.body.classList.add('photo-mode');
  }
  function exitPhotoMode() {
    photoMode = false;
    document.body.classList.remove('photo-mode');
    photoFrame.className = 'photo-frame';
    photoStamps = [];
    updatePhotoStamps();
  }
  document.getElementById('btnPhotoMode').addEventListener('click', enterPhotoMode);
  document.getElementById('btnPhotoExit').addEventListener('click', exitPhotoMode);
  document.getElementById('btnPhotoSave').addEventListener('click', downloadScreenshot);
  document.getElementById('btnFrame').addEventListener('click', () => {
    activeFrameIndex = (activeFrameIndex + 1) % frameClasses.length;
    updatePhotoFrame();
  });
  document.querySelectorAll('.stamp-choice').forEach((button) => {
    button.addEventListener('click', () => {
      selectedStamp = button.dataset.stamp;
      document.querySelectorAll('.stamp-choice').forEach((item) =>
        item.classList.toggle('is-selected', item === button));
    });
  });

  categoryTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const category = tab.dataset.category;
      categoryTabs.forEach((item) => {
        const isActive = item === tab;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-selected', String(isActive));
      });
      categoryPanels.forEach((panel) => {
        const isActive = panel.id === `category-${category}`;
        panel.hidden = !isActive;
        panel.classList.toggle('is-active', isActive);
      });
    });
  });

  function timestampForFileName(date = new Date()) {
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  const screenshotBackgrounds = {
    day: ['#FFFDF5', '#FFF8E7', '#FCEFD2'],
    night: ['#5B5D9A', '#252744', '#11152D'],
    sea: ['#E9FFFF', '#8ED5E8', '#4C9FB9'],
    space: ['#4C397F', '#211D4F', '#100F2D'],
    candy: ['#FFF6FB', '#FFC6DC', '#F29AB8'],
  };

  function drawPhotoDecorations(context, width, height) {
    const scaleX = width / innerWidth;
    const scaleY = height / innerHeight;
    photoStamps.forEach(({ emoji, x, y }) => {
      context.font = `${Math.max(36, 58 * scaleX)}px sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(emoji, x * scaleX, y * scaleY);
    });

    if (activeFrameIndex === 1) {
      context.strokeStyle = 'rgba(158, 217, 181, 0.88)';
      context.lineWidth = 18 * scaleX;
      context.strokeRect(context.lineWidth / 2, context.lineWidth / 2,
        width - context.lineWidth, height - context.lineWidth);
    } else if (activeFrameIndex === 2) {
      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#F2917E');
      gradient.addColorStop(0.35, '#F7DFA8');
      gradient.addColorStop(0.7, '#9ED9B5');
      gradient.addColorStop(1, '#8ED5E8');
      context.strokeStyle = gradient;
      context.lineWidth = 18 * scaleX;
      context.strokeRect(context.lineWidth / 2, context.lineWidth / 2,
        width - context.lineWidth, height - context.lineWidth);
    } else if (activeFrameIndex === 3) {
      context.strokeStyle = '#FFFDF5';
      context.lineWidth = 18 * scaleX;
      context.strokeRect(context.lineWidth / 2, context.lineWidth / 2,
        width - context.lineWidth, height - context.lineWidth);
      context.strokeStyle = '#F7DFA8';
      context.lineWidth = 7 * scaleX;
      context.strokeRect(context.lineWidth / 2 + 18 * scaleX, context.lineWidth / 2 + 18 * scaleY,
        width - context.lineWidth - 36 * scaleX, height - context.lineWidth - 36 * scaleY);
    }
  }

  function downloadScreenshot() {
    screenshotButton.classList.add('is-hidden');
    screenshotButton.disabled = true;

    // Hide the button for a rendered frame before reading the canvas. The small
    // delay also gives mobile browsers time to apply the visual state.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const canvas = document.createElement('canvas');
      canvas.width = renderer.domElement.width;
      canvas.height = renderer.domElement.height;
      const context = canvas.getContext('2d');
      const activeTheme = document.body.className.match(/theme-(day|night|sea|space|candy)/)?.[1] || 'day';
      const [backgroundTop, backgroundMiddle, backgroundBottom] = screenshotBackgrounds[activeTheme];
      const gradient = context.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.3, 0,
        canvas.width * 0.5, canvas.height * 0.3, canvas.width * 0.75
      );
      gradient.addColorStop(0, backgroundTop);
      gradient.addColorStop(0.45, backgroundMiddle);
      gradient.addColorStop(1, backgroundBottom);
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(renderer.domElement, 0, 0);
      drawPhotoDecorations(context, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `pompom-${timestampForFileName()}.png`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        screenshotButton.disabled = false;
        screenshotButton.classList.remove('is-hidden');
      }, 'image/png');
    }));
  }

  screenshotButton.addEventListener('click', downloadScreenshot);

  function setControlsHidden(isHidden) {
    controlsPanel.classList.toggle('is-hidden', isHidden);
    controlsPanel.setAttribute('aria-hidden', String(isHidden));
  }

  // --- color pickers -------------------------------------------
  const colorBindings = {
    bodyColor: (c) => {
      bodyColored.forEach((m) => m.material.color.copy(c));
      const accent = c.clone().offsetHSL(0, 0.08, -0.07); // belly & feet
      accentColored.forEach((m) => m.material.color.copy(accent));
    },
    hatColor: (c) => {
      beretTop.material.color.copy(c);
      beretStem.material.color.copy(c.clone().offsetHSL(0, 0, -0.08));
    },
    faceColor: (c) => {
      nose.material.color.copy(c);
      mouthMat.color.copy(c);
      eyeL.material.color.copy(c);
      starMat.color.copy(c);
    },
    umbrellaColor: (c) => {
      canopy.material.color.copy(c);
      const shade = c.clone().offsetHSL(0, 0.05, -0.14); // inner shade & trim
      canopyInner.material.color.copy(shade);
      rim.material.color.copy(shade);
    },
  };
  Object.entries(colorBindings).forEach(([id, apply]) => {
    document.getElementById(id).addEventListener('input', (e) => apply(new THREE.Color(e.target.value)));
  });

  const colorPresets = {
    pudding: { bodyColor: '#fffdf6', hatColor: '#8b5e3c', faceColor: '#5a3e2b', umbrellaColor: '#4caf50' },
    strawberry: { bodyColor: '#fff0e8', hatColor: '#f2917e', faceColor: '#8a4a42', umbrellaColor: '#f7b5c8' },
    sky: { bodyColor: '#effbff', hatColor: '#6c9fd8', faceColor: '#3b587a', umbrellaColor: '#8ed5e8' },
    night: { bodyColor: '#d9d8f5', hatColor: '#3f416e', faceColor: '#252744', umbrellaColor: '#7bbf98' },
  };
  document.querySelectorAll('.color-preset').forEach((button) => {
    button.addEventListener('click', () => {
      const preset = colorPresets[button.dataset.preset];
      if (!preset) return;
      Object.entries(preset).forEach(([id, value]) => {
        const input = document.getElementById(id);
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
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

    // 毎フレーム必ず姿勢をリセット（バグ防止）
    head.rotation.set(0, 0, 0);
    armL.rotation.x = 0;
    armR.rotation.x = 0;

    // 「頭を回転」後の傾き保持
    head.rotation.x += headTiltHoldX;
    head.rotation.z += headTiltHoldZ;

    // ベースとなる縦揺れ（待機モーション用）
    let baseBouncerY = 0;

    if (!reduceMotion) {
      baseBouncerY = Math.sin(t * 2.2) * 0.05;
      body.scale.y = 0.92 + Math.sin(t * 2.2) * 0.012;

      // 上書きではなく加算(+=)に変更
      head.rotation.z += Math.sin(t * 0.9) * 0.06;
      head.rotation.y += Math.sin(t * 0.6) * 0.08;

      earL.rotation.z = -0.4 - Math.sin(t * 2.2 + 0.4) * 0.07;
      earR.rotation.z =  0.4 + Math.sin(t * 2.2) * 0.07;
      earL.rotation.x = earR.rotation.x = Math.sin(t * 2.2 + 1) * 0.06;

      armL.rotation.z = -0.3 + Math.sin(t * 2.2) * 0.12;
      armR.rotation.z =  0.3 - Math.sin(t * 2.2) * 0.12;
      footL.rotation.x = -Math.max(0, Math.sin(t * 3)) * 0.3;
      footR.rotation.x = -Math.max(0, -Math.sin(t * 3)) * 0.3;

      tailPivot.rotation.y = Math.sin(t * 6) * 0.5;
    }

    // 基本の縦位置を適用
    bouncer.position.y = baseBouncerY;

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

    // wink
    if (winkT >= 0) {
      winkT += dt;
      if (winkT > 1.225) winkT = -1;
      else {
        eyeR.scale.y = 0.12;
        head.rotation.z += Math.sin((winkT / 1.225) * Math.PI) * -0.18;
      }
    }

    // jump
    if (jumpT >= 0) {
      jumpT += dt * 0.914;
      if (jumpT >= 1) {
        jumpT = -1;
        bouncer.scale.set(1, 1, 1);
      } else {
        const h = Math.sin(jumpT * Math.PI);
        bouncer.position.y = h * 1.5; // ジャンプ時はY座標を上書き
        armL.rotation.z = -0.3 - h * 2.0;
        armR.rotation.z =  0.3 + h * 2.0;
        const stretch = 1 + h * 0.12;
        bouncer.scale.set(1 / Math.sqrt(stretch), stretch, 1 / Math.sqrt(stretch));
      }
    }

    // take away: 両手を上げて、キャラクターが上空へ飛んでいく
    if (takeAwayT >= 0) {
      takeAwayT += dt / 2.2;
      if (takeAwayT >= 1) {
        takeAwayT = -1;
        chara.position.y = 0;
        armL.rotation.z = -0.3;
        armR.rotation.z = 0.3;
      } else {
        const p = easeOutCubic(takeAwayT);
        chara.position.y = p * 5;
        armL.rotation.z = -0.3 - p * 2.2;
        armR.rotation.z = 0.3 + p * 2.2;
      }
    }

    // front
    if (frontT >= 0) {
      frontT += dt;
      const duration = 0.5;
      if (frontT >= duration) {
        frontT = -1;
        chara.rotation.set(0, 0, 0);
        chara.position.z = 0;
      } else {
        const p = frontT / duration;
        const ease = 1 - Math.pow(1 - p, 3);
        chara.rotation.x = THREE.MathUtils.lerp(frontFromX, 0, ease);
        chara.rotation.y = THREE.MathUtils.lerp(frontFromY, frontToY, ease);
        chara.rotation.z = THREE.MathUtils.lerp(frontFromZ, 0, ease);
        chara.position.z = THREE.MathUtils.lerp(frontPosFromZ, 0, ease);
      }
    }

    // spin
    if (spinT >= 0) {
      spinT += dt * 0.8;
      if (spinT >= 1) spinT = -1;
      else chara.rotation.y += dt * 8 * Math.sin(spinT * Math.PI);
    }

    // wave
    if (waveT >= 0) {
      waveT += dt;
      if (waveT > 2.8) waveT = -1;
      else armR.rotation.z = 2.2 + Math.sin(waveT * 9.143) * 0.35;
    }

    // both hands wave
    if (bothWaveT >= 0) {
      bothWaveT += dt;
      if (bothWaveT > 3.15) bothWaveT = -1;
      else {
        const swing = Math.sin(bothWaveT * 10.286) * 0.32;
        armR.rotation.z = 2.2 + swing;
        if (umbrellaHeld) {
          // 傘を持っている間は左腕を大きく振り上げない（刺さり防止）。
          // 傘は持ち手に固定されているので、腕をあまり動かさず軽く揺らす程度に留める
          armL.rotation.z = -0.3 - swing * 0.25;
        } else {
          armL.rotation.z = -2.2 - swing;
        }
      }
    }

    // hopscotch: 左右に踏み替えながら3回ジャンプする
    if (hopscotchT >= 0) {
      hopscotchT += dt;
      const duration = 3.675;
      if (hopscotchT > duration) {
        hopscotchT = -1;
        chara.position.x = 0;
        chara.rotation.z = 0;
        footL.position.copy(footLHome);
        footR.position.copy(footRHome);
        footL.rotation.set(0, 0, 0);
        footR.rotation.set(0, 0, 0);
      } else {
        const step = hopscotchT / (duration / 3);
        const phase = Math.min(2, Math.floor(step));
        const local = step - phase;
        const hop = Math.sin(local * Math.PI);

        bouncer.position.y = hop * (phase < 2 ? 0.9 : 0.6); // 上書き
        head.rotation.z += Math.sin(hopscotchT * 5.714) * 0.08;
        chara.position.x = (phase === 0 ? -1 : phase === 1 ? 1 : 0) * hop * 0.5;

        if (phase < 2) {
          const sideLean = phase === 0 ? -1 : 1;
          chara.rotation.z = sideLean * hop * 0.08;
          armL.rotation.z = umbrellaHeld ? (-0.3 - hop * 0.15) : (-0.9 - hop * 0.5);
          armR.rotation.z =  0.9 + hop * 0.5;
          footL.position.copy(footLHome);
          footR.position.copy(footRHome);
          footL.rotation.z = 0;
          footR.rotation.z = 0;
          footL.rotation.x = phase === 0 ? -hop * 0.35 : -0.75 * hop;
          footR.rotation.x = phase === 0 ? -0.75 * hop : -hop * 0.35;
        } else {
          chara.rotation.z = 0;
          armL.rotation.z = umbrellaHeld ? (-0.3 - hop * 0.1) : (-1.2 + hop * 0.25);
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

    // touch (近づいてきてタッチ)
    if (touchT >= 0) {
      touchT += dt;
      const duration = 4.0; // 所要時間を 2.4秒 から 4.0秒 に延長（ゆっくりに）
      if (touchT > duration) {
        touchT = -1;
        chara.position.z = 0;
        chara.rotation.z = 0;
      } else {
        const p = touchT / duration;
        const moveAmt = Math.sin(p * Math.PI);

        chara.position.z = moveAmt * 3.5;

        // 移動速度が遅くなった分、足踏み（揺れ）の周波数も落としてアニメーションの乖離を防ぐ
        if (moveAmt < 0.95) {
          bouncer.position.y += Math.abs(Math.sin(touchT * 12)) * 0.12; // 20から12へ減速
          chara.rotation.z = Math.sin(touchT * 8) * 0.03;               // 12から8へ減速
        } else {
          chara.rotation.z = 0;
        }

        if (p > 0.3 && p < 0.7) {
          const touchP = (p - 0.3) / 0.4;
          const lift = Math.sin(touchP * Math.PI);
          armR.rotation.x = -lift * 1.8;
          head.rotation.x += lift * 0.2;
        }
      }
    }

    // head spin: 既存の不思議な頭の回転
    if (headSpinT >= 0) {
      headSpinT += dt;
      const duration = 2.4;
      if (headSpinT >= duration) {
        headSpinT = -1;
        headTiltHoldX = 0;
        headTiltHoldZ = 0;
        head.rotation.set(0, 0, 0);
      } else {
        const p = headSpinT / duration;
        const turn = p * Math.PI * 4;
        head.rotation.y += turn;
        head.rotation.z += Math.sin(p * Math.PI * 2) * 0.08;
        head.rotation.x += Math.sin(p * Math.PI) * 0.12;
      }
    }

    // power spin: 頭頂部を床につけ、身体をまっすぐにして軸回転
    if (powerSpinT >= 0) {
      powerSpinT += dt;
      const poseDuration = 0.9;
      const spinDuration = 4.8;
      const standDuration = 0.9;
      const duration = spinDuration + standDuration;
      if (powerSpinT >= duration) {
        powerSpinT = -1;
        powerSpinAngle = 0;
        chara.position.set(0, 0, 0);
        chara.rotation.set(0, 0, 0);
        headTiltHoldX = 0;
        headTiltHoldZ = 0;
        head.rotation.set(0, 0, 0);
      } else if (powerSpinT < spinDuration) {
        const pose = Math.min(1, powerSpinT / poseDuration);
        const ease = easeOutCubic(pose);
        bouncer.position.set(0, 0, 0);
        bouncer.scale.set(1, 1, 1);
        body.scale.y = 0.92;
        head.rotation.set(0, 0, 0);
        chara.position.x = 0;
        chara.position.z = 0;
        chara.position.y = THREE.MathUtils.lerp(0, headSpinContactHeight, ease);
        chara.rotation.x = THREE.MathUtils.lerp(powerSpinFromX, 0, ease);
        chara.rotation.z = THREE.MathUtils.lerp(powerSpinFromZ, Math.PI, ease);

        if (pose >= 1) {
          powerSpinAngle += dt * 12;
          chara.rotation.y = powerSpinFromY + powerSpinAngle;
        } else {
          chara.rotation.y = powerSpinFromY;
        }
      } else {
        // 回転を止めたあと、頭を床から離してゆっくり立ち上がる。
        const stand = easeOutCubic((powerSpinT - spinDuration) / standDuration);
        bouncer.position.set(0, 0, 0);
        bouncer.scale.set(1, 1, 1);
        body.scale.y = 0.92;
        head.rotation.set(0, 0, 0);
        chara.position.set(0, THREE.MathUtils.lerp(headSpinContactHeight, 0, stand), 0);
        chara.rotation.x = THREE.MathUtils.lerp(0, 0, stand);
        chara.rotation.y = THREE.MathUtils.lerp(powerSpinFromY + powerSpinAngle, 0, stand);
        chara.rotation.z = THREE.MathUtils.lerp(Math.PI, 0, stand);
      }
    }

    // 傘：もつ（上空から左手へ飛んでくる）
    if (umbrellaHoldT >= 0) {
      umbrellaHoldT += dt / 0.7;
      if (umbrellaHoldT >= 1) {
        umbrellaHoldT = -1;
        armL.add(umbrella);
        umbrella.position.copy(umbrellaHeldLocalPos);
        umbrella.rotation.copy(umbrellaHeldLocalRot);
        umbrellaHeld = true;
        if (umbrellaPendingOpen) {
          umbrellaPendingOpen = false;
          umbrellaOpenT = 0;
        }
      } else {
        const targetWorld = umbrellaHeldLocalPos.clone();
        armL.localToWorld(targetWorld);
        umbrella.position.lerpVectors(umbrellaStorePos, targetWorld, easeOutCubic(umbrellaHoldT));
        umbrella.rotation.y += dt * 3; // ふわっと回転しながら降りてくる
      }
    }

    // 傘：ひらく
    if (umbrellaOpenT >= 0) {
      umbrellaOpenT += dt / 0.45;
      if (umbrellaOpenT >= 1) {
        umbrellaOpenT = -1;
        canopyGroup.scale.copy(umbrellaOpenScale);
        umbrellaOpen = true;
      } else {
        canopyGroup.scale.lerpVectors(umbrellaClosedScale, umbrellaOpenScale, easeOutCubic(umbrellaOpenT));
      }
    }

    // 傘：とじる
    if (umbrellaCloseT >= 0) {
      umbrellaCloseT += dt / 0.4;
      if (umbrellaCloseT >= 1) {
        umbrellaCloseT = -1;
        canopyGroup.scale.copy(umbrellaClosedScale);
        umbrellaOpen = false;
      } else {
        canopyGroup.scale.lerpVectors(umbrellaOpenScale, umbrellaClosedScale, easeOutCubic(umbrellaCloseT));
      }
    }

    // 傘：はなす（上空へ飛んでいき、待機位置へ戻る）
    if (umbrellaReleaseT >= 0) {
      umbrellaReleaseT += dt / 1.1;
      if (umbrellaReleaseT >= 1) {
        umbrellaReleaseT = -1;
        umbrella.position.copy(umbrellaStorePos);
        umbrella.rotation.set(0, 0, 0);
        canopyGroup.scale.copy(umbrellaClosedScale);
        umbrellaOpen = false;
      } else {
        umbrella.position.y += dt * (2.2 + umbrellaReleaseT * 3.5);
        umbrella.position.x += dt * 0.35;
        umbrella.rotation.z += dt * 4.5;
        umbrella.rotation.x += dt * 2.2;
      }
    }

    setControlsHidden(isBusy());
    renderer.render(scene, camera);
  }
  animate();

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
})();
