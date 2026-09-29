// Lawpy, Actuent's mascot, in the terminal: pixel art drawn with coloured half blocks, from the same
// sprite sheets as the website (api.actuent.ai/assets/lawpy). Generated from those sheets; see
// github.com/localilabs/actuent-sdk.
const FRAMES = {"idle":[[".....oooooo...","....oooooooo..","...oeeooeeoo..","..ooeeooeeoo..","oooooooooooooo","..oooooooooo..","..oooooooooo..","..oooooooooo..","..dddddddddd..","...oo....oo...","..ddd....ddd.."]],"blink":[[".....oooooo...","....oooooooo..","...ooooooooo..","..ooeeooeeoo..","oooooooooooooo","..oooooooooo..","..oooooooooo..","..oooooooooo..","..dddddddddd..","...oo....oo...","..ddd....ddd.."]],"wave":[[".....oooooo...","....oooooooo..","...oeeooeeoo..","..ooeeooeeoooo","oooooooooooooo","..oooooooooo..","..oooooooooo..","..oooooooooo..","..dddddddddd..","...oo....oo...","..ddd....ddd.."],[".....oooooo...","....oooooooo..","...oeeooeeoooo","..ooeeooeeoooo","ooooooooooooo.","..oooooooooo..","..oooooooooo..","..oooooooooo..","..dddddddddd..","...oo....oo...","..ddd....ddd.."],[".....oooooo...","....oooooooo..","...oeeooeeoo..","..ooeeooeeoooo","oooooooooooooo","..oooooooooo..","..oooooooooo..","..oooooooooo..","..dddddddddd..","...oo....oo...","..ddd....ddd.."],[".....oooooo...","....oooooooo..","...oeeooeeoooo","..ooeeooeeoooo","ooooooooooooo.","..oooooooooo..","..oooooooooo..","..oooooooooo..","..dddddddddd..","...oo....oo...","..ddd....ddd.."],[".....oooooo...","....oooooooo..","...oeeooeeoo..","..ooeeooeeoooo","oooooooooooooo","..oooooooooo..","..oooooooooo..","..oooooooooo..","..dddddddddd..","...oo....oo...","..ddd....ddd.."],[".....oooooo...","....oooooooo..","...oeeooeeoooo","..ooeeooeeoooo","ooooooooooooo.","..oooooooooo..","..oooooooooo..","..oooooooooo..","..dddddddddd..","...oo....oo...","..ddd....ddd.."]],"think":[[".....oooooo......","....oooooooo.....","...oeeooeeoo.....","..ooeeooeeoo.....","oooooooooooooo...","..oooooooooo.....","..oooooooooo.....","..oooooooooo.....","..dddddddddd.....","...oo....oo......","..ddd....ddd....."],[".....oooooo.e....","....oooooooo.....","...oeeooeeoo.....","..ooeeooeeoo.....","oooooooooooooo...","..oooooooooo.....","..oooooooooo.....","..oooooooooo.....","..dddddddddd.....","...oo....oo......","..ddd....ddd....."],[".....oooooo.e.e..","....oooooooo.....","...oeeooeeoo.....","..ooeeooeeoo.....","oooooooooooooo...","..oooooooooo.....","..oooooooooo.....","..oooooooooo.....","..dddddddddd.....","...oo....oo......","..ddd....ddd....."],[".....oooooo.e.e.e","....oooooooo.....","...oeeooeeoo.....","..ooeeooeeoo.....","oooooooooooooo...","..oooooooooo.....","..oooooooooo.....","..oooooooooo.....","..dddddddddd.....","...oo....oo......","..ddd....ddd....."],[".....oooooo.e.e.e","....oooooooo.....","...oeeooeeoo.....","..ooeeooeeoo.....","oooooooooooooo...","..oooooooooo.....","..oooooooooo.....","..oooooooooo.....","..dddddddddd.....","...oo....oo......","..ddd....ddd....."],[".....oooooo......","....oooooooo.....","...oeeooeeoo.....","..ooeeooeeoo.....","oooooooooooooo...","..oooooooooo.....","..oooooooooo.....","..oooooooooo.....","..dddddddddd.....","...oo....oo......","..ddd....ddd....."]],"dance":[["..................",".......oooooo.....","......oooooooo....",".....oeeooeeoo....","....ooeeooeeoo....","..oooooooooooooo..","....oooooooooo....","....oooooooooo....","....oooooooooo....","....dddddddddd....",".....oo....oo.....","....ddd....ddd...."],["..................","..................",".......oooooo.....","......oooooooo....",".....oeeooeeoo....","....ooeeooeeoo....","..oooooooooooooo..","..oooooooooooooo..","....oooooooooo....","....oooooooooo....","....dddddddddd....","....ddd....ddd...."],["..................",".........oooooo...","........oooooooo..",".......oeeooeeooo.","......ooeeooeeooo.","...oooooooooooooo.","...oooooooooooo...",".....oooooooooo...",".....oooooooooo...",".....dddddddddd...",".....oo....oo.....","....ddd....ddd...."],[".........oooooo...","........oooooooo..","...oo..o..oo..ooo.","...oo.ooeeooeeooo.","...oooooooooooooo.",".....oooooooooo...",".....oooooooooo...",".....oooooooooo...",".....dddddddddd...",".....oo....oo.....","....ddd....ddd....",".................."],["..................","..................",".......oooooo.....","......oooooooo....",".....oeeooeeoo....","....ooeeooeeoo....","..oooooooooooooo..","..oooooooooooooo..","....oooooooooo....","....oooooooooo....","....dddddddddd....","....ddd....ddd...."],["..................",".....oooooo.......","....oooooooo......",".oooeeooeeoo......",".oooeeooeeoo......",".oooooooooooooo...","...oooooooooooo...","...oooooooooo.....","...oooooooooo.....","...dddddddddd.....",".....oo....oo.....","....ddd....ddd...."],[".....oooooo.......","....oooooooo......",".ooo..oo..oo.oo...",".oooeeooeeoo.oo...",".oooooooooooooo...","...oooooooooo.....","...oooooooooo.....","...oooooooooo.....","...ddddddddddddd..",".....oo...........","....ddd...........",".................."],["..................","..................",".......oooooo.....","......oooooooo....",".....oeeooeeoo....","..ooooeeooeeoooo..","..oooooooooooooo..","....oooooooooo....","....oooooooooo....","....oooooooooo....","....dddddddddd....","....ddd....ddd...."],["..................","........oooooo....",".......oooooooo...","......oeeooeeoo...","...ooooeeooeeoooo.","...oooooooooooooo.",".....oooooooooo...",".....oooooooooo...",".....oooooooooo...","..ddddddddddddd...","...........oo.....","...........ddd...."],[".......oooooo.....","......oooooooo....","..oo.o..oo..oooo..","..ooooeeooeeoooo..","..oooooooooooooo..","....oooooooooo....","....oooooooooo....","....oooooooooo....","....dddddddddd....",".....oo....oo.....","....ddd....ddd....",".................."],["..................","......oooooo......",".....oooooooo.....","....oeeooeeoo.....",".ooooeeooeeoooo...",".oooooooooooooo...","...oooooooooo.....","...oooooooooo.....","...oooooooooo.....","...ddddddddddddd..",".....oo...........","....ddd..........."],["..................","..................","........oooooo....",".......oooooooo...","......oeeooeeoo...",".....ooeeooeeoo...","..oooooooooooooo..","..oooooooooooooo..","....oooooooooo....","....oooooooooo....","....dddddddddd....","....ddd....ddd...."]]}

// Colours: o = body, d = shade, e = eyes; "." is empty.
const RGB = { o: [199, 124, 54], d: [169, 101, 31], e: [43, 22, 8] }
const C256 = { o: 173, d: 130, e: 52 }
const FPS = { wave: 7, think: 4, dance: 10, idle: 1, blink: 1 }

// Colours only in a real terminal, never in CI or logs, and never with NO_COLOR set.
function canDraw(stream) {
  const env = (typeof process !== "undefined" && process.env) || {}
  return !!(stream && stream.isTTY) && !env.NO_COLOR && !env.CI && env.TERM !== "dumb" && env.ACTUENT_NO_LAWPY !== "1"
}

function colour(c, bg) {
  const env = process.env
  if (/truecolor|24bit/i.test(env.COLORTERM || "")) { const [r, g, b] = RGB[c]; return `\x1b[${bg ? 48 : 38};2;${r};${g};${b}m` }
  return `\x1b[${bg ? 48 : 38};5;${C256[c]}m`
}

// One frame as terminal lines: each character is two pixels stacked (▀ with foreground and background).
function frameLines(state, i) {
  const rows = (FRAMES[state] || FRAMES.idle)[i % (FRAMES[state] || FRAMES.idle).length]
  const w = Math.max(...Object.values(FRAMES).map(f => f[0][0].length))
  const out = []
  for (let y = 0; y < rows.length; y += 2) {
    let line = ""
    for (let x = 0; x < w; x++) {
      const top = (rows[y] || "")[x] || ".", bottom = (rows[y + 1] || "")[x] || "."
      if (top === "." && bottom === ".") line += " "
      else if (bottom === ".") line += colour(top) + "▀\x1b[0m"
      else if (top === ".") line += colour(bottom) + "▄\x1b[0m"
      else line += colour(top) + colour(bottom, true) + "▀\x1b[0m"
    }
    out.push(line)
  }
  // Frames are drawn from the bottom up, so shorter sheets line up with the 12-pixel dance.
  while (out.length < 6) out.unshift(" ".repeat(w))
  return out
}

function withText(art, text) {
  const lines = [...art]
  const start = Math.max(0, Math.floor((lines.length - text.length) / 2))
  return lines.map((l, i) => text[i - start] != null ? `${l}   ${text[i - start]}` : l)
}

/** Lawpy with some text beside him, once (no animation). Plain text when colours aren't possible. */
function lawpySay(state, text, stream = process.stdout) {
  const lines = Array.isArray(text) ? text : [text]
  if (!canDraw(stream)) { stream.write(lines.join("\n") + "\n"); return }
  stream.write(withText(frameLines(state, 0), lines).join("\n") + "\n")
}

/** Lawpy animating (wave, think, dance) with text beside him, then resting on his last frame. */
async function lawpyAnimate(state, text, loops = 2, stream = process.stdout) {
  const lines = Array.isArray(text) ? text : [text]
  if (!canDraw(stream)) { stream.write(lines.join("\n") + "\n"); return }
  const frames = (FRAMES[state] || FRAMES.idle).length
  const total = Math.max(1, frames * loops)
  let height = 0
  stream.write("\x1b[?25l") // hide the cursor while he moves
  try {
    for (let i = 0; i < total; i++) {
      if (height) stream.write(`\x1b[${height}A`)
      const out = withText(frameLines(state, i), lines)
      stream.write(out.map(l => l + "\x1b[K").join("\n") + "\n")
      height = out.length
      await new Promise(r => setTimeout(r, 1000 / (FPS[state] || 6)))
    }
    stream.write(`\x1b[${height}A` + withText(frameLines(state === "dance" || state === "wave" ? "idle" : state, 0), lines).map(l => l + "\x1b[K").join("\n") + "\n")
  } finally { stream.write("\x1b[?25h") }
}

export { lawpySay, lawpyAnimate, canDraw }
