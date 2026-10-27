"""Drives the game in headless Chrome (the installed one, no browser download) and saves screenshots.

    python tools/playtest.py --sheet        # sprite contact sheet + question self-test
    python tools/playtest.py                # plays through the game's screens, out/*.png
"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'out'


def run_sheet(page):
    for tag in ['', '#parent']:
        page.goto((ROOT / 'tools' / 'sheet.html').as_uri() + tag)
        page.wait_for_function('window.done === true', timeout=20000)
        page.locator('canvas').screenshot(path=str(OUT / f'sheet{tag.replace("#", "-")}.png'))
    bad = page.evaluate('window.selfTest.map(b => ({kind: b.kind, level: b.level, why: b.why, text: b.q.text, choices: b.q.choices}))')
    print('self-test problems:', len(bad))
    for b in bad[:20]:
        print(json.dumps(b))


def main():
    OUT.mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', headless=True, args=['--autoplay-policy=no-user-gesture-required'])
        page = browser.new_page(viewport={'width': 1600, 'height': 960})
        errors = []
        page.on('console', lambda m: m.type in ('error', 'warning') and errors.append(m.text))
        page.on('pageerror', lambda e: errors.append(str(e)))
        try:
            if '--sheet' in sys.argv:
                run_sheet(page)
            else:
                import playthrough
                playthrough.run(page, ROOT, OUT)
        finally:
            print('console errors:', len(errors))
            for e in errors[:30]:
                print('  ', e)
        browser.close()


if __name__ == '__main__':
    sys.path.insert(0, str(pathlib.Path(__file__).parent))
    main()
