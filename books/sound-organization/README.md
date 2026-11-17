# 声音的组织：从聆听到实时演奏

**艺术家的创作经验与 Ableton Live 实践**

独立书稿目录。主书、制作课程、工具查阅与编务分开；不改动本仓库的演出工程、XR运行时或既有课程。

## R4 阅读

- [前言｜音乐从哪里开始](manuscript/00-preface.md)
- [01 从一场演出开始](manuscript/01-performance.md)
- [02 池田亮司：机器与身体之间](manuscript/02-ikeda.md)
- [09 Robert Henke：为作品发明工具](manuscript/09-henke.md)
- [20 黑川良一：同时作曲的声音与影像](manuscript/20-kurokawa.md)，含NONOTAK制作对照。
- [全书六组目录与阅读路线](book.json)
- [已确认的R2基线](archive/R2.md)

本版为前言与四章正文稿。其他20章仍是目录；四组制作课程仍在设计中，没有把尚未制作的Live/TouchDesigner工程标成已完成。

## 网页构建

在本目录运行 `python build.py`，生成离线可读的 `site/index.html`。正文、注释与地图在同一个HTML中；外部录像仅主动点击后载入，不自动播放。无需Node、外部字体或在线Markdown服务。

Markdown是正文正本，生成页面不单独编辑。点击脚注会展开注释；本章段落和全书阅读路线可以返回对应位置。实际外部播放器与地区可用性不属于本轮验证结果。

## 编务与来源

- `AGENTS.md`：编辑约定。
- `book.json`：六组24章、前言、路线、媒体和真实进度。
- `references/sources.json`：R3来源底稿，保留。
- `references/sources-r4.json`：本轮来源与阅读范围。
- `references/image-rights.json`：图像许可及采用状态；本轮没有嵌入未审看的候选图。
- `editorial/ledger.md`：版本历史。
- `editorial/R4-review.md`：本轮叙述、事实、技术与图像检查。不是独立专家评审。
- `editorial/realtime-curriculum.md`：Live×TouchDesigner课程设计，尚未实机制作。

公共书稿不默认读者有特定职业、工程、设备或个人演出截止。具体操作课与版本说明另行维护。

版权与署名在正式出版前另行确定。本目录不授予艺术家作品、外部链接或图像的额外许可；不上传私人通信、授权采样包、艺术家音轨或未获许可图片。保持专用书稿分支与草稿PR，未合并、未公开部署。
