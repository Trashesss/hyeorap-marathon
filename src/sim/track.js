// 길의 모양. 숫자만 다루므로 브라우저와 서버가 같은 파일을 쓴다.
//
// 위치는 두 값으로 나타낸다. s는 결승선에서부터 길을 따라 간 거리, lane은 길 가운데에서 옆으로 벗어난 거리다.
// lane은 진행 방향의 왼쪽(순환의 바깥쪽)이 양수다.

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// 모서리가 둥근 사각 순환을 시계 방향으로 돈다. 원작 맵처럼 넓게 달리다가 구간마다 한 군데씩 좁아진다.
// 한 구간은 직선 SIDE와 그 끝의 모서리 ARC다.
export const HALF = 52, BEND = 22, SIDE = 2 * (HALF - BEND), ARC = (Math.PI / 2) * BEND, LEG = SIDE + ARC, TOTAL = 4 * LEG;
export const N = 720;
export const TRACK_Y = 0.3;

// 표본 N개. POINTS는 장면 좌표, LANE_OF는 몇 번째 구간인지, ALONG은 그 구간 안에서 간 거리.
export const POINTS = [], LANE_OF = [], ALONG = [];
for (let i = 0; i < N; i++) {
  const d = (i / N) * TOTAL, k = Math.min(3, Math.floor(d / LEG)), along = d - k * LEG;
  // 북쪽 변 기준으로 자리를 잡은 뒤 구간 번호만큼 직각으로 돌린다.
  let x, z;
  if (along <= SIDE) { x = -HALF + BEND + along; z = -HALF; }
  else { const a = -Math.PI / 2 + (along - SIDE) / BEND; x = HALF - BEND + Math.cos(a) * BEND; z = -HALF + BEND + Math.sin(a) * BEND; }
  for (let turn = 0; turn < k; turn++) [x, z] = [-z, x];
  POINTS.push({ x, z }); LANE_OF.push(k); ALONG.push(along);
}
export const TANGENTS = POINTS.map((_, i) => {
  const a = POINTS[(i + N - 1) % N], b = POINTS[(i + 1) % N], len = Math.hypot(b.x - a.x, b.z - a.z);
  return { x: (b.x - a.x) / len, z: (b.z - a.z) / len };
});

export const BOUNDS = [0, N / 4, N / 2, (N * 3) / 4, N];
export const sectionOf = (i) => { for (let s = 0; s < 4; s++) if (i < BOUNDS[s + 1]) return s; return 3; };
export const SECTIONS = [
  { name: '1구간', color: '#3aa0ff' },
  { name: '2구간', color: '#22e0c8' },
  { name: '3구간', color: '#ff8a2a' },
  { name: '4구간', color: '#ff3fa4' },
];

// 기본 폭은 캐릭터 일곱 명분. 2구간 다리는 세 명분, 3구간 협곡은 두 명분으로 줄고, 4구간은 가장 넓다.
export const BRIDGE = [15, 45], CANYON = [22, 38];
// 출발 줄과 1구간 수정 벽의 자리.
export const START_S = 20, WALL_S = 38;
const dip = (along, a, b) => smooth(a - 7, a, along) * (1 - smooth(b, b + 7, along));
// 협곡의 깊이(0~1). 카메라 높이와 벽 높이가 이 값을 따른다.
export const DEEP = POINTS.map((_, i) => (LANE_OF[i] === 2 ? dip(ALONG[i], CANYON[0], CANYON[1]) : 0));
export const WIDTH = POINTS.map((_, i) => {
  const along = ALONG[i];
  if (LANE_OF[i] === 1) return 20 - 10.4 * dip(along, BRIDGE[0], BRIDGE[1]);
  if (LANE_OF[i] === 2) return 20 - 13 * DEEP[i];
  if (LANE_OF[i] === 3) return 20 + 5 * smooth(4, 14, along) * (1 - smooth(SIDE - 12, SIDE - 2, along));
  return 20;
});
// 다리 위에는 난간이 없다. 밖으로 밀려나면 떨어진다.
export const overChasm = (i) => LANE_OF[i] === 1 && ALONG[i] > BRIDGE[0] && ALONG[i] < BRIDGE[1];

// 거리 s가 몇 번째 표본인지, 거기서 길의 반폭이 얼마인지, 좌우 위치를 그 안에 맞추면 얼마인지.
export const indexAt = (s) => Math.floor(((s / TOTAL) * N + N * 4) % N);
export const sectionAt = (s) => sectionOf(indexAt(s));
export const halfAt = (s) => WIDTH[indexAt(s)] / 2;
export const fitLane = (s, lane, r) => { const h = Math.max(0, halfAt(s) - r); return Math.max(-h, Math.min(h, lane)); };
// 구간의 출발점. 죽으면 여기서 다시 시작한다.
export const sectionStart = (sec) => (sec === 0 ? START_S : (BOUNDS[sec] / N) * TOTAL + 4);

// 트랙 위의 한 점을 장면 좌표로. 화면 쪽이 쓰지만 계산만 하므로 여기에 둔다.
export function locate(s, lane, out = {}) {
  const f = ((s / TOTAL) * N + N * 4) % N, i = Math.floor(f), j = (i + 1) % N, t = f - i;
  const tx = TANGENTS[i].x + (TANGENTS[j].x - TANGENTS[i].x) * t, tz = TANGENTS[i].z + (TANGENTS[j].z - TANGENTS[i].z) * t;
  out.index = i; out.tx = tx; out.tz = tz;
  out.x = POINTS[i].x + (POINTS[j].x - POINTS[i].x) * t + TANGENTS[i].z * lane;
  out.z = POINTS[i].z + (POINTS[j].z - POINTS[i].z) * t - TANGENTS[i].x * lane;
  return out;
}
