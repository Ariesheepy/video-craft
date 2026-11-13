# video-craft · 站点

单文件落地页，零依赖、零构建。默认浅色，右上角可切深色（记在 `localStorage`）。

```
site/
├── index.html          整站（HTML + CSS + JS 全在里面）
├── .nojekyll           让 GitHub Pages 原样发布，不走 Jekyll
├── assets/
│   ├── film-720.mp4    15 秒参考片，1280×720，0.8 MB
│   ├── poster.jpg      视频封面
│   └── og.jpg          分享卡片图（1200×630）
└── README.md
```

## 一、让它上外网（GitHub Pages，最快）

1. 仓库 **Settings → Pages**
2. Source 选 `Deploy from a branch`
3. Branch 选 `main`，目录选 **`/site`** → Save
4. 等 30–90 秒，访问 `https://ariesheepy.github.io/video-craft/`

这一步做完，网址就已经是「外部可访问」的了——任何人拿手机 4G 都能打开。只是域名长这样：`ariesheepy.github.io`。

## 二、要一个「自己的网址」（自有域名）

需要两样东西：一个域名（约 ¥30–90/年）+ 一个托管。托管不用买服务器，下面三家都免费：

| 平台 | 免费额度 | 自有域名 | HTTPS | 备注 |
| --- | --- | --- | --- | --- |
| **Cloudflare Pages** | 无限流量、500 次构建/月 | 支持，自动签发证书 | 自动 | 推荐：CDN 全球、不用信用卡 |
| **Vercel** | 100 GB/月 | 支持 | 自动 | 导入仓库即可，构建命令留空、输出目录 `site` |
| **Netlify** | 100 GB/月 | 支持 | 自动 | 拖文件夹就能发，最适合非程序员 |
| GitHub Pages | 100 GB/月 | 支持（在 Pages 设置里填域名） | 自动 | 域名要配 DNS，见下 |

### Cloudflare Pages 的做法（推荐）

1. 注册 Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**
2. 选 `Ariesheepy/video-craft`，Framework 选 **None**，Build command 留空，**Build output directory 填 `site`**
3. Deploy → 得到一个 `xxx.pages.dev` 的地址，先验证能打开
4. **Custom domains → Set up a domain**，填你的域名（如 `videocraft.studio`）
5. 按提示在域名商处加 DNS 记录：
   - 根域 `@` → `CNAME` → `xxx.pages.dev`
   - 或 `www` → `CNAME` → `xxx.pages.dev`
6. 证书自动签发，1–5 分钟生效

### GitHub Pages + 自有域名

1. 先完成上面「一」
2. 在域名商加 DNS：
   ```
   A     @     185.199.108.153
   A     @     185.199.109.153
   A     @     185.199.110.153
   A     @     185.199.111.153
   CNAME www   ariesheepy.github.io
   ```
3. 在仓库里新建文件 `site/CNAME`，内容只有一行你的域名（不带 `https://`）
4. Settings → Pages → Custom domain 填同一域名 → Save → 勾 **Enforce HTTPS**

### 买域名的小提示

- 便宜后缀：`.com` / `.dev` / `.studio` / `.art`（`.dev` 强制 HTTPS）
- 国内平台（阿里云/腾讯云）买域名若要绑定**国内**服务器需备案；绑 Cloudflare/Vercel/GitHub 这类**境外**托管不需要备案
- 国内访问速度：GitHub Pages 偶发慢，Cloudflare/Vercel 也不稳；要国内快就要国内云 + 备案，那是另一条路

## 三、本地预览

```bash
cd site
python -m http.server 8080
# http://127.0.0.1:8080
```

## 四、改内容的位置

| 想改什么 | 在哪 |
| --- | --- |
| 开场动画（十版 → 一镜） | `index.html` 里 `#intro` 的结构 + JS 的 `playIntro()` |
| 首屏那句话 | `<section class="hero">` 里的 `h2` |
| 下载卡片 / 命令 | `<section class="dl">` |
| 五条规则 | `<section class="rules">` 里的五个 `<article class="rule">` |
| 署名 | `<section class="who">` 与页脚 |
| 配色 / 字号 / 间距 | 顶部 `:root` 与 `html[data-theme]` 里的变量 |
| 分享卡片 | `assets/og.jpg`（1200×630）+ `<head>` 里的 `og:*` |

## 几个设计决定

- **一屏一个意思**：全站只有四段（问题 / 下载 / 规则 / 谁做的），每段不超过一屏半。
- **下载放在第二屏**：参考 motionharness.top 的顺序——先给结论，再给拿走的入口。
- **开场是自动的**：十个小画框逐个落位、收成一叠、合成一帧并开始播真实参考片，最后整层溶解。它演示的正是工具想让你做的事：十版 → 一镜。
- **深度由变量控制**：`html[data-theme="light"]` / `dark` 两组 token，切主题只换变量。
- **动效有上限**：入场 22px 位移、滚动只做透明度与位移，`prefers-reduced-motion` 下全部关掉。
