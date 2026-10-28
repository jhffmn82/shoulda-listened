# itch.io page settings

Everything the "Create new project" form asks for. `python tools/itch.py` builds the files it names in `out/itch/`, and `itch/description.html` is the description.

## Create new project (itch.io → Dashboard → Create new project)

| Field | Value |
|---|---|
| Title | Shoulda Listened to Your Math Teacher |
| Project URL | `shoulda-listened` |
| Short description or tagline | A 1994 arcade game where every stick-up is an SAT math question. |
| Classification | Games |
| Kind of project | HTML |
| Release status | Released |
| Pricing | No payments |
| Uploads | `out/itch/shoulda-listened-html5.zip`, then tick **This file will be played in the browser** |
| Embed options | Embed in page; viewport **1152 × 720**; tick **Mobile friendly** (orientation: Default) and **Fullscreen button**; leave **Automatically start on page load** off, so the player's click starts the game with sound and keyboard |
| Description | Paste from `itch/description.html` (open it in a browser, select the text under the line, copy) |
| Genre | Educational |
| Tags | arcade, retro, pixel-art, 90s, comedy, funny, math, educational, side-scroller, quiz |
| AI generation disclosure | Yes. Graphics (PixelLab), sound (ElevenLabs voices), and text and code (written with Claude) |
| App store links, custom noun | Leave empty |
| Community | Comments |
| Visibility | Draft first. Check the game plays on the page, then Public |
| Cover image | `out/itch/cover.png` (630 × 500) |
| Screenshots | The six `out/itch/screenshot-*.png`, in order |

## Edit theme (on the project page, after saving)

| Setting | Value |
|---|---|
| Banner | `out/itch/banner.png` |
| Background | `#090b1c` |
| Inner background | `#0f1433` |
| Text | `#e6eaff` |
| Links | `#ffd040` |
| Buttons | `#ff5a48` |

## Later updates

butler pushes a new build to the same page from the command line: `butler push out/itch/shoulda-listened-html5.zip <your-itch-username>/shoulda-listened:html5`, with an itch.io API key from Settings → API keys.
