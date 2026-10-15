# Prem Arvinth G | Creative portfolio

Video editing, Blender 3D and photography portfolio, built like an editing timeline:
the bar along the bottom of the screen is the page. Scroll and the playhead moves,
drag it to scrub, click a clip to cut to that section, or press **J** / **L** to jump
back and forward (**K** pauses the hero monitor).

Live: https://prem-arvinth-g.github.io/editing-portfolio/

Developer portfolio: https://prem-arvinth-g.github.io/Online_Portfolio/

## What's inside

| Path | What it is |
|------|------------|
| `index.html` | Page structure |
| `css/style.css` | All styles |
| `js/data.js` | **All content.** Edit this file to add or change work |
| `js/main.js` | Hero monitor, timeline, hover scrubbing, lightbox |
| `assets/photos/` | 18 photos (max 1800 px) and `thumbs/` (max 760 px) |
| `assets/reels/` | Cover image for every Instagram reel and 3D post |
| `assets/profile.jpg`, `assets/og.jpg` | Portrait and link-preview image |

Plain HTML, CSS and JavaScript. No build step, so GitHub Pages serves it as-is.
Videos are never stored in the repo; they play from YouTube and Instagram.

## Adding work

**A YouTube video:** add `{ id: "VIDEO_ID", title: "Title" }` to `youtube.videos` in `js/data.js`.
Thumbnails and scrub frames come from YouTube automatically.

**An Instagram reel:** add its ID (the part after `/reel/` or `/p/`) to the right list in
`js/data.js`, then save a 720×1280 cover as `assets/reels/<ID>.jpg`. You can get the cover from
`https://www.instagram.com/p/<ID>/media/?size=l`.

**A showreel:** paste the YouTube link into `showreel` in `js/data.js`. A "Play showreel"
button appears in the hero.

**A photo:** resize to 1800 px on the long side (JPEG quality ~80), save it in `assets/photos/`,
save a 760 px copy in `assets/photos/thumbs/`, and add an entry to `photos` in `js/data.js`.

## Run locally

```bash
python -m http.server 5173
```

Then open http://localhost:5173.

## Deploy

GitHub Pages: Settings, Pages, Deploy from a branch, `main`, `/ (root)`.
