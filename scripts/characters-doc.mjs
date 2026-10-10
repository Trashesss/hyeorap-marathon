// 리드미의 캐릭터 표를 캐릭터 자료(src/sim/characters.js)에서 다시 만든다.
//   npm run docs:characters           표를 고쳐 쓴다
//   npm run docs:characters -- --check   자료와 어긋났는지만 본다 (시험이 쓴다)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ATTACKS, ATTACK_OF, INFO, ROSTER } from '../src/sim/characters.js';

const readme = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../README.md');
const START = '<!-- characters:start -->', END = '<!-- characters:end -->';
// 종류를 보여줄 순서와 한 줄 설명.
const KINDS = [
  ['괴롭히는 패', '남을 멈추거나 끌어내립니다.'],
  ['움직이는 패', '내 자리를 바꿉니다.'],
  ['뒤섞는 패', '누가 무엇을 모는지를 바꿉니다.'],
  ['설치하는 패', '길 위에 무언가를 남깁니다.'],
  ['점수를 흔드는 패', '골인했을 때 판이 크게 움직입니다.'],
  ['꽝', '걸리면 손해입니다. 죽어서 바꾸는 것이 살 길입니다.'],
];
const cell = (text) => String(text).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const strike = (id, info) => { if (!info.atk) return '공격 못 함'; const way = ATTACKS[ATTACK_OF[id] || 'smash'], damage = info.atk + (way.bonus || 0); return `${way.name} ${damage >= 99 ? '즉사' : damage}`; };
const body = (id, info) => (info.hp === Infinity ? '무적' : `체력 ${info.hp}`) + ' · ' + strike(id, info);

export function table() {
  const known = new Set(KINDS.map(([kind]) => kind));
  for (const id of ROSTER) if (!known.has(INFO[id].kind)) throw new Error(`순서에 없는 종류: ${INFO[id].kind}`);
  const parts = [];
  for (const [kind, note] of KINDS) {
    const ids = ROSTER.filter((id) => INFO[id].kind === kind).sort((a, b) => INFO[a].name.localeCompare(INFO[b].name, 'ko'));
    if (!ids.length) continue;
    parts.push(`### ${kind} (${ids.length})`, '', note, '', '| 캐릭터 | 능력 | 쓰는 법 | 상대하는 법 | 골인하면 | 몸 |', '|---|---|---|---|---|---|');
    for (const id of ids) { const info = INFO[id]; parts.push(`| **${cell(info.name)}** | ${cell(info.skill)} | ${cell(info.how)} | ${cell(info.counter)} | ${cell(info.score)} | ${body(id, info)} |`); }
    parts.push('');
  }
  return parts.join('\n').trimEnd();
}

export function render(text) {
  const a = text.indexOf(START), b = text.indexOf(END);
  if (a < 0 || b < a) throw new Error('README.md에서 캐릭터 표 자리를 찾지 못했습니다');
  return text.slice(0, a + START.length) + '\n' + table() + '\n' + text.slice(b);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const before = fs.readFileSync(readme, 'utf8'), after = render(before);
  if (process.argv.includes('--check')) { if (before !== after) { console.error('README의 캐릭터 표가 자료와 다릅니다. npm run docs:characters 를 돌리세요.'); process.exit(1); } }
  else { fs.writeFileSync(readme, after); console.log(`캐릭터 ${ROSTER.length}종을 README에 적었습니다`); }
}
