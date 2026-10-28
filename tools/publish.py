"""Pushes main to github.com/jhffmn82/shoulda-listened and turns on GitHub Pages, through GitHub's API.

The token is read from .secrets/github-token.txt (a fine-grained token for this one repo with Contents and
Pages read/write) and never printed or written anywhere. Git's credential manager is bypassed, since it
can't reach the Windows credential vault from Claude's shell.

    python tools/publish.py

First it fingerprints the scripts: each <script src="js/..."> in index.html gets ?v= and a hash of the
file, committed if it changed. GitHub Pages lets browsers keep files for 10 minutes, so without it a
player could get this release's page with last release's scripts (or a "not found" cached mid-deploy).
"""
import base64, json, os, pathlib, subprocess, sys, urllib.error, urllib.request

OWNER, REPO = 'jhffmn82', 'shoulda-listened'
ROOT = pathlib.Path(__file__).resolve().parent.parent


def token():
    f = ROOT / '.secrets' / 'github-token.txt'
    t = os.environ.get('GITHUB_TOKEN') or (f.read_text().strip() if f.exists() else '')
    if not t:
        raise SystemExit('No GitHub token: put one in .secrets/github-token.txt')
    return t


def api(method, path, body=None):
    req = urllib.request.Request('https://api.github.com' + path, method=method, data=json.dumps(body).encode() if body else None)
    req.add_header('Authorization', 'Bearer ' + token())
    req.add_header('Accept', 'application/vnd.github+json')
    req.add_header('X-GitHub-Api-Version', '2022-11-28')
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read() or b'{}')
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b'{}')


def fingerprint():
    """Stamps each script in index.html with a hash of its contents. True if index.html changed."""
    import hashlib, re
    page = ROOT / 'index.html'
    html = page.read_text(encoding='utf-8')
    stamp = lambda m: f'src="{m[1]}?v={hashlib.sha1((ROOT / m[1]).read_bytes()).hexdigest()[:8]}"'
    new = re.sub(r'src="(js/[^"?]+)(?:\?v=[0-9a-f]*)?"', stamp, html)
    if new == html: return False
    with open(page, 'w', encoding='utf-8', newline='') as f: f.write(new)
    return True


def main():
    if fingerprint():
        subprocess.run(['git', '-C', str(ROOT), 'commit', '-q', '-m', 'Fingerprint the scripts for this release', 'index.html'], check=True)
    code, repo = api('GET', f'/repos/{OWNER}/{REPO}')
    if code != 200:
        raise SystemExit(f'github.com/{OWNER}/{REPO} not reachable with this token ({code}): create the repo first')
    auth = base64.b64encode(f'x-access-token:{token()}'.encode()).decode()
    env = dict(os.environ, GIT_CONFIG_COUNT='2', GIT_CONFIG_KEY_0='http.extraHeader', GIT_CONFIG_VALUE_0=f'Authorization: Basic {auth}',
               GIT_CONFIG_KEY_1='credential.helper', GIT_CONFIG_VALUE_1='', GIT_TERMINAL_PROMPT='0')
    url = f'https://github.com/{OWNER}/{REPO}.git'
    subprocess.run(['git', '-C', str(ROOT), 'push', url, 'main:main'], env=env, check=True)
    subprocess.run(['git', '-C', str(ROOT), 'fetch', url, 'main'], env=env, check=True, capture_output=True)
    code, pages = api('GET', f'/repos/{OWNER}/{REPO}/pages')
    if code == 404:
        code, pages = api('POST', f'/repos/{OWNER}/{REPO}/pages', {'source': {'branch': 'main', 'path': '/'}})
        print('GitHub Pages turned on' if code in (200, 201) else f'Pages not turned on ({code}): {pages.get("message")}')
    print('play at', pages.get('html_url') or f'https://{OWNER}.github.io/{REPO}/')


if __name__ == '__main__':
    main()
