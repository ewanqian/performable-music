# Mac ↔ Windows · 音乐、控制与视觉交接

2026-11-18。状态：制作接口约定；尚无本轮跨机接收、实时连接或硬件联调证明。

## 1. 接入已有接口

正本是现有 [Show Score v2](../../protocols/README-show-score.md)、[schema](../../protocols/show-score-v2.schema.json) 和 [参考实现](../../protocols/show-score.mjs)。[LinkOSC适配设计](../../protocols/linkosc-stage-adapter-2026-11-09.md)继续负责音频分析来源的区分。原 XR 输入由 [XR Creations](https://github.com/ewanqian/xr-works)及已存在的桥提供；不另建追踪器或音乐时钟。

| 接口 | 产生端与权威 | 消费端 | 本轮接入规则 |
| --- | --- | --- | --- |
| 当前音频/音乐版本 | Mac / 实际选定的 Ableton 工程 | Windows视觉、离线回放 | 交冻结WAV和清单；不读取随时变化的工作文件 |
| 实际MIDI/CC | Mac / 生成器之后、乐器之前的真实输出 | 既有适配器及Windows | 保留note/channel/velocity、时序与来源；没有就明确缺失 |
| 段落、事件、Show Score | Mac音乐时间与经授权的导演操作 | Windows/现有视觉runtime | 共享session与事件身份；具体接入方案需两端实际记录 |
| 音频分析/LinkOSC | 实测或离线派生特征 | 平滑的视觉连续控制 | 不冒充精确MIDI或重置主时钟；未实测时仅为设计 |
| XR手部、脚踏、按钮 | 已存在的输入终端 | 音乐/视觉的受限控制层 | 标明真实来源、负责人和实际端点；不通过存在文档推断已连通 |
| 材质、灯光、人体动作、HUD | Windows / 实际场景与cue映射 | 渲染和现场输出 | 以消费的音乐版本回报；状态名在局部映射，不另造全局协议 |
| 反馈/上传 | 生成该版本的终端 | 主任务与另一终端 | package ID、hash、目标、接收回执和缺失项一起传递 |

IP、端口、设备名、实际适配器版本目前未知，由终端回执填入私有记录。公共回执使用 endpoint ID 和脱敏配置。此次集中入口不代表已经搭好了网络桥。

## 2. 冻结音乐包

每次生成新的不可变 `package_id`，包含作品source ID与音乐版本；不要仅用 `latest.wav` 或 `final` 表示身份。新包不能原地覆盖已交付包。接收者确认前，不自动替换正在渲染的旧包。

包中提供：

- `manifest.json`：package ID、work/source ID、版本、生产终端、导出时间、文件相对路径、字节数、SHA-256、时长、采样率、声道、权限与依赖。
- 参考立体声 WAV。按需要附同起点 stems；总线与非线性处理若使stem求和不等于master，明确说明。
- 每轨实际MIDI/控制导出；只有参考母带时，人工cue与音频派生特征分别标记，不伪造原始MIDI。
- tempo map、拍号、cue、实际控制日志及其时间基准。没有测量或源工程证据时不填BPM/调性。
- 参考导出范围、前导空白/count-in、尾音范围和所有文件的共同零点。
- 接收说明：需要的插件/采样是否可重分发；Windows只需reference bounce时，无须搬运全部Ableton资产。

包内使用相对路径；机器绝对路径保存在终端私有manifest。团队音源署名和素材权利跟随版本。仓库中保存清单和获准公开的内容；实际私有包走既有授权位置。

## 3. 三种时间分开记录

**音乐时间**：以参考音频 sample 0 为基准的曲内秒数，另记它对应的原工程位置。MIDI、cue和stems必须能映射到这个起点。

**会话时间**：Show Score v2 的 `t_ms` 是session开始后的单调毫秒。播放中seek、loop或暂停不能让同一session的它悄悄回零。用独立transport映射/日志说明会话位置如何对应曲内位置，保留事件身份和来源。

**渲染时间**：记录 `frame_start`、真实 `fps` 与首帧对应的音乐秒数：

`music_seconds = render_start_music_seconds + (frame - frame_start) / fps`

收到包后先检查头、中、尾至少一个明确事件的位置。同步偏移必须附测量方式；尚未测量就记null。变速/变拍号、seek和loop按实际支持情况回报，不能由schema含字段推断参考实现全支持。

## 4. Show Score v2 的兼容边界

1. `scene` 当前只有 `INITIAL_CONDITION / FIELD / OVERRIDE / AFTERIMAGE`。石体、显影、HUD等局部状态放入 `event.target` 或命名空间 `controls`，映射至现有场景。此次不修改全局枚举。
2. `event.source` 当前只有 `hand / foot / button / osc / clock / system`，没有 `midi`。真实经OSC到达才用 `osc`；直接MIDI由实际系统适配器产生语义事件时，标系统适配器并在sidecar保留原MIDI出处。无法忠实映射时保留原数据并列为待接入，不能伪报来源以通过schema。
3. `clock` 的数字来自实际音乐/transport映射；100/128 BPM示例不成为复苏默认值。当前无实测BPM，不能提前生成宣称来自原曲的Score。
4. 离线回放不依赖现场UDP到包速度。seek后重建note、CC、cue和持续包络状态；不把过去的瞬态补发成一次突发。
5. 视觉blackout作用于最终画面，包括发光、背景与合成层；单独的视觉黑场不应被误映射为关闭音乐。全局 `safe.kill` 继续遵守既有协议含义，不擅自改为只关灯。

## 5. Windows接收与反向反馈

先完成 `RECEIVED`：核对package ID、manifest及文件hash、参考音频可读、时间零点明确。只有具体项目和输出验证过，才升级 `OFFLINE_SYNC_VERIFIED`；跨机实时输入另外记 `LIVE_LINK_VERIFIED`，两者不能互相替代。

视觉回传包括消费的音乐package与hash、视觉源commit/版本、Blender或runtime版本、FPS/分辨率、实际输出范围、测量偏移、短片及未完成项。音乐改动请求写清源版本、曲内时间码、需要的动作和听觉原因，由Mac决定并产出新包。

上传区分 `PREPARED / UPLOADING / UPLOADED / RECEIVED`。已生成文件不等于已上传；有URL不等于另一端已接收。接收回执针对确切package ID，避免两端分别拿着不同的“最新版”。

## 6. 并发和回报

- 一个活动 `.als` 只有Mac当前DAW owner写；其他音乐分析只读导出副本。
- Windows视觉源和渲染由Renew当前负责人继续写；云端只维护分工、接口和摘要，避开活动源文件。
- 同一个文件不由两端同时维护；每端新增带日期/版本的回执。主任务整合链接，保留真实报错和不确定项。
- 更新远端前先读当前HEAD与目标文件；发现新提交先检查差异，不force-push或重置对方工作。
- 终端读取本入口时保留dirty worktree；可fetch/read文档，不强制切分支或stash当前制作。

本约定与 [PR56交接](https://github.com/ewanqian/performable-music/blob/codex/ableton-local-cloud-handoff-20261111/production/ableton-handoff-2026-11-11/README.md)互补。已有生产、音乐质量和原工程保护规则继续适用。
