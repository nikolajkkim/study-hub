/* Study Hub — app shell. Content lives in /content; this file only renders it. */
(function () {
  'use strict';
  const COURSES = window.STUDY.courses;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- text formatting: math + light markup ---------- */
  // \[..\], \(..\), $$..$$ and $..$ (a single $ only counts when it hugs its content, so "$5 and $6" stays text)
  const MATH = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]+?\$\$|\$[^\s$](?:[^$\n]*?[^\s$])?\$(?!\d))/;
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
    // render math first and park it behind placeholders, so **bold** may wrap formulas
    const maths = [];
    let t = String(s).split(MATH).map((part, i) => {
      if (i % 2) { maths.push(tex(part)); return '\u0000' + (maths.length - 1) + '\u0000'; }
      return safe ? esc(part) : part;
    }).join('');
    t = t.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
    return t.replace(/\u0000(\d+)\u0000/g, (_, i) => maths[+i]);
  }
  function fmt(text, safe) {
    if (!text) return '';
    return String(text).trim().split(/\n\s*\n/).map(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (!safe && /^<(table|div|pre)/.test(lines[0])) return lines.join(' ');
      if (lines.length > 2 && lines.every(l => l.startsWith('|')) && /^\|[\s:|-]+\|$/.test(lines[1])) {
        const cells = l => l.replace(/^\||\|$/g, '').split('|').map(c => inline(c.trim(), safe));
        return '<div class="table-scroll"><table class="sheet"><thead><tr>' + cells(lines[0]).map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>' +
          lines.slice(2).map(l => '<tr>' + cells(l).map(c => `<td>${c}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>';
      }
      if (lines.every(l => /^[-•]\s+/.test(l))) return '<ul>' + lines.map(l => '<li>' + inline(l.replace(/^[-•]\s+/, ''), safe) + '</li>').join('') + '</ul>';
      if (lines.every(l => /^\d+[.)]\s+/.test(l))) return '<ol>' + lines.map(l => '<li>' + inline(l.replace(/^\d+[.)]\s+/, ''), safe) + '</li>').join('') + '</ol>';
      if (/^#{1,4}\s+/.test(lines[0]) && lines.length === 1) return '<h3>' + inline(lines[0].replace(/^#+\s+/, ''), safe) + '</h3>';
      return '<p>' + inline(lines.join(' '), safe) + '</p>';
    }).join('');
  }
  const strip = s => String(s || '').replace(/\\[()[\]]/g, '').replace(/\*\*/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  /* ---------- saved progress (this browser only) ---------- */
  const KEY = 'studyhub:v1';
  let state = { got: {}, q: {}, key: '', model: '', last: '' };
  try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* storage unavailable */ }
  // Progress saved before the site held several courses has no course prefix; it belongs to the first course.
  ['got', 'q'].forEach(bucket => Object.keys(state[bucket]).forEach(k => {
    if (!k.includes(':')) { state[bucket][COURSES[0].id + ':' + k] = state[bucket][k]; delete state[bucket][k]; }
  }));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } };
  save();

  const courseById = id => COURSES.find(c => c.id === id);
  const concepts = l => l.sections.flatMap(s => s.concepts.map(c => Object.assign(c, { _sec: s.title })));
  const cid = (co, l, c) => co.id + ':' + l.id + '/' + c.id;
  const qid = (co, l, q) => co.id + ':' + l.id + '/' + q.id;
  const link = (co, ...p) => '#/c/' + co.id + (p.length ? '/' + p.join('/') : '');
  function progress(co, l) {
    const cs = concepts(l), qs = l.practice;
    const done = cs.filter(c => state.got[cid(co, l, c)]).length + qs.filter(q => state.q[qid(co, l, q)] === 'right').length;
    const total = cs.length + qs.length;
    return { done, total, pct: total ? Math.round(100 * done / total) : 0 };
  }
  function courseProgress(co) {
    const all = co.lectures.map(l => progress(co, l));
    const done = all.reduce((a, p) => a + p.done, 0), total = all.reduce((a, p) => a + p.total, 0);
    return { all, done, total, pct: total ? Math.round(100 * done / total) : 0 };
  }

  /* ---------- chrome: top bar and sidebar ---------- */
  let current = {};
  function renderChrome(co, activeLecture) {
    const ref = co || courseById(state.last) || COURSES[0];
    $('#courseName').textContent = co ? co.code + ' · ' + co.title : (COURSES.length > 1 ? 'All courses' : '');
    $('[data-nav=home]').href = link(ref);
    $('[data-nav=decoder]').href = link(ref, 'decoder');
    document.title = 'Study Hub' + (co ? ' · ' + co.code : '');
    if (!co) {
      $('#sidebar').innerHTML = '<p class="side-title">Courses</p>' + COURSES.map(c => {
        const p = courseProgress(c);
        return `<a class="side-link" href="${link(c)}"><span class="ring" style="--p:${p.pct}"><span>${p.pct}</span></span><span>${esc(c.code)}<br><span class="muted small">${esc(c.title)}</span></span></a>`;
      }).join('');
      return;
    }
    $('#sidebar').innerHTML = (COURSES.length > 1 ? `<a class="side-back" href="#/">← All courses</a>` : '') +
      `<p class="side-title">${esc(co.code)} · ${esc(co.unit)}s</p>` + co.lectures.map(l => {
        const p = progress(co, l);
        return `<a class="side-link ${l === activeLecture ? 'on' : ''}" href="${link(co, 'l', l.id)}">
          <span class="ring" style="--p:${p.pct}"><span>${l.num}</span></span><span>${esc(l.title)}</span></a>`;
      }).join('');
  }

  /* ---------- all-courses landing ---------- */
  function renderLanding() {
    $('#main').innerHTML = `<div class="wrap"><p class="eyebrow">Study Hub</p><h1>Your courses</h1>
      <p class="lead">Pick a course. Progress is saved in this browser.</p>
      ${COURSES.map(co => {
        const p = courseProgress(co);
        const next = co.lectures.find(l => progress(co, l).pct < 100) || co.lectures[0];
        return `<div class="card">
          <p class="eyebrow">${esc(co.code)}</p><h2>${esc(co.title)}</h2>
          <div class="bar"><i style="width:${p.pct}%"></i></div>
          <p class="muted small">${co.lectures.length} ${esc(co.unit.toLowerCase())}s · ${p.done} of ${p.total} checkpoints · ${p.pct}%</p>
          <div class="concept-foot"><a class="btn btn-accent" href="${link(co, 'l', next.id)}">${p.pct ? 'Continue' : 'Start'} ${esc(co.unit)} ${next.num} →</a>
          <a class="btn" href="${link(co)}">Course map</a></div></div>`;
      }).join('')}</div>`;
  }

  /* ---------- course map ---------- */
  const DEFAULT_HOWTO = String.raw`1. **Big picture** first: two minutes on what the lecture is for and how its pieces fit.
2. **Learn**: each idea is a card. The green box is the idea in plain words. The formula comes next. "How the slides say it" is there when you want to match it to the lecture notes.
3. **Cheat sheet**: the formulas in one table, for homework and exam prep.
4. **Practice**: questions with instant checking, hints and worked solutions. Missed ones stay flagged so you can retry.

Confused by anything? Highlight the text and press **Ask about this**, or use the Ask button on any card. The **Jargon decoder** translates every symbol and acronym.`;

  function renderHome(co) {
    const { all, done, total, pct } = courseProgress(co);
    const next = co.lectures.find(l => progress(co, l).pct < 100) || co.lectures[0];
    const mins = co.lectures.reduce((a, l) => a + (progress(co, l).pct < 100 ? l.minutes : 0), 0);
    const unit = co.unit, units = unit.toLowerCase() + 's';
    $('#main').innerHTML = `<div class="wrap">
      <p class="eyebrow">${esc(co.code)}</p>
      <h1>${esc(co.title)}</h1>
      <div class="card hero">
        <div>
          <p class="lead" style="margin-top:0">${pct === 0 ? `${co.lectures.length} ${units} to catch up on. Here is the order and what each one is for.` : pct === 100 ? 'You are fully caught up.' : 'Pick up where you left off.'}</p>
          <div class="bar"><i style="width:${pct}%"></i></div>
          <p class="muted small">${done} of ${total} checkpoints done · about ${Math.round(mins / 60 * 10) / 10} hours of focused work left</p>
          <a class="btn btn-accent" href="${link(co, 'l', next.id)}">${pct === 0 ? 'Start with' : 'Continue'} ${esc(unit)} ${next.num} →</a>
        </div>
        <div class="hero-num">${pct}%</div>
      </div>
      ${co.note ? `<div class="watch"><span class="label">Note</span>${fmt(co.note)}</div>` : ''}

      <h2 style="margin-top:2rem">The story in one paragraph</h2>
      <div class="card">${fmt(co.story)}</div>

      <h2 style="margin-top:2rem">Course map</h2>
      <ol class="path">${co.lectures.map((l, i) => {
        const p = all[i];
        return `<li><span class="dot ${p.pct === 100 ? 'done' : ''}">${p.pct === 100 ? '✓' : l.num}</span>
          <a class="card" href="${link(co, 'l', l.id)}">
            <span class="eyebrow">${esc(unit)} ${l.num}</span>
            <h3>${esc(l.title)}</h3>
            <div>${inline(l.oneLiner)}</div>
            <div class="meta"><span>${concepts(l).length} ideas</span><span>${l.practice.length} practice questions</span><span>~${l.minutes} min</span><span>${p.pct}% done</span></div>
          </a>
          ${l.leadsTo ? `<p class="link-note">↓ ${inline(l.leadsTo)}</p>` : ''}</li>`;
      }).join('')}</ol>

      <h2 style="margin-top:2rem">How to use this site</h2>
      <div class="card">${fmt(co.howTo || DEFAULT_HOWTO)}</div>
    </div>`;
  }

  /* ---------- lecture ---------- */
  const TABS = [['overview', 'Big picture'], ['learn', 'Learn'], ['sheet', 'Cheat sheet'], ['practice', 'Practice']];
  function renderLecture(co, l, tab, anchor) {
    const p = progress(co, l);
    const idx = co.lectures.indexOf(l);
    let body = '';
    if (tab === 'overview') body = viewOverview(co, l);
    else if (tab === 'learn') body = viewLearn(co, l);
    else if (tab === 'sheet') body = viewSheet(l);
    else body = viewPractice(co, l);
    const nextTab = TABS[TABS.findIndex(t => t[0] === tab) + 1];
    const nextL = co.lectures[idx + 1];
    $('#main').innerHTML = `<div class="wrap">
      <p class="eyebrow">${esc(co.unit)} ${l.num} · ~${l.minutes} min</p>
      <h1>${esc(l.title)}</h1>
      <p class="lead">${inline(l.oneLiner)}</p>
      <div class="bar"><i style="width:${p.pct}%"></i></div>
      <p class="muted small">${p.done} of ${p.total} checkpoints · ${p.pct}%</p>
      <nav class="tabs">${TABS.map((t, i) => `<a href="${link(co, 'l', l.id, t[0])}" class="${t[0] === tab ? 'on' : ''}"><span class="n">${i + 1}</span>${t[1]}</a>`).join('')}</nav>
      ${body}
      <div class="concept-foot" style="margin-top:2rem">
        ${nextTab ? `<a class="btn btn-accent" href="${link(co, 'l', l.id, nextTab[0])}">Next: ${nextTab[1]} →</a>` : nextL ? `<a class="btn btn-accent" href="${link(co, 'l', nextL.id)}">Next: ${esc(co.unit)} ${nextL.num} →</a>` : `<a class="btn btn-accent" href="${link(co)}">Back to course map</a>`}
      </div>
    </div>`;
    wireLecture(co, l);
    if (window.StudyWidgets) window.StudyWidgets.mount($('#main'));
    if (anchor) { const el = document.getElementById(anchor); if (el) el.scrollIntoView(); }
  }

  function viewOverview(co, l) {
    return `<div class="card"><h2>What this ${esc(co.unit.toLowerCase())} is really about</h2>${fmt(l.bigPicture.what)}</div>
      <div class="card"><h2>Why you need it</h2>${fmt(l.bigPicture.why)}</div>
      <div class="card"><h2>Roadmap</h2>
        <ol class="roadmap">${l.sections.map(s => `<li><div><a href="${link(co, 'l', l.id, 'learn', s.id)}">${esc(s.title)}</a><div class="muted small">${inline(s.summary)}</div></div></li>`).join('')}</ol>
      </div>
      ${l.bigPicture.remember ? `<div class="card"><h2>If you remember only three things</h2>${fmt(l.bigPicture.remember)}</div>` : ''}`;
  }

  function viewLearn(co, l) {
    return `<div class="chips">${l.sections.map(s => `<a class="chip" href="${link(co, 'l', l.id, 'learn', s.id)}">${esc(s.title)}</a>`).join('')}</div>` +
      l.sections.map(s => `<div class="section-head" id="${s.id}"><p class="eyebrow">Section</p><h2>${esc(s.title)}</h2><p class="muted">${inline(s.summary)}</p></div>` +
        s.concepts.map(c => {
          const on = !!state.got[cid(co, l, c)];
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

  function viewPractice(co, l) {
    const qs = l.practice;
    const right = qs.filter(q => state.q[qid(co, l, q)] === 'right').length;
    const wrong = qs.filter(q => state.q[qid(co, l, q)] === 'wrong').length;
    return `<div class="card score"><div><strong>${right} of ${qs.length} correct</strong>${wrong ? ` · ${wrong} to retry` : ''}</div>
        <button class="btn" type="button" id="resetQ">Reset this set</button></div>
      <p class="muted small">Type decimals (0.2051), fractions (5/11), percents (20.5%) or powers of ten (1.2e9). Stuck? Use the hint first, then the worked solution.</p>` +
      qs.map((q, i) => {
        const st = state.q[qid(co, l, q)] || '';
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
            ${q.concept ? `<a class="btn btn-ghost" href="${link(co, 'l', l.id, 'learn', 'c-' + q.concept)}">Review the idea</a>` : ''}
            <button class="btn btn-ghost" type="button" data-askq>Ask about this</button>
          </div>
        </article>`;
      }).join('');
  }

  function parseNum(s) {
    s = String(s).trim().replace(/,/g, '').replace(/\s+/g, '').replace(/[×x\*]10\^?/i, 'e');
    if (!s) return NaN;
    let pct = false;
    if (s.endsWith('%')) { pct = true; s = s.slice(0, -1); }
    let v;
    const m = s.match(/^(-?\d*\.?\d+)\/(\d*\.?\d+)$/);
    if (m) v = parseFloat(m[1]) / parseFloat(m[2]);
    else if (/^-?\d*\.?\d+(e[-+]?\d+)?$/i.test(s)) v = parseFloat(s);
    else return NaN;
    return pct ? v / 100 : v;
  }

  function wireLecture(co, l) {
    const main = $('#main');
    const refreshChrome = () => {
      const p = progress(co, l);
      const bar = $('.bar i', main); if (bar) bar.style.width = p.pct + '%';
      const cnt = $('.bar + .muted', main); if (cnt) cnt.textContent = `${p.done} of ${p.total} checkpoints · ${p.pct}%`;
      renderChrome(co, l);
    };
    $$('[data-got]', main).forEach(b => b.addEventListener('click', () => {
      const c = concepts(l).find(x => x.id === b.dataset.got), k = cid(co, l, c);
      if (state.got[k]) delete state.got[k]; else state.got[k] = 1;
      save();
      const on = !!state.got[k];
      b.classList.toggle('on', on); b.textContent = on ? '✓ Got it' : 'Mark as understood';
      b.closest('.concept').classList.toggle('done', on);
      refreshChrome();
    }));
    $$('[data-ask]', main).forEach(b => b.addEventListener('click', () => {
      const c = concepts(l).find(x => x.id === b.dataset.ask);
      openAsk({ course: co, lecture: l, topic: strip(c.title), detail: strip(c.plain) + (c.formula ? ' Formula: ' + c.formula : '') });
    }));
    $$('.q', main).forEach(card => {
      const q = l.practice.find(x => x.id === card.dataset.q), k = qid(co, l, q);
      const verdict = $('.verdict', card);
      const mark = (ok, msg) => {
        state.q[k] = ok ? 'right' : 'wrong'; save();
        card.classList.toggle('right', ok); card.classList.toggle('wrong', !ok);
        verdict.hidden = false; verdict.className = 'verdict ' + (ok ? 'right' : 'wrong'); verdict.innerHTML = msg;
        if (ok) $('.solution', card).hidden = false;
        refreshChrome();
        const right = l.practice.filter(x => state.q[qid(co, l, x)] === 'right').length;
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
        // questions asked "in billions" etc. also accept the full number
        const ok = Math.abs(v - q.answer) <= tol || (q.scale && Math.abs(v / q.scale - q.answer) <= tol);
        mark(ok, ok ? `Correct — ${q.show || q.answer}.` : 'Not quite. Check your setup, or open the hint.');
      });
      $$('[data-self]', card).forEach(b => b.addEventListener('click', () => mark(b.dataset.self === 'right', b.dataset.self === 'right' ? 'Marked as understood.' : 'Marked to retry later.')));
      $$('[data-show]', card).forEach(b => b.addEventListener('click', () => { const el = $('.' + b.dataset.show, card); el.hidden = !el.hidden; }));
      $('[data-askq]', card).addEventListener('click', () => openAsk({ course: co, lecture: l, topic: 'a practice question', detail: 'Question: ' + strip(q.q) }));
    });
    const reset = $('#resetQ', main);
    if (reset) reset.addEventListener('click', () => { l.practice.forEach(q => delete state.q[qid(co, l, q)]); save(); route(); });
  }

  /* ---------- decoder ---------- */
  function renderDecoder(co) {
    $('#main').innerHTML = `<div class="wrap"><p class="eyebrow">${esc(co.code)} · Reference</p><h1>Jargon decoder</h1>
      <p class="lead">Every symbol, acronym and piece of lingo from the slides, with how to say it out loud and what it actually means.</p>
      <input class="search" id="decSearch" type="search" placeholder="${esc(co.decoderHint || 'Search the decoder…')}" aria-label="Search the decoder">
      <div id="decList"></div></div>`;
    const draw = f => {
      f = f.toLowerCase();
      $('#decList').innerHTML = co.decoder.map(g => {
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
    let parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    // links from before the site held several courses: #/l/l10/... and #/decoder
    if (parts[0] === 'l' || parts[0] === 'decoder') parts = ['c', COURSES[0].id].concat(parts);
    $('#selAsk').hidden = true;
    $$('.topnav a').forEach(a => a.classList.remove('on'));
    const co = parts[0] === 'c' ? courseById(parts[1]) : null;
    if (!co && COURSES.length > 1) {
      current = {}; renderChrome(null); renderLanding(); window.scrollTo(0, 0); return;
    }
    const course = co || COURSES[0];
    const rest = co ? parts.slice(2) : [];
    if (state.last !== course.id) { state.last = course.id; save(); }
    const l = rest[0] === 'l' && course.lectures.find(x => x.id === rest[1]);
    if (l) {
      current = { course, lecture: l };
      renderChrome(course, l);
      renderLecture(course, l, TABS.some(t => t[0] === rest[2]) ? rest[2] : 'overview', rest[3]);
      if (!rest[3]) window.scrollTo(0, 0);
    } else if (rest[0] === 'decoder') {
      current = { course }; renderChrome(course); renderDecoder(course); $('[data-nav=decoder]').classList.add('on'); window.scrollTo(0, 0);
    } else {
      current = { course }; renderChrome(course); renderHome(course); $('[data-nav=home]').classList.add('on'); window.scrollTo(0, 0);
    }
  }

  /* ---------- ask panel ---------- */
  let askCtx = {}, chat = [];
  const DEFAULT_MODEL = 'claude-haiku-5-5';
  function openAsk(ctx) {
    askCtx = ctx || { course: current.course, lecture: current.lecture };
    chat = [];
    $('#askLog').innerHTML = '';
    const co = askCtx.course;
    const where = askCtx.lecture ? `${co.unit} ${askCtx.lecture.num}: ${askCtx.lecture.title}` : co ? co.title : 'Study Hub';
    $('#askContext').innerHTML = `About: <strong>${esc(where)}</strong>${askCtx.topic ? ' › ' + esc(askCtx.topic) : ''}` +
      (askCtx.quote ? `<blockquote>${esc(askCtx.quote)}</blockquote>` : '');
    const quick = askCtx.quote || askCtx.topic
      ? ['Explain this in simpler words', 'Give me a concrete example', 'Why does this matter?', 'Quiz me on this']
      : ['What should I focus on first?', 'How do these topics connect?'];
    $('#askQuick').innerHTML = quick.map(t => `<button class="chip" type="button">${esc(t)}</button>`).join('');
    $$('#askQuick button').forEach(b => b.addEventListener('click', () => { $('#askInput').value = b.textContent; send(); }));
    $('#askSend').textContent = state.key ? 'Ask' : 'Ask in Claude ↗';
    $('#askClaude').hidden = !state.key;
    $('#setKey').value = state.key || ''; $('#setModel').value = state.model || '';
    $('#ask').hidden = false; $('#selAsk').hidden = true;
    $('#askInput').focus();
  }
  function contextText(short) {
    const co = askCtx.course, l = askCtx.lecture;
    let s = co ? `I am a student catching up on ${co.code} (${co.title}).` : 'I am a student catching up on missed classes.';
    if (l) s += ` I am studying ${co.unit} ${l.num}: ${l.title}.`;
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
    const co = askCtx.course, l = askCtx.lecture;
    const system = `You are a patient tutor for ${co ? co.code + ' (' + co.title + ')' : 'a university course'}. The student is catching up after missing classes and finds dense, formal explanations hard to follow. ${STYLE} Write math in LaTeX using \\( ... \\) for inline and \\[ ... \\] for display.${co && co.tutorNotes ? ' ' + co.tutorNotes : ''}\n\n${contextText(false)}` +
      (l ? `\n\nIdeas covered in this ${co.unit.toLowerCase()}: ${concepts(l).map(c => strip(c.title)).join('; ')}.` : '');
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
    $('#askOpen').addEventListener('click', () => openAsk({ course: current.course, lecture: current.lecture }));
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
      btn._ctx = { course: current.course, lecture: current.lecture, topic: title ? title.textContent.trim() : '', quote: text };
    }, 10);
    document.addEventListener('mouseup', e => { if (e.target !== btn) check(); });
    document.addEventListener('touchend', e => { if (e.target !== btn) check(); });
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', () => openAsk(btn._ctx));
  }

  wireAsk();
  window.addEventListener('hashchange', route);
  route();
})();
