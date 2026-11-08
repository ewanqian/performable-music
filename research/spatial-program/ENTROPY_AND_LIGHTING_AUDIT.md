# ENTROPY 三维化 与 环境灯光演出 — 可行性审计

- 审计日期：2026-11-08
- 审计范围：私有仓库 `ewanqian/atmospheric-escape-liveset`（只读）+ 本仓库 `performable-music` 相关既有代码
- 任务性质：只读调查与写作。**本次未修改任何现有代码文件，未运行 Blender，未运行渲染，未连接任何灯光/DMX/Art-Net 硬件，未在 Quest/AVP 上测试。**
- 本文约定：**【事实】** = 本次实际读到的文件内容、API 返回或实际计算的数值；**【推断】** = 基于事实的判断、风险与建议，未经实测。

---

## 0. 结论先行

**【事实】** ENTROPY 仓库里**没有任何 `.blend`、`.glb`、`.gltf`、`.obj`、`.fbx`、`.usdz` 文件，也没有任何音频文件、灯光 patch、DMX/Art-Net 数据或时间码文件**。全仓库 108 个文件只有 8 种扩展名：47 个 `.png`、28 个 `.py`、11 个 `.html`、11 个 `.md`、6 个 `.json`、2 个 `.js`、1 个 `.ps1`、1 个 `.gitignore`。

**【事实】** 但 ENTROPY **确实存在真实三维几何数据**，只是它不是以模型文件形式存在，而是被内嵌在 `visuals/spacecraft/v04/W03_SPACECRAFT_LOCAL_OFFLINE_v04.html` 的 `const MODELS=[...]` 里：8 个航天器、共约 4.7 万个顶点、14.3 万条边，其中 4 个是闭合三角网格。

**【推断】** 因此对"能不能三维化"的回答是：**能，但起点不是"找模型"，而是"从 HTML 里把已存在的几何抽出来"**。这条路的成本被严重低估，同时它的风险也被误判——真正的难点不是导出，而是"线框算不算三维化"以及"部件归属不存在"。

**【事实】** 本仓库已经有一条**跑通过的**"音乐事件 → 可见变化"链路：`performances/2026-12-03-phase-01/pressure-test-001/runtime/conductor.py`（Show Score 校验 + OSC + WebSocket）→ `runtime/visual.js`（WebGL uniform 驱动）。`TEST_RESULTS.json` 记录了 1759 帧 schema 合法帧、1 次事件、视觉回执 28.9 ms、软件 kill 与断线 watchdog 均通过。

**【推断】** 因此"环境灯光演出"不需要新建引擎，它需要的是**换掉被驱动的那一个视觉参数，并把"灯"当成一个受控输出而不是一种风格**。

---

## 1. 调查方法与证据等级

| 手段 | 用途 | 局限 |
|---|---|---|
| GitHub 只读 API（匿名） | 首次访问返回 404 | 仓库为 private，匿名不可见 |
| `gh api`（已登录 `ewanqian`，token 含 `repo` scope） | 读取仓库元信息、递归 tree、文件内容、issue、commits | 仅读，未 push |
| 递归 `git/trees?recursive=1` | 得到完整文件清单与字节数 | 不含 git 历史中间态 |
| 原始文件下载到临时目录后解析 | 解析 W03 v04 内嵌几何并计算拓扑 | 在 `/private/var/.../T/entropy-audit`，未写入两个仓库 |
| `ripgrep` 检索本仓库 | 查找既有 ENTROPY 引用 | 排除 `.git`、`node_modules` |
| 未使用 | Blender、渲染、DMX 硬件、Quest/AVP | 因此相关结论全部标为未验证 |

**重要边界：** `AGENTS.md`（私有仓库根目录）明确要求原始 7 个 HTML、`manifest.json`、`index.html`、`output/playwright` 基线图只读。本次审计严格遵守：只读取，未改一字节，也未把私有资产复制进本公开仓库。

---

## 2. ENTROPY 仓库：实际存在什么

### 2.1 仓库元信息【事实】

| 字段 | 值 |
|---|---|
| 全名 | `ewanqian/atmospheric-escape-liveset` |
| 可见性 | **private** |
| 描述 | 逃离大气层演出 liveset：Spacecraft、星系、能量场视觉原版归档，状态截图、演出反馈与后续路线 |
| 主语言 | HTML |
| 体积 | 20,453 KB（约 20 MB） |
| 默认分支 | `main` |
| 创建 | 2026-09-10T05:47:22Z |
| 最后 push | 2026-11-08T04:13:17Z |
| 提交总数 | 12 |
| 开放 issue | 11 |
| License | 无 |

**为什么第一次查是 404：** 该仓库不在 `ewanqian` 的 31 个公开仓库列表里，匿名 `api.github.com` 对 private 仓库一律返回 `Not Found`（不是 403），这是 GitHub 的隐私设计，不代表仓库不存在。

### 2.2 文件类型统计【事实】

来自 `git/trees/main?recursive=1` 的实际计数：

| 扩展名 | 数量 | 说明 |
|---|---|---|
| `.png` | 47 | 42 张 `output/playwright/` 状态截图 + 5 张 `reactor/output/spherical_final/` Blender 渲染卡 |
| `.py` | 28 | Blender 管线、验证脚本、p5 验证脚本 |
| `.html` | 11 | 6 个原始视觉 + 归档目录页 + realtime 页 + 3 个 p5 模板 |
| `.md` | 11 | 说明与约束文档 |
| `.json` | 6 | `manifest.json` + `reactor/output/` 下 5 个 sidecar |
| `.js` | 2 | `reactor/realtime/main.js`、`viz/p5.min.js` |
| `.ps1` | 1 | `arena/make_utility_clips.ps1` |

**零个** `.blend` / `.glb` / `.gltf` / `.obj` / `.fbx` / `.usdz` / `.wav` / `.mp3` / `.aiff` / `.mid` / `.als`。

### 2.3 逐目录：真实存在 vs 只是计划

#### A. 原始视觉归档（真实存在，且是字节级原版）

| 路径 | 大小 | 技术形态【事实】 |
|---|---|---|
| `visuals/spacecraft/v03/W03_SPACECRAFT_LOCAL_OFFLINE_v03.html` | 2,770,834 B | Canvas 2D，内嵌几何 |
| `visuals/spacecraft/v04/W03_SPACECRAFT_LOCAL_OFFLINE_v04.html` | 2,775,704 B | Canvas 2D，内嵌几何（新增切换动画） |
| `visuals/galaxy/workstation-v04/...WORKSTATION_v04.html` | 25,204 B | 无 `AudioContext`，`BPM=100` 常量 |
| `visuals/galaxy/editorial-v07/...v07_EDITORIAL_CELESTIAL.html` | 31,525 B | 同上 |
| `visuals/energy-field/cinematic-v05/...8STATES_STAGE_MAPPING_v05.html` | 482,460 B | `getContext('2d')` |
| `visuals/energy-field/numerical-v02/W02_PURE_NUMERICAL_FIELD_v02.html` | 20,024 B | 无音频 API |

**全仓库 0 个 `AudioContext`、0 个 `AnalyserNode`、0 个 `getByteFrequencyData`。**

**【事实】** `BPM=100` 在 W03 v03/v04、Galaxy v04/v07 中都只出现 1 次，是一个**常量**，用于推导循环时长（4 小节 = 9.6 s），不是从音频分析得来的。
**【推断】** 所以"ENTROPY 是音频反应式视觉"这个说法不成立。它是**基于固定 BPM 的手动切换视觉**。这一点直接决定了"音乐事件驱动"要从外部接进来，而不是从原文件里挖出来。

#### B. Blender 管线（代码真实存在，产物不在仓库）

`reactor/README.md` 声称运行 `blender --background --factory-startup --python reactor/run.py` 会产出 `reactor.blend`、`reactor.glb`、`reactor.obj`、`machine.json` 等。**【事实】** 这些产物**不在** tree 里。

仓库里真实存在的只有：

| 路径 | 内容 |
|---|---|
| `reactor/pipeline/*.py` | 9 个模块：`collections` `constants` `explode` `export` `import_norm` `materials` `points_curves` `section` `states` `validate` |
| `reactor/reactor/*.py` | `factory` `generator` `spherical` `subway` |
| `reactor/output/machine.json` | **真实存在**，11,373 B |
| `reactor/output/{anchors,edges,parts,points}.json` | 真实存在 |
| `reactor/output/report.md` | 真实存在 |
| `reactor/output/spherical_final/*.png` | 5 张渲染卡，共约 15 MB |

**【事实】** `reactor/output/machine.json` 的实际内容是：
```
name: reactor_tokamak_a
parts: 53
anchors: 13
sample part: {"id":"core_01","label":"CORE","explode_axis":[0,0,1],"blender_object":"reactor_core_01"}
```
`report.md` 记录 10 项检查、0 错误、0 警告、53 个 mesh、53 个 explode empty。

**【事实】** 注意两点错位：
1. `machine.json` 描述的是 **tokamak**（53 部件），而 `reactor/README.md` 说当前主视觉已换成 **spherical**（177 部件）。仓库里没有 spherical 版本的 `machine.json`。
2. 53 个部件是**程序化生成的反应堆**，与归档的 8 个航天器**没有任何关系**。

#### C. Three.js 实时渲染器（代码真实，数据缺失）

`reactor/realtime/` 下有 `index.html`、`main.js`、`README.md`、`verify_pixels.py`、`verify_realtime.py`。

**【事实】** `main.js` 第 14–15 行：
```js
const DATA = PARAMS.get('data') || './data/';
const GLB  = DATA + 'reactor.glb';
```
但 tree 中 **不存在 `reactor/realtime/data/` 目录**，也就没有 `reactor.glb`、`machine.json`、`points_sampled.json`、`edges_feature.json`。

**【事实】** `main.js` 的"节拍"实现是纯时钟：
```js
const PERIOD = 9.6;   // seconds, 100 BPM × 4 bars
const clock = new THREE.Clock();
const t = clock.getElapsedTime();
```
它**不接收任何外部事件**，也没有 WebSocket/OSC 入口。所谓 "beat rail" 是 `Math.floor((sec*100/60/PERIOD)*16)%16` 算出来的。

**【推断】** 所以 `reactor/realtime/main.js` 是一个**可复用的渲染骨架**（GLTFLoader + EdgesGeometry + 双 pass + DOM HUD），但它现在既没有模型可加载，也没有事件接口。把它当成"已有实时演出系统"会高估现状。

#### D. p5.js 三维模板（真实可跑，但是程序化几何）

`viz/01_sphere_reveal.html`、`02_orbital_flow.html`、`03_machine_schematic.html` + `p5.min.js`（1,034,532 B）。

**【事实】** `viz/README.md` 自己写明："这些是程序化几何（球面 Fibonacci 分布、环轨道、同心层），**不依赖外部数据文件**。"

**【推断】** 这三个页面是"三维化长什么样"的**风格参考**，不是资产。它们不能回答"我们的飞船能不能转起来"。

#### E. Arena 演出构建（文档真实，素材缺失）

`arena/ARENA_BUILD.md` 定义了 6 层结构（L1 BASE 到 L6 EVENT），100 BPM、25 fps、9.6 s 循环，并列出素材表，声称 `reactor_w03_loop.mp4`、`black_fallback.mp4`、`flash_white.mp4`、`pulse.mp4`、`scan_h.mp4` 等。

**【事实】** `arena/` 目录下只有 `ARENA_BUILD.md` 和 `make_utility_clips.ps1` 两个文件，**所有 `.mp4` 都不存在**。表格里 "ready" 的标注与实际仓库不符。

**【推断】** 这是本仓库最容易被误引用的一处：文档语气像是已经交付，实际是脚本+规范。任何对外表述都不能说"演出素材已就绪"。

### 2.4 明确不存在的资产（清单）

| 资产类别 | 状态 | 证据 |
|---|---|---|
| Blender 工程 `.blend` | **不存在** | 递归 tree 无匹配 |
| glTF / GLB | **不存在** | 同上 |
| OBJ / FBX / USDZ | **不存在** | 同上 |
| 音频文件（wav/mp3/aiff/flac） | **不存在** | 同上 |
| Ableton `.als` / MIDI | **不存在** | 同上 |
| DMX / Art-Net / sACN 配置 | **不存在** | 全仓库 grep 无结果 |
| 时间码（LTC/MTC）数据 | **不存在** | 同上 |
| 视频素材 `.mp4` | **不存在** | `arena/` 仅 2 个文本文件 |
| `reactor/realtime/data/` | **不存在** | tree 中无此目录 |

### 2.5 提交历史【事实】

12 次提交，跨 2026-09-10 → 2026-11-08：

| 提交 | 日期 | 说明 |
|---|---|---|
| `381118ea` | 2026-11-08 | chore(entropy): private 3D model audit gate, archive protection and read-only agent |
| `fcc2b261` | 2026-09-24 | feat(viz): 3 runnable p5.js 3D visualization pages |
| `2cea79e7` | 2026-09-24 | feat(reactor): Subway hero machine — blocked out, pipeline-integrated |
| `6c46a68b` | 2026-09-24 | feat(arena): opening-day build — layer organization + utility clips |
| `8eee9591` | 2026-09-24 | feat(reactor): realtime analysis overlay prototype (Three.js, no build) |
| `7a3f9e35` | 2026-09-24 | feat(reactor): export realtime-friendly subset for analysis overlay |
| `67eb7372` | 2026-09-23 | feat(reactor): verify + render W03 states on the spherical reactor |
| `c0231fc9` | 2026-09-23 | feat(reactor): W03 acquisition → native Geometry Nodes + camera-space HUD |
| `848f1c61` | 2026-09-23 | feat(reactor): spherical instrumented reactor + section/state controls |
| `e0446718` | 2026-09-22 | feat(reactor): procedural reactor facility + Blender asset pipeline (#4, #5) |
| `b0fe53cf` | 2026-09-22 | docs: add REACTOR machine infrastructure agent brief |
| `174875b8` | 2026-09-10 | Archive atmospheric escape liveset originals, state screenshots and roadmap |

**【事实】** 9 月底有 10 天高强度 reactor 开发，之后停摆 6 周，11-08 只做了一次"审计闸门"提交（没有新模型）。
**【推断】** 说明三维化在 9 月底就已经卡在"没有真模型"这一步，而不是卡在技术上。

### 2.6 Issue 状态【事实】

`#11 ENTROPY-3D-01 | Archive-grounded four-world 3D port: asset and renderer audit first`，状态 `OPEN`，正文首行：

> `STATUS: READY_NOT_STARTED.`

`#10 [EPIC] REACTOR / MACHINE INFRASTRUCTURE LIVE SET` 及 #2–#9 全部 `OPEN`。

**【事实】** 仓库内三份文档互相印证同一件事：
- `AGENTS.md`：*"The current committed tree has a Blender procedural asset pipeline and machine.json; reactor/realtime expects reactor/realtime/data/reactor.glb but that heavy binary is **not committed**. Do not claim a 3D mesh was migrated until an actual geometry file, source license, export command and preview are verified."*
- `experiments/entropy-spatial-3d/ASSET_AUDIT_GATE.md`：*"If no real model asset exists, status is BLOCKED_MISSING_ARTIST_ASSET. Next action is author-authorized Blender export, not generate fake ships."*
- `.opencode/agents/entropy-audit.md`：*"When GLB not available, mark BLOCKED rather than re-creating it procedurally from generic prompts."*

**【推断】** 这三条约束写得非常对，但它们的共同前提——"没有真模型"——**被本次审计部分推翻**。真模型存在，只是藏在 HTML 里。这改变了下一动作：不是"等艺术家导出 GLB"，而是"用脚本把已授权的归档几何转成 GLB"。

---

## 3. 关键发现：W03 v04 内含真实几何

这是本次审计最重要的结果，需要完整说明，因为它同时是机会和陷阱。

### 3.1 数据在哪、长什么样【事实】

文件：`visuals/spacecraft/v04/W03_SPACECRAFT_LOCAL_OFFLINE_v04.html`
完整性：SHA-256 = `232325eb8fbcf97f91ac1f2bc1a87fd4fe57bf5b393272870837d6cbca3de1ae`，与 `manifest.json` 中 `id: 4` 记录**逐字节一致**（我实际下载后 `shasum -a 256` 复核过）。

文件第 1480 字符起是 `const MODELS=[...]`，占全文约 2.75 MB（全文 2,775,681 字符）。该数组是**合法 JSON**，可被 `json.loads` 直接解析。每个模型的结构固定为：

```json
{"id": "GEMINI",
 "title": "TWO-CREW CAPSULE",
 "parts": ["CREW CAPSULE", "EQUIPMENT MODULE", "ADAPTER", "RCS", "ENGINE"],
 "v": [[x,y,z], ...],        // 顶点
 "e": [[i,j], ...]}          // 边（顶点索引对）
```

### 3.2 八个模型的规模与拓扑【事实，本次实际计算】

我把每个模型的边集构造成邻接表，枚举所有三元组求共同邻居以复原三角形，再统计"只被 1 个三角形使用的边"（边界边）：

| id | 标题 | 顶点 V | 边 E | 可复原三角形 | 边界边 | 闭合流形 | parts 名数 |
|---|---|---:|---:|---:|---:|:---:|---:|
| APOLLO | COMMAND / SERVICE MODULE | 12,984 | 35,872 | 23,872 | 128 | 否 | 5 |
| SOYUZ | THREE-MODULE SPACECRAFT | 10,140 | 28,472 | 18,944 | 112 | 否 | 5 |
| GEMINI | TWO-CREW CAPSULE | 4,850 | 13,464 | 8,976 | **0** | **是** | 5 |
| VOSTOK | SPHERICAL REENTRY VEHICLE | 4,120 | 11,976 | 7,984 | **0** | **是** | 5 |
| LANDER | LUNAR LANDER | 2,286 | 6,330 | 4,188 | 96 | 否 | 5 |
| ORBITAL BUS | ORBITAL SATELLITE BUS | 5,522 | 15,204 | 10,136 | **0** | **是** | 5 |
| DEEP PROBE | DEEP-SPACE PROBE | 1,878 | 5,472 | 3,648 | **0** | **是** | 5 |
| TRANSFER | TRANSFER PROPULSION STAGE | 6,638 | 18,224 | 12,112 | 112 | 否 | 5 |
| **合计** | | **48,418** | **143,014** | **94,860** | | | |

**【事实】** 无孤立顶点、无非流形边（同一对顶点被 >2 个三角形共享的情况为 0）。GEMINI 的包围盒为 `[-0.637,-0.629,-1.0] ~ [0.637,0.629,1.0]`，是归一化到 ±1 的单位尺度。

**【推断】** 这说明 `e` 不是随手画的装饰线，而是**真实三角网格的边集**。4 个模型（GEMINI、VOSTOK、ORBITAL BUS、DEEP PROBE）是完全闭合的流形，可以直接生成实体 glTF 而**不需要编造任何顶点**。另外 4 个有 96–128 条边界边，对应开口端（如对接环、喷口），属于正常的开放壳体。

### 3.3 三个必须承认的限制【事实 + 推断】

**限制一：原文件只画线，不画面。**
`drawModel` 函数（同文件）只做 `ctx.moveTo / ctx.lineTo / ctx.stroke()`，从未填充三角形。`drawModelAccent` 同理。**【推断】** 所以归档里的"飞船"在视觉上是**线框**。把它转成实体着色，是从已有拓扑"还原"而非"编造"，但成品外观会与 `output/playwright/version-1-state-*.png` 等基线截图**不一致**。任何验收都必须明确选哪一边，不能两头讨好。

**限制二：`explode` 是假的按部件拆解。**
```js
const g = ((i % 19) - 9) / 9;
v = [v[0] + g*explode*.09, v[1] + Math.sin(i*.17)*explode*.015, v[2] + g*explode*.18];
```
位移由**顶点序号 `i`** 决定，不是由部件决定。**【事实】** 也就是说原版的"爆炸图"在几何上是伪随机抖动，不是结构分层。

**限制三：没有 顶点 → 部件 的映射。**
每个模型只有 5 个 `parts` **字符串名字**，没有任何数组把顶点归到某个部件。GEMINI 的连通分量数为 **181**（我实际算过）。**【推断】** 所以 `REACTOR_AGENT_BRIEF.md` 要求的 `SECTION` / 按部件 `EXPLODE` / 部件标签，在这批数据上**做不出来**，除非：
- (a) 用 181 个连通壳当"部件"，但它们与 5 个语义部件名对不上；或
- (b) 由艺术家手工指定归属（这是创作工作，不是脚本工作）。

**【推断】** 这一点比"有没有 GLB"更关键。它意味着 ENTROPY 三维化**不可能一次性获得 REACTOR 那套完整状态机**，最多先拿到 `ACQUIRE`（整体显现）+ 整体旋转 + 整体材质切换。

### 3.4 与 `manifest.json` 的对应【事实】

`manifest.json` 记录 7 条来源、6 个独立文件，其中 `id: 4` 与 `id: 6` 的 SHA-256 相同（`232325eb...`），说明两份 V04 是同一文件。来源路径含本机绝对路径（如 `/Users/ewanqian/Downloads/...`）和 `Documents/Codex/...` 下的旧输出目录。

**【推断】** 原始模型生成脚本（真正产出 `MODELS` 数组的那段代码）**不在本仓库**，只可能还在那些本机路径上。如果要复现几何，需要先确认那些路径是否还存在。这是下一步必须查的第一件事。

---

## 4. 本仓库已有的 ENTROPY 引用

`ripgrep "entropy|astral|atmospheric"`（排除 `.git`、`node_modules`）共 24 处命中，全部是**文档/派单层面的引用，没有任何 ENTROPY 代码或资产**：

| 文件 | 行 | 性质 |
|---|---|---|
| `research/spatial-program/PROGRAM_2026-11-08.md` | 14, 19, 21, 23, 25, 46, 52 | 主纲：ENTROPY 3D 列为 `READY_NOT_STARTED`，并写明"不要幻觉三维模型" |
| `research/spatial-program/QUEUE_2026-11-08.json` | 45–51 | `R-ENTROPY` 任务卡，`session_id: null` |
| `research/spatial-program/LOCAL_OPENCODE_GO.md` | 21, 32, 34, 50 | 私有 clone 指引与"禁止上传原 HTML/资产" |
| `.opencode/agents/research-entropy.md` | 2, 12 | 只读审计子代理定义 |
| `.opencode/agents/research-lighting.md` | 12 | 灯光线，明确"与 ENTROPY 复古移植分开" |
| `.opencode/agents/spatial-pm.md` | 16, 18 | 派单规则：无真实 child session 就标 `READY_NOT_STARTED` |
| `AGENTS.md` | 1 | 全局交接横幅 |
| `research/lineages/ARTIST_PERIODS_AND_RESEARCH_CARDS_2026-11-05.md` | 34 | 把 Stage Casting / Entropy / REACTOR 归为"演出控制知识" |
| `research/visual-runtime/.../MASTER_PLAN.md` | 44 | V12 "复用 ENTROPY 信息语言"（指 UI 语言，不是几何） |
| `research/visual-runtime/.../DAILY_PLAN.json` / `DAILY_TIMEBLOCKS...csv` | 176 / 81 | 同上 |
| `research/visual-runtime/.../EXPERIMENTS_16.json` | 251 | V09 依赖"已有 ENTROPY 界面语言" |

**【事实】** 本仓库**没有任何** `.glb`/`.gltf`/`.blend`/`.fbx` 文件（实际 `find` 结果为空）。
**【事实】** 本仓库**有**原创音频：`performances/2026-12-03-phase-01/pressure-test-001/` 下的 `CRITICAL_FIELD_PRESSURE_TEST_preview.wav` 与 4 个分轨 `stems/{field,sub-impact,harmonic,mechanism}.wav`，以及 `runtime/evidence/` 下的 A/B 录音。

**【推断】** 所以本仓库对 ENTROPY 的全部认知目前都是"二手转述"，没有任何一手资产。这解释了为什么 `PROGRAM_2026-11-08.md` 反复强调"不要幻觉三维模型"——它是在防自己。

---

## 5. 两条线的最小可验收样本

### 5.1 线 A：ENTROPY 三维化

**起点选择【推断】：选 `GEMINI`。**

理由（基于第 3.2 节实测数据）：4,850 顶点 / 8,976 三角形 / **0 条边界边**，是全部 8 个模型里"闭合 + 体量适中 + 语义清晰（双子座双人舱）"的最佳组合。VOSTOK 更小（7,984 三角形）但球体为主，剪影辨识度低；ORBITAL BUS 有太阳翼，转动时最容易看出"真的在转"，可作第二候选。

**最小链路：**

```
W03 v04 HTML 内嵌 MODELS
  → 提取 v/e（Python，只读源文件，输出到新目录）
  → 三角化复原（邻接表求共同邻居，已有验证代码思路）
  → 写 glTF 2.0：POSITION + indices + 计算法线
  → 记录 .glb 的 SHA-256
  → three.js GLTFLoader + OrbitControls 网页
  → 一个音乐事件驱动一个可见变化
```

**"一个音乐事件驱动一个可见变化"的最小定义【推断】：**

不要做频谱、不要做 RMS。用 `protocols/show-score-v1.schema.json` 已有的 `event`：

| 事件 | 类型 | 可见变化（只选一个） |
|---|---|---|
| `{id:"entropy-acquire-001", type:"ADVANCE", source:"AUTOMATION"}` | 手动/自动触发 | 材质从 `wireframe` 切到 `solid`，400 ms 缓动 |

或者更保守：一个 `OVERRIDE` 事件把 `controls.energy` 从 0.2 推到 0.9，映射为**自转速度**在 1 秒内翻倍并保持。

**验收标准【推断】：**

1. 磁盘上存在一个 `.glb`，给出绝对路径 + SHA-256 + 三角形数；三角形数必须等于 8,976（可复算，不是"看起来差不多"）。
2. 网页可鼠标拖拽旋转，连续 15 秒录屏，无控制台错误。
3. **同一事件运行两次，第 1 秒截图像素差 < 阈值**（证明确定性，不是 `Math.random()`）。
4. 与 `output/playwright/version-1-state-1.png`（ACQUISITION 状态）并排对比，明确写出"剪影一致 / 拓扑一致 / 明暗不同"三项结论。
5. 明确声明：**这是线框还原，不是原始美术的实体版**。

**已知风险【推断】：**

| 风险 | 后果 | 缓解 |
|---|---|---|
| 把线框说成"3D 化完成" | 艺术家看到实体版会认为偏离原设计 | 验收时强制并列 wire / solid 两态 |
| 三角化复原出错（非平面四边形被强拆） | 表面破洞、法线翻转 | 先跑闭合性断言，边界边 > 0 就报警 |
| 试图复刻 SECTION/EXPLODE | 无部件映射，必然造假 | 第一版**明确不做**这两个状态 |
| 把 `reactor/realtime/main.js` 当现成方案 | 它缺 data/，且无事件接口 | 只借它的 pass 结构，不借它的时钟 |
| 误把 `arena/*.mp4` 当已有素材 | 对外承诺落空 | 见 2.3.E |

### 5.2 线 B：环境灯光演出

**这条线的关键事实是：底座已经存在，而且有运行证据。**

| 组件 | 路径 | 状态【事实】 |
|---|---|---|
| 协议 | `protocols/show-score-v1.schema.json` | 存在，JSON Schema 2020-12，10 个必填字段 |
| 协议示例 | `protocols/show-score-v1.example.json` | 存在，`OVERRIDE / PEAK / FOOT` |
| 编排器 | `performances/2026-12-03-phase-01/pressure-test-001/runtime/conductor.py` | 存在，校验 + OSC(UDP 57131) + WebSocket |
| 视觉消费者 | 同目录 `visual.js` | 存在，把 `frame.controls.energy/space` 灌进 WebGL uniform |
| 运行证据 | 同目录 `TEST_RESULTS.json` | 存在，见下 |

`TEST_RESULTS.json` 实测记录【事实】：
```
status: "REAL RUN; technical gates only"
schema_valid_frames: 1759
event_id: "cf-88b6960e25-override"
sc_applied_count: 1
webgl_draw_ack_count: 1
visual_receipt_after_send_ms: 28.899
latency_scope: "loopback application receipts; NOT acoustic/display latency"
manual_kill.pass: true
disconnect.pass: true  (watchdog_limit_seconds: 0.75)
physical_kill: "NOT RUN"
AVP: "NOT RUN"
multichannel: "NOT RUN"
```
`visual.js` 第 6 行的 shader 直接把 `space` 映射为 `scale=.16+space*1.05`，`energy` 映射为 `gl_PointSize=1.0+energy*1.7` 与透明度。**【事实】** 即"一个音乐事件 → 一个可见变化"这条链在 2026-12 的 Critical Field 场景里**已经跑通过一次**。

**最小验收样本【推断】：**

不要新写引擎。做一个**独立的、单一场景的 30–60 秒片段**：

```
一个作者选定的空间场景（一盏体积光柱 / 一面反射墙 / 一片雾）
  ← 消费 show-score-v1 帧
  ← 只映射 3 个 cue：
       ADVANCE  → 光柱宽度 0→1，1200 ms
       OVERRIDE → 雾密度阶跃，保持
       RELEASE  → 回到基线，800 ms
  ← 固定相机，不自动推拉
  ← 断线 750 ms → SAFE（沿用现有 watchdog 逻辑）
```

**验收标准【推断】：**

1. 同一 Show Score 序列回放两次，**两次的帧序列逐帧 hash 一致**（`conductor.py` 已经对每帧算 `sha256`，可直接复用）。
2. 3 个 cue 各自有"触发前 / 触发后"两帧截图，差异肉眼可辨且**落在预期的那个参数上**（不是整体变亮）。
3. 断线测试：kill 掉 conductor，750 ms 内画面回 SAFE，截图留证。
4. 手动 kill 测试：独立终端触发，画面归零。
5. 明确写：**这是浏览器内软件渲染的"光"，不是灯具、不是 DMX、不是 Art-Net。**

**为什么不建议从"真实灯具"开始【推断】：**
`issue #21` 自己写了 *"venue outputs via existing Arena/Syphon/NDI only after actual capability verification; don't claim ArtNet/DMX hardware works from browser"*。而本次全仓库 grep 显示**没有任何 DMX/Art-Net 代码或配置**。从零写一个 DMX 输出层，比先验证"光的语法对不对"要贵得多，而且方向错了会白做。

### 5.3 两条线对比

| 维度 | 线 A：ENTROPY 三维化 | 线 B：环境灯光演出 |
|---|---|---|
| 起点资产 | 有（HTML 内嵌 48,418 顶点） | 有（原创 wav + 协议 + conductor） |
| 需要新建 | 提取脚本 + 三角化 + glTF 导出 + 查看器 | 一个场景 + 3 个 cue 映射 |
| 主要不确定性 | 线框/实体之争、无部件映射 | 光的语法是否被艺术家接受 |
| 可复现性 | 高（纯数据变换） | 高（帧 hash 已存在） |
| 硬件依赖 | 无（桌面浏览器） | 无（先浏览器；灯具后置） |
| 最大误判风险 | 把"能转"当成"三维化成功" | 把"会亮"当成"灯光设计" |
| 建议优先级 | 先做**只读提取验证**，不急着做查看器 | 先做**一个 cue 的闭环**，不急着做三个 |

---

## 6. 共用部分与不该共用的部分

### 6.1 应该共用（适配层）

| 共用项 | 具体文件 | 理由【推断】 |
|---|---|---|
| Show Score 协议 | `protocols/show-score-v1.schema.json` | 已是唯一事实源，两条线都该只发这一种帧 |
| 帧校验器 | `conductor.py` 内 `Draft202012Validator` | 已跑过 1759 帧，重写没意义 |
| 单调时钟 + `seq` | 同上 | 回放与去重的基础 |
| WS / OSC 传输 | 同上（UDP 57131 / WebSocket） | 已验证；新增通道要重新验证 |
| SAFE / neutral / manual_kill | 协议 `safe` 段 + `visual.js` 的 `safe=!frame||now-lastAt>750` | 舞台安全必须是同一个语义，不能两条线各自解释 |
| 帧 hash 审计 | `conductor.py` 的 `sha256(canonical)` | 这是"可重复运行"的唯一硬证据 |
| 资产清单格式 | `visual-runtime-lab/HYBRID_AUTHORING_ARCHITECTURE.md` 第 3 节 `asset-*` 记录 | 已定义 rights / fit / authored_frame |
| 相机默认 HOLD | 同上第 5 节 | 两条线都必须"不自动推拉" |

### 6.2 不该共用（内容与艺术判断）

| 不共用项 | 原因【事实/推断】 |
|---|---|
| 8 个航天器几何 | 私有归档资产，**不得**复制进本公开仓库（`AGENTS.md` 明令） |
| REACTOR 程序化机器 | 与航天器无关；且 `machine.json` 是 tokamak 版，与 spherical 版错位 |
| `ACQUIRE→REVEAL→LOCK→SECTION→EXPLODE→ANALYZE→SIGNAL→OVERLOAD` 状态机 | 这是**机器检视**的语法，不是灯光的语法。灯光演出套用它会把"光"讲成"设备" |
| 100 BPM | **【事实】ENTROPY 是 100 BPM，而 `conductor.py` 是 `BAR=60/128*4`，即 128 BPM。** 两者不同，绝不能假设同步 |
| 相机与构图 | 艺术家选择，`HYBRID_AUTHORING_ARCHITECTURE.md` 第 5 节明确 |
| 黑白灰科学终端调性 + 6/4/2 px 栅格 | ENTROPY 的视觉身份，不是灯光的 |
| 舞台灯光 patch / 调色 / 雾的参数 | 属于具体场地与具体作品 |
| Critical Field 的 wav | 属于另一个作品，不能当 ENTROPY 的配乐 |

### 6.3 一个容易忽略的协议缺口【事实 + 推断】

**【事实】** `show-score-v1.schema.json` 的顶层字段是：
```
schema_version, session_id, seq, t_ms, scene, state, controls, event, tracking, safe
```
**没有 `bpm`、没有 `tempo`、没有 `bar`、没有 `beat`。**

**【事实】** 协议里只有 `t_ms`（会话内单调毫秒）。

**【推断】** 所以"BPM 驱动"这件事**不在协议里**。两条线如果都要"按小节对齐"，就必须各自维护一个 BPM 常量（ENTROPY=100，Critical Field=128），或者新增一个**附加**字段。按 `REACTOR_AGENT_BRIEF.md` 的 "extend metadata only with additive annotations" 原则，正确做法是加可选字段，而不是改语义。

这是本次审计里最容易被忽略、但最容易在联调时炸掉的点。

---

## 7. 不可声明清单

以下说法在拿到真实证据前**一律不能说**：

1. ❌ "ENTROPY 已经三维化"——目前没有任何 GLB，也没有任何可运行的三维页面加载过真模型。
2. ❌ "仓库里有飞船模型"——有的是 HTML 内嵌的顶点/边数组，不是模型文件。
3. ❌ "reactor 管线已交付"——`.blend`/`.glb` 均未提交，只有代码与 JSON sidecar。
4. ❌ "Arena 演出素材已就绪"——`arena/*.mp4` 全部不存在。
5. ❌ "灯光已经接到灯具 / DMX / Art-Net"——全仓库无相关代码；`TEST_RESULTS.json` 明确 `physical_kill: NOT RUN`、`multichannel: NOT RUN`。
6. ❌ "在 Quest / AVP 上验证过"——`AVP: NOT RUN`。
7. ❌ "延迟 28.9 ms 就是现场延迟"——`latency_scope` 原文是 *"loopback application receipts; NOT acoustic/display latency"*。
8. ❌ "ENTROPY 是音频反应式视觉"——全仓库 0 个 `AudioContext`，`BPM=100` 是常量。
9. ❌ "两条线共用 100 BPM"——实际是 100 vs 128。
10. ❌ "本次审计跑过渲染或设备"——没有。

---

## 8. 建议的单一下一步

**【推断】** 只做一件事，且它必须能证伪：

> 写一个**只读**脚本，从 `visuals/spacecraft/v04/W03_SPACECRAFT_LOCAL_OFFLINE_v04.html` 中提取 `GEMINI`，复原三角形，输出一个 `.glb` 到**新的、不在两个仓库里的**输出目录，并打印：顶点数、三角形数、边界边数、SHA-256。

通过条件（可复算，无主观项）：
- 顶点 = 4,850
- 三角形 = 8,976
- 边界边 = 0
- 生成的文件能被标准 glTF 校验器读入

**为什么是这一步：**
1. 它把"有没有真模型"这个悬了 6 周的问题一次性关掉。
2. 它不碰任何原文件（只读），不违反 `AGENTS.md`。
3. 它不产生"新美术"——没有编造几何，只是把已有拓扑换个容器。
4. 它的结果直接决定后面能不能谈"旋转查看"和"事件驱动"。
5. 如果它失败（比如三角化复原不出闭合体），那就该回到 `BLOCKED_MISSING_ARTIST_ASSET`，而不是继续做查看器。

**这一步之后**再谈：一个 glTF 查看器 + 一个 `ADVANCE` 事件（线 A）；以及一个光柱 + 一个 `ADVANCE` cue（线 B）。两条线的第一个"可见变化"都应该是**同一个事件类型**，这样协议层才是真的共用，而不是嘴上共用。

---

## 附录：本次实际执行过的命令（可复现）

```bash
# 1. 仓库可见性确认
gh api repos/ewanqian/atmospheric-escape-liveset            # private:true
gh repo list ewanqian --limit 100 --json name,visibility     # 确认不在公开列表

# 2. 完整文件树
gh api "repos/ewanqian/atmospheric-escape-liveset/git/trees/main?recursive=1"

# 3. 扩展名统计 / 二进制资产检索
#    （对 tree 的 .path 做正则过滤，结果见 2.2 与 2.4）

# 4. 大文件必须用 raw（Contents API 对 >1MB 返回空 content）
gh api -H "Accept: application/vnd.github.raw" \
  "repos/ewanqian/atmospheric-escape-liveset/contents/visuals/spacecraft/v04/W03_SPACECRAFT_LOCAL_OFFLINE_v04.html" \
  > "$TMP/w03v04.html"
shasum -a 256 "$TMP/w03v04.html"     # 232325eb... 与 manifest id:4 一致

# 5. 几何解析（Python：定位 const MODELS=、括号匹配、json.loads、
#    邻接表求三角形、统计边界边）

# 6. 本仓库检索
rg -i "entropy|astral|atmospheric" --glob '!node_modules' .
find . -iname "*.glb" -o -iname "*.gltf" -o -iname "*.blend" -o -iname "*.fbx"
find . -iname "*.wav" -o -iname "*.mp3" -o -iname "*.aif*"
```

**未执行：** Blender、任何渲染、任何浏览器、任何 Quest/AVP、任何灯具/DMX/Art-Net、任何音频播放。

---

*本文所有数值均来自上述只读操作。标注为【推断】的部分未经实验验证，不得作为承诺对外表述。*
