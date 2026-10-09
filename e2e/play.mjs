// 브라우저에서 실제로 돌려 보는 시험. 크롬을 화면 없이 띄워 메뉴부터 판이 끝날 때까지 눌러 본다.
//   npm run test:e2e
// 크롬이 다른 곳에 있으면 CHROME 환경 변수로 경로를 준다. 화면 갈무리는 e2e/out에 남는다.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, 'out');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 5199, DEBUG_PORT = 9341;
const [W, H] = (process.argv[2] || '1440x860').split('x').map(Number);
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const server = spawn(process.execPath, [path.join(here, '../scripts/serve.mjs'), String(PORT)], { stdio: 'ignore' });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'hyeorap-e2e-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profile}`, '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
let stopped = false;
const stop = () => {
  if (stopped) return; stopped = true;
  chrome.kill(); server.kill();
  // 크롬이 닫히는 중이라 지워지지 않으면 임시 폴더에 그냥 둔다.
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (error) { /* 운영체제가 치운다 */ }
};
process.on('exit', stop);
await sleep(4000);

const pages = await (await fetch(`http://localhost:${DEBUG_PORT}/json`)).json();
const ws = new WebSocket(pages.find((page) => page.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve) => { ws.onopen = resolve; });
let seq = 0; const pending = new Map(), problems = [];
ws.onmessage = (message) => {
  const data = JSON.parse(message.data);
  if (data.id) pending.get(data.id)?.(data);
  if (data.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(data.params.type)) problems.push(`${data.params.type}: ${data.params.args.map((arg) => arg.value ?? arg.description).join(' ').slice(0, 300)}`);
  if (data.method === 'Runtime.exceptionThrown') problems.push('exception: ' + (data.params.exceptionDetails.exception?.description ?? data.params.exceptionDetails.text).slice(0, 600));
};
const send = (method, params = {}) => new Promise((resolve) => { const id = ++seq; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });
const js = async (expression) => {
  const reply = (await send('Runtime.evaluate', { expression, returnByValue: true })).result;
  if (reply.exceptionDetails) problems.push('evaluate: ' + (reply.exceptionDetails.exception?.description || reply.exceptionDetails.text).slice(0, 300));
  return reply.result.value;
};
const shot = async (name) => fs.writeFileSync(path.join(out, name + '.png'), Buffer.from((await send('Page.captureScreenshot', {})).result.data, 'base64'));
const key = (type, k, code, vk) => send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk });
const click = (selector) => js(`document.querySelector(${JSON.stringify(selector)}).click()`);
const type = (id, text) => js(`{ const el = document.getElementById(${JSON.stringify(id)}); el.value = ${JSON.stringify(text)}; el.dispatchEvent(new Event('input', { bubbles: true })); }`);
const hud = () => js(`JSON.stringify({ mode: __track.game.mode, clock: document.getElementById('clock').textContent, goal: document.getElementById('goalLine').textContent,
  intro: document.getElementById('intro').hidden ? '' : document.querySelector('#intro h2').textContent, pad: document.getElementById('pad').hidden ? '' : document.querySelector('#pad .who').textContent,
  pip: document.getElementById('pip').hidden ? '' : document.querySelector('#pip b').textContent, watch: document.getElementById('watch').hidden ? '' : document.querySelector('#watch .who').textContent,
  banner: document.getElementById('banner').hidden ? '' : document.getElementById('banner').className + ' ' + document.getElementById('banner').innerText.replace(/\\n/g, ' '),
  toast: document.getElementById('toast').hidden ? '' : document.getElementById('toast').textContent,
  board: [...document.querySelectorAll('#scores li')].map((li) => li.innerText.replace(/\\n/g, ' ')).join(' / '), menu: !document.getElementById('menu').hidden })`).then(JSON.parse);
const checks = [];
const check = (name, ok, detail = '') => { checks.push({ name, ok: !!ok }); console.log(`${ok ? '✔' : '✖'} ${name}${detail ? '  ' + detail : ''}`); };

await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: `http://localhost:${PORT}/?debug` });
await sleep(5000);

// 메인 화면과 방 만들기.
let state = await hud(); await shot('1-home');
check('메인 화면이 뜨고 배경에서 봇이 돈다', state.menu && state.mode === 'demo');
await type('name', '혈압왕');
await click('[data-go=create]'); await type('roomName', '협곡 연습');
await click('[data-room=players] [data-value="4"]'); await click('[data-room=seconds] [data-value="180"]'); await click('[data-room=goal] [data-value="50"]'); await click('[data-room=bots] [data-value="1"]');
await click('[data-go=lobby]'); await sleep(300); await shot('2-lobby');
check('대기실에 네 자리가 보인다', await js(`document.querySelectorAll('#slots li').length`) === 4);
await click('#startRoom'); await sleep(1500);
state = await hud(); await shot('3-room');
check('방 설정대로 판이 열린다', state.mode === 'play' && state.goal === '50점 먼저' && state.clock.startsWith('2:5') && state.board.split(' / ').length === 4, state.board);
check('점수판에 내 이름이 나온다', state.board.includes('혈압왕'));
check('설명 카드와 조종 버튼이 떠 있다', state.intro && state.pad === state.intro, state.intro);

// 달리기, 공격, 능력 결과 화면.
await js(`{ const g = __track.game, me = g.units[0]; g.become(me, 'exile'); me.hp = 999; me.nextSkill = 0; g.units[2].score = 30; for (const u of g.units) u.safeUntil = 0; }`);
await key('keyDown', 'w', 'KeyW', 87); await key('keyDown', 'f', 'KeyF', 70); await sleep(600);
await key('keyDown', ' ', 'Space', 32); await sleep(500); await key('keyUp', ' ', 'Space', 32);
state = await hud(); await shot('4-skill');
check('유배를 쓰면 능력 결과 화면이 뜬다', state.pip.startsWith('유배'), state.pip);
await sleep(2500); await key('keyUp', 'f', 'KeyF', 70);
const before = await js(`__track.game.units[0].s`); await sleep(1000);
check('앞으로 누르고 있으면 나아간다', (await js(`__track.game.units[0].s`)) !== before);
await key('keyUp', 'w', 'KeyW', 87);

// 마우스로 시점 돌리기: 화면을 오른쪽으로 끌면 시점이 돌고, 두 번 누르면 돌아온다. 이동 방향은 그대로다.
const mouse = (type, x, y, extra = {}) => send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, ...extra });
await mouse('mousePressed', W * 0.6, H * 0.45); await mouse('mouseMoved', W * 0.6 + 60, H * 0.45 + 10); await mouse('mouseMoved', W * 0.6 + 200, H * 0.45 + 30); await mouse('mouseReleased', W * 0.6 + 200, H * 0.45 + 30);
await sleep(500); await shot('4b-look');
const turned = await js(`JSON.stringify(__track.look)`).then(JSON.parse);
check('화면을 끌면 시점이 돈다', Math.abs(turned.yaw - 1.2) < 0.05 && turned.pitch > 0.1, `yaw ${turned.yaw.toFixed(2)}`);
const lane = await js(`__track.game.units[0].lane`);
await key('keyDown', 'w', 'KeyW', 87); await sleep(500); await key('keyUp', 'w', 'KeyW', 87);
check('시점을 돌려도 W는 트랙을 따라 간다', Math.abs((await js(`__track.game.units[0].lane`)) - lane) < 0.6);
await js(`document.getElementById('view').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))`);
check('두 번 누르면 시점이 돌아온다', (await js(`__track.look.yaw`)) === 0);

// 다리에서 떨어지기.
await js(`{ const g = __track.game, me = g.units[0]; g.become(me, 'blink'); me.nextSkill = 1e9; me.s = 94.56 + 30; me.lane = 0; me.sec = 1; me.safeUntil = 0; }`);
await key('keyDown', 'd', 'KeyD', 68); await sleep(1500); await key('keyUp', 'd', 'KeyD', 68);
state = await hud();
check('다리 옆으로 나가면 떨어진다', state.toast.includes('떨어졌습니다'), state.toast);

// 남이 먼저 골인해도 판은 이어지고, 내가 골인하면 관전으로 바뀐다.
await js(`{ const g = __track.game; g.units[1].score = 50; g.finish(g.units[1]); }`); await sleep(400);
state = await hud(); await shot('5-first');
check('남이 1등을 해도 판이 멈추지 않는다', state.mode === 'play' && state.banner.includes('1등') && state.pad);
await js(`{ const g = __track.game; g.units[0].score = 50; g.finish(g.units[0]); }`); await sleep(1200);
state = await hud(); await shot('6-watch');
check('내가 골인하면 남은 선수를 지켜본다', state.mode === 'play' && state.watch && !state.pad && state.board.includes('2등'), state.watch);
const watched = state.watch; await key('keyDown', 'd', 'KeyD', 68); await key('keyUp', 'd', 'KeyD', 68); await sleep(600);
check('좌우 키로 지켜볼 선수를 바꾼다', (await hud()).watch !== watched);
await js(`__track.game.endMatch()`); await sleep(600);
state = await hud(); await shot('7-over');
check('판이 끝나면 순위표가 뜬다', state.mode === 'over' && state.banner.includes('4등') && state.banner.includes('다시 하기'));

// 메인으로 돌아갔다가 빠른 시작.
await click('#quit'); await sleep(800);
state = await hud();
check('메인으로 돌아오면 이름이 남아 있고 여덟 명이 다시 돈다', state.menu && state.mode === 'demo' && (await js(`document.getElementById('name').value`)) === '혈압왕' && state.board.split(' / ').length === 8);
await click('#go'); await sleep(1500);
state = await hud(); await shot('8-quick');
check('빠른 시작은 여덟 명, 5분, 100점이다', state.mode === 'play' && state.goal === '100점 먼저' && state.board.split(' / ').length === 8 && state.clock.startsWith('4:5'));
await click('#home'); await sleep(400); await click('[data-go=book]'); await sleep(2500); await shot('9-book');
check('도감이 열린다', !(await hud()).menu && (await js(`document.querySelectorAll('#cast button').length`)) > 30);

check('콘솔에 오류가 없다', problems.length === 0, [...new Set(problems)].join(' | '));
ws.close(); stop();
const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} / ${checks.length} 통과`);
process.exit(failed.length ? 1 : 0);
