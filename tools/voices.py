"""Voice lines from ElevenLabs.

    python tools/voices.py audition        # a few voices per part, written to out/voices.html
    python tools/voices.py lines           # every line in SCRIPT, in the cast's voices
    python tools/voices.py pack            # crunches them to arcade samples in js/data/voices.js

Needs numpy and lameenc (pip install numpy lameenc). The key goes in .secrets/elevenlabs-api-key.txt
(git-ignored) or ELEVENLABS_API_KEY. Every take is cached in art/voice/cache by voice, model and
words, so running again only pays for lines that changed.
"""
import base64, hashlib, html, io, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VO = ROOT / 'art' / 'voice'
CACHE = VO / 'cache'
API = 'https://api.elevenlabs.io/v1'

# ElevenLabs' own voices. The first group works on any plan; the second needs a paid one.
VOICES = {
    'Roger': 'CwhRBWXzGAHq8TQ4Fs17', 'Sarah': 'EXAVITQu4vr4xnSDxMaL', 'Laura': 'FGY2WhTYpPnrIDTdsKH5', 'Charlie': 'IKne3meq5aSn9XLyUdCD',
    'George': 'JBFqnCBsd6RMkjVDRZzb', 'Callum': 'N2lVS1w4EtoT3dr4eOWO', 'River': 'SAz9YHcvj6GT2YYXdXww', 'Liam': 'TX3LPaxmHKxFdv7VOQHJ',
    'Alice': 'Xb7hH8MSUJpSbSDYk0k2', 'Will': 'bIHbv24MWmeRgasZH58o', 'Jessica': 'cgSgspJ2msm6clMCkdW9', 'Eric': 'cjVigY5qzO86Huf0OWal',
    'Chris': 'iP95p4xoKVk53GoZ742B', 'Brian': 'nPczCjzI2devNBz1zQrb', 'Lily': 'pFZP5JQG7iQjIQuC4Bku', 'Adam': 'pNInz6obpgDQGcFmaJgB',
    'Harry': 'SOYHLrjzK2X1ezoPC6cr', 'Antoni': 'ErXwobaYiN019PkySvjV', 'Arnold': 'VR6AewLTigWG4xSOukaG',
    # Paid plan.
    'Clyde': '2EiwWnXFnvU5JabPnv8n', 'Patrick': 'ODq5zmih8GrVes37Dizd', 'Josh': 'TxGEqnHWrfWFTfGW9XjX', 'Sam': 'yoZ06aMxZJJ28mfd3POQ',
    'Drew': '29vD33N1CtxCmqQRPOHJ', 'Paul': '5Q0t7uMcjvnagumLfvZi', 'Dave': 'CYw3kZ02Hs0563khs1Fj', 'Fin': 'D38z5RcWu1voky8WS1ja',
    'Michael': 'flq6f7yk4E4fJM5XTYuZ', 'Thomas': 'GBv7mTt0atIp3Br8iCZE', 'Ethan': 'g5CIjZEefAph4nQFvHAz', 'James': 'ZQe5CZNOzWyzPSCn5a3c',
    'Jeremy': 'bVMeCyTHy58xNoL34h3p', 'Glinda': 'z9fAnlkpzviPz146aGWa', 'Aria': '9BWtsMINqrJLrRacOk9x',
}
MODEL = 'eleven_v3'
RATE = 22050          # what ElevenLabs sends (pcm_22050)
ARCADE = 16000        # what the game plays: 8 bits at 16 kHz, like a 90s sound board


def key():
    k = os.environ.get('ELEVENLABS_API_KEY')
    if not k:
        p = ROOT / '.secrets' / 'elevenlabs-api-key.txt'
        k = p.read_text().strip() if p.exists() else None
    if not k:
        sys.exit('No ElevenLabs key: put it in .secrets/elevenlabs-api-key.txt')
    return k


def cache_path(text, voice, model=MODEL, stability=.5):
    h = hashlib.sha1(f'{voice}|{model}|{stability}|{text}'.encode()).hexdigest()[:16]
    return CACHE / f'{voice}-{h}.pcm'


def tts(text, voice, model=MODEL, stability=.5):
    """16-bit mono PCM at 22.05 kHz, from the cache when this voice has said these words before."""
    path = cache_path(text, voice, model, stability)
    if path.exists():
        return path.read_bytes()
    body = {'text': text, 'model_id': model, 'voice_settings': {'stability': stability, 'similarity_boost': .8}}
    req = urllib.request.Request(f'{API}/text-to-speech/{VOICES[voice]}?output_format=pcm_22050', data=json.dumps(body).encode(),
                                 headers={'xi-api-key': key(), 'Content-Type': 'application/json', 'User-Agent': 'shoulda-listened'})
    for attempt in range(3):
        try:
            data = urllib.request.urlopen(req, timeout=120).read()
            break
        except urllib.error.HTTPError as e:
            msg = e.read().decode()[:300]
            if e.code == 429 and attempt < 2:
                time.sleep(5)
                continue
            sys.exit(f'ElevenLabs {e.code} on {voice} "{text}": {msg}')
    CACHE.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    with open(VO / 'calls.jsonl', 'a', encoding='utf-8') as f:
        f.write(json.dumps({'t': time.strftime('%Y-%m-%d %H:%M:%S'), 'voice': voice, 'model': model, 'text': text, 'bytes': len(data)}) + '\n')
    return data


def samples(pcm):
    import numpy as np
    return np.frombuffer(pcm, '<i2').astype(np.float64) / 32768


def trim(x, rate=RATE):
    import numpy as np
    loud = np.flatnonzero(np.abs(x) > .02)
    return x[max(0, loud[0] - int(rate * .02)):loud[-1] + int(rate * .08)] if len(loud) else x


def mp3(x, rate, kbps):
    import lameenc, numpy as np
    e = lameenc.Encoder()
    e.set_bit_rate(kbps); e.set_in_sample_rate(rate); e.set_channels(1); e.set_quality(2)
    return bytes(e.encode((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes()) + e.flush())


def crunch(pcm):
    """The arcade treatment: trimmed, levelled, driven a little, cut to 16 kHz and 8 bits, then an MP3 to ship it in."""
    import numpy as np
    x = trim(samples(pcm))
    n = int(len(x) * ARCADE / RATE)
    x = np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x)
    x = x / (np.max(np.abs(x)) or 1)
    x = np.tanh(x * 1.6) / np.tanh(1.6)
    x = np.round(x * 127) / 128
    return mp3(x * .97, ARCADE, 40)


def clean(pcm):
    import numpy as np
    x = trim(samples(pcm))
    return mp3(x / (np.max(np.abs(x)) or 1) * .97, RATE, 64)


# ---- Auditions: the same lines in a few voices for each part.
PARTS = [
    ('The gunman', 'He leans out of the car window with the question.',
     ['Clyde', 'Sam', 'Josh', 'Drew', 'Callum', 'Harry', 'Arnold', 'Adam', 'Brian', 'Roger'],
     ['[menacing] Yo. Pop quiz.', '[cold] No partial credit.']),
    ('The announcer', 'The arcade cabinet itself: stage calls, "Correct!", "You lose!"',
     ['Patrick', 'Clyde', 'Josh', 'Paul', 'Brian', 'Adam', 'Harry', 'Arnold', 'George'],
     ['[shouting] Shoulda listened... to your MATH TEACHER!', "[excited] Teacher's pet!"]),
    ('The hero', 'The kid walking home.',
     ['Jeremy', 'Sam', 'Liam', 'Will', 'Chris', 'Antoni'],
     ['[groans] Aw, man!', "[excited] Yes! I'm home!"]),
    ('Mr. Delgado', 'The math teacher on the chalkboard, and the one who reads your SAT score.',
     ['Michael', 'Thomas', 'Dave', 'Eric', 'George', 'Roger', 'Chris'],
     ["[sighs] Okay. Let's go over it."]),
]
PAID = {'Clyde', 'Patrick', 'Josh', 'Sam', 'Drew', 'Paul', 'Dave', 'Fin', 'Michael', 'Thomas', 'Ethan', 'James', 'Jeremy', 'Glinda', 'Aria'}


def audition():
    out = ROOT / 'out'
    out.mkdir(exist_ok=True)
    src = lambda b: 'data:audio/mpeg;base64,' + base64.b64encode(b).decode()
    parts = []
    for part, about, voices, lines in PARTS:
        cards = []
        for v in voices:
            rows = []
            for line in lines:
                pcm = tts(line, v)
                words, tag = line.split('] ', 1)[1] if line.startswith('[') else line, line[1:line.index(']')] if line.startswith('[') else ''
                rows.append(f'<div class="line"><p><span class="tag">{html.escape(tag)}</span> {html.escape(words)}</p>'
                            f'<div class="takes"><label>Clean<audio controls preload="none" src="{src(clean(pcm))}"></audio></label>'
                            f'<label>Arcade<audio controls preload="none" src="{src(crunch(pcm))}"></audio></label></div></div>')
                print(part, v, line)
            badge = '<span class="badge">paid</span>' if v in PAID else ''
            cards.append(f'<article class="voice"><h3>{v}{badge}</h3>{"".join(rows)}</article>')
        parts.append(f'<section><header><h2>{html.escape(part)}</h2><p>{html.escape(about)}</p></header><div class="voices">{"".join(cards)}</div></section>')
    page = f'''<title>Shoulda Listened Voice Auditions</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=IBM+Plex+Sans:wght@400;600&display=swap">
<style>
/* One look on purpose: the game's own night-time arcade panel, dark in either theme. Parts stack; voices tile. */
:root {{
  --bg: #090b1c; --panel: #0f1433; --edge: #2c4bd0; --fg: #e6eaff; --dim: #8f97c8; --gold: #ffd040; --red: #ff5a48; --green: #7cf08a;
  --display: "Press Start 2P", "Courier New", monospace; --body: "IBM Plex Sans", system-ui, sans-serif;
  color-scheme: dark;
}}
body {{ background: var(--bg); color: var(--fg); font: 15px/1.5 var(--body); margin: 0;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 24px 48px; }}
main {{ max-width: 1040px; margin: 0 auto; display: grid; gap: 36px; }}
h1 {{ font: 20px/1.5 var(--display); color: var(--gold); margin: 0; text-shadow: 3px 3px 0 #a0300c; text-wrap: balance; }}
.intro {{ display: grid; gap: 10px; max-width: 68ch; }}
.intro p {{ margin: 0; color: var(--dim); }}
.intro b {{ color: var(--fg); font-weight: 600; }}
section {{ display: grid; gap: 14px; }}
section header {{ display: grid; gap: 4px; }}
h2 {{ font: 14px/1.4 var(--display); color: var(--red); margin: 0; letter-spacing: .04em; }}
section header p {{ margin: 0; color: var(--dim); }}
.voices {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 12px; }}
.voice {{ background: var(--panel); border: 2px solid var(--edge); box-shadow: inset 0 0 0 2px #000; padding: 12px 14px; display: grid; gap: 10px; min-width: 0; }}
h3 {{ font: 12px/1.4 var(--display); margin: 0; color: var(--fg); display: flex; align-items: center; gap: 10px; }}
.badge {{ font: 600 10px/1 var(--body); text-transform: uppercase; letter-spacing: .08em; color: var(--bg); background: var(--gold); padding: 3px 6px; }}
.line {{ display: grid; gap: 6px; }}
.line p {{ margin: 0; }}
.tag {{ color: var(--dim); font-size: 12px; text-transform: uppercase; letter-spacing: .06em; }}
.takes {{ display: grid; gap: 4px; }}
.takes label {{ display: grid; grid-template-columns: 52px 1fr; align-items: center; gap: 8px; font-size: 12px; color: var(--green); text-transform: uppercase; letter-spacing: .06em; }}
.takes label + label {{ color: var(--gold); }}
audio {{ width: 100%; height: 32px; min-width: 0; }}
</style>
<main>
  <div class="intro">
    <h1>Voice auditions</h1>
    <p>Pick one voice for each of the four parts. Every line plays twice: <b>Clean</b> is how ElevenLabs sends it, and <b>Arcade</b> is how it would sound in the game, cut to 8 bits at 16 kHz like a 1994 sound board.</p>
    <p>The word before each line is an acting direction to the voice and isn't spoken. Voices marked <b>paid</b> came with your upgrade.</p>
  </div>
  {"".join(parts)}
</main>
'''
    (out / 'voices.html').write_text(page, encoding='utf-8')
    print('wrote', out / 'voices.html', len(page) // 1024, 'KB')


# ---- The script. Words in [brackets] direct the voice and aren't spoken.
CAST = {'announcer': 'Patrick', 'gunman': 'Harry', 'hero': 'Liam', 'teacher': 'Thomas', 'driver': 'Charlie'}

# The gunman's lines, as game.js shows them in his speech bubble (LINES), and as he says them.
GUNMAN = [
    # Pulling up.
    ('YO. POP QUIZ.', '[menacing] Yo. Pop quiz.'),
    ('HEY KID. QUICK QUESTION.', '[menacing] Hey, kid. Quick question.'),
    ('SOLVE THIS... OR ELSE.', '[threatening] Solve this... or else.'),
    ('NO CALCULATORS.', '[cold] No calculators.'),
    ('PENCILS DOWN. HANDS UP.', '[menacing] Pencils down. Hands up.'),
    ('SHOW YOUR WORK, PUNK.', '[menacing] Show your work, punk.'),
    ('GOT A MINUTE? GOOD.', '[menacing] Got a minute? Good.'),
    ("LET'S SEE THAT GPA.", "[mocking] Let's see that GPA."),
    ('EYES ON YOUR OWN PAPER.', '[menacing] Eyes on your own paper.'),
    ('THIS IS 30% OF YOUR GRADE.', '[menacing] This is thirty percent of your grade.'),
    ('GOT A NUMBER 2 PENCIL?', '[menacing] You got a number two pencil?'),
    ("IT'S SAT TIME, BABY.", "[gleeful] It's SAT time, baby."),
    # Right answer.
    ('...RESPECT.', '[grudgingly] ...Respect.'),
    ('CORRECT. CARRY ON.', '[flatly] Correct. Carry on.'),
    ("YOUR TEACHER'D BE PROUD.", "[impressed] Your teacher'd be proud."),
    ('NOT BAD, EINSTEIN.', '[sarcastic] Not bad, Einstein.'),
    ('STAY IN SCHOOL, KID.', '[sincerely] Stay in school, kid.'),
    ('A-PLUS. BEAT IT.', '[gruff] A plus. Beat it.'),
    ('GOLD STAR. GET OUTTA HERE.', '[gruff] Gold star. Get outta here.'),
    ('YOU SHOWED YOUR WORK. NICE.', '[impressed] You showed your work. Nice.'),
    # Wrong answer.
    ('SHOULDA STUDIED.', '[cold] Shoulda studied.'),
    ('WRONG.', '[cold] Wrong.'),
    ('NO PARTIAL CREDIT.', '[cold] No partial credit.'),
    ('SEE ME AFTER CLASS.', '[cold] See me after class.'),
    ('CLASS DISMISSED.', '[cold] Class dismissed.'),
    ("THAT'S A ZERO.", "[cold] That's a zero."),
    ('CHECK YOUR WORK NEXT TIME.', '[cold] Check your work next time.'),
    # Out of time.
    ('PENCILS DOWN.', '[cold] Pencils down.'),
    ("TIME'S UP.", "[cold] Time's up."),
    ('TOO SLOW.', '[cold] Too slow.'),
    # The Trapper Keeper stopped the bullet.
    ('...WHAT.', '[confused] ...What.'),
    ('IS THAT A TRAPPER KEEPER?', '[shocked] Is that a Trapper Keeper?'),
    ('KEVLAR?! MAN...', '[frustrated] Kevlar?! Man...'),
]
FORGOT = {'backpack': 'my backpack', 'calculator': 'my calculator', 'lunch-money': 'my lunch money', 'retainer': 'my retainer',
          'permission-slip': 'my permission slip', 'homework': 'my homework'}
SCRIPT = [
    ('title', 'announcer', '[shouting] Shoulda listened... to your MATH TEACHER!'),
    ('insert-coin', 'announcer', '[excited] Insert coin!'),
    ('stage-1', 'announcer', '[shouting] Stage one! Get home!'),
    ('round-2', 'announcer', '[shouting] Round two! Get home... again!'),
    ('round-3', 'announcer', '[shouting] Round three!'),
    ('round-4', 'announcer', '[shouting] Round four!'),
    ('round-5', 'announcer', '[shouting] Here we go again!'),
    ('hurry', 'announcer', '[urgent] Hurry up!'),
    ('correct-1', 'announcer', '[excited] Correct!'),
    ('correct-2', 'announcer', '[excited] Excellent!'),
    ('correct-3', 'announcer', '[excited] Outstanding!'),
    ('correct-4', 'announcer', '[excited] Brilliant!'),
    ('quick', 'announcer', '[excited] Whoa! Quick math!'),
    ('pet-2', 'announcer', "[shouting] Teacher's pet! Double points!"),
    ('pet-3', 'announcer', "[shouting] Teacher's pet! Triple points!"),
    ('pet-4', 'announcer', "[shouting] Teacher's pet! Quadruple points!"),
    ('wrong', 'announcer', '[shouting] Wrong!'),
    ('times-up', 'announcer', "[shouting] Time's up!"),
    ('you-lose', 'announcer', '[shouting] You lose! [pause] [disappointed] Shoulda listened to your math teacher.'),
    ('game-over', 'announcer', '[dramatic] Game over.'),
    ('stage-clear', 'announcer', '[shouting] Stage clear!'),
    ('high-score', 'announcer', '[excited] New high score! Enter your initials!'),
    ('item-calc', 'announcer', '[excited] T. I. eighty-three!'),
    ('item-coffee', 'announcer', '[excited] Coffee!'),
    ('item-keeper', 'announcer', '[excited] Kevlar Trapper Keeper!'),
    ('use-calc', 'announcer', '[excited] Calculator power!'),
    ('use-coffee', 'announcer', '[excited] Caffeine rush!'),
    ('blocked', 'announcer', '[shouting] Blocked!'),
    ('cash', 'announcer', '[excited] Cha-ching!'),
    ('parent-on', 'announcer', '[cheerful] Parent mode! Water guns only.'),
    ('parent-off', 'announcer', '[shouting] Parent mode off!'),
    *[('g-' + '-'.join(''.join(c if c.isalnum() else ' ' for c in shown.lower()).split()), 'gunman', said) for shown, said in GUNMAN],
    ('hero-uhoh-1', 'hero', '[nervous] Uh oh.'),
    ('hero-uhoh-2', 'hero', '[nervous] Not again...'),
    ('hero-uhoh-3', 'hero', "[nervous] I didn't study!"),
    ('hero-phew-1', 'hero', '[relieved] Phew.'),
    ('hero-phew-2', 'hero', '[cocky] Easy.'),
    ('hero-phew-3', 'hero', '[relieved] Nailed it.'),
    ('hero-hit', 'hero', '[short pained grunt] Ugh!'),
    ('hero-soaked', 'hero', "[spluttering] Hey! I'm soaked!"),
    ('hero-rise', 'hero', "[groggy] I'm okay!"),
    ('hero-home', 'hero', "[excited] Yes! I'm home!"),
    ('hero-rat', 'hero', '[screams] Aaah! Rat!'),
    ('hero-kick-1', 'hero', '[effort] Hyah!'),
    ('hero-kick-2', 'hero', '[effort] Hup!'),
    *[(f'forgot-{k}', 'hero', f'[groans] Aw, man. I left {v} at school!') for k, v in FORGOT.items()],
    ('board', 'teacher', "[sighs] Okay. Let's go over it."),
    ('sat-750', 'teacher', '[impressed] M.I.T. called. They want you.'),
    ('sat-650', 'teacher', '[warmly] State school material.'),
    ('sat-550', 'teacher', '[hesitant] Your mom is... proud-ish.'),
    ('sat-450', 'teacher', '[gently] Maybe get a tutor.'),
    ('sat-350', 'teacher', '[disappointed] Your math teacher is disappointed.'),
    ('sat-0', 'teacher', '[exasperated] Did you write your name?'),
    ('made-you-look', 'driver', '[laughing] Made you look!'),
]

# Lines said in one take and cut apart by ElevenLabs' word timings, so they share one tone and pace.
NUMBERS = ['Nine', 'Eight', 'Seven', 'Six', 'Five', 'Four', 'Three', 'Two', 'One', 'Zero']
TAKES = [
    ('announcer', '[dramatic] Continue? ... ' + ' ... '.join(n + '.' for n in NUMBERS),
     [('continue', 'Continue?')] + [(f'count-{9 - i}', n) for i, n in enumerate(NUMBERS)]),
]


def tts_timed(text, voice, model=MODEL, stability=.5):
    """Like tts, plus the time each character is said: (pcm, characters, starts, ends)."""
    path = cache_path(text, voice, model, stability).with_suffix('.json')
    if not path.exists():
        body = {'text': text, 'model_id': model, 'voice_settings': {'stability': stability, 'similarity_boost': .8}}
        req = urllib.request.Request(f'{API}/text-to-speech/{VOICES[voice]}/with-timestamps?output_format=pcm_22050', data=json.dumps(body).encode(),
                                     headers={'xi-api-key': key(), 'Content-Type': 'application/json', 'User-Agent': 'shoulda-listened'})
        try:
            data = urllib.request.urlopen(req, timeout=120).read()
        except urllib.error.HTTPError as e:
            sys.exit(f'ElevenLabs {e.code} on {voice} "{text}": {e.read().decode()[:300]}')
        CACHE.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        with open(VO / 'calls.jsonl', 'a', encoding='utf-8') as f:
            f.write(json.dumps({'t': time.strftime('%Y-%m-%d %H:%M:%S'), 'voice': voice, 'model': model, 'text': text, 'timed': True}) + '\n')
    d = json.loads(path.read_text())
    a = d.get('alignment') or d['normalized_alignment']
    return base64.b64decode(d['audio_base64']), ''.join(a['characters']), a['character_start_times_seconds'], a['character_end_times_seconds']


def cut(role, text, words):
    """One take, cut into {key: pcm} at its pauses. The word timings are only close, so they just say
    which stretch of speech is which word."""
    import numpy as np
    pcm, chars, starts, ends = tts_timed(text, CAST[role])
    x, f = samples(pcm), RATE // 100
    env = np.array([np.sqrt((x[i:i + f] ** 2).mean()) for i in range(0, len(x) - f, f)])
    on = env > max(.012, env.max() * .04)
    regions = []  # stretches of speech, in seconds, joined across gaps under 0.12 s
    for i in np.flatnonzero(on):
        if regions and i - regions[-1][1] < 12: regions[-1][1] = i + 1
        else: regions.append([i, i + 1])
    regions = [(a / 100, b / 100) for a, b in regions]
    out, at = {}, 0
    for k, w in words:
        i = chars.lower().index(w.lower(), at); at = i + len(w)
        a, b = starts[i], ends[i + len(w) - 1]
        n = max(range(len(regions)), key=lambda n: min(b, regions[n][1]) - max(a, regions[n][0]) - abs((a + b) / 2 - sum(regions[n]) / 2) * .01)
        lo, hi = regions[n]
        lo = max(lo - .03, regions[n - 1][1] if n else 0)
        hi = min(hi + .12, regions[n + 1][0]) if n + 1 < len(regions) else hi + .2
        out[k] = pcm[int(lo * RATE) * 2:int(hi * RATE) * 2]
    return out


def lines():
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(3) as pool:
        list(pool.map(lambda line: tts(line[2], CAST[line[1]]), SCRIPT))
    for role, text, words in TAKES:
        print(role, 'take cut into', len(cut(role, text, words)), 'lines')
    print(len(SCRIPT), 'lines in', len(list(CACHE.glob('*.pcm'))), 'cached takes')


def pack():
    import re
    js = (ROOT / 'js' / 'game.js').read_text(encoding='utf-8')
    block = js[js.index('const LINES = {'):js.index('};', js.index('const LINES = {'))]
    said = {s for s, _ in GUNMAN}
    for shown in re.findall(r"'([^']*)'|\"([^\"]*)\"", block):
        shown = shown[0] or shown[1]
        if shown not in said: print('no recording for the gunman line', repr(shown))
    out = {}
    for k, role, text in SCRIPT:
        p = cache_path(text, CAST[role])
        if not p.exists(): sys.exit(f'{k} is not recorded yet: run python tools/voices.py lines')
        out[k] = base64.b64encode(crunch(p.read_bytes())).decode()
    for role, text, words in TAKES:
        for k, pcm in cut(role, text, words).items():
            out[k] = base64.b64encode(crunch(pcm)).decode()
    body = ',\n'.join(f'  {json.dumps(k)}: "{v}"' for k, v in out.items())
    cast = ', '.join(f'{r}: {v}' for r, v in CAST.items())
    (ROOT / 'js' / 'data' / 'voices.js').write_text(
        f'// Made by tools/voices.py pack: every spoken line, ElevenLabs voices ({cast}), crunched to 8-bit MP3.\n'
        f'const VOICE_LINES = {{\n{body}\n}};\n', encoding='utf-8')
    print(f'packed {len(out)} lines, {sum(len(v) for v in out.values()) // 1024} KB')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd in ('audition', 'lines', 'pack'):
        globals()[cmd]()
    else:
        sys.exit(__doc__)
