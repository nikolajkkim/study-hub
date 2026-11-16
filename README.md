# Study Hub

A static study site built from lecture slides. Each lecture becomes:

- **Big picture** – what the lecture is for and how its parts connect
- **Learn** – one card per idea: plain-English explanation first, formula, example, common trap, and the slide wording on demand
- **Cheat sheet** – the formulas in one table
- **Practice** – auto-checked questions with hints and worked solutions

Plus a jargon decoder, progress tracking (saved in your browser), and an Ask panel.

Live site: https://nikolajkkim.github.io/study-hub/

## Asking questions

Highlight any text and press **Ask about this**, or use the Ask button on a card.

- With no setup, the question opens in Claude in a new tab with the lesson context filled in.
- To get answers inside the page, open *Answer settings* in the Ask panel and paste an Anthropic API key. The key is stored only in your browser's local storage and is sent only to `api.anthropic.com`.

## Adding a lecture

Content is plain data; the app never needs to change.

1. Copy any file in `content/stat5701/` and edit it. Each file calls `COURSE.add({...})` with:
   `id`, `num`, `title`, `oneLiner`, `minutes`, `bigPicture`, `sections[].concepts[]`, `sheet[]`, `practice[]`.
2. Add one `<script src="content/...">` line to `index.html`.

Text fields accept LaTeX in `\( ... \)` and `\[ ... \]`, `**bold**`, and `- ` / `1. ` lists.
Practice question types: `mcq` (choices + answer index), `num` (numeric answer, optional `tol`), `self` (reveal and self-grade).

The quickest route: give Claude the new slide deck and this repo and ask it to add the lecture in the same format.

## Adding another course

Create `content/<course>/course.js` (course title, story, decoder) and its lecture files, then point the script tags in `index.html` at them.

## Run locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000. No build step. KaTeX is vendored in `vendor/`.
