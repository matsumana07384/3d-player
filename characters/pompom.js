// Character model definition for the reusable player.
export function createPompomCharacter({ THREE, scene, COLORS, mat, ball }) {
  const chara = new THREE.Group();   // user-rotated
  const bouncer = new THREE.Group(); // animated (jump / bob)
  chara.add(bouncer);
  scene.add(chara);

  // meshes whose color follows the body-color picker
  const bodyColored = [];   // main body color
  const accentColored = []; // belly / feet (slightly darker accent)

  // body
  const body = ball(1.12, COLORS.milk, 1.04, 1.08, 0.98);
  body.position.y = 1.05;
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

  const skull = ball(0.98, COLORS.milk, 1.12, 1.02, 1.02);
  head.add(skull);
  bodyColored.push(skull);

  // ▼ nose (small flattened cone, point down)
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.065, 0.085, 24), mat(COLORS.cocoa, 0.6));
  nose.rotation.x = Math.PI; // apex down → ▼
  nose.scale.z = 0.5;
  nose.position.set(0, 0.0, 1.08);
  nose.castShadow = true;
  head.add(nose);

  // ω mouth (two arcs right under the nose)
  const mouthGeo = new THREE.TorusGeometry(0.075, 0.02, 8, 20, Math.PI);
  const mouthMat = mat(COLORS.cocoa, 0.6);
  const mouthL = new THREE.Mesh(mouthGeo, mouthMat);
  const mouthR = new THREE.Mesh(mouthGeo, mouthMat);
  mouthL.rotation.z = Math.PI; // flip arc to open upward → ∪∪ = ω
  mouthR.rotation.z = Math.PI;
  mouthL.position.set(-0.073, -0.03, 1.08);
  mouthR.position.set( 0.073, -0.03, 1.08);
  head.add(mouthL, mouthR);

  // eyes (blink by scaling y)
  const eyeL = ball(0.05, 0x3A2A1E);
  const eyeR = eyeL.clone();
  eyeL.position.set(-0.38, 0.12, 1.04);
  eyeR.position.set( 0.38, 0.12, 1.04);
  head.add(eyeL, eyeR);

  // lop ears (pivot at top so they swing)
  function makeEar(side) {
    const pivot = new THREE.Group();
    pivot.position.set(0.92 * side, 0.75, 0.05);
    const ear = ball(0.42, COLORS.milk, 0.62, 1.55, 0.5);
    ear.position.y = -0.55;
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
  const beretTop = ball(0.55, 0x9C3035, 1.08, 0.45, 1.08);
  const beretStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.16, 12), mat(0x70242B));
  beretStem.position.y = 0.26;
  beret.add(beretTop, beretStem);
  head.add(beret);

  // --- dress-up accessories ----------------------------------
  const ribbon = new THREE.Group();
  ribbon.position.set(-0.55, 0.58, 0.98);
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
    const arm = ball(0.29, COLORS.milk, 0.9, 1.1, 0.9);
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
    const foot = ball(0.28, COLORS.latte, 1, 0.7, 1.12);
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
      animationProfile: 'pompom',
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

