setcpm(100/4)

const idle = silence

const seed = note("<c4 ~ e4 ~>")
  .s("piano")
  .gain(.45)
  .room(.25)

const build = stack(
  note("c4 e4 g4 b4")
    .s("piano")
    .slow(2)
    .gain(.48)
    .room(.35),
  note("c3 ~ g2 ~")
    .s("sawtooth")
    .lpf(650)
    .gain(.16)
)

const hold = stack(
  note("<c4 e4 g4 b4>")
    .s("piano")
    .slow(4)
    .gain(.5)
    .room(.55),
  note("c3")
    .s("sawtooth")
    .lpf(420)
    .gain(.13)
)

const peak = stack(
  note("c4 [e4 g4] b4 [g4 e4]")
    .s("piano")
    .gain(.58)
    .room(.55),
  note("c2 ~ g2 ~")
    .s("sawtooth")
    .lpf(1000)
    .gain(.22),
  s("bd ~ bd ~, hh*8")
    .gain(.16)
)

const release = note("<c5 g4 e4 c4>")
  .s("piano")
  .slow(4)
  .gain(.38)
  .room(.8)

arrange(
  [2, idle],
  [4, seed],
  [8, build],
  [6, hold],
  [4, peak],
  [6, release]
)
