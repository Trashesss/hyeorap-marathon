// 캐릭터 서른여섯 종의 모델. 저마다 그룹에 도형을 붙이고, 매 프레임 불릴 동작 함수를 돌려준다.
import { C, FONT_KR, GOLD, PUPIL, SKIN, TAU, UP, V, WHITE, add, additive, ball, box, canvasTexture, cyl, eye, eyes, glow, label, limb, rbox, repeatTex, spun, std, toy } from './tools.js';
import { M } from './world.js';

export const MODELS = {
  // 얼음장수: 삿갓 쓴 로봇이 빙수 리어카를 끈다.
  iceman(g) {
    const shell = toy('#b9d6e8', 0.35), wood = toy('#8a5a2b', 0.8, { clearcoat: 0.1 }), straw = toy('#d9b46a', 0.9, { clearcoat: 0 }), red = toy('#e63950', 0.7);
    const ice = new THREE.MeshPhysicalMaterial({ color: C('#c9efff'), roughness: 0.06, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.72 });
    const bot = new THREE.Group(); bot.position.z = 1.7; g.add(bot);
    ball(bot, 0.44, M.black, 0, 0.44, 0);
    add(bot, new THREE.TorusGeometry(0.46, 0.07, 8, 24), M.mid, 0, 0.5, 0).rotation.y = Math.PI / 2;
    spun(bot, [[0, 0], [0.5, 0.04], [0.74, 0.5], [0.72, 1.1], [0.52, 1.5], [0, 1.56]], shell, 0, 0.6, 0);
    add(bot, new THREE.TorusGeometry(0.3, 0.05, 8, 28), glow('#59c8ff', 2.6), 0, 1.45, 0.7);
    ball(bot, 0.2, glow('#bff1ff', 1.6), 0, 1.45, 0.62, 1, 1, 0.4);
    add(bot, new THREE.TorusGeometry(0.5, 0.13, 10, 28), red, 0, 2.16, 0).rotation.x = Math.PI / 2;
    rbox(bot, 0.24, 0.62, 0.1, 0.05, red, 0.34, 1.86, 0.52).rotation.z = 0.2;
    const head = new THREE.Group(); head.position.y = 2.62; bot.add(head);
    ball(head, 0.58, shell, 0, 0, 0, 1, 0.92, 1);
    ball(head, 0.5, M.glass, 0, 0, 0.17, 0.88, 0.6, 0.86);
    for (const s of [1, -1]) ball(head, 0.1, glow('#7fe7ff', 3.2), s * 0.2, 0.02, 0.6, 1, 1.5, 0.5);
    add(head, new THREE.ConeGeometry(1.0, 0.55, 32), straw, 0, 0.62, 0);
    add(head, new THREE.TorusGeometry(0.98, 0.04, 6, 32), straw, 0, 0.36, 0).rotation.x = Math.PI / 2;
    for (const s of [1, -1]) {
      const shoulder = V(s * 0.72, 1.85, 0), elbow = V(s * 0.95, 1.45, -0.55), hand = V(s * 0.62, 1.28, -1.2);
      limb(bot, shoulder, elbow, 0.11, shell); limb(bot, elbow, hand, 0.1, shell);
      ball(bot, 0.16, M.mid, shoulder.x, shoulder.y, shoulder.z); ball(bot, 0.14, M.mid, elbow.x, elbow.y, elbow.z); ball(bot, 0.17, M.dark, hand.x, hand.y, hand.z);
    }
    const cart = new THREE.Group(); cart.position.z = -1.3; g.add(cart);
    for (const s of [1, -1]) limb(cart, V(s * 0.62, 1.28, 1.8), V(s * 0.62, 1.05, 0.9), 0.06, wood);
    rbox(cart, 1.8, 0.45, 2.6, 0.1, wood, 0, 1.0, 0);
    box(cart, 1.8, 0.26, 0.08, wood, 0, 1.35, -1.26);
    for (const s of [1, -1]) box(cart, 0.08, 0.26, 2.6, wood, s * 0.86, 1.35, 0);
    const wheels = [];
    for (const s of [1, -1]) {
      const wheel = new THREE.Group(); wheel.position.set(s * 1.05, 0.82, 0); cart.add(wheel); wheels.push(wheel);
      add(wheel, new THREE.TorusGeometry(0.8, 0.09, 10, 36), M.black).rotation.y = Math.PI / 2;
      ball(wheel, 0.15, M.mid, 0, 0, 0);
      for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; limb(wheel, V(0, 0, 0), V(0, Math.cos(a) * 0.76, Math.sin(a) * 0.76), 0.035, wood); }
    }
    rbox(cart, 1.25, 1.05, 1.2, 0.12, ice, 0, 1.8, -0.55);
    ball(cart, 0.26, glow('#9fe8ff', 1.2), 0, 1.8, -0.55);
    spun(cart, [[0, 0], [0.34, 0.02], [0.52, 0.3], [0.55, 0.36]], std('#c9d2e0', 0.9, 0.25), 0, 1.24, 0.72);
    ball(cart, 0.5, toy('#d9dde3', 0.9, { clearcoat: 0 }), 0, 1.72, 0.72, 1, 0.85, 1);
    add(cart, new THREE.SphereGeometry(0.515, 24, 12, 0, TAU, 0, 0.95), toy('#ff4d6d', 0.3), 0, 1.72, 0.72).scale.y = 0.85;
    ball(cart, 0.11, toy('#d1002c', 0.2), 0, 2.2, 0.72);
    limb(cart, V(-0.8, 1.2, -1.2), V(-0.8, 3.4, -1.2), 0.04, M.light);
    const flag = new THREE.Group(); flag.position.set(-0.8, 3.05, -1.2); cart.add(flag);
    add(flag, new THREE.PlaneGeometry(1.05, 0.66), new THREE.MeshStandardMaterial({ map: label('빙수', '#e02a2a', '#ffffff'), side: THREE.DoubleSide, roughness: 0.8 }), 0.55, 0, 0);
    add(g, new THREE.RingGeometry(1.2, 2.8, 40), additive('#9fe8ff', 0.7, null, 0.3), 0, 0.06, 0).rotation.x = -Math.PI / 2;
    return (t, moving) => {
      if (moving) for (const w of wheels) w.rotation.x = t * 5;
      bot.position.y = Math.sin(t * 4) * 0.04; head.rotation.z = Math.sin(t * 1.7) * 0.07; flag.rotation.y = Math.sin(t * 3) * 0.3;
    };
  },

  // 로동로봇: 안전모를 쓴 땅딸막한 공사 로봇. 한 손에 용접기, 한 손에 벽돌.
  builder(g) {
    const yellow = toy('#f5b301', 0.45), grey = toy('#9aa3b2', 0.4), brick = toy('#b5523b', 0.85, { clearcoat: 0 }), red = toy('#d83a2e', 0.5);
    const body = new THREE.Group(); g.add(body);
    for (const s of [1, -1]) {
      rbox(body, 0.62, 0.72, 2.3, 0.3, M.black, s * 0.88, 0.38, 0);
      for (const z of [-0.75, 0, 0.75]) { const hub = cyl(body, 0.2, 0.2, 0.08, M.mid, s * 1.2, 0.38, z, 14); hub.rotation.z = Math.PI / 2; }
    }
    rbox(body, 1.5, 0.5, 1.8, 0.15, M.dark, 0, 0.78, 0);
    rbox(body, 1.75, 1.5, 1.5, 0.38, yellow, 0, 1.78, 0);
    box(body, 1.77, 0.3, 1.52, M.hazard, 0, 1.3, 0);
    rbox(body, 0.9, 0.5, 0.06, 0.08, M.glass, 0, 1.95, 0.75);
    for (let k = 0; k < 3; k++) ball(body, 0.07, glow(['#5fe36a', '#ffd84d', '#ff4d4d'][k], 3), -0.26 + k * 0.26, 1.95, 0.79);
    rbox(body, 0.95, 0.85, 0.5, 0.1, red, 0, 1.9, -0.98);
    box(body, 0.5, 0.08, 0.08, M.light, 0, 2.38, -0.98);
    const head = new THREE.Group(); head.position.set(0, 2.98, 0.05); body.add(head);
    rbox(head, 1.3, 0.86, 1.1, 0.3, grey, 0, 0, 0);
    for (const [x, r] of [[-0.3, 0.29], [0.34, 0.18]]) {
      const lens = cyl(head, r, r, 0.16, M.black, x, 0.03, 0.56, 24); lens.rotation.x = Math.PI / 2;
      add(head, new THREE.TorusGeometry(r, 0.035, 8, 24), M.light, x, 0.03, 0.64);
      ball(head, r * 0.55, glow('#ffb347', 3), x, 0.03, 0.62, 1, 1, 0.3);
    }
    for (let k = 0; k < 3; k++) box(head, 0.36, 0.035, 0.03, M.black, 0.02, -0.24 - k * 0.07, 0.56);
    add(head, new THREE.SphereGeometry(0.8, 28, 14, 0, TAU, 0, Math.PI / 2), yellow, 0, 0.3, 0).scale.set(1, 0.8, 1.05);
    cyl(head, 0.95, 0.95, 0.07, yellow, 0, 0.32, 0.14, 28);
    box(head, 0.16, 0.05, 1.5, WHITE, 0, 0.94, 0).rotation.x = 0;
    limb(head, V(0.5, 0.5, -0.3), V(0.62, 1.35, -0.4), 0.03, M.light);
    const beacon = ball(head, 0.09, glow('#ff3b3b', 4), 0.62, 1.4, -0.4);
    const torch = new THREE.Group(); body.add(torch);
    {
      const shoulder = V(1.05, 2.2, 0), elbow = V(1.5, 1.6, 0.4), hand = V(1.5, 1.55, 1.15);
      ball(torch, 0.24, M.mid, shoulder.x, shoulder.y, shoulder.z); limb(torch, shoulder, elbow, 0.15, grey); ball(torch, 0.19, M.mid, elbow.x, elbow.y, elbow.z); limb(torch, elbow, hand, 0.14, grey);
      const nozzle = cyl(torch, 0.1, 0.16, 0.6, M.dark, 1.5, 1.55, 1.45, 12); nozzle.rotation.x = Math.PI / 2;
    }
    const spark = ball(body, 0.2, glow('#ffd27a', 5), 1.5, 1.55, 1.82);
    {
      const shoulder = V(-1.05, 2.2, 0), elbow = V(-1.5, 1.65, 0.4), hand = V(-1.5, 1.6, 1.05);
      ball(body, 0.24, M.mid, shoulder.x, shoulder.y, shoulder.z); limb(body, shoulder, elbow, 0.15, grey); ball(body, 0.19, M.mid, elbow.x, elbow.y, elbow.z); limb(body, elbow, hand, 0.14, grey);
      for (const dy of [0.26, -0.26]) box(body, 0.5, 0.08, 0.5, M.dark, -1.5, 1.6 + dy, 1.3);
      rbox(body, 0.78, 0.4, 0.44, 0.05, brick, -1.5, 1.6, 1.32);
    }
    return (t, moving) => {
      body.position.y = moving ? Math.abs(Math.sin(t * 9)) * 0.05 : 0;
      head.rotation.y = Math.sin(t * 1.3) * 0.25; head.rotation.z = Math.sin(t * 0.9) * 0.05;
      spark.scale.setScalar(0.5 + Math.abs(Math.sin(t * 23)) * 0.9 * (Math.sin(t * 2.2) > 0 ? 1 : 0.05));
      beacon.visible = Math.sin(t * 6) > 0;
    };
  },

  // 흐엉: 풍선에 매달려 떠가는 축 처진 덩어리. 울고 있다.
  heuong(g) {
    const skin = toy('#8f84c8', 0.75, { clearcoat: 0.1 });
    const sway = new THREE.Group(); g.add(sway);
    const body = new THREE.Group(); body.position.y = 1.9; body.scale.setScalar(1.4); sway.add(body);
    spun(body, [[0, 0], [0.5, 0.12], [0.78, 0.6], [0.74, 1.1], [0.5, 1.5], [0.22, 1.75], [0, 1.8]], skin, 0, 0, 0);
    for (const s of [1, -1]) {
      eye(body, s * 0.3, 1.15, 0.6, 0.2, { look: [0, -0.7], lid: 1.25, lidMat: skin });
      limb(body, V(s * 0.72, 0.95, 0), V(s * 0.9, 0.45, 0.1), 0.09, skin); ball(body, 0.12, skin, s * 0.9, 0.42, 0.1);
      ball(body, 0.16, skin, s * 0.3, -0.02, 0.1, 1, 0.7, 1.3);
    }
    add(body, new THREE.TorusGeometry(0.16, 0.035, 8, 16, Math.PI), PUPIL, 0, 0.66, 0.76).rotation.x = -0.2;
    const tears = [1, -1].map((s) => ball(body, 0.07, glow('#7fd4ff', 2.4), s * 0.34, 0.9, 0.74, 1, 1.6, 1));
    add(body, new THREE.TorusGeometry(0.52, 0.05, 8, 28), M.dark, 0, 1.46, 0).rotation.x = Math.PI / 2;
    const knot = V(0, 4.4, 0);
    [['#ff5d73', 0, 8.3, 0, 1.25], ['#ffd84d', -1.35, 7.4, 0.4, 1.0], ['#59c8ff', 1.3, 7.6, -0.3, 1.05], ['#7be495', -0.5, 7.0, -1.1, 0.9], ['#b06cff', 0.65, 6.8, 1.0, 0.95]].forEach(([color, x, y, z, r]) => {
      const rubber = toy(color, 0.15, { clearcoat: 1, clearcoatRoughness: 0.05 });
      ball(sway, r, rubber, x, y, z, 1, 1.15, 1);
      add(sway, new THREE.ConeGeometry(0.13, 0.22, 8), rubber, x, y - r * 1.15 - 0.06, z);
      limb(sway, knot, V(x, y - r * 1.15 - 0.15, z), 0.014, WHITE);
    });
    ball(sway, 2.5, additive('#a8f0ff', 0.5, null, 0.05), 0, 3.2, 0);
    const halo = add(sway, new THREE.TorusGeometry(2.5, 0.03, 6, 48), glow('#a8f0ff', 1.6), 0, 3.2, 0); halo.rotation.x = Math.PI / 2;
    return (t) => {
      sway.rotation.z = Math.sin(t * 0.9) * 0.06; sway.rotation.x = Math.sin(t * 0.7 + 1) * 0.04; sway.position.y = Math.sin(t * 1.3) * 0.25;
      halo.rotation.z = t * 0.6;
      tears.forEach((drop, n) => { const k = (t * 0.8 + n * 0.5) % 1; drop.position.y = 0.9 - k * 0.75; drop.scale.set(1 - k, 1.6 * (1 - k), 1 - k); });
    };
  },

  // 로또: 다리 달린 추첨기. 유리구 안에서 공이 튄다.
  lotto(g) {
    const red = toy('#e63950', 0.35), gold = std('#ffcf5a', 0.9, 0.25);
    const glass = new THREE.MeshPhysicalMaterial({ color: C('#ffffff'), roughness: 0.04, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.2, depthWrite: false });
    const body = new THREE.Group(); g.add(body);
    for (const s of [1, -1]) { rbox(body, 0.52, 0.26, 0.85, 0.12, red, s * 0.45, 0.13, 0.12); cyl(body, 0.13, 0.13, 0.55, gold, s * 0.45, 0.5, 0, 12); }
    spun(body, [[0, 0], [0.95, 0], [1.06, 0.2], [1.0, 0.9], [0.8, 1.25], [0.55, 1.36]], red, 0, 0.75, 0);
    for (const [r, y] of [[1.05, 1.0], [0.62, 2.1]]) add(body, new THREE.TorusGeometry(r, 0.06, 8, 40), gold, 0, y, 0).rotation.x = Math.PI / 2;
    for (const s of [1, -1]) eye(body, s * 0.32, 1.5, 0.9, 0.2, { look: [s * -0.2, 0.2] });
    rbox(body, 0.56, 0.17, 0.12, 0.06, M.black, 0, 1.14, 1.0);
    rbox(body, 0.7, 0.08, 0.4, 0.03, gold, 0, 0.98, 1.12);
    ball(body, 1.15, glass, 0, 3.05, 0);
    const balls = ['#ffd84d', '#59c8ff', '#ff5d73', '#7be495', '#b06cff', '#ff9a3d', '#ffffff', '#2fe0c0', '#ff6fb5', '#ffd84d', '#59c8ff', '#ff5d73'].map((color, n) => ({ mesh: ball(body, 0.2, toy(color, 0.2, { clearcoat: 1 }), 0, 3.05, 0), a: 2.1 + n * 0.37, b: 1.7 + n * 0.29, c: 2.6 - n * 0.11, p: n * 1.9 }));
    cyl(body, 0.36, 0.42, 0.22, gold, 0, 4.2, 0, 20); ball(body, 0.16, gold, 0, 4.38, 0);
    rbox(body, 1.9, 0.62, 0.16, 0.1, red, 0, 4.95, 0);
    add(body, new THREE.PlaneGeometry(1.7, 0.5), new THREE.MeshBasicMaterial({ map: label('로또', '#ffe45c', '#b3122b', 256, 80, 62) }), 0, 4.95, 0.09);
    cyl(body, 0.06, 0.06, 0.4, gold, 0, 4.52, 0, 8);
    const bulbs = []; for (let k = 0; k < 7; k++) bulbs.push(ball(body, 0.075, glow('#fff1a8', 3.5), -0.84 + k * 0.28, 5.32, 0.02));
    const crank = new THREE.Group(); crank.position.set(1.04, 1.4, 0); body.add(crank);
    limb(crank, V(0, 0, 0), V(0.35, 0, 0), 0.05, gold); limb(crank, V(0.35, 0, 0), V(0.35, 0.4, 0), 0.05, gold); ball(crank, 0.12, red, 0.35, 0.44, 0);
    const p = new THREE.Vector3();
    return (t, moving) => {
      body.position.y = moving ? Math.abs(Math.sin(t * 7)) * 0.22 : Math.abs(Math.sin(t * 2.2)) * 0.05;
      crank.rotation.x = t * 4;
      for (const b of balls) { p.set(Math.sin(t * b.a + b.p), Math.sin(t * b.b + b.p * 1.3), Math.cos(t * b.c + b.p * 0.7)).multiplyScalar(0.86); if (p.length() > 0.9) p.setLength(0.9); b.mesh.position.set(p.x, 3.05 + p.y, p.z); }
      bulbs.forEach((bulb, n) => { bulb.visible = Math.floor(t * 5 + n) % 3 !== 0; });
    };
  },

  // 두리안: 가시투성이 거대 과일. 거만한 눈으로 길 한가운데에 앉아 있다.
  durian(g) {
    const rind = toy('#8f9a34', 0.8, { clearcoat: 0.15 }), tip = toy('#c9c05a', 0.7, { clearcoat: 0.1 });
    const body = new THREE.Group(); body.position.y = 2.4; g.add(body);
    ball(body, 1.9, rind, 0, 0, 0, 1, 1.1, 1);
    const src = new THREE.IcosahedronGeometry(1, 2).attributes.position, seen = new Set(), dirs = [];
    for (let k = 0; k < src.count; k++) {
      const v = new THREE.Vector3().fromBufferAttribute(src, k).normalize(), key = v.toArray().map((n) => n.toFixed(2)).join();
      if (seen.has(key)) continue; seen.add(key);
      if (v.z > 0.6 && v.y > -0.45 && v.y < 0.5) continue;
      dirs.push(v);
    }
    const spikes = new THREE.InstancedMesh(new THREE.ConeGeometry(0.3, 0.8, 7), tip, dirs.length), dummy = new THREE.Object3D();
    dirs.forEach((v, n) => { dummy.position.set(v.x * 2.12, v.y * 2.12 * 1.1, v.z * 2.12); dummy.quaternion.setFromUnitVectors(UP, v); dummy.updateMatrix(); spikes.setMatrixAt(n, dummy.matrix); });
    spikes.castShadow = true; body.add(spikes);
    cyl(body, 0.14, 0.22, 0.9, toy('#6b4a2a', 0.8), 0.1, 2.45, 0, 10).rotation.z = -0.2;
    ball(body, 0.42, toy('#5c8a2e', 0.6), 0.52, 2.62, 0, 1, 0.14, 0.55).rotation.z = 0.5;
    for (const s of [1, -1]) {
      eye(body, s * 0.56, 0.36, 1.7, 0.31, { look: [0.4, -0.1], lid: 1.2, lidMat: rind });
      ball(body, 0.2, toy('#e88b6a', 0.8), s * 1.02, -0.12, 1.54, 1, 0.6, 0.4);
      ball(g, 0.42, rind, s * 0.8, 0.26, 0.5, 1, 0.6, 1.35);
    }
    add(body, new THREE.TorusGeometry(0.36, 0.06, 8, 20, Math.PI * 0.8), PUPIL, 0.1, -0.3, 1.82).rotation.z = Math.PI + 0.45;
    const fume = canvasTexture(64, 256, (c) => { c.strokeStyle = '#ffffff'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(32, 250); for (let y = 250; y > 6; y -= 4) c.lineTo(32 + Math.sin(y * 0.055) * 18, y); c.stroke(); });
    const fumes = [-1.1, 0.1, 1.2].map((x, n) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fume, color: C('#d8ff6a'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      s.scale.set(0.9, 2.6, 1); g.add(s); return { s, x, n };
    });
    return (t) => {
      const breathe = 1 + Math.sin(t * 1.4) * 0.015; body.scale.set(breathe, 2 - breathe, breathe);
      for (const f of fumes) { const k = (t * 0.25 + f.n * 0.33) % 1; f.s.position.set(f.x + Math.sin(t + f.n) * 0.15, 5.4 + k * 2.2, 0.4); f.s.material.opacity = 0.55 * Math.sin(k * Math.PI); }
    };
  },

  // 판 엎기: 얼굴이 시뻘게진 채 밥상을 머리 위로 치켜든 사람.
  flipper(g) {
    const shirt = toy('#cfccc2', 0.85, { clearcoat: 0 }), face = toy('#f0805c', 0.55, { clearcoat: 0.2 }), wood = toy('#7a4a22', 0.45, { clearcoat: 0.6 });
    const plaid = repeatTex(canvasTexture(64, 64, (c) => { c.fillStyle = '#2f5fb8'; c.fillRect(0, 0, 64, 64); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(0, 26, 64, 10); c.fillRect(26, 0, 10, 64); c.fillStyle = 'rgba(10,20,60,0.4)'; c.fillRect(0, 54, 64, 6); c.fillRect(54, 0, 6, 64); }), 3, 2);
    const pants = new THREE.MeshStandardMaterial({ map: plaid, roughness: 0.9, metalness: 0 });
    const body = new THREE.Group(); g.add(body);
    for (const s of [1, -1]) {
      cyl(body, 0.3, 0.26, 0.8, pants, s * 0.4, 0.6, 0, 16);
      rbox(body, 0.46, 0.2, 0.82, 0.1, toy('#3aa0ff', 0.5), s * 0.4, 0.1, 0.14);
    }
    spun(body, [[0, 0], [0.78, 0.05], [0.94, 0.5], [0.88, 1.1], [0.62, 1.45], [0, 1.52]], shirt, 0, 0.95, 0);
    cyl(body, 0.82, 0.86, 0.34, pants, 0, 1.08, 0, 24);
    const head = new THREE.Group(); head.position.y = 3.02; body.add(head);
    ball(head, 0.78, face, 0, 0, 0, 1, 0.95, 0.96);
    for (const s of [1, -1]) {
      ball(head, 0.16, face, s * 0.78, -0.02, 0, 0.5, 1, 0.8);
      eye(head, s * 0.28, 0.12, 0.66, 0.19, { pupil: 0.46, look: [s * -0.3, 0.2] });
      box(head, 0.42, 0.11, 0.1, PUPIL, s * 0.3, 0.36, 0.7).rotation.z = s * -0.5;
    }
    ball(head, 0.24, PUPIL, 0, -0.34, 0.6, 1.1, 0.8, 0.5);
    box(head, 0.3, 0.07, 0.06, WHITE, 0, -0.24, 0.72);
    ball(head, 0.1, face, 0, -0.06, 0.78);
    for (const [x, z, tilt] of [[-0.12, 0.05, -0.3], [0.05, -0.05, 0.1], [0.2, 0.06, 0.4]]) limb(head, V(x, 0.7, z), V(x + tilt * 0.4, 1.05, z), 0.02, PUPIL);
    const vein = glow('#ff2d2d', 3);
    for (const [dx, dy, rz] of [[0.08, 0, 0.5], [-0.08, 0, -0.5], [0, 0.08, 2.07], [0, -0.08, 1.07]]) box(head, 0.2, 0.05, 0.03, vein, 0.52 + dx, 0.42 + dy, 0.5).rotation.z = rz;
    const steam = [1, -1].map((s) => ball(head, 0.16, toy('#ffffff', 1, { clearcoat: 0, transparent: true, opacity: 0.85 }), s * 1.0, 0.1, 0));
    for (const s of [1, -1]) {
      const shoulder = V(s * 0.86, 2.2, 0), elbow = V(s * 1.3, 2.95, 0.15), hand = V(s * 1.05, 3.86, 0.25);
      limb(body, shoulder, elbow, 0.17, SKIN); limb(body, elbow, hand, 0.15, SKIN); ball(body, 0.2, shirt, shoulder.x, shoulder.y, shoulder.z); ball(body, 0.17, SKIN, elbow.x, elbow.y, elbow.z); ball(body, 0.2, SKIN, hand.x, hand.y, hand.z);
    }
    const table = new THREE.Group(); table.position.set(0, 4.12, 0.25); body.add(table);
    cyl(table, 1.55, 1.55, 0.14, wood, 0, 0, 0, 40);
    add(table, new THREE.TorusGeometry(1.55, 0.08, 8, 48), wood, 0, 0.07, 0).rotation.x = Math.PI / 2;
    for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + 0.78; cyl(table, 0.09, 0.12, 0.5, wood, Math.cos(a) * 1.15, -0.3, Math.sin(a) * 1.15, 10); }
    const china = toy('#d5d8de', 0.2, { clearcoat: 1 });
    const bowl = [[0, 0], [0.2, 0.02], [0.32, 0.2], [0.34, 0.24]];
    spun(table, bowl, china, -0.55, 0.08, 0.45); ball(table, 0.3, toy('#fdfdf6', 0.95, { clearcoat: 0 }), -0.55, 0.3, 0.45, 1, 0.6, 1);
    spun(table, bowl, china, 0.5, 0.08, 0.5); cyl(table, 0.3, 0.3, 0.03, toy('#b5442a', 0.3), 0.5, 0.29, 0.5, 20);
    for (const [x, z, color] of [[-0.7, -0.5, '#d8362a'], [0, -0.75, '#4c9a3a'], [0.72, -0.45, '#f2c544']]) { cyl(table, 0.3, 0.26, 0.06, china, x, 0.1, z, 20); ball(table, 0.2, toy(color, 0.7), x, 0.17, z, 1, 0.45, 1); }
    for (const dx of [0, 0.07]) limb(table, V(1.05 + dx, 0.09, 0.55), V(1.15 + dx, 0.09, -0.2), 0.018, M.light);
    return (t, moving, unit) => {
      const flipAge = unit && unit.flipAt !== undefined ? t - unit.flipAt : 9;
      body.position.y = moving ? Math.abs(Math.sin(t * 8)) * 0.12 : 0;
      table.rotation.x = flipAge < 0.9 ? (flipAge / 0.9) * TAU : Math.sin(t * 17) * 0.05;
      table.rotation.z = Math.sin(t * 13 + 1) * 0.05;
      table.position.y = 4.12 + (flipAge < 0.9 ? Math.sin((flipAge / 0.9) * Math.PI) * 1.6 : 0);
      head.rotation.z = Math.sin(t * 15) * 0.03;
      steam.forEach((puff, n) => { const k = (t * 1.2 + n * 0.5) % 1; puff.position.set((n ? -1 : 1) * (0.95 + k * 0.5), 0.1 + k * 0.5, 0); puff.scale.setScalar(0.5 + k); puff.material.opacity = 0.8 * (1 - k); });
    };
  },

  // 주차 단속: 경광등을 단 단속 드론. 외눈 렌즈로 노려보며 딱지 뭉치를 들고 다닌다.
  parking(g) {
    const white = toy('#c3ccd9', 0.35), navy = toy('#1f3a7a', 0.4), paper = toy('#ffe066', 0.7, { clearcoat: 0 });
    const body = new THREE.Group(); g.add(body);
    rbox(body, 1.9, 1.3, 1.6, 0.45, white, 0, 0, 0);
    rbox(body, 1.93, 0.36, 1.63, 0.1, navy, 0, -0.36, 0);
    add(body, new THREE.PlaneGeometry(1.25, 0.3), new THREE.MeshBasicMaterial({ map: label('주차단속', '#ffffff', '#1f3a7a', 256, 62, 44) }), 0, -0.36, 0.83);
    cyl(body, 0.42, 0.42, 0.2, M.black, 0, 0.22, 0.76, 28).rotation.x = Math.PI / 2;
    ball(body, 0.2, glow('#ff5d5d', 3), 0, 0.22, 0.86, 1, 1, 0.3);
    box(body, 1.15, 0.14, 0.45, navy, 0, 0.66, 0.72).rotation.x = 0.4;
    const sirens = [ball(body, 0.2, glow('#ff3b3b', 4), -0.35, 0.78, 0, 1, 0.8, 1), ball(body, 0.2, glow('#3b7bff', 4), 0.35, 0.78, 0, 1, 0.8, 1)];
    const rotors = [];
    for (const s of [1, -1]) {
      limb(body, V(s * 0.9, 0.3, 0), V(s * 1.7, 0.75, 0), 0.07, M.mid); cyl(body, 0.1, 0.1, 0.3, M.dark, s * 1.7, 0.86, 0, 10);
      rotors.push(cyl(body, 0.85, 0.85, 0.02, additive('#cfe6ff', 0.6, null, 0.3), s * 1.7, 1.03, 0, 24), box(body, 1.6, 0.03, 0.14, M.light, s * 1.7, 1.01, 0));
    }
    limb(body, V(-0.8, -0.2, 0.5), V(-1.0, -0.7, 1.1), 0.07, M.mid); rbox(body, 0.62, 0.82, 0.08, 0.04, paper, -1.0, -0.72, 1.22).rotation.x = -0.5;
    limb(body, V(0.8, -0.2, 0.5), V(1.0, -0.6, 1.1), 0.07, M.mid); limb(body, V(1.0, -0.6, 1.1), V(0.82, -0.25, 1.3), 0.04, PUPIL);
    cyl(body, 0.32, 0.1, 0.55, additive('#59c8ff', 1.5, null, 0.5), 0, -0.92, 0, 12);
    add(g, new THREE.CircleGeometry(1.1, 24), additive('#59c8ff', 1.2, null, 0.35), 0, 0.06, 0).rotation.x = -Math.PI / 2;
    return (t) => {
      body.position.y = 2.3 + Math.sin(t * 3) * 0.12; body.rotation.z = Math.sin(t * 2) * 0.05;
      for (const r of rotors) r.rotation.y = t * 30;
      const on = Math.sin(t * 10) > 0; sirens[0].visible = on; sirens[1].visible = !on;
    };
  },

  // 자리 바꿔: 양옆에 포탈 두 개를 띄우고 다니는 우체부.
  swap(g) {
    const blue = toy('#2f6fd6', 0.5), bag = toy('#8a5a2b', 0.8, { clearcoat: 0.1 });
    const body = new THREE.Group(); g.add(body);
    for (const s of [1, -1]) {
      cyl(body, 0.2, 0.18, 0.7, toy('#1c3f85', 0.6), s * 0.32, 0.5, 0, 12); rbox(body, 0.36, 0.2, 0.7, 0.09, M.black, s * 0.32, 0.1, 0.12);
      limb(body, V(s * 0.78, 2.05, 0), V(s * 0.98, 1.3, 0.3), 0.13, blue); ball(body, 0.16, SKIN, s * 0.98, 1.26, 0.3);
    }
    spun(body, [[0, 0], [0.7, 0.05], [0.82, 0.5], [0.76, 1.1], [0.5, 1.4], [0, 1.45]], blue, 0, 0.85, 0);
    ball(body, 0.62, SKIN, 0, 2.75, 0);
    eyes(body, 2.82, 0.52, 0.22, 0.14, { look: [0, 0.1] });
    add(body, new THREE.TorusGeometry(0.17, 0.03, 8, 16, Math.PI), PUPIL, 0, 2.64, 0.56).rotation.z = Math.PI;
    cyl(body, 0.64, 0.66, 0.3, blue, 0, 3.24, 0, 24); cyl(body, 0.5, 0.5, 0.05, M.black, 0, 3.12, 0.42, 20); ball(body, 0.09, GOLD, 0, 3.26, 0.65);
    rbox(body, 0.9, 0.7, 0.4, 0.12, bag, 0.78, 1.55, 0.3); limb(body, V(-0.5, 2.2, 0.32), V(0.78, 1.9, 0.32), 0.05, bag);
    box(body, 0.5, 0.36, 0.03, WHITE, 0.72, 2.02, 0.3).rotation.z = 0.2; box(body, 0.5, 0.36, 0.03, WHITE, 0.92, 1.98, 0.34).rotation.z = -0.15;
    const portals = [['#ff9a3d', -2.0], ['#59c8ff', 2.0]].map(([color, x]) => {
      const p = new THREE.Group(); p.position.set(x, 2.4, -0.4); g.add(p);
      add(p, new THREE.TorusGeometry(0.85, 0.1, 10, 36), glow(color, 3)); add(p, new THREE.CircleGeometry(0.8, 28), additive(color, 0.9, null, 0.4));
      add(p, new THREE.TorusGeometry(0.45, 0.04, 6, 24, 4), glow(color, 2));
      return p;
    });
    return (t, moving) => {
      body.position.y = moving ? Math.abs(Math.sin(t * 8)) * 0.1 : 0;
      portals.forEach((p, n) => { p.rotation.z = t * (n ? -2 : 2); p.position.y = 2.4 + Math.sin(t * 2 + n * 3) * 0.25; });
    };
  },

  // 축지법: 갓 쓴 도사가 눈을 감은 채 구름을 타고 다닌다. 뒤에 잔상이 남는다.
  blink(g) {
    const robe = toy('#d1d4da', 0.8, { clearcoat: 0 }), black = toy('#15161c', 0.5), fluff = toy('#dfe2e8', 0.95, { clearcoat: 0 });
    const cloud = new THREE.Group(); g.add(cloud);
    for (const [x, z, r] of [[0, 0, 0.9], [0.85, 0.2, 0.6], [-0.85, 0.1, 0.65], [0.3, -0.7, 0.6], [-0.4, 0.7, 0.55]]) ball(cloud, r, fluff, x, 0.55, z, 1, 0.6, 1);
    const body = new THREE.Group(); g.add(body);
    spun(body, [[0, 0], [1.0, 0], [0.9, 0.4], [0.6, 1.4], [0.42, 1.9], [0, 1.95]], robe, 0, 0, 0);
    add(body, new THREE.TorusGeometry(0.55, 0.2, 10, 24, Math.PI), robe, 0, 1.15, 0.3).rotation.x = Math.PI / 2;
    ball(body, 0.52, SKIN, 0, 2.35, 0);
    for (const s of [1, -1]) add(body, new THREE.TorusGeometry(0.1, 0.022, 6, 12, Math.PI), PUPIL, s * 0.2, 2.42, 0.47).rotation.z = Math.PI;
    add(body, new THREE.ConeGeometry(0.3, 1.0, 12), robe, 0, 1.74, 0.38).rotation.x = Math.PI + 0.15;
    cyl(body, 1.15, 1.15, 0.04, toy('#15161c', 0.4, { transparent: true, opacity: 0.82 }), 0, 2.78, 0, 36); cyl(body, 0.42, 0.5, 0.55, black, 0, 3.06, 0, 24);
    const ghosts = [1, 2].map((k) => ball(g, 0.9, additive('#b8c7ff', 0.8, null, 0.16 / k), 0, 2.4, -1.5 * k, 0.8, 1.9, 0.5));
    return (t) => {
      body.position.y = 1.0 + Math.sin(t * 2) * 0.12; cloud.rotation.y = t * 0.8; cloud.position.y = Math.sin(t * 2) * 0.1;
      ghosts.forEach((m, k) => { m.material.opacity = (0.16 / (k + 1)) * (0.6 + 0.4 * Math.sin(t * 6 + k)); });
    };
  },

  // 유배: 곤장을 든 사또. 눈을 내리깔고 다음 죄인을 고른다.
  exile(g) {
    const red = toy('#b3202a', 0.55), black = toy('#15161c', 0.45), wood = toy('#b98a4e', 0.6);
    const body = new THREE.Group(); g.add(body);
    spun(body, [[0, 0], [1.0, 0], [0.95, 0.5], [0.8, 1.5], [0.6, 2.0], [0, 2.05]], red, 0, 0.1, 0);
    add(body, new THREE.TorusGeometry(0.86, 0.08, 8, 32), GOLD, 0, 1.3, 0).rotation.x = Math.PI / 2;
    rbox(body, 0.66, 0.58, 0.06, 0.08, toy('#1f3a7a', 0.5), 0, 1.78, 0.7); ball(body, 0.12, GOLD, 0, 1.78, 0.74, 1, 1, 0.4);
    const head = new THREE.Group(); head.position.y = 2.72; body.add(head);
    ball(head, 0.6, SKIN, 0, 0, 0);
    eyes(head, 0.08, 0.5, 0.22, 0.13, { lid: 1.05, lidMat: SKIN });
    for (const s of [1, -1]) { box(head, 0.3, 0.07, 0.06, PUPIL, s * 0.22, 0.3, 0.52).rotation.z = s * -0.35; limb(head, V(s * 0.04, -0.16, 0.6), V(s * 0.34, -0.3, 0.5), 0.025, PUPIL); }
    add(head, new THREE.TorusGeometry(0.12, 0.03, 6, 12, Math.PI), PUPIL, 0, -0.34, 0.52);
    cyl(head, 0.6, 0.62, 0.3, black, 0, 0.5, 0, 24); rbox(head, 0.9, 0.5, 0.5, 0.15, black, 0, 0.8, -0.2);
    for (const s of [1, -1]) rbox(head, 0.8, 0.22, 0.05, 0.08, black, s * 0.95, 0.6, -0.25);
    limb(body, V(-0.85, 2.0, 0), V(-0.95, 1.9, 1.0), 0.14, red); ball(body, 0.17, SKIN, -0.95, 1.9, 1.05);
    limb(body, V(0.85, 2.0, 0), V(1.2, 1.5, 0.5), 0.14, red); ball(body, 0.17, SKIN, 1.2, 1.5, 0.5);
    const paddle = new THREE.Group(); paddle.position.set(1.2, 1.5, 0.5); body.add(paddle);
    rbox(paddle, 0.34, 2.6, 0.1, 0.08, wood, 0, 1.0, 0);
    return (t) => { paddle.rotation.x = 0.5 + Math.sin(t * 5) * 0.45; head.rotation.y = Math.sin(t * 0.8) * 0.35; };
  },

  // 납치범: 복면을 쓴 승합차. 지붕의 집게가 먹잇감을 찾아 흔들린다.
  van(g) {
    const paint = toy('#1f6f6a', 0.35), tint = M.glass;
    const body = new THREE.Group(); g.add(body);
    rbox(body, 2.3, 1.5, 4.4, 0.4, paint, 0, 1.25, 0);
    rbox(body, 2.1, 0.75, 0.1, 0.1, tint, 0, 1.62, 2.19);
    box(body, 2.34, 0.42, 0.3, PUPIL, 0, 1.62, 2.1);
    eyes(body, 1.62, 2.24, 0.5, 0.17, { look: [0.4, 0], lid: 0.95, lidMat: PUPIL });
    for (const s of [1, -1]) { rbox(body, 0.08, 0.6, 1.2, 0.08, tint, s * 1.16, 1.6, 0.6); ball(body, 0.2, glow('#fff1b8', 2.4), s * 0.75, 0.85, 2.2, 1, 0.7, 0.3); }
    rbox(body, 0.9, 0.3, 0.06, 0.05, WHITE, 0, 0.72, 2.21);
    add(body, new THREE.PlaneGeometry(0.8, 0.22), new THREE.MeshBasicMaterial({ map: label('납 0429', '#111111', '#e4e6ea', 256, 70, 50) }), 0, 0.72, 2.25);
    const wheels = [];
    for (const s of [1, -1]) for (const z of [-1.35, 1.35]) { const w = cyl(body, 0.55, 0.55, 0.4, M.black, s * 1.1, 0.55, z, 20); w.rotation.z = Math.PI / 2; wheels.push(w); cyl(body, 0.25, 0.25, 0.42, M.light, s * 1.1, 0.55, z, 12).rotation.z = Math.PI / 2; }
    cyl(body, 0.3, 0.36, 0.3, M.dark, 0, 2.15, -0.6, 16);
    const arm = new THREE.Group(); arm.position.set(0, 2.3, -0.6); body.add(arm);
    limb(arm, V(0, 0, 0), V(0, 1.5, 0.6), 0.1, M.mid); limb(arm, V(0, 1.5, 0.6), V(0, 1.7, 2.2), 0.09, M.mid); ball(arm, 0.14, M.light, 0, 1.5, 0.6);
    const claw = new THREE.Group(); claw.position.set(0, 1.7, 2.2); arm.add(claw);
    limb(claw, V(0, 0, 0), V(0, -0.7, 0), 0.03, M.light);
    for (const s of [1, -1]) { limb(claw, V(0, -0.7, 0), V(s * 0.4, -1.0, 0), 0.06, M.light); limb(claw, V(s * 0.4, -1.0, 0), V(s * 0.22, -1.5, 0), 0.06, M.light); }
    return (t, moving) => {
      body.position.y = moving ? Math.abs(Math.sin(t * 10)) * 0.06 : 0; body.rotation.z = Math.sin(t * 2.3) * 0.02;
      if (moving) for (const w of wheels) w.rotation.x = t * 6;
      arm.rotation.y = Math.sin(t * 1.4) * 0.5; claw.rotation.x = Math.sin(t * 3) * 0.3;
    };
  },

  // 복사기: 운동화를 신은 사무용 복합기. 남의 얼굴이 찍힌 종이를 뱉는다.
  copier(g) {
    const shell = toy('#b9bec8', 0.45), dark = toy('#3a4050', 0.5);
    const body = new THREE.Group(); g.add(body);
    for (const s of [1, -1]) { cyl(body, 0.1, 0.1, 0.9, PUPIL, s * 0.5, 0.65, 0, 8); rbox(body, 0.44, 0.26, 0.8, 0.12, toy('#ff5d73', 0.5), s * 0.5, 0.13, 0.16); box(body, 0.46, 0.06, 0.82, WHITE, s * 0.5, 0.04, 0.16); }
    rbox(body, 2.2, 1.7, 1.8, 0.2, shell, 0, 2.0, 0);
    rbox(body, 2.22, 0.3, 1.82, 0.08, dark, 0, 1.45, 0);
    rbox(body, 1.5, 0.08, 0.9, 0.04, shell, 0, 1.62, 1.2);
    rbox(body, 1.3, 0.75, 0.08, 0.08, M.black, -0.2, 2.35, 0.9);
    for (const s of [1, -1]) rbox(body, 0.22, 0.3, 0.04, 0.05, glow('#7be495', 2.6), -0.2 + s * 0.3, 2.42, 0.95);
    rbox(body, 0.5, 0.06, 0.04, 0.02, glow('#7be495', 2.6), -0.2, 2.14, 0.95);
    for (let k = 0; k < 3; k++) ball(body, 0.08, glow(['#ff5d5d', '#ffd84d', '#59c8ff'][k], 3), 0.72, 2.6 - k * 0.24, 0.92);
    const lid = new THREE.Group(); lid.position.set(0, 2.88, -0.9); body.add(lid);
    rbox(lid, 2.2, 0.22, 1.8, 0.1, dark, 0, 0.1, 0.9);
    const scan = box(body, 1.9, 0.06, 0.12, glow('#9dffb0', 4), 0, 2.88, 0);
    const sheet = new THREE.Group(); body.add(sheet);
    add(sheet, new THREE.PlaneGeometry(1.2, 0.85), new THREE.MeshStandardMaterial({ map: canvasTexture(128, 90, (c) => { c.fillStyle = '#f4f4f0'; c.fillRect(0, 0, 128, 90); c.fillStyle = '#222'; c.beginPath(); c.arc(44, 38, 8, 0, TAU); c.arc(84, 38, 8, 0, TAU); c.fill(); c.lineWidth = 5; c.beginPath(); c.arc(64, 50, 22, 0.2, Math.PI - 0.2); c.stroke(); }), side: THREE.DoubleSide, roughness: 0.9 }), 0, 0, 0).rotation.x = -Math.PI / 2 + 0.25;
    return (t, moving) => {
      body.position.y = moving ? Math.abs(Math.sin(t * 9)) * 0.14 : 0;
      lid.rotation.x = -Math.abs(Math.sin(t * 1.5)) * 0.35; scan.position.z = Math.sin(t * 3) * 0.75; scan.visible = lid.rotation.x < -0.08;
      const k = (t * 0.6) % 1; sheet.position.set(0, 1.72 - k * 0.15, 0.9 + k * 1.3); sheet.visible = k < 0.85;
    };
  },

  // 달팽이: 집 대신 송신탑을 지고 다닌다. 전파가 퍼질 때마다 누군가 느려진다.
  snail(g) {
    const flesh = toy('#b7c95a', 0.5, { clearcoat: 0.8 }), shell = std('#5f6b82', 0.8, 0.35);
    const body = new THREE.Group(); g.add(body);
    ball(body, 1.0, flesh, 0, 0.5, 0, 0.75, 0.5, 2.1);
    ball(body, 0.6, flesh, 0, 1.05, 1.45, 0.9, 1.1, 0.9);
    const stalks = [1, -1].map((s) => { const st = new THREE.Group(); st.position.set(s * 0.25, 1.5, 1.6); body.add(st); limb(st, V(0, 0, 0), V(s * 0.15, 0.8, 0.1), 0.06, flesh); eye(st, s * 0.15, 0.95, 0.12, 0.22, { look: [0, -0.2] }); return st; });
    add(body, new THREE.TorusGeometry(0.16, 0.03, 6, 12, Math.PI), PUPIL, 0, 0.98, 1.98).rotation.z = Math.PI;
    for (const [r, y, z] of [[1.0, 1.35, -0.3], [0.75, 1.9, -0.3], [0.5, 2.3, -0.3]]) { add(body, new THREE.TorusGeometry(r * 0.6, r * 0.45, 12, 28), shell, 0, y, z).rotation.x = Math.PI / 2; add(body, new THREE.TorusGeometry(r * 1.06, 0.04, 6, 36), glow('#ffd84d', 2.2), 0, y, z).rotation.x = Math.PI / 2; }
    limb(body, V(0, 2.4, -0.3), V(0, 4.3, -0.3), 0.06, M.light);
    for (const y of [3.0, 3.5, 4.0]) box(body, 0.9 - (y - 3) * 0.5, 0.05, 0.05, M.light, 0, y, -0.3);
    const beacon = ball(body, 0.1, glow('#ff3b3b', 4), 0, 4.4, -0.3);
    const waves = [0, 1, 2].map(() => add(body, new THREE.TorusGeometry(1, 0.025, 6, 40), additive('#ffd84d', 2, null, 0.6), 0, 4.2, -0.3));
    return (t, moving) => {
      body.scale.z = 1 + (moving ? Math.sin(t * 4) * 0.06 : 0);
      stalks.forEach((st, n) => { st.rotation.z = Math.sin(t * 1.6 + n * 2) * 0.2; });
      beacon.visible = Math.sin(t * 5) > 0;
      waves.forEach((w, n) => { const k = (t * 0.5 + n / 3) % 1; w.scale.setScalar(0.2 + k * 2.2); w.material.opacity = 0.6 * (1 - k); w.rotation.x = Math.PI / 2; });
    };
  },

  // 안감^^: 화분. 웃는 얼굴로 꼼짝도 하지 않는다.
  pot(g) {
    const clay = toy('#c8643c', 0.75, { clearcoat: 0.1 }), leaf = toy('#4c9a3a', 0.5);
    spun(g, [[0, 0], [0.85, 0], [1.25, 1.7], [1.38, 1.7], [1.38, 2.0], [1.2, 2.0], [1.15, 1.85], [0, 1.85]], clay, 0, 0, 0);
    cyl(g, 1.15, 1.15, 0.05, toy('#3b2a1c', 0.95, { clearcoat: 0 }), 0, 1.86, 0, 24);
    for (const s of [1, -1]) { limb(g, V(s * 0.42, 1.2, 1.12), V(s * 0.3, 1.38, 1.14), 0.035, PUPIL); limb(g, V(s * 0.3, 1.38, 1.14), V(s * 0.18, 1.2, 1.12), 0.035, PUPIL); }
    add(g, new THREE.TorusGeometry(0.14, 0.03, 6, 12, Math.PI), PUPIL, 0, 0.98, 1.02).rotation.z = Math.PI;
    const plant = new THREE.Group(); plant.position.y = 1.85; g.add(plant);
    limb(plant, V(0, 0, 0), V(0.1, 1.5, 0), 0.07, leaf);
    for (const [s, y] of [[1, 0.7], [-1, 1.05]]) ball(plant, 0.5, leaf, s * 0.5, y, 0, 1, 0.16, 0.5).rotation.z = s * 0.5;
    ball(plant, 0.26, toy('#ffd84d', 0.5), 0.12, 1.65, 0);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; ball(plant, 0.22, toy('#ff8fab', 0.5), 0.12 + Math.cos(a) * 0.4, 1.65 + Math.sin(a) * 0.4, 0, 1, 1, 0.4); }
    return (t) => { plant.rotation.z = Math.sin(t * 1.2) * 0.12; };
  },

  // 빠를 거 같냐?: 날개까지 단 빨간 스포츠카. 눈은 반쯤 감겼고 매연만 뿜는다.
  sportscar(g) {
    const red = toy('#d81e2c', 0.25, { clearcoat: 1, clearcoatRoughness: 0.1 });
    const body = new THREE.Group(); g.add(body);
    rbox(body, 2.2, 0.6, 4.6, 0.28, red, 0, 0.75, 0);
    rbox(body, 1.7, 0.6, 1.9, 0.3, M.glass, 0, 1.22, -0.25);
    box(body, 0.34, 0.02, 4.62, WHITE, 0, 1.06, 0);
    for (const s of [1, -1]) {
      eye(body, s * 0.62, 0.9, 2.2, 0.24, { look: [0, -0.5], lid: 1.45, lidMat: red });
      box(body, 0.1, 0.5, 0.1, M.dark, s * 0.8, 1.3, -2.05); cyl(body, 0.13, 0.13, 0.5, M.light, s * 0.5, 0.55, -2.4, 10).rotation.x = Math.PI / 2;
    }
    box(body, 2.4, 0.08, 0.6, M.dark, 0, 1.58, -2.05);
    add(body, new THREE.TorusGeometry(0.2, 0.03, 6, 12, Math.PI), PUPIL, 0, 0.62, 2.31);
    const wheels = [];
    for (const s of [1, -1]) for (const z of [-1.5, 1.5]) { const w = cyl(body, 0.42, 0.42, 0.36, M.black, s * 1.05, 0.42, z, 18); w.rotation.z = Math.PI / 2; wheels.push(w); cyl(body, 0.2, 0.2, 0.38, GOLD, s * 1.05, 0.42, z, 10).rotation.z = Math.PI / 2; }
    const smoke = [0, 1, 2].map(() => ball(g, 0.3, toy('#6b6f7a', 1, { clearcoat: 0, transparent: true, opacity: 0.6 }), 0, 0.6, -2.8));
    return (t, moving) => {
      body.rotation.z = Math.sin(t * 14) * 0.012; body.position.y = Math.sin(t * 14) * 0.02;
      if (moving) for (const w of wheels) w.rotation.x = t * 2;
      smoke.forEach((puff, n) => { const k = (t * 0.7 + n / 3) % 1; puff.position.set(Math.sin(n * 2.1) * 0.5, 0.6 + k * 1.4, -2.8 - k * 1.6); puff.scale.setScalar(0.5 + k * 1.4); puff.material.opacity = 0.6 * (1 - k); });
    };
  },

  // 짱돌: 이를 악문 바위. 얼굴째로 굴러간다.
  boulder(g) {
    const geo = new THREE.IcosahedronGeometry(1.5, 2), pos = geo.attributes.position, v = new THREE.Vector3();
    for (let k = 0; k < pos.count; k++) { v.fromBufferAttribute(pos, k); v.multiplyScalar(1 + 0.1 * Math.sin(v.x * 2.7 + v.y * 1.9) + 0.08 * Math.sin(v.y * 3.7 + v.z * 2.3)); pos.setXYZ(k, v.x, v.y, v.z); }
    geo.computeVertexNormals();
    const roll = new THREE.Group(); roll.position.y = 1.55; g.add(roll);
    add(roll, geo, std('#7b7f8a', 0.1, 0.9, { flatShading: true }));
    eyes(roll, 0.3, 1.3, 0.5, 0.26, { pupil: 0.4 });
    for (const s of [1, -1]) box(roll, 0.6, 0.14, 0.12, PUPIL, s * 0.5, 0.7, 1.32).rotation.z = s * -0.45;
    rbox(roll, 0.9, 0.3, 0.1, 0.06, WHITE, 0, -0.4, 1.36);
    for (const x of [-0.22, 0, 0.22]) box(roll, 0.03, 0.3, 0.12, PUPIL, x, -0.4, 1.38);
    rbox(roll, 0.6, 0.2, 0.06, 0.06, toy('#e8c9a0', 0.8), -0.7, 0.95, 1.05).rotation.z = 0.6;
    return (t, moving) => { if (moving) roll.rotation.x = t * 1.6; else { roll.rotation.x = 0; roll.rotation.z = Math.sin(t * 2) * 0.06; } };
  },

  // 마이너스 통장: 입을 쩍 벌린 지갑. 안에서 나방만 날아오른다.
  wallet(g) {
    const leather = toy('#7a4a2a', 0.6, { clearcoat: 0.3 }), lining = toy('#2a1a10', 0.9, { clearcoat: 0 });
    const body = new THREE.Group(); g.add(body);
    for (const s of [1, -1]) { cyl(body, 0.09, 0.09, 0.5, PUPIL, s * 0.6, 0.3, 0, 8); ball(body, 0.2, PUPIL, s * 0.6, 0.1, 0.1, 1, 0.5, 1.4); }
    rbox(body, 2.6, 0.9, 1.3, 0.25, leather, 0, 1.0, 0);
    box(body, 2.3, 0.1, 1.05, lining, 0, 1.46, 0);
    const flap = new THREE.Group(); flap.position.set(0, 1.45, -0.6); body.add(flap);
    rbox(flap, 2.6, 0.9, 1.3, 0.25, leather, 0, 0.45, 0.6);
    box(flap, 2.3, 0.1, 1.05, lining, 0, 0.0, 0.6);
    eyes(flap, 0.62, 1.22, 0.5, 0.2, { look: [0, -0.5] });
    for (const s of [1, -1]) box(flap, 0.36, 0.07, 0.06, PUPIL, s * 0.5, 0.92, 1.24).rotation.z = s * 0.4;
    ball(flap, 0.12, GOLD, 0, 0.25, 1.26);
    rbox(body, 0.9, 0.05, 1.5, 0.02, toy('#d9dde3', 0.8), 0.3, 1.5, 0.6).rotation.x = 0.35;
    const minus = box(g, 1.1, 0.26, 0.12, glow('#ff3b3b', 3.5), 0, 4.0, 0);
    const moths = [0, 1, 2].map(() => { const m = new THREE.Group(); g.add(m); for (const s of [1, -1]) add(m, new THREE.CircleGeometry(0.16, 3), new THREE.MeshStandardMaterial({ color: C('#a89f8a'), side: THREE.DoubleSide, roughness: 1 }), s * 0.12, 0, 0).rotation.y = s * 0.6; return m; });
    return (t, moving) => {
      body.position.y = moving ? Math.abs(Math.sin(t * 8)) * 0.12 : 0;
      flap.rotation.x = -0.75 - Math.abs(Math.sin(t * 2.5)) * 0.35;
      minus.position.y = 4.0 + Math.sin(t * 3) * 0.15; minus.rotation.y = t;
      moths.forEach((m, n) => { const a = t * (1.5 + n * 0.4) + n * 2; m.position.set(Math.cos(a) * (0.7 + n * 0.25), 2.6 + Math.sin(a * 1.7) * 0.4 + n * 0.3, Math.sin(a) * 0.7); m.rotation.y = -a; m.scale.x = 0.4 + Math.abs(Math.sin(t * 20 + n)); });
    };
  },

  // 리셋 버튼: 거대한 빨간 버튼을 머리에 인 상자. 식은땀을 흘린다.
  reset(g) {
    const steel = toy('#7d8594', 0.4);
    const body = new THREE.Group(); g.add(body);
    for (const s of [1, -1]) ball(body, 0.26, M.dark, s * 0.6, 0.14, 0.2, 1, 0.55, 1.4);
    rbox(body, 2.2, 1.6, 2.0, 0.25, steel, 0, 1.1, 0);
    box(body, 2.22, 0.26, 2.02, M.hazard, 0, 1.72, 0);
    add(body, new THREE.PlaneGeometry(1.5, 0.3), new THREE.MeshBasicMaterial({ map: label('누르지 마시오', '#ffe45c', '#15161c', 320, 64, 40) }), 0, 0.55, 1.02);
    eyes(body, 1.2, 1.02, 0.42, 0.2, { look: [0, 0.6], pupil: 0.36 });
    add(body, new THREE.TorusGeometry(0.16, 0.03, 6, 12, Math.PI), PUPIL, 0, 0.9, 1.02);
    cyl(body, 0.95, 1.0, 0.25, M.dark, 0, 2.02, 0, 32);
    const button = add(body, new THREE.SphereGeometry(0.85, 32, 16, 0, TAU, 0, Math.PI / 2), toy('#e02a2a', 0.2, { clearcoat: 1, emissive: C('#ff2020'), emissiveIntensity: 0.4 }), 0, 2.1, 0);
    const sweat = ball(body, 0.1, glow('#7fd4ff', 2.2), 0.95, 1.5, 0.9, 1, 1.5, 1);
    return (t, moving) => {
      body.position.y = moving ? Math.abs(Math.sin(t * 9)) * 0.08 : 0; body.rotation.z = Math.sin(t * 22) * 0.008;
      const press = Math.max(0, Math.sin(t * 2.2)); button.scale.y = 0.8 - press * 0.35; button.material.emissiveIntensity = 0.3 + press * 1.6;
      const k = (t * 0.7) % 1; sweat.position.y = 1.6 - k * 0.8; sweat.scale.setScalar(1 - k);
    };
  },

  // 월세: 독촉 도장이 찍힌 고지서 뭉치. 심술궂게 웃으며 따라온다.
  rent(g) {
    const paper = toy('#d9d5c8', 0.9, { clearcoat: 0 });
    const body = new THREE.Group(); g.add(body);
    for (const s of [1, -1]) { cyl(body, 0.08, 0.08, 0.6, PUPIL, s * 0.45, 0.35, 0, 8); ball(body, 0.2, PUPIL, s * 0.45, 0.1, 0.12, 1, 0.5, 1.5); }
    const sheets = [];
    for (let k = 0; k < 7; k++) { const sheet = rbox(body, 2.0, 0.16, 1.5, 0.05, paper, Math.sin(k * 1.7) * 0.12, 0.72 + k * 0.17, Math.cos(k * 2.3) * 0.1); sheet.rotation.y = Math.sin(k * 3.1) * 0.25; sheets.push(sheet); }
    const front = new THREE.Group(); front.position.set(0, 1.25, 0.82); body.add(front);
    add(front, new THREE.PlaneGeometry(1.9, 2.3), new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide, map: canvasTexture(256, 310, (c) => {
      c.fillStyle = '#f1eee4'; c.fillRect(0, 0, 256, 310); c.fillStyle = '#222'; c.font = `700 40px ${FONT_KR}`; c.textAlign = 'center'; c.fillText('월세 고지서', 128, 54);
      c.fillStyle = '#9a968a'; for (let y = 200; y < 290; y += 22) c.fillRect(30, y, 196, 8);
      c.save(); c.translate(178, 250); c.rotate(-0.3); c.strokeStyle = '#d1202a'; c.fillStyle = '#d1202a'; c.lineWidth = 6; c.strokeRect(-62, -30, 124, 60); c.font = `700 42px ${FONT_KR}`; c.fillText('독촉', 0, 15); c.restore();
    }) }), 0, 1.1, 0);
    eyes(front, 1.3, 0.04, 0.42, 0.2, { look: [0, -0.3], lid: 0.9, lidMat: PUPIL, lidTilt: 0.2 });
    for (const s of [1, -1]) box(front, 0.5, 0.09, 0.05, PUPIL, s * 0.42, 1.6, 0.06).rotation.z = s * -0.5;
    add(front, new THREE.TorusGeometry(0.34, 0.04, 6, 20, Math.PI), PUPIL, 0, 1.05, 0.04).rotation.z = Math.PI;
    const coins = [0, 1, 2].map(() => cyl(g, 0.16, 0.16, 0.04, GOLD, 0, 0, 0, 14));
    return (t, moving) => {
      body.position.y = moving ? Math.abs(Math.sin(t * 7)) * 0.18 : 0; front.rotation.x = Math.sin(t * 2.5) * 0.08 - 0.05;
      sheets.forEach((sheet, k) => { sheet.rotation.y = Math.sin(k * 3.1) * 0.25 + Math.sin(t * 3 + k) * 0.04; });
      coins.forEach((coin, n) => { const k = (t * 0.6 + n / 3) % 1; coin.position.set((n - 1) * 0.7 + k * (n - 1), 3.6 + k * 1.6, 0.6); coin.rotation.x = t * 6 + n; coin.scale.setScalar(1 - k * 0.7); });
    };
  },

  // 지우개: 종이 띠를 두른 큼직한 지우개. 지나간 자리에 가루가 남는다.
  eraser(g) {
    const rubber = toy('#f29bb0', 0.75, { clearcoat: 0.1 }), sleeve = toy('#2f6fd6', 0.6);
    const body = new THREE.Group(); body.position.y = 1.5; g.add(body);
    rbox(body, 1.9, 2.9, 1.2, 0.3, rubber, 0, 0, 0);
    rbox(body, 1.96, 1.5, 1.26, 0.1, sleeve, 0, -0.6, 0);
    add(body, new THREE.PlaneGeometry(1.5, 0.6), new THREE.MeshBasicMaterial({ map: label('지우개', '#ffffff', '#2f6fd6', 256, 100, 64) }), 0, -0.6, 0.64);
    eyes(body, 0.75, 0.6, 0.38, 0.17, { look: [0, -0.2] });
    add(body, new THREE.TorusGeometry(0.13, 0.03, 6, 12, Math.PI), PUPIL, 0, 0.42, 0.61).rotation.z = Math.PI;
    for (const s of [1, -1]) ball(body, 0.14, toy('#e86a8a', 0.8), s * 0.62, 0.5, 0.58, 1, 0.6, 0.3);
    const crumbs = [0, 1, 2, 3, 4].map((n) => ball(g, 0.1 + (n % 2) * 0.05, toy('#8f93a0', 0.9, { clearcoat: 0 }), 0, 0.1, 0, 1.6, 0.6, 1));
    return (t, moving) => {
      body.rotation.z = Math.sin(t * 6) * 0.16; body.position.x = Math.sin(t * 6) * 0.2;
      crumbs.forEach((crumb, n) => { const k = (t * 0.5 + n / 5) % 1; crumb.position.set(Math.sin(n * 2.4) * 0.8, 0.1, -1 - k * 2.4); crumb.rotation.y = n; crumb.visible = moving || k < 0.3; });
    };
  },

  // 병아리 유치원: 호루라기를 문 암탉과 노란 모자를 쓴 병아리 줄.
  hen(g) {
    const feather = toy('#d9d2c2', 0.8, { clearcoat: 0 }), yellow = toy('#ffd84d', 0.6), beak = toy('#ff9a3d', 0.5), red = toy('#e02a2a', 0.5);
    const hen = new THREE.Group(); hen.position.z = 1.4; g.add(hen);
    ball(hen, 1.0, feather, 0, 1.25, 0, 1, 0.95, 1.2);
    ball(hen, 0.55, feather, 0, 2.35, 0.55);
    add(hen, new THREE.ConeGeometry(0.16, 0.36, 8), beak, 0, 2.3, 1.12).rotation.x = Math.PI / 2;
    eyes(hen, 2.45, 1.0, 0.24, 0.12, {});
    for (const x of [-0.18, 0, 0.18]) ball(hen, 0.16, red, x * 0.3, 2.95 - Math.abs(x) * 0.5, 0.45 + x, 0.6, 1, 1);
    ball(hen, 0.13, red, 0, 2.02, 0.98, 0.7, 1.3, 0.7);
    for (const s of [1, -1]) { ball(hen, 0.6, feather, s * 0.92, 1.3, -0.1, 0.3, 0.8, 1.1); limb(hen, V(s * 0.35, 0.4, 0.1), V(s * 0.35, 0.05, 0.2), 0.05, beak); }
    add(hen, new THREE.ConeGeometry(0.5, 0.9, 8), feather, 0, 1.75, -1.1).rotation.x = -0.9;
    cyl(hen, 0.08, 0.08, 0.2, M.light, 0, 2.16, 1.22, 8).rotation.x = Math.PI / 2;
    const chicks = [0, 1, 2, 3, 4].map((n) => {
      const c = new THREE.Group(); c.position.z = -0.4 - n * 1.0; g.add(c);
      ball(c, 0.36, yellow, 0, 0.4, 0); ball(c, 0.25, yellow, 0, 0.82, 0.14);
      add(c, new THREE.ConeGeometry(0.07, 0.16, 6), beak, 0, 0.8, 0.42).rotation.x = Math.PI / 2;
      for (const s of [1, -1]) ball(c, 0.04, PUPIL, s * 0.1, 0.88, 0.36);
      cyl(c, 0.34, 0.34, 0.03, yellow, 0, 1.02, 0.12, 16); add(c, new THREE.SphereGeometry(0.22, 12, 8, 0, TAU, 0, Math.PI / 2), yellow, 0, 1.02, 0.12);
      return c;
    });
    return (t, moving) => {
      hen.position.y = moving ? Math.abs(Math.sin(t * 7)) * 0.12 : 0; hen.rotation.z = Math.sin(t * 7) * 0.05;
      chicks.forEach((c, n) => { c.position.y = Math.abs(Math.sin(t * 9 - n * 0.9)) * 0.22; c.position.x = Math.sin(t * 2 - n * 0.8) * 0.25; });
    };
  },

  // 부엉부엉: 룰렛을 든 부엉이. 고개가 끝없이 돌아간다.
  owl(g) {
    const brown = toy('#8a5a3a', 0.8, { clearcoat: 0 }), cream = toy('#d9c7a0', 0.8, { clearcoat: 0 });
    const body = new THREE.Group(); g.add(body);
    cyl(g, 0.12, 0.16, 1.0, M.dark, 0, 0.5, 0, 10); cyl(g, 0.7, 0.7, 0.1, M.dark, 0, 1.0, 0, 20);
    spun(body, [[0, 0], [0.7, 0.1], [1.0, 0.8], [0.9, 1.6], [0.55, 2.0], [0, 2.05]], brown, 0, 1.05, 0);
    ball(body, 0.7, cream, 0, 1.9, 0.45, 0.85, 1, 0.6);
    for (const s of [1, -1]) { ball(body, 0.8, brown, s * 0.92, 2.0, -0.05, 0.25, 0.9, 0.7); limb(body, V(s * 0.3, 1.1, 0.3), V(s * 0.3, 1.02, 0.6), 0.06, GOLD); }
    const head = new THREE.Group(); head.position.y = 3.25; body.add(head);
    ball(head, 0.85, brown, 0, 0, 0, 1.1, 0.9, 1);
    for (const s of [1, -1]) {
      ball(head, 0.42, cream, s * 0.4, 0.05, 0.62, 1, 1, 0.4);
      eye(head, s * 0.4, 0.05, 0.72, 0.28, { pupil: 0.62 });
      add(head, new THREE.ConeGeometry(0.2, 0.5, 6), brown, s * 0.6, 0.78, 0.1).rotation.z = s * -0.4;
    }
    add(head, new THREE.ConeGeometry(0.13, 0.3, 6), GOLD, 0, -0.18, 0.9).rotation.x = Math.PI * 0.65;
    const wheel = new THREE.Group(); wheel.position.set(1.75, 2.2, 0.5); g.add(wheel);
    const sectors = canvasTexture(256, 256, (c) => { const colors = ['#ff5d73', '#ffd84d', '#59c8ff', '#7be495', '#b06cff', '#ff9a3d', '#e4e6ea', '#2fe0c0']; colors.forEach((color, n) => { c.fillStyle = color; c.beginPath(); c.moveTo(128, 128); c.arc(128, 128, 124, (n / 8) * TAU, ((n + 1) / 8) * TAU); c.fill(); }); c.fillStyle = '#15161c'; c.beginPath(); c.arc(128, 128, 18, 0, TAU); c.fill(); });
    const disc = add(wheel, new THREE.CircleGeometry(1.0, 40), new THREE.MeshStandardMaterial({ map: sectors, roughness: 0.4, side: THREE.DoubleSide }));
    add(wheel, new THREE.TorusGeometry(1.0, 0.07, 8, 40), GOLD);
    add(wheel, new THREE.ConeGeometry(0.12, 0.3, 4), toy('#e02a2a', 0.4), 0, 1.15, 0.05).rotation.x = Math.PI;
    limb(g, V(0.9, 2.0, 0.3), V(1.75, 2.2, 0.45), 0.08, brown);
    return (t) => { head.rotation.y = t * 0.9; disc.rotation.z = -t * 5; body.position.y = Math.sin(t * 2) * 0.04; };
  },

  // 원기옥: 조그만 사람이 제 몸의 몇 배나 되는 빛 구슬을 떠받치고 있다.
  genki(g) {
    const suit = toy('#ff7a45', 0.6);
    const kid = new THREE.Group(); g.add(kid);
    for (const s of [1, -1]) { cyl(kid, 0.14, 0.12, 0.5, suit, s * 0.2, 0.3, 0, 10); limb(kid, V(s * 0.38, 1.05, 0), V(s * 0.6, 1.9, 0), 0.1, SKIN); }
    spun(kid, [[0, 0], [0.42, 0.05], [0.46, 0.4], [0.3, 0.7], [0, 0.72]], suit, 0, 0.5, 0);
    ball(kid, 0.36, SKIN, 0, 1.5, 0);
    eyes(kid, 1.55, 0.3, 0.14, 0.09, { look: [0, 0.7] });
    for (const [x, tilt] of [[-0.15, -0.3], [0, 0], [0.15, 0.3]]) add(kid, new THREE.ConeGeometry(0.1, 0.4, 5), PUPIL, x, 1.9, 0).rotation.z = -tilt;
    const sweat = ball(kid, 0.06, glow('#7fd4ff', 2.2), 0.42, 1.6, 0.1, 1, 1.5, 1);
    const orb = new THREE.Group(); orb.position.y = 4.4; g.add(orb);
    ball(orb, 2.1, additive('#7fd4ff', 0.9, null, 0.35), 0, 0, 0);
    const core = ball(orb, 1.5, glow('#d6f5ff', 2.4), 0, 0, 0);
    const rings = [0, 1, 2].map((n) => { const r = add(orb, new THREE.TorusGeometry(2.3 + n * 0.25, 0.04, 6, 60), glow('#9fe8ff', 2.4)); r.rotation.set(n * 1.1, n * 0.7, 0); return r; });
    const motes = [0, 1, 2, 3, 4, 5].map(() => ball(g, 0.1, glow('#bff1ff', 3), 0, 0, 0));
    return (t) => {
      const beat = 1 + Math.sin(t * 5) * 0.05; core.scale.setScalar(beat); orb.position.y = 4.4 + Math.sin(t * 2) * 0.12;
      rings.forEach((r, n) => { r.rotation.x += 0.02 + n * 0.01; r.rotation.y += 0.015; });
      motes.forEach((m, n) => { const k = (t * 0.6 + n / 6) % 1, a = n * 1.05 + t; m.position.set(Math.cos(a) * 3.2 * (1 - k), 0.3 + k * 4, Math.sin(a) * 3.2 * (1 - k)); });
      kid.position.y = Math.sin(t * 18) * 0.015; const k = (t * 0.9) % 1; sweat.position.y = 1.6 - k * 0.6; sweat.scale.setScalar(1 - k);
    };
  },

  // 물귀신: 속이 비치는 물 덩어리. 두 팔을 뻗어 옆 사람을 붙잡으려 한다.
  ghost(g) {
    const water = new THREE.MeshPhysicalMaterial({ color: C('#4fb8e8'), roughness: 0.05, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.5, depthWrite: false });
    const body = new THREE.Group(); g.add(body);
    cyl(g, 1.7, 1.9, 0.06, water, 0, 0.05, 0, 36);
    spun(body, [[0, 0], [1.1, 0.1], [1.0, 0.9], [0.8, 1.8], [0.5, 2.5], [0.15, 3.0], [0, 3.1]], water, 0, 0.05, 0);
    for (const s of [1, -1]) ball(body, 0.22, PUPIL, s * 0.32, 1.95, 0.72, 0.8, 1.4, 0.5);
    ball(body, 0.2, PUPIL, 0, 1.4, 0.88, 1.4, 0.7, 0.5);
    const arms = [1, -1].map((s) => { const arm = new THREE.Group(); arm.position.set(s * 0.8, 1.6, 0.2); body.add(arm); limb(arm, V(0, 0, 0), V(s * 0.5, 0.2, 0.9), 0.16, water); limb(arm, V(s * 0.5, 0.2, 0.9), V(s * 0.3, 0.5, 1.8), 0.13, water); ball(arm, 0.22, water, s * 0.3, 0.5, 1.85); return arm; });
    const drips = [0, 1, 2].map(() => ball(g, 0.09, glow('#7fd4ff', 1.6), 0, 0, 0, 1, 1.5, 1));
    return (t) => {
      body.scale.set(1 + Math.sin(t * 3) * 0.04, 1 - Math.sin(t * 3) * 0.04, 1 + Math.cos(t * 3) * 0.04); body.rotation.z = Math.sin(t * 1.3) * 0.06;
      arms.forEach((arm, n) => { arm.rotation.x = Math.sin(t * 2.4 + n * 1.5) * 0.35; });
      drips.forEach((d, n) => { const k = (t * 0.8 + n / 3) % 1; d.position.set(Math.sin(n * 2.2) * 0.9, 2.2 - k * 2.1, Math.cos(n * 2.2) * 0.9); d.scale.set(1 - k * 0.5, 1.5, 1 - k * 0.5); });
    };
  },

  // 대박 화물: 금괴를 산더미로 실은 수레. 자물쇠를 물고 지친 눈으로 기어간다.
  jackpot(g) {
    const wood = toy('#7a4a22', 0.7, { clearcoat: 0.2 });
    const body = new THREE.Group(); g.add(body);
    rbox(body, 2.6, 0.5, 4.0, 0.12, wood, 0, 1.0, 0);
    for (const s of [1, -1]) { rbox(body, 0.12, 0.7, 4.0, 0.05, wood, s * 1.3, 1.5, 0); eye(body, s * 0.55, 1.15, 2.02, 0.22, { look: [0, -0.4], lid: 1.3, lidMat: wood }); }
    rbox(body, 2.6, 0.7, 0.12, 0.05, wood, 0, 1.5, -2.0);
    const wheels = [];
    for (const s of [1, -1]) for (const z of [-1.3, 1.3]) { const w = cyl(body, 0.6, 0.6, 0.25, M.black, s * 1.42, 0.6, z, 18); w.rotation.z = Math.PI / 2; wheels.push(w); cyl(body, 0.2, 0.2, 0.28, GOLD, s * 1.42, 0.6, z, 10).rotation.z = Math.PI / 2; }
    const bar = (x, y, z, rot) => { const b = rbox(body, 0.5, 0.3, 1.1, 0.06, M.gold, x, y, z); b.rotation.y = rot; };
    for (let layer = 0; layer < 4; layer++) for (let col = 0; col < 4 - layer; col++) for (const z of [-1.0, 0.25, 1.4 - layer * 0.3]) bar((col - (3 - layer) / 2) * 0.56, 1.42 + layer * 0.31, z - 0.2, (layer % 2) * 0.12);
    rbox(body, 0.6, 0.5, 0.2, 0.08, GOLD, 0, 0.72, 2.08); add(body, new THREE.TorusGeometry(0.2, 0.05, 6, 16, Math.PI), M.light, 0, 0.97, 2.08);
    limb(body, V(-1.2, 1.8, -1.9), V(-1.2, 4.2, -1.9), 0.05, M.light);
    const flag = new THREE.Group(); flag.position.set(-1.2, 3.8, -1.9); body.add(flag);
    add(flag, new THREE.PlaneGeometry(1.2, 0.7), new THREE.MeshStandardMaterial({ map: label('대박', '#b3122b', '#ffe45c'), side: THREE.DoubleSide, roughness: 0.8 }), 0.62, 0, 0);
    const sparkles = [0, 1, 2, 3, 4].map(() => add(g, new THREE.OctahedronGeometry(0.16, 0), glow('#fff4b8', 4)));
    return (t, moving) => {
      body.rotation.z = Math.sin(t * 3) * 0.02; if (moving) for (const w of wheels) w.rotation.x = t * 1.5;
      flag.rotation.y = Math.sin(t * 3) * 0.3;
      sparkles.forEach((s, n) => { const k = Math.abs(Math.sin(t * 2.5 + n * 1.3)); s.position.set(Math.sin(n * 2.4) * 0.9, 2.6 + (n % 3) * 0.45, Math.cos(n * 1.7) * 1.3); s.scale.setScalar(k * 1.4); s.rotation.y = t * 3; });
    };
  },

  // 빙의: 고깔을 쓴 무당. 눈을 뒤집고 방울을 흔들면 혼령의 손이 앞으로 뻗는다.
  possess(g) {
    const robe = toy('#7a2fb8', 0.6), sash = toy('#ffd84d', 0.5), red = toy('#e02a2a', 0.5), white = toy('#d9dde3', 0.7);
    const body = new THREE.Group(); g.add(body);
    spun(body, [[0, 0], [1.0, 0], [0.9, 0.5], [0.7, 1.5], [0.5, 1.95], [0, 2.0]], robe, 0, 0.1, 0);
    add(body, new THREE.TorusGeometry(0.8, 0.09, 8, 32), sash, 0, 1.2, 0).rotation.x = Math.PI / 2;
    ball(body, 0.56, SKIN, 0, 2.65, 0);
    eyes(body, 2.72, 0.48, 0.2, 0.15, { look: [0, 1.3], pupil: 0.3 });
    ball(body, 0.13, PUPIL, 0, 2.42, 0.5, 1, 1.3, 0.5);
    add(body, new THREE.ConeGeometry(0.5, 1.0, 20), white, 0, 3.55, 0);
    for (const s of [1, -1]) limb(body, V(s * 0.45, 3.15, 0.2), V(s * 0.62, 2.5, 0.3), 0.03, red);
    limb(body, V(0.8, 1.9, 0), V(1.25, 2.3, 0.5), 0.13, robe); limb(body, V(-0.8, 1.9, 0), V(-1.2, 2.5, 0.4), 0.13, robe);
    const fan = new THREE.Group(); fan.position.set(1.25, 2.3, 0.5); body.add(fan);
    add(fan, new THREE.CircleGeometry(0.85, 20, 0, Math.PI), new THREE.MeshStandardMaterial({ color: C('#e02a2a'), side: THREE.DoubleSide, roughness: 0.6 }), 0, 0.1, 0);
    add(fan, new THREE.RingGeometry(0.5, 0.62, 20, 1, 0, Math.PI), new THREE.MeshStandardMaterial({ color: C('#ffd84d'), side: THREE.DoubleSide, roughness: 0.6 }), 0, 0.1, 0.01);
    const bells = new THREE.Group(); bells.position.set(-1.2, 2.5, 0.4); body.add(bells);
    limb(bells, V(0, -0.2, 0), V(0, 0.5, 0), 0.04, red);
    for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; ball(bells, 0.11, GOLD, Math.cos(a) * 0.22, 0.6 + (k % 2) * 0.12, Math.sin(a) * 0.22); }
    const hands = [1, -1].map((s) => { const h = new THREE.Group(); g.add(h); const mat = additive('#c79bff', 1.3, null, 0.55); ball(h, 0.28, mat, 0, 0, 0, 1, 0.8, 1.2); for (let k = 0; k < 4; k++) ball(h, 0.09, mat, (k - 1.5) * 0.14, 0.05, 0.36, 1, 1, 2); return { h, s }; });
    return (t) => {
      body.rotation.z = Math.sin(t * 2.4) * 0.08; fan.rotation.z = Math.sin(t * 5) * 0.5; bells.rotation.z = Math.sin(t * 16) * 0.35;
      for (const { h, s } of hands) { const k = (Math.sin(t * 2 + s) + 1) / 2; h.position.set(s * (0.9 + k * 0.3), 1.8 + Math.sin(t * 3 + s) * 0.2, 1.4 + k * 1.4); }
    };
  },

  // 폭탄 돌리기: 뿔 달린 꼬마 도깨비가 심지에 불붙은 폭탄을 머리 위로 들고 낄낄댄다.
  bomber(g) {
    const hide = toy('#d43a3a', 0.55), black = toy('#1a1c22', 0.3, { clearcoat: 1 });
    const body = new THREE.Group(); g.add(body);
    for (const s of [1, -1]) { cyl(body, 0.2, 0.17, 0.6, hide, s * 0.35, 0.4, 0, 12); ball(body, 0.24, PUPIL, s * 0.35, 0.12, 0.12, 1, 0.6, 1.4); limb(body, V(s * 0.7, 1.75, 0), V(s * 0.75, 2.9, 0.1), 0.14, hide); }
    spun(body, [[0, 0], [0.7, 0.05], [0.86, 0.5], [0.8, 1.0], [0.55, 1.3], [0, 1.35]], hide, 0, 0.7, 0);
    cyl(body, 0.8, 0.84, 0.4, toy('#e8b923', 0.7), 0, 0.95, 0, 20);
    const head = new THREE.Group(); head.position.y = 2.5; body.add(head);
    ball(head, 0.66, hide, 0, 0, 0);
    eyes(head, 0.1, 0.56, 0.24, 0.17, { look: [0, 0.4] });
    for (const s of [1, -1]) { add(head, new THREE.ConeGeometry(0.14, 0.5, 8), toy('#f2e6c8', 0.4), s * 0.36, 0.66, 0.1).rotation.z = s * -0.3; box(head, 0.34, 0.08, 0.06, PUPIL, s * 0.26, 0.36, 0.56).rotation.z = s * 0.4; }
    add(head, new THREE.TorusGeometry(0.3, 0.05, 8, 20, Math.PI), PUPIL, 0, -0.1, 0.56).rotation.z = Math.PI;
    box(head, 0.4, 0.1, 0.06, WHITE, 0, -0.18, 0.6);
    const bomb = new THREE.Group(); bomb.position.set(0, 3.75, 0.1); body.add(bomb);
    ball(bomb, 0.8, black, 0, 0, 0); cyl(bomb, 0.14, 0.14, 0.3, M.mid, 0, 0.85, 0, 10);
    limb(bomb, V(0, 1.0, 0), V(0.3, 1.4, 0), 0.03, toy('#c9a66b', 0.9));
    const spark = ball(bomb, 0.16, glow('#ffd27a', 5), 0.3, 1.45, 0);
    return (t, moving) => {
      body.position.y = moving ? Math.abs(Math.sin(t * 9)) * 0.14 : 0; head.rotation.z = Math.sin(t * 6) * 0.1;
      bomb.scale.setScalar(1 + Math.abs(Math.sin(t * 7)) * 0.08); spark.scale.setScalar(0.6 + Math.abs(Math.sin(t * 31)) * 1.1);
    };
  },

  // 대포집: 주황 천막을 친 포장마차. 손님 대신 포신이 나와 있다.
  cannon(g) {
    const tarp = toy('#ff8a2a', 0.8, { clearcoat: 0 }), wood = toy('#8a5a2b', 0.8, { clearcoat: 0.1 });
    const body = new THREE.Group(); g.add(body);
    rbox(body, 2.6, 1.0, 3.0, 0.12, wood, 0, 1.1, 0);
    const wheels = [];
    for (const s of [1, -1]) for (const z of [-0.9, 0.9]) { const w = cyl(body, 0.5, 0.5, 0.25, M.black, s * 1.38, 0.5, z, 18); w.rotation.z = Math.PI / 2; wheels.push(w); }
    for (const x of [-1.2, 1.2]) for (const z of [-1.4, 1.4]) limb(body, V(x, 1.6, z), V(x, 3.3, z), 0.06, wood);
    rbox(body, 3.0, 0.3, 3.4, 0.14, tarp, 0, 3.45, 0);
    for (const z of [-1.7, 1.7]) box(body, 3.0, 0.7, 0.05, tarp, 0, 3.0, z);
    for (const x of [-1.5, 1.5]) box(body, 0.05, 0.7, 3.4, tarp, x, 3.0, 0);
    const barrel = new THREE.Group(); barrel.position.set(0, 2.1, 1.0); body.add(barrel);
    cyl(barrel, 0.34, 0.42, 1.9, M.dark, 0, 0, 0.9, 16).rotation.x = Math.PI / 2;
    add(barrel, new THREE.TorusGeometry(0.36, 0.07, 8, 20), GOLD, 0, 0, 1.8);
    ball(barrel, 0.5, M.dark, 0, 0, 0);
    eyes(body, 1.25, 1.52, 0.6, 0.2, { look: [0, 0.3] });
    ball(body, 0.26, glow('#ffb347', 2.6), 1.1, 2.6, 1.5, 1, 1.3, 1); limb(body, V(1.1, 3.3, 1.5), V(1.1, 2.9, 1.5), 0.02, PUPIL);
    const steam = [0, 1].map(() => ball(g, 0.25, toy('#e4e6ea', 1, { clearcoat: 0, transparent: true, opacity: 0.6 }), 0, 0, 0));
    return (t, moving) => {
      if (moving) for (const w of wheels) w.rotation.x = t * 5;
      body.rotation.z = Math.sin(t * 3) * 0.015; barrel.rotation.x = -0.15 + Math.sin(t * 1.5) * 0.12;
      steam.forEach((puff, n) => { const k = (t * 0.6 + n * 0.5) % 1; puff.position.set(-0.8 + n * 0.5, 3.8 + k * 1.4, -0.6); puff.scale.setScalar(0.6 + k); puff.material.opacity = 0.6 * (1 - k); });
    };
  },

  // 제비뽑기: 동그란 안경을 낀 점쟁이가 산통을 흔든다. 통에서 막대 하나가 삐죽 올라와 있다.
  draw(g) {
    const robe = toy('#2fb8a8', 0.6), wood = toy('#b98a4e', 0.6);
    const body = new THREE.Group(); g.add(body);
    spun(body, [[0, 0], [0.95, 0], [0.85, 0.5], [0.66, 1.4], [0.48, 1.8], [0, 1.85]], robe, 0, 0.1, 0);
    const head = new THREE.Group(); head.position.y = 2.45; body.add(head);
    ball(head, 0.58, SKIN, 0, 0, 0);
    eyes(head, 0.08, 0.5, 0.22, 0.12, {});
    for (const s of [1, -1]) add(head, new THREE.TorusGeometry(0.2, 0.03, 6, 20), GOLD, s * 0.22, 0.08, 0.56);
    box(head, 0.1, 0.03, 0.03, GOLD, 0, 0.08, 0.58);
    add(head, new THREE.TorusGeometry(0.14, 0.03, 6, 12, Math.PI), PUPIL, 0, -0.24, 0.5).rotation.z = Math.PI;
    add(head, new THREE.ConeGeometry(0.24, 0.7, 10), toy('#d9dde3', 0.8), 0, -0.6, 0.3).rotation.x = Math.PI;
    cyl(head, 0.62, 0.62, 0.06, PUPIL, 0, 0.5, 0, 24); cyl(head, 0.36, 0.4, 0.4, PUPIL, 0, 0.72, 0, 16);
    for (const s of [1, -1]) limb(body, V(s * 0.78, 1.7, 0), V(s * 0.45, 1.35, 0.8), 0.13, robe);
    const jar = new THREE.Group(); jar.position.set(0, 1.3, 0.95); body.add(jar);
    cyl(jar, 0.36, 0.3, 0.8, wood, 0, 0, 0, 8);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; limb(jar, V(Math.cos(a) * 0.16, 0.2, Math.sin(a) * 0.16), V(Math.cos(a) * 0.24, 0.85, Math.sin(a) * 0.24), 0.03, toy('#e8d6a8', 0.7)); }
    const lucky = new THREE.Group(); jar.add(lucky);
    limb(lucky, V(0, 0.2, 0), V(0, 1.2, 0), 0.035, toy('#e8d6a8', 0.7)); ball(lucky, 0.07, toy('#e02a2a', 0.4), 0, 1.22, 0);
    return (t, moving) => {
      body.position.y = moving ? Math.abs(Math.sin(t * 8)) * 0.1 : 0; jar.rotation.z = Math.sin(t * 14) * 0.18; jar.position.y = 1.3 + Math.abs(Math.sin(t * 7)) * 0.15;
      lucky.position.y = Math.max(0, Math.sin(t * 1.4)) * 0.4; head.rotation.z = Math.sin(t * 1.4) * 0.08;
    };
  },

  // 집에 갈래: 가방끈이 집에 묶인 아이. 울면서 버둥대도 고무줄이 뒤로 잡아당긴다.
  homesick(g) {
    const shirt = toy('#ffd84d', 0.7), bag = toy('#e02a2a', 0.5), roof = toy('#b3202a', 0.6), wall = toy('#d9c7a0', 0.8, { clearcoat: 0 });
    const kid = new THREE.Group(); kid.position.z = 1.2; g.add(kid);
    for (const s of [1, -1]) { cyl(kid, 0.14, 0.12, 0.5, toy('#2f5fb8', 0.7), s * 0.2, 0.3, 0, 10); limb(kid, V(s * 0.42, 1.2, 0), V(s * 0.7, 1.5, 0.5), 0.1, SKIN); }
    spun(kid, [[0, 0], [0.45, 0.05], [0.5, 0.4], [0.34, 0.8], [0, 0.82]], shirt, 0, 0.5, 0);
    const head = new THREE.Group(); head.position.y = 1.75; kid.add(head);
    ball(head, 0.46, SKIN, 0, 0, 0);
    eyes(head, 0.04, 0.4, 0.18, 0.11, { look: [0, 0.4] });
    ball(head, 0.12, PUPIL, 0, -0.2, 0.4, 1.2, 1, 0.5);
    ball(head, 0.47, toy('#3a2a1a', 0.8), 0, 0.12, -0.06, 1, 0.8, 1);
    const tears = [1, -1].map((s) => ball(head, 0.06, glow('#7fd4ff', 2.4), s * 0.22, -0.1, 0.42, 1, 1.6, 1));
    rbox(kid, 0.7, 0.8, 0.4, 0.14, bag, 0, 1.0, -0.5);
    const house = new THREE.Group(); house.position.z = -2.4; g.add(house);
    rbox(house, 1.5, 1.1, 1.3, 0.08, wall, 0, 0.6, 0);
    const top = add(house, new THREE.ConeGeometry(1.25, 0.8, 4), roof, 0, 1.55, 0); top.rotation.y = Math.PI / 4;
    box(house, 0.36, 0.6, 0.04, toy('#6b4a2a', 0.8), 0, 0.42, 0.67); box(house, 0.3, 0.3, 0.04, glow('#ffe9a8', 1.8), 0.45, 0.8, 0.67);
    const cord = add(g, new THREE.CylinderGeometry(0.05, 0.05, 1, 6), toy('#15161c', 0.6), 0, 1.0, -0.6); cord.rotation.x = Math.PI / 2;
    return (t, moving) => {
      const pull = Math.sin(t * 7) * 0.25; kid.position.z = 1.2 + pull; kid.rotation.x = 0.25 + pull * 0.4;
      const from = kid.position.z - 0.6, to = -1.75; cord.position.z = (from + to) / 2; cord.scale.y = from - to; cord.scale.x = cord.scale.z = 1.4 - (from - to) * 0.22;
      tears.forEach((drop, n) => { const k = (t * 1.1 + n * 0.5) % 1; drop.position.y = -0.1 - k * 0.5; drop.scale.set(1 - k, 1.6 * (1 - k), 1 - k); });
      house.rotation.z = Math.sin(t * 7) * 0.03;
    };
  },

  // 멍멍이: 목줄을 끌고 나온 개. 혀를 내밀고 제멋대로 두리번거린다.
  dog(g) {
    const fur = toy('#d9a05a', 0.85, { clearcoat: 0 }), cream = toy('#ead9b8', 0.85, { clearcoat: 0 });
    const body = new THREE.Group(); body.position.y = 0.9; g.add(body);
    ball(body, 0.7, fur, 0, 0.2, 0, 0.9, 0.85, 1.5); ball(body, 0.5, cream, 0, 0.0, 0.2, 0.8, 0.6, 1.2);
    const legs = [[0.36, 0.65], [-0.36, 0.65], [0.36, -0.7], [-0.36, -0.7]].map(([x, z]) => { const leg = new THREE.Group(); leg.position.set(x, -0.1, z); body.add(leg); cyl(leg, 0.13, 0.11, 0.8, fur, 0, -0.4, 0, 10); ball(leg, 0.15, cream, 0, -0.8, 0.05, 1, 0.6, 1.3); return leg; });
    const head = new THREE.Group(); head.position.set(0, 0.85, 1.05); body.add(head);
    ball(head, 0.52, fur, 0, 0, 0); ball(head, 0.3, cream, 0, -0.14, 0.38, 1, 0.8, 1.1); ball(head, 0.1, PUPIL, 0, -0.06, 0.68);
    eyes(head, 0.12, 0.42, 0.2, 0.11, {});
    for (const s of [1, -1]) add(head, new THREE.ConeGeometry(0.18, 0.4, 4), fur, s * 0.32, 0.48, -0.05).rotation.z = s * -0.3;
    const tongue = ball(head, 0.1, toy('#ff7a9c', 0.4), 0.05, -0.36, 0.5, 0.8, 1.6, 0.5);
    add(body, new THREE.TorusGeometry(0.42, 0.07, 8, 20), toy('#e02a2a', 0.5), 0, 0.62, 0.72).rotation.x = Math.PI / 2 - 0.5;
    const tail = new THREE.Group(); tail.position.set(0, 0.6, -1.0); body.add(tail);
    add(tail, new THREE.TorusGeometry(0.26, 0.09, 8, 16, Math.PI * 1.3), fur, 0, 0.26, 0).rotation.y = Math.PI / 2;
    limb(g, V(0, 1.45, 0.6), V(0.5, 0.08, -1.6), 0.03, toy('#e02a2a', 0.5)); limb(g, V(0.5, 0.08, -1.6), V(0.2, 0.08, -2.6), 0.03, toy('#e02a2a', 0.5));
    return (t, moving) => {
      legs.forEach((leg, n) => { leg.rotation.x = moving ? Math.sin(t * 12 + (n % 3 ? Math.PI : 0)) * 0.6 : 0; });
      head.rotation.y = Math.sin(t * 1.7) * 0.5; head.rotation.z = Math.sin(t * 0.9) * 0.2; tail.rotation.z = Math.sin(t * 14) * 0.6;
      tongue.scale.y = 1.6 + Math.sin(t * 9) * 0.4; body.position.y = 0.9 + (moving ? Math.abs(Math.sin(t * 12)) * 0.08 : 0);
    };
  },

  // 돼지 저금통: 등에 동전 구멍이 난 분홍 돼지. 단단하고 느리고 아무것도 못 한다.
  piggy(g) {
    const pink = toy('#ff9ec4', 0.25, { clearcoat: 1, clearcoatRoughness: 0.1 }), deep = toy('#e86a9a', 0.4);
    const body = new THREE.Group(); body.position.y = 1.35; g.add(body);
    ball(body, 1.15, pink, 0, 0, 0, 1, 0.9, 1.25);
    for (const [x, z] of [[0.55, 0.7], [-0.55, 0.7], [0.55, -0.7], [-0.55, -0.7]]) cyl(body, 0.24, 0.2, 0.5, pink, x, -1.0, z, 12);
    cyl(body, 0.42, 0.42, 0.3, deep, 0, -0.05, 1.42, 20).rotation.x = Math.PI / 2;
    for (const s of [1, -1]) { ball(body, 0.08, PUPIL, s * 0.14, -0.05, 1.58); add(body, new THREE.ConeGeometry(0.26, 0.45, 4), deep, s * 0.5, 0.92, 0.75).rotation.z = s * -0.4; }
    eyes(body, 0.38, 1.18, 0.4, 0.15, {});
    box(body, 0.7, 0.05, 0.14, PUPIL, 0, 1.03, 0);
    const coin = cyl(body, 0.3, 0.3, 0.06, GOLD, 0, 1.2, 0, 20); coin.rotation.z = Math.PI / 2;
    add(body, new THREE.TorusGeometry(0.18, 0.05, 6, 14, Math.PI * 1.6), pink, 0, 0.25, -1.5).rotation.y = Math.PI / 2;
    const crack = [[-0.2, 0.5, 0.3], [0.1, 0.3, -0.5], [0.3, 0.6, 0.2]].map(([x, y, rz]) => { const c = box(body, 0.5, 0.04, 0.04, PUPIL, 0.98 + x * 0.1, y, x); c.rotation.set(0, 0.5, rz); c.visible = false; return c; });
    return (t, moving, unit) => {
      body.rotation.z = Math.sin(t * (moving ? 8 : 2)) * 0.05; coin.position.y = 1.15 + Math.abs(Math.sin(t * 2.5)) * 0.25; coin.rotation.y = t * 3;
      const hits = unit ? unit.smash || 0 : 0; crack.forEach((c, n) => { c.visible = hits > (n + 1) * 8; });
      if (hits) body.position.x = Math.sin(t * 40) * Math.min(0.08, hits * 0.003);
    };
  },

  // 속았지: 등에 "가속" 로켓을 멘 타조. 능력을 쓰면 머리를 땅에 박는다.
  liar(g) {
    const feather = toy('#2a2c36', 0.8, { clearcoat: 0 }), neckSkin = toy('#e8a58a', 0.6), red = toy('#e02a2a', 0.35);
    const body = new THREE.Group(); body.position.y = 2.3; g.add(body);
    ball(body, 0.95, feather, 0, 0, 0, 0.9, 0.85, 1.25);
    for (let k = 0; k < 4; k++) ball(body, 0.4, toy('#e4e6ea', 0.8, { clearcoat: 0 }), (k - 1.5) * 0.3, 0.2 + (k % 2) * 0.15, -1.15, 0.7, 1, 1);
    const legs = [1, -1].map((s) => { const leg = new THREE.Group(); leg.position.set(s * 0.35, -0.5, 0); body.add(leg); limb(leg, V(0, 0, 0), V(0, -0.9, 0.25), 0.08, neckSkin); limb(leg, V(0, -0.9, 0.25), V(0, -1.75, 0), 0.07, neckSkin); ball(leg, 0.16, neckSkin, 0, -1.76, 0.14, 1.2, 0.5, 1.8); return leg; });
    const neck = new THREE.Group(); neck.position.set(0, 0.35, 0.95); body.add(neck);
    limb(neck, V(0, 0, 0), V(0, 1.7, 0.25), 0.11, neckSkin);
    const head = new THREE.Group(); head.position.set(0, 1.85, 0.3); neck.add(head);
    ball(head, 0.32, feather, 0, 0, 0); eyes(head, 0.08, 0.2, 0.2, 0.15, { look: [0, 0.2] });
    add(head, new THREE.ConeGeometry(0.14, 0.5, 8), toy('#ff9a3d', 0.5), 0, -0.08, 0.5).rotation.x = Math.PI / 2;
    const rocket = new THREE.Group(); rocket.position.set(0, 0.95, -0.25); body.add(rocket);
    const tube = cyl(rocket, 0.34, 0.34, 1.8, red, 0, 0, 0, 16); tube.rotation.x = Math.PI / 2;
    add(rocket, new THREE.ConeGeometry(0.34, 0.6, 16), WHITE, 0, 0, 1.2).rotation.x = Math.PI / 2;
    for (const s of [1, -1]) box(rocket, 0.05, 0.6, 0.5, WHITE, s * 0.36, 0, -0.8);
    add(rocket, new THREE.PlaneGeometry(0.9, 0.34), new THREE.MeshBasicMaterial({ map: label('가속', '#ffffff', '#e02a2a', 128, 48, 36) }), 0.345, 0, 0.1).rotation.y = Math.PI / 2;
    add(rocket, new THREE.PlaneGeometry(0.9, 0.34), new THREE.MeshBasicMaterial({ map: label('가속', '#ffffff', '#e02a2a', 128, 48, 36) }), -0.345, 0, 0.1).rotation.y = -Math.PI / 2;
    const flame = add(rocket, new THREE.ConeGeometry(0.22, 0.7, 10), glow('#ffb347', 3), 0, 0, -1.25); flame.rotation.x = -Math.PI / 2;
    const dirt = [0, 1, 2].map(() => ball(g, 0.2, toy('#6b4a2a', 0.95, { clearcoat: 0 }), 0, 0, 0));
    return (t, moving, unit) => {
      const buried = !!unit && unit.burrowUntil > t - unit.phase;
      neck.rotation.x = buried ? 2.05 : Math.sin(t * 2) * 0.1;
      legs.forEach((leg, n) => { leg.rotation.x = moving && !buried ? Math.sin(t * 11 + n * Math.PI) * 0.7 : 0; });
      body.position.y = 2.3 + (moving && !buried ? Math.abs(Math.sin(t * 11)) * 0.12 : 0); body.rotation.x = buried ? 0.25 : 0;
      flame.scale.setScalar(buried ? 0.01 : 0.5 + Math.abs(Math.sin(t * 23)) * 0.4);
      dirt.forEach((clod, n) => { clod.visible = buried; const k = (t * 1.6 + n / 3) % 1; clod.position.set(Math.sin(n * 2.3) * 0.6, k * (1 - k) * 4, 2.2 + Math.cos(n * 2.3) * 0.5); });
    };
  },

  // 곰팡이: 포자를 날리는 솜털 덩어리. 남이 지은 건물을 찾아 슬금슬금 기어간다.
  mold(g) {
    const fuzz = toy('#7fbf4a', 0.95, { clearcoat: 0 }), dark = toy('#4f8a2e', 0.95, { clearcoat: 0 });
    const body = new THREE.Group(); body.position.y = 1.1; g.add(body);
    ball(body, 1.05, fuzz, 0, 0, 0, 1.1, 0.85, 1.1);
    const src = new THREE.IcosahedronGeometry(1, 1).attributes.position, seen = new Set();
    for (let k = 0; k < src.count; k++) {
      const v = new THREE.Vector3().fromBufferAttribute(src, k).normalize(), key = v.toArray().map((n) => n.toFixed(2)).join();
      if (seen.has(key) || (v.z > 0.55 && Math.abs(v.y) < 0.5)) continue; seen.add(key);
      ball(body, 0.22 + (seen.size % 3) * 0.06, seen.size % 2 ? dark : fuzz, v.x * 1.12, v.y * 0.9, v.z * 1.12);
    }
    eyes(body, 0.18, 0.98, 0.34, 0.2, { look: [0.3, -0.2], lid: 1.0, lidMat: fuzz });
    add(body, new THREE.TorusGeometry(0.14, 0.03, 6, 12, Math.PI), PUPIL, 0, -0.22, 1.08).rotation.z = Math.PI;
    const spores = [0, 1, 2, 3, 4].map(() => ball(g, 0.07, glow('#c9f08a', 2), 0, 0, 0));
    return (t, moving) => {
      const squish = Math.sin(t * (moving ? 7 : 2)) * 0.06; body.scale.set(1 + squish, 1 - squish, 1 + squish);
      spores.forEach((s, n) => { const k = (t * 0.3 + n / 5) % 1; s.position.set(Math.sin(n * 2.1 + t) * (0.6 + k), 1.8 + k * 2.2, Math.cos(n * 1.7 + t * 0.7) * (0.6 + k)); s.scale.setScalar(1 - k * 0.6); });
    };
  },

  // 걸어 다니는 건물: 곰팡이가 핀 가건물에 닭다리가 돋아 뒤뚱뒤뚱 걷는다. 천막 틈으로 눈이 보인다.
  moldhouse(g) {
    const tarp = toy('#c9722a', 0.85, { clearcoat: 0 }), pole = toy('#9aa3b2', 0.4), fuzz = toy('#7fbf4a', 0.95, { clearcoat: 0 }), shin = toy('#e8b05a', 0.6);
    const legs = [1, -1].map((s) => { const leg = new THREE.Group(); leg.position.set(s * 0.8, 1.9, 0); g.add(leg); limb(leg, V(0, 0, 0), V(0, -0.9, 0.3), 0.14, shin); limb(leg, V(0, -0.9, 0.3), V(0, -1.8, 0), 0.12, shin); for (const dx of [-0.25, 0, 0.25]) limb(leg, V(0, -1.8, 0), V(dx, -1.85, 0.5), 0.06, shin); return leg; });
    const house = new THREE.Group(); house.position.y = 1.9; g.add(house);
    rbox(house, 2.9, 3.0, 1.9, 0.15, tarp, 0, 1.5, 0); box(house, 2.95, 0.3, 1.95, M.hazard, 0, 0.3, 0);
    for (const x of [-1.5, 1.5]) for (const z of [-1.0, 1.0]) limb(house, V(x, 0, z), V(x, 3.3, z), 0.07, pole);
    for (const [x, y, z, r] of [[-0.9, 2.9, 0.6, 0.5], [0.8, 3.1, -0.3, 0.6], [0.2, 3.0, 0.7, 0.4], [1.3, 1.6, 0.9, 0.35], [-1.3, 1.0, 0.95, 0.4], [-0.3, 0.9, 0.98, 0.3]]) ball(house, r, fuzz, x, y, z, 1, 0.7, 1);
    box(house, 1.3, 0.5, 0.04, PUPIL, 0, 1.9, 0.97);
    eyes(house, 1.9, 0.98, 0.32, 0.17, { look: [0.4, 0] });
    return (t, moving) => {
      legs.forEach((leg, n) => { leg.rotation.x = moving ? Math.sin(t * 7 + n * Math.PI) * 0.6 : 0; });
      house.rotation.z = moving ? Math.sin(t * 7) * 0.07 : Math.sin(t * 2) * 0.02; house.position.y = 1.9 + (moving ? Math.abs(Math.sin(t * 7)) * 0.15 : 0);
    };
  },

  // 분신술: 검은 옷에 빨간 목도리를 날리는 닌자. 손가락을 모으고 있다.
  ninja(g) {
    const cloth = toy('#1c1e28', 0.75, { clearcoat: 0 }), red = toy('#e02a2a', 0.6);
    const body = new THREE.Group(); g.add(body);
    for (const s of [1, -1]) { cyl(body, 0.2, 0.17, 0.75, cloth, s * 0.32, 0.5, 0, 12); ball(body, 0.2, cloth, s * 0.32, 0.12, 0.12, 1, 0.6, 1.5); limb(body, V(s * 0.72, 1.9, 0), V(s * 0.12, 1.75, 0.75), 0.13, cloth); }
    spun(body, [[0, 0], [0.68, 0.05], [0.8, 0.5], [0.72, 1.05], [0.5, 1.3], [0, 1.35]], cloth, 0, 0.85, 0);
    add(body, new THREE.TorusGeometry(0.7, 0.09, 8, 28), red, 0, 1.25, 0).rotation.x = Math.PI / 2;
    ball(body, 0.2, SKIN, 0, 1.78, 0.82, 1, 1.4, 1);
    const head = new THREE.Group(); head.position.y = 2.7; body.add(head);
    ball(head, 0.6, cloth, 0, 0, 0);
    ball(head, 0.52, SKIN, 0, 0.06, 0.16, 1, 0.34, 1);
    eyes(head, 0.07, 0.6, 0.2, 0.1, { lid: 0.9, lidMat: cloth, lidTilt: 0.3 });
    add(head, new THREE.TorusGeometry(0.5, 0.12, 8, 24), red, 0, -0.5, 0).rotation.x = Math.PI / 2;
    const scarf = [0, 1].map((n) => { const s = new THREE.Group(); s.position.set(0.2 - n * 0.4, 2.2, -0.45); body.add(s); rbox(s, 0.26, 0.08, 1.5, 0.04, red, 0, 0, -0.75); return s; });
    const smoke = [0, 1, 2].map(() => ball(g, 0.4, toy('#c7ccd6', 1, { clearcoat: 0, transparent: true, opacity: 0.5 }), 0, 0, 0));
    return (t, moving) => {
      body.position.y = moving ? Math.abs(Math.sin(t * 12)) * 0.1 : 0; body.rotation.x = moving ? 0.25 : 0;
      scarf.forEach((s, n) => { s.rotation.x = 0.3 + Math.sin(t * 6 + n) * 0.25; s.rotation.y = Math.sin(t * 4 + n * 2) * 0.3; });
      smoke.forEach((puff, n) => { const k = (t * 0.5 + n / 3) % 1; puff.position.set(Math.sin(n * 2.2) * 0.9, 0.3 + k * 1.2, Math.cos(n * 2.2) * 0.9); puff.scale.setScalar(0.5 + k); puff.material.opacity = 0.45 * (1 - k); });
    };
  },
};

// 캐릭터 정보. hp는 체력(Infinity는 무적), atk는 한 대의 피해(0이면 공격 못 함), rate는 공격 간격(초)이다.

export function makeCharacter(id) {
  const g = new THREE.Group();
  g.userData.animate = MODELS[id](g);
  return g;
}
