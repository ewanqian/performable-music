setcpm(120/4)

const idle = silence

const seed = stack(
  s("bd*4").gain(.36),
  s("rim(3,8)").gain(.18)
)

const build = stack(
  s("bd*4").gain(.42),
  s("rim(5,8)").gain(.22),
  note("c4 eb4 g4")
    .s("triangle")
    .slow(3)
    .gain(.17)
    .room(.3)
)

const hold = stack(
  s("bd*4").gain(.36),
  s("rim(5,8)").gain(.2),
  s("hh(7,8)").gain(.08),
  note("<c4 g3 eb4>")
    .s("triangle")
    .slow(3)
    .gain(.16)
)

const peak = stack(
  s("bd*4").gain(.45),
  s("rim(5,8)").gain(.25),
  s("hh(7,8)").gain(.1),
  note("c4 eb4 g4 bb4")
    .s("triangle")
    .slow(3)
    .gain(.2)
    .jux(rev)
    .room(.45)
)

const release = stack(
  s("bd ~ ~ ~").gain(.26),
  note("<bb4 g4 eb4 c4>")
    .s("triangle")
    .slow(4)
    .gain(.16)
    .room(.7)
)

arrange(
  [2, idle],
  [4, seed],
  [8, build],
  [8, hold],
  [8, peak],
  [6, release]
)
