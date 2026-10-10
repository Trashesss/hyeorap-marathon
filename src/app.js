// 게임을 굴리는 곳: 계산(sim)을 한 걸음씩 돌리고, 그 결과를 화면(view)과 버튼, 알림에 잇는다.
// 지금은 계산이 이 브라우저 안에서 돈다. 서버가 붙으면 game 자리에 서버의 상태를 받아 오는 것이 들어온다.
import { createGame, DEFAULT_RULES } from './sim/game.js';
import { ACT, ATTACKS, ATTACK_OF } from './sim/characters.js';
import { canvas } from './view/renderer.js';
import { camera, sun } from './view/world.js';
import { createStage, drawBoard } from './view/stage.js';
import * as screen from './view/screen.js';

const game = createGame();
const MY_INDEX = 0;
const me = game.units[MY_INDEX];
const stage = createStage(game, MY_INDEX);
screen.whenCardChanges(stage.showPodRange);
const $ = (id) => document.getElementById(id);
const clockEl = $('clock'), bannerEl = $('banner'), toastEl = $('toast'), skillEl = $('skill'), hitEl = $('hit'), padEl = $('pad');
const introEl = $('intro'), watchEl = $('watch'), menuEl = $('menu'), appEl = $('app'), nameEl = $('name'), roomNameEl = $('roomName'), pipEl = screen.pipEl;

// spectate는 도감·구경용 자유 카메라, follow는 골인한 뒤 지켜보는 선수.
let spectate = true, follow = null;
let shownSecond = -1, shownPad = '', shownWatch = '', shownScores = '', toastUntil = 0, introUntil = 0, noteUntil = 0;
const held = new Set(), stick = { x: 0, y: 0 };
let skillHeld = false, hitHeld = false;
const pip = { target: null, until: 0 };

// ---------- 저장되는 것 ----------
// 이름과 설정, 마지막으로 만든 방은 이 브라우저에 기억해 둔다. 저장이 막힌 환경에서도 그냥 돌아간다.
function esc(text) { return String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
function loadSaved() { try { return JSON.parse(localStorage.getItem('bp-track') || '{}') || {}; } catch (error) { return {}; } }
const stored = loadSaved();
const prefs = Object.assign({ name: '', quality: 'high', range: 1, pip: 1 }, stored.prefs);
const room = Object.assign({ name: '', players: 8, seconds: 300, goal: 100, bots: 1, open: 1 }, stored.room);
const remember = () => { try { localStorage.setItem('bp-track', JSON.stringify({ prefs, room })); } catch (error) { /* 저장이 막혀 있으면 이번에만 쓴다 */ } };
const myName = () => prefs.name.trim() || '나';

// ---------- 점수판, 알림, 카드 ----------
// 점수판: 화면 구석의 목록과 갑판의 전광판이 같은 점수를 보여준다. 내용이 달라졌을 때만 다시 그린다.
function renderScores(force) {
  const ranked = game.units.filter((u) => u.rank >= 0).sort((a, b) => (a.rank || 99) - (b.rank || 99) || b.score - a.score);
  const text = ranked.map((u) => `${u.index}:${u.player.name}:${u.id}:${u.score}:${u.rank}`).join('|') + game.rules.goal;
  if (!force && text === shownScores) return;
  shownScores = text;
  $('scores').innerHTML = ranked.map((u) => `<li${u.human ? ' class="you"' : ''}><i style="--dot:${u.player.color}"></i><span>${esc(u.player.name)}</span><em>${u.rank ? '골인' : u.type.name}</em><b>${u.rank ? u.rank + '등' : u.score}</b></li>`).join('');
  drawBoard(ranked, game.rules.goal);
}
function toast(text) { toastEl.textContent = text; toastEl.hidden = false; toastUntil = performance.now() + 2200; }
// 설명 카드: 지금 모는 캐릭터의 설명을 늘 띄워 둔다. 바뀐 직후에는 테두리가 잠깐 빛난다. 골인한 뒤에는 지켜보는 선수의 것을 보여준다.
function introduce() {
  const pawn = me.rank ? follow : me.riding || me; if (!pawn) return;
  const info = pawn.type;
  introEl.style.setProperty('--dot', info.color);
  introEl.querySelector('.kind').textContent = me.rank ? `${pawn.player.name} · ${info.kind}` : me.riding ? `빙의 중 · ${info.kind}` : info.kind;
  introEl.querySelector('h2').textContent = info.name;
  introEl.querySelector('.skill').textContent = info.skill;
  introEl.querySelector('.how').textContent = info.how;
  introEl.querySelector('.score').textContent = info.score;
  introEl.querySelector('.hp').textContent = info.hp === Infinity ? '무적' : info.hp;
  introEl.querySelector('.atk').textContent = screen.attackLine(pawn.id);
  introEl.hidden = spectate || game.mode !== 'play'; introEl.classList.add('fresh'); introUntil = performance.now() + 4200;
}
// 잠깐 떴다 사라지는 알림. 판을 멈추지 않는다.
function announce(title, sub, color) {
  bannerEl.classList.add('note');
  bannerEl.querySelector('strong').textContent = title; bannerEl.querySelector('span').textContent = sub;
  $('ranks').innerHTML = '';
  bannerEl.style.setProperty('--dot', color); bannerEl.hidden = false; noteUntil = performance.now() + 3600;
}
// 판이 끝났을 때의 순위표.
function showResult(order) {
  const mine = order.indexOf(me) + 1;
  bannerEl.classList.remove('note');
  bannerEl.querySelector('strong').textContent = mine === 1 ? '1등입니다' : `${order[0].player.name} 1등`;
  bannerEl.querySelector('span').textContent = mine === 1 ? '한 판 더 하시겠습니까?' : `나는 ${mine}등`;
  $('ranks').innerHTML = order.map((u, n) => `<li${u.human ? ' class="you"' : ''}><em>${n + 1}등</em><i style="--dot:${u.player.color}"></i><span>${esc(u.player.name)}</span><b>${u.rank ? '골인' : u.score + '점'}</b></li>`).join('');
  bannerEl.style.setProperty('--dot', mine === 1 ? '#5ad1ff' : order[0].player.color);
  bannerEl.hidden = false; introEl.hidden = padEl.hidden = watchEl.hidden = true; $('stick').hidden = true;
}

// ---------- 카메라가 따라갈 대상 ----------
// 조종 중에는 내 몸(실려 가면 납치범, 빙의 중이면 뺏은 몸), 골인한 뒤에는 지켜보는 선수.
function subjectBody() {
  const subject = me.rank ? follow : me; if (!subject) return null;
  return subject.carriedBy || subject.riding || subject;
}
function snapCamera() { const body = subjectBody(); if (body && !spectate) screen.chase(body, 0, true); }
// 골인한 뒤의 관전: 남은 선수를 한 명씩 따라가며 본다.
function cycleWatch(dir) {
  const pool = game.units.filter((o) => !o.rank);
  const at = pool.indexOf(follow);
  follow = !pool.length ? null : at < 0 ? [...pool].sort((a, b) => b.score - a.score)[0] : pool[(at + dir + pool.length) % pool.length];
  shownWatch = ''; introduce(); snapCamera();
}
function setSpectate(on) {
  spectate = on;
  screen.controls.enabled = on;
  $('views').hidden = !on;
  padEl.hidden = on || game.mode !== 'play' || !!me.rank;
  watchEl.hidden = on || game.mode !== 'play' || !me.rank;
  $('stick').hidden = padEl.hidden;
  introEl.hidden = on || game.mode !== 'play';
  $('look').textContent = on ? (me.rank ? '선수 따라가며 보기' : '조종으로 돌아가기') : '도감·구경';
  camera.fov = on ? 36 : 52; camera.updateProjectionMatrix();
  if (on) screen.setView('all', true); else { screen.showCard('none'); screen.stopFlying(); snapCamera(); }
  canvas.style.cursor = on ? '' : 'grab';
  held.clear(); skillHeld = hitHeld = false;
}

// ---------- 능력 결과 화면 ----------
// 사건이 가리킨 대상을 계산 쪽의 실제 물건으로. 폭탄은 든 사람을, 실려 가는 사람은 납치범을 따라간다.
function pipBody(target) {
  if (!target) return null;
  if (target.kind === 'spot') return target;
  const thing = { unit: game.units, bomb: game.bombs, site: game.sites, turret: game.turrets }[target.kind][target.index];
  const body = target.kind === 'bomb' ? thing.carrier : thing;
  if (!body) return null;
  return body.carriedBy || (body.rank ? null : body);
}
function showPip(event) {
  // 한 번에 여럿이 걸리면 첫 사람을 보여준다.
  if (game.mode !== 'play' || spectate || me.rank || !prefs.pip || pip.setAt === game.time) return;
  Object.assign(pip, { target: event.target, until: game.time + event.seconds, setAt: game.time });
  pipEl.querySelector('b').textContent = event.caption; pipEl.hidden = false; screen.sizePip();
}
function drawPip() {
  if (pipEl.hidden) return;
  const body = pipBody(pip.target);
  if (!body || game.time > pip.until || game.mode !== 'play' || spectate || me.rank) { pipEl.hidden = true; return; }
  screen.renderPip(body);
}

// ---------- 계산이 남긴 사건 ----------
function handle(event) {
  if (stage.handle(event)) return;
  if (event.type === 'toast') { if (event.unit === MY_INDEX) toast(event.text); }
  else if (event.type === 'pip') { if (event.unit === MY_INDEX) showPip(event); }
  else if (event.type === 'become') { const unit = game.units[event.unit]; if (game.mode === 'play' && (unit === me || unit === me.riding || unit === follow)) introduce(); }
  else if (event.type === 'ride') { if (event.unit === MY_INDEX && game.mode === 'play') introduce(); }
  else if (event.type === 'finish') {
    const unit = game.units[event.unit];
    if (unit === me) {
      announce(`${event.rank}등으로 들어왔습니다`, '남은 선수들을 지켜볼 수 있습니다', '#5ad1ff');
      follow = null; cycleWatch(0); setSpectate(spectate);
    } else {
      announce(`${unit.player.name} ${event.rank}등`, me.rank ? '' : '판은 계속됩니다 · 남은 순위를 노리세요', unit.player.color);
      if (follow === unit) cycleWatch(1);
    }
  } else if (event.type === 'over') showResult(event.order.map((index) => game.units[index]));
}

// ---------- 한 판의 시작과 끝 ----------
function begin(rules) {
  menuEl.hidden = true; appEl.classList.remove('in-menu'); bannerEl.hidden = true; pipEl.hidden = true; $('look').hidden = false;
  follow = null; screen.resetLook();
  game.start({ ...(rules || game.rules) });
  $('ruleLine').textContent = `${game.rules.goal}점을 먼저 모으면 1등. 남은 순위는 ${game.rules.seconds / 60}분까지 겨룹니다.`;
  $('goalLine').textContent = `${game.rules.goal}점 먼저`;
  setSpectate(false);
  introduce();
}
function toMenu() {
  bannerEl.hidden = true; pipEl.hidden = true; $('look').hidden = true;
  follow = null;
  game.demo();
  setSpectate(true);
  showMenu();
}

// ---------- 메인 화면 ----------
function applyPrefs() {
  me.player.name = myName();
  screen.bloom.enabled = prefs.quality !== 'low'; sun.castShadow = prefs.quality !== 'low';
  screen.resize(prefs.quality); renderScores(true);
  for (const seg of menuEl.querySelectorAll('.seg')) {
    const value = seg.dataset.pref ? prefs[seg.dataset.pref] : room[seg.dataset.room];
    for (const b of seg.children) b.setAttribute('aria-pressed', String(b.dataset.value) === String(value));
  }
}
let roomCode = '';
function fillLobby() {
  $('lobbyName').textContent = room.name.trim() || `${myName()}의 방`;
  $('lobbyRules').textContent = `${room.players}명 · ${room.seconds / 60}분 · ${room.goal}점 먼저 · ${room.open ? '누구나 들어올 수 있음' : '초대 코드로만'}`;
  $('lobbyCode').textContent = roomCode;
  $('slots').innerHTML = game.units.slice(0, room.players).map((u, n) => (n === 0
    ? `<li class="you"><i style="--dot:${u.player.color}"></i><b>${esc(myName())}</b><em>방장</em></li>`
    : room.bots ? `<li><i style="--dot:${u.player.color}"></i><b>${esc(u.player.name)}</b><em>봇</em></li>` : '<li class="empty"><i style="--dot:transparent"></i><b>빈자리</b><em>기다리는 중</em></li>')).join('');
  $('startRoom').disabled = !room.bots;
  $('lobbyNote').textContent = room.bots
    ? '사람이 들어오면 그 자리의 봇이 빠집니다. 지금은 서버가 없어 봇과 시작합니다.'
    : '혼자서는 시작할 수 없습니다. 서버가 붙기 전까지는 빈자리를 봇으로 채워야 합니다.';
}
function showScreen(name) {
  for (const part of menuEl.querySelectorAll('.screen')) part.hidden = part.dataset.screen !== name;
  menuEl.scrollTop = 0;
  if (name === 'lobby') { if (!roomCode) roomCode = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join(''); fillLobby(); }
  if (name === 'create') roomCode = '';
}
// 메인 화면에서는 메뉴가 왼쪽을 가리므로 맵을 오른쪽으로 민다.
function showMenu() {
  menuEl.hidden = false; appEl.classList.add('in-menu'); showScreen('home');
  screen.setView('all', true);
  if (canvas.clientWidth > 720) { const shift = 0.2 * camera.position.distanceTo(screen.controls.target); screen.controls.target.x -= shift; camera.position.x -= shift; screen.controls.update(); }
}
// 도감과 맵 둘러보기: 메뉴를 걷고 자유 카메라로.
function browse(view, instant) { menuEl.hidden = true; appEl.classList.remove('in-menu'); screen.setView(view, instant); }
nameEl.value = prefs.name; roomNameEl.value = room.name;
nameEl.addEventListener('input', () => { prefs.name = nameEl.value.slice(0, 8); me.player.name = myName(); remember(); });
roomNameEl.addEventListener('input', () => { room.name = roomNameEl.value.slice(0, 16); remember(); });
menuEl.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  const seg = b.closest('.seg');
  if (seg) {
    const raw = b.dataset.value, value = /^\d+$/.test(raw) ? +raw : raw;
    if (seg.dataset.pref) prefs[seg.dataset.pref] = value; else room[seg.dataset.room] = value;
    remember(); applyPrefs();
  } else if (b.id === 'go') begin(DEFAULT_RULES);
  else if (b.id === 'startRoom') begin({ players: room.players, seconds: room.seconds, goal: room.goal });
  else if (b.dataset.go === 'book') browse('cast');
  else if (b.dataset.go) showScreen(b.dataset.go);
});
$('home').addEventListener('click', toMenu);
$('quit').addEventListener('click', toMenu);
$('again').addEventListener('click', () => begin());
watchEl.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.id === 'replay') begin(); else cycleWatch(b.dataset.watch === 'prev' ? -1 : 1); });
$('look').addEventListener('click', () => setSpectate(!spectate));
window.addEventListener('resize', () => screen.resize(prefs.quality));

// ---------- 입력: 키보드, 그리고 터치 화면의 조이스틱과 버튼 ----------
const KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'f'];
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (game.mode !== 'play' || spectate || !KEYS.includes(k)) return;
  e.preventDefault();
  // 골인한 뒤에는 좌우 키로 지켜볼 선수를 바꾼다.
  if (me.rank) { if (!e.repeat && (k === 'a' || k === 'arrowleft')) cycleWatch(-1); else if (!e.repeat && (k === 'd' || k === 'arrowright')) cycleWatch(1); return; }
  if (!held.has(k)) {
    // 누르는 순간에만 뜻이 있는 입력: 끼인 차 빼기, 고무줄 버티기, 저금통 두드리기.
    if (k === 'a' || k === 'arrowleft') game.wiggle(MY_INDEX, 'L'); else if (k === 'd' || k === 'arrowright') game.wiggle(MY_INDEX, 'R');
    if (k === 'w' || k === 'arrowup') game.pump(MY_INDEX);
    if (k === ' ') game.smash(MY_INDEX);
  }
  held.add(k);
});
window.addEventListener('keyup', (e) => held.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => { held.clear(); skillHeld = hitHeld = false; });
skillEl.addEventListener('pointerdown', (e) => { e.preventDefault(); skillHeld = true; game.smash(MY_INDEX); });
hitEl.addEventListener('pointerdown', (e) => { e.preventDefault(); hitHeld = true; });
for (const type of ['pointerup', 'pointerleave', 'pointercancel']) { skillEl.addEventListener(type, () => { skillHeld = false; }); hitEl.addEventListener(type, () => { hitHeld = false; }); }
{
  const base = $('stick'), knob = base.firstElementChild;
  const move = (e) => {
    const box = base.getBoundingClientRect(), dx = (e.clientX - box.left - box.width / 2) / (box.width / 2), dy = (e.clientY - box.top - box.height / 2) / (box.height / 2);
    const len = Math.max(1, Math.hypot(dx, dy)), wasUp = stick.y > 0.5; stick.x = dx / len; stick.y = -dy / len;
    if (!wasUp && stick.y > 0.5) game.pump(MY_INDEX);
    knob.style.transform = `translate(${stick.x * 34}px, ${-stick.y * 34}px)`;
    if (stick.x < -0.5) game.wiggle(MY_INDEX, 'L'); else if (stick.x > 0.5) game.wiggle(MY_INDEX, 'R');
  };
  const release = () => { stick.x = stick.y = 0; knob.style.transform = ''; };
  base.addEventListener('pointerdown', (e) => { base.setPointerCapture(e.pointerId); move(e); });
  base.addEventListener('pointermove', (e) => { if (base.hasPointerCapture(e.pointerId)) move(e); });
  for (const type of ['pointerup', 'pointercancel']) base.addEventListener(type, release);
}
// 시점: 조종 중에 화면을 끌면 카메라가 돈다. 휠은 거리, 두 번 누르면 원래대로. 이동 방향은 바뀌지 않는다.
{
  let dragging = null, lastX = 0, lastY = 0;
  const chasing = () => !spectate && game.mode === 'play';
  canvas.addEventListener('pointerdown', (e) => { if (!chasing() || dragging !== null) return; dragging = e.pointerId; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; });
  canvas.addEventListener('pointermove', (e) => { if (e.pointerId !== dragging) return; screen.turnLook(e.clientX - lastX, e.clientY - lastY); lastX = e.clientX; lastY = e.clientY; });
  for (const type of ['pointerup', 'pointercancel']) canvas.addEventListener(type, (e) => { if (e.pointerId !== dragging) return; dragging = null; canvas.style.cursor = spectate ? '' : 'grab'; });
  canvas.addEventListener('wheel', (e) => { if (!chasing()) return; e.preventDefault(); screen.zoomLook(e.deltaY); }, { passive: false });
  canvas.addEventListener('dblclick', () => { if (chasing()) screen.resetLook(); });
}
// 지금 쥐고 있는 키와 조이스틱을 계산에 넘길 입력 한 벌로.
function readInput() {
  const on = (...keys) => (keys.some((k) => held.has(k)) ? 1 : 0);
  return {
    f: Math.max(-1, Math.min(1, on('w', 'arrowup') - on('s', 'arrowdown') + stick.y)),
    a: Math.max(-1, Math.min(1, on('d', 'arrowright') - on('a', 'arrowleft') + stick.x)),
    cast: held.has(' ') || skillHeld, strike: held.has('f') || hitHeld,
  };
}

// ---------- 화면 구석의 표시 ----------
function updateHud() {
  const time = game.time;
  const second = Math.max(0, Math.ceil(game.timeLeft));
  if (second !== shownSecond) { shownSecond = second; clockEl.textContent = `${Math.floor(second / 60)}:${String(second % 60).padStart(2, '0')}`; }
  if (!toastEl.hidden && performance.now() > toastUntil) toastEl.hidden = true;
  if (introUntil && performance.now() > introUntil) { introUntil = 0; introEl.classList.remove('fresh'); }
  if (game.mode === 'play' && !bannerEl.hidden && performance.now() > noteUntil) bannerEl.hidden = true;
  renderScores();
  // 관전 중인 선수.
  if (!watchEl.hidden && follow) {
    const text = `${me.rank}|${follow.player.name}|${follow.id}|${follow.score}`;
    if (text !== shownWatch) {
      shownWatch = text;
      watchEl.querySelector('.who').textContent = `${follow.player.name} · ${follow.type.name}`;
      watchEl.querySelector('.gain').textContent = `${me.rank}등으로 골인 · 관전 중 · ${follow.score}점`;
      watchEl.style.setProperty('--dot', follow.player.color);
    }
  }
  // 조종 버튼: 지금 몰고 있는 몸의 캐릭터와 능력, 남은 대기 시간, 체력.
  if (padEl.hidden) return;
  const pawn = me.riding || me;
  const act = pawn.id === 'van' && pawn.cargo ? '내리기' : pawn.id === 'liar' && pawn.lied ? '머리 박기' : pawn.id === 'piggy' ? `깨기 ${Math.floor(pawn.smash)}/30` : pawn.id === 'hen' ? `병아리 보내기 ${pawn.chicks}` : ACT[pawn.id];
  const wait = Math.max(0, pawn.nextSkill - time);
  const state = me.carriedBy ? '납치당함' : me.riddenBy ? '몸을 뺏김' : pawn.frozenUntil > time ? '얼어붙음' : pawn.burrowUntil > time ? '머리 박는 중' : pawn.ticketUntil > time ? '딱지 떼임' : pawn.jam > 0 ? `끼임 ${pawn.jam}` : '';
  const hp = pawn.type.hp === Infinity ? '무적' : `체력 ${Math.max(0, Math.ceil(pawn.hp))}/${pawn.type.hp}`;
  const carrying = game.bombs.some((bomb) => bomb.live && bomb.carrier === pawn);
  const text = `${pawn.id}|${act}|${act ? Math.ceil(wait) : ''}|${state}|${hp}|${carrying}|${me.riding ? 1 : 0}`;
  if (text === shownPad) return;
  shownPad = text;
  padEl.querySelector('.who').textContent = (me.riding ? '빙의 중: ' : '') + pawn.type.name;
  padEl.querySelector('.gain').textContent = `${hp} · 골인 ${pawn.type.score}`;
  padEl.querySelector('.tip').textContent = carrying ? '폭탄을 들고 있습니다. 남에게 몸을 비비세요.' : state || pawn.type.how;
  skillEl.querySelector('b').textContent = state || act || '누르는 능력 없음';
  skillEl.querySelector('span').textContent = !act || state ? '' : wait > 0 ? `${Math.ceil(wait)}초` : '스페이스';
  skillEl.disabled = !act || !!state || wait > 0;
  hitEl.querySelector('b').textContent = pawn.type.atk ? ATTACKS[ATTACK_OF[pawn.id] || 'smash'].name : '공격 불가';
  hitEl.querySelector('span').textContent = pawn.type.atk ? 'F' : '';
  hitEl.disabled = !pawn.type.atk || !!state;
  padEl.style.setProperty('--dot', pawn.type.color);
}

// ---------- 한 프레임 ----------
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  // 조종 중일 때만 내 입력을 넘긴다. 구경 중이면 내 캐릭터는 서 있는다.
  const steering = game.mode === 'play' && !spectate && !me.rank;
  game.step(dt, steering ? { [MY_INDEX]: readInput() } : {});
  for (const event of game.events.splice(0)) handle(event);
  // 공격 범위는 조종 중이고, 공격할 수 있는 캐릭터일 때만 그린다.
  const pawn = me.riding || me;
  stage.sync(dt, { pawn: steering && !me.carriedBy && pawn.type.atk && prefs.range ? pawn : null, spinning: screen.spinning });
  updateHud();
  const body = spectate ? null : subjectBody();
  if (body) screen.chase(body, dt, false);
  screen.render(dt, spectate);
  drawPip();
  requestAnimationFrame(frame);
}

export function start() {
  applyPrefs();
  // 전광판 글씨는 웹 폰트가 준비된 뒤에 한 번 더 그린다.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => renderScores(true));
  // 확인용: 주소에 #s1~#s4를 붙이면 해당 구간에서, #play를 붙이면 바로 조종 상태로 시작한다.
  const initial = location.hash.slice(1);
  if (initial === 'play') begin(DEFAULT_RULES); else if (screen.VIEWS[initial]) browse(initial, true); else showMenu();
  // 시험용: 주소에 ?debug를 붙이면 안쪽 상태를 콘솔에서 만질 수 있다.
  if (new URLSearchParams(location.search).has('debug')) window.__track = { game, stage, look: screen.look, get follow() { return follow; } };
  frame();
}
