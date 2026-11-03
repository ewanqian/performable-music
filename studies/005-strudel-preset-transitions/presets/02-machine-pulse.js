setcpm(124/4)

const idle = silence

const seed = stack(
  s("bd ~ ~ ~").gain(.55),
  note("c2 ~ ~ ~").s("sawtooth").lpf(420).gain(.14)
)

const build = stack(
  s("bd(5,8)").gain(.6),
  s("hh*8").gain(.12),
  note("c2 <eb2 g2>")
    .s("sawtooth")
    .lpf("<500 750 1100 700>")
    .gain(.18)
)

const hold = stack(
  s("bd(5,8), rim(3,8)").gain(.5),
  s("hh*8").gain(.1),
  note("<c2 eb2>")
    .s("sawtooth")
    .lpf(620)
    .gain(.17)
)

const peak = stack(
  s("bd(7,8), rim(5,8), hh*16").gain(.5),
  note("c2 eb2 g2 bb2")
    .s("sawtooth")
    .lpf("<700 1100 1800 900>")
    .gain(.2)
    .jux(rev)
)

const release = stack(
  s("bd ~ ~ ~").gain(.38),
  note("<g2 eb2 c2>")
    .s("triangle")
    .slow(2)
    .lpf(650)
    .room(.4)
    .gain(.16)
)

arrange(
  [2, idle],
  [4, seed],
  [8, build],
  [8, hold],
  [6, peak],
  [6, release]
)
