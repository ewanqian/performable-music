# 2026-11-15 — AMB / Microsound：声音研究与演奏化进度

**性质：** 公共安全研究日志；不包含 DAW 工程原件、参考录音、付费音色资产或私人本机路径。  
**状态：** 声音方向已由作者给出；本机 `amb_live_v001.als` 的实测信息来自作者所提供的本地 Agent 回报；v002 已交给本地执行，但未在本仓库验收。  
**相关工作：** [Performable Music PR #56 — Ableton-first handoff](https://github.com/ewanqian/performable-music/pull/56)（独立草稿，不能视作已合并）。

## Question

如何从 Ableton 原有的 **Drift / Glitch Sequence** 声音，发展出原创的、可演奏的、偏 **microsound / experimental ambient / glitch-electroacoustic** 的现场乐器及专辑式音乐结构？

## Inputs / 当前材料

- **FACT（作者提供）**：作者制作了原始 `amb`，喜欢具有重量的短促低频脉冲、短音激发后的空间混响；不喜欢尖锐烦躁的高频、突然爆响或失控的 Macro Variation。
- **FACT（本地 Agent 回报，待独立复验）**：`amb_live_v001.als` 已另存；Session 第一轨五个 Clip 已落盘：`Seed` 16 小节/36 音符、`Space` 16/14、`Pulse` 16/26、`Expand` 32/36、`Release` 16/6；原 Arrangement/设备链保留；八宏基线 `0/0/127/64/0/0/0/0`。
- **FACT（本地 Agent 回报，待独立复验）**：所用 MCP 包 v1.0.0，SDK v1.27.1，16 个注册工具；本地 Remote Script 已完成创建 Clip、替换 MIDI 音符、通过 GUI 另存；聊天侧 MCP 连接仍失败。**不能把发现源码接口当作实测音乐录音、XR 硬件验收或演出完成。**
- **FACT（作者提供）**：v002 实施已经委托本地 Agent。本研究日志不修改、不覆盖其正在写入的 Live Set。
- **FACT（作者提供）**：试听了 Ableton `Glitch and Wash` 和 `Skitter and Step` 的声音方向，尚未找到可直接替代原始喜欢的 Glitch Sequence 的音色。
- 参考方法：[Daito Manabe / myoelectric sensor test](https://www.youtube.com/watch?v=dhRJqZ33_3I)。**INFERENCE：** 值得研究“身体动作→离散事件/连续参数→精心设计的音色”，而不是推断原作品使用了某个特定 VST、或把大随机性误当成主要美学。

## Taste / 声音判断标准

**保留：** 清楚的低频重量、发音起始的触感、音高/音色间的小幅运动、可呼吸的静默、与主体有关系的混响尾音、空间层次。  
**避免：** 持续尖亮高频、过量 bitcrush、默认播放就不断增大的延迟/Freeze 回授、无边界随机、不经意的宏切换和全时常驻轰鸣。  
**艺术方向：** Ambient/Electroacoustic 身份优先；音符和节奏服务于有辨识度的音乐动机，而非无目的地堆叠故障效果。

## FACT — 候选音色/工具（官方来源；实际安装授权另查）

| 研究角色 | 候选与官方来源 | 获取/注意 |
| --- | --- | --- |
| 精密 glitch、低频冲击与电磁纹理 | [The Forge — Hecq](https://www.ableton.com/en/packs/forge/) | 随 Live 12 Suite 提供，需核实本机授权；可参考示范工程 |
| 氛围底层、声景及加法合成 | [Spectral Textures](https://www.ableton.com/en/packs/spectral-textures/) | Ableton 官方免费 Pack |
| 模拟电子打击乐 | [DM ARP 2600 Drums](https://www.ableton.com/en/packs/dm-arp-2600-drums/) | 免费 Pack，采样自 ARP 2600 |
| 模块故障、金属短音、洞穴电声 | [Neutral Labs — CNOC / CLAX / SPELUNC](https://neutral-labs.com/goodies/samples) | 免费 WAV；开发者允许音乐商业使用；不应上传原始采样到公共仓库 |
| 环境录音和纹理 | [ELPHNT free packs — FIELD](https://elphnt.io/store/free/) | 免费素材/工具组合；按各包说明核对授权 |
| 颗粒处理，用自有 `amb` 声源 | [Emergence 0.3](https://danielgergely.net/emergence) | 旧版免费；它是音频效果而非 MIDI 乐器 |
| 短促数字故障效果 | [Glitchmachines Fracture](https://glitchmachines.com/products/fracture/) | 免费 VST3/AU；先限制湿声和输出幅度 |
| 大尺度余响和空间回声 | [Valhalla Supermassive](https://valhalladsp.com/shop/reverb/valhalla-supermassive/) | 免费；须限制 feedback/wet 并录音比较 |

**EXPERIMENT（尚待实施）**：不要同时安装一大批；先用 The Forge 的单一声音或 Neutral Labs CNOC，对比原 Glitch Sequence 的低频脉冲。再用 Emergence 0.3 在自有采样上试“碎片↔连续”，与干声做匹配电平 A/B。

## White Room 研究名称消歧（待作者确认）

原始提示为 **“music for whightroom”**；搜索没有确定其准确写法，不应将其归到某个音乐家或曲目。

- 可能指 [Brian Eno — *Music for White Cube* (1997)](https://www.whitecube.com/gallery-exhibitions/music-for-white-cube)：一件基于语音录音、生成规则与多播放器排列组合的空间声音装置。**FACT：** 作品确实存在；**UNKNOWN：** 是否即作者的目标。
- 也可能是 [WHITE ROOM MUSIC LTD](https://whiteroommusicltd.bandcamp.com/artists) 这个音乐厂牌。**FACT：** 该厂牌存在；**UNKNOWN：** 是否目标。
- 独立研究者 [Emiliano Pennisi](https://emilianopennisi.gumroad.com/) 的 Max/MSP / microsound / lowercase 工具属于另一个相关方向，**不是已证实的上述厂牌成员或“Music for White Room”的作者**；其商店当前声明暂停销售至 12 月底。

## 音色实验顺序（实验，不是已完成结果）

1. **AMB_A：** 原有 Seed + 完整原 Rack、固定八宏，录一段 `dry/reference` 试听。
2. **AMB_B：** 在可撤回的副本上控制尖锐频段；每次只改变一个设备或设置，记录与原版的具体差异。
3. **AMB_C：** 尝试一个低频脉冲替代声源（The Forge / CNOC / Drift 最小 patch），与 Seed 同一 MIDI 比较。
4. **AMB_D：** 尝试一个受控颗粒或短重复效果，选择“稳定—变化—释放”三个动作，拒绝持续无界随机。
5. 首先在低监听音量、留有余量的输出下试听；真实的阈值、频段和宏范围由录音与作者判断确定，不以数值替代听感。

## 对演出结构的建议（作曲假设，未完成）

`Space → Seed → Expand → Pulse/Seed → Break → Transformed Seed → Release` 作为从进入、保持、推进、断开、回归到缓和的原型。首轮验收仍以本地已有 `Space → Seed → Release` 的 96 秒 Take 为主，不为新的声音包重开所有控制框架。

## Evidence / 需要从本地带回的证据

- 一个重开成功的 **本地版本号与文件哈希**（不提交私有路径、授权素材）。
- 同一 MIDI 下的匹配电平 A/B 两段音频（仅上传原创、允许公开的音频；否则存私人备份并用引用编号）。
- 选定 Macro 的基线、允许范围、动作语义，以及实测播放状态。
- 所选插件名称、版本、依赖、授权状态和是否能在演出电脑重开。
- 一份包括实际音频、场景请求/实际切换时刻、XR 断开与重新连接结果的排练记录。

## Decision

- **保留** 原 `amb` 的声音身份与已保存的五个 Clip，按作者实际试听为准。
- **不接受** 继续盲装预设包、一次打开多个随机器或将未试听原型标记为舞台可用。
- **不覆盖** 由本地 Agent 正在编辑的 v002；这条文档与制作任务独立。
- **下一个唯一实验：** 用一条已有的 `Seed` MIDI 在现有 Glitch Sequence 和一件替代低频声源间录出**可听的 A/B**，作者标出喜欢/不喜欢的具体秒数。

## Online archival rule

- `journal/YYYY/YYYY-MM-DD-*.md`：每次研究的问题、试听结论、工具来源与证据链接。
- `knowledge/`：经过试听/验证后稳定的选择；不要把暂时喜欢或待测当成结论。
- `instruments/`：独立、原创可复用的 patch、映射和说明。
- `live-sets/`：仅放经权利核对的源工程或可公开版本及 manifest；付费 Pack 采样/插件安装包不要放公共仓库。
- `performances/`：真实验收后的演出编排、控制事件、排练与故障恢复文档。
- 大型个人音频工程采用私有备份（如私人云盘/私有对象存储）+ 公共索引（文件名、日期、哈希、权利、版本、试听链接）；不在公共 repo 公开他人的示范工程和参考录音。
- 参照 [PUBLIC_RESEARCH_POLICY.md](../../PUBLIC_RESEARCH_POLICY.md)，所有外部资源保留出处和授权核实记录。
