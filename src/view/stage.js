// 움직이는 것들의 모습: 선수, 설치물, 효과, 전광판, 도감 무대.
// 계산(sim)의 상태를 읽어 장면에 옮기기만 한다. 규칙은 여기서 바꾸지 않는다.
import { C, FONT_KR, FONT_NUM, GOLD, PUPIL, TAU, UP, V, add, additive, ball, box, canvasTexture, cyl, glow, label, limb, rbox, toy } from './tools.js';
import { M, camera, energyMaterial, flicker, scene, spinners } from './world.js';
import { makeCharacter } from './models.js';
import { TRACK_Y, locate } from '../sim/track.js';
import { INFO, ROWS } from '../sim/characters.js';
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

  // 두리안.
  const durianView = { figure: makeCharacter('durian'), bar: new THREE.Group(), fill: null };
  {
    locate(game.durian.s, 0, at);
    durianView.figure.position.set(at.x, TRACK_Y, at.z); durianView.figure.rotation.y = Math.atan2(at.tx, at.tz) + Math.PI; scene.add(durianView.figure);
    durianView.bar.position.set(at.x, 7.4, at.z); scene.add(durianView.bar);
    add(durianView.bar, new THREE.PlaneGeometry(4.2, 0.5), darkBar());
    durianView.fill = add(durianView.bar, new THREE.PlaneGeometry(4, 0.3), glow('#a8e04a', 1.6, { depthTest: false }), 0, 0, 0.01);
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
  // 공격 범위와 조준: 내 발밑의 점선 원 안에 들어온 가장 가까운 상대를 친다. 칠 상대의 발밑에는 붉은 조준 표시가 돈다.
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
  const rangeRing = add(scene, dashedRing(0.965, 1, 44, 0.55), additive('#ffffff', 1.4, null, 0.5)); rangeRing.visible = false;
  const reticle = add(scene, dashedRing(0.8, 1, 4, 0.62), additive('#ff4d4d', 3.2, null, 0.95)); reticle.visible = false;
  // 휘두른 자국과 맞은 자리의 섬광.
  const slashGeo = new THREE.RingGeometry(0.5, 1, 24, 1, -0.9, 1.8); slashGeo.rotateX(-Math.PI / 2);
  const slashes = Array.from({ length: 10 }, () => { const mesh = add(scene, slashGeo, additive('#ffffff', 3, null, 0)); mesh.visible = false; return { mesh, at: -9, dir: 0, reach: 3, unit: 0 }; });
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
  let slashTurn = 0, burstTurn = 0, pulseTurn = 0;

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
    } else if (event.type === 'swing') {
      // 상대 쪽으로 몸을 틀어 내지르고, 닿는 거리만큼 부채꼴 자국을 남긴다.
      const unit = game.units[event.unit], view = views[event.unit];
      locate(unit.s, unit.lane, at);
      let dx = at.tx, dz = at.tz;
      if (event.to) { locate(event.to.s, event.to.lane, at2); dx = at2.x - at.x; dz = at2.z - at.z; }
      view.aimYaw = Math.atan2(dx, dz);
      const slash = slashes[slashTurn++ % slashes.length];
      Object.assign(slash, { at: time, dir: Math.atan2(-dz, dx), reach: event.reach, unit: event.unit });
      slash.mesh.material.color.copy(C(event.unit === myIndex ? '#ffffff' : unit.player.color)).multiplyScalar(event.hit ? 4.5 : 1.8);
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
    const lunge = (time - unit.lungeAt) / 0.26, thrust = lunge < 1 ? Math.sin(lunge * Math.PI) : 0;
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
    view.figure.scale.setScalar(0.85 * (0.25 + 0.75 * grown * (2 - grown)) * (carrier ? 0.6 : 1));
    view.figure.visible = !(unit.safeUntil > time && Math.floor(time * 12) % 2);
    view.figure.position.z = thrust * 1.8;
    view.figure.position.x = time - unit.hurtAt < 0.2 ? Math.sin(time * 95) * 0.25 : 0;
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
      const durian = game.durian, pop = time >= durian.downUntil ? Math.min(1, (time - durian.bornAt) * 2.5) : 0;
      durianView.figure.visible = durianView.bar.visible = pop > 0.01; durianView.figure.scale.setScalar(Math.max(0.001, pop));
      durianView.figure.userData.animate(time, false, null);
      durianView.bar.quaternion.copy(camera.quaternion); durianView.fill.scale.x = Math.max(0.001, durian.hp / 12); durianView.fill.position.x = -2 * (1 - Math.max(0, durian.hp) / 12);
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

    // 공격 범위와 조준 표시.
    const aim = pawn ? game.hitTarget(pawn) : null;
    rangeRing.visible = !!pawn; reticle.visible = !!aim;
    if (pawn) {
      const p = views[pawn.index].group.position;
      rangeRing.position.set(p.x, TRACK_Y + 0.12, p.z); rangeRing.scale.setScalar(game.reachOf(pawn) + BODY); rangeRing.rotation.y = time * 0.3;
      rangeRing.material.color.copy(aim ? RANGE_AIM : RANGE_IDLE); rangeRing.material.opacity = aim ? 0.95 : time >= pawn.nextHit ? 0.6 : 0.2;
    }
    if (aim) { const q = worldOf(aim); reticle.position.set(q.x, TRACK_Y + 0.16, q.z); reticle.scale.setScalar((aim.r || BODY) + 1.5 + Math.sin(time * 9) * 0.15); reticle.rotation.y = -time * 2.5; }
    for (const slash of slashes) {
      const k = (time - slash.at) / 0.34;
      slash.mesh.visible = k >= 0 && k < 1; if (!slash.mesh.visible) continue;
      const p = views[slash.unit].group.position;
      slash.mesh.position.set(p.x, TRACK_Y + 1.5, p.z); slash.mesh.rotation.y = slash.dir + (0.5 - Math.min(1, k * 1.7)) * 1.7;
      slash.mesh.scale.setScalar(slash.reach * (0.8 + 0.2 * k)); slash.mesh.material.opacity = Math.min(1, 1.5 * (1 - k));
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

  return { views, sync, handle };
}
