# 48 项视觉研究：可复用能力与作品表达分类（A03）
日期：2026-11-27。此为编辑判断，不是完成度、审美评分或真机验收。依据 [48 项原始定义](../STUDIES.json)、[A02](../A02/README.md)、本轮 [A03](README.md) 和 [art-works 创作谱系](https://github.com/ewanqian/art-works/blob/main/lineages/2026-creative-vocabulary.md)。未访问私人 Dot 画廊的全部 48 源码，也未读取本地 Blender/GN 原始节点。TIMER/Drop Flow/NFIR 是方法延伸而非原件重制。

主分类（可跨类别）：U 通用机制，应该沉淀成 runtime 算子、统计或输入/渲染适配；C 强概念，核心是时间、记忆、边界、关系和可见因果；F 高视觉保真，核心是空间、材料、接触、遮挡、照明和运动可信度。每个条目只指定一个主要研发价值，避免重复计数，非对作品质量的排名。总计 24 U / 14 C / 10 F。

表现层：L0 points / L1 lines / L2 surfaces and solid topology / L3 material + PBR / L4 depth + lighting + reflections + transparency + atmosphere / L5 authored models, scans, point clouds or Gaussian splats. L5 is a separate asset/renderer adapter, never pretend that procedural dots are real captured splats. These levels are not a mandatory ladder, and the same camera and state should persist.

| ID | Study | Primary | Levels | Development judgment |
|---|---|---|---|---|
| 01-01 | Corner Pressure | 通用机制 | L0–L2 | 空间施力与清晰方向；不以四角移动作为作品完成 |
| 01-02 | Wall Sweep | 通用机制 | L1–L3 | 移动力区/边界算子；真实移动壁求解待验证 |
| 01-03 | Diagonal Shear | 通用机制 | L1–L3 | 相对剪切与有序双层种子；避免变成全局平移 |
| 01-04 | Breath Box | 强概念 | L0–L3 | 呼吸作为乐句尺度的空间张力；不是密闭液体压缩 |
| 02-01 | Distance Script | 通用机制 | L0–L3 | 按弧长重采样；可生成点、截面、带状曲面与实例 |
| 02-02 | Fan Drip | 通用机制 | L1–L3 | 方向场、分支与纤维组织 |
| 02-03 | Viscous Curtain | 高视觉保真 | L1–L4 | 材质形变、厚度、粗糙反射；弹簧/黏弹性需独立求解 |
| 02-04 | Reverse Drip | 强概念 | L1–L3 | 沉降/反向施力构成段落；禁止倒放冒充物理 |
| 03-01 | Toroidal Return | 强概念 | L1–L3 | 闭环空间与循环时间；周期边界验证 |
| 03-02 | Split Return | 高视觉保真 | L1–L4 | 障碍绕流、真实接触与可见分叉，需 R02 |
| 03-03 | Counterflow | 通用机制 | L0–L3 | A02/A03 物质线和曲面共用三维状态；可扩展双源 |
| 03-04 | Sink and Rise | 强概念 | L1–L3 | 上升下沉的空间复调；避免统一速度 |
| 04-01 | Single Vortex | 通用机制 | L1–L3 | 旋转源与速度场采样 |
| 04-02 | Twin Vortex | 强概念 | L1–L3 | 两个旋涡的结构关系；互扰需实际求解 |
| 04-03 | Vortex Ring | 高视觉保真 | L1–L4 | 环形物质与雾；需测 coherent vortex ring，不只命名 |
| 04-04 | Torn Surface | 高视觉保真 | L2–L4 | 断裂、表面厚度与局部断口；待约束和拓扑 solver |
| 05-01 | Distance Clock | 通用机制 | L0–L3 | 距离阈值、相位、实例生成；分离时间采样和弧长 |
| 05-02 | Delayed Response | 强概念 | L0–L3 | 乐句等待与因果，显式时间戳/事件队列 |
| 05-03 | Phase Drift | 强概念 | L0–L3 | 时间展开为空间，重复截面与相位漂移；A03 TIMER 关联 |
| 05-04 | Threshold Break | 强概念 | L0–L4 | 能量积累与阈值释放，真实指标而非随意爆炸 |
| 06-01 | Breathing Lattice | 强概念 | L0–L3 | 局部邻域驱动自主演化；A02/A03 格架关联 |
| 06-02 | Lattice Collapse | 强概念 | L1–L4 | 结构规则撤销及形态解体；待断裂约束 |
| 06-03 | Suspended Geometry | 高视觉保真 | L2–L5 | 悬浮实体、表面、空间遮挡与流场；待 SDF |
| 06-04 | Quiet Field | 强概念 | L0–L3 | 负空间、极少输入、衰减和停顿；不是空场 |
| 07-01 | Dust Fall | 高视觉保真 | L0–L4 | 光中沉降的细粒、深度和重力；非完整颗粒接触 |
| 07-02 | Heavy Grain | 高视觉保真 | L0–L4 | 可见质量、粗糙接触、堆积；需颗粒 solver |
| 07-03 | Collapse Pile | 高视觉保真 | L2–L4 | 支撑撤除后的坍塌；需约束求解 |
| 07-04 | Tilted Gravity | 通用机制 | L0–L3 | 重力方向和坐标校准；A01 弹道而非堆积 |
| 08-01 | Volume Slice | 通用机制 | L0–L3 | 统一世界空间剖面选择，不改变状态 |
| 08-02 | Scanning Plane | 通用机制 | L0–L3 | 扫描位置与时间/历史抽取 |
| 08-03 | Density Band | 通用机制 | L0–L4 | 密度阈值可视化；示踪统计不是真实质量 |
| 08-04 | Contour Instrument | 通用机制 | L1–L3 | 等值轮廓、采样标量与层次 |
| 09-01 | Echo Trails | 通用机制 | L0–L3 | 有界历史缓冲、空间拖尾、保留拓扑 |
| 09-02 | Layered History | 通用机制 | L0–L3 | 历史帧复用与分层，和 TIMER 时间机制共享 |
| 09-03 | Scar Space | 强概念 | L0–L4 | 历史影响未来状态；不可只画残影 |
| 09-04 | Decay Archive | 强概念 | L0–L3 | 记忆衰减与撤去输入后的余动 |
| 10-01 | Reflection Matter | 高视觉保真 | L3–L4 | A03 镜像地面反射原型；完整 SSR/平面反射需 GPU 实测 |
| 10-02 | Emissive Flow | 通用机制 | L1–L4 | 速度着色/发光是一种通用表现层，非照明 |
| 10-03 | Light Volume | 高视觉保真 | L3–L4 | 空间雾与介质散射；A03 仅距离雾 |
| 10-04 | Edge Discipline | 通用机制 | L2–L4 | 边缘高光与受控光比；非独立作品 |
| 11-01 | Energy Choir | 通用机制 | L0–L4 | 能量统计与可复用有界音乐映射，尚无 DAW |
| 11-02 | Vorticity Choir | 通用机制 | L0–L4 | 涡量统计；需量纲与代理注明 |
| 11-03 | Pressure Choir | 通用机制 | L0–L4 | 压力统计/剖面采样，不能凭空构造音乐数据 |
| 11-04 | Collision Choir | 通用机制 | L0–L4 | 真实碰撞事件与有限声学反馈，待 solver |
| 12-01 | Spatial Window | 通用机制 | L0–L5 | 固定空间窗口与剖面 UI，设备验证独立 |
| 12-02 | Force Handle | 通用机制 | L0–L5 | 锚定力源/局部施力，作为共享交互算子 |
| 12-03 | Observer Shift | 通用机制 | L0–L5 | tracking→stage→audience 校准；不随头部转动 |
| 12-04 | Hidden Instrument | 强概念 | L0–L5 | 隐藏控制和可见后果：表演语法，不以设备噱头替代内容 |

## A02 / A03 actual prototype review

- Distance Script RIB/SEAM/MARK: transferable arc-length/transported frame operator; strongest as a reusable geometry construction primitive, not as three independent artworks. Next add authored closed paths, surface thickness, uniform spacing independent of input Hz and a phase-controlled cross-section.
- Phase Clock RING/FOLD/SPOKE: time-offset/phase progression carries a conceptual premise; keep the geometric state, allow authored transforms, and compare fixed stage-camera framing. A03 TIMER phase corridor demonstrates point→wire→surface→material, not literal original artwork.
- Flow Loom SHEET/CROSS/COLUMN: strongest candidate for visual fidelity. Retain actual periodic staggered grid and ordered tracers; create coherent material topology, break across wrap discontinuity, refine normals and shadow/reflection. A03 uses 30×48 tracers with connected sheets; no claim of solid boundary fluid.
- Autonomous Lattice WAVE/DUAL/GATE: strongest concept family. Graph memory, limited local actions and aftereffects can stay monochrome; L2/L3 plates have thickness in A03, but actual state must alter geometry. No need to force full photorealism.
- A03: three models, four render levels, real browser evidence. Shared camera, state and illumination, not twelve unrelated effects. Prior A01 and A02 preserved. All stages still require artist review.

## Three deliverable directions
1. Universal Geometry Runtime: Resample / TransportFrame / Instance / Connect / History / Section / Reduce, plus simulation and camera separation. Shared graph contracts; no full editor first.
2. Concept-driven sequence: TIMER phase history + NFIR local autonomous memory; use music phrase cue to change state, never compulsory beat flashing. Low-detail abstraction is intentional.
3. Fidelity sequence: Drop Flow material sheets and real solid surfaces; controlled HDR/PBR, real depth, filtered environment, planar reflection and fog. Bring one approved Blender/glTF scene (preserve authored aspect) and separately one authorized 3DGS source, not invented source assets. A03's procedural scene is a reference, not photorealistic finished work.

One strong 60–90s author-led excerpt using all levels as desired; hold camera or move only by explicit cue, preserve each work identity; no changes to production P0. GPU validation on actual target hardware before live use.
