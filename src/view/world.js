// 우주 기지 갑판과 그 위의 모든 고정 구조물: 하늘, 빛, 갑판, 길, 다리, 협곡, 문, 설비.
import { renderer } from './renderer.js';
import { BOX, C, FONT_NUM, TAU, add, additive, box, canvasTexture, cyl, glow, repeatTex, rnd, rr, std } from './tools.js';
import { BOUNDS, DEEP, N, POINTS, SECTIONS, TANGENTS, TOTAL, TRACK_Y, WIDTH, overChasm, sectionOf } from '../sim/track.js';

// ---------- 장면, 하늘, 빛 ----------
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(36, 1, 1, 5000);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

export const NOISE = `
  float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }
  float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.02; a *= 0.5; } return s; }`;

export const skyMaterial = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false,
  vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `varying vec3 vDir; ${NOISE}
    void main(){
      vec3 d = normalize(vDir);
      float n = fbm(d * 2.2 + vec3(3.1, 0.0, 1.7));
      float n2 = fbm(d * 4.0 - vec3(1.0, 2.0, 0.0));
      vec3 col = vec3(0.004, 0.006, 0.016);
      col += vec3(0.10, 0.03, 0.22) * smoothstep(0.45, 0.85, n);
      col += vec3(0.02, 0.16, 0.20) * smoothstep(0.5, 0.9, n2) * smoothstep(0.3, 0.7, n);
      vec3 cell = floor(d * 260.0);
      float h = hash(cell);
      float star = step(0.9972, h) * smoothstep(0.5, 0.0, length(fract(d * 260.0) - 0.5));
      col += star * vec3(1.6, 1.7, 2.0) * (0.5 + hash(cell + 7.0) * 2.0);
      gl_FragColor = vec4(col, 1.0);
    }`,
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(2400, 48, 24), skyMaterial));

// 금속 표면에 비칠 환경. 기본 재질만 쓴다: 직접 짠 셰이더는 PMREM의 HDR 인코딩을 거치지 않아 값이 폭주한다.
{
  const env = new THREE.Scene();
  const dome = canvasTexture(16, 256, (g, w, h) => { const grad = g.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, '#0b1230'); grad.addColorStop(0.45, '#2a2f6e'); grad.addColorStop(0.55, '#3a2a5e'); grad.addColorStop(1, '#0a0a14'); g.fillStyle = grad; g.fillRect(0, 0, w, h); });
  env.add(new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.MeshBasicMaterial({ map: dome, side: THREE.BackSide })));
  const warm = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), glow('#ffe2bd', 5, { side: THREE.DoubleSide }));
  warm.position.set(-60, 60, -40); warm.lookAt(0, 0, 0); env.add(warm);
  const cool = new THREE.Mesh(new THREE.PlaneGeometry(70, 40), glow('#5a8cff', 3, { side: THREE.DoubleSide }));
  cool.position.set(70, 20, 60); cool.lookAt(0, 0, 0); env.add(cool);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(env, 0.03, 0.1, 1000).texture;
  pmrem.dispose();
}

export const sun = new THREE.DirectionalLight(C('#fff0d8'), 2.3);
sun.position.set(-70, 110, -50);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -165, right: 165, top: 165, bottom: -165, near: 10, far: 520 });
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.05;
scene.add(sun);
export const rim = new THREE.DirectionalLight(C('#4f78ff'), 0.9);
rim.position.set(80, 40, 70);
scene.add(rim);
scene.add(new THREE.HemisphereLight(C('#93b4ff'), C('#1a1026'), 0.55));

// 행성: 줄무늬 가스 행성과 가장자리에서만 빛나는 대기.
{
  const bands = canvasTexture(1024, 512, (g, w, h) => {
    const palette = ['#2a3c66', '#3d5a8a', '#7d6a9a', '#c08a7a', '#e2b78e', '#5d7fb0', '#28345c'];
    for (let y = 0; y < h; y++) {
      const t = (y / h) * (palette.length - 1) * 1.7 + Math.sin(y * 0.05) * 0.6;
      const a = new THREE.Color(palette[Math.floor(Math.abs(t)) % palette.length]);
      const b = new THREE.Color(palette[(Math.floor(Math.abs(t)) + 1) % palette.length]);
      g.fillStyle = '#' + a.lerp(b, Math.abs(t) % 1).getHexString();
      g.fillRect(0, y, w, 1);
    }
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(${rnd() > 0.5 ? '255,235,210' : '20,24,50'},${rr(0.03, 0.1)})`;
      g.beginPath(); g.ellipse(rnd() * w, rnd() * h, rr(20, 120), rr(1, 5), 0, 0, TAU); g.fill();
    }
  });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(520, 96, 48), new THREE.MeshStandardMaterial({ map: bands, color: C('#8088a8'), roughness: 1, metalness: 0, envMapIntensity: 0 }));
  planet.position.set(260, -560, -620);
  planet.rotation.set(0.5, 0.4, 0.25);
  scene.add(planet);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(545, 96, 48), new THREE.ShaderMaterial({
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide,
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying vec3 vN; varying vec3 vV; void main(){ float f = pow(clamp(-dot(vN, vV) / 0.3, 0.0, 1.0), 1.6); gl_FragColor = vec4(vec3(0.2, 0.45, 1.0) * f * 0.55, 1.0); }',
  }));
  halo.position.copy(planet.position);
  scene.add(halo);
}

// ---------- 재질 ----------
export function plating(bump) {
  return canvasTexture(1024, 1024, (g, w, h) => {
    g.fillStyle = bump ? '#808080' : '#2c323f'; g.fillRect(0, 0, w, h);
    const cell = 256;
    for (let cy = 0; cy < 4; cy++) for (let cx = 0; cx < 4; cx++) {
      if (!bump) { g.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '0,0,0'},${rr(0.03, 0.16)})`; g.fillRect(cx * cell, cy * cell, cell, cell); }
      for (let k = 0; k < 3; k++) {
        const x = cx * cell + rr(14, cell - 100), y = cy * cell + rr(14, cell - 80), pw = rr(40, 90), ph = rr(24, 70);
        g.strokeStyle = bump ? '#5a5a5a' : 'rgba(18,22,32,0.7)'; g.lineWidth = 3; g.strokeRect(x, y, pw, ph);
        if (!bump && rnd() > 0.6) { g.fillStyle = 'rgba(20,26,38,0.35)'; g.fillRect(x, y, pw, ph); }
      }
    }
    g.strokeStyle = bump ? '#303030' : '#1a1e29'; g.lineWidth = 6;
    for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * cell, 0); g.lineTo(i * cell, h); g.moveTo(0, i * cell); g.lineTo(w, i * cell); g.stroke(); }
    if (!bump) {
      g.strokeStyle = 'rgba(150,165,195,0.35)'; g.lineWidth = 2;
      for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * cell + 5, 0); g.lineTo(i * cell + 5, h); g.moveTo(0, i * cell + 5); g.lineTo(w, i * cell + 5); g.stroke(); }
    }
    for (let cy = 0; cy <= 4; cy++) for (let cx = 0; cx <= 4; cx++) for (const [dx, dy] of [[18, 18], [-18, 18], [18, -18], [-18, -18]]) {
      g.fillStyle = bump ? '#c8c8c8' : '#8792a8'; g.beginPath(); g.arc(cx * cell + dx, cy * cell + dy, 5, 0, TAU); g.fill();
    }
    if (!bump) {
      for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(200,210,230,${rr(0.03, 0.12)})`; g.lineWidth = 1; const x = rnd() * w, y = rnd() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rr(-40, 40), y + rr(-40, 40)); g.stroke(); }
      for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(8,10,16,${rr(0.04, 0.14)})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, rr(20, 90), rr(10, 60), rnd() * 3, 0, TAU); g.fill(); }
    }
  }, !bump);
}
export const deckMap = repeatTex(plating(false), 1 / 26, 1 / 26);
export const deckBump = repeatTex(plating(true), 1 / 26, 1 / 26);
export const M = {
  deck: std('#ffffff', 0.45, 0.64, { map: deckMap, bumpMap: deckBump, bumpScale: 0.14, envMapIntensity: 0.45 }),
  hull: std('#1c2130', 0.75, 0.55),
  dark: std('#262c3b', 0.8, 0.45),
  mid: std('#566074', 0.75, 0.4),
  light: std('#a7b0c2', 0.7, 0.35),
  black: std('#0b0d13', 0.4, 0.7),
  glass: std('#0b1a2e', 0.9, 0.08),
  gold: std('#ffcf5a', 0.9, 0.25, { emissive: C('#ffb020'), emissiveIntensity: 0.55 }),
  hazard: std('#ffffff', 0.4, 0.6, { map: repeatTex(canvasTexture(512, 64, (g) => { g.fillStyle = '#f2b90f'; g.fillRect(0, 0, 512, 64); g.fillStyle = '#14161c'; for (let x = -64; x < 512; x += 64) { g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 32, 0); g.lineTo(x + 64, 0); g.lineTo(x + 32, 64); g.fill(); } }), 1, 1) }),
};

// ---------- 갑판 ----------
// 동쪽 변에 파인 홈(x 32 이상, z -15~15)이 에너지 협곡이고, 2구간 다리가 그 위를 건넌다.
export const OUTLINE = [[-64, -72], [64, -72], [72, -64], [72, -15], [32, -15], [32, 15], [72, 15], [72, 64], [64, 72], [-64, 72], [-72, 64], [-72, -64]];
export const insideDeck = (x, z) => {
  let inside = false;
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const [xi, zi] = OUTLINE[i], [xj, zj] = OUTLINE[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
};
{
  const shape = new THREE.Shape(OUTLINE.map(([x, z]) => new THREE.Vector2(x, -z)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 4, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 2 });
  geo.rotateX(-Math.PI / 2); geo.translate(0, -4.5, 0);
  const deck = new THREE.Mesh(geo, [M.deck, M.hull]);
  deck.receiveShadow = true; deck.castShadow = true;
  scene.add(deck);

  // 아래층 선체와 엔진.
  box(scene, 128, 9, 124, M.hull, 0, -9, 0);
  box(scene, 84, 6, 84, M.dark, 0, -16, 0);
  for (const x of [-45, -15, 15, 45]) {
    const pod = cyl(scene, 4.2, 5, 14, M.dark, x, -12, 58, 20); pod.rotation.x = Math.PI / 2;
    add(scene, new THREE.CircleGeometry(3.6, 24), glow('#59c8ff', 3), x, -12, 65.05);
  }

  // 테두리: 난간 기둥, 가로대, 측면 조명 띠.
  const edgeGlow = glow('#3fb6ff', 1.6);
  const posts = [];
  for (let i = 0; i < OUTLINE.length; i++) {
    const [ax, az] = OUTLINE[i], [bx, bz] = OUTLINE[(i + 1) % OUTLINE.length];
    const len = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bx - ax, bz - az);
    const mx = (ax + bx) / 2, mz = (az + bz) / 2;
    const strip = box(scene, 0.16, 0.3, len, edgeGlow, mx, -1.6, mz); strip.rotation.y = ang; strip.translateX(0.62);
    const rail = box(scene, 0.12, 0.12, len, M.light, mx, 1.25, mz); rail.rotation.y = ang;
    for (let d = 0; d <= len; d += 3.2) posts.push([ax + ((bx - ax) * d) / len, az + ((bz - az) * d) / len]);
  }
  const postMesh = new THREE.InstancedMesh(BOX, M.mid, posts.length);
  const dummy = new THREE.Object3D();
  posts.forEach(([x, z], i) => { dummy.position.set(x, 0.62, z); dummy.scale.set(0.18, 1.25, 0.18); dummy.updateMatrix(); postMesh.setMatrixAt(i, dummy.matrix); });
  postMesh.castShadow = true;
  scene.add(postMesh);
}

// 협곡 바닥의 에너지 흐름.
export const energyMaterial = new THREE.ShaderMaterial({
  uniforms: { t: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform float t; varying vec2 vUv; ${NOISE}
    void main(){ float n = fbm(vec3(vUv * vec2(9.0, 7.0) + vec2(t * 0.25, 0.0), t * 0.2)); float veins = smoothstep(0.42, 0.7, n);
      gl_FragColor = vec4(vec3(0.05, 0.75, 1.0) * (0.35 + 3.2 * veins) + vec3(0.6, 1.0, 1.0) * pow(veins, 6.0) * 2.0, 1.0); }`,
});
{
  const pool = add(scene, new THREE.PlaneGeometry(41, 31), energyMaterial, 52, -3.4, 0);
  pool.rotation.x = -Math.PI / 2;
  const light = new THREE.PointLight(C('#3fd8ff'), 2.2, 60, 1.6);
  light.position.set(52, 1, 0);
  scene.add(light);
  for (const z of [-15.7, 15.7]) box(scene, 40, 0.06, 1.2, M.hazard, 52, 0.04, z);
  box(scene, 1.2, 0.06, 32.6, M.hazard, 31.3, 0.04, 0);
}

// ---------- 트랙 ----------
// 길의 모양은 계산 쪽(sim/track.js)이 정한다. 여기서는 그 점들을 장면 좌표로 옮겨 쓴다.
export const P = POINTS.map((p) => new THREE.Vector3(p.x, 0, p.z));
export const TAN = TANGENTS.map((t) => new THREE.Vector3(t.x, 0, t.z));
export const NOR = TAN.map((t) => new THREE.Vector3(t.z, 0, -t.x));

export function ribbon(inner, outer, y, colorOf) {
  const pos = [], uv = [], col = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const k = i % N, a = inner(k), b = outer(k);
    pos.push(P[k].x + NOR[k].x * a, y, P[k].z + NOR[k].z * a, P[k].x + NOR[k].x * b, y, P[k].z + NOR[k].z * b);
    // 무늬는 폭과 상관없이 10칸마다 되풀이된다.
    uv.push(a / 10, (i / N) * (TOTAL / 10), b / 10, (i / N) * (TOTAL / 10));
    if (colorOf) { const c = colorOf(k); col.push(c.r, c.g, c.b, c.r, c.g, c.b); }
    if (i < N) { const v = i * 2; idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (colorOf) geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}
{
  const surface = repeatTex(canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#191c24'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '0,0,0'},${rr(0.02, 0.08)})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
    // 가운데 점선과 5칸마다의 옅은 줄, 진행 방향 화살표.
    g.fillStyle = 'rgba(230,236,250,0.5)'; for (const x of [0, w - 5]) { g.fillRect(x, 30, 5, 190); g.fillRect(x, 290, 5, 190); }
    g.fillStyle = 'rgba(150,170,205,0.14)'; g.fillRect(w / 2 - 2, 0, 4, h);
    g.strokeStyle = 'rgba(120,200,255,0.26)'; g.lineWidth = 12;
    for (const y of [128, 384]) for (const x of [w * 0.25, w * 0.75]) { g.beginPath(); g.moveTo(x - 38, y + 30); g.lineTo(x, y - 16); g.lineTo(x + 38, y + 30); g.stroke(); }
  }), 1, 1);
  const half = (k) => WIDTH[k] / 2;
  const road = new THREE.Mesh(ribbon((k) => half(k), (k) => -half(k), TRACK_Y, null), std('#ffffff', 0.35, 0.62, { map: surface, side: THREE.DoubleSide }));
  road.receiveShadow = true; scene.add(road);
  const curb = new THREE.Mesh(ribbon((k) => half(k) + 0.9, (k) => -half(k) - 0.9, 0.12, null), new THREE.MeshStandardMaterial({ color: C('#11141b'), metalness: 0.6, roughness: 0.5, side: THREE.DoubleSide }));
  curb.receiveShadow = true; scene.add(curb);
  const colors = SECTIONS.map((s) => C(s.color).multiplyScalar(2.6));
  const stripMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
  scene.add(new THREE.Mesh(ribbon((k) => half(k) + 0.62, (k) => half(k) + 0.3, 0.33, (k) => colors[sectionOf(k)]), stripMat));
  scene.add(new THREE.Mesh(ribbon((k) => -half(k) - 0.3, (k) => -half(k) - 0.62, 0.33, (k) => colors[sectionOf(k)]), stripMat));
}

// 다리: 협곡 위 구간에 가로보, 주탑과 케이블. 난간은 없고 가장자리에 경고 띠만 있다.
{
  const span = []; for (let i = 0; i < N; i++) if (overChasm(i)) span.push(i);
  const from = span[0] - 6, to = span[span.length - 1] + 6;
  const dummy = new THREE.Object3D();
  const beams = [], warns = [];
  for (let i = from; i <= to; i++) {
    const ang = Math.atan2(TAN[i].x, TAN[i].z);
    if (i % 3 === 0) beams.push([P[i].x, -0.35, P[i].z, ang, WIDTH[i] + 2.6, 1.0, 0.7]);
    if (i % 4 === 0 && overChasm(i)) for (const side of [1, -1]) warns.push([P[i].x + NOR[i].x * side * (WIDTH[i] / 2 - 0.5), TRACK_Y + 0.03, P[i].z + NOR[i].z * side * (WIDTH[i] / 2 - 0.5), ang, 0.7, 0.04, 1.0]);
  }
  for (const [list, mat] of [[beams, M.mid], [warns, M.gold]]) {
    const inst = new THREE.InstancedMesh(BOX, mat, list.length);
    list.forEach(([x, y, z, ang, sx, sy, sz], n) => { dummy.position.set(x, y, z); dummy.rotation.set(0, ang, 0); dummy.scale.set(sx, sy, sz); dummy.updateMatrix(); inst.setMatrixAt(n, dummy.matrix); });
    inst.castShadow = true; inst.receiveShadow = true; scene.add(inst);
  }
  const cable = new THREE.LineBasicMaterial({ color: C('#9fb4d6') });
  for (const end of [from + 3, to - 3]) for (const side of [1, -1]) {
    const base = new THREE.Vector3(P[end].x + NOR[end].x * side * (WIDTH[end] / 2 + 2.2), 0, P[end].z + NOR[end].z * side * (WIDTH[end] / 2 + 2.2));
    box(scene, 1.3, 15, 1.3, M.dark, base.x, 7.5, base.z);
    box(scene, 1.5, 0.5, 1.5, glow('#22e0c8', 2.4), base.x, 15.1, base.z);
    const top = new THREE.Vector3(base.x, 14.6, base.z);
    const pts = [];
    for (let i = from + 8; i <= to - 8; i += 5) pts.push(top, new THREE.Vector3(P[i].x + NOR[i].x * side * (WIDTH[i] / 2 + 1.0), 0.2, P[i].z + NOR[i].z * side * (WIDTH[i] / 2 + 1.0)));
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), cable));
  }
}

// 협곡 벽: 3구간 가운데 양옆에 높은 구조물을 세워 좁은 통로를 만든다.
{
  const walls = [], slits = [];
  for (let i = BOUNDS[2]; i < BOUNDS[3]; i += 5) for (const side of [1, -1]) {
    if (DEEP[i] < 0.35) continue;
    const depth = rr(3.2, 5.2), height = rr(4.5, 9) * (0.5 + 0.5 * DEEP[i]), off = WIDTH[i] / 2 + 1.3 + depth / 2;
    const x = P[i].x + NOR[i].x * side * off, z = P[i].z + NOR[i].z * side * off;
    const ang = Math.atan2(TAN[i].x, TAN[i].z);
    walls.push([x, height / 2, z, ang, depth, height, 2.7]);
    slits.push([P[i].x + NOR[i].x * side * (WIDTH[i] / 2 + 1.24), rr(1.2, 2.6), P[i].z + NOR[i].z * side * (WIDTH[i] / 2 + 1.24), ang, 0.08, 0.22, 1.7]);
  }
  const dummy = new THREE.Object3D();
  const windowsAt = [];
  for (let k = 0; k < 26; k++) windowsAt.push([Math.floor(rr(0, 8)) * 32 + 9, Math.floor(rr(1, 7)) * 34, rnd() > 0.7 ? '#59c8ff' : '#ffb35a']);
  const wallFace = (lit) => canvasTexture(256, 256, (g) => {
    g.fillStyle = lit ? '#000000' : '#2b3244'; g.fillRect(0, 0, 256, 256);
    if (!lit) { g.strokeStyle = '#161a25'; g.lineWidth = 3; for (let x = 0; x <= 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); } g.fillStyle = '#3a4358'; g.fillRect(0, 0, 256, 10); g.fillStyle = '#1b202c'; g.fillRect(0, 236, 256, 20); }
    for (const [x, y, color] of windowsAt) { g.fillStyle = lit ? color : '#10131b'; g.fillRect(x, y, 14, 9); }
  });
  const wallMat = std('#ffffff', 0.6, 0.5, { map: wallFace(false), emissiveMap: wallFace(true), emissive: C('#ffffff'), emissiveIntensity: 1.6 });
  for (const [list, mat] of [[walls, wallMat], [slits, glow('#ff8a2a', 2.8)]]) {
    const inst = new THREE.InstancedMesh(BOX, mat, list.length);
    list.forEach(([x, y, z, ang, sx, sy, sz], n) => { dummy.position.set(x, y, z); dummy.rotation.set(0, ang, 0); dummy.scale.set(sx, sy, sz); dummy.updateMatrix(); inst.setMatrixAt(n, dummy.matrix); });
    inst.castShadow = !mat.isMeshBasicMaterial; inst.receiveShadow = inst.castShadow; scene.add(inst);
  }
}

// ---------- 구간 문과 표지 ----------
export function hologram(text, color, w = 512, h = 256, size = 150) {
  return canvasTexture(w, h, (g) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = color; g.globalAlpha = 0.16; g.fillRect(0, 0, w, h); g.globalAlpha = 1;
    g.strokeStyle = color; g.lineWidth = 8; g.strokeRect(8, 8, w - 16, h - 16);
    g.font = `700 ${size}px ${FONT_NUM}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.fillText(text, w / 2, h / 2 + 6);
    g.fillStyle = 'rgba(0,0,0,0.3)'; for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 2);
  });
}
export const flicker = [];
export function gate(i, color, label, tall) {
  const size = label.length > 2 ? 104 : 190;
  const g = new THREE.Group();
  g.position.copy(P[i]); g.rotation.y = Math.atan2(TAN[i].x, TAN[i].z);
  const h = tall ? 12.5 : 10, half = WIDTH[i] / 2 + 1.6;
  for (const side of [1, -1]) {
    box(g, 1.7, h, 1.7, M.dark, side * half, h / 2, 0);
    box(g, 2.1, 0.5, 2.1, M.mid, side * half, 0.25, 0);
    box(g, 0.2, h - 1.4, 1.76, glow(color, 2.4), side * (half - 0.82), h / 2, 0);
  }
  box(g, half * 2 + 1.7, 1.4, 2.1, M.dark, 0, h + 0.4, 0);
  box(g, half * 2 + 1.8, 0.18, 2.2, glow(color, 2.6), 0, h - 0.3, 0);
  // 글자판은 문 위쪽 가운데에 제 비율로 건다. 문 아래는 비워 둬서 뒤따르는 카메라를 가리지 않는다.
  const signH = 4.6, signW = signH * 2;
  const sign = add(g, new THREE.PlaneGeometry(signW, signH), additive(color, 1.5, hologram(label, color, 512, 256, size), 0.8), 0, h - 0.5 - signH / 2, 0);
  sign.rotation.y = Math.PI;   // 달려오는 쪽에서 바로 읽히게 뒤집는다.
  flicker.push(sign.material);
  const lamp = new THREE.PointLight(C(color), 1.5, 40, 1.5); lamp.position.set(0, h - 1.5, 0); g.add(lamp);
  scene.add(g);
}
gate(BOUNDS[1], SECTIONS[1].color, '2', false);
gate(BOUNDS[2], SECTIONS[2].color, '3', false);
gate(BOUNDS[3], SECTIONS[3].color, '4', false);
gate(0, '#ffd84d', 'FINISH', true);
{
  const checker = repeatTex(canvasTexture(256, 64, (g) => { for (let y = 0; y < 2; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#f4f6fb' : '#0c0e14'; g.fillRect(x * 32, y * 32, 32, 32); } }), 2.5, 1);
  const line = add(scene, new THREE.PlaneGeometry(WIDTH[0], 2.2), std('#ffffff', 0.2, 0.6, { map: checker }), P[0].x, TRACK_Y + 0.02, P[0].z);
  line.rotation.set(-Math.PI / 2, 0, Math.atan2(TAN[0].x, TAN[0].z) + Math.PI / 2); line.castShadow = false;
  // 갑판에 칠한 구간 번호.
  for (const [text, x, z, s] of [['1', 0, -34, 0], ['2', 24, -27, 1], ['3', 0, 34, 2], ['4', -34, 0, 3]]) {
    const paint = canvasTexture(256, 256, (g) => { g.font = `700 230px ${FONT_NUM}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = SECTIONS[s].color; g.fillText(text, 128, 138); });
    const decal = add(scene, new THREE.PlaneGeometry(11, 11), new THREE.MeshStandardMaterial({ map: paint, transparent: true, opacity: 0.7, metalness: 0.3, roughness: 0.7, depthWrite: false }), x, 0.03, z);
    decal.rotation.x = -Math.PI / 2; decal.castShadow = false;
  }
}

// ---------- 중앙 원자로와 구조물 ----------
export const spinners = [];
{
  const core = new THREE.Group(); core.position.set(0, 0, 0); scene.add(core);
  cyl(core, 8.5, 9.5, 1.2, M.dark, 0, 0.6, 0, 32);
  cyl(core, 6, 7, 1.6, M.mid, 0, 2.0, 0, 32);
  cyl(core, 2.2, 3.4, 5, M.dark, 0, 5.3, 0, 12);
  add(core, new THREE.TorusGeometry(8.9, 0.14, 8, 64), glow('#59c8ff', 2.4), 0, 1.25, 0).rotation.x = Math.PI / 2;
  add(core, new THREE.SphereGeometry(2.3, 32, 16), glow('#9fe8ff', 3.2), 0, 10.2, 0);
  for (const [r, tilt, speed] of [[4.2, 0.4, 0.6], [5.2, -0.7, -0.4], [6.2, 1.2, 0.28]]) {
    const ring = add(core, new THREE.TorusGeometry(r, 0.22, 8, 64), M.light, 0, 10.2, 0);
    ring.rotation.set(Math.PI / 2 + tilt, tilt * 0.6, 0); ring.userData.speed = speed; spinners.push(ring);
  }
  const beam = cyl(core, 0.5, 1.1, 150, additive('#59c8ff', 1.4, null, 0.5), 0, 86, 0, 16);
  beam.material.side = THREE.DoubleSide;
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; box(core, 0.9, 3.4, 0.9, M.mid, Math.cos(a) * 6.3, 3.2, Math.sin(a) * 6.3); box(core, 0.5, 0.5, 0.5, glow('#59c8ff', 3), Math.cos(a) * 6.3, 5.1, Math.sin(a) * 6.3); }
  const lamp = new THREE.PointLight(C('#59c8ff'), 2.4, 50, 1.4); lamp.position.set(0, 10, 0); core.add(lamp);
  // 원자로에서 각 구간 문으로 뻗는 도관. 문 안쪽 기둥 앞에서 멈춘다.
  for (const b of [0, BOUNDS[1], BOUNDS[2], BOUNDS[3]]) {
    const to = P[b].clone().addScaledVector(NOR[b], -(WIDTH[b] / 2 + 1.6)); to.y = 0;
    const len = to.length() - 10, ang = Math.atan2(to.x, to.z);
    const pipe = box(scene, 1.1, 0.7, len, M.dark, (to.x / to.length()) * (9 + len / 2), 0.35, (to.z / to.length()) * (9 + len / 2)); pipe.rotation.y = ang;
    const line = box(scene, 0.22, 0.08, len, glow('#59c8ff', 2), pipe.position.x, 0.74, pipe.position.z); line.rotation.y = ang;
  }
}
// 착륙장과 수송선.
{
  const pad = new THREE.Group(); pad.position.set(-22, 0, 22); scene.add(pad);
  cyl(pad, 7.5, 8, 0.5, M.dark, 0, 0.25, 0, 32);
  add(pad, new THREE.RingGeometry(6.2, 6.7, 48), glow('#ffd84d', 1.8), 0, 0.52, 0).rotation.x = -Math.PI / 2;
  add(pad, new THREE.RingGeometry(2.6, 2.9, 32), glow('#ffd84d', 1.4), 0, 0.52, 0).rotation.x = -Math.PI / 2;
  const ship = new THREE.Group(); ship.position.y = 1.9; ship.rotation.y = 0.6; pad.add(ship);
  box(ship, 3.2, 1.8, 7, M.light, 0, 0.4, 0); box(ship, 2.4, 1.2, 2.4, M.mid, 0, 0.6, 4.2); box(ship, 2.2, 0.5, 0.2, M.glass, 0, 1.0, 5.4);
  for (const s of [1, -1]) { const wing = box(ship, 4.5, 0.25, 3.2, M.mid, s * 3.6, 0.5, -1.2); wing.rotation.z = s * -0.18; const eng = cyl(ship, 0.8, 0.9, 3.2, M.dark, s * 2.2, -0.2, -3.4, 12); eng.rotation.x = Math.PI / 2; box(ship, 0.25, 1.4, 0.25, M.dark, s * 1.6, -1.2, 1.4); }
  box(ship, 0.2, 1.8, 1.8, M.mid, 0, 1.9, -2.8);
}
// 저장 탱크, 관제탑, 레이더, 조명 기둥.
for (const [x, z, r, h] of [[20, 24, 3, 6.5], [26, 29, 2.4, 5], [21, 31.5, 1.8, 4], [-24, -24, 2.2, 5]]) {
  cyl(scene, r, r, h, M.mid, x, h / 2, z, 24); add(scene, new THREE.SphereGeometry(r, 24, 12, 0, TAU, 0, Math.PI / 2), M.light, x, h, z);
  add(scene, new THREE.TorusGeometry(r + 0.05, 0.1, 6, 32), glow('#ff8a2a', 1.8), x, h * 0.55, z).rotation.x = Math.PI / 2;
}
{
  const tower = new THREE.Group(); tower.position.set(21, 0, -28); scene.add(tower);
  box(tower, 7, 4, 6, M.dark, 0, 2, 0); box(tower, 5, 5, 4.4, M.mid, 0, 6.5, 0); box(tower, 6, 1.6, 5.4, M.dark, 0, 9.8, 0);
  box(tower, 6.1, 0.7, 5.5, glow('#9fd8ff', 1.5), 0, 9.9, 0); box(tower, 0.3, 6, 0.3, M.light, 1.6, 13.6, 0.8); box(tower, 0.4, 0.4, 0.4, glow('#ff3f3f', 4), 1.6, 16.8, 0.8);
  const dish = new THREE.Group(); dish.position.set(-1.4, 11.6, -0.6); tower.add(dish);
  const bowl = add(dish, new THREE.SphereGeometry(2, 20, 10, 0, TAU, 0, 1.0), M.light, 0, 0.4, 0); bowl.rotation.x = Math.PI + 0.9;
  dish.userData.speed = 0.5; spinners.push(dish);
}
export const POLES = [[-66, -66], [-26, -68.5], [26, -68.5], [66, -66], [68, -22], [68, 22], [66, 66], [0, 68.5], [-66, 66], [-68.5, 0]];
for (const [x, z] of POLES) {
  box(scene, 0.4, 9, 0.4, M.mid, x, 4.5, z); box(scene, 1.8, 0.4, 0.9, M.dark, x, 9.1, z); box(scene, 1.5, 0.12, 0.7, glow('#fff3d6', 3), x, 8.86, z);
}

// 큰 설비: 발전기, 저장탑 무리, 격납고.
export function generator(x, z, rot) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
  box(g, 7, 0.8, 4.6, M.dark, 0, 0.4, 0);
  for (const dz of [-1.1, 1.1]) {
    const drum = cyl(g, 1.15, 1.15, 5, M.mid, -0.4, 1.95, dz, 20); drum.rotation.z = Math.PI / 2;
    for (const dx of [-2.2, -0.4, 1.4]) add(g, new THREE.TorusGeometry(1.18, 0.07, 6, 28), glow('#59c8ff', 2.2), dx, 1.95, dz).rotation.y = Math.PI / 2;
  }
  box(g, 1.3, 2.6, 3.6, M.dark, 2.8, 2.1, 0); box(g, 0.08, 1.2, 2.6, glow('#9fe8ff', 1.8), 3.46, 2.4, 0);
  cyl(g, 0.22, 0.22, 3.4, M.light, -3.1, 2.5, 1.4, 8); cyl(g, 0.22, 0.22, 2.6, M.light, -3.1, 2.1, -1.4, 8);
}
export function silos(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  for (const [dx, dz, h] of [[0, 0, 7], [2.3, 0.6, 5.2], [-1.6, 1.9, 4.2], [0.8, -2.2, 6]]) {
    cyl(g, 1.05, 1.05, h, M.mid, dx, h / 2, dz, 20); add(g, new THREE.SphereGeometry(1.05, 20, 10, 0, TAU, 0, Math.PI / 2), M.light, dx, h, dz);
    add(g, new THREE.TorusGeometry(1.08, 0.07, 6, 28), glow('#ff8a2a', 2), dx, h * 0.7, dz).rotation.x = Math.PI / 2;
  }
  box(g, 5.4, 0.16, 0.9, M.dark, 0.4, 3.6, 0.2);
}
export function hangar(x, z, rot) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
  const shell = add(g, new THREE.CylinderGeometry(3.2, 3.2, 9, 24, 1, false, 0, Math.PI), M.mid, 0, 0, 0); shell.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  for (const dz of [-4.5, 4.5]) { const cap = add(g, new THREE.CircleGeometry(3.2, 24, 0, Math.PI), M.dark, 0, 0, dz); if (dz < 0) cap.rotation.y = Math.PI; }
  box(g, 3.2, 0.14, 0.1, glow('#ffd84d', 2.4), 0, 2.2, 4.56); box(g, 0.14, 2.1, 0.1, glow('#ffd84d', 2.4), 0, 1.1, 4.56);
  for (const dz of [-3, -1, 1, 3]) add(g, new THREE.TorusGeometry(3.24, 0.09, 6, 24, Math.PI), M.dark, 0, 0, dz);
}
generator(60, 60, -0.3); generator(-60, -61, 0.12); generator(-8, 24, 0.5);
silos(61, -61); silos(-61, 61);
hangar(-27, -6, 0); hangar(6, 31, Math.PI / 2);

// 바닥에 번지는 빛. 조명 기둥, 문, 원자로 주변을 색으로 물들인다.
{
  const falloff = canvasTexture(128, 128, (g) => { const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64); grad.addColorStop(0, 'rgba(255,255,255,0.9)'); grad.addColorStop(0.4, 'rgba(255,255,255,0.3)'); grad.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = grad; g.fillRect(0, 0, 128, 128); });
  const pool = (x, z, r, color, k, y = 0.06) => { const m = add(scene, new THREE.CircleGeometry(r, 32), additive(color, k, falloff, 1), x, y, z); m.rotation.x = -Math.PI / 2; };
  pool(0, 0, 30, '#3fb6ff', 0.5);
  pool(-22, 22, 13, '#ffd84d', 0.28);
  for (const [x, z] of POLES) { const d = Math.hypot(x, z); pool(x - (x / d) * 5, z - (z / d) * 5, 5.5, '#ffe2b0', 0.5); }
  [0, 1, 2, 3].forEach((n) => { const i = BOUNDS[n], color = n === 0 ? '#ffd84d' : SECTIONS[n].color; pool(P[i].x, P[i].z, 16, color, 0.5, TRACK_Y + 0.04); });
}

// 화물과 잔구조물: 트랙과 주요 시설을 피해 무리 지어 뿌린다.
{
  const keepOut = [[0, 0, 13], [-22, 22, 10], [21, -28, 8], [22, 28, 9], [-24, -24, 4], [60, 60, 6], [-60, -61, 6], [-8, 24, 6], [61, -61, 6], [-61, 61, 5], [-27, -6, 7], [6, 31, 7], [0, -69, 15], [24, 72, 6]];
  const free = (x, z, margin) => {
    if (!insideDeck(x, z) || !insideDeck(x + 3, z) || !insideDeck(x - 3, z) || !insideDeck(x, z + 3) || !insideDeck(x, z - 3)) return false;
    for (const [kx, kz, kr] of keepOut) if (Math.hypot(x - kx, z - kz) < kr) return false;
    for (let i = 0; i < N; i += 3) if (Math.hypot(x - P[i].x, z - P[i].z) < WIDTH[i] / 2 + margin) return false;
    return true;
  };
  const crates = [];
  const tints = ['#3a4254', '#566074', '#2a3040', '#454d5e', '#7f8aa3', '#323a4c', '#566074', '#2a3040', '#c98a2b', '#8f3b2a'];
  let guard = 0;
  while (crates.length < 380 && guard++ < 6000) {
    const cx = rr(-70, 70), cz = rr(-70, 70);
    if (!free(cx, cz, 4.5)) continue;
    const count = Math.floor(rr(3, 9));
    for (let k = 0; k < count; k++) {
      const x = cx + rr(-2.6, 2.6), z = cz + rr(-2.6, 2.6);
      if (!free(x, z, 3)) continue;
      const w = rr(0.9, 2.2), h = rr(0.6, 1.6), d = rr(0.9, 2.2);
      crates.push([x, h / 2, z, rr(0, 0.5), w, h, d, tints[Math.floor(rnd() * tints.length)]]);
      if (rnd() > 0.6) crates.push([x + rr(-0.2, 0.2), h + 0.45, z + rr(-0.2, 0.2), rr(0, 0.6), w * 0.7, 0.9, d * 0.7, tints[Math.floor(rnd() * tints.length)]]);
    }
  }
  const inst = new THREE.InstancedMesh(BOX, std('#ffffff', 0.6, 0.5), crates.length);
  const dummy = new THREE.Object3D();
  crates.forEach(([x, y, z, ang, sx, sy, sz, tint], n) => { dummy.position.set(x, y, z); dummy.rotation.set(0, ang, 0); dummy.scale.set(sx, sy, sz); dummy.updateMatrix(); inst.setMatrixAt(n, dummy.matrix); inst.setColorAt(n, C(tint)); });
  inst.castShadow = true; inst.receiveShadow = true; scene.add(inst);
}
// 떠다니는 암석.
{
  const rockGeo = new THREE.IcosahedronGeometry(1, 2);
  {
    // 위치에서 변위를 구하므로 겹친 꼭짓점이 같이 움직여 틈이 생기지 않는다.
    const pos = rockGeo.attributes.position, v = new THREE.Vector3();
    for (let k = 0; k < pos.count; k++) {
      v.fromBufferAttribute(pos, k);
      const bump = 1 + 0.22 * Math.sin(v.x * 3.1 + v.y * 1.7) + 0.16 * Math.sin(v.y * 4.3 + v.z * 2.9) + 0.12 * Math.sin(v.z * 5.7 + v.x * 3.3);
      v.multiplyScalar(bump); pos.setXYZ(k, v.x, v.y, v.z);
    }
    rockGeo.computeVertexNormals();
  }
  const rocks = new THREE.InstancedMesh(rockGeo, std('#3d3846', 0.15, 0.95, { flatShading: true }), 70);
  const dummy = new THREE.Object3D();
  for (let n = 0; n < 70; n++) {
    const a = rnd() * TAU, r = rr(170, 330);
    dummy.position.set(Math.cos(a) * r, rr(-50, 20), Math.sin(a) * r * 0.8);
    dummy.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6);
    const s = rr(1, 6); dummy.scale.set(s, s * rr(0.6, 1), s * rr(0.6, 1.2)); dummy.updateMatrix(); rocks.setMatrixAt(n, dummy.matrix);
  }
  scene.add(rocks);
}
