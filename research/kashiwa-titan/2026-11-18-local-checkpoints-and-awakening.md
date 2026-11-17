# TITAN · 本地观察与复苏制作

2026-11-18，Asia/Shanghai。

## FACT · 信号测量

本机找到并核对7首TITAN的艺术家、专辑与曲序标签。已分析Lead、Green、Haze、Infrared、Rose、Titan、White Night，当前核对目录缺HIIO。源录音留在本机。

音频解码为16kHz单声道，STFT窗口2048点、步长512点。25–120Hz、120–2500Hz、2500–7800Hz分带能量按1秒汇总为dB值。候选位置比较前后各6秒的平均dB值，中心前后各留2秒。每曲保留至多8个变化峰，最小间距24秒。完整派生记录见同目录 `measurements/2026-11-18-local-band-checkpoints.json`。

| 作品／检查点 | 25–120Hz变化 | 120–2500Hz变化 | 2500–7800Hz变化 |
| --- | ---: | ---: | ---: |
| Lead · 1:28 | −0.42dB | −0.17dB | −10.46dB |
| Lead · 2:09 | −2.58dB | +0.17dB | +9.87dB |
| Lead · 5:54 | −17.86dB | +1.31dB | −0.14dB |
| Haze · 0:46 | +24.78dB | +14.48dB | +9.76dB |
| Haze · 3:14 | +25.64dB | +4.94dB | +12.70dB |
| Haze · 3:54 | +8.01dB | +0.57dB | −2.01dB |
| Titan · 1:53 | +0.70dB | +6.04dB | +1.68dB |
| Titan · 2:25 | +0.53dB | +4.65dB | +1.49dB |
| Titan · 3:29 | +0.56dB | +4.86dB | +2.09dB |
| Titan · 4:05 | +8.40dB | +0.51dB | +1.52dB |
| White Night · 2:49 | −25.83dB | −16.18dB | −45.99dB |
| White Night · 3:15 | +20.58dB | −1.46dB | +6.13dB |

这些位置供后续带着问题试听。大幅相对变化可能由前窗接近安静造成。单声道折叠、8kHz以上频段缺失、频带宽度及对数平均均影响数值。当前记录未进行人工逐点听觉标注，无法据此确定乐器、段落边界或作品价值。

## INFERENCE · 需要验证的组织方法

Lead的1:28与2:09、Titan的1:53与4:05提供了不同频带变化幅度不一致的检查点。可研究一个声部如何保持，另一频段怎样改变其处境。对复苏可提出单一变量的练习，保留低频身份，只改变声体粗糙度，或保留独奏，只让远处余音进入与消失。

Haze与White Night的候选位置则可研究声音尺度改变前后的保留层、空白与延迟。实际持续多久仍需聆听，测量时间码不成为本曲的编排模板。

## EXPERIMENT · 本轮原创应用

M3回返先完成120秒原创编程钢琴，提供裸声与电子对照。前49.5秒完整保留同一次裸钢琴。电子从自己的钢琴尾音、原复苏Scribble及Glitch音色产生。完整乐句保持Warp Off，电子尾音另做Hold/Release。实际原生导出、分轨求和与控制状态已核对，音乐采用待艺术家试听。

随后M0重量练习从复苏Sub Stack渲染中的一个B0事件取材，展开为150秒少量触击、持续低频和声体。低频与派生泛音分轨，可连续调整粗糙声体。参考作品录音未进入这两份原创音频。M0原生重开与导出复验暂受桌面访问错误影响，记录为待验证。

采样操作采用尾音扩展、长颗粒、反向和切片。LivePilot sample-engine作为方法参考，实际DSP使用本机librosa、SciPy、NumPy和既有Ableton接口。[LivePilot方法](https://github.com/dreamrec/LivePilot/blob/main/livepilot/skills/livepilot-sample-engine/SKILL.md)

## 独奏参考

TITAN官方署名列出Hiromi Kurosaki负责Lead、Haze、Infrared、Rose的钢琴及演奏编配，KASHIWA Daisuke负责全曲制作、混音和母带。本轮编程钢琴与该演奏来源分别记载，后续可依艺术家试听决定是否需要实录合作。[官方署名](https://kashiwadaisuke.com/release/titan/)

Summvs官方资料包含两版By This River，原作者为Brian Eno、Dieter Moebius、Hans-Joachim Roedelius。本轮研究独奏与电子环境的关系，M3使用原创乐句。[NOTON发行页](https://noton.info/product/n-055/?attribute_pa_format=cd)
