# video-craft

**A process gate + four measurement tools for making short motion videos with an AI agent.**
把「做出来的视频像 PPT」拆成可测的结论，再变成动手前必须过的一道门。

> 一个 15 秒的虚构产品片，同一文案、同一色板、同一字体、同一个渲染器，**只改"怎么拍"，做了十版**。
> 每一版都测了切数、镜长、构图中心率、文字面积、逐秒动能量。下面是结果。

| 版本 | 怎么拍 | 硬切 | 平均镜长 | 构图中心率 | 结论 |
|---|---|---|---|---|---|
| A | 幻灯片：四页、居中、淡入 | 3 | 3.75s | **100%** | 最像 PPT，**但文字面积全场最低（5.4%）** |
| B | 9 个镜头，物体凭空出现 | 8 | 1.67s | 33% | 切得碎，更乱 |
| C | 一条推轨走到底 | **0** | 15s | 34% | 不 cut 了，但只像"滑轨视频" |
| D | C + 三次反向 + 两次升降 | 0 | 15s | 43% | 像一个房间了 |
| E | 机位锁死 + 全屏墨条扫过 | 0 | 15s | 0% | **仍被否：扫光 = 换页** |
| F | 锁死 + 每件东西自己进出 | 0 | 15s | 18% | 物件说话，幻灯片感消失 |
| G | F + 运镜（travel 7380） | 0 | 15s | 28% | 运镜抢戏 |
| H | G 收敛成呼吸 + 固定字幕 | 0 | 15s | 18% | 元素主导，运镜辅助 |
| I | 走廊：灭点固定、地面线向观众流 | 0 | 15s | 18% | 有纵深，内容还呆在墙上 |
| J | I + BGM 拍点 + 克制倾身（travel 237） | 0 | 15s | 18% | 交付版 |

参考片实测（[docs/MOTION-CASES.md](docs/MOTION-CASES.md)）：样本片切 4–6 次、平均镜长 **15–31 秒**、逐秒动能量 3.2–3.8，且**切点都落在音乐重音上**。

## 五条结论（每条都挂着数字）

1. **文字面积占比抓不住 PPT。** A 只有 5.4%（十版最低），却最像 PPT——幻灯片是"字少、字大、居中"。这条指标一度被当主判据，是错的。
2. **构图中心率更可信。** A 是 100%（每个元素都在画面中心），其余版本 18–43%。及格线 **≤ 40%**。
3. **PPT 感的第一来源是"场景切换"**，不是配色、不是字体、不是转场。
4. **变化必须以"一件东西"为范围。** 整幅画面同一瞬间一起变（扫光 / 全屏擦 / 整屏淡入）= 换页，不管画成什么。
5. **运镜能用，但有上限。** 一秒左一秒右会让观众重新定位。**位移 ≤ 350 px/s、一次一个方向、只在换重点时动。**

## 里面有什么

```
SKILL.md              技能入口（DSH 技能格式；其它 agent 直接读也行）
docs/
  MOTION-RULES.md     硬规则：五条铁律 + 物件语法 + 运镜上限 + 验收清单
  MOTION-CASES.md     证据册：十版数据、每个坑的修法
  PIPELINES.md        五条渲染管线怎么选
  TREATMENT.md        创意简报模板
  SHOTLIST.md         九列分镜表模板
tools/
  viewer_audit.py     逐秒动能量 / 边缘（机位是否在动）/ 字幕带是否在抖
  beats.py            BPM + 拍点（把动作钉到音乐上）
  metrics.mjs         切数 / 镜长 / 文字面积 / 构图中心率 / 运镜
examples/apple-ab/    交付版（J）的参考实现 + 静帧 + 剪辑表
scripts/install.sh    装到 ~/.dsh/skills/
```

## 装

```bash
# 把下面这行的 Ariesheepy 换成仓库所有者的 GitHub 用户名（就是 github.com/Ariesheepy 那一段）
git clone https://github.com/Ariesheepy/video-craft.git
cd video-craft
bash scripts/install.sh        # 拷到 ~/.dsh/skills/video-craft
# Windows: powershell -ExecutionPolicy Bypass -File scripts\install.ps1
```

> 如果你的网络访问 `github.com:443` 会被重置（国内常见），git 可以走 SSH：
> `git clone git@github.com:Ariesheepy/video-craft.git`（需要先把公钥加到 GitHub）。
> 不装 git 也行：下载 ZIP → 解压 → 把 `video-craft/` 放进 `~/.dsh/skills/`。

重启 DSH（或新开会话），技能列表里出现 `video-craft` 就行。

**不装也能读**——全部是 Markdown，直接把 `docs/MOTION-RULES.md` 丢给任何 agent 都能用。

## 用

```bash
# 动能量体检（只要 ffmpeg + numpy）
python tools/viewer_audit.py film.mp4 --band 996,1046

# 拍点（只要 numpy + soundfile + ffmpeg）
python tools/beats.py bgm.mp3 --from 5 --length 15

# 结构指标（要 node + playwright-core；页面需自报 window.TEXTS/CAM）
node tools/metrics.mjs "<项目目录>" 0.25
```

及格线：**构图中心率 ≤ 40%、硬切 0、文字面积峰值 < 20%、边缘动能量 < 1.0**。

## 它不是什么

- **不是渲染器。** 渲片要另配一条管线（[lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar)、motion-showreel、Remotion、任何 HTML→MP4 都行）。
- **不是模板库。** 它管"什么时候动、动多少、怎么验"，不管"长什么样"。
- **不保证好看。** 它保证你不会做出"幻灯片冒充视频"和"运镜抢戏"这两种最常见的错。

## English

**video-craft** is a process gate for AI-made short motion videos, distilled from a 10-version controlled experiment (same copy, palette, type, renderer — only the shooting changed). It ships five hard rules, a case book with the measured numbers, three measurement tools (motion energy, beat grid, structural metrics), and two templates (treatment + shot list). Rules and docs are plain Markdown and work with any agent; `SKILL.md` is in [DeepSeek Harness](https://github.com/) skill format. It is not a renderer — bring your own (Remotion, Playwright + ffmpeg, lemo-opuscar, …).

## 发布（仓库所有者）

```bash
git remote add origin git@github.com:Ariesheepy/video-craft.git   # SSH（github.com:443 被墙时用这个）
git push -u origin main
```

没有 git 的话，`scripts/publish.mjs` 走 GitHub REST API（只连 api.github.com）：

```bash
GITHUB_TOKEN=ghp_xxx node scripts/publish.mjs --repo video-craft
```

## License

MIT. 见 [LICENSE](LICENSE)。
