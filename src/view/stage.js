// 움직이는 것들의 모습: 선수, 설치물, 효과, 전광판, 도감 무대.
// 계산(sim)의 상태를 읽어 장면에 옮기기만 한다. 규칙은 여기서 바꾸지 않는다.
import { C, FONT_KR, FONT_NUM, GOLD, PUPIL, TAU, UP, V, add, additive, ball, box, canvasTexture, cyl, glow, label, limb, rbox, toy } from './tools.js';
import { M, camera, energyMaterial, flicker, scene, spinners } from './world.js';
import { makeCharacter } from './models.js';
import { TOTAL, TRACK_Y, locate } from '../sim/track.js';
import { ATTACKS, ATTACK_OF, INFO, ROWS } from '../sim/characters.js';
import { BODY, FREEZE_RADIUS } from '../sim/game.js';

// ---------- 도감 무대 ----------
// 갑판 남쪽에 뜬 무대. 캐릭터들이 네 줄로 받침대 위에 선다. 모델은 도감을 열 때 처음 만든다.
export const POD_Z = 112;
export const lineup = [];
{
  rbox(scene, 86, 1.4, 50, 0.5, M.dark, 0, -0.7, POD_Z);
  box(scene, 86.4, 0.2, 50.4, glow('#3fb6ff', 1.6), 0, -1.0, POD_Z);
  box(scene, 4, 0.5, 17, M.dark, 24, -0.25, 79.5);
  for (const x of [22.1, 25.9]) box(scene, 0.15, 0.1, 17, glow('#3fb6ff', 2), x, 0.02, 79.5);
  ROWS.forEach((row, r) => row.forEach((id, n) => {
    const x = (n - (row.length - 1) / 2) * 9, z = POD_Z + (r - 1.5) * 12, info = INFO[id];
    cyl(scene, 3.0, 3.3, 0.5, M.mid, x, 0.25, z, 40);
    add(scene, new THREE.TorusGeometry(3.05, 0.09, 8, 48), glow(info.color, 2.6), x, 0.5, z).rotation.x = Math.PI / 2;
    const plate = add(scene, new THREE.PlaneGeometry(4.6, 1.0), new THREE.MeshBasicMaterial({ map: label(info.name, '#ffffff', '#0a1220', 512, 112, info.name.length > 5 ? 58 : 72) }), x, 0.42, z + 3.75); plate.rotation.x = -0.9;
    lineup.push({ id, figure: null, x, z });
  }));
  for (const [x, color, k] of [[-22, '#ffe8c8', 0.8], [22, '#cfe0ff', 0.65]]) { const lamp = new THREE.PointLight(C(color), k, 110, 1.2); lamp.position.set(x, 18, POD_Z + 32); scene.add(lamp); }
}
// 한 명을 볼 때는 앞줄에 가리지 않도록 나머지를 숨긴다. staged가 거짓이면 모두 치운다.
export function stageLineup(staged, only) {
  for (const entry of lineup) {
    if (staged && !entry.figure) {
      entry.figure = makeCharacter(entry.id); entry.figure.position.set(entry.x, 0.5, entry.z);
      entry.figure.traverse((part) => { part.castShadow = false; });
      scene.add(entry.figure);
    }
    if (entry.figure) { entry.figure.visible = staged && (!only || entry === only); entry.figure.rotation.y = 0; }
  }
}

// ---------- 전광판 ----------
const boardCanvas = document.createElement('canvas'); boardCanvas.width = 1024; boardCanvas.height = 400;
const boardTexture = new THREE.CanvasTexture(boardCanvas); boardTexture.encoding = THREE.sRGBEncoding;
{
  const frame = new THREE.Group(); frame.position.set(0, 0, -68.6); scene.add(frame);
  for (const x of [-10, 10]) box(frame, 1, 12, 1, M.dark, x, 6, 0);
  box(frame, 23, 9.6, 0.6, M.black, 0, 10.6, -0.2);
  add(frame, new THREE.PlaneGeometry(22, 8.6), new THREE.MeshBasicMaterial({ map: boardTexture }), 0, 10.6, 0.14);
  box(frame, 23.4, 0.2, 0.8, glow('#59c8ff', 2.4), 0, 15.5, -0.2);
}
// ranked: 순위대로 줄 세운 선수들. 화면 구석의 점수판과 같은 내용을 갑판의 전광판에도 그린다.
export function drawBoard(ranked, goal) {
  const g = boardCanvas.getContext('2d');
  g.fillStyle = '#050a14'; g.fillRect(0, 0, 1024, 400);
  g.fillStyle = '#59c8ff'; g.font = `700 40px ${FONT_NUM}`; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText('SCORE  /  ' + goal, 36, 44);
  g.fillRect(36, 74, 952, 3);
  ranked.forEach((u, n) => {
    const x = n < 4 ? 36 : 530, y = 122 + (n % 4) * 68;
    g.fillStyle = u.player.color; g.fillRect(x, y - 20, 22, 40);
    g.fillStyle = u.human ? '#5ad1ff' : '#eaf2ff'; g.font = `600 38px ${FONT_KR}`; g.textAlign = 'left'; g.fillText(u.player.name, x + 40, y + 2);
    g.font = `700 40px ${FONT_NUM}`; g.textAlign = 'right'; if (u.rank) g.fillStyle = '#ffd84d'; g.fillText(u.rank ? u.rank + '등' : String(u.score), x + 450, y + 2);
  });
  boardTexture.needsUpdate = true;
}

// ---------- 선수와 설치물 ----------
// myIndex: 이 화면의 주인이 모는 자리. 그 자리만 표시가 다르다.
export function createStage(game, myIndex) {
  const at = {}, at2 = {};
  // 순환 트랙에서 두 거리의 차이를 가까운 쪽으로 잰다.
  const shortest = (ds) => (ds > TOTAL / 2 ? ds - TOTAL : ds < -TOTAL / 2 ? ds + TOTAL : ds);
  const darkBar = () => new THREE.MeshBasicMaterial({ color: C('#0a1220'), transparent: true, opacity: 0.8, depthTest: false });

  // 구간마다, 그리고 죽을 때마다 캐릭터가 바뀌므로 모델을 빌려 쓰고 돌려준다.
  const spare = {};
  const borrow = (id) => (spare[id] && spare[id].pop()) || makeCharacter(id);
  const giveBack = (id, figure) => { (spare[id] = spare[id] || []).push(figure); };

  const iceBlock = new THREE.MeshPhysicalMaterial({ color: C('#bfeaff'), roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.55, depthWrite: false });
  const ticketLabel = label('딱지', '#15161c', '#ffe066', 128, 64, 44);
  const views = game.units.map((unit) => {
    const group = new THREE.Group(), you = unit.index === myIndex, color = unit.player.color;
    const ring = add(group, new THREE.RingGeometry(you ? 2.5 : 2.6, you ? 3.2 : 2.95, 40), additive(color, you ? 3 : 2.2, null, 0.95), 0, 0.08, 0); ring.rotation.x = -Math.PI / 2;
    const marker = add(group, you ? new THREE.ConeGeometry(0.7, 1.3, 4) : new THREE.OctahedronGeometry(0.5, 0), glow(color, 3.4), 0, 6, 0);
    if (you) marker.rotation.x = Math.PI;
    const ice = add(group, new THREE.IcosahedronGeometry(3.0, 1), iceBlock, 0, 2.2, 0); ice.castShadow = false; ice.visible = false;
    // 체력 막대와 딱지는 늘 카메라를 본다.
    const bar = new THREE.Group(); group.add(bar);
    add(bar, new THREE.PlaneGeometry(2.7, 0.36), darkBar());
    const fill = add(bar, new THREE.PlaneGeometry(2.5, 0.2), glow(you ? '#5ad1ff' : '#7be495', 1.5, { depthTest: false }), 0, 0, 0.01);
    const ticket = add(bar, new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshBasicMaterial({ map: ticketLabel, depthTest: false }), 0, -1.0, 0.02); ticket.visible = false;
    scene.add(group);
    return { group, marker, ice, bar, fill, ticket, figure: null, id: null, face: null, aimYaw: 0 };
  });

  // 협곡 차단벽: 기둥 사이를 막는 셔터. 맵의 문이라는 것이 한눈에 보이도록 경고 줄무늬와 경광등을 달았다.
  const gate = { group: new THREE.Group(), shutter: new THREE.Group(), bar: new THREE.Group(), fill: null, lamps: [] };
  {
    locate(game.barrier.s, 0, at);
    gate.group.position.set(at.x, TRACK_Y, at.z); gate.group.rotation.y = Math.atan2(at.tx, at.tz); scene.add(gate.group);
    for (const side of [1, -1]) {
      box(gate.group, 1.0, 5.2, 1.4, M.dark, side * 4.15, 2.6, 0); box(gate.group, 1.2, 0.4, 1.6, M.mid, side * 4.15, 0.2, 0);
      box(gate.group, 0.16, 4.4, 1.44, glow('#ff8a2a', 2.2), side * 3.62, 2.6, 0);
      gate.lamps.push(ball(gate.group, 0.28, glow('#ff3b3b', 4), side * 4.15, 5.5, 0));
    }
    box(gate.group, 9.3, 0.7, 1.4, M.dark, 0, 5.0, 0);
    gate.group.add(gate.shutter);
    for (const x of [-2.36, 0, 2.36]) {
      box(gate.shutter, 2.28, 3.9, 0.5, M.mid, x, 2.25, 0); box(gate.shutter, 2.3, 0.7, 0.56, M.hazard, x, 3.3, 0); box(gate.shutter, 2.3, 0.7, 0.56, M.hazard, x, 1.0, 0);
      box(gate.shutter, 1.5, 0.16, 0.58, glow('#ff8a2a', 1.8), x, 2.15, 0);
    }
    gate.bar.position.set(at.x, 7.2, at.z); scene.add(gate.bar);
    add(gate.bar, new THREE.PlaneGeometry(4.2, 0.5), darkBar());
    gate.fill = add(gate.bar, new THREE.PlaneGeometry(4, 0.3), glow('#ffb347', 1.6, { depthTest: false }), 0, 0, 0.01);
  }
  // 수정 벽.
  const crystalMat = new THREE.MeshPhysicalMaterial({ color: C('#7fc4ff'), roughness: 0.12, clearcoat: 1, emissive: C('#2a6fd0'), emissiveIntensity: 0.9 });
  const crystalViews = game.crystals.map((crystal, n) => {
    const mesh = new THREE.Group(); scene.add(mesh);
    for (const [x, z, h, tilt] of [[0, 0, 1.9, 0], [0.75, 0.3, 1.25, 0.35], [-0.7, -0.25, 1.4, -0.3]]) { const shard = add(mesh, new THREE.OctahedronGeometry(1, 0), crystalMat, x, h * 0.92, z); shard.scale.set(0.62, h, 0.62); shard.rotation.set(tilt * 0.6, n * 1.3 + x, tilt); }
    locate(crystal.s, crystal.lane, at);
    mesh.position.set(at.x, TRACK_Y, at.z); mesh.rotation.y = n * 0.9;
    return mesh;
  });
  // 가건물.
  const siteViews = game.sites.map(() => {
    const mesh = new THREE.Group(); mesh.visible = false; scene.add(mesh);
    const pole = toy('#c9ced8', 0.4), tarp = toy('#ff8a2a', 0.8, { clearcoat: 0 });
    for (const x of [-1.5, 1.5]) for (const z of [-0.9, 0.9]) limb(mesh, V(x, 0, z), V(x, 4, z), 0.08, pole);
    for (const y of [1.3, 2.7, 4]) { box(mesh, 3.2, 0.1, 0.1, pole, 0, y, 0.9); box(mesh, 3.2, 0.1, 0.1, pole, 0, y, -0.9); box(mesh, 0.1, 0.1, 1.9, pole, -1.5, y, 0); box(mesh, 0.1, 0.1, 1.9, pole, 1.5, y, 0); }
    rbox(mesh, 2.7, 3.4, 1.5, 0.15, tarp, 0, 1.8, 0); box(mesh, 2.75, 0.3, 1.55, M.hazard, 0, 0.5, 0);
    const bar = new THREE.Group(); bar.position.y = 5; mesh.add(bar);
    add(bar, new THREE.PlaneGeometry(3.4, 0.5), darkBar());
    const fill = add(bar, new THREE.PlaneGeometry(3.2, 0.3), glow('#ffd84d', 1.8, { depthTest: false }), 0, 0, 0.01);
    return { mesh, bar, fill };
  });
  // 점액 자국.
  const slimeViews = game.slimes.map(() => {
    const mesh = add(scene, new THREE.CircleGeometry(1.5, 20), new THREE.MeshBasicMaterial({ color: C('#b7e05a'), transparent: true, opacity: 0.55, depthWrite: false }), 0, TRACK_Y + 0.03, 0);
    mesh.rotation.x = -Math.PI / 2; mesh.visible = false;
    return mesh;
  });
  // 병아리.
  const chickViews = game.chicks.map(() => {
    const mesh = new THREE.Group(); mesh.visible = false; scene.add(mesh);
    const yellow = toy('#ffd84d', 0.6);
    ball(mesh, 0.5, yellow, 0, 0.55, 0); ball(mesh, 0.34, yellow, 0, 1.1, 0.2);
    add(mesh, new THREE.ConeGeometry(0.1, 0.22, 6), toy('#ff9a3d', 0.5), 0, 1.08, 0.58).rotation.x = Math.PI / 2;
    for (const s of [1, -1]) ball(mesh, 0.06, PUPIL, s * 0.14, 1.2, 0.48);
    return mesh;
  });
  // 포탑.
  const turretViews = game.turrets.map((turret) => {
    const mesh = new THREE.Group(); mesh.visible = false; scene.add(mesh);
    cyl(mesh, 0.9, 1.1, 0.5, M.dark, 0, 0.25, 0, 16); cyl(mesh, 0.35, 0.45, 1.0, M.mid, 0, 1.0, 0, 12);
    const head = new THREE.Group(); head.position.y = 1.7; mesh.add(head);
    rbox(head, 1.1, 0.7, 1.2, 0.2, turret.map ? M.dark : toy('#ff8a2a', 0.5), 0, 0, 0);
    cyl(head, 0.16, 0.2, 1.3, M.light, 0, 0, 1.0, 10).rotation.x = Math.PI / 2;
    ball(head, 0.14, glow('#ff3b3b', 4), 0, 0.2, 0.62);
    return { mesh, head };
  });
  // 분신.
  const decoyViews = game.decoys.map(() => {
    const group = new THREE.Group(); group.visible = false; scene.add(group);
    const ringMat = additive('#ffffff', 2.2, null, 0.95), markMat = glow('#ffffff', 3.4);
    add(group, new THREE.RingGeometry(2.6, 2.95, 40), ringMat, 0, 0.08, 0).rotation.x = -Math.PI / 2;
    add(group, new THREE.OctahedronGeometry(0.5, 0), markMat, 0, 5.9, 0);
    return { group, ringMat, markMat, figure: null };
  });
  // 폭탄.
  const bombViews = game.bombs.map(() => {
    const mesh = new THREE.Group(); mesh.visible = false; scene.add(mesh);
    ball(mesh, 0.7, toy('#1a1c22', 0.3, { clearcoat: 1 }), 0, 0, 0); cyl(mesh, 0.12, 0.12, 0.3, M.mid, 0, 0.75, 0, 8);
    const spark = ball(mesh, 0.2, glow('#ffd27a', 5), 0, 1.0, 0);
    return { mesh, spark };
  });
  // 동전.
  const coinViews = game.coins.map(() => { const mesh = cyl(scene, 0.55, 0.55, 0.1, GOLD, 0, 0, 0, 20); mesh.rotation.x = Math.PI / 2; mesh.visible = false; return mesh; });

  // ---------- 효과 ----------
  // 포탑이 쏘는 빛줄기.
  const beams = Array.from({ length: 6 }, () => { const mesh = add(scene, new THREE.CylinderGeometry(0.07, 0.07, 1, 6), glow('#ffb347', 4)); mesh.visible = false; return { mesh, until: 0 }; });
  // 얼음장수가 얼릴 때 퍼지는 고리.
  const pulses = [0, 1].map(() => { const mesh = add(scene, new THREE.RingGeometry(0.9, 1, 64), additive('#9fe8ff', 2.4, null, 0), 0, TRACK_Y + 0.1, 0); mesh.rotation.x = -Math.PI / 2; return { mesh, at: -9 }; });
  // 머리 위로 떠오르는 글자.
  const popups = [];
  // ---------- 공격 ----------
  // 트랙을 편 좌표(거리, 좌우)의 점들을 장면으로 옮겨 띠로 그린다. 길이 굽으면 띠도 따라 굽는다.
  function makeTrail(maxPoints, material) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPoints * 6), 3));
    const index = []; for (let n = 0; n < maxPoints - 1; n++) { const b = n * 2; index.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    geo.setIndex(index);
    const mesh = new THREE.Mesh(geo, material); mesh.frustumCulled = false; mesh.visible = false; scene.add(mesh);
    return { mesh, max: maxPoints, xs: new Float32Array(maxPoints), zs: new Float32Array(maxPoints) };
  }
  // points는 [거리, 좌우] 쌍의 배열. place를 주면 그 함수로 장면 좌표를 구한다(도감 무대용).
  function drawTrail(trail, points, width, y, place = null) {
    const pos = trail.mesh.geometry.attributes.position, count = Math.min(points.length, trail.max), { xs, zs } = trail;
    for (let n = 0; n < count; n++) {
      if (place) { const [x, z] = place(points[n][0], points[n][1]); xs[n] = x; zs[n] = z; }
      else { locate(points[n][0], points[n][1], at); xs[n] = at.x; zs[n] = at.z; }
    }
    for (let n = 0; n < count; n++) {
      const a = Math.max(0, n - 1), b = Math.min(count - 1, n + 1);
      let dx = xs[b] - xs[a], dz = zs[b] - zs[a]; const len = Math.hypot(dx, dz) || 1; dx /= len; dz /= len;
      pos.setXYZ(n * 2, xs[n] - (dz * width) / 2, y, zs[n] + (dx * width) / 2);
      pos.setXYZ(n * 2 + 1, xs[n] + (dz * width) / 2, y, zs[n] - (dx * width) / 2);
    }
    pos.needsUpdate = true; trail.mesh.geometry.setDrawRange(0, Math.max(0, count - 1) * 6); trail.mesh.visible = count > 1;
  }
  // 공격 방식의 범위 테두리. who는 자리와 보는 쪽(s, lane, dirS, dirL)을 가진 것.
  function outline(way, who) {
    const P = (along, across) => [who.s + who.dirS * along - who.dirL * across, who.lane + who.dirL * along + who.dirS * across];
    const circle = (cs, cl, r) => Array.from({ length: 33 }, (_, k) => [cs + Math.cos((k / 32) * TAU) * r, cl + Math.sin((k / 32) * TAU) * r]);
    if (way.shape === 'cone') { const r = way.reach + BODY, pts = [P(0, 0)]; for (let k = 0; k <= 12; k++) { const a = -1 + k / 6; pts.push(P(Math.cos(a) * r, Math.sin(a) * r)); } pts.push(P(0, 0)); return pts; }
    if (way.shape === 'line') {
      const w = way.width + BODY * 0.5, pts = [];
      for (let k = 0; k <= 10; k++) pts.push(P(1 + ((way.reach - 1) * k) / 10, w));
      for (let k = 10; k >= 0; k--) pts.push(P(1 + ((way.reach - 1) * k) / 10, -w));
      pts.push(pts[0]); return pts;
    }
    if (way.shape === 'lob') { const drop = game.landing(who, way); return circle(drop.s, drop.lane, way.radius); }
    return circle(who.s, who.lane, way.shape === 'burst' ? way.radius : way.reach + BODY);
  }
  // 내 공격 범위: 테두리가 늘 보이고, 맞을 상대가 있으면 붉어진다. 맞을 상대의 발밑에는 조준 표시가 돈다.
  function dashedRing(inner, outer, dashes, fill) {
    const pos = [], index = [];
    for (let n = 0; n < dashes; n++) for (let k = 0; k <= 4; k++) {
      const a = ((n + (k / 4) * fill) / dashes) * TAU;
      pos.push(Math.cos(a) * inner, 0, Math.sin(a) * inner, Math.cos(a) * outer, 0, Math.sin(a) * outer);
      if (k < 4) { const b = n * 10 + k * 2; index.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(index);
    return geo;
  }
  const RANGE_IDLE = C('#ffffff').multiplyScalar(1.4), RANGE_AIM = C('#ff5d5d').multiplyScalar(3);
  const range = makeTrail(48, additive('#ffffff', 1.4, null, 0.5));
  const reticleGeo = dashedRing(0.8, 1, 4, 0.62);
  const reticles = Array.from({ length: 4 }, () => { const mesh = add(scene, reticleGeo, additive('#ff4d4d', 3.2, null, 0.95)); mesh.visible = false; return mesh; });
  // 예고: 저격의 조준선, 터뜨리기의 범위, 던진 것이 떨어질 자리. 누구의 것이든 모두에게 보인다.
  const warnings = Array.from({ length: 12 }, () => makeTrail(48, additive('#ff3b3b', 2.6, null, 0.9)));
  const shellViews = game.shells.map(() => { const mesh = ball(scene, 0.45, glow('#ffd27a', 4), 0, 0, 0); mesh.visible = false; return mesh; });
  // 쏜 자국.
  const tracers = Array.from({ length: 8 }, () => ({ trail: makeTrail(12, additive('#ffffff', 4, null, 1)), at: -9, life: 0.2 }));
  // 휘두른 자국, 퍼지는 고리, 맞은 자리의 섬광.
  const slashGeo = new THREE.RingGeometry(0.5, 1, 24, 1, -0.9, 1.8); slashGeo.rotateX(-Math.PI / 2);
  const slashes = Array.from({ length: 12 }, () => { const mesh = add(scene, slashGeo, additive('#ffffff', 3, null, 0)); mesh.visible = false; return { mesh, at: -9, dir: 0, reach: 3, unit: 0, sweep: 1, life: 0.34 }; });
  const rings = Array.from({ length: 8 }, () => { const mesh = add(scene, new THREE.RingGeometry(0.86, 1, 48), additive('#ffffff', 3, null, 0), 0, TRACK_Y + 0.14, 0); mesh.rotation.x = -Math.PI / 2; mesh.visible = false; return { mesh, at: -9, radius: 3, life: 0.4 }; });
  const burstTex = canvasTexture(128, 128, (g) => {
    g.translate(64, 64);
    const core = g.createRadialGradient(0, 0, 0, 0, 0, 60); core.addColorStop(0, 'rgba(255,255,255,1)'); core.addColorStop(0.3, 'rgba(255,255,255,0.45)'); core.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = core; g.fillRect(-64, -64, 128, 128);
    g.strokeStyle = '#ffffff'; g.lineCap = 'round';
    for (let n = 0; n < 8; n++) { const a = (n / 8) * TAU, far = n % 2 ? 40 : 60; g.lineWidth = n % 2 ? 3 : 6; g.beginPath(); g.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); g.lineTo(Math.cos(a) * far, Math.sin(a) * far); g.stroke(); }
  });
  const bursts = Array.from({ length: 8 }, () => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: burstTex, color: C('#ffd9a0').multiplyScalar(2.4), transparent: true, depthTest: false, blending: THREE.AdditiveBlending }));
    sprite.visible = false; scene.add(sprite);
    return { sprite, at: -9, size: 4 };
  });
  let slashTurn = 0, burstTurn = 0, pulseTurn = 0, ringTurn = 0, tracerTurn = 0;
  const ringAt = (s, lane, radius, hex, life = 0.4) => { const ring = rings[ringTurn++ % rings.length]; locate(s, lane, at); Object.assign(ring, { at: game.time, radius, life }); ring.mesh.position.set(at.x, TRACK_Y + 0.14, at.z); ring.mesh.material.color.copy(C(hex)).multiplyScalar(3); };
  // 공격 동작이 이어지는 시간(초). 방식마다 다르다.
  const SWING = { claw: 0.2, smash: 0.32, shot: 0.2, snipe: 0.3, lob: 0.36, burst: 0.36 };

  // 계산이 남긴 사건 가운데 장면에 그릴 것들. 처리했으면 참을 돌려준다.
  function handle(event) {
    const time = game.time;
    if (event.type === 'popup') {
      const tex = canvasTexture(256, 96, (g) => { g.font = `700 68px ${FONT_NUM}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,0.6)'; g.strokeText(event.text, 128, 50); g.fillStyle = event.color; g.fillText(event.text, 128, 50); });
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      locate(event.s, event.lane, at);
      sprite.scale.set(4.4, 1.65, 1); sprite.position.set(at.x, 5.2, at.z);
      scene.add(sprite); popups.push({ sprite, age: 0 });
    } else if (event.type === 'burst') {
      const b = bursts[burstTurn++ % bursts.length];
      locate(event.s, event.lane, at);
      b.at = time; b.size = event.size; b.sprite.position.set(at.x, TRACK_Y + 1.8, at.z);
    } else if (event.type === 'attack') {
      // 보는 쪽(맞을 상대가 있으면 그쪽)으로 몸을 틀고, 방식에 맞는 자국을 남긴다.
      const unit = game.units[event.unit], view = views[event.unit], tint = event.unit === myIndex ? '#ffffff' : unit.player.color;
      locate(unit.s, unit.lane, at);
      let dx = at.tx * event.dirS + at.tz * event.dirL, dz = at.tz * event.dirS - at.tx * event.dirL;
      if (event.to) { locate(event.to.s, event.to.lane, at2); dx = at2.x - at.x; dz = at2.z - at.z; }
      view.aimYaw = Math.atan2(dx, dz);
      const slashNow = (delay, sweep, reach, life) => { const slash = slashes[slashTurn++ % slashes.length]; Object.assign(slash, { at: time + delay, dir: Math.atan2(-dz, dx), reach, unit: event.unit, sweep, life }); slash.mesh.material.color.copy(C(tint)).multiplyScalar(event.hit ? 4.5 : 1.8); };
      if (event.way === 'claw') { slashNow(0, 1, event.reach + BODY * 0.6, 0.16); slashNow(0.09, -1, event.reach + BODY * 0.6, 0.16); }
      else if (event.way === 'smash') { slashNow(0, 1, event.reach + BODY, 0.34); ringAt(unit.s, unit.lane, event.reach + BODY, tint, 0.3); }
      else if (event.way === 'shot' || event.way === 'snipe') {
        // 맞은 데까지, 안 맞았으면 닿는 끝까지 곧게 긋는다.
        const tracer = tracers[tracerTurn++ % tracers.length];
        let ds = event.dirS * event.reach, dl = event.dirL * event.reach;
        if (event.to) { ds = shortest(event.to.s - unit.s); dl = event.to.lane - unit.lane; }
        drawTrail(tracer.trail, Array.from({ length: 9 }, (_, k) => [unit.s + (ds * k) / 8, unit.lane + (dl * k) / 8]), event.way === 'snipe' ? 0.5 : 0.28, TRACK_Y + 1.6);
        tracer.at = time; tracer.life = event.way === 'snipe' ? 0.34 : 0.18; tracer.trail.mesh.material.color.copy(C(tint)).multiplyScalar(event.way === 'snipe' ? 6 : 4);
      }
    } else if (event.type === 'blast') {
      ringAt(event.s, event.lane, event.radius, '#ffb347', 0.45);
      const b = bursts[burstTurn++ % bursts.length];
      locate(event.s, event.lane, at);
      b.at = time; b.size = event.radius * 2.4; b.sprite.position.set(at.x, TRACK_Y + 1.8, at.z);
    } else if (event.type === 'zap') {
      const beam = beams.find((b) => b.until < time); if (!beam) return true;
      locate(event.from.s, event.from.lane, at); locate(event.to.s, event.to.lane, at2);
      const a = V(at.x, TRACK_Y + 1.7, at.z), dir = V(at2.x, TRACK_Y + 1.6, at2.z).sub(a), len = dir.length();
      beam.mesh.position.copy(a).addScaledVector(dir, 0.5); beam.mesh.scale.set(1, len, 1); beam.mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
      beam.mesh.visible = true; beam.until = time + 0.12;
    } else if (event.type === 'pulse') {
      const pulse = pulses[pulseTurn++ % pulses.length];
      locate(event.s, event.lane, at);
      pulse.at = time; pulse.mesh.position.set(at.x, TRACK_Y + 0.1, at.z);
    } else if (event.type === 'respawn') {
      views[event.unit].face = null;
    } else return false;
    return true;
  }

  const turnTo = (from, to, k) => from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * k;
  function place(unit, view, time, dt) {
    // 캐릭터가 바뀌었으면 모델을 갈아 끼운다.
    if (view.id !== unit.id) {
      if (view.figure) { view.group.remove(view.figure); giveBack(view.id, view.figure); }
      view.id = unit.id; view.figure = borrow(unit.id); view.figure.position.set(0, 0, 0); view.group.add(view.figure);
    }
    view.group.visible = !unit.rank;
    const carrier = unit.carriedBy;
    locate((carrier || unit).s, (carrier || unit).lane, at);
    view.group.position.set(at.x, TRACK_Y + (carrier ? 3.4 : 0), at.z);
    // 움직이는 쪽을 바라본다. 멈추면 보던 쪽을 그대로 보고, 공격할 때는 상대 쪽으로 몸을 틀어 내지른다. 맞으면 잠깐 떤다.
    const lunge = (time - unit.lungeAt) / (SWING[unit.swing] || 0.26), thrust = lunge < 1 ? Math.sin(lunge * Math.PI) : 0;
    if (view.face === null) view.face = Math.atan2(at.tx, at.tz);
    if (!carrier && Math.hypot(unit.vs, unit.vl) > 0.6) view.face = turnTo(view.face, Math.atan2(at.tx * unit.vs + at.tz * unit.vl, at.tz * unit.vs - at.tx * unit.vl), Math.min(1, dt * 12));
    view.group.rotation.y = carrier ? time * 4 : turnTo(view.face, view.aimYaw, Math.min(1, thrust * 2.5));
    view.marker.position.y = unit.type.top + 1.9 + Math.sin(time * 2 + unit.phase) * 0.25;
    view.marker.rotation.y = time * 1.5;
    view.ice.visible = unit.frozenUntil > time;
    // 체력 막대는 카메라를 본다. 무적인 캐릭터는 가득 찬 채로 둔다.
    view.bar.position.y = unit.type.top + 0.9;
    view.bar.quaternion.copy(view.group.quaternion).invert().multiply(camera.quaternion);
    const full = unit.type.hp === Infinity ? 1 : Math.max(0, unit.hp / unit.type.hp);
    view.fill.scale.x = Math.max(0.001, full); view.fill.position.x = -1.25 * (1 - full);
    view.ticket.visible = unit.ticketUntil > time;
    // 새로 바뀐 캐릭터는 작게 나타나 제 크기로 커진다. 막 태어나 무적인 동안은 깜빡인다.
    const grown = Math.min(1, (time - unit.bornAt) / 0.35);
    // 예고 중인 공격: 터뜨리기는 몸이 부풀고, 저격은 몸을 낮춘다.
    const charge = unit.windup ? Math.min(1, (time - unit.windup.at) / (unit.windup.until - unit.windup.at)) : 0;
    const swell = unit.windup && unit.windup.way === 'burst' ? 1 + charge * 0.3 : unit.swing === 'burst' ? 1 + thrust * 0.35 : 1;
    view.figure.scale.setScalar(0.85 * (0.25 + 0.75 * grown * (2 - grown)) * (carrier ? 0.6 : 1) * swell);
    view.figure.visible = !(unit.safeUntil > time && Math.floor(time * 12) % 2);
    // 방식마다 몸짓이 다르다: 긁기는 짧게 좌우로, 내려치기는 뛰어올라 찍고, 쏘기는 반동으로 물러나고, 던지기는 젖혔다 숙인다.
    const way = unit.swing, figure = view.figure;
    figure.position.z = way === 'shot' ? -thrust * 0.7 : way === 'snipe' ? -thrust * 1.3 : way === 'claw' ? thrust * 1.0 : way === 'lob' || way === 'burst' ? thrust * 0.4 : thrust * 1.6;
    figure.position.y = way === 'smash' ? thrust * 1.5 : 0;
    figure.rotation.set(way === 'smash' ? thrust * 0.5 : way === 'lob' && lunge < 1 ? -Math.sin(lunge * TAU) * 0.55 : unit.windup && unit.windup.way === 'snipe' ? 0.18 * charge : 0, way === 'claw' && lunge < 1 ? Math.sin(lunge * TAU) * 0.6 : 0, 0);
    figure.position.x = time - unit.hurtAt < 0.2 ? Math.sin(time * 95) * 0.25 : 0;
    // 얼어 있는 동안은 동작도 멈춘다.
    view.figure.userData.animate((view.ice.visible ? unit.frozenUntil : time) + unit.phase, Math.abs(unit.vs) > 0.4, unit);
  }

  // 계산 쪽의 어떤 것이든 장면 속 자리로. 선수는 그려진 자리를, 나머지는 트랙 위 자리를 쓴다.
  const spotVector = new THREE.Vector3();
  function worldOf(thing) {
    if (thing.kind === 'unit') return views[thing.index].group.position;
    locate(thing.s, thing.lane, at2);
    return spotVector.set(at2.x, TRACK_Y, at2.z);
  }

  // 매 프레임: 계산의 상태를 장면에 옮긴다. pawn은 공격 범위를 그려 줄 내 캐릭터(없으면 null), spinning은 도감에서 한 명을 돌려 보는 중인지.
  function sync(dt, { pawn = null, spinning = false } = {}) {
    const time = game.time;
    for (const unit of game.units) place(unit, views[unit.index], time, dt);

    game.crystals.forEach((crystal, n) => {
      const grown = crystal.up ? Math.min(1, (time - crystal.bornAt) * 2.5) : 0;
      crystalViews[n].visible = grown > 0.01; crystalViews[n].scale.setScalar(Math.max(0.001, grown * (0.7 + 0.1 * Math.max(0, crystal.hp))));
    });
    {
      // 차단벽: 부서지면 셔터가 바닥으로 꺼지고 경광등이 꺼진다. 다시 닫힐 때는 올라온다.
      const barrier = game.barrier, up = time >= barrier.downUntil && barrier.hp > 0, shut = up ? Math.min(1, (time - barrier.bornAt) * 2.5) : 0;
      gate.shutter.scale.y = Math.max(0.02, shut); gate.shutter.visible = shut > 0.02;
      for (const lamp of gate.lamps) lamp.visible = up && Math.sin(time * 6) > -0.3;
      gate.bar.visible = up; gate.bar.quaternion.copy(camera.quaternion);
      gate.fill.scale.x = Math.max(0.001, barrier.hp / 12); gate.fill.position.x = -2 * (1 - Math.max(0, barrier.hp) / 12);
    }
    game.sites.forEach((site, n) => {
      const view = siteViews[n];
      view.mesh.visible = site.live; if (!site.live) return;
      locate(site.s, site.lane, at);
      view.mesh.position.set(at.x, TRACK_Y, at.z); view.mesh.rotation.y = Math.atan2(at.tx, at.tz);
      const built = Math.min(1, (time - site.startedAt) / (site.doneAt - site.startedAt));
      view.bar.quaternion.copy(view.mesh.quaternion).invert().multiply(camera.quaternion);
      view.fill.scale.x = Math.max(0.001, built); view.fill.position.x = -1.6 * (1 - built);
    });
    game.slimes.forEach((slime, n) => {
      slimeViews[n].visible = slime.until >= time; if (!slimeViews[n].visible) return;
      locate(slime.s, slime.lane, at); slimeViews[n].position.set(at.x, TRACK_Y + 0.03, at.z);
    });
    game.chicks.forEach((chick, n) => {
      chickViews[n].visible = chick.live; if (!chick.live) return;
      locate(chick.s, chick.lane, at);
      chickViews[n].position.set(at.x, TRACK_Y + Math.abs(Math.sin(time * 14)) * 0.4, at.z); chickViews[n].rotation.y = Math.atan2(at.tx, at.tz);
    });
    game.turrets.forEach((turret, n) => {
      const view = turretViews[n];
      view.mesh.visible = turret.live; if (!turret.live) return;
      locate(turret.s, turret.lane, at); view.mesh.position.set(at.x, TRACK_Y, at.z);
      if (turret.aim !== null) { const prey = views[turret.aim].group.position; view.head.rotation.y = Math.atan2(prey.x - at.x, prey.z - at.z); }
    });
    game.decoys.forEach((decoy, n) => {
      const view = decoyViews[n];
      view.group.visible = decoy.live;
      if (!decoy.live) { if (view.figure) { view.group.remove(view.figure); giveBack('ninja', view.figure); view.figure = null; } return; }
      if (!view.figure) {
        view.figure = borrow('ninja'); view.figure.scale.setScalar(0.85); view.figure.position.set(0, 0, 0); view.figure.visible = true; view.group.add(view.figure);
        const tint = C(decoy.owner.player.color); view.ringMat.color.copy(tint).multiplyScalar(2.2); view.markMat.color.copy(tint).multiplyScalar(3.4);
      }
      locate(decoy.s, decoy.lane, at); view.group.position.set(at.x, TRACK_Y, at.z); view.group.rotation.y = Math.atan2(at.tx, at.tz);
      view.figure.userData.animate(time + decoy.lane, true, null);
    });
    game.bombs.forEach((bomb, n) => {
      const view = bombViews[n];
      view.mesh.visible = bomb.live; if (!bomb.live) return;
      const carrier = bomb.carrier, body = views[carrier.index].group.position, left = bomb.fuseUntil - time;
      view.mesh.position.set(body.x, carrier.type.top + 3.4, body.z);
      view.mesh.scale.setScalar(1 + Math.abs(Math.sin(time * (4 + (5.5 - left) * 3))) * 0.3); view.spark.visible = Math.sin(time * 40) > 0;
    });
    game.coins.forEach((coin, n) => {
      coinViews[n].visible = coin.live; if (!coin.live) return;
      locate(coin.s, coin.lane, at); coinViews[n].position.set(at.x, TRACK_Y + 0.8, at.z); coinViews[n].rotation.z = time * 4;
    });

    // 내 공격 범위와 조준 표시.
    const way = pawn ? game.attackOf(pawn) : null, aimed = way ? game.aimAt(pawn) : [];
    // 터뜨리기와 던지기는 범위 안의 모두가, 나머지는 가장 먼저 닿는 하나가 맞는다.
    const marks = way && (way.shape === 'burst' || way.shape === 'lob') ? aimed.slice(0, reticles.length) : aimed.slice(0, 1);
    if (way) {
      drawTrail(range, outline(way, pawn), 0.2, TRACK_Y + 0.12);
      range.mesh.material.color.copy(marks.length ? RANGE_AIM : RANGE_IDLE); range.mesh.material.opacity = marks.length ? 0.95 : time >= pawn.nextHit ? 0.6 : 0.2;
    } else range.mesh.visible = false;
    reticles.forEach((mesh, n) => {
      const mark = marks[n]; mesh.visible = !!mark; if (!mark) return;
      const q = worldOf(mark); mesh.position.set(q.x, TRACK_Y + 0.16, q.z); mesh.scale.setScalar((mark.r || BODY) + 1.5 + Math.sin(time * 9) * 0.15); mesh.rotation.y = -time * 2.5;
    });
    // 예고: 누가 조준하고 있는지, 어디가 터질지, 던진 것이 어디에 떨어질지.
    let warned = 0;
    for (const unit of game.units) {
      if (!unit.windup || unit.rank || warned >= warnings.length) continue;
      const warning = warnings[warned++], charge = (time - unit.windup.at) / (unit.windup.until - unit.windup.at);
      drawTrail(warning, outline(ATTACKS[unit.windup.way], unit), 0.3, TRACK_Y + 0.13); warning.mesh.material.opacity = 0.35 + 0.6 * charge;
    }
    game.shells.forEach((shell, n) => {
      const ballView = shellViews[n];
      ballView.visible = shell.live; if (!shell.live || warned >= warnings.length) return;
      const k = Math.min(1, (time - shell.thrownAt) / (shell.landAt - shell.thrownAt));
      const ds = shortest(shell.s - shell.fromS);
      locate(shell.fromS + ds * k, shell.fromLane + (shell.lane - shell.fromLane) * k, at);
      ballView.position.set(at.x, TRACK_Y + 1.6 + Math.sin(k * Math.PI) * 5, at.z);
      const warning = warnings[warned++];
      drawTrail(warning, Array.from({ length: 33 }, (_, j) => [shell.s + Math.cos((j / 32) * TAU) * shell.radius, shell.lane + Math.sin((j / 32) * TAU) * shell.radius]), 0.3, TRACK_Y + 0.13); warning.mesh.material.opacity = 0.35 + 0.6 * k;
    });
    for (let n = warned; n < warnings.length; n++) warnings[n].mesh.visible = false;
    for (const tracer of tracers) { const k = (time - tracer.at) / tracer.life; tracer.trail.mesh.visible = k >= 0 && k < 1; if (k >= 0 && k < 1) tracer.trail.mesh.material.opacity = 1 - k; }
    for (const slash of slashes) {
      const k = (time - slash.at) / slash.life;
      slash.mesh.visible = k >= 0 && k < 1; if (!slash.mesh.visible) continue;
      const p = views[slash.unit].group.position;
      slash.mesh.position.set(p.x, TRACK_Y + 1.5, p.z); slash.mesh.rotation.y = slash.dir + slash.sweep * (0.5 - Math.min(1, k * 1.7)) * 1.7;
      slash.mesh.scale.setScalar(slash.reach * (0.8 + 0.2 * k)); slash.mesh.material.opacity = Math.min(1, 1.5 * (1 - k));
    }
    for (const ring of rings) {
      const k = (time - ring.at) / ring.life;
      ring.mesh.visible = k >= 0 && k < 1; if (!ring.mesh.visible) continue;
      ring.mesh.scale.setScalar(ring.radius * (0.25 + 0.75 * k)); ring.mesh.material.opacity = 0.9 * (1 - k);
    }
    for (const b of bursts) {
      const k = (time - b.at) / 0.26;
      b.sprite.visible = k >= 0 && k < 1; if (!b.sprite.visible) continue;
      b.sprite.scale.setScalar(b.size * (0.35 + 0.65 * k)); b.sprite.material.opacity = 1 - k * k;
    }
    for (const beam of beams) if (beam.mesh.visible && time > beam.until) beam.mesh.visible = false;
    for (const pulse of pulses) {
      const k = (time - pulse.at) / 0.9;
      pulse.mesh.visible = k < 1; pulse.mesh.scale.setScalar(1 + k * FREEZE_RADIUS); pulse.mesh.material.opacity = Math.max(0, 0.9 * (1 - k));
    }
    for (let n = popups.length - 1; n >= 0; n--) {
      const p = popups[n]; p.age += dt; p.sprite.position.y += dt * 4.5; p.sprite.material.opacity = Math.max(0, 1 - p.age / 1.8);
      if (p.age > 1.8) { scene.remove(p.sprite); p.sprite.material.map.dispose(); p.sprite.material.dispose(); popups.splice(n, 1); }
    }
    // 도감 무대와 갑판의 움직이는 장식.
    for (const entry of lineup) if (entry.figure && entry.figure.visible) { entry.figure.userData.animate(time + entry.x, false, null); if (spinning) entry.figure.rotation.y += dt * 0.5; }
    for (const s of spinners) s.rotation.y += s.userData.speed * dt;
    flicker.forEach((m, n) => { m.opacity = 0.4 + Math.sin(time * 6 + n * 2.1) * 0.08; });
    energyMaterial.uniforms.t.value = time;
  }

  // 도감에서 한 명을 볼 때: 그 캐릭터의 공격 범위를 받침대 위에 그려 보여준다. entry가 없으면 지운다.
  const podRange = makeTrail(48, additive('#ffffff', 1.6, null, 0.7));
  function showPodRange(entry) {
    const way = entry && INFO[entry.id].atk ? ATTACKS[ATTACK_OF[entry.id] || 'smash'] : null;
    if (!way) { podRange.mesh.visible = false; return; }
    // 받침대 가운데에서 카메라 쪽(+z)을 보고 선 것으로 친다.
    const who = { s: 0, lane: 0, dirS: 1, dirL: 0 };
    const points = way.shape === 'lob' ? Array.from({ length: 33 }, (_, k) => [way.reach + Math.cos((k / 32) * TAU) * way.radius, Math.sin((k / 32) * TAU) * way.radius]) : outline(way, who);
    drawTrail(podRange, points, 0.16, 0.56, (along, across) => [entry.x - across, entry.z + along]);
  }

  return { views, sync, handle, showPodRange };
}
