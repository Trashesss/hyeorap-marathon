// 한 판의 계산. 화면도 브라우저도 모른다: 상태를 바꾸고, 일어난 일을 사건(events)으로 남길 뿐이다.
// 브라우저에서는 화면 쪽이 상태를 읽어 그리고, 서버에 올리면 같은 코드가 방 하나를 돌린다.
//
// 쓰는 법
//   const game = createGame();
//   game.start({ players: 8, seconds: 300, goal: 100 });
//   game.step(dt, { 0: { f: 1, a: 0, cast: false, strike: false } });   // 사람이 모는 자리만 입력을 준다
//   for (const event of game.events.splice(0)) { ... }                    // 팝업, 알림, 효과
import { TOTAL, LEG, WIDTH, CANYON, START_S, WALL_S, overChasm, indexAt, sectionAt, sectionStart, halfAt, fitLane } from './track.js';
import { INFO, ROSTER, SIZE, WHEELED, FIXED_GAIN, ODDS, PLAYERS } from './characters.js';

export const SPEED = 2.0, FREEZE_RADIUS = 7, BODY = 1.3;
// 두리안과 다리 포탑의 자리.
export const BLOCK_AT = 2 * LEG + (CANYON[0] + CANYON[1]) / 2, BRIDGE_AT = LEG + 9;
export const DEFAULT_RULES = { players: 8, seconds: 300, goal: 100 };

export function createGame({ random = Math.random } = {}) {
  // 한 판의 규칙. 빠른 시작은 기본값으로, 방을 만들면 방 설정으로 바뀐다.
  const rules = { ...DEFAULT_RULES };
  const events = [];
  // mode: demo(시작 전 봇끼리 도는 배경), play(진행 중), over(판 종료).
  const game = { rules, events, mode: 'demo', time: 0, timeLeft: rules.seconds, finished: 0 };
  let now = 0;

  // ---------- 상태 ----------
  const units = PLAYERS.map((player, index) => ({
    kind: 'unit', index, player: { ...player }, human: !!player.you,
    id: null, type: null, r: BODY, hp: 0, score: 0, rank: 0,
    s: 0, lane: 0, vs: 0, vl: 0, sec: 0, phase: random() * 10, bornAt: 0,
    frozenUntil: 0, slowUntil: 0, stunUntil: 0, safeUntil: 0, ticketUntil: 0, burrowUntil: 0, touchedAt: 0, slimeAt: 0,
    lungeAt: -9, hurtAt: -9, nextSkill: 0, nextHit: 0,
    grudge: null, grudgeUntil: 0, carriedBy: null, cargo: null, cargoUntil: 0, riding: null, riddenBy: null, ridingUntil: 0,
    pump: 0, smash: 0, jam: 0, jamAt: 0, wiggle: '', chicks: 0, lied: false, flipAt: undefined,
    ai: { lane: 0, think: 0, delay: 1 },
  }));
  // 두리안: 협곡을 통째로 막는 장애물. 공격하거나 여럿이 밀어야 부서지고, 조금 뒤 다시 나타난다.
  const durian = { kind: 'durian', index: 0, fixed: true, thing: true, ram: true, s: BLOCK_AT, lane: 0, r: 2.35, vs: 0, hp: 12, downUntil: 0, bornAt: 0 };
  // 1구간의 수정 벽: 출발선 앞을 통째로 막는다. 때리거나 몸으로 밀어 부수면 그 칸만 열리고, 25초 뒤 다시 자란다.
  const crystals = Array.from({ length: 7 }, (_, index) => ({ kind: 'crystal', index, fixed: true, thing: true, ram: true, s: WALL_S, lane: (index - 3) * (20 / 7), r: 10 / 7, vs: 0, hp: 3, up: true, downUntil: 0, bornAt: -9 }));
  // 로동로봇의 가건물: 길을 막고, 다 지어지면 지은 사람에게 점수를 준다.
  const sites = Array.from({ length: 4 }, (_, index) => ({ kind: 'site', index, fixed: true, thing: true, s: 0, lane: 0, r: 1.8, vs: 0, hp: 0, owner: null, doneAt: 0, startedAt: 0, live: false }));
  // 달팽이의 점액 자국.
  const slimes = Array.from({ length: 14 }, (_, index) => ({ kind: 'slime', index, s: 0, lane: 0, until: -1, owner: null }));
  // 병아리 유치원이 내보내는 병아리.
  const chicks = Array.from({ length: 6 }, (_, index) => ({ kind: 'chick', index, s: 0, lane: 0, r: 0.6, owner: null, live: false }));
  // 포탑. 앞의 둘은 2구간 다리 양옆에 늘 서 있는 맵 포탑이고, 나머지는 대포집이 까는 것이다.
  const turrets = Array.from({ length: 8 }, (_, index) => ({ kind: 'turret', index, thing: true, fixed: true, solid: index >= 2, map: index < 2, s: 0, lane: 0, r: 1.0, vs: 0, hp: 0, owner: null, until: 0, nextShot: 0, live: false, backAt: 0, aim: null }));
  // 분신술의 가짜들. 주인과 같은 색 표시를 달고 있어 겉으로는 구분되지 않는다.
  const decoys = Array.from({ length: 6 }, (_, index) => ({ kind: 'decoy', index, thing: true, s: 0, lane: 0, r: 1.3, vs: 0, hp: 1, owner: null, until: 0, live: false }));
  // 폭탄 돌리기의 폭탄. 든 사람 머리 위에 떠 있다.
  const bombs = Array.from({ length: 2 }, (_, index) => ({ kind: 'bomb', index, live: false, carrier: null, fuseUntil: 0, passAt: 0, by: null }));
  // 돼지 저금통이 깨지며 흩어지는 동전.
  const coins = Array.from({ length: 8 }, (_, index) => ({ kind: 'coin', index, s: 0, lane: 0, live: false }));
  Object.assign(game, { units, durian, crystals, sites, slimes, chicks, turrets, decoys, bombs, coins });

  // ---------- 사건 ----------
  // 사건은 숫자와 글자만 담는다. 그대로 네트워크로 보낼 수 있어야 하기 때문이다.
  const emit = (type, data) => { events.push(Object.assign({ type }, data)); };
  // 어떤 것이 지금 서 있는 자리. 실려 가는 사람은 납치범의 자리다.
  const spot = (o) => { const at = o.carriedBy || o; return { s: at.s, lane: at.lane }; };
  const GOAL = { s: 0, lane: 0 };
  const ref = (o) => (o.kind ? { kind: o.kind, index: o.index } : { kind: 'spot', s: o.s, lane: o.lane });
  const popup = (text, color, at) => emit('popup', { text, color, ...spot(at) });
  const burst = (at, size) => emit('burst', { size, ...spot(at) });
  const playing = (u) => !!u && u.human && game.mode === 'play';
  // 사람이 모는 자리에만 알린다.
  const tell = (u, text) => { if (playing(u)) emit('toast', { unit: u.index, text }); };
  // 능력 결과 화면: 그 능력을 쓴 사람에게 대상을 작은 화면으로 보여 달라고 알린다.
  const show = (u, target, caption, seconds) => { if (playing(u) && target) emit('pip', { unit: u.index, target: ref(target), caption, seconds: seconds || 3.4 }); };

  // ---------- 거리와 대상 ----------
  const gapAhead = (from, to) => (to.s - from.s + TOTAL) % TOTAL;
  const span = (a, b) => { let ds = b.s - a.s; if (ds > TOTAL / 2) ds -= TOTAL; else if (ds < -TOTAL / 2) ds += TOTAL; return Math.hypot(ds, b.lane - a.lane); };
  // 무적인 순간: 흐엉, 얼어 있을 때, 막 태어났을 때, 납치당해 실려 갈 때. 이미 골인했거나 자리에 없는 사람도 건드릴 수 없다.
  const safe = (u) => !!u.rank || u.id === 'heuong' || u.frozenUntil > now || u.safeUntil > now || u.burrowUntil > now || !!u.carriedBy;
  const targets = (unit) => units.filter((o) => o !== unit && !safe(o));
  const leader = (unit) => targets(unit).sort((a, b) => b.score - a.score)[0];
  const reachOf = (u) => u.type.reach || 3.6;
  // 분신이 진짜보다 가까우면 능력은 분신에게 날아가 헛돈다.
  const DUD = { dud: true };
  function popDecoy(d, quiet) {
    if (!d.live) return;
    d.live = false;
    if (!quiet) popup('펑', '#c7ccd6', d);
  }
  function decoyFor(unit, limit, measure) {
    for (const d of decoys) if (d.live && d.owner !== unit && measure(unit, d) < limit) { popDecoy(d); tell(unit, '분신이 대신 맞았습니다'); return true; }
    return false;
  }
  const nearestAhead = (unit, range, ok) => {
    let best = null; for (const o of targets(unit)) { const gap = gapAhead(unit, o); if (gap < range && (!ok || ok(o)) && (!best || gap < best.gap)) best = { o, gap }; }
    if (!ok && decoyFor(unit, best ? best.gap : range, gapAhead)) return DUD;
    return best && best.o;
  };
  const nearestAny = (unit, range) => {
    let best = null; for (const o of targets(unit)) { const gap = span(unit, o); if (gap < range && (!best || gap < best.gap)) best = { o, gap }; }
    if (decoyFor(unit, best ? best.gap : Math.min(range, 30), span)) return DUD;
    return best && best.o;
  };

  // ---------- 캐릭터 바꾸기, 맞기, 죽기 ----------
  function pickType(section) {
    const options = ROSTER.filter((id) => !INFO[id].special && (id !== 'jackpot' || section === 3));
    let roll = random() * options.reduce((sum, id) => sum + (ODDS[id] || 1), 0);
    for (const id of options) { roll -= ODDS[id] || 1; if (roll <= 0) return id; }
    return options[0];
  }
  function unride(u) {
    const o = u.riding; if (!o) return;
    u.riding = null; o.riddenBy = null;
    tell(u, '빙의가 풀렸습니다'); tell(o, '몸을 되찾았습니다');
    emit('ride', { unit: u.index });
  }
  // 납치범이 태운 사람을 내린다. 다리 위라면 떨어져 죽는다.
  function drop(van, onPurpose) {
    const o = van.cargo; if (!o) return;
    van.cargo = null; o.carriedBy = null; o.s = van.s; o.lane = van.lane; o.sec = sectionAt(o.s);
    if (onPurpose && overChasm(indexAt(van.s))) { o.safeUntil = 0; die(o, '다리에서 떨어졌습니다'); }
    else o.stunUntil = now + 1;
  }
  function become(unit, id) {
    if (unit.cargo) drop(unit, false);
    if (unit.riding) unride(unit); if (unit.riddenBy) unride(unit.riddenBy);
    unit.burrowUntil = 0; unit.lied = false; unit.pump = 0; unit.smash = 0;
    unit.id = id; unit.type = INFO[id]; unit.bornAt = now;
    unit.r = SIZE[id] || BODY; unit.hp = unit.type.hp; unit.jam = 0; unit.chicks = id === 'hen' ? 5 : 0;
    unit.nextSkill = now + (id === 'genki' ? 6 : id === 'pot' ? 30 : id === 'rent' ? 2 : 0.6);
    unit.nextHit = now + 0.4;
    unit.ai.delay = 0.3 + random() * 2.2;
    unit.flipAt = undefined;
    emit('become', { unit: unit.index, id });
  }
  // 누군가에게 능력이 먹혔을 때: 머리 위에 글자를 띄우고, 당한 쪽이 사람이면 알린다. 당한 사람은 10초간 보복할 수 있다.
  function hit(target, word, color, mine, by, quiet) {
    popup(word, color, target);
    if (!quiet && by && by !== target) show(by, target, `${word} → ${target.player.name}`);
    if (by && by !== target) { target.grudge = by; target.grudgeUntil = now + 10; }
    tell(target, by && by !== target ? `${mine} · ${by.player.name}에게 10초간 보복 피해 2배` : mine);
  }
  function die(u, why) {
    popup('아웃', '#ff5d5d', u);
    tell(u, why);
    if (u.carriedBy) { u.carriedBy.cargo = null; u.carriedBy = null; }
    u.s = sectionStart(u.sec); u.vs = 0; u.frozenUntil = u.slowUntil = u.stunUntil = u.ticketUntil = 0;
    emit('respawn', { unit: u.index });
    become(u, pickType(u.sec));
    u.safeUntil = now + 1.5;
  }
  // 피해를 준다. 보복 중이면 두 배. 체력이 바닥나면 그 구간 출발점에서 새 캐릭터로 다시 시작한다.
  function hurt(target, amount, by, why) {
    if (target.thing) { target.hp -= amount; popup('-' + amount, '#ffd84d', target); burst(target, 3.6); return; }
    if (safe(target)) return;
    target.hurtAt = now; burst(target, 4.2);
    if (by && by.grudge === target && now < by.grudgeUntil) amount *= 2;
    if (by) { target.grudge = by; target.grudgeUntil = now + 10; }
    target.hp -= amount;
    if (target.hp <= 0) die(target, why || (by ? `${by.player.name}의 ${by.type.name}에게 죽었습니다` : '죽었습니다'));
    else { popup('-' + Math.min(amount, 9), '#ff5d5d', target); if (by) tell(target, `${by.player.name}에게 맞았습니다 · 10초간 보복 피해 2배`); }
  }
  // 돼지 저금통이 깨진다: 동전 다섯 닢을 흩뿌리고 다른 캐릭터가 된다.
  function smashPig(u) {
    popup('쨍그랑', '#ff9ec4', u);
    let n = 0;
    for (const coin of coins) {
      if (coin.live || n >= 5) continue;
      Object.assign(coin, { live: true, s: (u.s + (n - 2) * 1.7 + TOTAL) % TOTAL, lane: fitLane(u.s, u.lane + (n % 2 ? 1.5 : -1.5), 1) });
      n++;
    }
    tell(u, '저금통이 깨졌습니다');
    become(u, pickType(u.sec)); u.safeUntil = now + 1;
  }

  // ---------- 공격 ----------
  // 공격이 닿는 상대: 가까운 순서로 고르되, 보복할 상대가 닿으면 그쪽을 먼저 친다.
  function hitTarget(u) {
    let best = null;
    const reach = reachOf(u);
    const consider = (o, bonus) => { const d = span(u, o) - (o.r || BODY) - bonus; if (d < reach && (!best || d < best.d)) best = { o, d }; };
    for (const o of units) if (o !== u && !safe(o)) consider(o, o === u.grudge && now < u.grudgeUntil ? 2 : 0);
    if (now >= durian.downUntil && durian.hp > 0) consider(durian, 0);
    for (const site of sites) if (site.live && site.owner !== u) consider(site, 0);
    for (const turret of turrets) if (turret.live && turret.owner !== u) consider(turret, 0);
    for (const d of decoys) if (d.live && d.owner !== u) consider(d, 0);
    for (const c of crystals) if (c.up) consider(c, 0);
    return best && best.o;
  }
  // 휘두른다. 화면은 이 사건을 받아 몸을 틀고 부채꼴 자국을 그린다. 상대가 없으면 허공에 휘두른 것이다.
  function swing(u, o) {
    u.lungeAt = now;
    emit('swing', { unit: u.index, hit: !!o, to: o ? spot(o) : null, reach: reachOf(u) + BODY });
  }
  function basicHit(u, handsOn) {
    if (!u.type.atk || now < u.nextHit) return false;
    const o = hitTarget(u);
    // 직접 누른 공격은 허공에도 휘두른다. 닿는 거리를 눈으로 익힐 수 있다.
    if (!o) { if (handsOn) { u.nextHit = now + 0.45; swing(u, null); } return false; }
    u.nextHit = now + (u.type.rate || 0.7);
    swing(u, o);
    // 맞은 상대는 조금 밀려난다. 난간 없는 다리에서는 이렇게 떨어뜨릴 수 있다.
    if (o.kind === 'unit' && !(o.frozenUntil > now) && o.id !== 'pot') { let ds = o.s - u.s; if (ds > TOTAL / 2) ds -= TOTAL; else if (ds < -TOTAL / 2) ds += TOTAL; const dl = o.lane - u.lane, d = Math.hypot(ds, dl) || 1; o.vs += (ds / d) * 9; o.vl += (dl / d) * 13; }
    hurt(o, u.type.atk, u);
    return true;
  }

  // ---------- 능력 ----------
  function raiseTurret(turret, s, lane, owner) {
    Object.assign(turret, { live: true, hp: turret.map ? 5 : 4, s: (s + TOTAL) % TOTAL, lane, owner, until: turret.map ? Infinity : now + 25, nextShot: now + 1.2, aim: null });
  }
  // 캐릭터별 능력. cd는 재사용 대기 시간(초), auto는 저절로 발동하는 것. 쓸 대상이 없으면 false, 대기 시간을 따로 정하려면 숫자를 돌려준다.
  const SKILLS = {
    iceman: { cd: 10, cast(u) {
      const center = { s: u.s + 9, lane: u.lane };
      emit('pulse', center);
      for (const o of targets(u)) if (span(center, o) < FREEZE_RADIUS) { o.frozenUntil = now + 5; hit(o, '꽁꽁', '#9fe8ff', '얼어붙었습니다', u); }
    } },
    parking: { cd: 9, cast(u) {
      const o = nearestAhead(u, 60, (x) => WHEELED.has(x.id)); if (!o) return false; if (o.dud) return;
      o.stunUntil = o.ticketUntil = now + 12; o.vs = 0; hit(o, '딱지', '#ffe066', '딱지를 떼여 12초간 못 움직입니다', u);
    } },
    swap: { cd: 12, cast(u) {
      const o = nearestAhead(u, 120); if (!o) return false; if (o.dud) return;
      [u.s, o.s] = [o.s, u.s]; [u.lane, o.lane] = [o.lane, u.lane]; u.sec = sectionAt(u.s); o.sec = sectionAt(o.s);
      hit(o, '자리 바꿔', '#ff9a3d', '자리를 뺏겼습니다', u);
    } },
    blink: { cd: 2.5, cast(u) { u.s += 9; } },
    exile: { cd: 20, cast(u) {
      const o = leader(u); if (!o) return false;
      hit(o, '유배', '#ff5d5d', '1구간 처음으로 유배당했습니다', u);
      o.s = START_S + random() * 4; o.sec = 0; o.vs = 0;
    } },
    van: { cd: 8, cast(u) {
      if (u.cargo) { drop(u, true); return 8; }
      const o = nearestAny(u, 6); if (!o) return false; if (o.dud) return;
      // 태운 사람은 내 화면에 이미 보이므로 결과 화면은 띄우지 않는다.
      u.cargo = o; u.cargoUntil = now + 6; o.carriedBy = u; hit(o, '납치', '#1f9f96', '납치당했습니다', u, true);
      return 0.6;
    } },
    copier: { cd: 6, cast(u) { const o = nearestAny(u, TOTAL); if (!o || o.id === 'copier') return false; if (o.dud) return; popup('복사', '#7be495', u); become(u, o.id); } },
    snail: { cd: 8, cast(u) { const o = leader(u); if (!o) return false; o.slowUntil = now + 5; hit(o, '느려져라', '#b7c95a', '5초간 느려졌습니다', u); } },
    owl: { cd: 10, cast(u) {
      const pool = units.filter((o) => o === u || !safe(o)), o = pool[Math.floor(random() * pool.length)];
      popup(o === u ? '부엉.. 나네' : '부엉', '#b07a4a', o); o.safeUntil = 0;
      if (o !== u) show(u, { s: o.s, lane: o.lane }, `룰렛 → ${o.player.name} 아웃`);
      die(o, '부엉부엉의 룰렛에 걸렸습니다');
    } },
    genki: { cd: 6, cast(u) {
      popup('원기옥', '#7fd4ff', u);
      const top = leader(u); if (top) show(u, { s: top.s, lane: top.lane }, `원기옥 → ${top.player.name} 포함 전원 아웃`);
      for (const o of targets(u)) die(o, '원기옥에 맞았습니다');
      for (const site of sites) if (site.live) site.hp = 0;
      become(u, pickType(u.sec));
    } },
    builder: { cd: 14, cast(u) {
      const site = sites.find((x) => !x.live); if (!site) return false;
      Object.assign(site, { live: true, hp: 8, owner: u, startedAt: now, doneAt: now + 20, s: (u.s - 3.6 + TOTAL) % TOTAL, lane: u.lane });
    } },
    hen: { cd: 1.2, cast(u) {
      const chick = chicks.find((c) => !c.live); if (!u.chicks || !chick) return false;
      u.chicks--; Object.assign(chick, { live: true, owner: u, s: u.s + 2.6, lane: u.lane });
    } },
    possess: { cd: 16, cast(u) {
      const o = nearestAny(u, 10); if (!o || o.riddenBy || o.riding) return false; if (o.dud) return;
      u.riding = o; u.ridingUntil = now + 8; o.riddenBy = u; u.vs = 0;
      // 뺏은 몸은 내 화면이 따라가므로 결과 화면은 띄우지 않는다.
      hit(o, '빙의', '#b06cff', '몸을 뺏겼습니다 · 8초간 조종할 수 없습니다', u, true);
      tell(u, `${o.type.name}의 몸에 들어갔습니다 · 이대로 골인하면 내 점수`);
      emit('ride', { unit: u.index });
    } },
    bomber: { cd: 12, cast(u) {
      const bomb = bombs.find((b) => !b.live); if (!bomb) return false;
      let o = nearestAny(u, 8); if (o && o.dud) return;
      o = o || u;
      Object.assign(bomb, { live: true, carrier: o, fuseUntil: now + 5.5, passAt: now, by: u });
      // 결과 화면은 폭탄을 따라간다. 옮겨붙으면 새로 든 사람을 비춘다.
      if (o === u) { popup('폭탄', '#ff5d5d', u); tell(u, '붙일 사람이 없어 내가 들었습니다 · 남에게 비비세요'); }
      else { show(u, bomb, `폭탄 → ${o.player.name}`, 6.6); hit(o, '폭탄', '#ff5d5d', '폭탄이 붙었습니다 · 남에게 비비면 옮겨갑니다', u, true); }
    } },
    cannon: { cd: 6, cast(u) { const turret = turrets.find((t) => !t.live && !t.map); if (!turret) return false; raiseTurret(turret, u.s - 2.8, u.lane, u); } },
    draw: { cd: 9, cast(u) {
      const o = nearestAhead(u, 80); if (!o) return false; if (o.dud) return;
      hit(o, '다시 뽑아', '#2fb8a8', '제비뽑기에 걸려 캐릭터가 바뀝니다', u); become(o, pickType(o.sec));
    } },
    liar: { cd: 8, cast(u) {
      u.burrowUntil = now + 5; u.lied = true; u.vs = 0; popup('속았지', '#ff9a3d', u);
      tell(u, '속았습니다 · 5초간 땅에 머리를 박습니다. 그동안은 아무것도 안 맞습니다');
    } },
    mold: { cd: 3, cast(u) {
      let best = null;
      for (const t of [...sites, ...turrets]) if (t.live && !t.map) { const d = span(u, t); if (d < 7 && (!best || d < best.d)) best = { t, d }; }
      if (!best) return false;
      best.t.live = false; popup('곰팡이', '#7fbf4a', u);
      become(u, 'moldhouse');
      tell(u, '건물에 곰팡이가 피었습니다 · 이대로 골인하면 78점');
    } },
    ninja: { cd: 12, cast(u) {
      let made = 0;
      for (const d of decoys) {
        if (d.live || made >= 3) continue;
        Object.assign(d, { live: true, owner: u, s: u.s + (made === 2 ? 3 : 0.5), lane: fitLane(u.s, u.lane + [2.8, -2.8, 0][made], 1.3), vs: u.type.speed * SPEED * 0.9, hp: 1, until: now + 10 });
        made++;
      }
      if (!made) return false;
      popup('분신술', '#c7ccd6', u);
    } },
    pot: { cd: 30, auto: true, cast(u) { become(u, pickType(u.sec)); } },
    rent: { cd: 2, auto: true, cast(u) { u.score -= 1; } },
  };

  // ---------- 골인과 순위 ----------
  // 판이 끝난다: 5분이 지났거나 한 명만 남았을 때. 골인한 순서, 그다음은 점수 순서로 순위를 매긴다.
  function endMatch() {
    game.mode = 'over';
    const order = units.filter((u) => u.rank >= 0).sort((a, b) => (a.rank || 99) - (b.rank || 99) || b.score - a.score);
    emit('over', { order: order.map((u) => u.index) });
  }
  // 목표 점수를 채우면 순위를 받고 트랙에서 빠진다. 판은 끝나지 않고 남은 사람끼리 계속 겨룬다.
  function finish(u) {
    if (u.rank || game.mode !== 'play') return;
    if (u.cargo) drop(u, false);
    if (u.carriedBy) { u.carriedBy.cargo = null; u.carriedBy = null; }
    if (u.riding) unride(u); if (u.riddenBy) unride(u.riddenBy);
    for (const bomb of bombs) if (bomb.live && bomb.carrier === u) bomb.live = false;
    u.rank = ++game.finished;
    popup(`${u.rank}등`, '#ffd84d', GOAL);
    emit('finish', { unit: u.index, rank: u.rank });
    if (units.filter((o) => !o.rank).length <= 1) endMatch();
  }
  const reached = (u) => { if (game.mode === 'play' && u.score >= rules.goal) finish(u); };
  function goal(unit) {
    const id = unit.id, owner = unit.riddenBy || unit;
    let text, color = owner.human ? '#5ad1ff' : owner.player.color;
    if (id === 'flipper') {
      for (const u of units) if (!u.rank) u.score = 0;
      unit.flipAt = now + unit.phase; text = '전원 0점'; color = '#ff5d5d';
      for (const u of units) tell(u, owner === u ? '판을 엎었습니다' : `${owner.player.name}이(가) 판을 엎었습니다`);
    }
    else if (id === 'reset') { owner.score = 0; text = '리셋'; color = '#ff5d5d'; }
    else if (id === 'eraser') { owner.score = 8; text = '= 8'; }
    else if (id === 'lotto' && random() < 1 / 7) { owner.score = 0; text = '꽝'; color = '#ff5d5d'; }
    else {
      const gain = id === 'lotto' ? Math.floor(random() * 79) : id === 'hen' ? unit.chicks : FIXED_GAIN[id];
      owner.score += gain; text = (gain < 0 ? '' : '+') + gain; if (gain < 0) color = '#ff5d5d';
      // 물귀신은 곁에 있던 사람도 같이 끌고 들어간다.
      if (id === 'ghost') for (const o of targets(unit)) if (o !== owner && span(unit, o) < 10) { o.score -= 7; hit(o, '-7', '#ff5d5d', '물귀신에게 끌려가 7점을 잃었습니다', owner); }
    }
    if (owner !== unit) { popup('뺏은 골인', '#b06cff', unit); tell(unit, `${owner.player.name}이(가) 내 몸으로 골인했습니다`); }
    popup(text, color, GOAL);
    reached(owner);
    // 시작 전 배경에서는 누가 목표 점수를 채우면 전원 0점으로 돌린다.
    if (game.mode === 'demo' && owner.score >= rules.goal) for (const u of units) u.score = 0;
  }

  // ---------- 한 판의 시작 ----------
  // 전원 0점, 출발선 조금 앞에 두 줄로 선다. 규칙의 인원보다 뒤 자리는 비워 둔다(rank -1).
  function lineUp() {
    game.timeLeft = rules.seconds; game.finished = 0;
    durian.hp = 12; durian.downUntil = 0;
    for (const c of crystals) Object.assign(c, { up: true, hp: 3, downUntil: 0, bornAt: -9 });
    for (const site of sites) site.live = false;
    for (const slime of slimes) slime.until = -1;
    for (const chick of chicks) chick.live = false;
    for (const turret of turrets) { turret.live = false; turret.backAt = 0; }
    for (const d of decoys) popDecoy(d, true);
    for (const bomb of bombs) bomb.live = false;
    for (const coin of coins) coin.live = false;
    units.forEach((u, n) => {
      u.score = 0; u.rank = n < rules.players ? 0 : -1;
      u.s = START_S + Math.floor(n / 4) * 3.6; u.lane = (1.5 - (n % 4)) * 3.6; u.vs = u.vl = 0; u.sec = 0;
      u.frozenUntil = u.slowUntil = u.stunUntil = u.ticketUntil = 0; u.grudge = null; u.carriedBy = u.cargo = null;
      emit('respawn', { unit: u.index });
      become(u, pickType(0));
      u.safeUntil = now + 3;
    });
  }
  game.start = (next) => { Object.assign(rules, DEFAULT_RULES, next); game.mode = 'play'; lineUp(); };
  // 메인 화면 뒤에서 봇끼리 도는 배경.
  game.demo = () => { Object.assign(rules, DEFAULT_RULES); game.mode = 'demo'; lineUp(); };

  // ---------- 봇 ----------
  // 계속 앞으로 가되 막히면 빈 쪽으로 비키고, 능력은 준비되는 대로 쓰고, 칠 만한 상대가 닿으면 친다.
  // 꽝을 든 사람은 죽여주면 오히려 도와주는 셈이라 건드리지 않는다. 자기를 괴롭힌 사람은 예외다.
  function think(u, solids) {
    const ai = u.ai;
    if (now > ai.think) { ai.think = now + 1.5 + random() * 2.5; ai.lane = random() * 2 - 1; }
    // 지금 자리와 조금 앞의 폭 가운데 좁은 쪽에 맞춘다. 난간 없는 다리에서는 가장자리에서 더 떨어져 달린다.
    const edgy = overChasm(indexAt(u.s)) || overChasm(indexAt(u.s + 6));
    const room = Math.max(0, Math.min(halfAt(u.s), halfAt(u.s + 8)) - (edgy ? 2.8 : 1.6));
    let goalLane = ai.lane * room, block = null;
    for (const o of solids) {
      if (o === u) continue;
      const gap = gapAhead(u, o);
      if (gap > 0.1 && gap < 7 && Math.abs(o.lane - u.lane) < u.r + o.r + 0.2 && (o.vs || 0) < u.type.speed * SPEED * 0.8 && (!block || gap < block.gap)) block = { o, gap };
    }
    if (block) {
      const need = u.r + block.o.r + 0.4;
      const sides = [block.o.lane + need, block.o.lane - need].filter((l) => Math.abs(l) <= room).sort((p, q) => Math.abs(p - u.lane) - Math.abs(q - u.lane));
      if (sides.length) goalLane = sides[0];
    }
    const skill = SKILLS[u.id];
    let strike = false;
    if (u.type.atk && now >= u.nextHit) {
      const reach = reachOf(u);
      strike = units.some((o) => o !== u && !safe(o) && span(u, o) - o.r < reach && (o.type.kind !== '꽝' || (o === u.grudge && now < u.grudgeUntil)))
        || !!(block && block.o.thing && block.o.owner !== u);
    }
    return { f: 1, a: Math.max(-1, Math.min(1, (u.lane - goalLane) * 0.9)), cast: !!skill && !skill.auto && now >= u.nextSkill + ai.delay, strike };
  }

  // ---------- 한 걸음 ----------
  // inputs에는 사람이 지금 조종하고 있는 자리만 넣는다: { 0: { f, a, cast, strike } }. f는 앞뒤, a는 좌우(-1~1).
  // 입력이 없는 사람 자리는 가만히 서 있고, 봇 자리는 스스로 판단한다.
  const STILL = { f: 0, a: 0, cast: false, strike: false };
  game.step = (dt, inputs = {}) => {
    now = game.time += dt;
    if (game.mode === 'play') { game.timeLeft -= dt; if (game.timeLeft <= 0) endMatch(); }

    // 수정 벽.
    for (const c of crystals) {
      if (c.up && c.hp <= 0) { c.up = false; c.downUntil = now + 25; popup('쨍', '#9fd0ff', c); }
      else if (!c.up && now >= c.downUntil && game.mode !== 'over') { c.up = true; c.hp = 3; c.bornAt = now; }
    }
    // 두리안.
    const durianUp = now >= durian.downUntil;
    if (durianUp && durian.hp <= 0) { durian.hp = 12; durian.bornAt = now; }
    // 가건물: 부서지면 사라지고, 20초를 버티면 지은 사람이 30점을 받는다.
    for (const site of sites) {
      if (!site.live) continue;
      if (site.hp <= 0) { site.live = false; popup('와르르', '#ff8a2a', site); tell(site.owner, '가건물이 부서졌습니다'); show(site.owner, site, '가건물이 부서졌습니다', 2.6); }
      else if (now >= site.doneAt) {
        site.live = false;
        if (game.mode !== 'over') { site.owner.score += 30; popup('+30 완공', '#ffd84d', site); tell(site.owner, '가건물 완공 · 30점'); show(site.owner, site, '가건물 완공 +30', 2.6); reached(site.owner); }
      }
    }
    const riders = units.filter((u) => !u.carriedBy && !u.rank);
    // 포탑: 맵 포탑은 부서져도 20초 뒤 다시 서고, 닿는 거리의 가장 가까운 사람을 쏜다.
    for (const turret of turrets) {
      if (!turret.live) {
        if (turret.map && now >= turret.backAt && game.mode !== 'over') raiseTurret(turret, BRIDGE_AT, turret.index === 0 ? 8.3 : -8.3, null);
        continue;
      }
      if (turret.hp <= 0 || now > turret.until) { if (turret.hp <= 0) popup('와르르', '#ff8a2a', turret); turret.live = false; turret.backAt = now + 20; continue; }
      let prey = null;
      for (const o of riders) if (o !== turret.owner && !safe(o)) { const d = span(turret, o); if (d < (turret.map ? 9 : 11) && (!prey || d < prey.d)) prey = { o, d }; }
      turret.aim = prey ? prey.o.index : null;
      if (!prey) continue;
      if (now >= turret.nextShot && game.mode !== 'over') {
        turret.nextShot = now + (turret.map ? 2.2 : 1.3);
        emit('zap', { from: spot(turret), to: spot(prey.o) });
        show(turret.owner, turret, `내 포탑 → ${prey.o.player.name}`, 2.4);
        hurt(prey.o, 1, turret.owner, '포탑에 맞아 죽었습니다');
      }
    }
    // 분신: 앞으로 달리다 10초 뒤 사라진다.
    for (const d of decoys) {
      if (!d.live) continue;
      if (d.hp <= 0 || now > d.until) { popDecoy(d); continue; }
      d.s = (d.s + d.vs * dt + TOTAL) % TOTAL; d.lane = fitLane(d.s, d.lane, 1.5);
    }
    // 폭탄: 심지가 다 타면 든 사람이 죽고 주변도 다친다.
    for (const bomb of bombs) {
      if (!bomb.live || bomb.fuseUntil > now) continue;
      const c = bomb.carrier;
      bomb.live = false; popup('쾅', '#ff5d5d', c); burst(c, 11);
      if (c !== bomb.by) show(bomb.by, { s: c.s, lane: c.lane }, `폭탄 쾅 → ${c.player.name}`, 2.6);
      for (const o of riders) if (o !== c && span(c, o) < 5) hurt(o, 2, bomb.by, '폭탄에 휘말려 죽었습니다');
      if (c.id !== 'heuong' && !(c.frozenUntil > now) && !(c.burrowUntil > now)) { c.safeUntil = 0; die(c, '폭탄이 터졌습니다'); }
    }
    // 동전: 먼저 닿는 사람이 1점.
    for (const coin of coins) {
      if (!coin.live) continue;
      const taker = riders.find((o) => span(coin, o) < o.r + 0.8);
      if (taker && game.mode !== 'over') { coin.live = false; taker.score += 1; popup('+1', '#ffd84d', coin); reached(taker); }
    }
    for (const u of units) if (u.riding && now > u.ridingUntil) unride(u);
    const solids = [...riders, ...sites.filter((site) => site.live), ...turrets.filter((t) => t.live && t.solid), ...decoys.filter((d) => d.live)];
    if (durianUp) solids.push(durian);
    for (const c of crystals) if (c.up) solids.push(c);

    // 입력과 봇의 판단, 이동, 능력과 공격.
    for (const u of riders) {
      const frozen = u.frozenUntil > now, buried = u.burrowUntil > now, stuck = frozen || buried || !!u.riding || u.stunUntil > now || u.type.speed === 0 || u.jam > 0;
      // 빙의당한 몸은 뺏은 사람의 입력으로 움직인다.
      const driver = u.riddenBy || u;
      const pad = game.mode === 'play' && driver.human ? inputs[driver.index] : null, handsOn = !!pad;
      let { f, a, cast, strike } = pad || (game.mode !== 'over' && !(driver.human && game.mode === 'play') ? think(u, solids) : STILL);
      f = Math.max(-1, Math.min(1, f)); a = Math.max(-1, Math.min(1, a));
      if (u.riding) { f = a = 0; cast = strike = false; }
      const top = u.type.speed * SPEED * (u.slowUntil > now ? 0.4 : 1);
      // 마이너스 통장과 리셋 버튼은 4구간에서 결승선으로 끌려간다. 뒤로 버텨도 조금씩 나아간다.
      const dragged = (u.id === 'wallet' || u.id === 'reset') && u.sec === 3;
      let wantS = stuck ? 0 : top * (f >= 0 ? f : f * 0.6);
      if (dragged && !stuck) wantS = Math.max(wantS, top * (f < 0 ? 0.3 : 0.8));
      // 집에 갈래: 고무줄이 뒤로 당긴다. 연타로 모은 힘만큼만 앞으로 간다.
      if (u.id === 'homesick') {
        u.pump = Math.max(0, u.pump - dt * 1.1);
        if (!handsOn) u.pump = Math.min(2, u.pump + dt * (1.25 + Math.sin(now * 0.9 + u.phase)));
        if (!stuck) wantS = top * (-0.45 + u.pump * 0.75);
      }
      // 멍멍이: 조종의 절반쯤만 듣고 나머지는 제멋대로 간다.
      if (u.id === 'dog' && !stuck) { wantS = top * (0.65 * f + 0.35 * Math.sin(now * 0.7 + u.phase * 3)); a = 0.5 * a + 0.75 * Math.sin(now * 1.3 + u.phase * 5); }
      // 돼지 저금통: 봇은 꾸준히 두드려 5초쯤 뒤에 깨진다.
      if (u.id === 'piggy') { if (!handsOn) u.smash += dt * 6; if (u.smash >= 30 && game.mode !== 'over') { smashPig(u); continue; } }
      const ease = Math.min(1, dt * 8);
      u.vs += (wantS - u.vs) * ease;
      u.vl += ((stuck ? 0 : -a * Math.max(top, 3.5) * 0.85) - u.vl) * ease;
      u.s += u.vs * dt; u.lane += u.vl * dt;
      // 끼인 스포츠카: 봇은 시간이 지나면 저절로 빠진다.
      if (u.jam > 0 && !u.human && now > u.jamAt + 0.6) { u.jam--; u.jamAt = now; }

      const skill = SKILLS[u.id], busy = frozen || buried || !!u.riding || u.stunUntil > now || game.mode === 'over';
      if (skill && !busy && now >= u.nextSkill && (skill.auto || cast)) {
        const result = skill.cast(u);
        if (result === false) { if (handsOn) tell(driver, u.id === 'mold' ? '근처에 남이 지은 설치물이 없습니다' : '쓸 대상이 없습니다'); u.nextSkill = now + 0.8; }
        else if (SKILLS[u.id] === skill) u.nextSkill = now + (typeof result === 'number' ? result : skill.cd);
      }
      if (!busy && (strike || u.id === 'pot')) basicHit(u, handsOn && strike);
      if (u.cargo && now > u.cargoUntil) drop(u, false);
      // 달팽이는 지나간 자리에 점액을 남긴다.
      if (u.id === 'snail' && now > u.slimeAt + 0.9 && Math.abs(u.vs) > 0.5) {
        const slime = slimes.find((x) => x.until < now);
        if (slime) { u.slimeAt = now; Object.assign(slime, { s: u.s - 1.5, lane: u.lane, until: now + 7, owner: u }); }
      }
    }
    for (const slime of slimes) {
      if (slime.until < now) continue;
      for (const u of riders) if (u !== slime.owner && u.id !== 'heuong' && span(slime, u) < 1.6) u.slowUntil = Math.max(u.slowUntil, now + 0.8);
    }

    // 충돌: 서로 겹치지 않게 밀어낸다. 얼어붙은 유닛, 화분, 두리안, 가건물은 꿈쩍도 하지 않아 길을 막는다.
    const fixedNow = (o) => o.fixed || o.frozenUntil > now || o.id === 'pot';
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < solids.length; i++) for (let j = i + 1; j < solids.length; j++) {
      const A = solids[i], B = solids[j];
      let ds = B.s - A.s; if (ds > TOTAL / 2) ds -= TOTAL; else if (ds < -TOTAL / 2) ds += TOTAL;
      const dl = B.lane - A.lane, reach = A.r + B.r;
      if (Math.abs(ds) >= reach || Math.abs(dl) >= reach) continue;
      const d = Math.hypot(ds, dl) || 0.001; if (d >= reach) continue;
      const fa = fixedNow(A), fb = fixedNow(B); if (fa && fb) continue;
      const push = reach - d, nx = ds / d, ny = dl / d, wa = fa ? 0 : fb ? 1 : 0.5, wb = fb ? 0 : fa ? 1 : 0.5;
      A.s -= nx * push * wa; A.lane -= ny * push * wa; B.s += nx * push * wb; B.lane += ny * push * wb;
      if (pass) continue;
      // 닿았을 때 생기는 일.
      for (const [x, y] of [[A, B], [B, A]]) {
        if (x.kind !== 'unit') continue;
        const person = y.kind === 'unit';
        if (y.ram) y.hp -= 2 * dt;
        for (const bomb of bombs) if (bomb.live && bomb.carrier === x && person && now > bomb.passAt + 0.6) {
          bomb.carrier = y; bomb.passAt = now; popup('옮았다', '#ff5d5d', y);
          tell(y, '폭탄이 옮겨붙었습니다 · 남에게 비비세요'); tell(x, '폭탄을 넘겼습니다');
        }
        if (x.id === 'sportscar' && !x.jam && fixedNow(y) && now > x.touchedAt + 2) { x.jam = 4; x.jamAt = now; x.touchedAt = now; x.vs = 0; x.wiggle = ''; popup('끼임', '#d81e2c', x); tell(x, '끼었습니다 · A와 D를 번갈아 네 번 누르세요'); }
        if (x.id === 'eraser' && person && !safe(y) && now > x.touchedAt + 1.5) { x.touchedAt = now; popup('쓱싹', '#f29bb0', y); y.grudge = x; y.grudgeUntil = now + 10; die(y, `${x.player.name}의 지우개에 지워졌습니다`); }
      }
    }
    if (durianUp && durian.hp <= 0) { durian.downUntil = now + 12; popup('와장창', '#a8e04a', durian); }

    for (const u of riders) {
      if (u.s >= TOTAL) u.s -= TOTAL; else if (u.s < 0) u.s += TOTAL;
      const here = indexAt(u.s), half = Math.max(0.2, WIDTH[here] / 2 - Math.min(u.r, BODY) * 0.8);
      // 다리에는 난간이 없다. 몸의 중심이 가장자리를 넘으면 떨어져 죽는다.
      if (overChasm(here) && !(u.frozenUntil > now)) {
        if (Math.abs(u.lane) > WIDTH[here] / 2 + 0.3 && game.mode !== 'over') {
          popup('추락', '#22e0c8', u);
          if (now < u.grudgeUntil) show(u.grudge, { s: u.s, lane: u.lane * 0.5 }, `${u.player.name} 추락`, 2.4);
          u.safeUntil = 0; u.lane = 0; die(u, '다리에서 떨어졌습니다'); continue;
        }
      } else u.lane = Math.max(-half, Math.min(half, u.lane));
      // 다음 구간 문을 앞으로 지났을 때만 캐릭터가 바뀐다. 뒤로 돌아가 다시 뽑을 수는 없다.
      const section = sectionAt(u.s);
      if (section === (u.sec + 1) % 4 && game.mode !== 'over') {
        u.sec = section;
        const cargo = u.cargo;
        if (cargo && section === (cargo.sec + 1) % 4) { cargo.sec = section; if (section === 0) goal(cargo); }
        if (section === 0) goal(u);
        if (game.mode !== 'over') { if (!u.rank) become(u, pickType(section)); if (cargo && section === 0 && !cargo.rank) { cargo.s = u.s; cargo.lane = u.lane; become(cargo, pickType(0)); } }
      }
    }
    // 병아리: 앞만 보고 달린다. 누구에게든 부딪히면 죽고, 결승선을 넘으면 주인에게 2점.
    for (const chick of chicks) {
      if (!chick.live) continue;
      const before = chick.s; chick.s += 13 * dt; chick.lane = fitLane(chick.s, chick.lane, 0.8);
      const bumped = solids.some((o) => o !== chick.owner && span(chick, o) < o.r + chick.r);
      if (bumped) { chick.live = false; popup('삐약', '#ffd84d', chick); show(chick.owner, { s: chick.s, lane: chick.lane }, '병아리가 부딪혔습니다', 2.2); continue; }
      if (before < TOTAL && chick.s >= TOTAL) {
        chick.live = false;
        if (game.mode !== 'over') { chick.owner.score += 2; popup('+2', '#ffd84d', GOAL); show(chick.owner, GOAL, '병아리 골인 +2', 2.2); reached(chick.owner); }
      }
    }
  };

  // ---------- 사람의 연타 입력 ----------
  // 누르는 순간에만 뜻이 있는 입력은 걸음과 따로 받는다.
  // 끼인 스포츠카는 좌우('L', 'R')를 번갈아 눌러야 빠진다.
  game.wiggle = (index, side) => { const u = units[index]; if (u.jam > 0 && side !== u.wiggle) { u.wiggle = side; u.jam--; if (!u.jam) tell(u, '빠져나왔습니다'); } };
  // 집에 갈래는 앞으로 가는 키를 연타해 힘을 모은다. 빙의 중이면 뺏은 몸에 먹힌다.
  game.pump = (index) => { const pawn = units[index].riding || units[index]; if (pawn.id === 'homesick') pawn.pump = Math.min(2, pawn.pump + 0.55); };
  // 돼지 저금통은 능력 버튼을 서른 번 눌러야 깨진다.
  game.smash = (index) => { const pawn = units[index].riding || units[index]; if (pawn.id === 'piggy') pawn.smash++; };

  // 화면과 시험이 쓰는 것들.
  Object.assign(game, { safe, span, reachOf, hitTarget, become, finish, endMatch, pickType, SKILLS });
  game.demo();
  events.length = 0;
  return game;
}
