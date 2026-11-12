#!/usr/bin/env node
// 用 GitHub REST API 发布这个仓库 —— 不需要 git（本机 git 的 HTTPS 是坏的也能用）。
//
//   GITHUB_TOKEN=ghp_xxx node scripts/publish.mjs --repo video-craft
//   GITHUB_TOKEN=ghp_xxx node scripts/publish.mjs --repo video-craft --private
//   node scripts/publish.mjs --dry-run          # 只打印将要上传什么
//
// Token 需要权限：classic PAT 勾 `repo`；fine-grained 给 Administration:write + Contents:write。
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : d; };

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const REPO = String(get('repo', 'video-craft'));
const DESC = String(get('desc', '把「做出来的视频像 PPT」拆成可测的结论：一个视频制作的流程门 + 三件测谎工具'));
const PRIVATE = !!get('private', false);
const DRY = !!get('dry-run', false);
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

const SKIP = new Set(['.git', 'node_modules', '__pycache__', '.pytest_cache']);
const SKIP_EXT = new Set(['.mp4', '.mov', '.wav', '.mp3', '.pyc']);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (!SKIP_EXT.has(path.extname(e.name).toLowerCase())) out.push(full);
  }
  return out;
}

const files = walk(ROOT).filter(f => {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  return rel !== '.gitignore' ? true : true; // 全都要
});

console.log(`repo: ${REPO}  private: ${PRIVATE}  files: ${files.length}`);
for (const f of files) console.log('  ' + path.relative(ROOT, f).replace(/\\/g, '/'));
if (DRY) { console.log('\n[dry-run] 没有上传。设 GITHUB_TOKEN 再去掉 --dry-run 就会真发布。'); process.exit(0); }

if (!TOKEN) {
  console.error('\n缺 GITHUB_TOKEN。到 https://github.com/settings/tokens 建一个（勾 repo），然后：');
  console.error('  GITHUB_TOKEN=ghp_xxx node scripts/publish.mjs --repo video-craft');
  process.exit(1);
}

const API = 'https://api.github.com';
async function api(method, url, body) {
  const r = await fetch(API + url, {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'video-craft-publisher',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  if (!r.ok) {
    console.error(`\n${method} ${url} → ${r.status}`);
    console.error(text.slice(0, 600));
    process.exit(1);
  }
  return json;
}

const me = await api('GET', '/user');
const login = me.login;
console.log(`\n登录为 ${login}`);

// 1) 建仓库（已存在则复用）
let repo;
try {
  repo = await api('GET', `/repos/${login}/${REPO}`);
  console.log(`仓库已存在：${repo.html_url}`);
} catch {
  repo = await api('POST', '/user/repos', {
    name: REPO, description: DESC, private: PRIVATE,
    has_issues: true, has_wiki: false, auto_init: false,
  });
  console.log(`已创建：${repo.html_url}`);
}

// 2) 逐个上传（contents API）
const branch = repo.default_branch || 'main';
let done = 0;
for (const f of files) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const content = fs.readFileSync(f).toString('base64');
  let sha;
  try {
    const cur = await api('GET', `/repos/${login}/${REPO}/contents/${encodeURIComponent(rel).replace(/%2F/g, '/')}?ref=${branch}`);
    sha = cur && cur.sha;
  } catch { /* 新文件 */ }
  await api('PUT', `/repos/${login}/${REPO}/contents/${encodeURIComponent(rel).replace(/%2F/g, '/')}`, {
    message: `${sha ? 'update' : 'add'} ${rel}`,
    content, branch, ...(sha ? { sha } : {}),
  });
  done++;
  process.stdout.write(`\r  上传 ${done}/${files.length}`);
}
console.log(`\n完成：${repo.html_url}`);
