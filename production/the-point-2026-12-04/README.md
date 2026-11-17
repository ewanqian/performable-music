# The Point · 2026-12-04 · 双机制作入口

更新：2026-11-18，Asia/Shanghai。主任务沿用 [Performable Music #57](https://github.com/ewanqian/performable-music/issues/57)。

**Performable Music 负责音乐、接口和交接；Mac 负责复苏编曲；Windows Renew 负责历史资产查找、视觉加工、渲染与上传准备。**

本轮具体任务见 **[Demo代办清单](DEMO_PLAN.md)**：最多四个音乐候选（含复苏），只深化两项；三个视觉短实验共用已有场景，选一个主视觉完成两段音画与一次转场。

Windows 已提交[11/18本地执行报告](https://github.com/ewanqian/atmospheric-escape-liveset/blob/a89ccc4c2250c65e4881e8aeba8a8820aa3ded2f/experiments/entropy-spatial-3d/awakening-light-instrument-20261117/LOCAL_AGENT_PROMPT.md)：70.3秒Drop Flow重组试听、三种灯态、15秒石体离线样片和工程重开。云端尚未独立试听/观看；正式联动仍等Mac音乐包。已有成果先审阅和增量修改，不重新领取或重建。机器session ID与媒体交付位置待回报。

## 只从这里分工

| 终端／位置 | 当前职责 | 接收 | 交付 |
| --- | --- | --- | --- |
| Mac · 复苏音乐端 | 保管实际 Ableton 源工程；一个 DAW owner 继续编曲、导出、确定音乐时间与 cue | Windows 找回的音频候选、视觉时间码反馈 | 冻结版本的试听 WAV、需要的 stems、实际 MIDI 或明确的人工 cue、时间与来源清单 |
| Windows · Renew | 继续已领取的旧资产查找、本地加工；恢复扫描材质；制作模型、光照、motion、HUD、渲染；整理上传对象 | Mac 冻结音乐包、已有私有视觉源 | 资产索引、可重开视觉副本、主画面、15–30秒联动片段、工程与上传回执 |
| Performable Music | 共同入口、音乐决策、Show Score/MIDI/OSC 接口、版本与交接记录 | 两端有证据的回报 | 一套可追踪的主任务与接口约定 |
| Atmospheric Escape | 私有现场视觉内容和相应工程 | 音乐包引用与控制契约 | 实际视觉场景与演出内容；不搬运到公开音乐仓库 |
| Art Works | 已确认的方法、组件与谱系 | 源恢复与作者选择证据 | 可复用经验索引 |
| XR Creations | 现有手部/空间输入应用 | 已定义的输入语义 | 向既有音乐/视觉适配器送输入；本次不迁移应用 |

## 本对话同步到这里的内容

1. 音乐优先：继续实际复苏工程；团队原音乐的身份、分析与重组另据源文件确认。作品的听觉判断由艺术家作出。
2. 音画关系：音乐组织发生、停顿和回返；身体动作影响空间；扫描、光照和 HUD 显示状态变化。人体 motion 与 motion graphics 分别记录。
3. 时间与接口：统一来源、版本、起点、tempo/meter、实际 MIDI、cue 和控制数据；复用 Show Score v2 与现有适配器。
4. 双机职责、接收确认、修改请求和上传去向。
5. 先交一个60–90秒音乐段落及15–30秒视觉证明，再根据实测扩展。

详细视觉配方和素材清单仍在私有 [Awakening 制作目录](https://github.com/ewanqian/atmospheric-escape-liveset/tree/work/awakening-light-instrument-20261117/experiments/entropy-spatial-3d/awakening-light-instrument-20261117)。公开入口只同步经整理的制作决定，不复制私有工程或本次对话原文。

## 名称和当前事实

| 名称 | 当前含义 | 不能自动推导 |
| --- | --- | --- |
| 复苏 / FUSU / Reawakening | 既有发行档案相关名称；艺术家确认编曲源在 Mac | 不证明 Windows 有源 `.als`，也不证明当前编辑版本与已发行音频完全相同 |
| Renew | 艺术家给出的 Windows 本地作品／工作名称，承担资产恢复与加工 | 不据此创建新仓库或把它改名为 Reawakening |
| Awakening | 本次对话及私有实验目录中的工作称呼 | 与其他工程的精确对应仍由两端实际文件确认 |
| AMB | 既有独立制作／研究记录 | 不自动等于复苏，也不拿它替代本次指定源曲 |

演出提案给出 Ewan Qian 12月4日21:00–21:30独立 A/V 时段，最终按主办确认。旧12月3日目录保留为已有研究与准备记录，不重写历史；其16分钟、固定BPM和默认生成任务不能直接作为本次30分钟节目设置。

## Mac：接续当前复苏工程

1. 读取当前工作区与已有 DAW owner；已有负责人继续写，其他 Agent 只读。记录真实 `.als` 的私有路径、source ID、hash与版本，原文件保留。
2. 核对当前要交接的曲目／片段。若 Windows 找回团队音乐，先核对文件与署名，再决定它与复苏的关系；不能按名字自动替换。
3. 继续现有编曲。先导出可听的参考 WAV；按实际需要导出同起点 stems、最终发声前的 MIDI 或独立 cue 轨。无原始 MIDI 就说明，不从母带冒称恢复。
4. 依 [交接契约](HANDOFF_CONTRACT.md) 冻结一个音乐包，写入不可变 package ID、文件 hash、导出范围和时间零点，再向 Windows 给出已上传位置。
5. 首个回执说明实际工程版本、当前写入者、音乐包是否已产生，以及唯一下一步。没有现成包时先回这四项，不必等完整编曲完成才建立交接。

## Windows Renew：继续已领取的工作

1. 保留当前工作区、分支、未提交改动和进程；先读本分工再继续。不重启领取，不 reset，不整体覆盖已有成果。
2. 继续查找 Reactor/Hero、Drop Flow/TIMER、动作与模型等相关资产。登记 source ID、hash、软件版本、依赖、可复用状态和上传去向。具体私有磁盘位置留本地。
3. 复苏编曲源明确在 Mac。Windows 不再以找不到它为失败项；若找到历史音频，只回报候选、时长、关联工程与已知署名，交 Mac 判断。
4. Mac 包到达前可完成静帧、灯态、受光扫描恢复、模型加工、动作或 HUD 预演；音乐同步项单列 `WAITING_FOR_MAC_PACKAGE`。临时音频或控制要标为临时，不作为真实同步证据。
5. 收到音乐包后核对版本/hash，回报 ACK，再使用冻结副本联调。需要改音乐时提交时间码和理由，Mac 输出下一版；Windows 不改活动 `.als`。
6. 可上传的原创代码、文档和清单按目标仓库提交。私人音频、授权采样、客户视觉、模型母包和重型工程先用既有授权私有存储；没有目标就回报缺少目标，不能默认推到公开 Git。
7. 回传可重开视觉工程的清单、短片与实际渲染参数，并指出消费了哪个音乐 package ID。已上传才写上传完成。

## HUD 与动作设计记录

艺术家新增方向：悬浮于三维空间的科幻 HUD、明确而迅速的状态切换、精细的展开/收束/扫描/跟随动效。提到《死亡搁浅》作为观感参考；设计师姓名未确认，不编造归属。

这是一项视觉研究需求，不要求复刻游戏界面或另建控制台。HUD 读取实际段落、操作、目标与材质状态；它可以作为视觉层，由同一份事件触发。人体动作数据与界面动效分开命名，以免把 motion graphics 误写成已实现动捕。

身体—石体迟滞、扫描显影和留痕仍为候选创作方案，不标为作者已选定的最终作品或已完成能力。

## 现有任务怎样接续

- [Atmospheric Escape #13](https://github.com/ewanqian/atmospheric-escape-liveset/issues/13)：Windows Renew 执行入口；状态依据用户确认更新为执行中，机器回执待补。
- [Atmospheric Escape PR14](https://github.com/ewanqian/atmospheric-escape-liveset/pull/14)：已有制作分支，不自动合并或覆盖。
- [Performable Music PR56](https://github.com/ewanqian/performable-music/pull/56)：既有 Ableton-first 交接，仍为未合并草稿。本目录补充本次双机路由；原生工程保护、试听及重开验证沿用其原则。
- [PR58](https://github.com/ewanqian/performable-music/pull/58)：AMB研究记录；[PR59](https://github.com/ewanqian/performable-music/pull/59)训练、[PR60](https://github.com/ewanqian/performable-music/pull/60)书稿继续独立。
- Search40、旧神经元场景和旧固定BPM任务不作为此次自动领取项；已有运行成果保留，不擅自停止其他进程。CURRENT/早期被拒音频不重新当作已接受音乐。

## 回报与验收

使用 [RECEIPT.template.json](RECEIPT.template.json)，字段未知就保持 null，不能用示例填成实际数据。主任务 #57 只写摘要和交付链接；Windows具体执行证据留 #13／私有制作目录，再向 #57 返回链接，不复制整套任务正文。

本地 Agent 在有具体输出、阻塞或版本变化时回报：做了什么、用哪个源版本、文件在哪里、给另一端的下一项是什么。接口文件存在、任务已领取、离线回放通过、跨机实时通过是不同状态。

下一闭环：**Mac交一个冻结音乐包 → Windows确认接收 → Windows交一个带包版本的短片 → 艺术家判断声音和画面。**
