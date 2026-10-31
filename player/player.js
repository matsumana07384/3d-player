import { createPompomCharacter } from '../characters/pompom.js';
import { createTrixieCharacter } from '../characters/trixie.js';

(() => {
  const THREE = window.THREE;
  if (!THREE) throw new Error('Three.js failed to load before player.js');
  const COLORS = {
    custard: 0xF7DFA8,
    milk:    0xFFF3AD,
    latte:   0xE5D18A,
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


  // Character models live under ../characters; the player only consumes their contract.
  const characterFactories = {
    pompom: createPompomCharacter,
    trixie: createTrixieCharacter,
  };
  const queryCharacter = new URLSearchParams(location.search).get('character');
  const characterName = queryCharacter || document.body.dataset.character || 'pompom';
  const createCharacter = characterFactories[characterName] || characterFactories.pompom;
  const character = createCharacter({ THREE, scene, COLORS, mat, ball });
  const characterTitles = { pompom: 'pompom purin?', trixie: 'Trixie' };
  document.querySelector('header h1').textContent = characterTitles[characterName] || '3D Player';
  const {
    chara, bouncer, body, bodyColored, accentColored, head, nose, mouthMat,
    eyeL, eyeR, earL, earR, beretTop, beretStem, armL, armR, footL, footR,
    footLHome, footRHome,
    tailPivot, umbrella, canopyGroup, canopy, canopyInner, rim, starMat,
    accessories,
    animationProfile,
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
  let audioContext = null;
  let soundEnabled = localStorage.getItem('pompom-sound') !== 'muted';

  const soundPatterns = {
    tap: [{ frequency: 620, duration: 0.08, type: 'sine' }],
    jump: [{ frequency: 460, duration: 0.1, type: 'triangle' }, { frequency: 760, duration: 0.14, type: 'triangle' }],
    wink: [{ frequency: 720, duration: 0.09, type: 'sine' }, { frequency: 980, duration: 0.12, type: 'sine' }],
    hopscotch: [{ frequency: 420, duration: 0.08, type: 'square' }, { frequency: 560, duration: 0.08, type: 'square' }, { frequency: 720, duration: 0.12, type: 'square' }],
    powerSpin: [{ frequency: 220, duration: 0.16, type: 'sawtooth' }, { frequency: 330, duration: 0.18, type: 'sawtooth' }, { frequency: 520, duration: 0.22, type: 'triangle' }],
  };

  function unlockAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === 'suspended') audioContext.resume();
  }

  function playSound(name) {
    if (!soundEnabled) return;
    unlockAudio();
    if (!audioContext) return;
    const pattern = soundPatterns[name];
    if (!pattern) return;
    let offset = 0;
    pattern.forEach(({ frequency, duration, type }) => {
      const start = audioContext.currentTime + offset;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.055, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
      offset += duration * 0.72;
    });
  }

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
    playSound('tap');
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

  function jump() { if (!isBusy()) { jumpT = 0; playSound('jump'); } }
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
    playSound('hopscotch');
    setControlsHidden(true);
  }
  function takeAway() { if (!isBusy()) takeAwayT = 0; }
  function wink() { if (!isBusy()) { winkT = 0; playSound('wink'); } }
  function touchScreen() { if (!isBusy()) touchT = 0; }
  function randomPlay() {
    if (isBusy()) return;
    const actions = Object.keys(actionHandlers).filter((name) => name !== 'randomPlay' && name !== 'front');
    if (!actions.length) return;
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
    playSound('powerSpin');
  }

  const controlsPanel = document.querySelector('.ui-bottom');
  const screenshotButton = document.getElementById('btnScreenshot');
  const soundButton = document.getElementById('btnSound');
  const photoFrame = document.getElementById('photoFrame');
  const photoStampsLayer = document.getElementById('photoStamps');
  const photoTools = document.getElementById('photoTools');
  const categoryTabs = document.querySelectorAll('.category-tab');
  const categoryPanels = document.querySelectorAll('.category-panel');
  // キャラクターごとのアニメーション対応表。
  // 四足歩行キャラクターを追加するときは、ここへ別プロファイルを登録する。
  const animationProfiles = {
    pompom: {
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
    },
    trixie: {
      randomPlay,
      front: faceFront,
      jump,
      touch: playTouch,
    },
  };
  const actionHandlers = animationProfiles[animationProfile] || animationProfiles.pompom;
  const actionButtons = document.querySelectorAll('[data-action]');
  actionButtons.forEach((button) => {
    const action = button.dataset.action;
    const handler = actionHandlers[action];
    button.disabled = !handler;
    button.setAttribute('aria-disabled', String(!handler));
    if (handler) button.addEventListener('click', handler);
  });
  function updateSoundButton() {
    soundButton.classList.toggle('is-muted', !soundEnabled);
    soundButton.setAttribute('aria-pressed', String(soundEnabled));
    soundButton.setAttribute('aria-label', soundEnabled ? '音をミュート' : '音をオン');
    soundButton.setAttribute('title', soundEnabled ? '音をミュート' : '音をオン');
    soundButton.querySelector('span').textContent = soundEnabled ? '🔊' : '🔇';
  }
  soundButton.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem('pompom-sound', soundEnabled ? 'on' : 'muted');
    if (soundEnabled) { unlockAudio(); playSound('tap'); }
    updateSoundButton();
  });
  document.addEventListener('pointerdown', unlockAudio, { once: true });
  updateSoundButton();

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
    pudding: { bodyColor: '#fff3ad', hatColor: '#9c3035', faceColor: '#5a3e2b', umbrellaColor: '#4caf50' },
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
