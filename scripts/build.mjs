// 배포용으로 묶는다: 모듈을 스크립트 하나로 합치고 스타일과 함께 HTML 한 장에 넣는다.
//   dist/index.html  어디에 올려도 그대로 열리는 한 장짜리 페이지
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const bundle = await build({ entryPoints: [path.join(root, 'src/main.js')], bundle: true, format: 'iife', target: 'es2020', minify: process.argv.includes('--minify'), write: false, legalComments: 'none', charset: 'utf8' });
const script = bundle.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
const page = read('index.html')
  .replace('<link rel="stylesheet" href="./styles.css">', () => `<style>\n${read('styles.css')}</style>`)
  .replace('<script type="module" src="./src/main.js"></script>', () => `<script>\n${script}</script>`);
if (page.includes('./styles.css') || page.includes('./src/main.js')) throw new Error('index.html에서 바꿔 넣을 자리를 찾지 못했습니다');

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/index.html'), page);
console.log(`dist/index.html ${(page.length / 1024).toFixed(0)} KB`);
