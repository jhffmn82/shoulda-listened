# Shoulda Listened to Your Math Teacher

A 1990s arcade game. You're walking home. Every so often a car pulls up, the window rolls down, a gun comes out, and you get one math question, at the grade you picked: kindergarten through 8th grade, high school, or SAT prep. Get it right and you keep walking. Get it wrong: **YOU LOSE,** *shoulda listened to your math teacher.*

**Play:** open `index.html` in a browser (it works straight from the folder), the GitHub Pages link for this repo, or [on itch.io](https://jhffmn82.itch.io/shoulda-listened).

## How it plays

| What happens | Result |
|---|---|
| Start | Pick your grade: K, 1st to 8th, HS or SAT. The game remembers it |
| A car pulls up | One multiple-choice question for your grade, on a clock (75 seconds in kindergarten down to 30 for SAT prep, in round 1; shorter each round) |
| Right answer | 1000 points plus 100 for every second left, times your streak, times the round |
| 3, 6 or 10 right in a row | TEACHER'S PET: points x2, x3, x4 |
| Wrong answer, or the clock runs out | You get shot, then the chalkboard works the problem for you |
| Continue? | 10 seconds to press start; the last digit of your score counts your continues |
| Dawdle until TIME hits 0 | Another car comes, and TIME resets to 30 |
| Reach home | Stage clear: bonuses for right answers, time left and no misses, then the next round is harder |
| Game over | SAT prep: your estimated SAT Math score. Every other grade: a report card, A+ to F. Then the initials table if you made the top 10 |

Kick trash cans for items: a **TI-83** (press X in a quiz and two wrong answers get crossed out), **coffee** (the next quiz clock runs at half speed), a **Kevlar Trapper Keeper** (stops one bullet; you still got the question wrong) or cash. Each power-up turns up at most once per lap of the block, and you carry one of each at most (a spare is worth 1000 points). A card says what each one does when you pick it up, the tray at the bottom left shows what you're carrying, and the quiz panel lists the ones in play.

**Parent Mode** (P on the title screen): water pistols and puddles instead of guns and blood.

## The voices

Everyone talks, in ElevenLabs voices: the announcer (Patrick) calls the stages, right and wrong answers, Teacher's Pet, the continue countdown and the items; the gunman (Harry) has a line for pulling up, letting you go, shooting you, and finding out about the Trapper Keeper; the hero (Liam) has grunts, a scream for the rat and what he forgot at school; Mr. Delgado (Thomas) goes over the problem and reads your SAT score or your report card (in kindergarten to 2nd grade he reads the whole chalkboard, in the browser's voice). The announcer also calls the grade picker and the grade you pick. About 120 lines, crunched to 8 bits at 16 kHz like a 1994 sound board, on one speech channel that ducks the music.

```
python tools/voices.py audition     # the same lines in several voices, out/voices.html
python tools/voices.py lines        # records SCRIPT in the CAST's voices (cached in art/voice/cache)
python tools/voices.py pack         # rebuilds js/data/voices.js
```

The key goes in `.secrets/elevenlabs-api-key.txt` (git-ignored) or `ELEVENLABS_API_KEY`. The tools need `numpy` and `lameenc`.

## Controls

| Key | Does |
|---|---|
| 5 | Insert coin |
| 1 or Enter | Start |
| Arrows (or A D) | Walk; arrows move between answers |
| Z or Space | Kick, or pick the highlighted answer |
| A B C D, or 1 2 3 4 | Answer |
| X | Use a TI-83 |
| P | Parent Mode (title screen or grade picker) |
| R | Read the question aloud again (K to 2nd grade) |
| M | Mute, until the page is closed (the next visit starts with sound on) |
| F | Full screen |
| Esc | Options: sound, Parent Mode, full screen and this list of controls; during a game it pauses. The gear in the top-right corner of the screen opens it too |

The keys are listed on the Options screen, not under the game; click or tap the gear in the top-right corner to get there. On a phone or tablet, an arcade panel appears: ◀ ▶ walk, A kicks and picks, B uses a TI-83, and COIN, START, SOUND (mute), MENU (the Options screen, and pause) and, for K to 2nd grade, READ (hear the question again). Tap an answer to pick it, tap the question to hear it again, and tap through the screens between. Held upright, the panel sits under the game; turned sideways, its two halves stand either side of it.

## The questions

Pick a grade before you play. Every grade is a bank of question generators: fresh numbers every time, wrong answers built from the mistakes kids at that grade really make, and a worked solution for the chalkboard. Each grade covers its Common Core standards, then what classes actually do beyond them, with IXL's skill plans for that grade (which mix in state standards) as the checklist. Every question is written for this game; none is copied from IXL or the College Board, whose real SAT questions are licensed for classroom use only.

| Grade | Kinds | What's in it |
|---|---|---|
| Kindergarten | 38 | Counting pictures and ten frames, comparing, adding and taking away, shapes, patterns, sorting, coins, measuring with cubes |
| 1st | 51 | Facts to 20, tens and ones, true equations, clocks to the half hour, coins, calendars, graphs, halves and fourths |
| 2nd | 87 | Adding and subtracting to 1,000, base-ten blocks, clocks to 5 minutes, coins and bills, rulers, graphs, shapes, fractions; rounding, making change, calendars, thermometers, patterns, chance, symmetry, Roman numerals |
| 3rd | 53 | Times tables and division, fractions, area and perimeter, elapsed time, money and budgets, probability, transformations |
| 4th | 58 | Multi-digit arithmetic, factors and primes, fraction and decimal operations, angles and protractors, symmetry, data, coordinates |
| 5th | 57 | Decimals, fraction operations, volume, the coordinate plane, prime factors, exponents, integers, percents, ratios |
| 6th | 49 | Ratios and rates, dividing fractions, integers, expressions and equations, area and volume, statistics, Venn logic |
| 7th | 50 | Proportions, percent change and consumer math, rational numbers, equations and inequalities, angles, circles, probability and counting |
| 8th | 46 | Irrational numbers, exponents and scientific notation, slope, systems, functions, transformations, Pythagoras, volume, sequences, polynomials |
| High school | 84 | Algebra 1, Geometry and Algebra 2: factoring, quadratics, functions, logs, trig and the unit circle, proofs and constructions, circles, statistics and probability |
| SAT prep | 63 | The SAT's blueprint: algebra, advanced math, problem-solving and data analysis, geometry and trig |

The young grades lean on pictures drawn in pixel art: counting pictures, ten frames, base-ten blocks, clocks, coins, rulers, number lines, arrays, picture and bar graphs, shapes and fractions. Kindergarten to 2nd grade read every question aloud (R reads it again), and after a wrong answer Mr. Delgado reads the chalkboard out too: what you said, each step, and the answer. Those words are made fresh with every question, so in these grades he speaks in the browser's own voice throughout, on the chalkboard and the report card, rather than switching from his recording partway. Question kinds are dealt like a deck of cards: every kind comes up once before any comes up twice, and the deck carries over from game to game, with topics spread out so you don't get three money questions in a row. Nearly every kind is in the deck from the first lap; only the stretch kinds wait for the second. The right answer lands in a random slot.

```
python tools/qtest.py                 # self-test every generator in every grade: right answer, 4 distinct choices, drawable, fits
python tools/qtest.py 2 --sheet       # out/qtest/2-N.png: every 2nd-grade quiz panel as the game draws it
python tools/qtest.py 2 --sheet --board
```

## The art

Everything you see in the game was made in [PixelLab](https://www.pixellab.ai) through its API: the hero, the gunman (and his water-pistol twin for Parent Mode), the sedan and the taxi, the props and items, the night skyline, the next block over, and fourteen close-up storefronts at the hero's scale (liquor store, bodega, pizza place, video store, laundromat, barber, pawn shop, arcade, Chinese takeout, a graffiti-covered gate, brownstone stoops, home, a fenced lot, an alley), and a street tree. The street scrolls in layers: sky, the next block at 0.6 speed under a haze, then the storefronts, with trees on about half the joins between them.

PixelLab drew each storefront in a strip of street, with slivers of the buildings next door, and its background removal cut out wall pixels that matched its background colour. So `pack` rebuilds every storefront (`facade` in `tools/pixellab.py`, set up per building in `NEAR`): it crops to the building itself, lays the art over a wall drawn for it (running-bond brick, or brownstone blocks), turns each hole in the wall into a brick or mortar, fills a roll-down gate with slats, and adds a cornice along the roofline and a dark seam down each side. Every storefront is a solid rectangle from its roof to the sidewalk, and they butt together cleanly. The empty lot is the exception: its painted sky is cut out, so you see the next block through the fence.

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
| `js/data/voices.js` | Every spoken line, as embedded 8-bit MP3s |
| `js/art.js` | Loads the atlas into sprites; also code-drawn stand-ins, used if the atlas is missing |
| `js/questions.js` | The grade registry, the SAT prep generators, and the self-test |
| `js/figures.js` | The SAT diagram questions, and the pixel drawing kit every grade's figures use |
| `js/grades/` | Every other grade's generators: `k2.js` (K to 2nd), `g35.js` (3rd to 5th), `g68.js` (6th to 8th), `hs.js` (high school), `sat.js` (more SAT prep) |
| `js/quiz.js` | The quiz panel and the chalkboard: layout, answer wrapping, drawing, and the fit check |
| `js/sound.js` | Synthesized music and effects, and the voice channel |
| `js/world.js` | The street: sky, skyline, bridge, rooftops, storefronts, stoops, lots |
| `js/game.js` | Attract mode, play, the quiz, death, continue, stage clear, high scores |
| `tools/pixellab.py` | Makes the art in PixelLab (stills, animations, the hero's 4-direction character and template walk) and packs `js/data/sprites.js` |
| `tools/voices.py` | Auditions voices, records the script in ElevenLabs, and packs `js/data/voices.js` |
| `art/voice/calls.jsonl` | Every ElevenLabs request |
| `tools/contact.py`, `tools/ruler.py` | Contact sheets of takes for picking, and rulers for reading crop lines |
| `art/takes`, `art/picked` | Every PixelLab take, and the ones the game uses; `art/calls.jsonl` logs each request |
| `tools/playtest.py` | Plays every screen in headless Chrome and saves screenshots to `out/` |
| `tools/qtest.py`, `tools/qtest.html` | Tests every question generator, and draws contact sheets of real quiz panels and chalkboards to `out/qtest/` |
| `tools/publish.py` | Pushes to GitHub and turns on Pages |
| `tools/itch.py` | Builds the itch.io upload zip, cover, banner and screenshots in `out/itch/` |
| `itch/` | The itch.io page: its description, and every setting on its form |
| `ref/concept.webp` | The concept art |
