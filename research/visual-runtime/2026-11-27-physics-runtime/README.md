# Performable Physics — 面向粒子特效的轻量 Geometry Nodes-like Runtime

- 日期：2026-11-27
- 类型：独立视觉技术研究 / R&D，不是作品发布、音乐制作任务或现场交付承诺
- 状态：**PROPOSED / 尚未实现或验收**。已有三维预演与手势轨迹原型的体验反馈是研究起点；本文未审阅其完整源码，不能证明其底层物理、照明或设备性能。
- 范围：实时三维粒子、流体、局部物理状态、GPU 计算、演奏控制，以及用于舞台预演的动态光照。暂不复刻完整 Blender Geometry Nodes 编辑器，不开发通用游戏引擎，不改变现有音乐制作的优先级。

## 1. 研究目标与长期价值

将粒子特效从预制动画、手势轨迹和程序化噪声，提升为可组合、可持续演化、可以通过现场动作与音乐进行演奏的三维物理系统。关键资产不是某个手势、某种 Shader 或某个演出，而是一个针对粒子特效优化的小型 Geometry Nodes-like Runtime：在 GPU 上保持状态，允许有序地执行发射、施力、邻域求解、约束、碰撞、采样、渲染及反馈。

创作原则：观众不必认识控制器或手势，也应能理解物质受到何种作用、变化从哪里开始以及为什么仍然持续。手势仅是输入示例；表演者可以面向或背对观众，也可以由旋钮、脚踏、OSC 或已编排音乐驱动。实际视觉构图、镜头、材料、音乐与最终选用仍由作者控制。遵循 [Hybrid Authoring Architecture](../../../visual-runtime-lab/HYBRID_AUTHORING_ARCHITECTURE.md)，不引入默认镜头缩放或自动替代作者素材。

## 2. 仿照 Simulation Zone 的核心架构

Simulation Zone 在这里指一种有反馈的计算语义，不指 Blender 专有运行时的移植。浏览器端可以自行实现：

```text
XR / body / MIDI / OSC / timeline / manual input
       ↓ timestamped input + coordinate calibration + bounded controls
fixed-step simulation clock
       ↓
state A → ordered compute passes → state B → swap
          (forces / neighbor search / solver / constraints)
       ↓                     ↓
render adapter           GPU reduction → bounded telemetry → audio/OSC
       ↓
LED render texture → optional stage twin lighting / camera
```

状态与渲染分离：粒子位置、速度、质量/权重、寿命、材料 ID；按求解器增加网格速度、压力、浓度或形变梯度等。GPU storage buffers / textures 作为状态容器；依赖明确的 pass graph 使用双缓冲或中间缓冲，避免无序读写。固定步长与有限 substeps；时钟滞后时记录 dropped steps，不能无限追赶；摄像机、分辨率、材质和后处理变化不得重置物理状态。模拟停止、单步、恢复、重置必须独立于镜头。随机种子、输入事件、参数、版本和必要快照共同构成回放记录；跨 GPU 不承诺位级确定性。

### 2.1 最小算子模型（接口草案，未实现）

| 算子 | 输入 / 输出 | 约束 |
| --- | --- | --- |
| State / Init / Reset | schema、seed、capacity → state handles | 容量固定，显式重置 |
| Emit / Kill / Recycle | source、rate、velocity → particle state | 预分配、生命周期与质量策略 |
| Force | field、collider motion、input → acceleration | 有界输入，统一单位 |
| NeighborGrid | positions → cell ranges / indices | 避免 O(N²) 全对全；记录桶溢出 |
| Integrate | state、dt → state | 固定物理时间步 |
| Solve | state、grid、parameters → corrected state | 可替换 solver，不统一假装同一材料模型 |
| Collider / Boundary | SDF、normal、surface velocity → constraints | solid / open / periodic 必须有明确定义 |
| Sample / Reduce | state → field samples / statistics | 不逐帧读回所有粒子 |
| Draw | state handles、camera、material → render target | 只读状态；同一模拟可有多种显示 |

建议先用代码/JSON 描述一张固定的小图，不做可视节点编辑器。接口区分 particle domain / grid domain / uniform / texture；在图编译时检查类型、读写冲突和循环。唯一反馈通过明确的状态边；每个 solver 可封装多个 GPU pass。可移植边界是状态契约和算子语义，不保证 WGSL 能自动翻译为 Metal。初始 JSON 示意：

```json
{"version":1,"clock":{"dt":0.008333333,"maxSubsteps":4},"capacity":65536,"nodes":[{"id":"emit","op":"Emit"},{"id":"force","op":"Force"},{"id":"grid","op":"NeighborGrid"},{"id":"solve","op":"Solve"},{"id":"draw","op":"Draw"}]}
```

此示意不包含完整依赖、资源声明、实现或通过测试的 schema。先固定一个 solver，必要时再拆分 pass；避免提前建设通用节点框架。

## 3. 物理求解：Drop Flow 的技术分层

现有手势轨迹原型的实际实现尚未审计；不能把视觉上的湍流认定为真实流体。保留原始视觉语言并对照以下不同机制：

| 路径 | 实际计算 | 适用 |
| --- | --- | --- |
| Trail | 历史位置、寿命、曲线 | 轨迹、手势可读性 |
| Procedural field | Curl Noise / turbulence、外力、积分 | 高效抽象粒子，未必有压力求解 |
| Eulerian grid | 三维速度场、平流、压力投影、边界 | 烟、气流、墨水示踪粒子 |
| PIC/FLIP/APIC | 粒子与网格速度交换、压力/自由表面等 | 液体、可视化物质 |
| MLS-MPM | P2G / grid update / G2P、材料应力 | 液体、颗粒及弹性材料，取决于本构模型 |
| SPH/PBF | 邻域密度、压力或位置约束 | 较小粒子流体实验 |

这些是不同模型，不是质量高低的阶梯。**第一条物理验证线：Eulerian 3D 不可压缩流体 + 被动示踪粒子**；第二条研究线才是 MLS-MPM 或 PIC/FLIP 自由表面物质。在同一初始条件和输入下与现有 Curl Noise 轨迹对照。

不可压缩网格模型（以恒密度为例）：
- 动量：du/dt + (u·∇)u = −∇p/ρ + ν∇²u + f。
- 约束：∇·u = 0；压力投影用于近似满足约束。
- 每步执行动量注入、速度平流、可选黏性、边界与压力求解、速度校正、浓度平流、粒子采样；按离散方案调整顺序并测试。
- 流体密度与可视化染料浓度不是同一个量；涡量增强可补偿部分数值耗散，但不是额外的真实物理证明。
- 手部轨迹转为局部力/动量注入、可选发射源或移动 SDF，停止动作后外力归零，已有状态继续演化。
- 两股流体相遇、障碍物绕流、不同初始条件的响应由 solver 决定，不用预制路径或手势专属动画冒充。
- 压缩密闭容器中不可压缩的满液体不可能同时保持质量与体积约束。改用部分填充液体、开放边界、可压缩介质或颗粒。周期边界必须对速度、压力等网格状态和粒子一致处理，不是单纯 teleport。

### 3.1 验证顺序

A. 固定输入种子，比较静止、一次脉冲、停止输入、相反方向的双脉冲。记录散度（投影前后 RMS）、最大速度、数值异常和能量衰减。  
B. 加入一个固定球形 SDF；观察绕流、壁面穿透率及可见运动，不用画面好看代替边界正确性。  
C. 增加移动壁面/循环边界；检测质量/浓度漂移与能量变化。若模型存在数值耗散，明确报告，不宣称严格守恒。  
D. 对自由表面/颗粒另建小实验，记录材料模型、步长和稳定范围。  
E. 流体结果可以绘成点、线、体积密度或表面；更换渲染方式不改写求解状态。

## 4. GPU 优化：面向粒子特效而非通用引擎

优先 WebGPU + WGSL Compute，Three.js WebGPU/TSL 负责可用的渲染和后处理；需要时在原生 Metal 建立独立后端。CPU 仅更新必要的控制和时间戳，不每帧遍历或回读整个粒子系统。资源常驻 GPU；预分配固定容量；避免频繁创建 buffer、bind group、pipeline 或同步等待。位置/速度等选取符合对齐和访存的布局（SoA 或合适的结构化布局以实测决定）。邻域算法使用空间网格/哈希、排序或分桶；网格求解要单独分析压力迭代、带宽与存储成本。粒子 draw 使用实例化或 GPU-driven 方式（视后端支持）；渲染和求解分辨率独立调节；透明 overdraw、阴影、反射和光照单独计时。

测试矩阵（起始预算，不是已达到帧率）：

| 档位 | 网格 | 示踪粒子 |
| --- | --- | ---: |
| Low | 32³ | 16,384 |
| Medium | 64³ | 65,536 |
| High | 96³ | 262,144 |
| Experimental | 128³ | 1,048,576 |

粒子数量不等于求解分辨率。先测单一 64³ 网格与更小降级档；预算以 1080p / 60fps 的 16.67ms 总帧周期为目标，分别记录 simulation、draw、reflection、lighting、post、CPU submit、frame time median/p95/p99、显存、设备/浏览器版本、掉帧和热稳定性。GPU timestamp query 只有设备支持时才用，否则明确测量方法与局限。长时间验证目标 90min；输入断线、设备丢失、shader 编译失败应有独立恢复或安全回退。无真机结果前不称 performance-ready。

WebGL2 保持已有可运行预览，不把程序化降级效果标作等价物理求解。WebGPU/WebXR/Metal 兼容性逐设备验证；浏览器不能假定获得 Metal 全部硬件光追功能。已有 [Metal 研究](../2026-11-09-metal-lighting-reuse.md) 是平行的原生路线，不强制替换浏览器、DAW 或现有生产链路。

## 5. LED 动态光照、屏幕空间反射与数字孪生

独立于粒子求解器的渲染研究。LED 不能只是一个 emissive texture + bloom；其内容应参与接收表面的照明、高光及反射。**显示、直接照明、间接照明、反射是不同计算过程**。

- LTC / LTCGI 参考：视频纹理驱动的面积光源，使用发光面与接收点的世界空间几何关系、材质粗糙度及预过滤纹理估计漫反射和镜面项；不是多反弹路径追踪。先实现分区面光源/采样近似，16×9 或 32×18 是待测采样预算，不能把每个小块无条件当无限精度点光源；考虑面积、距离、朝向和遮挡。后续比较 LTC 及预计算传递。
- XYZ 动态 irradiance volume：固定场地布置低分辨率 3D probes，预计算屏幕区域到采样点的传递/可见性，每帧更新视频色彩贡献，接收物体按世界坐标三线性插值；可用球谐编码方向性。16×8×16 只是示意预算；避免逐表面全探针全屏采样。静态可见性不能正确处理任意动态遮挡，须标明局限。
- 地面优先 planar reflection（镜像摄像机重绘 + 粗糙度预过滤），屏幕离开当前摄影机视野时仍可反射；以适当裁剪面及渲染预算控制成本。
- SSR：用当前画面颜色、深度和法线追踪，仅可反射屏幕可见信息；离屏、遮挡及屏幕边缘缺失要用平面/环境反射补偿。
- SSGI、AO、contact shadow 是各自独立的近似。体积光仅在确实需要表现空气介质时启用。Bloom、轻微色散、motion blur 作为可关闭的摄影机/表现层，不替代照明。
- 线性颜色空间计算照明，明确 sRGB/视频解码与 tone mapping；不能把展示屏的最终 tone-mapped 颜色直接当经校准的物理辐射量。实时孪生效果不是现场 lux、消防、容量或真实 LED 验收。

验收：LED 黑/白切换，左右红蓝分屏，局部移动亮块；观察同材质不同位置与法线、人物转身、遮挡物、粗糙度变化。切换机位至屏幕不可见验证平面倒影。分别对比 emissive-only / sampled lighting / probes / planar / SSR，并记录耗时。数字孪生实现归 SceneForge，不把场地模型、私有预演地址或部署凭据复制进音乐研究仓库。

## 6. 观众视角、表演映射与音乐反馈

舞台校准：tracking → stage world → virtual scene → LED camera。头部或身体转向不应自动旋转整个世界；定义固定舞台坐标，校准观众看到的左右/上下，对照前向、后向及侧身站姿。用固定参考观察点验证空间对应关系；单面普通 LED 不可能同时提供全观众位正确的三维视差。优先表现可跨座位理解的因果关系，而不是精确贴住手指的幻觉。摄像机合成/空间窗口为独立可选方向，不要求剑指、特定硬件或实时 mocap 才能成立。

| 可演奏机制（提案） | 观众可见因果 |
| --- | --- |
| 局部扰动、涡环 | 小动作引起传播并在停止后继续 |
| 颗粒与重力 | 堆积、支撑、坍塌 |
| 波场 | 激发、传播、反射、干涉 |
| 黏弹性物质 | 拉伸、抵抗、释放、恢复 |
| 循环/动态容器 | 改变边界导致物质重新组织 |
| 涌现生长 | 改变局部条件后系统自行发展 |

不要把这些当六套强制制作的视觉或预定演出段落。先用一段相同音乐、同一个固定观众机位、相同物质与构图，A/B 对比普通推子输入与身体输入、程序化流场与求解器；不解释动作，让观察者描述方向、原因、余动、阻碍与释放。记录他们能否辨认及误读点，再决定动作映射，不根据开发者主观体验宣称观众看懂。

声音反馈：用 GPU reduction 输出总动能、平均速度、涡量指标、碰撞冲量（模型支持时）和压力统计；归一化、有界平滑后以有限频率通过现有 OSC/Max 适配器发送。音频线程不等待 GPU；超时保持/衰减至安全值。参数可映射到合成、空间声源、滤波或离散事件。避免无界主增益/自激反馈。此为接口研究，非已连通 Max、Ableton 或现场系统。不改变已编排音乐、作者构图或现有 P0 制作。

## 7. 分阶段验收与停止条件

| 阶段 | 必须产生的证据 |
| --- | --- |
| P1-A 单一状态核心 | 一份最小可运行 3D solver；固定步长、停止外力余动、散度、无 NaN；换机位不重置 |
| P1-B Drop Flow 对照 | 同一输入的程序化与物理版本、动态障碍/边界小样、可见因果记录 |
| P1-C 性能 | 不同规模、至少两档设备的性能日志与回退规则；无硬件报告不填推测值 |
| P1-D 空间回光 | 独立 LED texture 测试、planar vs SSR、probe/area light 对照 |
| P1-E 表演验证 | 固定机位观众 A/B、一个可重放的输入序列、一个有界 OSC 统计量 |
| P1-F 稳定性 | 长时间运行、暂停/恢复、断线、丢帧、录制回放及现场输出链验证 |

优先 A→B；灯光 D 可独立在孪生工具验证。通过一条就记录证据，再决定是否扩展，不同步铺开所有 solver、节点编辑器、六种作品和原生平台。P1 只表示独立研究通道，不启动自动开发或生产调度。每次实验保存 git revision、solver/参数、设备/浏览器、输入记录、采样指标、失败原因、图像/录像及复现实验命令（授权范围内）。当前全部验收项未由本文验证。

## 8. 参考入口与证据边界

以下为本轮技术讨论的候选阅读/复现实验入口；此次归档没有重新检查所有页面、版本、许可证或运行演示。仅链接，不复制第三方源码、音乐、动作数据或图像。使用前核对作者、commit/tag、许可证及复用范围，并按仓库 PUBLIC_RESEARCH_POLICY 更新 acknowledgements。

- Blender Manual — [Simulation Zone](https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html)：状态反馈语义，而非 Blender runtime 可直接部署的证明。
- NVIDIA GPU Gems 3 — [Real-Time Simulation and Rendering of 3D Fluids](https://developer.nvidia.com/gpugems/gpugems3/part-v-physics-simulation/chapter-30-real-time-simulation-and-rendering-3d-fluids)：网格流体求解与渲染基础。
- PiMaker — [LTCGI](https://github.com/PiMaker/ltcgi) / [documentation](https://ltcgi.dev/)：动态纹理面光源参考；不等同完整实时光追 GI。
- Three.js — [WebGPU examples](https://threejs.org/examples/?q=webgpu)：检查当前版本后处理与反射接口。
- W3C — [WebGPU](https://www.w3.org/TR/webgpu/) / [WGSL](https://www.w3.org/TR/WGSL/)；Apple — [Metal](https://developer.apple.com/metal/)：能力依据，设备实际支持另测。
- holtsetio — [Flow](https://github.com/holtsetio/flow)；Shun Matsuoka — [Splash](https://github.com/matsuoka-601/Splash)、[WebGPU Ocean](https://github.com/matsuoka-601/webgpu-ocean)：候选 MLS-MPM/SPH 网页原型，技术归类待核对当前源码。
- David Li — [Fluid Particles](https://github.com/dli/fluid) / [demo](https://david.li/fluid/)：PIC/FLIP 网页实现候选。
- Karl Sims — [Fluid Flow](https://www.karlsims.com/fluid-flow.html)：流体方法及艺术交互参考。
- Max Cooper / Andy Lomas（Emergence、细胞生长等）、真锅大度（Phase Forms 等）：艺术方法参考，需依据作品作者资料区分预制素材、现场处理与实时求解；不推断具体软件、不声称合作或复制许可。
- [Drop Flow 公开动作数据档案](https://github.com/ewanqian/dropflow-biennale-mocap)：原始/重定时动作区别与权利限制，以该仓库说明为准；不据此认定本次轨迹 Demo 或其代码属于该仓库。

## 9. 跨仓库归属决策

- 当前唯一主研究入口：performable-music 的 research/visual-runtime/ 本目录。它是独立技术笔记，不是音乐主线、生产 runbook 或新作品。
- SceneForge：负责预演、舞台镜头、视频纹理及空间照明的实现；只接入明确的渲染适配器，保持已有 WebGL2/XR 路线。
- LiveForge：等核心算子和跨平台契约经过验证、可复用时评估迁入；未决定重构或迁移，不建立新仓库。
- art-works：只有在形成独立创作命题/作品时才保存艺术概念和链接，不镜像技术代码；Drop Flow 原档案保持原职责。
- 私有部署、原始实验现场资料、设备/客户/个人运营信息留在适当私有空间。此文是公开安全的研究摘要，不包含对话记录或私有地址。
