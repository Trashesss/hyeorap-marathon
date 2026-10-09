// 화면을 만드는 데 두루 쓰는 도구: 색, 재질, 도형, 캔버스 텍스처.
export const TAU = Math.PI * 2;
export const UP = new THREE.Vector3(0, 1, 0);
// 조명 계산은 선형 색 공간에서 하므로 화면용 색을 선형으로 바꿔 쓴다.
export const C = (hex) => new THREE.Color(hex).convertSRGBToLinear();
let seed = 20261008;
export const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
export const rr = (a, b) => a + (b - a) * rnd();
export const FONT_KR = '"IBM Plex Sans KR", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
export const FONT_NUM = '"Chakra Petch", "IBM Plex Sans KR", sans-serif';

export function canvasTexture(w, h, draw, srgb = true) {
  const el = document.createElement('canvas');
  el.width = w; el.height = h;
  draw(el.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(el);
  if (srgb) tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = 8;
  return tex;
}
export const repeatTex = (tex, x, y) => { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(x, y); return tex; };

export const std = (hex, metalness, roughness, extra) =>
  new THREE.MeshStandardMaterial(Object.assign({ color: C(hex), metalness, roughness }, extra));
// 1보다 밝은 색은 블룸에 걸려 빛나 보인다.
export const glow = (hex, k = 2.2, extra) => new THREE.MeshBasicMaterial(Object.assign({ color: C(hex).multiplyScalar(k) }, extra));
export const additive = (hex, k, map, opacity = 1) =>
  glow(hex, k, { map, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });

export const BOX = new THREE.BoxGeometry(1, 1, 1);
export function add(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  const lit = !mat.isMeshBasicMaterial;
  m.castShadow = lit; m.receiveShadow = lit;
  parent.add(m);
  return m;
}
export function box(parent, w, h, d, mat, x, y, z) { const m = add(parent, BOX, mat, x, y, z); m.scale.set(w, h, d); return m; }
export function cyl(parent, r1, r2, h, mat, x, y, z, seg = 16) { return add(parent, new THREE.CylinderGeometry(r1, r2, h, seg), mat, x, y, z); }
export function limb(parent, a, b, r, mat) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const m = cyl(parent, r, r, dir.length(), mat, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, 8);
  m.quaternion.setFromUnitVectors(UP, dir.normalize());
  return m;
}

// ---------- 캐릭터 모델에 쓰는 도구 ----------
// 계열 없이 로봇, 사물, 과일이 섞여 나온다. 둥글고 통통한 장난감 비례로 만들고 표정으로 성격을 낸다.
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const toy = (hex, roughness = 0.5, extra) =>
  new THREE.MeshPhysicalMaterial(Object.assign({ color: C(hex), roughness, metalness: 0, clearcoat: 0.45, clearcoatRoughness: 0.4 }, extra));
export const ball = (parent, r, mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = add(parent, new THREE.SphereGeometry(r, 28, 20), mat, x, y, z); m.scale.set(sx, sy, sz); return m; };
export const spun = (parent, profile, mat, x, y, z) => add(parent, new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(r, h)), 36), mat, x, y, z);
export function rbox(parent, w, h, d, radius, mat, x, y, z) {
  const b = Math.min(radius, w / 2, h / 2, d / 2) * 0.7, hw = w / 2 - b, hh = h / 2 - b, cr = Math.max(0.01, Math.min(radius - b * 0.5, hw, hh));
  const s = new THREE.Shape();
  s.moveTo(-hw + cr, -hh); s.lineTo(hw - cr, -hh); s.quadraticCurveTo(hw, -hh, hw, -hh + cr); s.lineTo(hw, hh - cr); s.quadraticCurveTo(hw, hh, hw - cr, hh);
  s.lineTo(-hw + cr, hh); s.quadraticCurveTo(-hw, hh, -hw, hh - cr); s.lineTo(-hw, -hh + cr); s.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);
  const geo = new THREE.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 6 });
  geo.translate(0, 0, -(d - 2 * b) / 2);
  return add(parent, geo, mat, x, y, z);
}
export const WHITE = toy('#e4e6ea', 0.25), PUPIL = std('#0b0d13', 0.2, 0.3), SKIN = toy('#f2a184', 0.6, { clearcoat: 0.15 });
// 눈: 흰자, 눈동자, 반짝임. lid를 주면 위에서 덮는 눈꺼풀이 생겨 졸리거나 거만한 표정이 된다.
export function eye(parent, x, y, z, r, opts = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  ball(g, r, WHITE, 0, 0, 0);
  const [lx, ly] = opts.look || [0, 0];
  ball(g, r * (opts.pupil || 0.5), PUPIL, lx * r * 0.5, ly * r * 0.5, r * 0.62);
  ball(g, r * 0.14, glow('#ffffff', 2), lx * r * 0.5 + r * 0.16, ly * r * 0.5 + r * 0.2, r * 1.02);
  if (opts.lid) add(g, new THREE.SphereGeometry(r * 1.07, 24, 12, 0, TAU, 0, opts.lid), opts.lidMat, 0, 0, 0).rotation.x = opts.lidTilt === undefined ? 0.5 : opts.lidTilt;
  return g;
}
export const GOLD = std('#ffcf5a', 0.9, 0.25);
export const eyes = (parent, y, z, spread, r, opts) => [1, -1].map((s) => eye(parent, s * spread, y, z, r, opts));
export const label = (text, fg, bg, w = 256, h = 128, size = 84) => canvasTexture(w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.font = `700 ${size}px ${FONT_KR}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fg; g.fillText(text, w / 2, h / 2 + 4);
});
