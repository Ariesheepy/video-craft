# video-craft · 站点

单文件落地页，零依赖、零构建。默认浅色，右上角可切深色（记在 `localStorage`）。

```
site/
├── index.html          整站（HTML + CSS + JS 全在里面）
├── assets/
│   ├── film-720.mp4    15 秒参考片，1280×720，0.8 MB
│   └── poster.jpg      视频封面
└── README.md
```

## 本地预览

直接双击 `index.html` 也能看，但视频和相对路径建议起一个本地服务：

```bash
cd site
python -m http.server 8080
# http://127.0.0.1:8080
```

## 部署到 GitHub Pages

1. 仓库 Settings → Pages
2. Source 选 `Deploy from a branch`
3. Branch 选 `main`，目录选 `/site` → Save

约一分钟后：`https://ariesheepy.github.io/video-craft/`

## 改内容的位置

| 想改什么 | 在哪 |
| --- | --- |
| 开场动画（十版 → 一镜） | `index.html` 里 `#intro` 的结构 + JS 的 `playIntro()` |
| 首屏那句话 | `<section class="hero">` 里的 `h2` |
| 下载卡片 / 命令 | `<section class="dl">` |
| 五条规则 | `<section class="rules">` 里的五个 `<article class="rule">` |
| 署名 | `<section class="who">` 与页脚 |
| 配色 / 字号 / 间距 | 顶部 `:root` 与 `html[data-theme]` 里的变量 |

## 几个设计决定

- **一屏一个意思**：全站只有四段（问题 / 下载 / 规则 / 谁做的），每段不超过一屏半，不做十屏滚动。
- **下载放在第二屏**：参考 motionharness.top 的顺序——先给结论，再给拿走的入口，规则往后放。
- **开场是自动的**：十个小画框逐个落位，收成一叠，再合成一帧并开始播真实参考片，最后整层淡出。这不只是过场，它演示的正是工具想让你做的事：十版 → 一镜。
- **深度由变量控制**：`html[data-theme="light"]` / `dark` 两组 token，切主题只换变量，不重排布局。
- **动效有上限**：入场 22px 位移、滚动只做透明度与位移，`prefers-reduced-motion` 下全部关掉，内容照常可读。
