// Four-legged character model inspired by the provided Trixie reference.
export function createTrixieCharacter({ THREE, scene, COLORS, mat, ball }) {
  const chara = new THREE.Group();
  const bouncer = new THREE.Group();
  chara.add(bouncer);
  scene.add(chara);

  const bodyColored = [];
  const accentColored = [];
  const trixieBlue = 0x4F9CAF;
  const trixieBlueDark = 0x39758A;
  const hornColor = 0xEAD4A0;
  const faceColor = 0x27394A;

  const body = ball(1.18, trixieBlue, 1.18, 0.82, 0.92);
  body.position.y = 1.35;
  bouncer.add(body);
  bodyColored.push(body);

  const belly = ball(0.76, trixieBlueDark, 1, 0.9, 0.65);
  belly.position.set(0, 1.25, 0.55);
  bouncer.add(belly);
  accentColored.push(belly);

  const head = new THREE.Group();
  head.position.set(0, 2.25, 0.2);
  bouncer.add(head);

  const frill = ball(0.95, trixieBlueDark, 1.12, 1.08, 0.3);
  frill.position.z = -0.28;
  head.add(frill);
  bodyColored.push(frill);

  const skull = ball(0.78, trixieBlue, 1.05, 0.95, 1.05);
  head.add(skull);
  bodyColored.push(skull);

  function makeHorn(x, y, z, radius, length) {
    const horn = new THREE.Mesh(
      new THREE.ConeGeometry(radius, length, 8),
      mat(hornColor, 0.65)
    );
    horn.rotation.x = -Math.PI / 2;
    horn.position.set(x, y, z);
    horn.castShadow = true;
    head.add(horn);
    return horn;
  }
  makeHorn(-0.36, 0.24, 0.72, 0.13, 0.65);
  makeHorn(0.36, 0.24, 0.72, 0.13, 0.65);
  makeHorn(0, -0.05, 0.92, 0.1, 0.42);

  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 12),
    mat(trixieBlueDark, 0.7)
  );
  nose.position.set(0, -0.12, 0.93);
  head.add(nose);

  const mouthMat = mat(faceColor, 0.65);
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.025, 8, 20, Math.PI),
    mouthMat
  );
  mouth.rotation.z = Math.PI;
  mouth.position.set(0, -0.3, 0.94);
  head.add(mouth);

  const eyeL = ball(0.065, faceColor);
  const eyeR = eyeL.clone();
  eyeL.position.set(-0.3, 0.12, 0.92);
  eyeR.position.set(0.3, 0.12, 0.92);
  head.add(eyeL, eyeR);

  function makeLeg(x, z) {
    const leg = new THREE.Group();
    leg.position.set(x, 0.72, z);
    const shin = ball(0.34, trixieBlue, 0.72, 1.3, 0.72);
    shin.position.y = -0.28;
    const foot = ball(0.28, hornColor, 1, 0.55, 1.25);
    foot.position.set(0, -0.58, 0.1);
    leg.add(shin, foot);
    bodyColored.push(shin);
    accentColored.push(foot);
    bouncer.add(leg);
    return leg;
  }
  const frontLeft = makeLeg(-0.72, 0.35);
  const frontRight = makeLeg(0.72, 0.35);
  const backLeft = makeLeg(-0.72, -0.35);
  const backRight = makeLeg(0.72, -0.35);
  const footLHome = frontLeft.position.clone();
  const footRHome = frontRight.position.clone();

  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 1.45, -1.0);
  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 1.15, 8),
    mat(trixieBlueDark, 0.8)
  );
  tail.rotation.x = Math.PI / 2;
  tail.position.z = -0.45;
  tailPivot.add(tail);
  bodyColored.push(tail);
  bouncer.add(tailPivot);

  // Compatibility parts used by shared color and reset logic.
  const beret = new THREE.Group();
  const beretTop = new THREE.Mesh(new THREE.SphereGeometry(0.01, 4, 4), mat(trixieBlue));
  const beretStem = beretTop.clone();
  beret.visible = false;
  const earL = new THREE.Group();
  const earR = new THREE.Group();
  const starMat = mat(faceColor, 0.65);
  const umbrella = new THREE.Group();
  const canopyGroup = new THREE.Group();
  umbrella.visible = false;
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
    accessories: { beret },
    animationProfile: 'trixie',
    armL: frontLeft,
    armR: frontRight,
    footL: backLeft,
    footR: backRight,
    footLHome,
    footRHome,
    tailPivot,
    umbrella,
    canopyGroup,
    canopy: beretTop,
    canopyInner: beretStem,
    rim: beretTop,
    umbrellaClosedScale: new THREE.Vector3(1, 1, 1),
    umbrellaOpenScale: new THREE.Vector3(1, 1, 1),
    umbrellaStorePos: new THREE.Vector3(0, -10, 0),
    umbrellaHeldLocalPos: new THREE.Vector3(),
    umbrellaHeldLocalRot: new THREE.Euler(),
  };
}
