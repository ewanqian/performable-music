# R5 — 柏大辅专章、图像与版本审读

日期：2026-11-17。新增正文：`manuscript/08-kashiwa.md`。参考基线：`a299277bda3752361dffd0427f904202845de86c`。

## 已完成

第08章已写成连续的人物与制作经验章。主线是乐队经验进入电脑、长篇与电影、原声合奏、混音/母带职业、Ice/TITAN的不同方向，以及Orochi的即兴素材重组。16条具名脚注直接对应广播、原始访谈、艺术家或厂牌发行与制作署名。

本地交付另有单章HTML与整合阅读HTML，提供两幅原创图解、章内官方试听链接和按需载入的视频。这里存档的Markdown只保留连续正文与脚注，不带本地HTML生成器的图解指令；不要将根目录现有构建器误认成本轮阅读页的相同版本。

## 事实校正

- RADIO SAKAMOTO：2005-09-04歌单试听征选M-17列《travelaroundstars》。这是作品播放，不是本人做客、获奖、师承或现场演出。https://www.j-wave.co.jp/original/radiosakamoto/songlist/050904.htm
- 《言叶之庭》：电影音乐署名KASHIWA Daisuke；《Rain》词曲大江千里、编曲皆川真人、演唱秦基博。https://www.sonymusic.co.jp/artist/hatamotohiro/info/419691
- yodaka：2016为唱片发行年，不等于乐队成立年；录音/混音/母带署名Takeshi Hamada。https://fleursy.com/riccolabel/discography/ric029_english.html
- Studio FLAT：收费混音/母带服务与作品履历可确认，不推算个人收入或业务占比。SEVEN IDIOTS的流程叙述为工作室刊载的客户评价，不当成独立测评。https://kashiwadaisuke.com/studio/
- TITAN：2024-10-04先行、10-19一般发行；Hiromi Kurosaki有明确钢琴及演奏编排署名。“生长”比喻不是AI或特定生成算法的使用证据。https://kashiwadaisuke.com/2024/10/19/titan-kashiwa-daisuke-11th-new-album/
- Orochi：2025-12-24，Hoshiko Yamane即兴构想由柏拆解、重组、混音与改编。不能将TITAN笼统称为其最新作品。https://kashiwadaisuke.bandcamp.com/album/orochi
- 未核实汉字的合作者姓名保留发行署名罗马字；历史设备陈述限定在访谈当年，不冒充2026配置。

## 图像交付范围

两张照片已在本地整合阅读HTML正文内使用img插入，并附作者、作品、年代、许可与来源。没有获得照片二进制，故需读者网络访问Wikimedia；不能宣称图片已离线打包。

1. Joi Ito，坂本龙一资料肖像，2007，CC BY 2.0。不是IS YOUR TIME现场照片。https://commons.wikimedia.org/wiki/File:Ryuichi_Sakamoto.jpg
2. Zan Wimberley摄，Carriageworks发布，test pattern [no.5]，2013，CC BY-SA 3.0。不是datamatics图片。https://commons.wikimedia.org/wiki/File:Ryoji_Ikeda.jpg

许可分别见 https://creativecommons.org/licenses/by/2.0/ 与 https://creativecommons.org/licenses/by-sa/3.0/ 。未裁切、未改色，仅响应式显示；图像许可不自动适用于整本书正文。柏大辅宣传照和专辑封面未查到可再分发的明确许可，没有复制。

## 版本冲突：暂不覆盖

已审阅的交付附件R4与当前远端R4不同：附件使用前言《音乐尚未决定的地方》并含18章；远端使用《音乐从哪里开始》并含20章。两者的01/02/09正文也并非逐字节相同。

本轮阅读交付以获认可的附件为基线，保留其前言不变。远端00/01/02/09/20、book.json与build.py均不被本轮新增操作覆盖。第08章已在本分支独立存档，整合版HTML和扩展构建器在本轮附件源稿包中。原远端基线由上面的固定提交保留。下一次合并必须先比较两份正文；不能只用版本号R4判断同一性。

## 未完成事项必须保留

- 全书不是定稿。本轮阅读页为前言与01/02/08/09/18五章；远端20章并行稿仍保留，其余18章尚未写成正文。
- 未取得原作音轨并完成逐秒听赏。关于主题、记忆、回返的讨论是作曲分析，不是已经测量出的stella/sons结构图或原作者工程参数。
- 18与20章中的NONOTAK、共享事件、TouchDesigner段落需要分工并去重。
- 制作课程未形成完整、经过本机Live重开验证的工程包。
- 图片离线交付、第三方播放器地域可用性和独立读者试读没有通过验收。
- 本轮审读由同一个助手完成，不冒称多位专家或子Agent会审。

## 最后审读重点

电影合作是否讲清为别人作品制作的取舍；Studio FLAT是否把职业劳动写进创作而不变成收费宣传；Ice、TITAN、Orochi是否呈现了具体改变而不是风格标签罗列。人物线已可审读，作品细读仍是最重要的深度缺口。

不合并主分支，不部署网站，不修改演出工程、XR代码或其他制作任务。
