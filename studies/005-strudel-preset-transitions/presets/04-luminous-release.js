setcpm(148/4)

const idle = silence

const seed = note("<a3 e4 a4 ~>")
  .s("piano")
  .gain(.4)
  .room(.3)

const build = stack(
  note("a3 cs4 e4 a4")
    .s("piano")
    .gain(.45)
    .room(.35),
  note("a2 ~ e3 ~")
    .s("triangle")
    .lpf(900)
    .gain(.13),
  s("bd ~ bd ~, hh*8").gain(.12)
)

const hold = stack(
  note("<a4 e4 cs4 e4>")
    .s("piano")
    .gain(.44)
    .room(.48),
  note("a2 e3")
    .s("triangle")
    .slow(2)
    .lpf(850)
    .gain(.12)
)

const peak = stack(
  note("a4 cs5 e5 a5 e5 cs5")
    .s("piano")
    .gain(.52)
    .room(.5)
    .jux(rev),
  note("a2 e3 fs3 cs3")
    .s("sawtooth")
    .lpf("<900 1400 2100 1200>")
    .gain(.17),
  s("bd*4, hh*16, cp ~ cp ~").gain(.14)
)

const release = note("<a5 e5 cs5 a4>")
  .s("piano")
  .slow(4)
  .gain(.34)
  .room(.9)

arrange(
  [2, idle],
  [4, seed],
  [8, build],
  [6, hold],
  [6, peak],
  [8, release]
)
