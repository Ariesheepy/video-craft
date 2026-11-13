# video-craft · 网站

介绍 video-craft 的单页站点。**纯静态**：一个 `index.html` + `assets/`，没有构建步骤、没有依赖、不联网取任何东西。

## 本地看

```bash
# 直接双击打开也行，但如果要测视频/相对路径，起个静态服务更稳
cd site
python -m http.server 8080
# 打开 http://127.0.0.1:8080
```

## 部署到 GitHub Pages

仓库里已经带了这一份，路径是 `site/`。步骤（只需一次）：

1. 打开 **Settings → Pages**
2. **Source** 选 `Deploy from a branch`
3. **Branch** 选 `main`，目录选 **`/site`**
4. Save，等 30–60 秒

地址：`https://ariesheepy.github.io/video-craft/`

> 如果链接 404，通常是 Pages 还在构建，或目录选成了 `/root`。改回 `/site` 重新保存即可。

## 结构

```
index.html          全部内容：样式、章节、交互都在这一份里
assets/film-720.mp4 参考片 720p（0.8 MB，静音循环，可点开声音）
assets/poster.jpg   视频封面，也是 og:image
assets/f-*.jpg      三张静帧，用于「印字 / 读图 / 落版」的证据条
```

## 改内容

- **十版表**：`index.html` 里 `const V = [...]`，每行 `[版本, 怎么拍, 硬切, 镜长, 中心率]`
- **五条规则**：`const RULES = [...]`，每行 `[编号, 标题, 正文, 脚注]`
- **指标 / 文案**：直接改对应章节的 HTML
- **配色 / 字体**：`:root` 里的 CSS 变量（`--acc` 是那一点橙）

## 设计上的几个决定

- **一屏一件事**：每节占满视口，滚一下换一个意思，不做长文排版。
- **橙色只用在「当前」**：右侧章节索引、表格里被选中的那几行、播放器角标。其余全是黑白灰。
- **数字用等宽字体**：所有指标读起来像仪表盘，而不是正文。
- **尊重 `prefers-reduced-motion`**：关掉动画后仍能读完全部内容。

## 页面自身的指标

作者自用：这页也按 `docs/MOTION-RULES.md` 的读者视角检查过——首屏只有一个焦点，滚动时每屏只有一次位移，运镜（这里是滚动动画）不超过 16px 的入场位移。
