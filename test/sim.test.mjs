// 계산 모듈만으로 한 판을 끝까지 돌려 본다. 브라우저도 화면도 필요 없다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/sim/game.js';
import { TOTAL, WIDTH, indexAt } from '../src/sim/track.js';
import { INFO, ROSTER } from '../src/sim/characters.js';

// 같은 씨앗이면 같은 판이 나오도록, 정해진 순서의 난수를 쓴다.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const DT = 1 / 30;
// 사람 자리를 봇처럼 몰아 줄 단순한 입력: 계속 앞으로 가며 능력과 공격을 누른다.
const pushing = (frame) => ({ 0: { f: 1, a: Math.sin(frame / 40) * 0.6, cast: frame % 45 === 0, strike: frame % 20 === 0 } });

function play(seed, rules, input = pushing) {
  const game = createGame({ random: seeded(seed) });
  const seen = {};
  game.start(rules);
  let frame = 0;
  while (game.mode === 'play' && frame < 30 * 60 * 12) {
    game.step(DT, input(frame++));
    for (const event of game.events.splice(0)) seen[event.type] = (seen[event.type] || 0) + 1;
  }
  return { game, seen, frame };
}

test('한 판이 시간 안에 끝나고 순위가 빠짐없이 매겨진다', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const { game, seen } = play(seed, { players: 8, seconds: 300, goal: 100 });
    assert.equal(game.mode, 'over');
    assert.equal(seen.over, 1);
    assert.ok(game.timeLeft <= 300 && game.timeLeft > -1);
    for (const u of game.units) {
      assert.ok(Number.isFinite(u.score), '점수는 숫자여야 한다');
      assert.ok(Number.isFinite(u.s) && u.s >= 0 && u.s < TOTAL + 1, '거리는 트랙 안에 있어야 한다');
      assert.ok(Math.abs(u.lane) <= WIDTH[indexAt(u.s)] / 2 + 0.5, '좌우 위치는 길 안에 있어야 한다');
      assert.ok(INFO[u.id], '아는 캐릭터여야 한다');
    }
    const ranks = game.units.map((u) => u.rank).filter((r) => r > 0).sort((a, b) => a - b);
    assert.deepEqual(ranks, ranks.map((_, n) => n + 1), '골인 순위는 1부터 차례로 매겨진다');
  }
});

test('같은 씨앗과 같은 입력이면 같은 결과가 나온다', () => {
  const a = play(7, { players: 8, seconds: 60, goal: 100 }), b = play(7, { players: 8, seconds: 60, goal: 100 });
  assert.deepEqual(a.game.units.map((u) => [u.id, u.score, u.rank, Math.round(u.s * 1000)]), b.game.units.map((u) => [u.id, u.score, u.rank, Math.round(u.s * 1000)]));
});

test('방 인원보다 뒤 자리는 비워 둔다', () => {
  const { game } = play(3, { players: 4, seconds: 30, goal: 50 });
  assert.deepEqual(game.units.map((u) => u.rank >= 0), [true, true, true, true, false, false, false, false]);
  assert.equal(game.rules.goal, 50);
});

test('목표 점수를 채우면 순위를 받고, 판은 남은 사람끼리 이어진다', () => {
  const game = createGame({ random: seeded(11) });
  game.start({ players: 8, seconds: 300, goal: 100 });
  game.step(DT);
  game.units[3].score = 100; game.finish(game.units[3]);
  assert.equal(game.units[3].rank, 1);
  assert.equal(game.mode, 'play');
  for (let n = 0; n < 60; n++) game.step(DT);
  assert.equal(game.mode, 'play');
  game.units[0].score = 100; game.finish(game.units[0]);
  assert.equal(game.units[0].rank, 2);
});

test('사건은 그대로 네트워크로 보낼 수 있는 자료다', () => {
  const game = createGame({ random: seeded(5) });
  game.start({ players: 8, seconds: 40, goal: 100 });
  const all = [];
  for (let frame = 0; frame < 30 * 40; frame++) { game.step(DT, pushing(frame)); all.push(...game.events.splice(0)); }
  assert.ok(all.length > 20);
  assert.deepEqual(JSON.parse(JSON.stringify(all)), all);
});

test('다리 가장자리를 넘으면 떨어져 그 구간 처음에서 새 캐릭터로 시작한다', () => {
  const game = createGame({ random: seeded(9) });
  game.start({ players: 2, seconds: 300, goal: 100 });
  const me = game.units[0];
  game.units[1].s = 300; game.units[1].sec = 3;
  game.become(me, 'blink'); me.s = TOTAL / 4 + 30; me.lane = 0; me.sec = 1; me.safeUntil = 0;
  let fell = false;
  for (let n = 0; n < 90 && !fell; n++) {
    game.step(DT, { 0: { f: 0, a: 1, cast: false, strike: false } });
    fell = game.events.splice(0).some((e) => e.type === 'toast' && e.text.includes('떨어졌습니다'));
  }
  assert.ok(fell, '옆으로 계속 가면 떨어져야 한다');
  assert.ok(me.s < TOTAL / 4 + 10, '2구간 출발점으로 돌아간다');
});

test('명단의 모든 캐릭터로 바뀔 수 있고, 능력을 써도 계산이 깨지지 않는다', () => {
  const game = createGame({ random: seeded(21) });
  game.start({ players: 8, seconds: 300, goal: 1000 });
  for (const id of ROSTER) {
    if (INFO[id].special && id !== 'moldhouse') continue;
    game.become(game.units[0], id); game.units[0].nextSkill = 0; game.units[0].safeUntil = 0;
    for (let n = 0; n < 45; n++) game.step(DT, { 0: { f: 1, a: 0, cast: true, strike: true } });
    game.events.length = 0;
    for (const u of game.units) assert.ok(Number.isFinite(u.s) && Number.isFinite(u.lane) && Number.isFinite(u.score), id);
  }
});

test('계산 모듈은 브라우저와 three.js에 기대지 않는다', async () => {
  const fs = await import('node:fs');
  const dir = new URL('../src/sim/', import.meta.url);
  for (const file of fs.readdirSync(dir)) {
    const code = fs.readFileSync(new URL(file, dir), 'utf8').replace(/\/\/.*$/gm, '');
    assert.ok(!/\b(document|window|THREE|localStorage|performance)\b/.test(code), `${file}이 화면 쪽 기능을 쓰고 있다`);
    for (const [, from] of code.matchAll(/from '([^']+)'/g)) assert.ok(from.startsWith('./'), `${file}이 계산 폴더 밖(${from})을 불러온다`);
  }
});

test('리드미의 캐릭터 표가 캐릭터 자료와 같다', async () => {
  const fs = await import('node:fs');
  const { render } = await import('../scripts/characters-doc.mjs');
  const readme = fs.readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  assert.equal(render(readme), readme, 'npm run docs:characters 를 돌려 표를 다시 만들어야 한다');
});
