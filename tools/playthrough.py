"""One scripted play-through for tools/playtest.py: every screen of the game, saved to out/NN-name.png."""
import time

JUMP = """(dx) => { const P = __game.Play; P.hero.x = P.S.encounters[P.next] - dx; P.cam = Math.max(0, P.hero.x - 130); }"""


def run(page, root, out):
    shots = []

    def shot(name):
        n = len(shots) + 1
        path = out / f'{n:02d}-{name}.png'
        page.locator('#screen').screenshot(path=str(path))
        shots.append(path.name)

    def wait_for(js, timeout=15):
        page.wait_for_function(js, timeout=timeout * 1000)

    def phase():
        return page.evaluate('[__game.Game.scene === __game.Play ? "play" : "other", __game.Play.phase, __game.Play.E && __game.Play.E.phase]')

    page.goto((root / 'index.html').as_uri())
    time.sleep(1.2); shot('boot')
    time.sleep(2.0); shot('warning')
    page.keyboard.press('Enter')
    time.sleep(1.5); shot('title')
    page.evaluate('__game.Attract.mode = "scores"; __game.Attract.t = 0'); time.sleep(.4); shot('scores')
    page.evaluate('__game.Attract.mode = "howto"; __game.Attract.t = 0'); time.sleep(.4); shot('howto')
    page.keyboard.press('Digit5'); time.sleep(.2)
    page.keyboard.press('Digit1'); time.sleep(1.0); shot('grade-select')
    page.evaluate('__game.Select.cur = __game.Select.list.findIndex(g => g.id === "sat")')
    page.keyboard.press('Enter'); wait_for('__game.Game.scene === __game.Play'); time.sleep(1.0); shot('stage-intro')
    page.keyboard.down('ArrowRight'); time.sleep(2.2); shot('walking'); page.keyboard.up('ArrowRight')
    # Kick the first trash can.
    page.evaluate('(() => { const P = __game.Play; P.hero.x = P.cans[0].x - 14; P.cam = Math.max(0, P.hero.x - 130); })()')
    page.keyboard.press('KeyZ'); time.sleep(.15); shot('kick')
    time.sleep(1.0); page.keyboard.down('ArrowRight'); time.sleep(.6); page.keyboard.up('ArrowRight')
    # First stick-up: a plain question, answered right.
    page.evaluate(f'({JUMP})(10)')
    page.keyboard.down('ArrowRight'); time.sleep(.4); page.keyboard.up('ArrowRight')
    time.sleep(1.0); shot('car-arrives')
    wait_for('__game.Play.E && __game.Play.E.phase === "talk"'); time.sleep(.3); shot('stick-up')
    wait_for('__game.Play.E && __game.Play.E.phase === "quiz"'); time.sleep(.5); shot('quiz')
    page.keyboard.press('KeyX'); time.sleep(.3); shot('quiz-calculator')
    ans = page.evaluate('__game.Play.E.q.answer')
    page.keyboard.press('ABCD'[ans]); time.sleep(.4); shot('correct')
    wait_for('__game.Play.E && __game.Play.E.phase === "nod"'); time.sleep(.3); shot('nod')
    wait_for('__game.Play.phase === "walk"', 20)
    # Second stick-up: a diagram question, answered wrong.
    for kind in ['triangleAngles', 'graphSystem', 'scatter', 'table']:
        page.evaluate(f'({JUMP})(10)')
        page.keyboard.down('ArrowRight'); time.sleep(.4); page.keyboard.up('ArrowRight')
        wait_for('__game.Play.E && __game.Play.E.phase === "quiz"')
        page.evaluate(f'(() => {{ const P = __game.Play, q = __game.Questions.G.{kind}(2); q.level = 2; P.E.q = q; P.E.L = P.layout(q); }})()')
        time.sleep(.5); shot('quiz-' + kind)
        if kind != 'table':
            ans = page.evaluate('__game.Play.E.q.answer')
            page.keyboard.press('ABCD'[ans])
            wait_for('__game.Play.phase === "walk"', 20)
    wrong = page.evaluate('(__game.Play.E.q.answer + 1) % 4')
    page.keyboard.press('ABCD'[wrong]); time.sleep(.5); shot('wrong')
    wait_for('__game.Play.E && __game.Play.E.phase === "shot"'); time.sleep(.05); shot('bang')
    time.sleep(.5); shot('fallen')
    wait_for('__game.Play.phase === "death"'); time.sleep(1.6); shot('you-lose')
    # Each screen waits for the voice before it, so wait on the game's state rather than the clock.
    wait_for('__game.Play.D.t > .6 + (__game.Play.D.loseFor || 0) + .25'); page.keyboard.press('KeyZ')
    wait_for('__game.Play.D.stage === "board"'); time.sleep(1.0); shot('chalkboard')
    wait_for('__game.Play.D.bt > Math.max(.8, (__game.Play.D.boardFor || 0) + .15)'); page.keyboard.press('KeyZ')
    wait_for('__game.Play.D.stage === "cont"'); time.sleep(.6); shot('continue')
    # Let the countdown run out.
    page.evaluate('__game.Play.D.ct = .5'); wait_for('__game.Play.phase === "over"'); time.sleep(.8); shot('game-over')
    wait_for('__game.Play.O.t > 2.6'); shot('sat-score')
    page.keyboard.press('KeyZ'); wait_for('__game.Game.scene === __game.Entry'); time.sleep(.5); shot('name-entry')
    page.keyboard.type('JHF'); time.sleep(.15)
    time.sleep(.3); shot('name-typed')
    page.keyboard.press('Enter'); time.sleep(.6); shot('new-high-score')
    # Stage clear, then Parent Mode.
    page.keyboard.press('Enter'); wait_for('__game.Game.scene === __game.Select'); time.sleep(.3)
    page.keyboard.press('Enter'); wait_for('__game.Game.scene === __game.Play'); time.sleep(.8)
    page.evaluate('(() => { const P = __game.Play; P.next = P.S.encounters.length; P.hero.x = P.S.homeX - 120; P.cam = P.S.length - 384; })()')
    page.keyboard.down('ArrowRight'); time.sleep(2.0); page.keyboard.up('ArrowRight'); shot('home')
    time.sleep(2.5); shot('tally')
    page.evaluate('__game.Game.go(__game.Attract, "title")'); time.sleep(.3)
    page.keyboard.press('KeyP'); time.sleep(.3); shot('parent-mode-title')
    page.keyboard.press('Enter'); time.sleep(.5); page.keyboard.press('Enter')
    wait_for('__game.Game.scene === __game.Play'); time.sleep(.5)
    page.evaluate(f'({JUMP})(10)')
    page.keyboard.down('ArrowRight'); time.sleep(.4); page.keyboard.up('ArrowRight')
    wait_for('__game.Play.E && __game.Play.E.phase === "quiz"')
    wrong = page.evaluate('(__game.Play.E.q.answer + 1) % 4')
    page.keyboard.press('ABCD'[wrong])
    wait_for('__game.Play.E && __game.Play.E.phase === "shot"'); time.sleep(.08); shot('parent-squirt')
    time.sleep(1.6); shot('parent-soaked')
    page.evaluate('__game.Game.setParent(false)')
    print('screens:', len(shots))
