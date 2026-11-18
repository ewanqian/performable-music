# 现场演出的组织

## 从一份完成的音乐，到一场真正能够演奏的演出

*《声音的组织》延伸读物／研究与实作稿 0.1，2026年11月18日*

舞台上没有一种软件能够代替创作者决定音乐下一刻应当发生什么。时间轴可以精确地播放已经写好的事，控制器可以在某一刻插入新的决定；而观众实际听到的，是这些决定在同一段时间里怎样彼此影响。

本篇从一份已经完成的音乐开始，不要求读者先购买控制器、安装视觉引擎或编写程序。目标是把它变成一场**能够进入、停留、转换、结束，且在发生故障后仍有出路**的演出。文章最后提供一份可按图实施的单机 Live Set，以及从单机发展到双机音画系统的路径。

第一条原则并不神秘：作品需要一部分不再随意更改的身份，也需要一部分留给现场的选择。前者使它仍然像一首作品，后者使人正在演奏，而不只是触发播放。

## 一、先决定自己在演奏什么

把一首已有音乐拆成三个问题，比一开始拆成二十轨有效：

1. **什么不能轻易改变？** 一段钢琴演奏的呼吸、低音的音高关系、某次回返、完整的声源授权与署名，通常属于作品身份。
2. **什么值得让现场改变？** 某一声体保持多久、下一句什么时候出现、颗粒层是否留下、一个重击是在等待之后发生还是直接出现。
3. **什么必须始终能够停下来？** 反馈的上限、突发高频、接收不到控制时的状态、误触下一段后的恢复、整套系统的紧急静音。

不要把“能用 MIDI 控制”误认为“值得演奏”。在音乐已经成立的前提下，一次有效操作应当改变时间、关系、密度或空间，而且可以自然退出。只把音量变得更大或者让画面更亮，并不足以证明控制有音乐意义。

一个简单的测试：同一套素材录两次；第二次让某个尾音多停留，让下一句提前或推迟。两次都能听完、有不同的结构意义，才算开始拥有现场版本。

## 二、四种典型演出形态，该选哪一种

| 架构 | 适合的作品 | 音乐与画面职责 | 决定方式 | 优势与代价 |
| --- | --- | --- | --- | --- |
| **A. 单机 Live** | 小型电子音乐、器乐加电子、课堂实验 | Live 承担声音、录音和大部分音乐决定；没有视觉或只使用轻量可视化 | Session Clip、键盘／MIDI、宏 | 搭建最快，最容易恢复；同机图形可能与音频争夺性能 |
| **B. 双机音画** | 实时视觉演出、沉浸式舞台 | Mac 或音频机负责 Live 与音频接口；Windows 或图形机负责 TouchDesigner／Resolume／WebGL 与显示输出 | 声音端发送事件与必要连续状态；视觉端独立渲染 | 职责清楚，GPU不会直接抢音频宿主；必须处理网络、延迟、版本与失联 |
| **C. 时间码节目** | 音乐剧、严密编排的节目开幕、固定视频片段 | QLab／播放系统执行 Cue，或时间码追随固定音乐；Resolume Arena 可按外部 SMPTE 追随视频播放头 | GO、MTC／LTC、Cue 列表 | 固定演出点清楚；不适合把每个开放段落都写死 |
| **D. 交互式乐器群** | XR、多人电子乐器、互动装置 | 输入端先解释身体动作，再交给音乐与视觉系统 | 语义事件、连续控制、状态机 | 自由度高；需要处理漂移、断线、控制权竞争与恢复 |

**第一次做完整现场工程：从 A 开始。要加入复杂三维视觉时再升到 B。** C 适合需要逐帧对应的段落，并不是实时演出的“高级版本”；D 则应在 A／B 已经有音乐价值时扩展。对只有一个音乐家、一个视觉作者的项目，先把最简系统真正演两次，比把四套系统画在同一张图上更有效。

## 三、认识现场的四条时间轴

现场系统经常被错误地描述为“所有东西用同一 BPM 同步”。然而至少有四种时间需要被区别。

**音乐时间。** 小节、节拍、十六分音符、拍号和速度；它用于节奏性片段的量化和进入时机。Ableton Link 同步的是音乐节拍、速度和相位，启用相应选项时还可以共享开始／停止。它不能自动告诉另一台机器“此刻正在演奏哪首作品的第几段”。

**作品时间。** 一份 WAV 从样本 0 开始经过了几秒；自由速度钢琴与已渲染视频都可能需要它。固定曲目中某一时间点的位置，可以通过媒体播放头或时间码描述。SMPTE/LTC 可以让 Resolume Arena 的视频播放头追随外部时间码，但时间码本身不会替操作员启动正确的 Clip。

**演出事件时间。** 演奏者什么时候按下 NEXT，什么事件已被授权，什么状态正在持续；这是一个带身份的现场事件流。应记录会话 ID、事件序号、来源、接收时间与对应音乐位置。一次 HOLD 不应因为 OSC 重发而反复触发，也不能把设备时钟直接当成编曲的时间线。

**渲染时间。** 图形机按帧率输出图像，音乐机按采样率输出声音。它们的时间步长不同；需要有明确的转换与可测量偏移，而不是根据两个窗口中数字看起来一致就认定同步。

可执行的判断：**有循环和节奏要跟随时，使用 Link／MIDI 时钟一类的节拍参考；有固定视频播放位置要跟随时，研究 LTC／MTC；有“下一段”“释放”“黑场”等语义时，使用明确的 Cue 事件。** 音频频谱或 onset 事件可改善视觉反馈，但不应成为舞台唯一的主时钟。

资料：[Ableton Link FAQ](https://help.ableton.com/hc/en-us/articles/209776125-Link-features-and-functions-FAQ)；[Live 同步说明](https://www.ableton.com/en/live-manual/12/synchronizing-with-link-tempo-follower-and-midi/)；[Resolume Arena SMPTE](https://resolume.com/support/en/smpte)。

## 四、在 Ableton Live 里做出第一个可以演奏的 Set

以下练习使用一段已经完成、具有明显段落与自然尾音的原创音乐；没有控制器也可以完成。制作完成后得到一份 `.als`、一次实际录音和一张可以按键核对的状态表。

### 第一步：保存原作，建立新的演出版本

打开原工程，另存为 `piece_live_v01.als`，不要直接覆盖录音版。将正式声音拆成尽量少的功能轨道。起点可以是：

| 轨道 | 放什么 | 为什么单独存在 |
| --- | --- | --- |
| SOURCE | 完整乐句／独奏 | 一次触发后保持完整，不用每次手势都重新打断 |
| BODY | 低音或主要声体 | 为整段建立稳定重量，不随颗粒效果乱晃 |
| TEXTURE | 持续、可延长的纹理 | 可以 HOLD，也可以逐渐释放 |
| EVENTS | 短事件或断裂点 | 让演奏者决定何时打破当前时间 |
| TAIL | 独立的余音／空间返回 | 不用截断主句也能延长感知距离 |
| CUE | 明确的控制／记录说明 | 显示和记录状态，不必发声 |

这是六种**职责**，不是强制必须创建六轨。实际音乐只有三种声音，就只用三轨。避免把同一个声源复制成十轨，再用十个推子模拟“复杂”。

### 第二步：从 Arrangement 切换到 Session

在 Live 中按 `Tab` 打开 Session View。横向一行是 Scene，纵向一列是 Track；一个轨道同一时刻只能播放其中一个 Clip。建立少量清楚命名的场景，例如 `ORIGIN`、`SPACE`、`INTERVENTION`、`RETURN`、`END`。在场景中安排必要 Clip，不把所有音轨都塞满。

注意：Session 里的空槽可能带有 **Stop Button**，触发某一 Scene 时会停掉该轨已播放的 Clip。如果要让钢琴继续，同时只替换电子层，就要检查并移除对应的停止按钮。这个细节比给每一幕发明奇怪名字重要得多。

Live 的 Global Quantization 可以让节奏性片段在小节边界进入，但自由时间、未 Warp 的独奏音频不应因此被强制校准为电子鼓的节拍。音频 Clip 的 Loop、Warp、Launch 设置要根据具体源声音测试；自然句末的 NEXT 必须让句子完整结束，而不能只寄希望于“全局一小节量化”。

### 第三步：只让三个操作有权改变音乐

**NEXT**：在适当的句末进入下一个 Scene／乐句；**HOLD／RELEASE**：保留一层已经被准备好的声场，并在松开时让它自然撤离；**EXPAND**：在有限范围内改变一个明确维度，如纹理距离、非线性粗糙度或电子回应。先用键盘／MIDI 映射，等音乐动作成立再加踏板与 Quest 3。

Live 的 MIDI Map Mode 通过工具栏 MIDI 按钮或 `Cmd+M`（Mac）／`Ctrl+M`（Windows）进入，点击参数后发送控制器消息，再退出映射。把映射表写在纸上。不要直接把 XR 手的每个关节都映射到不同效果器，也不要映射音频主输出增益为无界连续量。

### 第四步：录两次，而不是只看屏幕

先听完整的固定参考录音。再在 Session 中开启 Arrangement Record，演一次较长的 HOLD，一次较短的 HOLD。回到 Arrangement 比较两份作品的段落、进入时机与尾音。Live 官方确认 Session 演奏中的 Clip 发射、混音器和效果参数变化可以被录入 Arrangement；它记录的是这些操作，不自动生成另一份被重新演奏的 WAV。需要真实音频交付时另外 Resampling 或正式导出。

**通过标准**：同一素材、两种真正不同的时间组织，正常停止和重新开始都可复现；如果只是两个版本音量不同，不算完成。

资料：[Live Session View](https://www.ableton.com/en/live-manual/12/session-view/)；[Launching Clips／Follow Actions](https://www.ableton.com/en/live-manual/12/launching-clips/)；[MIDI Mapping](https://www.ableton.com/en/live-manual/12/midi-and-key-remote-control/)。

## 五、如何选择控制器，而不是堆控制器

| 控制器 | 最适合的决定 | 不应该承担的责任 |
| --- | --- | --- |
| 键盘／APC Pad | 选场景、NEXT、单次事件 | 把所有 64 个按钮用满才算有演奏性 |
| 推子／旋钮 | 有明确上下限的密度、湿度、距离、滤波与声部比例 | 直接无边界操作主音量、反馈或爆发频段 |
| 脚踏 | HOLD、RELEASE、NEXT、可靠的人工确认 | 作为完全依赖无线网络的唯一紧急静音通路 |
| Quest 3／WebXR | 空间位置、速度、手势状态、持续表达 | 未经过滤地触发关键切歌、主时钟或无法撤销的效果 |
| 外部音频分析 | 图像中的瞬态、能量、密度等细节回应 | 假装精确知道演奏者的作曲意图或原始 MIDI |

一个合理分工是：**键盘和脚踏确保作品能够推进，旋钮负责一两个有听觉意义的连续量，XR 只增加已有音乐关系的表现力。** 任一输入断开，作品仍有可以继续运行与结束的路径。

## 六、把一台电脑变成两台：谁说了算？

对音画现场，最直接的双机路线是：

```text
[Mac / 音乐机]
Ableton Live ── Audio Interface ── FOH / PA
   │
   ├─ MIDI/Max/Show Adapter ── OSC/Event ──┐
   └─ Referenced WAV + Cues ──────────────┤
                                          ▼
                                [Windows / 图形机]
                               Resolume / TouchDesigner
                                       │
                                       └─ Video Out ── LED / Projector

[Foot / Pad] → Mac／控制适配器
[Quest 3] → WebXR → Bridge → 经过解释的控制事件（可选）
```

**权威要唯一。** 音乐机决定正式的声音版本、乐句和可演奏的转场；视觉机消费带版本号的事件，而不是自己猜音乐现在在哪里。两边用有线局域网连接，明确 IP、端口、协议和接口负责人。OSC 发送的 `NEXT`、`HOLD`、`RELEASE` 必须包含来源、会话和顺序，必要时由接收端回传确认。OSC 通常通过 UDP 发送；收到过一次不代表之后不会丢包，也不代表时间同步已经精确。

**视觉软件选型**：Resolume 最适合现成片段、图层、素材切换与已经成熟的 VJ 输出；TouchDesigner 更适合对事件、三维场、实时数据和图形逻辑做定制；WebGL / three.js 可用于轻量自定义图形，但仍需要专门考虑现场输出、监控和重启。不要为了“有连接”就让全部软件同时负责同一种事。Resolume 的 OSC 支持控制图层与参数；TDAbleton 通过 Live MIDI Remote Scripts／Max for Live 和 OSC 实现双向控制，支持两台不同电脑，但其存在并不等于实际项目已经连通。

**音画关系可以分三层：** 同一事件让声音与图像同时进入；同一段落让两边的过程在不同速度下发展；某些瞬态通过低延迟局部分析产生细节。第一层负责结构，第二层负责生长，第三层负责质地。不要倒过来，让 FFT 的噪声支配整场作品。

资料：[Resolume OSC](https://resolume.com/support/en/osc)；[TDAbleton](https://docs.derivative.ca/TDAbleton)；[TouchDesigner OSC In](https://derivative.ca/UserGuide/OSC_In_CHOP)。

## 七、什么时候需要第三台电脑与外部时间码？

当节目由多名操作员负责音频、预制视频、灯光或舞台 Cue，或者存在必须逐帧对齐的固定片段，才值得引入专门的播放／Show Control 职责。

QLab 采用 Cue List 思维：GO、自动后续、不同列表和音频／视频 Cue 是演出组织的单位。QLab 5 可以让 Cue List 从 MTC 或 LTC 启动相应时间码 Cue。Resolume Arena 可以让指定视频 Clip 的播放头跟随外部 SMPTE/LTC，但仍必须确保正确的 Clip 已经被激活。这个区别非常重要：**知道“现在播放到第几帧”不等于知道“应该演哪一个段落”。**

可把严格固定的开场片、品牌倒计时或某次硬同步切换交给时间码；其他开放段落仍由人决定。除非作品本来就是完整时间码节目，否则没必要为每个滤波变化设置一条固定的“世界时间轴”。

资料：[QLab Cue Lists](https://qlab.app/docs/v5/fundamentals/cue-lists/)；[Resolume SMPTE](https://resolume.com/support/en/smpte)。

## 八、演出工程应该长成什么样

完整系统的价值在于另一位操作员能在指定机器上打开、辨认并恢复它。建议最小归档：

```text
live-sets/show-name/
  README.md                 # 作品、人员、设备、版本、操作入口
  show-score.json           # 正式段落／事件及合法控制状态
  ableton/                  # 已验证的 ALS 副本或其私有引用
  audio/                    # 已允许分享的参考 WAV 与同步 stems
  visual/                   # 正式视觉版本与输出说明
  mappings/                 # PAD／踏板／XR 的语义和端口
  cue-sheet.csv             # GO、HOLD、RELEASE、黑场与预期状态
  runbook/                  # 开机、连接、音频检查、退出和恢复
  rehearsals/               # 每次实录、失败与修复记录
  manifest.json             # 文件 SHA256、版本、起点、依赖、责任人
```

文件名不要叫 `final_final_new`. 两端交付使用一个冻结的 package ID。音乐机不让多个 Agent 同时写正在使用的 `.als`，视觉机也不把私有资产复制到公开仓库。在加入新效果之前，先保证当前版本可以保存、重开、播放、停止、再播放。

## 九、演出前真正要演练的，不只是节目

**第一次运行：** 断开所有交互，用固定版本把声音、视频各自放完。确认音频输出、屏幕比例、起点、结尾和授权材料没有问题。

**第二次运行：** 只增加三个控制，演出者两次决定不同停留。记录实际演奏和相应输入日志；不要用脚本生成的两个固定版本冒充真人演奏。

**第三次运行：** 模拟失去 OSC、XR、无线网络或视觉程序。一台机器退出后，另一台是否仍能维持安全状态？操作员能否通过已测试的物理路径结束声音？在视觉恢复后，旧事件会不会被重新执行导致突然闪烁或重击？

**第四次运行：** 检查正式演出条件：FOH/PA 与监听的声道、采样率、接口、系统响度余量；LED/投影分辨率、帧率、亮度与黑场；操作桌、线缆、供电、开机顺序、彩排时间；节目转场时谁负责 GO，谁负责总静音。多机系统要记真实网络和同步偏移，不能靠两台画面“看上去差不多”代替测量。

每次演练留一份简短记录：工程版本、音频设备、成功的动作、失败的动作、是否复位、当前可用的备份。**备用立体声 WAV 必须在独立播放路径中真正打开播放过，才叫备份。**

## 十、一份可以完成的练习：90分钟舞台原型

如果只给读者一次动手时间，建议做这一项，而不是一口气安装十种工具。

- **前20分钟**：选定一段60—120秒的原创音乐；保存演出副本，识别一件不能打断的乐句和一层可以延长的尾音。
- **接下来的25分钟**：在 Live Session 准备三个 Scene：`PLAY`、`HOLD`、`END`。检查 Stop Button，确保主句不会被 HOLD 停掉。
- **接下来的20分钟**：给键盘或控制器设置 NEXT 与 HOLD／RELEASE。将改变限制在尾音层，主音频不受无界控制。
- **接下来的15分钟**：用 Arrangement Record／Resampling 做两次实际演奏，故意让第二次与第一次在时间上不同。
- **最后10分钟**：保存、关掉 Live 再打开，验证所有媒体在线；断开控制器后仍可用键盘停止和正常结束。

**结果应是三份确凿文件：** 可重开的 Live Set、两份实际演奏音频，以及写清按钮含义和恢复方式的一页 Cue Sheet。做到这一步，才值得花更多时间研究双机、XR、TouchDesigner 和外部时间码。

## 十一、下一阶段：把同一个练习扩展到双机音画

在 Windows 先建立一个简单的视觉接收页面，只有三种状态：`PLAY` 时出现主体，`HOLD` 时保留并缓慢改变，`END` 时收束和黑场。Mac 向接收端发送同样三个事件；将每次接收记录下来，再测试丢包、重复事件与断线恢复。视觉至少有一种可看见的空间变化，但不要求立即做复杂三维材质。

成功的下一步是：**同一份音乐、同一份事件表，录下两次不同持续时间的音画演出；拔掉控制链路之后，声音能继续、图像能安全停在指定状态。** 这个结果比一百个只会闪烁的实时参数更接近可复演的作品。

---

## 主要资料（均为可访问的公开技术文档）

1. Ableton, *Live 12 Manual — Session View*, https://www.ableton.com/en/live-manual/12/session-view/
2. Ableton, *Live 12 Manual — Launching Clips and Follow Actions*, https://www.ableton.com/en/live-manual/12/launching-clips/
3. Ableton, *Live 12 Manual — MIDI and Key Remote Control*, https://www.ableton.com/en/live-manual/12/midi-and-key-remote-control/
4. Ableton, *Live 12 Manual — Synchronizing with Link, Tempo Follower, and MIDI*, https://www.ableton.com/en/live-manual/12/synchronizing-with-link-tempo-follower-and-midi/
5. Ableton, *Link Features and Functions FAQ*, https://help.ableton.com/hc/en-us/articles/209776125-Link-features-and-functions-FAQ
6. Resolume, *OSC*, https://resolume.com/support/en/osc
7. Resolume, *SMPTE*, https://resolume.com/support/en/smpte
8. Derivative, *TDAbleton*, https://docs.derivative.ca/TDAbleton
9. Derivative, *OSC In CHOP*, https://derivative.ca/UserGuide/OSC_In_CHOP
10. QLab 5, *Cue Lists and Timecode*, https://qlab.app/docs/v5/fundamentals/cue-lists/
11. Robert Henke, *Lumière*, https://roberthenke.com/concerts/lumiere.html

**研究状态：** 本稿对官方功能和通用方法作了核对；所列90分钟练习是教学方案，并非已经在读者的控制器、Mac／Windows或舞台上完成实机验收。本稿不替用户的12月4日演出作声音采用或舞台通过声明。
