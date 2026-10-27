# Shoulda Listened to Your Math Teacher

A 1990s arcade game. You're walking home. Every so often a car pulls up, the window rolls down, a gun comes out, and you get one SAT math question. Get it right and you keep walking. Get it wrong: **YOU LOOSE,** *shoulda listened to your math teacher.*

**Play:** open `index.html` in a browser (it works straight from the folder), or the GitHub Pages link for this repo.

## How it plays

| What happens | Result |
|---|---|
| A car pulls up | One multiple-choice SAT-style question, on a clock (30 seconds in round 1) |
| Right answer | 1000 points plus 100 for every second left, times your streak, times the round |
| 3, 6 or 10 right in a row | TEACHER'S PET: points x2, x3, x4 |
| Wrong answer, or the clock runs out | You get shot, then the chalkboard works the problem for you |
| Continue? | 10 seconds to press start; the last digit of your score counts your continues |
| Dawdle until TIME hits 0 | Another car comes, and TIME resets to 30 |
| Reach home | Stage clear: bonuses for right answers, time left and no misses, then the next round is harder |
| Game over | Your estimated SAT Math score, then the initials table if you made the top 10 |

Kick trash cans for items: a **TI-83** (X crosses out two wrong answers), **coffee** (the next clock runs at half speed), a **Kevlar Trapper Keeper** (stops one bullet) or cash.

**Parent Mode** (P on the title screen): water pistols and puddles instead of guns and blood.

## Controls

| Key | Does |
|---|---|
| 5 | Insert coin |
| 1 or Enter | Start |
| Arrows (or A D) | Walk; arrows move between answers |
| Z or Space | Kick, or pick the highlighted answer |
| A B C D, or 1 2 3 4 | Answer |
| X | Use a TI-83 |
| P | Parent Mode (title screen) |
| M | Mute |
| F | Full screen |
| Esc | Pause |

On a phone, an arcade panel appears under the screen and you tap the answers.

## The questions

The questions are original, written to the SAT's blueprint: Algebra, Advanced Math, Problem-Solving and Data Analysis, Geometry and Trigonometry. Real College Board questions are licensed for classroom use only, not for posting online. Each kind of question is a generator (`js/questions.js`, and `js/figures.js` for the ones with diagrams): fresh numbers every time, wrong answers built from the classic mistakes, numeric choices smallest first like the real test, and a worked solution for the chalkboard. Rounds 1 to 4 draw from harder pools.

Diagram questions draw their figure in pixel art: triangles, parallel lines, right-triangle trig, circles, boxes, similar triangles, graphed lines and parabolas, two-line systems, scatterplots, bar graphs and two-way tables.

## The art

Everything you see in the game was made in [PixelLab](https://www.pixellab.ai) through its API: the hero, the gunman (and his water-pistol twin for Parent Mode), the sedan and the taxi, the props and items, the night skyline, the next block over, and fourteen close-up storefronts at the hero's scale (liquor store, bodega, pizza place, video store, laundromat, barber, pawn shop, arcade, Chinese takeout, a graffiti-covered gate, brownstone stoops, home, a fenced lot, an alley). The street scrolls in layers: sky, the next block at 0.6 speed under a haze, then the storefronts.

```
python tools/pixellab.py balance              # generations left
python tools/pixellab.py stills n-pizza --takes 2
python tools/contact.py out/takes.png n-pizza
python tools/pixellab.py pick n-pizza <seed>
python tools/pixellab.py pack                 # rebuilds js/data/sprites.js
```

The key goes in `.secrets/pixellab-api-key.txt` (git-ignored) or `PIXELLAB_API_KEY`.

## Files

| Path | What |
|---|---|
| `js/core.js` | Screen size, helpers, controls, saved settings |
| `js/font.js` | The arcade font (drawn here) and big gradient title letters |
| `js/data/sprites.js` | Every sprite and the street, made in PixelLab, packed into one embedded atlas |
| `js/art.js` | Loads the atlas into sprites; also code-drawn stand-ins, used if the atlas is missing |
| `js/figures.js`, `js/questions.js` | The question generators |
| `js/sound.js` | Synthesized music, effects and the announcer |
| `js/world.js` | The street: sky, skyline, bridge, rooftops, storefronts, stoops, lots |
| `js/game.js` | Attract mode, play, the quiz, death, continue, stage clear, high scores |
| `tools/pixellab.py` | Makes the art in PixelLab (stills, animations, the hero's 4-direction character and template walk) and packs `js/data/sprites.js` |
| `tools/contact.py`, `tools/ruler.py` | Contact sheets of takes for picking, and rulers for reading crop lines |
| `art/takes`, `art/picked` | Every PixelLab take, and the ones the game uses; `art/calls.jsonl` logs each request |
| `tools/playtest.py` | Plays every screen in headless Chrome and saves screenshots to `out/` |
| `tools/publish.py` | Pushes to GitHub and turns on Pages |
| `ref/concept.webp` | The concept art |
