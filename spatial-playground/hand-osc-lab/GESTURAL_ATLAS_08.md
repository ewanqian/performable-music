# Gestural Atlas 08 — Two separate collections / 八种动作语法

**Public entrypoints after Pages deploy**
- **Music / 演奏型（独立页面）**: https://ewanqian.github.io/performable-music/spatial-playground/hand-osc-lab/atlas-music.html
- **Culture / 传统文化研究型（独立页面）**: https://ewanqian.github.io/performable-music/spatial-playground/hand-osc-lab/atlas-culture.html

Each page has **four selectable interactive studies**, per-mode how-to instructions, desktop/iPad pointer simulation, reuse of LAB02 Quest 25-joint XR tracking and 3D WebGL line overlays, optional locally synthesized audio, opt-in WSS→OSC, session JSON export and a 10k synthetic path test. No religious instruction, film footage, licensed music, images or recordings are embedded.

## Why two separate collections

Music instruments should be evaluated for **playability, physical comfort, phrase structure, timbral range and audio latency**.
Cultural interpretive studies should be evaluated for **accurate description of heritage references, clear distinction from cinematic invention, visual structure, gesture-semantic fit and accessible explanatory notes**.

Don't evaluate the historical source of a talisman using a synthesizer's FPS, or call a six-digit music sequence an authentic Daoist hand seal. Reusing sensing infrastructure does not imply a shared content category.

## A — Four MUSIC performance research modes

| Mode | Input grammar | Output / performed meaning | Test |
| --- | --- | --- | --- |
| 01 CONTINUUM | Thumb–index pinch as sustained GATE; fingertip X/Y as timbre/modulation | Continuous synth that stops on release; no keyboard | 20 pinch holds and safe release |
| 02 ORBIT | Two separate fingertips, distance, phase and relative rotation | Soundscape opening, pan and stereo motion | 30 sec bimanual stability and dropout recovery |
| 03 TRACE SCORE | Figure-eight sweep, fast line-segment collision with six fields | Alternating percussion/industrial/electronic or synthetic orchestral scenes | 15 figure-eight patterns with counted missed regions |
| 04 PHALANX SEQUENCER | Thumb to six phalanx contact locations + dwell / release | Six attack classes and an editable short phrase | 20 contacts per phalanx, compare repeats |

Audio uses the existing Web Audio `FieldSynth` and `OrganicAudio` modules; **do not call it a mastered performance-ready sound library**. For higher-quality music, author samples in Ableton/Surge XT and adapt the scene mapping; no copyrighted pack is imported here.

## B — Four CULTURAL / HONG KONG CINEMA research modes

### 05 剑诀 / 原创空间符形
- Reference distinction: the **sword-finger gesture** (two extended fingers, other fingers folded) has a documented history in Daoist manuals and traditional martial arts, while its on-screen use in **Hong Kong supernatural martial arts movies** is edited, stylized cinema.
- Input: XR verifies index and middle extended, ring/little curled, two fingertips relatively close, stable for 140 ms; releases after 100 ms out of pose. Desktop pointer is clearly labeled simulation.
- Output: cinematic **起势 → 结诀 → 运笔 → 收势**, generating an original 3D trace and electronic sonic seal. No copying or distributing actual sacred talisman diagrams or ritual chants.
- The explicit four-stage sequence here is a contemporary **cinematic interaction design**, not a historically verified fixed liturgical order.

### 06 河图／洛书 / 数字空间
- **洛书** 4-9-2 / 3-5-7 / 8-1-6. All 8 orthogonal and diagonal valid three-node lines sum to 15. Use tap or gaze-like fingertip dwell in a 3D grid.
- **河图** conventional paired values 1/6(水) 2/7(火) 3/8(木) 4/9(金) 5/10(土), with directional iconography. Two points activate a paired structure.
- Historically, the familiar black-white circle diagrams crystallized and were debated in **Song-era and later interpretive traditions**; don't claim they are literally unaltered ancient artifacts. The numeric systems have earlier precedents.

### 07 八卦 / 爻线构成器
- **阴爻 broken**, **阳爻 whole**. Add lines from bottom to top. The first three define a trigram; six constitute an upper/lower trigram pair with 64 combinatorial states.
- The displayed integer **1–64 is merely a binary index**, *not* the King Wen hexagram number, and no oracle meanings or fabricated historical hexagram quotations appear.
- Designed for legible 3D stacked-line studies and OSC-triggered composition structures, not fortune-telling.

### 08 北斗 / 七星导航
- Conventional seven star names: 天枢、天璇、天玑、天权、玉衡、开阳、摇光. Click or dwell successively, with route reset on wrong sequence.
- The **real Daoist `步罡踏斗`** is a diverse, embodied stepping/ritual system and may involve secret teacher-student transmission. This interface uses star identity and figure as a **graphic hand-navigation adaptation** — not an instruction for actual ritual footwork.

## Critical cinematic vocabulary: 《僵尸先生》 / 林正英

The most useful research reference is the **choreography of distinct actions and props**: a precise hand position, an object such as a paper charm or wooden sword, a connecting ink/string line, a constrained stage space, a definite ending pose, and an immediately perceptible result. The 1985 movie *Mr. Vampire* is famous for yellow paper talismans, peachwood swords, inked strings, sticky rice and choreographed supernatural containment, integrated with physical comedy. The real-world historical claims of film effects and occult efficacy must **never** be made. No performance requires blood, burning paper, flame, incense, sharp implements or disturbing props. This is a modern sound-and-visual instrument proposal.

Reference set:
- Hong Kong Film Archive, Lam Ching-ying bio (credits for Mr. Vampire 1985, Vampire vs. Vampire 1989, Mr. Vampire 1995): https://www.filmarchive.gov.hk/documents/18995340/19057017/LAM%2BChing-ying_c.pdf
- Research essay on genre's ritual props (The Paper): https://www.thepaper.cn/newsDetail_forward_1318086
- China Taoist Association, liturgical hand gestures and stepping distinctions: https://taoist.org.cn/getDjzsById.do?id=282
- Daoist Cultural Information Database, 掐诀 and hand joint traditions: https://zh.daoinfo.org/index.php?title=%E8%A8%A3&variant=zh-hans
- Palace Museum, 洛书图: https://www.dpm.org.cn/lemmas/239992.html
- Chinese Social Sciences Net, historiographic distinction of Hetu/Luoshu diagrams, 2025-07-24: https://www.cssn.cn/zx/zx_rdkx/202507/t20250724_5899244.shtml
- Chinese martial arts sword-finger formal posture (HK qualification source): https://hkucmaaa.org.hk/assets/exam-theory-handbook.pdf

Film lineage: use **original filmed stage movement** or artist-permitted reference materials for publication. Do not reuse movie stills, logo treatments or soundtrack without appropriate rights.

## Acceptance / how to test

1. Open Music and Culture pages separately; ensure menu interactions do not affect another page and old LAB02 sensor output remains unmodified.
2. Desktop / mouse / iPad: every mode must show instantly understandable instructions, a pointer response, visual feedback and an event log; none should require headset merely to demonstrate its rule.
3. Quest 3: verify WebXR grants hand tracking, sword pose is recognized after 140ms and releases safely, and **one hand** can operate CONTINUUM.
4. Quest 3: test two hands orbit. Distinguish actual tracked hands from desktop single pointer approximation.
5. Six-phalanx: deliberate hits 20 × 6, near misses 20 × 6, repeated digit and 25-joint tracking dropout tests.
6. Luo Shu all eight lines, Hetu all five pairs, Bagua all 64 states, Seven Stars ordered completion.
7. Output AUDIO RUNNING independently from OSC (browser audio); WSS→OSC must be explicitly connected & armed, messages allowlisted, numeric bounded, and disconnect neutral.
8. Five-minute sound and rendering endurance, separate browser JS frame-time estimates from compositor FPS and measured audio latency.
9. Export a semantic session JSON for every variant. Only after real recording review choose strongest **one music demo** and **one cultural demo** for finished works.

## Technical boundaries and next iteration

- **3D** refers to sparse WebGL lines/rings and depth coordinates in the same headset scene, not anchored physical room objects, particle-heavy meshes, volumetric ink, occlusion or detailed 3D talisman materials.
- Existing world-local coordinate assumptions need headset calibration and reposition UI; currently an unanchored front-of-user plane.
- Current film gesture uses simple reconstructed bend-angle threshold classification, not a calibrated ML pose model. Consider visual per-joint confidence/time hysteresis and a disambiguation matrix after real Quest tests.
- **No "actual spiritual effect"** claims. This is cultural interpretation plus original audiovisual interaction, not religious ceremony instruction.
- The next durable output should be two 45–90-second performances, one **musical** and one **cinematic/symbolic**, with separate paper/video documentation.
