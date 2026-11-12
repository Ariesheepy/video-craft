# 管线怎么选（选一条，别并行）

## 一、先看你要什么

| 需求 | 走哪条 |
|---|---|
| 要"片"——有镜头、有时间、有风格 | **lemo-opuscar**（自带渲染器 + 66 种风格）或 **motion-showreel** |
| 产品宣传片，想用真实网页/界面 | **video-shotcraft**（Remotion + 真实页面截图） |
| 画面里有卡片、连线、流程图，要能改的图 | **drawai-video**（画布 + 视频节点） |
| 只是要一段代码动画 / 风格参考图 | **code-animation-prompts** |
| 要混剪、裁切、拼接已有素材 | 不属于以上任何一条；用 ffmpeg，别硬套 |

## 二、选错的典型症状

- 用画布管线做"有电影感"的片子 → 出来是排版（画布的原语只有矩形和文字）
- 用代码动画管线做"真实界面演示" → 界面是假的，观众看出来
- 同时开两条管线想取长补短 → 时间轴对不上，剪辑点全乱

## 三、lemo-opuscar 的最小用法

```bash
# 一个项目 = 一个文件夹，里面是 index.html + 素材
# index.html 必须给出三样东西：
#   window.DUR = 15                    （秒）
#   window.READY = Promise             （字体/图片就绪）
#   window.render(t)                   （画第 t 秒这一帧）
# 可选但强烈建议：
#   window.TEXTS(t) → [{x0,y0,x1,y1}, ...]   给 metrics.mjs 测文字面积
#   window.CAM(t)   → {x, y, zoom, rot}      给 metrics.mjs 测运镜

node <lib>/core/render/still.mjs "<项目>" 0.9 4.2 9.8 --out "<项目>/stills"
node <lib>/core/render/video.mjs "<项目>" --fps 24 --out "<项目>/out.mp4"
```

渲染前提：headless Chromium 能启动（沙箱里 `spawn EPERM` 就是权限不够），以及 `TEMP` 可写。这两条最容易踩。

## 四、风格只定一个来源

风格库里挑**一个** slug，其余只当灵感。混两个库的风格，出来会像"每个元素都有自己的审美"。

在 lemo 里：`styles/<slug>/STYLE.md` 有该风格的色板、字体、剪辑节奏、禁止项——照它做，别自创。
