# Show Score protocol

一套事件同时驱动声音、视觉和灯光。这里只定义数据与时间，不定义作品。

## 为什么有 v2

v1 只有 `t_ms`。结果两条工作线各自维护时钟：

- ENTROPY 的 live set 是 100 BPM
- `conductor.py` 用的是 `BAR = 60/128*4`（128 BPM）
- v1 schema 里没有 `bpm` / `bar` / `beat` 字段

同一份 Score 在两边的“第一小节”不是同一个时刻。这不是参数问题，是协议缺字段。

v2 把音乐位置变成一等字段：

```json
"clock": {
  "bpm": 100, "beats_per_bar": 4, "beat_unit": 4, "steps_per_beat": 4,
  "bar": 1, "beat": 2, "step": 1, "phase": 0, "origin_ms": 0
}
```

`t_ms` 仍然是权威时间。`clock` 是由 `t_ms` 推导出来的音乐位置，任何接收方都能用同一套公式复算，不需要互相猜 BPM。

## 文件

| 文件 | 作用 |
|---|---|
| `show-score-v2.schema.json` | JSON Schema，权威结构 |
| `show-score.mjs` | 参考实现：`TransportClock`、`makeScoreEvent`、`validateScoreEvent` |
| `show-score-v2.example.json` | 一条真实生成的示例事件 |
| `show-score.test.mjs` | 9 项测试 |

## 用法

```js
import { TransportClock, makeScoreEvent, validateScoreEvent } from './show-score.mjs'

const clock = new TransportClock({ bpm: 100, beatsPerBar: 4, stepsPerBeat: 4 })

const event = makeScoreEvent(clock, {
  t_ms: now,
  seq: n++,
  scene: 'OVERRIDE',
  state: 'PEAK',
  event: { type: 'HAND_ENTER', source: 'hand', hand: 'right', intensity: 0.82 },
  safe: { armed: true, kill: false }
})

if (!validateScoreEvent(event).ok) return
```

变速时不要手动改 BPM，用 `clock.withTempo(128, atMs)`，它会保留已经走过的音乐位置。

## 约定

- `bar` / `beat` / `step` 从 0 开始
- `phase` 是当前步内的 0–1 进度，用于视觉插值，不用于触发
- `steps_per_beat` 默认 4，即 16 分音符网格
- 标签页挂起后补发事件有上限（默认 256 步），避免雪崩
- `safe.kill` 为真时，接收方必须立即静音，不等待其他字段

## 没做的

没有做 OSC 编码映射，也没有和任何具体 DAW / 灯光控制台联调。v2 只保证“同一事件在两个接收方算出同一个 bar/beat”。
