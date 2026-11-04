# 结构调查与声音修订

用户实际反馈：方向开始成立，但质感仍粗糙，缺少细致混音与母带处理感。没有记录到01/02明确偏好；本轮以01对应的B作为保留式工作副本。

## 已有结构

128 BPM，16小节30秒；每四小节7.5秒。以下由实际score.json读取，不是听觉推断。

|版本|1–4小节|5–8小节|9–12小节|13–16小节|
|---|---|---|---|---|
|A|bass:16 / metal:4 / kick:2 / snare:2 / pressure:0|bass:14 / metal:4 / kick:3 / snare:2 / pressure:1|bass:8 / metal:3 / kick:2 / snare:1 / pressure:2|bass:14 / metal:4 / kick:3 / snare:2 / pressure:0|
|B|bass:16 / metal:4 / kick:2 / snare:2 / pressure:0|bass:12 / metal:5 / kick:2 / snare:2 / pressure:1|bass:5 / metal:3 / kick:1 / snare:0 / pressure:3|bass:12 / metal:5 / kick:2 / snare:2 / pressure:0|

A：低频问答确认→变体→撤走部分回答→变形回归。B：先确认→错位→拉开空白→第13小节集中归位。两版的问题假设是：大框架已经有变化，但材料的角色、重心、尾音尺度仍相近；还需要“为什么这个回答必须在这里”的句法，而非每四小节更换密度。

## 粗糙感的可检验假设

- 旧预混两版都是−25.26 LUFS；真峰值约−2.20/−2.34 dBTP。峰值余量与平均能量相差大，需要查具体打击尖峰，不宜只把整曲推响。
- 极低频的重量、可听中频的实体感、金属攻击的前后位置需要逐轨平衡；总线母带工具无法代替这些取舍。
- 旧稿关闭了所有预设FX，金属声只加固定13/21ms早反射，其他声音整体偏同一前景；这是流程事实，是否显干或散须听觉确认。
- 本轮只是受控修订：调整打击总线峰值、金属高频与侧声道、轻量总线压缩。原稿保留；等响度对照才用于判断质感，另存交付音量实验。

方法参考：[iZotope保留动态与响度](https://www.izotope.com/community/blog/9-tips-to-preserve-dynamics-without-sacrificing-loudness)、[低频重量与清晰度](https://www.izotope.com/community/blog/mastering-low-end)、[Ableton减法编曲](https://makingmusic.ableton.com/arranging-as-a-subtractive-process)。采用其中的动态层次、低频取舍、减法对比原则，不购买其插件，不照搬作品。

## 本轮交付范围

九个概念各写八小节三声部MIDI与完整音符JSON。先将01“缺席的末音”和07“七拍问九拍答”用真实Surge保存状态渲染为声音试写；其余七个只有MIDI，不冒充已完成音频。九稿不是九首完成作品。

Waveform正式工程保存/重开/导出仍沿用前轮NOT RUN状态，本轮不伪造DAW验证。音频实际由离线插件链处理；没有直接模型听觉验收，未判定演出质量。
