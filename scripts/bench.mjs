// 서버 한 대가 방을 몇 개나 돌릴 수 있을지 어림하는 잣대.
//   node scripts/bench.mjs
// 1) 실제 계산 모듈로 봇 여덟이 달리는 방을 여러 개 돌려, 방 하나가 1초에 쓰는 CPU를 잰다.
// 2) 연결 800개(방 100개 × 8명)에 240바이트를 초당 20번 보내, 상태를 보내는 CPU를 잰다.
//    240바이트는 상태 한 장의 예상 크기다. 아직 정해진 전송 형식이 없으므로 가정이다.
// 결과는 이 컴퓨터의 값이다. docs/research/server-capacity.md에 적은 추정은 여기에 여유를 곱한 것이다.
import net from 'node:net';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createGame } from '../src/sim/game.js';

const PORT = 47231, CONNECTIONS = 800, FRAME = 240, SENDS_PER_SECOND = 20;

if (process.argv[2] === 'client') {
  for (let n = 0; n < CONNECTIONS; n++) { const socket = net.connect(PORT, '127.0.0.1'); socket.on('data', () => {}); socket.on('error', () => {}); }
  setInterval(() => {}, 1000);
} else {
  console.log(`${os.cpus()[0].model}, Node ${process.version}`);

  // 1) 계산.
  const ROOMS = 100, SECONDS = 60, TICK = 30;
  const rooms = Array.from({ length: ROOMS }, () => { const game = createGame(); game.start({ players: 8, seconds: 300, goal: 100 }); game.units[0].human = false; return game; });
  for (let warm = 0; warm < 150; warm++) for (const game of rooms) { game.step(1 / TICK); game.events.length = 0; }
  let events = 0;
  const started = process.cpuUsage();
  for (let frame = 0; frame < SECONDS * TICK; frame++) for (const game of rooms) {
    game.step(1 / TICK); events += game.events.length; game.events.length = 0;
    if (game.mode === 'over') game.start({ players: 8, seconds: 300, goal: 100 });
  }
  const used = process.cpuUsage(started), simMs = (used.user + used.system) / 1000 / ROOMS / SECONDS;
  console.log(`계산: 방 하나가 1초에 ${simMs.toFixed(3)} ms (코어의 ${(simMs / 10).toFixed(3)}%), 사건 ${(events / ROOMS / SECONDS).toFixed(1)}개/초  [방 ${ROOMS}개, ${SECONDS}초, 초당 ${TICK}걸음]`);

  // 2) 전송.
  const sockets = [];
  const server = net.createServer((socket) => { socket.setNoDelay(true); socket.on('error', () => {}); sockets.push(socket); });
  server.listen(PORT, '127.0.0.1', () => {
    const client = spawn(process.execPath, [fileURLToPath(import.meta.url), 'client'], { stdio: 'ignore' });
    const wait = setInterval(() => {
      if (sockets.length < CONNECTIONS) return;
      clearInterval(wait);
      const frame = Buffer.alloc(FRAME, 7); let ticks = 0;
      const from = process.cpuUsage(), t0 = Date.now();
      const timer = setInterval(() => {
        for (const socket of sockets) socket.write(frame);
        if (++ticks < SENDS_PER_SECOND * 10) return;
        clearInterval(timer);
        const cpu = process.cpuUsage(from), wall = (Date.now() - t0) / 1000, ms = (cpu.user + cpu.system) / 1000;
        const perRoom = ms / wall / (CONNECTIONS / 8);
        console.log(`전송: 한 번에 ${((ms / (CONNECTIONS * ticks)) * 1000).toFixed(1)} µs, 방 하나(8명)가 1초에 ${perRoom.toFixed(3)} ms (코어의 ${(perRoom / 10).toFixed(3)}%)  [연결 ${CONNECTIONS}개, ${FRAME}바이트, 초당 ${SENDS_PER_SECOND}번]`);
        console.log(`전송량: 한 사람에게 초당 ${((FRAME * SENDS_PER_SECOND) / 1024).toFixed(1)} KB, 5분 한 판에 ${((FRAME * SENDS_PER_SECOND * 300) / 1048576).toFixed(2)} MB (TCP와 웹소켓 머리말 제외)`);
        client.kill(); process.exit(0);
      }, 1000 / SENDS_PER_SECOND);
    }, 100);
  });
}
