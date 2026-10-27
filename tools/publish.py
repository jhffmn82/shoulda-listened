"""Pushes main to github.com/jhffmn82/shoulda-listened and turns on GitHub Pages, through GitHub's API.

The token is read from .secrets/github-token.txt (a fine-grained token for this one repo with Contents and
Pages read/write) and never printed or written anywhere. Git's credential manager is bypassed, since it
can't reach the Windows credential vault from Claude's shell.

    python -I tools/publish.py
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


def main():
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
