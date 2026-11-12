// 反 PPT 指标采样：用一个页面自报的 TEXTS(t) / CAM(t) 算五项指标里的 1、2、3。
// 用法： node metrics.mjs "<项目目录>" [步长=0.25]
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

// 找 playwright-core：环境变量 LEMO_LIB（指向装了 node_modules 的目录）→ 当前目录向上找 → 裸模块
async function loadPw(){
  const cands = [];
  if (process.env.LEMO_LIB) cands.push(path.join(process.env.LEMO_LIB, 'node_modules/playwright-core/index.js'));
  let d = process.cwd();
  for (let i = 0; i < 6; i++){
    cands.push(path.join(d, 'node_modules/playwright-core/index.js'));
    const up = path.dirname(d); if (up === d) break; d = up;
  }
  for (const c of cands){
    if (fs.existsSync(c)) return await import(pathToFileURL(c).href);
  }
  try { return await import('playwright-core'); }
  catch (e) {
    console.error('找不到 playwright-core。装一个：npm i playwright-core && npx playwright install chromium');
    console.error('或指定：LEMO_LIB=<含 node_modules 的目录> node metrics.mjs <项目>');
    process.exit(2);
  }
}
const pw = await loadPw();
const chromium = pw.chromium || (pw.default && pw.default.chromium);

const dir = path.resolve(process.argv[2] || '.');
const step = Number(process.argv[3] || 0.25);
const entry = ['index.html', 'A/index.html', 'B/index.html'].map(f => path.join(dir, f)).find(fs.existsSync);
if (!entry) { console.error('no index.html in', dir); process.exit(1); }

const W = 1920, H = 1080;
const browser = await chromium.launch({ args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
await page.goto(pathToFileURL(entry).href);
await page.waitForFunction('window.READY === true', null, { timeout: 60000 });

const dur = await page.evaluate('window.DUR');
const shotsList = await page.evaluate('window.SHOTS || null');
const hasTexts = await page.evaluate('typeof window.TEXTS === "function"');
const hasCam = await page.evaluate('typeof window.CAM === "function"');

let maxFrac = 0, sumFrac = 0, n = 0, centered = 0, maxBoxes = 0;
const cams = [];
for (let t = 0; t <= dur + 1e-6; t += step) {
  const info = await page.evaluate(({ t, hasTexts, hasCam }) => {
    const r = typeof window.render === 'function' ? window.render(t) : null;
    const boxes = hasTexts ? window.TEXTS(t) : [];
    const cam = hasCam ? window.CAM(t) : null;
    return { boxes, cam };
  }, { t, hasTexts, hasCam });
  const boxes = (info.boxes || []).map(b => ({
    text: b.text,
    x0: b.x0 !== undefined ? b.x0 : b.x,
    y0: b.y0 !== undefined ? b.y0 : b.y,
    x1: b.x1 !== undefined ? b.x1 : (b.x + (b.w || 0)),
    y1: b.y1 !== undefined ? b.y1 : (b.y + (b.h || 0)),
  }));
  const area = boxes.reduce((a, b) => a + Math.max(0, b.x1 - b.x0) * Math.max(0, b.y1 - b.y0), 0);
  const frac = area / (W * H);
  maxFrac = Math.max(maxFrac, frac); sumFrac += frac; n++;
  maxBoxes = Math.max(maxBoxes, boxes.length);
  // 构图中心率：有文字块的中线落在画面中心 ±5% 内
  if (boxes.some(b => Math.abs((b.x0 + b.x1) / 2 - W / 2) < W * 0.05)) centered++;
  if (info.cam) cams.push({ t, ...info.cam });
}
await browser.close();

const camDist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y)
  + Math.abs((b.zoom || 1) - (a.zoom || 1)) * 900
  + Math.abs((b.rot || 0) - (a.rot || 0)) * 500;

let moved = 0, total = 0, dist = 0;
for (let i = 1; i < cams.length; i++) {
  const d = camDist(cams[i - 1], cams[i]);
  total++; if (d > 1.5) moved++; dist += d;
}

// 逐镜统计：镜长、镜内摄像机位移（≥40px 记为运动镜）
let perShot = [];
if (shotsList) {
  perShot = shotsList.map(s => {
    const pts = cams.filter(c => c.t >= s.t0 && c.t <= s.t1);
    let d = 0;
    for (let i = 1; i < pts.length; i++) d += camDist(pts[i - 1], pts[i]);
    return { id: s.id, len: +(s.t1 - s.t0).toFixed(2), camMove: Math.round(d), moves: d >= 40 };
  });
}
const avgLen = perShot.length ? +(perShot.reduce((a, s) => a + s.len, 0) / perShot.length).toFixed(2) : null;
const movingShots = perShot.length ? +(100 * perShot.filter(s => s.moves).length / perShot.length).toFixed(0) : null;

const out = {
  entry, dur, samples: n,
  textArea: { peak: +(maxFrac * 100).toFixed(1) + '%', mean: +((sumFrac / n) * 100).toFixed(1) + '%', maxBlocks: maxBoxes },
  centeredFrames: +(100 * centered / n).toFixed(0) + '%',
  camera: hasCam ? { movingTime: total ? +(100 * moved / total).toFixed(0) + '%' : 'n/a', travel: Math.round(dist), shotsMoving: movingShots === null ? 'n/a' : movingShots + '%' } : 'no CAM()',
  shots: perShot.length ? { count: perShot.length, avgLen, list: perShot } : null,
  pageErrors: errs
};
console.log(JSON.stringify(out, null, 2));

