# Study Hub

A static study site built from lecture slides. Each lecture becomes:

- **Big picture** – what the lecture is for and how its parts connect
- **Learn** – one card per idea: plain-English explanation first, formula, example, common trap, and the slide wording on demand
- **Cheat sheet** – the formulas in one table
- **Practice** – auto-checked questions with hints and worked solutions

Plus a jargon decoder, progress tracking (saved in your browser), and an Ask panel.

Live site: https://nikolajkkim.github.io/study-hub/ (after GitHub Pages is switched on: Settings → Pages → branch `main`, folder `/`)

## Asking questions

Highlight any text and press **Ask about this**, or use the Ask button on a card.

- With no setup, the question opens in Claude in a new tab with the lesson context filled in.
- To get answers inside the page, open *Answer settings* in the Ask panel and paste an Anthropic API key. The key is stored only in your browser's local storage and is sent only to `api.anthropic.com`.

## Adding a lecture

Content is plain data; the app never needs to change.

Courses on the site today:

| Folder | Course |
|---|---|
| `content/stat5701/` | STAT 5701, Probability and Statistics for Data Science (lectures 10–15) |
| `content/coms4995/` | COMS 4995, Foundation Model Engineering (weeks 1–7 and 9–11) |

1. Copy any lecture file in the course's folder and edit it. Each file calls `COURSE.add({...})` with:
   `id`, `num`, `title`, `oneLiner`, `minutes`, `bigPicture`, `sections[].concepts[]`, `sheet[]`, `practice[]`.
2. Add one `<script src="content/...">` line to `index.html`, after that course's `course.js`.

Text fields accept LaTeX in `\( ... \)` and `\[ ... \]`, `**bold**`, `- ` / `1. ` lists and `| pipe | tables |`.
Practice question types: `mcq` (choices + answer index), `num` (numeric answer, optional `tol`, and `scale` to also accept the full number when the question asks "in billions"), `self` (reveal and self-grade).
A concept can embed an interactive figure with `widget:` (see `assets/widgets.js` for the list).

The quickest route: give Claude the new slide deck and this repo and ask it to add the lecture in the same format.

## Adding another course

Create `content/<course>/course.js` that calls `STUDY.course({ id, code, title, unit, story, decoder })` and stores the result in `window.COURSE`, then its lecture files. Add the script tags to `index.html` (after `assets/registry.js`). With more than one course the home page becomes a course picker. Progress is saved per course in the browser.

## Run locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000. No build step. KaTeX is vendored in `vendor/`.
