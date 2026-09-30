# DC Political Events

A static listing of upcoming Washington, DC politics and ideas events — in person, hybrid, and online — across libertarian, conservative, progressive, foreign policy, abundance/YIMBY, and law. The line under the logo is still “Events, my dear boy, events.”

This repository is a redesign of [sfox2006/DC-Political-events](https://github.com/sfox2006/DC-Political-events). It is plain HTML, CSS, and JavaScript with no build step.

## Data

The scraping pipeline keeps publishing `data/events.json` to the original site. This page requests that file first:

`https://sfox2006.github.io/DC-Political-events/data/events.json?ts=<timestamp>`

If that request fails, or the JSON has no `events` array, the page uses the copy at `data/events.json` in this repo. **Refresh** uses the same order. The service worker treats both URLs as network-first so a cached file never wins over a fresh one.

Events are grouped in Eastern Time. The list opens on today and the next two days. Pick any later day on the mini calendar (it pages at least three months ahead, and further when events are published past that) to see that day and the two that follow.

## Publish

GitHub Pages serves this repository from the `main` branch, site root. The public URL is:

`https://sfox2006.github.io/DC-Political-events-Claude-design/`

Assets, the manifest (`start_url`, `scope`, icons), and the service worker use relative URLs so the site works from that subpath. To preview locally, serve the folder over HTTP (opening `index.html` as a file will not load the data):

```bash
python3 -m http.server 8765
```

Then open `http://127.0.0.1:8765/`.

Home-screen name: **DC Events**.
