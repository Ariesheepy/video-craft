---
name: video-craft
description: 做视频 / 动画 / 动效 / 片头 / 宣传片 / 科普片 / 动态排版 / Logo 演绎时先读这一份：把"像 PPT"的十版实测教训变成可执行流程——一镜到底、变化以一件东西为范围、运镜有上限、动作钉在音乐拍点上，出片前跑指标体检。用户说"做个视频/动画/动效/宣传片/片头"或问"为什么我的视频像 PPT"时使用。
---

# video-craft：做片前先过这道门

这不是渲染器，是**流程 + 验收**。渲染器按 §6 选一个。

本技能自带资料在 `docs/`，工具在 `tools/`（都在本 SKILL.md 同一目录下）。
Windows 默认位置：`C:\Users\<你>\.dsh\skills\video-craft\`；macOS/Linux：`~/.dsh/skills/video-craft/`。
**先确认这两个目录能读到**；读不到就只用本文件的内联规则（§4、§7 已足够跑起来），并告诉用户资料缺失。

## 0. 开头必须三行声明

```
主管线：<选一条>
主风格来源：<一个库 / 一个风格，别叠加>
停点：<最多 3 个：需求 → 方向 → 导出>
```

## 1. 先读（按顺序）

> **本机提示**：若 `D:/DeepseekHarness_WorkPlace/MOTION-RULES.md` 存在，以它为准（那边是最新版），`docs/` 里的是随包副本。


| 顺序 | 文件 | 作用 |
|---|---|---|
| 1 | `docs/MOTION-RULES.md` | 硬规则：五条铁律 + 物件语法 + 运镜上限 + 验收 |
| 2 | `docs/MOTION-CASES.md` | 证据册：十版实测数据、每个坑的修法 |
| 3 | `docs/PIPELINES.md` | 五条管线怎么选、什么时候不该用 |
| 4 | `docs/TREATMENT.md` + `docs/SHOTLIST.md` | 两份模板，照着填 |

## 2. 必问一轮问齐（别问第二遍）

1. 给谁看、多长、要不要声音（人声 / BGM / 都无）
2. **几个场景、各自承担什么、怎么衔接**（没答默认 1 场并说明理由；>4 场预警"会像 PPT"）
3. 有没有指定 BGM（有 → 要文件路径，跑 `tools/beats.py` 定拍）
4. 主风格来源（一个库或一个风格，不要"几个都参考"）
5. 交付：分辨率 / 帧率 / 要不要源码

## 3. 动手顺序（缺一步就返工）

1. 填 `TREATMENT.md`：一句话戏剧问题 / 信息阶梯 / 视觉方向
2. 填 `SHOTLIST.md`：九列镜头表，每行末尾勾一遍"反 PPT 检查"
3. 建工程（见 §6）
4. **先出 3–5 张静帧**看构图，别直接渲视频
5. 渲视频 → 跑 §5 指标 → 修 → 再渲

## 4. 四条硬规则（资料读不到时靠这四条）

1. **默认一镜到底**，不 cut。要切先答"为什么这一刀必须切"。
2. **元素的出现与消失都要有交代**（形式不限，但不能凭空出现/消失、不能靠 cut 让它不见）。
3. **变化以"一件东西"为范围**。整幅画面同一瞬间一起变（扫光 / 全屏擦 / 整屏淡入）= 换页。
4. **运镜可以用，但有上限**：位移 ≤ 350 px/s、缩放 ≤ 3%/s、一次一个方向、只在换重点时动、动完留一拍静止。

判据：**每个 0.5 秒问三句——重点是什么？眼睛会落在哪？一致吗？**
终判据：**观众看完记住的是画面里的东西，还是镜头怎么动。**

## 5. 测谎工具（跑不了就明说，别假装）

```bash
# 逐秒动能量 / 边缘（机位是否在动）/ 字幕带是否在抖   ← 只要 ffmpeg + numpy
python tools/viewer_audit.py film.mp4 --band 996,1046

# BPM + 拍点                                       ← 只要 numpy + soundfile + ffmpeg
python tools/beats.py bgm.mp3 --from 5 --length 15

# 切数 / 镜长 / 文字面积 / 构图中心率 / 运镜         ← 只要 node + playwright-core
node tools/metrics.mjs "<项目目录>" 0.25
```

`metrics.mjs` 需要页面自报 `window.TEXTS(t)`（返回 `{x0,y0,x1,y1}` 或 `{x,y,w,h}` 数组）和 `window.CAM(t)`（返回 `{x,y,zoom,rot}`）——建工程时就把这两个函数写上，否则测不了。

及格线：**构图中心率 ≤ 40%、硬切 0、文字面积峰值 < 20%、边缘动能量 < 1.0、字幕带静止段 < 0.8**。

⚠️ **文字面积不是主判据**——幻灯片往往数字最低（字少、字大、居中）。看构图中心率，看"有没有东西在真动"。

## 6. 选渲染管线（看你手上有什么）

| 有什么 | 怎么渲 |
|---|---|
| **lemo-opuscar** | `node <lib>/core/render/still.mjs "<项目>" 0.9 4.2 --out "<项目>/stills"`；`node <lib>/core/render/video.mjs "<项目>" --fps 24 --out "<项目>/out.mp4"` |
| **motion-showreel / drawai-video** | 用它们自己的渲染命令；规则与工具照用（`viewer_audit` 只吃成片） |
| **只有 node + playwright-core** | 自己开 headless Chromium 逐帧截图，再用 ffmpeg 拼：`ffmpeg -framerate 24 -i f%05d.png -c:v libx264 -pix_fmt yuv420p out.mp4` |
| **什么都没有** | 只能交分镜表 + 静帧，不能交成片。**直接告诉用户缺什么**，别硬凑 |

合音：

```bash
ffmpeg -ss S -t N -i bgm.mp3 -vn -af "afade=in:st=0:d=0.5,afade=out:st=<N-0.8>:d=0.8" -c:a pcm_s16le b.wav
ffmpeg -i out.mp4 -i b.wav -c:v copy -c:a aac -b:a 192k -shortest film.mp4
```

拼九宫格用 PIL（`Image.new` + `paste`）；ffmpeg 的 9 路 `xstack` 在部分构建上会报 `Stream specifier ':v' matches no streams`。

## 7. 七个一定会犯的错

| 症状 | 修法 |
|---|---|
| 透视线穿过文字 | 灭点压到地平线以下，别放画面中心 |
| 擦除完物件还在 | `if (t > t0 + dur) return;` |
| 工具（刮刀/笔）画到物件外 | 局部坐标当世界坐标用了，加横向偏移参数 |
| 离场物件横穿别人的位置 | 换退场方向（向下撤 = 从墙上取下来） |
| 侧视图跟正视图一样 | 检查 `sx` 缩放参数有没有一路传下去 |
| 标签看不见 | 别用纸色画在纸底上 |
| 字幕被物件压住 | 字幕放屏幕层，物件放世界层 |

## 8. 说"完成"之前

- [ ] 回复开头有三行声明
- [ ] 指标全过，或明确说哪条没过、为什么可以接受
- [ ] 片子有声音（或明确说"无音轨"）
- [ ] 项目目录里有 `EDIT.md` / `CAMERA.md` 之类做法记录
- [ ] 不夸大：没测的说没测，没渲的说没渲
