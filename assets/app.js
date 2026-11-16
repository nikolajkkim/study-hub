/* Study Hub — app shell. Content lives in /content; this file only renders it. */
(function () {
  'use strict';
  const COURSE = window.COURSE;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- text formatting: math + light markup ---------- */
  const MATH = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/;
  function tex(src) {
    let display = false, body = src;
    if (src.startsWith('\\[')) { display = true; body = src.slice(2, -2); }
    else if (src.startsWith('\\(')) body = src.slice(2, -2);
    else if (src.startsWith('$$')) { display = true; body = src.slice(2, -2); }
    else body = src.slice(1, -1);
    try { return window.katex.renderToString(body, { displayMode: display, throwOnError: false }); }
    catch (e) { return esc(src); }
  }
  function inline(s, safe) {
    return s.split(MATH).map((part, i) => {
      if (i % 2) return tex(part);
      let t = safe ? esc(part) : part;
      return t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
    }).join('');
  }
  function fmt(text, safe) {
    if (!text) return '';
    return String(text).trim().split(/\n\s*\n/).map(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (/^<(table|div|pre)/.test(lines[0])) return lines.join(' ');
      if (lines.every(l => /^[-•]\s+/.test(l))) return '<ul>' + lines.map(l => '<li>' + inline(l.replace(/^[-•]\s+/, ''), safe) + '</li>').join('') + '</ul>';
      if (lines.every(l => /^\d+[.)]\s+/.test(l))) return '<ol>' + lines.map(l => '<li>' + inline(l.replace(/^\d+[.)]\s+/, ''), safe) + '</li>').join('') + '</ol>';
      if (/^#{1,4}\s+/.test(lines[0]) && lines.length === 1) return '<h3>' + inline(lines[0].replace(/^#+\s+/, ''), safe) + '</h3>';
      return '<p>' + inline(lines.join(' '), safe) + '</p>';
    }).join('');
  }
  const strip = s => String(s || '').replace(/\\[()[\]]/g, '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();

  /* ---------- saved progress (this browser only) ---------- */
  const KEY = 'studyhub:v1';
  let state = { got: {}, q: {}, key: '', model: '' };
  try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* storage unavailable */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } };

  const lectures = COURSE.lectures;
  const byId = id => lectures.find(l => l.id === id);
  const concepts = l => l.sections.flatMap(s => s.concepts.map(c => Object.assign(c, { _sec: s.title })));
  const cid = (l, c) => l.id + '/' + c.id;
  const qid = (l, q) => l.id + '/' + q.id;
  function progress(l) {
    const cs = concepts(l), qs = l.practice;
    const done = cs.filter(c => state.got[cid(l, c)]).length + qs.filter(q => state.q[qid(l, q)] === 'right').length;
    const total = cs.length + qs.length;
    return { done, total, pct: total ? Math.round(100 * done / total) : 0 };
  }

  /* ---------- sidebar ---------- */
  function renderSidebar(activeId) {
    $('#sidebar').innerHTML = '<p class="side-title">Lectures</p>' + lectures.map(l => {
      const p = progress(l);
      return `<a class="side-link ${l.id === activeId ? 'on' : ''}" href="#/l/${l.id}">
        <span class="ring" style="--p:${p.pct}"><span>${l.num}</span></span><span>${esc(l.title)}</span></a>`;
    }).join('');
  }

  /* ---------- home ---------- */
  function renderHome() {
    const all = lectures.map(progress);
    const done = all.reduce((a, p) => a + p.done, 0), total = all.reduce((a, p) => a + p.total, 0);
    const pct = total ? Math.round(100 * done / total) : 0;
    const next = lectures.find(l => progress(l).pct < 100) || lectures[0];
    const mins = lectures.reduce((a, l) => a + (progress(l).pct < 100 ? l.minutes : 0), 0);
    $('#main').innerHTML = `<div class="wrap">
      <p class="eyebrow">${esc(COURSE.code)}</p>
      <h1>${esc(COURSE.title)}</h1>
      <div class="card hero">
        <div>
          <p class="lead" style="margin-top:0">${pct === 0 ? 'Six lectures to catch up on. Here is the order and what each one is for.' : pct === 100 ? 'You are fully caught up.' : 'Pick up where you left off.'}</p>
          <div class="bar"><i style="width:${pct}%"></i></div>
          <p class="muted small">${done} of ${total} checkpoints done · about ${Math.round(mins / 60 * 10) / 10} hours of focused work left</p>
          <a class="btn btn-accent" href="#/l/${next.id}">${pct === 0 ? 'Start with' : 'Continue'} Lecture ${next.num} →</a>
        </div>
        <div class="hero-num">${pct}%</div>
      </div>

      <h2 style="margin-top:2rem">The story in one paragraph</h2>
      <div class="card">${fmt(COURSE.story)}</div>

      <h2 style="margin-top:2rem">Course map</h2>
      <ol class="path">${lectures.map((l, i) => {
        const p = all[i];
        return `<li><span class="dot ${p.pct === 100 ? 'done' : ''}">${p.pct === 100 ? '✓' : l.num}</span>
          <a class="card" href="#/l/${l.id}">
            <span class="eyebrow">Lecture ${l.num}</span>
            <h3>${esc(l.title)}</h3>
            <div>${inline(l.oneLiner)}</div>
            <div class="meta"><span>${concepts(l).length} ideas</span><span>${l.practice.length} practice questions</span><span>~${l.minutes} min</span><span>${p.pct}% done</span></div>
          </a>
          ${l.leadsTo ? `<p class="link-note">↓ ${inline(l.leadsTo)}</p>` : ''}</li>`;
      }).join('')}</ol>

      <h2 style="margin-top:2rem">How to use this site</h2>
      <div class="card">${fmt(COURSE.howTo)}</div>
    </div>`;
  }

  /* ---------- lecture ---------- */
  const TABS = [['overview', 'Big picture'], ['learn', 'Learn'], ['sheet', 'Cheat sheet'], ['practice', 'Practice']];
  function renderLecture(l, tab, anchor) {
    const p = progress(l);
    const idx = lectures.indexOf(l);
    let body = '';
    if (tab === 'overview') body = viewOverview(l);
    else if (tab === 'learn') body = viewLearn(l);
    else if (tab === 'sheet') body = viewSheet(l);
    else body = viewPractice(l);
    const nextTab = TABS[TABS.findIndex(t => t[0] === tab) + 1];
    const nextL = lectures[idx + 1];
    $('#main').innerHTML = `<div class="wrap">
      <p class="eyebrow">Lecture ${l.num} · ~${l.minutes} min</p>
      <h1>${esc(l.title)}</h1>
      <p class="lead">${inline(l.oneLiner)}</p>
      <div class="bar"><i style="width:${p.pct}%"></i></div>
      <p class="muted small">${p.done} of ${p.total} checkpoints · ${p.pct}%</p>
      <nav class="tabs">${TABS.map((t, i) => `<a href="#/l/${l.id}/${t[0]}" class="${t[0] === tab ? 'on' : ''}"><span class="n">${i + 1}</span>${t[1]}</a>`).join('')}</nav>
      ${body}
      <div class="concept-foot" style="margin-top:2rem">
        ${nextTab ? `<a class="btn btn-accent" href="#/l/${l.id}/${nextTab[0]}">Next: ${nextTab[1]} →</a>` : nextL ? `<a class="btn btn-accent" href="#/l/${nextL.id}">Next: Lecture ${nextL.num} →</a>` : `<a class="btn btn-accent" href="#/">Back to course map</a>`}
      </div>
    </div>`;
    wireLecture(l, tab);
    if (window.StudyWidgets) window.StudyWidgets.mount($('#main'));
    if (anchor) { const el = document.getElementById(anchor); if (el) el.scrollIntoView(); }
  }

  function viewOverview(l) {
    return `<div class="card"><h2>What this lecture is really about</h2>${fmt(l.bigPicture.what)}</div>
      <div class="card"><h2>Why you need it</h2>${fmt(l.bigPicture.why)}</div>
      <div class="card"><h2>Roadmap</h2>
        <ol class="roadmap">${l.sections.map(s => `<li><div><a href="#/l/${l.id}/learn/${s.id}">${esc(s.title)}</a><div class="muted small">${inline(s.summary)}</div></div></li>`).join('')}</ol>
      </div>
      ${l.bigPicture.remember ? `<div class="card"><h2>If you remember only three things</h2>${fmt(l.bigPicture.remember)}</div>` : ''}`;
  }

  function viewLearn(l) {
    return `<div class="chips">${l.sections.map(s => `<a class="chip" href="#/l/${l.id}/learn/${s.id}">${esc(s.title)}</a>`).join('')}</div>` +
      l.sections.map(s => `<div class="section-head" id="${s.id}"><p class="eyebrow">Section</p><h2>${esc(s.title)}</h2><p class="muted">${inline(s.summary)}</p></div>` +
        s.concepts.map(c => {
          const on = !!state.got[cid(l, c)];
          return `<article class="card concept ${on ? 'done' : ''}" id="c-${c.id}" data-c="${c.id}">
            <div class="concept-top"><h3>${inline(c.title)}</h3></div>
            <div class="plain"><span class="label">In plain English</span>${fmt(c.plain)}</div>
            ${c.formula ? `<div class="formula">${fmt(c.formula)}</div>` : ''}
            ${c.widget ? `<div class="widget" data-widget="${c.widget}"></div>` : ''}
            ${c.example ? `<div class="example"><span class="label">Example</span>${fmt(c.example)}</div>` : ''}
            ${c.watch ? `<div class="watch"><span class="label">Watch out</span>${fmt(c.watch)}</div>` : ''}
            ${c.formal ? `<details class="formal"><summary>How the slides say it</summary>${fmt(c.formal)}</details>` : ''}
            <div class="concept-foot">
              <button class="btn got ${on ? 'on' : ''}" type="button" data-got="${c.id}">${on ? '✓ Got it' : 'Mark as understood'}</button>
              <button class="btn" type="button" data-ask="${c.id}">Ask about this</button>
            </div>
          </article>`;
        }).join('')).join('');
  }

  function viewSheet(l) {
    return l.sheet.map(t => `<div class="card"><h2>${esc(t.title)}</h2>${t.note ? `<p class="muted small">${inline(t.note)}</p>` : ''}
      <div class="table-scroll"><table class="sheet"><thead><tr>${t.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${t.rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`).join('');
  }

  function viewPractice(l) {
    const qs = l.practice;
    const right = qs.filter(q => state.q[qid(l, q)] === 'right').length;
    const wrong = qs.filter(q => state.q[qid(l, q)] === 'wrong').length;
    return `<div class="card score"><div><strong>${right} of ${qs.length} correct</strong>${wrong ? ` · ${wrong} to retry` : ''}</div>
        <button class="btn" type="button" id="resetQ">Reset this set</button></div>
      <p class="muted small">Type decimals (0.2051), fractions (5/11) or percents (20.5%). Stuck? Use the hint first, then the worked solution.</p>` +
      qs.map((q, i) => {
        const st = state.q[qid(l, q)] || '';
        let input = '';
        if (q.type === 'mcq') input = `<div class="choices">${q.choices.map((c, j) => `<button class="choice" type="button" data-choice="${j}"><strong>${'ABCDE'[j]}</strong><span>${inline(c)}</span></button>`).join('')}</div>`;
        else if (q.type === 'num') input = `<form class="num-row" data-num><input type="text" inputmode="decimal" aria-label="Your answer" placeholder="Your answer"><button class="btn btn-accent" type="submit">Check</button></form>`;
        else input = `<p class="muted small">Work it out on paper, then compare with the solution and grade yourself.</p>`;
        return `<article class="card q ${st}" id="q-${q.id}" data-q="${q.id}">
          <span class="q-num">Question ${i + 1}${st === 'right' ? ' · ✓ correct' : st === 'wrong' ? ' · retry' : ''}</span>
          ${fmt(q.q)}
          ${input}
          <div class="verdict" hidden></div>
          <div class="hint" hidden><span class="label">Hint</span>${fmt(q.hint || '')}</div>
          <div class="solution" hidden><span class="label">Worked solution</span>${fmt(q.solution)}
            ${q.type === 'self' ? `<div class="concept-foot"><button class="btn" type="button" data-self="right">I got it</button><button class="btn" type="button" data-self="wrong">Not yet</button></div>` : ''}</div>
          <div class="concept-foot">
            ${q.hint ? `<button class="btn btn-ghost" type="button" data-show="hint">Hint</button>` : ''}
            <button class="btn btn-ghost" type="button" data-show="solution">${q.type === 'self' ? 'Show solution' : 'Worked solution'}</button>
            ${q.concept ? `<a class="btn btn-ghost" href="#/l/${l.id}/learn/c-${q.concept}">Review the idea</a>` : ''}
            <button class="btn btn-ghost" type="button" data-askq>Ask about this</button>
          </div>
        </article>`;
      }).join('');
  }

  function parseNum(s) {
    s = String(s).trim().replace(/,/g, '').replace(/\s+/g, '');
    if (!s) return NaN;
    let pct = false;
    if (s.endsWith('%')) { pct = true; s = s.slice(0, -1); }
    let v;
    const m = s.match(/^(-?\d*\.?\d+)\/(\d*\.?\d+)$/);
    if (m) v = parseFloat(m[1]) / parseFloat(m[2]);
    else if (/^-?\d*\.?\d+(e-?\d+)?$/i.test(s)) v = parseFloat(s);
    else return NaN;
    return pct ? v / 100 : v;
  }

  function wireLecture(l, tab) {
    const main = $('#main');
    const refreshChrome = () => {
      const p = progress(l);
      const bar = $('.bar i', main); if (bar) bar.style.width = p.pct + '%';
      const cnt = $('.bar + .muted', main); if (cnt) cnt.textContent = `${p.done} of ${p.total} checkpoints · ${p.pct}%`;
      renderSidebar(l.id);
    };
    $$('[data-got]', main).forEach(b => b.addEventListener('click', () => {
      const c = concepts(l).find(x => x.id === b.dataset.got), k = cid(l, c);
      if (state.got[k]) delete state.got[k]; else state.got[k] = 1;
      save();
      const on = !!state.got[k];
      b.classList.toggle('on', on); b.textContent = on ? '✓ Got it' : 'Mark as understood';
      b.closest('.concept').classList.toggle('done', on);
      refreshChrome();
    }));
    $$('[data-ask]', main).forEach(b => b.addEventListener('click', () => {
      const c = concepts(l).find(x => x.id === b.dataset.ask);
      openAsk({ lecture: l, topic: strip(c.title), detail: strip(c.plain) + (c.formula ? ' Formula: ' + c.formula : '') });
    }));
    $$('.q', main).forEach(card => {
      const q = l.practice.find(x => x.id === card.dataset.q), k = qid(l, q);
      const verdict = $('.verdict', card);
      const mark = (ok, msg) => {
        state.q[k] = ok ? 'right' : 'wrong'; save();
        card.classList.toggle('right', ok); card.classList.toggle('wrong', !ok);
        verdict.hidden = false; verdict.className = 'verdict ' + (ok ? 'right' : 'wrong'); verdict.innerHTML = msg;
        if (ok) $('.solution', card).hidden = false;
        refreshChrome();
        const right = l.practice.filter(x => state.q[qid(l, x)] === 'right').length;
        const s = $('.score strong', main); if (s) s.textContent = `${right} of ${l.practice.length} correct`;
      };
      $$('[data-choice]', card).forEach(btn => btn.addEventListener('click', () => {
        const j = +btn.dataset.choice, ok = j === q.answer;
        $$('[data-choice]', card).forEach(x => x.classList.remove('sel-right', 'sel-wrong'));
        btn.classList.add(ok ? 'sel-right' : 'sel-wrong');
        mark(ok, ok ? 'Correct.' : 'Not that one — try again, or open the hint.');
      }));
      const form = $('[data-num]', card);
      if (form) form.addEventListener('submit', e => {
        e.preventDefault();
        const v = parseNum($('input', form).value);
        if (isNaN(v)) { verdict.hidden = false; verdict.className = 'verdict wrong'; verdict.textContent = 'Enter a number, fraction or percent.'; return; }
        const tol = q.tol != null ? q.tol : Math.max(0.0005, Math.abs(q.answer) * 0.02);
        const ok = Math.abs(v - q.answer) <= tol;
        mark(ok, ok ? `Correct — ${q.show || q.answer}.` : 'Not quite. Check your setup, or open the hint.');
      });
      $$('[data-self]', card).forEach(b => b.addEventListener('click', () => mark(b.dataset.self === 'right', b.dataset.self === 'right' ? 'Marked as understood.' : 'Marked to retry later.')));
      $$('[data-show]', card).forEach(b => b.addEventListener('click', () => { const el = $('.' + b.dataset.show, card); el.hidden = !el.hidden; }));
      $('[data-askq]', card).addEventListener('click', () => openAsk({ lecture: l, topic: 'a practice question', detail: 'Question: ' + strip(q.q) }));
    });
    const reset = $('#resetQ', main);
    if (reset) reset.addEventListener('click', () => { l.practice.forEach(q => delete state.q[qid(l, q)]); save(); route(); });
  }

  /* ---------- decoder ---------- */
  function renderDecoder() {
    $('#main').innerHTML = `<div class="wrap"><p class="eyebrow">Reference</p><h1>Jargon decoder</h1>
      <p class="lead">Every symbol and piece of lingo from the slides, with how to say it out loud and what it actually means.</p>
      <input class="search" id="decSearch" type="search" placeholder="Search: iid, mgf, hat, converges…" aria-label="Search the decoder">
      <div id="decList"></div></div>`;
    const draw = f => {
      f = f.toLowerCase();
      $('#decList').innerHTML = COURSE.decoder.map(g => {
        const rows = g.items.filter(r => !f || r.join(' ').toLowerCase().includes(f));
        if (!rows.length) return '';
        return `<div class="card"><h2>${esc(g.group)}</h2><div class="table-scroll"><table class="sheet"><thead><tr><th>You see</th><th>Say it as</th><th>What it means</th></tr></thead>
          <tbody>${rows.map(r => `<tr><td>${inline(r[0])}</td><td>${inline(r[1])}</td><td>${inline(r[2])}</td></tr>`).join('')}</tbody></table></div></div>`;
      }).join('') || '<p class="muted">Nothing matches. Try the Ask button instead.</p>';
    };
    draw('');
    $('#decSearch').addEventListener('input', e => draw(e.target.value));
  }

  /* ---------- router ---------- */
  function route() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    $('#selAsk').hidden = true;
    $$('.topnav a').forEach(a => a.classList.remove('on'));
    if (parts[0] === 'l' && byId(parts[1])) {
      const l = byId(parts[1]);
      current = { lecture: l };
      renderSidebar(l.id);
      renderLecture(l, TABS.some(t => t[0] === parts[2]) ? parts[2] : 'overview', parts[3]);
      if (!parts[3]) window.scrollTo(0, 0);
    } else if (parts[0] === 'decoder') {
      current = {}; renderSidebar(); renderDecoder(); $('[data-nav=decoder]').classList.add('on'); window.scrollTo(0, 0);
    } else {
      current = {}; renderSidebar(); renderHome(); $('[data-nav=home]').classList.add('on'); window.scrollTo(0, 0);
    }
  }
  let current = {};

  /* ---------- ask panel ---------- */
  let askCtx = {}, chat = [];
  const DEFAULT_MODEL = 'claude-haiku-5-5';
  function openAsk(ctx) {
    askCtx = ctx || { lecture: current.lecture };
    chat = [];
    $('#askLog').innerHTML = '';
    const where = askCtx.lecture ? `Lecture ${askCtx.lecture.num}: ${askCtx.lecture.title}` : COURSE.title;
    $('#askContext').innerHTML = `About: <strong>${esc(where)}</strong>${askCtx.topic ? ' › ' + esc(askCtx.topic) : ''}` +
      (askCtx.quote ? `<blockquote>${esc(askCtx.quote)}</blockquote>` : '');
    const quick = askCtx.quote || askCtx.topic
      ? ['Explain this in simpler words', 'Give me a concrete example', 'Why does this matter?', 'Quiz me on this']
      : ['What should I focus on first?', 'How do these lectures connect?'];
    $('#askQuick').innerHTML = quick.map(t => `<button class="chip" type="button">${esc(t)}</button>`).join('');
    $$('#askQuick button').forEach(b => b.addEventListener('click', () => { $('#askInput').value = b.textContent; send(); }));
    $('#askSend').textContent = state.key ? 'Ask' : 'Ask in Claude ↗';
    $('#askClaude').hidden = !state.key;
    $('#setKey').value = state.key || ''; $('#setModel').value = state.model || '';
    $('#ask').hidden = false; $('#selAsk').hidden = true;
    $('#askInput').focus();
  }
  function contextText(short) {
    const l = askCtx.lecture;
    let s = `I am a student catching up on ${COURSE.code} (${COURSE.title}).`;
    if (l) s += ` I am studying Lecture ${l.num}: ${l.title}.`;
    if (askCtx.topic) s += ` The topic is: ${askCtx.topic}.`;
    if (askCtx.detail) s += `\n\nWhat my study notes say: ${askCtx.detail.slice(0, short ? 500 : 1500)}`;
    if (askCtx.quote) s += `\n\nThe part I am asking about: "${askCtx.quote.slice(0, short ? 500 : 1200)}"`;
    return s;
  }
  const STYLE = 'Explain in plain, simple words first, then connect it to the formal notation. Keep it short, use one concrete example, and avoid jargon unless you define it.';
  function claudeUrl(question) {
    return 'https://claude.ai/new?q=' + encodeURIComponent(contextText(true) + '\n\nMy question: ' + question + '\n\n' + STYLE);
  }
  function addMsg(cls, html) {
    const d = document.createElement('div'); d.className = 'msg ' + cls; d.innerHTML = html;
    $('#askLog').appendChild(d); d.scrollIntoView({ block: 'end' }); return d;
  }
  async function send() {
    const question = $('#askInput').value.trim();
    if (!question) return;
    if (!state.key) { window.open(claudeUrl(question), '_blank', 'noopener'); return; }
    $('#askInput').value = '';
    addMsg('me', esc(question));
    chat.push({ role: 'user', content: question });
    const pending = addMsg('ai', '<span class="muted">Thinking…</span>');
    const l = askCtx.lecture;
    const system = `You are a patient tutor for ${COURSE.code} (${COURSE.title}). The student is catching up after missing lectures and finds dense, formal explanations hard to follow. ${STYLE} Write math in LaTeX using \\( ... \\) for inline and \\[ ... \\] for display. Use the course's conventions: N(mu, sigma) lists the standard deviation, Exp(lambda) and Gamma(alpha, lambda) use rates, Geometric counts the trial of the first success.\n\n${contextText(false)}` +
      (l ? `\n\nIdeas covered in this lecture: ${concepts(l).map(c => strip(c.title)).join('; ')}.` : '');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': state.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: state.model || DEFAULT_MODEL, max_tokens: 1200, system, messages: chat })
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data.error && data.error.message) || ('Request failed (' + res.status + ')'));
      const answer = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
      chat.push({ role: 'assistant', content: answer });
      pending.innerHTML = fmt(answer, true);
    } catch (err) {
      chat.pop();
      pending.className = 'msg err';
      pending.innerHTML = `Could not get an answer: ${esc(err.message)}. <a href="${esc(claudeUrl(question))}" target="_blank" rel="noopener">Open this question in Claude instead ↗</a>`;
    }
  }

  function wireAsk() {
    $('#askOpen').addEventListener('click', () => openAsk({ lecture: current.lecture }));
    $('#askClose').addEventListener('click', () => { $('#ask').hidden = true; });
    $('#askForm').addEventListener('submit', e => { e.preventDefault(); send(); });
    $('#askInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
    $('#askClaude').addEventListener('click', () => { const q = $('#askInput').value.trim() || 'Explain this in simpler words'; window.open(claudeUrl(q), '_blank', 'noopener'); });
    $('#setSave').addEventListener('click', () => { state.key = $('#setKey').value.trim(); state.model = $('#setModel').value.trim(); save(); $('#askSettings').open = false; openAsk(askCtx); });
    $('#setClear').addEventListener('click', () => { state.key = ''; save(); openAsk(askCtx); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#ask').hidden = true; });

    // highlight any text on the page -> "Ask about this"
    const btn = $('#selAsk');
    const check = () => setTimeout(() => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';
      if (!sel || sel.rangeCount === 0 || text.length < 3 || text.length > 800 || !$('#main').contains(sel.anchorNode)) { btn.hidden = true; return; }
      const r = sel.getRangeAt(0).getBoundingClientRect();
      btn.hidden = false;
      btn.style.top = (window.scrollY + r.bottom + 8) + 'px';
      btn.style.left = Math.max(8, Math.min(window.scrollX + r.left, window.scrollX + window.innerWidth - 150)) + 'px';
      const card = sel.anchorNode.parentElement && sel.anchorNode.parentElement.closest('.concept, .q');
      const title = card && $('h3', card);
      btn._ctx = { lecture: current.lecture, topic: title ? title.textContent.trim() : '', quote: text };
    }, 10);
    document.addEventListener('mouseup', e => { if (e.target !== btn) check(); });
    document.addEventListener('touchend', e => { if (e.target !== btn) check(); });
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', () => openAsk(btn._ctx));
  }

  $('#courseName').textContent = COURSE.code + ' · ' + COURSE.title;
  document.title = 'Study Hub · ' + COURSE.code;
  wireAsk();
  window.addEventListener('hashchange', route);
  route();
})();
