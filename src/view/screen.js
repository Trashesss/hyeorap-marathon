// 화면에 내보내는 일: 후처리, 작은 결과 화면, 카메라, 도감 카드.
import { canvas, renderer } from './renderer.js';
import { camera, scene } from './world.js';
import { POD_Z, lineup, stageLineup } from './stage.js';
import { DEEP, locate } from '../sim/track.js';
import { INFO } from '../sim/characters.js';

// ---------- 화면 합성 ----------
// 밝은 값까지 담는 버퍼에 그린 뒤 번짐, 톤 매핑, 윤곽 다듬기를 차례로 거친다.
const halfFloat = () => new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
const TONE = {
  uniforms: { tDiffuse: { value: null }, exposure: { value: 1.05 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float exposure; varying vec2 vUv;
    vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
    void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb * exposure; vec2 q = vUv - 0.5; c *= 1.0 - dot(q, q) * 0.6; c = pow(aces(c), vec3(1.0 / 2.2)); gl_FragColor = vec4(c, 1.0); }`,
};
const composer = new THREE.EffectComposer(renderer, halfFloat());
composer.addPass(new THREE.RenderPass(scene, camera));
export const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(4, 4), 0.75, 0.55, 0.92);
composer.addPass(bloom);
composer.addPass(new THREE.ShaderPass(TONE));
const fxaa = new THREE.ShaderPass(THREE.FXAAShader);
composer.addPass(fxaa);

// 능력 결과 화면: 내 능력이 낸 결과를 작은 화면으로 잠깐 보여준다. 같은 장면을 두 번째 카메라로 한 번 더 그린다.
export const pipEl = document.getElementById('pip');
const pipCam = new THREE.PerspectiveCamera(44, 1.6, 1, 5000);
const pipComposer = new THREE.EffectComposer(renderer, halfFloat());
pipComposer.addPass(new THREE.RenderPass(scene, pipCam));
pipComposer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(4, 4), 0.75, 0.55, 0.92));
pipComposer.addPass(new THREE.ShaderPass(TONE));
export function sizePip() {
  const w = pipEl.clientWidth, h = pipEl.clientHeight; if (!w || !h) return;
  pipCam.aspect = w / h; pipCam.updateProjectionMatrix();
  pipComposer.setPixelRatio(renderer.getPixelRatio()); pipComposer.setSize(w, h);
}
const at = {}, ahead = {};
// body: 트랙 위의 자리(s, lane)를 가진 것. 그 뒤 위에서 내려다본 모습을 결과 화면 테두리 안에 그린다.
export function renderPip(body) {
  locate(body.s, body.lane, at);
  const len = Math.hypot(at.tx, at.tz) || 1, tx = at.tx / len, tz = at.tz / len, narrow = DEEP[at.index];
  pipCam.position.set(at.x - tx * (10 - narrow * 5), 7.5 + narrow * 8, at.z - tz * (10 - narrow * 5)); pipCam.lookAt(at.x + tx * 2, 1.6, at.z + tz * 2);
  const box = pipEl.getBoundingClientRect(), view = canvas.getBoundingClientRect();
  const left = box.left - view.left + pipEl.clientLeft, bottom = view.bottom - box.bottom + pipEl.clientTop, w = pipEl.clientWidth, h = pipEl.clientHeight;
  renderer.setViewport(left, bottom, w, h); renderer.setScissor(left, bottom, w, h); renderer.setScissorTest(true);
  // 그림자는 큰 화면을 그릴 때 만든 것을 그대로 쓴다.
  renderer.shadowMap.autoUpdate = false;
  pipComposer.render();
  renderer.shadowMap.autoUpdate = true;
  renderer.setScissorTest(false); renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
}

// ---------- 카메라 ----------
export const controls = new THREE.OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.minDistance = 8; controls.maxDistance = 520; controls.maxPolarAngle = 1.45;
controls.autoRotate = true; controls.autoRotateSpeed = 0.18;
export const VIEWS = {
  all: { pos: [0, 178, 158], target: [0, 0, 6] },
  cast: { pos: [0, 56, POD_Z + 70], target: [0, 1, POD_Z - 2] },
  s1: { pos: [-8, 32, -2], target: [2, 1, -52] },
  s2: { pos: [2, 36, 8], target: [52, 1, 0] },
  s3: { pos: [0, 42, 106], target: [0, 1, 50] },
  s4: { pos: [-120, 38, 24], target: [-52, 1, 0] },
};
lineup.forEach((entry, n) => {
  const top = INFO[entry.id].top, reach = 6.5 + top * 1.25;
  const shift = reach * 0.12;
  VIEWS['c' + n] = { pos: [entry.x + shift, top * 0.5 + 2.2, entry.z + reach], target: [entry.x + shift, top * 0.46 + 0.4, entry.z] };
});

// 도감: 캐릭터를 하나씩 가까이서 보며 읽는 카드.
const card = document.getElementById('card');
document.getElementById('cast').innerHTML = '<button type="button" data-view="cast" aria-pressed="false">캐릭터 전체</button>' +
  lineup.map((entry, n) => `<button type="button" data-view="c${n}" aria-pressed="false"><i style="--dot:${INFO[entry.id].color}"></i>${INFO[entry.id].name}</button>`).join('');
let shown = -1;
export function showCard(name) {
  shown = /^c\d+$/.test(name) ? +name.slice(1) : -1;
  const entry = lineup[shown];
  card.hidden = !entry;
  stageLineup(name === 'cast' || !!entry, entry);
  if (!entry) return;
  const info = INFO[entry.id];
  card.style.setProperty('--dot', info.color);
  card.querySelector('h2').textContent = info.name;
  card.querySelector('.kind').textContent = info.kind;
  card.querySelector('.skill').textContent = info.skill;
  card.querySelector('.how').textContent = info.how;
  card.querySelector('.counter').textContent = info.counter;
  card.querySelector('.hp').textContent = info.hp === Infinity ? '무적' : `${info.hp} · 한 대에 ${info.atk >= 99 ? '즉사' : info.atk || '공격 못 함'}`;
  card.querySelector('.score').textContent = info.score;
  card.querySelector('.origin').textContent = info.origin;
  card.querySelector('.count').textContent = `${shown + 1} / ${lineup.length}`;
  const chip = document.querySelector(`#cast [data-view="c${shown}"]`);
  if (chip && chip.scrollIntoView) chip.scrollIntoView({ block: 'nearest', inline: 'center' });
}
card.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b || shown < 0) return;
  setView('c' + ((shown + (b.dataset.step === 'next' ? 1 : lineup.length - 1)) % lineup.length));
});
let fly = null;
// 도감에서 한 명을 보는 동안에는 그 모델이 천천히 돈다.
export let spinning = false;
export function setView(name, instant) {
  const view = VIEWS[name];
  const to = new THREE.Vector3(...view.pos), target = new THREE.Vector3(...view.target);
  // 세로로 긴 화면에서는 맵 전체가 들어오도록 더 멀리 물러난다.
  if (name === 'all' || name === 'cast') to.sub(target).multiplyScalar(Math.max(1, 1.45 / camera.aspect)).add(target);
  if (instant) { camera.position.copy(to); controls.target.copy(target); controls.update(); fly = null; }
  else fly = { fromPos: camera.position.clone(), fromTarget: controls.target.clone(), to, target, t: 0 };
  controls.autoRotate = name === 'all';
  spinning = /^c\d+$/.test(name);
  for (const b of document.querySelectorAll('#views button')) b.setAttribute('aria-pressed', b.dataset.view === name);
  showCard(name);
}
document.getElementById('views').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setView(b.dataset.view); });
controls.addEventListener('start', () => { controls.autoRotate = false; fly = null; });
export function stopFlying() { controls.autoRotate = false; fly = null; }

// quality: 'high' | 'mid' | 'low'. 화면 배율의 상한을 정한다.
export function resize(quality) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, w < 700 ? 1.5 : 2, { high: 2, mid: 1.5, low: 1 }[quality] || 2);
  renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
  composer.setPixelRatio(dpr); composer.setSize(w, h);
  fxaa.material.uniforms.resolution.value.set(1 / (w * dpr), 1 / (h * dpr));
  camera.aspect = w / h; camera.updateProjectionMatrix();
  if (!pipEl.hidden) sizePip();
}

// 조종 카메라: 따라갈 몸의 뒤 위에서 진행 방향을 바라본다.
const camWant = new THREE.Vector3(), camLook = new THREE.Vector3(), camLookWant = new THREE.Vector3();
export function chase(body, dt, snap) {
  locate(body.s, body.lane, at);
  locate(body.s + 5, 0, ahead);
  const len = Math.hypot(ahead.tx, ahead.tz) || 1, tx = ahead.tx / len, tz = ahead.tz / len, narrow = DEEP[at.index];
  camWant.set(at.x - tx * (18.5 - narrow * 9.5), 12.5 + narrow * 11, at.z - tz * (18.5 - narrow * 9.5)); camLookWant.set(at.x + tx * (9 - narrow * 5), 1.6, at.z + tz * (9 - narrow * 5));
  const k = snap ? 1 : 1 - Math.exp(-dt * 4.5);
  camera.position.lerp(camWant, k); camLook.lerp(camLookWant, k); camera.lookAt(camLook);
}

// 한 프레임을 그린다. free는 자유 카메라(도감·구경)인지.
export function render(dt, free) {
  if (fly) {
    fly.t = Math.min(1, fly.t + dt / 1.3);
    const e = fly.t * fly.t * (3 - 2 * fly.t);
    camera.position.lerpVectors(fly.fromPos, fly.to, e);
    controls.target.lerpVectors(fly.fromTarget, fly.target, e);
    if (fly.t >= 1) fly = null;
  }
  if (free) controls.update();
  // 멀리서 볼수록 가까운 쪽 한계를 밀어 깊이 정밀도를 지킨다. 그러지 않으면 길과 갑판이 겹쳐 줄무늬가 생긴다.
  const near = free ? Math.max(1, Math.min(40, camera.position.distanceTo(controls.target) * 0.12)) : 1;
  if (Math.abs(near - camera.near) > camera.near * 0.05) { camera.near = near; camera.updateProjectionMatrix(); }
  composer.render();
}
