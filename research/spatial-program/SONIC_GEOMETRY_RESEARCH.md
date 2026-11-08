# SONIC GEOMETRY / 空间音频几何研究

日期：2026-11-08
范围：sonicLAB PolyNodes / SPATAI 能力边界；浏览器端开源空间音频选型；25 关节手部数据驱动 8–16 个三维声音节点的纯前端最小方案。
状态：**纯桌面研究**。本文没有做任何浏览器、耳机、Quest、Vision Pro 或调音台实测；所有听感结论来自公开文献或工程推断，均已标注。

标注约定：

- **【事实】** 有官方页面、源码、标准或论文直接支持，附链接。
- **【推断】** 由事实推出，但未在该产品/该浏览器上直接验证。
- **【待验证】** 需要实测或需要向权利方确认，不能写进对外文案。

---

## 0. 结论先行

1. **PolyNodes 是“音频渲染器 + 生成式合成器”**，自带 100% 自研 DSP 与双耳渲染；**SPATAI 不是渲染器**，它只产生运动数据，通过 OSC/MIDI 驱动第三方空间化引擎。两者不是同类产品，不能互相替代。
2. **Vision Pro 版 PolyNodes（PolyNodesAVP）是桌面端的远程控制器/可视化端**，不是头显本地音频引擎；官方明确要求桌面 app 同时运行、同一 Wi-Fi、双向 IP/OSC 配置。
3. 浏览器里**唯一“零依赖、零许可风险”的双耳方案是 `PannerNode` + `panningModel = "HRTF"`**，但它是一套**固定的、非个性化的、仰角被量化到 15° 的**通用 HRTF；不能加载 SOFA，不能做近场，不能做多声道。
4. 若目标是**“听出前后左右运动”**，关键不在库的选择，而在三件事：**宽带瞬态素材**、**头部/听者姿态变化**（哪怕是很小的摆动）、**虚拟声源距离 ≥ 1 m**。缺一项，前后混淆会明显上升。
5. 8–16 个节点用 **per-source HRTF（PannerNode）** 是可行默认；超过约 24 个节点或需要整体场景旋转时，改用 **3 阶 Ambisonics（JSAmbisonics / Omnitone）+ 单次双耳解码**更省 CPU，但定位会变糊。
6. **多声道扬声器演出不能用 PannerNode**：它的输出被硬编码为立体声 2 通道。要走 8 声道 PA，必须走 Ambisonics 解码或 OSC 到外部渲染器（这正是 SPATAI 的定位）。

---

## 1. sonicLAB PolyNodes

### 1.1 它是什么

| 项目 | 内容 | 证据等级 |
|---|---|---|
| 形态 | macOS / Windows 独立应用（64-bit），v2.3（2026-09），另附 VST3/AU 远程插件 PolyNodesRemote | 【事实】官网、KVR |
| 输入 | 音频素材（通常 ≤10 秒），分析 macro / meso / micro 三层的 onset | 【事实】官网 |
| 核心表示 | 把 onset 映射成三维几何：节点 = 声音事件，边 = 三角化后的路径；10 秒波形可产生数千条节点连接 | 【事实】官网 |
| 播放 | 多个“node agent”播放头在几何上运动，带 re-synthesis 与信号处理；多种导航策略 | 【事实】官网 |
| 交互 | DSP interactables（靠近程度决定影响量）、CuboidFX（用三维长方体运动提取调制信号）、Isomorph 形变（保持时间/距离关系） | 【事实】官网 |
| 输出 | **它自己渲染音频**：官方称 “true 3D binaural audio rendering for micro, meso and macro agents in realtime”，100% 自研 DSP，纯 64-bit | 【事实】官网 |
| 控制协议 | GUI、VST3/AU remote、OSC | 【事实】spaes 技术规格页 |
| 授权 | 商业软件，iLok，约 €140 / £115 | 【事实】官网商店、KVR |

**能力边界（重要）**：

- 它是**闭环产品**：素材进 → 几何 → 播放头 → 双耳音频出。它不对外暴露“节点图/播放头”的通用数据格式，也没有公开 SDK。【推断，基于官网与文档未见公开 API】
- 它的“3D”是**双耳（耳机）3D**，不是多声道阵列渲染；没有证据表明它能直接驱动 8 声道 PA。【推断】
- 它的价值对我们不是代码，而是**机制**：onset → 图 → 多播放头 → 邻近度调制。这个机制可以用原创实现重建，不需要也不应该复制其 DSP、预设或素材。

### 1.2 PolyNodes Remote for Apple Vision Pro（PolyNodesAVP）

| 项目 | 内容 | 证据等级 |
|---|---|---|
| 角色 | 官方标题即 “PolyNodes **Remote** for Apple Vision Pro”；“connects to the PolyNodes desktop app” | 【事实】官网 |
| 运行前提 | 桌面 app 必须同时运行；Mac 与 AVP 在同一 Wi-Fi；在桌面 app 的 OSC 字段填 AVP 的 IP，在 AVP app 的 IP 字段填 Mac 的 IP；双向通信 | 【事实】官网 |
| 功能 | 手势控制：捏合抓取并移动 DSP 对象、捏合旋转改变强度、隔空改 Apple slider、双捏开关 DSP 对象、触摸微节点球编辑参数、用系统体积边界缩放/移动整体结构 | 【事实】官网 |
| 价格 | 免费（App Store） | 【事实】官网 |
| 音频 | **没有证据表明头显本地渲染音频**；页面把音频描述为桌面端能力 | 【推断，证据为“必须配合桌面 app + IP/OSC 连接”的官方描述】 |

**结论**：AVP 版是**空间化的遥控器 + 立体可视化**，不是“Vision Pro 上的空间音频引擎”。如果我们要做头显端，正确类比是：头显负责手势与位姿，音频仍在浏览器/主机侧渲染，通过低延迟链路同步。

### 1.3 不可复用清单

- 不复制其预设（Laurent Mialon / Daito Manabe 的 preset 属商业内容）。
- 不复制其 UI 视觉、几何生成算法代码、DSP 实现。
- 不复制其音频素材或示例音频。
- 可以引用“onset → 三维图 → 多播放头 → 邻近度调制”这一**抽象机制**，并用原创代码与原创声音重建。

---

## 2. sonicLAB SPATAI

### 2.1 它是什么

| 项目 | 内容 | 证据等级 |
|---|---|---|
| 形态 | VST3 / VST2 / AU / standalone；首版 2026-02；v3 2026-10 | 【事实】官网、KVR |
| 功能 | 用自然语言提示词生成多个声音对象在虚拟三维空间中的**运动轨迹**；笛卡尔或极坐标；最多 64 个对象；实时 macro 控制；时间线拖动 | 【事实】官网 |
| 输出 | **OSC 或 MIDI 运动数据**，发往第三方空间化软件 | 【事实】官网 |
| 明确声明 | 官网原文：**“SPATAI does not encode ambisonic audio or render digital audio in any format — it creates the motion data compatible for other third party software.”** | 【事实】官网 |
| 目标端 | ADM-OSC、Amadeus、IEM、IRCAM SPAT、IRCAM Panoramix、L-ISA、Holophonix、SpatRevolution、TiMax、Yamaha AFC 等 | 【事实】官网、KVR |
| AI 接入 | 云端 LLM（按 token 计费）、本地 LLM（Ollama / LM Studio）、v3 起提供 MCP server，可由 Claude Desktop / ChatGPT 直接驱动 | 【事实】官网、KVR、Noizefield |
| 授权 | 商业，约 £20 / €24.95，按机器序列号激活 | 【事实】官网、rekkerd |

### 2.2 能力边界

- **不是音频渲染器**，**不是 Ambisonics 编码器**，**不产生声音**。它只产生“对象 id + 坐标 + 时间”的运动指令。【事实】
- 它的真正创新是**“把语言变成轨迹”**，并且把轨迹**桥接到既有生态**，而不是重造渲染器。【推断】
- 它不解决：HRTF、房间声学、扬声器布局、增益管理、时钟同步。这些全部由下游系统负责。【事实，官网把职责明确划给目标端】

### 2.3 对我们的启示

1. **分层是对的**：轨迹生成 / 渲染 / 输出协议应当解耦。我们的浏览器 MVP 应该把“节点图 + 播放头”产出的位置，做成一个**可序列化的轨迹数据**（JSON），渲染层可替换。
2. **OSC 语义值得对齐**：`objectID, x, y, z`（或 `az, el, dist`）+ 时间戳。这样未来接 Max/MSP、SPAT Revolution、或硬件渲染器不需要重写。
3. **不要做“AI 生成音乐”**：SPATAI 只生成运动，这个克制是它能保持可控的原因。我们同样应只让模型/手势控制几何与运动，不让它决定主增益或最终音色。

---

## 3. 浏览器端开源空间音频方案对比

### 3.1 核心事实：`PannerNode` 的真实能力

| 属性 | 事实 | 证据 |
|---|---|---|
| 输入 | 单声道或立体声，**不能超过 2 通道** | 【事实】W3C 规范 / MDN |
| 输出 | **硬编码立体声 2 通道**，不可配置 | 【事实】W3C 规范 |
| panningModel | `equalpower`（默认）、`HRTF`、规范里的 `pass-through` | 【事实】MDN / W3C |
| 距离模型 | `linear` / `inverse` / `exponential`，只有**电平**衰减，没有距离相关的音色变化 | 【事实】MDN |
| 指向性 | cone（内角/外角/外角增益） | 【事实】MDN |
| 遮挡 / 闭塞 | **没有**内建实现 | 【事实】规范无此参数 |
| 多普勒 | **已从规范删除**；`setVelocity`、`dopplerFactor`、`speedOfSound` 被移除（Chrome M55 前后、Firefox 63） | 【事实】WebAudio issue #372/#455、Chrome 平台状态、Firefox 63 release notes |
| 自定义 HRTF / SOFA | **不支持**；相关提案 issue #2417 自 2016-02 开放，2025-05 仍在讨论 | 【事实】WebAudio issue #2417 |
| 听者 | 每个 `AudioContext` 只有**一个全局 `AudioListener`** | 【事实】规范 |

### 3.2 Chromium 内建 HRTF 的具体参数（源码级）

这一节很关键，因为它决定“能不能听出前后、上下”。

| 参数 | 值 | 证据 |
|---|---|---|
| 原始方位角 | 24 个，间隔 15° | 【事实】`hrtf_elevation.cc` |
| 方位角插值 | ×8 → 192 个核，约 **1.875°** 分辨率 | 【事实】同上 |
| 仰角 | 10 个，−45° 到 +90°，间隔 15° | 【事实】`hrtf_database.cc` |
| 仰角插值 | `kInterpolationFactor = 1`，即**不插值**，最近邻；超出范围直接 clamp | 【事实】同上 |
| 脉冲响应长度 | 256 采样点 @44.1 kHz ≈ **5.8 ms** | 【事实】同上 |
| 移动时交叉淡化 | 2048 帧（≤48 kHz）≈ **43 ms** | 【事实】`hrtf_panner.cc` |
| 主体 | 单一 “composite” 资源（`IDR_AUDIO_SPATIALIZATION_COMPOSITE`），非用户可换 | 【事实】同上 |
| 数据来源 | 源码注释明确写 “IRCAM HRTF azimuths” / “IRCAM impulse responses” | 【事实】同上 |

**直接后果**：

- 上下运动会**按 15° 台阶跳变**，不是连续的；从 −45° 以下或 +90° 以上来的声源会被**压到边界**。【事实，源码行为】
- 左右分辨率约 1.9°，足够；前后主要靠耳廓频谱，通用 HRTF 恰恰在这一段最容易错。【推断，见 §5】
- 快速移动时 43 ms 交叉淡化会**抹平瞬态方向变化**，所以“唰”一下掠过的效果会打折。【推断】

### 3.3 方案对照表

| 方案 | 许可 | 能力 | 硬限制 | 适配度 |
|---|---|---|---|---|
| `PannerNode` HRTF | 浏览器内建，无额外许可 | 每源双耳、距离、cone、位置自动化 | 2ch 输出；无自定义 HRTF；仰角 15° 量化；无遮挡/多普勒；CPU 高 | **默认首选（≤16 源）** |
| `PannerNode` equalpower | 内建 | 极省 CPU，稳定的左右像 | 无前后、无上下、无外化 | 只做兜底/低端设备降级 |
| three.js `PositionalAudio` | MIT | 就是 PannerNode 的封装，默认 `panningModel='HRTF'`，每帧把场景图变换同步到 panner/listener | 继承 PannerNode 全部限制；每帧 ramp 有已知性能坑（Chrome 旧版） | **推荐作为场景同步层** |
| JSAmbisonics | BSD-3-Clause | FOA/HOA 到 3 阶；monoEncoder / sceneRotator / binDecoder；可加载自定义 HRIR 解码滤波器；支持 SOFA→JSON | 需自己做滤波器生成；Safari 多声道文件加载有历史问题；最后提交 2022-05 | **备选，适合整体旋转与 >24 源** |
| Omnitone | Apache-2.0 | FOA/HOA 解码 + 双耳渲染；可用相机矩阵旋转声场；v2.0.0 于 2026-09-30 发布 | 只做解码，不做单源定位；HOA 定位仍不如 per-source HRTF | 适合“声场旋转”，不适合“精确点” |
| Resonance Audio Web SDK | Apache-2.0 | 源 + 房间 + 遮挡 + HOA | **仓库已 ARCHIVED**，不再维护 | 仅作参考，不做长期依赖 |
| IRCAM `binauralFIR` | BSD-3-Clause | 每源自定义 HRIR、可设交叉淡化时长 | 最后提交 2017；需自备数据集 | 参考实现，不直接上生产 |
| Tone.js | MIT | Transport、`GrainPlayer`（颗粒播放头）、调度 | 不含空间化（只包 Panner） | **调度/颗粒层首选** |
| soundio/soundstage | GitHub API 未检测到 SPDX 许可 | 图模型 + 排序引擎 + JSON 化 | 许可不明；需 COOP/COEP | **不要复用代码**，只可读设计 |
| Modulr / synflow | MIT | 浏览器节点图编辑器（React Flow） | 无空间音频 | 只作 UI 结构参考 |

### 3.4 关于“声音节点网络 + 移动播放头”的现有开源项目

**结论：没有找到“开箱即用、许可清晰、专做三维声音节点网络 + 移动播放头”的成熟项目。** 现有项目分成两半：

- **图/播放头这一半**：Tone.js（Transport、GrainPlayer）、soundstage（图 + 排序）、Modulr / synflow（节点编辑器 UI）。它们都不做三维空间化。
- **空间化这一半**：PannerNode、JSAmbisonics、Omnitone、Resonance Audio。它们都不做“图遍历 + 播放头”。

所以这块**必须自己写**，但可以只写“图 + 播放头”这一层（约 300–600 行），其余全部用现成库。这是本项目真正的原创空间。

---

## 4. HRTF 数据集许可（如果要做自定义双耳卷积）

只有当你决定**不用浏览器内建 HRTF**、自己用 `ConvolverNode` / `AudioWorklet` 做双耳时，才需要数据集。

| 数据集 | 许可 | 规模 | 结论 | 证据等级 |
|---|---|---|---|---|
| **MIT KEMAR**（Gardner & Martin, 1994） | “free with no restrictions on use, provided the authors are cited” | 710 方向/耳，−40°…+90° 仰角 | **最安全**，可商用，必须署名 | 【事实】MIT README 原文 |
| **SADIE II**（University of York） | **Apache-2.0** | 20 主体，最多 8802 方向，44.1/48/96 kHz，SOFA | **可商用可再分发**，需保留 NOTICE 与引用 | 【事实】York 数据库页 + Zenodo 记录 |
| **HUTUBS**（TU Berlin） | **CC BY 4.0** | 96 主体，含头模网格 | 可商用，需署名 | 【事实】官方文档 PDF |
| **IRCAM LISTEN** | **说法冲突**：libmysofa 随附许可文本写 “public and available for any use…acknowledgment”，其他二手摘要写 “research only” | 51 主体，187 方向 | **在拿到 IRCAM 书面确认前，不要随仓库分发原始数据** | 【待验证】 |
| **CIPIC** | 常被引作 “public domain (Release 1.0)”，原始 UC Davis 站点不稳定 | 45 主体，1250 方向 | 使用前必须在原始页面复核许可原文 | 【待验证】 |

**工程建议**：MVP 阶段**完全不要打包 HRTF 数据**，直接用浏览器内建 HRTF。这样零许可风险、零下载体积。只有在内建 HRTF 明确不够（例如需要更平滑的仰角）时，才引入 MIT KEMAR 或 SADIE II。

---

## 5. 双耳渲染的硬限制（必须写进设计约束）

以下不是“实现不好”，而是**方法本身的边界**。

### 5.1 非个性化 HRTF → 前后/上下混淆

- 【事实】Wenzel 等 1993：非个性化 HRTF 下，水平方向（ITD/ILD）仍然稳健，但**耳廓频谱线索被扭曲**，导致前后、上下混淆显著增加（相比真实自由场）。
- 【事实】2020 年的一项定位实验：静态双耳重放的前后混淆率 **16.5%**；加入动态重放（5°/2.5°/1° 分辨率）后降到 **6.3%–7.1%**。同一文献引用 Begault：头部跟踪把反转率从 **59% 降到 28%**。
- 【事实】通用 HRIR 的平均仰角误差约 **27.3°**，个性化约 **23.3°**；−18°…+18° 区间最准，越往两端越差。
- 【推断】所以：**没有头部运动的静态双耳，前后判断天然不可靠**。这不是调参能解决的。

### 5.2 Chromium 实现的具体量化

- 仰角 **15° 台阶 + 最近邻 + 边界 clamp**（§3.2）。垂直运动会有“档位感”，且**地板以下不存在**。
- 方位 1.875°，够用。
- 移动时 43 ms 交叉淡化：**快速掠过会钝化**；但太慢又听不出移动。
- HRTF 会引入与方位/仰角相关的延迟（padenot 的性能笔记明确提到），多源叠加时会有细微时间偏移。

### 5.3 近场缺失

- 【事实】HRTF 在 **>1 m** 时近似与距离无关（远场）；**<1 m** 时随距离剧烈变化，低频 ILD 可从 ~4 dB 升到近 25 dB。
- 【事实】`PannerNode` 的距离模型只改**电平**，不提供近场 HRTF。
- 【推断】**手部关节离头只有 0.05–0.6 m，直接当声源坐标是错的**。必须重映射到 ≥1 m 的虚拟半径（见 §6.3）。

### 5.4 其他

| 限制 | 说明 | 等级 |
|---|---|---|
| 无多普勒 | 规范已删除，需要自己用 `DelayNode` 或 `playbackRate` 模拟 | 【事实】 |
| 无遮挡/闭塞 | 需要自己做低通 + 增益，或射线检测 | 【事实】 |
| 无距离音色 | 只有电平衰减，远处不会自然变闷 | 【事实】 |
| 2ch 输出 | **不能直接驱动 8 声道 PA** | 【事实】 |
| 单 listener | 无法做“两个听众各自不同混音” | 【事实】 |
| 浏览器差异 | Chromium 与 WebKit 的 HRTF 数据/实现不同，音色不会一致 | 【推断，基于各自独立实现】 |
| CPU | HRTF panner 移动时最多 4 个卷积器/源；16 源同时移动可能压垮一体机 | 【推断，需实测】 |
| 扬声器上不成立 | HRTF 是耳机模型，双扬声器串扰会破坏 | 【事实，双耳合成基本原理】 |

### 5.5 Ambisonics 的对比限制

- 【事实】一阶 Ambisonics 的前后混淆明显；三阶能减少但不能消除。
- 【事实】有研究观察到三阶在**中垂面仰角误差反而更大**（受 HRTF 质量与个体差异影响）。
- 【推断】所以：**要“精确的点”，用 per-source HRTF；要“整体的场”和可旋转，用 HOA。** 两者不是精度高低，而是不同目标。

---

## 6. 纯前端最小可行方案

目标：**静态网页、无构建、无商业依赖**，用 25 关节手部数据驱动 **16 个三维声音节点**，有 **1–2 个移动播放头**，在耳机上能听出前后左右运动。

### 6.1 总体数据流

```
WebXR XRHand (25 joints)  ──┐
鼠标/触摸模拟（桌面 fallback）─┤
                              ▼
                    pose normalizer
              （有效性、时间戳、丢失处理、平滑）
                              ▼
                   node layout mapper
              （16 个关节锚点 → 16 个虚拟位置）
                              ▼
                graph + playhead scheduler
              （三角化边、2 个播放头、边遍历）
                              ▼
                     audio graph
        （8 个池化 PannerNode(HRTF) + 颗粒播放头 + 共享混响）
                              ▼
                  master gain → limiter → destination
                              ▼
              analyser / MediaRecorder（用于验证，不用于演出）
```

关键设计：**逻辑节点 16 个，物理 panner 只开 8 个**（声部池）。理由见 §6.5。

### 6.2 25 关节 → 16 节点映射

WebXR 手部规范固定 25 个关节（wrist 0，thumb 1–4，index 5–9，middle 10–14，ring 15–19，pinky 20–24）。【事实】W3C WebXR Hand Input Level 1

| 节点 | 来源 | 数量 | 作用 |
|---|---|---|---|
| N0–N1 | 左右 `wrist` | 2 | 低频/基底节点，位置最稳 |
| N2–N6 | 左手 5 个 `*-tip` | 5 | 高音/瞬态节点 |
| N7–N11 | 右手 5 个 `*-tip` | 5 | 高音/瞬态节点 |
| N12–N13 | 左右掌心（4 个 metacarpal 的质心） | 2 | 中频/持续音 |
| N14–N15 | 双手腕中点、双手质心连线中点 | 2 | “结构中心”，播放头的默认起点/终点 |

合计 **16**。若只需要 8 个，取 N0、N1、N2、N7、N12、N13、N14、N15（两端 + 中心），保留空间张力的同时减半 CPU。

**为什么不用全部 25 个**：拇指有 4 个关节、其他手指 5 个，全用会让节点在指尖处过度聚集，听感上退化成“一个点”。选 tip + wrist + palm 是**听觉上分布最开**的子集。【推断，需听测】

### 6.3 坐标重映射（关键）

原始关节坐标相对头中心只有 0.05–0.6 m，直接送进 panner 会落进近场，HRTF 失效。

```js
const SCALE = 4.0;        // 手部 0.25–0.6 m → 1.0–2.4 m
const R_MIN = 1.0;        // 远场下限
const R_MAX = 2.4;

function toVirtual(jointPos, headPos) {
  const v = sub(jointPos, headPos);
  let d = length(v);
  const dir = d < 1e-4 ? [0, 0, -1] : scale(v, 1 / d);
  const r = clamp(d * SCALE, R_MIN, R_MAX);
  return add(headPos, scale(dir, r));
}
```

- **保方向、压距离**：左右/前后/上下的角度关系保留，距离差被压缩（手前伸 10 cm 只带来约 0.4 m 的虚拟距离变化）。
- 若希望距离也是明显表现手段，改成 `r = clamp(1.2 + d * 2.0, 1.0, 2.6)`，把 1.2 m 作为“手在身侧”的基准。
- **不要**直接把关节坐标乘一个系数就送进去：手贴近身体时会掉到 0.2 m，声音会“贴脸”且 HRTF 不成立。

**稳定性**：手部追踪有抖动，逐帧直传会让声源“抖”。用一阶低通，时间常数 **20–30 ms**；再快会引入可听的方向滞后，再慢会抹掉运动。【推断】

### 6.4 播放头与图遍历

1. **建图**：16 个虚拟位置做 3D Delaunay 三角化（或用 k=3 近邻建边），得到边表。手形变化时**不要每帧重建**，每 250 ms 或位移超过阈值时重建，避免边表抖动。
2. **播放头状态**：`{ edgeId, u ∈ [0,1], speed }`。
3. **运动**：沿边匀速（建议 **0.6–1.2 m/s** 虚拟空间速度），到顶点后按“最少访问次数 + 手部距离偏置”选下一条边，避免来回重复。
4. **两个播放头**：一个高速（瞬态/颗粒），一个低速（持续音/低频），相位错开，形成复调式的空间运动。
5. **位置更新**：在 `requestAnimationFrame` 里算目标位置，用 `setTargetAtTime(value, now, 0.02)` 写入 panner；**不要**用 `linearRampToValueAtTime` 排到未来 100 ms，会引入方向滞后。

### 6.5 音频图（可直接照做）

```
per logical node i:
  source_i (AudioBufferSource loop 或 Oscillator)
    → gain_i (包络, setTargetAtTime)
    → pannerPool[k]  (PannerNode, HRTF, distanceModel='inverse', refDistance=1)
    → master

travel voice:
  grain scheduler (30–60 ms Hann 窗, 20–40 grains/s)
    → gain
    → pannerTravel (HRTF)
    → master

shared:
  master → DynamicsCompressor(limiter) → destination
  send: master → ConvolverNode(短 IR, 0.3–0.6 s) → 低增益 → master
```

**声部池的必要性**：即使上游 gain 为 0，`PannerNode` 仍会跑卷积。16 个常开 HRTF panner 在一体机上风险很高。做法是**只保留 8 个 panner**，把当前最响的 8 个逻辑节点分配上去，切换时用 20–30 ms 交叉淡化。这是本项目最值得先做的性能设计。【推断，需实测确认收益】

**增益分配**：`g_i = exp(-(dist(playhead, node_i) / σ)²)`，σ ≈ 0.25–0.35 m；再对总和做归一化，避免播放头经过节点时整体音量跳变。

**旅行声部**：这是“听出连续运动”的关键。只在节点之间交叉淡化，听觉像“跳点”；让一个颗粒声部沿边**连续移动**，才有真正的“滑过去”的感觉。

### 6.6 听感设计规则（比代码更重要）

| 规则 | 原因 | 等级 |
|---|---|---|
| 用**宽带、含瞬态**的素材（噪声爆、拨弦、点击、滤波噪声） | 纯正弦是“锥形混淆”最严重的信号，左右都难分 | 【事实，心理声学常识】 |
| 单个运动事件持续 **0.4–1.5 s**，方位速度 **90–180°/s** | 太慢听不出，太快被 43 ms 交叉淡化抹平 | 【推断】 |
| 虚拟距离保持 **1.0–2.4 m** | 远场 HRTF 才成立 | 【事实】 |
| 加**少量早期反射/短混响**（干湿比 10–20%） | 混响是外化（externalization）的重要线索 | 【推断，文献支持方向】 |
| 让听者**轻微转头/身体摆动**，或用鼠标/陀螺仪制造 3–5° 的听者旋转 | 动态线索是降低前后混淆最有效的手段（16.5% → ~6%） | 【事实，2020 研究】 |
| 不要用扬声器听 HRTF 版本 | 串扰破坏双耳线索 | 【事实】 |
| 移动端降级到 `equalpower` + 短混响 | HRTF 卷积在低端设备可能爆音 | 【推断，padenot 建议】 |

### 6.7 一个“能听出前后”的最小验收实验（设计，未执行）

- 8 个方向：前、后、左、右、左前、右前、左后、右后，仰角 0°。
- 每方向 20 次，随机顺序，听者不看屏幕。
- 记录：正确率、前后混淆率、左右错误、反应时间。
- 三组对照：
  - A：`equalpower`（预期：左右好，前后接近随机）
  - B：`HRTF` 静态听者
  - C：`HRTF` + 听者轻微摆动（3–5°）
- 预期（【推断】，不是结果）：A 的前后正确率约 50%；B 约 60–75%；C 约 80%+。
- **只有跑完这个实验，才能对外说“能听出前后”。**

### 6.8 明确的非目标

- 不做多声道 PA 渲染（PannerNode 只有 2ch）。
- 不做个性化 HRTF（浏览器不支持 SOFA）。
- 不做“头显本地音频引擎”（PolyNodesAVP 也不是）。
- 不承诺与 PolyNodes / SPATAI 音质等价。

---

## 7. 选型建议（一句话版）

- **默认**：`PannerNode(HRTF)` + three.js `PositionalAudio` 做场景同步 + Tone.js `Transport`/自写颗粒调度 + 8 个池化 panner + 16 个逻辑节点。
- **需要整体声场旋转 / 源数 >24**：JSAmbisonics（3 阶）+ 单次 `binDecoder` 双耳解码。
- **需要驱动 8 声道 PA 或外部渲染器**：不要用 PannerNode；输出 JSON/OSC 轨迹，交给 SPAT Revolution / Max / 硬件。
- **需要自定义 HRTF**：MIT KEMAR（署名）或 SADIE II（Apache-2.0），自己写 `ConvolverNode` 交叉淡化；不要分发 IRCAM Listen 原始数据。

---

## 8. 下一步（不超过 5 条）

1. **做一个纯桌面、无 XR 的 12 节点 spike**：8 个池化 HRTF panner + 2 个播放头 + 颗粒旅行声部；先只验证“能不能听出前后左右”，并跑 §6.7 的三组对照，把 CSV 与录音存进 `research/spatial-program/`。**这是唯一能解锁后续工作的门。**
2. **接入手部数据**：复用 `spatial-playground/hand-osc-lab` 已有的 25 关节管线与 `SIMULATED / REAL_XR` 标记，只新增“关节 → 16 节点”的映射层，不改动现有页面。
3. **做一次 A/B 性能测量**：同一场景分别用 16 个常开 panner 与 8 个池化 panner，记录 `requestAnimationFrame` 间隔、`AudioContext.baseLatency`、是否有爆音；用数据决定池大小，而不是猜。
4. **锁定许可**：MVP 只用浏览器内建 HRTF；若确需数据集，先落地 MIT KEMAR 的署名文件与 NOTICE，再考虑 SADIE II；IRCAM Listen 在拿到书面确认前不进仓库。
5. **定义轨迹 JSON 契约**（`objectID, t, x, y, z` 或 `az, el, dist`），先只写 schema 与一个导出按钮，不做 OSC 服务；等真有外部渲染器需求再接。

---

## 9. 来源清单（访问日期 2026-11-08）

| 类型 | 来源 | 用途 |
|---|---|---|
| 官方 | https://www.sonic-lab.com/polynodes | PolyNodes 能力、AVP 远程控制、双耳渲染、DAW 桥接 |
| 官方 | https://www.sonic-lab.com/spatai | SPATAI 明确“不渲染音频”、64 对象、OSC/MIDI、MCP |
| 二手（较可靠） | https://spaes.org/polynodes · https://spaes.org/SpatAI | 技术规格、许可、历史时间线 |
| 新闻 | https://www.kvraudio.com/news/soniclab-updates-polynodes-to-v2-3-68775 · https://www.kvraudio.com/news/soniclab-releases-spatai-v3-68928 | 版本与功能变更 |
| 标准 | https://developer.mozilla.org/en-US/docs/Web/API/PannerNode · https://www.w3.org/TR/webaudio-1.1/ | PannerNode 输入/输出、距离模型、无遮挡 |
| 源码 | https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/platform/audio/hrtf_database.cc · `hrtf_elevation.cc` · `hrtf_panner.cc` | 192 方位、10 仰角、256 tap、43 ms 交叉淡化、composite 主体 |
| 讨论 | https://github.com/WebAudio/web-audio-api/issues/2417 · https://github.com/WebAudio/web-audio-api/issues/372 · https://github.com/WebAudio/web-audio-api/issues/455 | 自定义 HRTF 未支持、多普勒被移除 |
| 性能 | https://padenot.github.io/web-audio-perf/ | HRTF panner 的 CPU/延迟/尾音特征 |
| 库 | https://github.com/polarch/JSAmbisonics · https://github.com/GoogleChrome/omnitone · https://github.com/resonance-audio/resonance-audio-web-sdk · https://github.com/Ircam-RnD/binauralFIR · https://github.com/mrdoob/three.js · https://github.com/Tonejs/Tone.js | 许可与能力 |
| 数据 | https://sound.media.mit.edu/resources/KEMAR/README · https://www.york.ac.uk/sadie-project/database.html · https://sofacoustics.org/data/database/hutubs/Documentation.pdf | HRTF 数据集许可 |
| 论文 | Wenzel et al. 1993, JASA 94(1):111 · “Experiments on localization accuracy with non-individual and individual HRTFs…” (2020) · Brungart & Rabinowitz 1999, JASA | 前后混淆、动态线索、近场 |
| 标准 | https://www.w3.org/TR/webxr-hand-input-1/ · https://developer.mozilla.org/en-US/docs/Web/API/XRHand | 25 关节名称与索引、`fillPoses` 性能建议 |
| 二手 | https://github.com/leopardcodeai/3d-sound-journey-builder/blob/main/docs/research/2026-09-15-sound-sources-and-licensing.md | HRTF 数据集许可汇总（仅作交叉核对，未单独采信） |

---

## 10. 事实 / 推断 / 待验证 一览

**已验证事实**

- PolyNodes 自带双耳渲染与自研 DSP；AVP 版是远程控制器，需桌面端同跑。
- SPATAI 不渲染音频，只输出 OSC/MIDI 运动数据。
- `PannerNode` 输出固定 2 声道；不支持自定义 HRTF/SOFA；无多普勒；无遮挡。
- Chromium HRTF：192 方位（1.875°）、10 仰角（15° 步进、不插值、clamp）、256 tap、43 ms 交叉淡化、单一 composite 主体。
- MIT KEMAR 可自由使用（需署名）；SADIE II 为 Apache-2.0；HUTUBS 为 CC BY 4.0。
- 非个性化 HRTF 会增加前后/上下混淆；动态重放能显著降低前后混淆。
- WebXR 手部固定 25 关节。

**推断（未在本机验证）**

- PolyNodesAVP 不做头显本地音频渲染（依据是“必须配合桌面 app + IP/OSC”）。
- 16 个常开 HRTF panner 在一体机上会过载；8 个池化更稳。
- 8 节点 / 16 节点方案在耳机上能听出前后左右（需 §6.7 实验确认）。
- 43 ms 交叉淡化会削弱快速掠过的方向感。

**待验证**

- IRCAM Listen 的真实许可条款（必须拿到书面确认）。
- CIPIC 的当前许可与可下载性。
- Vision Pro Safari 的 WebXR 手部是否稳定给出 25 关节（仓库 README 有描述，但未在本文复核）。
- 各浏览器（Chromium / WebKit）实际 HRTF 音色差异的主观幅度。

---

## 11. 一句话给下一个执行者

> 先用 `PannerNode(HRTF)` + 8 个池化声部 + 1 个颗粒旅行声部，在桌面上把“前 / 后 / 左 / 右”听出来；**在跑完盲测之前，不要写“已实现空间音频”**。
