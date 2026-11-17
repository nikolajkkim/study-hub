/* Small interactive figures. A concept opts in with  widget: 'dist' | 'clt' | 'lik'. */
(function () {
  'use strict';
  const { exp, log, sqrt, PI, floor, ceil, min, max, random } = Math;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  function lgamma(x) {
    const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x, t = x + 5.5; t -= (x + 0.5) * log(t);
    let s = 1.000000000190015;
    for (let j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + log(2.5066282746310005 * s / x);
  }
  const lchoose = (n, k) => lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);

  function canvas(el) {
    const c = document.createElement('canvas'); el.appendChild(c);
    return c;
  }
  function ctx(c) {
    const dpr = window.devicePixelRatio || 1, w = c.clientWidth || 600, h = c.clientHeight || 220;
    c.width = w * dpr; c.height = h * dpr;
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    g.font = '11px system-ui, sans-serif';
    return { g, w, h };
  }
  // generic plot: xs range, bars or line, optional overlay line and vertical marker
  function plot(c, o) {
    const { g, w, h } = ctx(c), L = 34, R = 10, T = 10, B = 24;
    const X = x => L + (x - o.x0) / (o.x1 - o.x0) * (w - L - R);
    const Y = y => h - B - (y - o.y0) / (o.y1 - o.y0) * (h - T - B);
    const ink = css('--muted'), line = css('--line'), acc = css('--accent'), good = css('--good');
    g.strokeStyle = line; g.lineWidth = 1; g.beginPath(); g.moveTo(L, T); g.lineTo(L, h - B); g.lineTo(w - R, h - B); g.stroke();
    g.fillStyle = ink; g.textAlign = 'center';
    (o.xticks || []).forEach(t => g.fillText(o.xfmt ? o.xfmt(t) : String(t), X(t), h - 8));
    g.textAlign = 'right';
    (o.yticks || []).forEach(t => g.fillText(o.yfmt ? o.yfmt(t) : t.toFixed(2), L - 4, Y(t) + 4));
    if (o.bars) { g.fillStyle = acc; g.globalAlpha = 0.8; o.bars.forEach(b => { const x = X(b.x - b.w / 2), x2 = X(b.x + b.w / 2); g.fillRect(x + 0.5, Y(b.y), max(1, x2 - x - 1), Y(o.y0) - Y(b.y)); }); g.globalAlpha = 1; }
    const path = (pts, color, width) => { g.strokeStyle = color; g.lineWidth = width; g.beginPath(); pts.forEach((p, i) => { const y = max(o.y0, min(o.y1, p[1])); i ? g.lineTo(X(p[0]), Y(y)) : g.moveTo(X(p[0]), Y(y)); }); g.stroke(); };
    if (o.line) path(o.line, acc, 2.5);
    if (o.overlay) path(o.overlay, good, 2);
    if (o.dot) { g.fillStyle = css('--bad'); g.beginPath(); g.arc(X(o.dot[0]), Y(max(o.y0, min(o.y1, o.dot[1]))), 4.5, 0, 2 * PI); g.fill(); }
    if (o.mark != null) { g.strokeStyle = css('--bad'); g.setLineDash([4, 3]); g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(o.mark), T); g.lineTo(X(o.mark), h - B); g.stroke(); g.setLineDash([]); }
  }
  const ticks = (a, b, n) => { const out = []; for (let i = 0; i <= n; i++) out.push(Math.round((a + (b - a) * i / n) * 100) / 100); return out; };

  /* ---- distribution explorer ---- */
  const D = {
    binom: { name: 'Binomial(n, p)', disc: 1, ps: [['n', 1, 40, 10, 1], ['p', 0.02, 0.98, 0.5, 0.02]], r: p => [0, p.n], f: (x, p) => exp(lchoose(p.n, x) + x * log(p.p) + (p.n - x) * log(1 - p.p)), m: p => p.n * p.p, v: p => p.n * p.p * (1 - p.p), s: 'Number of successes in n independent tries.' },
    geom: { name: 'Geometric(p)', disc: 1, ps: [['p', 0.05, 0.9, 0.3, 0.05]], r: p => [1, min(60, ceil(5 / p))], f: (x, p) => p.p * (1 - p.p) ** (x - 1), m: p => 1 / p.p, v: p => (1 - p.p) / p.p ** 2, s: 'Which try gives the first success.' },
    nbin: { name: 'Negative Binomial(k, p)', disc: 1, ps: [['k', 1, 8, 3, 1], ['p', 0.1, 0.9, 0.4, 0.05]], r: p => [p.k, min(90, ceil(p.k / p.p + 4 * sqrt(p.k * (1 - p.p)) / p.p) + 1)], f: (x, p) => exp(lchoose(x - 1, p.k - 1) + p.k * log(p.p) + (x - p.k) * log(1 - p.p)), m: p => p.k / p.p, v: p => p.k * (1 - p.p) / p.p ** 2, s: 'Which try gives the k-th success.' },
    pois: { name: 'Poisson(λ)', disc: 1, ps: [['λ', 0.2, 20, 4, 0.2]], r: p => [0, ceil(p['λ'] + 4 * sqrt(p['λ']) + 3)], f: (x, p) => exp(x * log(p['λ']) - p['λ'] - lgamma(x + 1)), m: p => p['λ'], v: p => p['λ'], s: 'Number of events in a fixed window of time.' },
    expo: { name: 'Exponential(λ)', ps: [['λ', 0.2, 4, 1, 0.1]], r: () => [0, 8], f: (x, p) => p['λ'] * exp(-p['λ'] * x), m: p => 1 / p['λ'], v: p => 1 / p['λ'] ** 2, s: 'Waiting time until the next event.' },
    norm: { name: 'Normal(μ, σ)', ps: [['μ', -4, 4, 0, 0.1], ['σ', 0.4, 3, 1, 0.1]], r: () => [-8, 8], f: (x, p) => exp(-((x - p['μ']) ** 2) / (2 * p['σ'] ** 2)) / (sqrt(2 * PI) * p['σ']), m: p => p['μ'], v: p => p['σ'] ** 2, s: 'The bell curve: centre μ, spread σ.' },
    gamma: { name: 'Gamma(α, λ)', ps: [['α', 0.6, 10, 2, 0.2], ['λ', 0.3, 3, 1, 0.1]], r: () => [0, 16], f: (x, p) => x <= 0 ? 0 : exp(p['α'] * log(p['λ']) + (p['α'] - 1) * log(x) - p['λ'] * x - lgamma(p['α'])), m: p => p['α'] / p['λ'], v: p => p['α'] / p['λ'] ** 2, s: 'Waiting time until the α-th event. α = 1 is the Exponential.' }
  };
  function dist(el) {
    el.innerHTML = '<div class="controls"><label>Distribution <select></select></label><span class="sliders"></span></div>';
    const sel = el.querySelector('select'), sl = el.querySelector('.sliders');
    const start = el.dataset.start || 'binom';
    sel.innerHTML = Object.keys(D).map(k => `<option value="${k}" ${k === start ? 'selected' : ''}>${D[k].name}</option>`).join('');
    const c = canvas(el), out = document.createElement('div'); out.className = 'readout'; el.appendChild(out);
    let d, p;
    const draw = () => {
      const [a, b] = d.r(p);
      let o;
      if (d.disc) {
        const bars = []; let ym = 0;
        for (let x = a; x <= b; x++) { const y = d.f(x, p); bars.push({ x, y, w: 0.8 }); ym = max(ym, y); }
        o = { x0: a - 0.7, x1: b + 0.7, y0: 0, y1: ym * 1.1, bars, xticks: ticks(a, b, min(b - a, 8)).map(Math.round) };
      } else {
        const pts = []; let ym = 0;
        for (let i = 0; i <= 240; i++) { const x = a + (b - a) * i / 240, y = d.f(x, p); if (isFinite(y)) { pts.push([x, y]); ym = max(ym, y); } }
        ym = min(ym, 3);
        o = { x0: a, x1: b, y0: 0, y1: ym * 1.1, line: pts, xticks: ticks(a, b, 8) };
      }
      o.yticks = ticks(0, o.y1 / 1.1, 2); o.mark = d.m(p);
      plot(c, o);
      out.innerHTML = `<strong>${d.s}</strong> Mean = ${d.m(p).toFixed(2)} (dashed line), variance = ${d.v(p).toFixed(2)}, SD = ${sqrt(d.v(p)).toFixed(2)}.`;
    };
    const build = () => {
      d = D[sel.value]; p = {};
      sl.innerHTML = d.ps.map(s => `<label>${s[0]} = <b data-v="${s[0]}">${s[3]}</b> <input type="range" data-p="${s[0]}" min="${s[1]}" max="${s[2]}" step="${s[4]}" value="${s[3]}"></label>`).join(' ');
      d.ps.forEach(s => p[s[0]] = s[3]);
      sl.querySelectorAll('input').forEach(i => i.addEventListener('input', () => { p[i.dataset.p] = +i.value; sl.querySelector(`[data-v="${i.dataset.p}"]`).textContent = i.value; draw(); }));
      draw();
    };
    sel.addEventListener('change', build); build();
    return draw;
  }

  /* ---- CLT simulator ---- */
  const POP = {
    expo: { name: 'Exponential (very skewed)', draw: () => -log(1 - random()), mu: 1, sd: 1 },
    unif: { name: 'Uniform (flat)', draw: random, mu: 0.5, sd: sqrt(1 / 12) },
    bern: { name: 'Rare yes/no, p = 0.1', draw: () => random() < 0.1 ? 1 : 0, mu: 0.1, sd: 0.3 }
  };
  function clt(el) {
    el.innerHTML = `<div class="controls"><label>Population <select data-pop>${Object.keys(POP).map(k => `<option value="${k}">${POP[k].name}</option>`).join('')}</select></label>
      <label>Sample size n <select data-n>${[1, 2, 5, 10, 30, 100].map(n => `<option ${n === 5 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <button class="btn" type="button">Draw 4,000 samples</button></div>`;
    const c = canvas(el), out = document.createElement('div'); out.className = 'readout'; el.appendChild(out);
    const run = () => {
      const pop = POP[el.querySelector('[data-pop]').value], n = +el.querySelector('[data-n]').value, R = 4000, bw = 0.25;
      const counts = new Array(32).fill(0);
      for (let r = 0; r < R; r++) {
        let s = 0; for (let i = 0; i < n; i++) s += pop.draw();
        const z = (s / n - pop.mu) / (pop.sd / sqrt(n)), k = floor((z + 4) / bw);
        if (k >= 0 && k < 32) counts[k]++;
      }
      const bars = counts.map((ct, k) => ({ x: -4 + (k + 0.5) * bw, y: ct / (R * bw), w: bw }));
      const overlay = []; for (let i = 0; i <= 160; i++) { const x = -4 + 8 * i / 160; overlay.push([x, exp(-x * x / 2) / sqrt(2 * PI)]); }
      plot(c, { x0: -4, x1: 4, y0: 0, y1: max(0.5, ...bars.map(b => b.y)) * 1.08, bars, overlay, xticks: [-4, -3, -2, -1, 0, 1, 2, 3, 4], yticks: [0, 0.2, 0.4] });
      out.innerHTML = `Bars: 4,000 standardized sample means, each from n = ${n}. Green curve: the standard normal. ${n < 10 ? 'With small n the bars still look like the population — lopsided.' : n < 30 ? 'Getting closer to the bell.' : 'At this n the bars hug the bell curve, whatever the population looked like.'}`;
    };
    el.querySelector('button').addEventListener('click', run);
    el.querySelectorAll('select').forEach(s => s.addEventListener('change', run));
    run(); return run;
  }

  /* ---- likelihood curve for the Exponential example in Lecture 15 ---- */
  function lik(el) {
    const data = [225, 171, 198, 189, 189, 135, 162, 135, 117, 162], n = data.length, sum = data.reduce((a, b) => a + b, 0), mle = n / sum;
    const l = x => n * log(x) - x * sum;
    el.innerHTML = `<div class="controls"><label>Try a value: λ = <b data-v>0.0030</b> <input type="range" min="0.001" max="0.02" step="0.0001" value="0.003" style="width:220px"></label></div>`;
    const c = canvas(el), out = document.createElement('div'); out.className = 'readout'; el.appendChild(out);
    const inp = el.querySelector('input');
    const draw = () => {
      const x = +inp.value; el.querySelector('[data-v]').textContent = x.toFixed(4);
      const pts = []; for (let i = 0; i <= 200; i++) { const t = 0.001 + 0.019 * i / 200; pts.push([t, l(t)]); }
      plot(c, { x0: 0.001, x1: 0.02, y0: -80, y1: -60, line: pts, mark: x, xticks: [0.002, 0.006, 0.01, 0.014, 0.018], yticks: [-80, -70, -60], yfmt: t => t.toFixed(0) });
      const gap = l(mle) - l(x);
      out.innerHTML = `Log-likelihood at your λ: <strong>${l(x).toFixed(2)}</strong>. The highest possible is ${l(mle).toFixed(2)}, at λ = 1 / 168.3 ≈ ${mle.toFixed(5)}. ${gap < 0.01 ? 'You found the peak — that is the MLE.' : 'Slide toward the top of the hill.'}`;
    };
    inp.addEventListener('input', draw); draw(); return draw;
  }

  /* ================= widgets for the machine-learning course ================= */
  const human = x => { const a = Math.abs(x); return a >= 1e12 ? (x / 1e12).toFixed(a >= 1e13 ? 0 : 1) + 'T' : a >= 1e9 ? (x / 1e9).toFixed(a >= 1e10 ? 0 : 1) + 'B' : a >= 1e6 ? (x / 1e6).toFixed(0) + 'M' : a >= 1e3 ? (x / 1e3).toFixed(0) + 'K' : String(Math.round(x * 100) / 100); };
  const sig = x => 1 / (1 + exp(-x));
  const sliderHTML = (key, label, lo, hi, step, val) => `<label>${label} = <b data-v="${key}">${val}</b> <input type="range" data-k="${key}" min="${lo}" max="${hi}" step="${step}" value="${val}"></label>`;
  function bindSliders(el, onChange, show) {
    el.querySelectorAll('input[type=range]').forEach(i => i.addEventListener('input', () => {
      const b = el.querySelector(`[data-v="${i.dataset.k}"]`); if (b) b.textContent = show ? show(i.dataset.k, +i.value) : i.value; onChange();
    }));
  }
  const val = (el, k) => +el.querySelector(`[data-k="${k}"]`).value;
  function hbars(rows, opts) {
    // rows: [{label, v, text}] with v in [-1, 1] (signed) or [0, 1]
    const signed = opts && opts.signed;
    return `<div class="hbars">${rows.map(r => `<div class="hb-row"><span class="hb-label">${r.label}</span><span class="hb-track${signed ? ' signed' : ''}">` +
      (signed ? `<i class="${r.v < 0 ? 'neg' : 'pos'}" style="${r.v < 0 ? 'right:50%' : 'left:50%'};width:${Math.abs(r.v) * 50}%"></i>` : `<i style="width:${Math.max(0, r.v) * 100}%"></i>`) +
      `</span><span class="hb-val">${r.text}</span></div>`).join('')}</div>`;
  }

  /* softmax with a temperature knob: sampling temperature, CLIP's tau */
  function softmax(el) {
    const toks = ['Rome', 'Milan', 'Paris', 'pasta', 'the'], logits = [4.0, 2.5, 2.0, 1.0, 0.2];
    el.innerHTML = `<div class="controls"><span>Prompt: <em>“The capital of Italy is …”</em></span>${sliderHTML('t', 'Temperature T', -3, 1.2, 0.01, 0)}</div><div class="out"></div><div class="readout"></div>`;
    const draw = () => {
      const T = exp(val(el, 't'));
      el.querySelector('[data-v="t"]').textContent = T.toFixed(2);
      const z = logits.map(l => l / T), m = max(...z), e = z.map(v => exp(v - m)), s = e.reduce((a, b) => a + b, 0), p = e.map(v => v / s);
      const H = -p.reduce((a, q) => a + (q > 0 ? q * log(q) : 0), 0);
      el.querySelector('.out').innerHTML = hbars(toks.map((t, i) => ({ label: t + ` <span class="muted">(${logits[i]})</span>`, v: p[i], text: (p[i] * 100).toFixed(1) + '%' })));
      el.querySelector('.readout').innerHTML = `Logits are divided by T before the softmax. Entropy ${H.toFixed(2)} nats, so the model is choosing among about <strong>${exp(H).toFixed(2)}</strong> tokens (that number is the perplexity of this one step). ${T < 0.3 ? 'Low T: almost greedy, always “Rome”.' : T > 2 ? 'High T: close to uniform, so unlikely tokens get sampled.' : ''}`;
    };
    bindSliders(el, draw, (k, v) => exp(v).toFixed(2)); draw(); return draw;
  }

  /* MinHash LSH S-curve: P(candidate) = 1 - (1 - J^r)^b */
  function lsh(el) {
    el.innerHTML = `<div class="controls">${sliderHTML('b', 'bands b', 1, 40, 1, 14)}${sliderHTML('r', 'rows per band r', 1, 20, 1, 8)}</div>`;
    const c = canvas(el), out = document.createElement('div'); out.className = 'readout'; el.appendChild(out);
    const draw = () => {
      const b = val(el, 'b'), r = val(el, 'r'), P = J => 1 - (1 - J ** r) ** b;
      const pts = []; for (let i = 0; i <= 200; i++) { const J = i / 200; pts.push([J, P(J)]); }
      const thr = (1 / b) ** (1 / r);
      plot(c, { x0: 0, x1: 1, y0: 0, y1: 1.02, line: pts, mark: thr, xticks: [0, 0.2, 0.4, 0.6, 0.8, 1], yticks: [0, 0.5, 1], dot: [0.8, P(0.8)] });
      out.innerHTML = `x-axis: true Jaccard similarity J of two documents. y-axis: chance they land in a shared bucket. Signature length k = b·r = <strong>${b * r}</strong> hashes. Step near (1/b)<sup>1/r</sup> ≈ <strong>${thr.toFixed(2)}</strong> (dashed). A pair with J = 0.8 is caught ${(P(0.8) * 100).toFixed(0)}% of the time; J = 0.5, ${(P(0.5) * 100).toFixed(1)}%.`;
    };
    bindSliders(el, draw); draw(); return draw;
  }

  /* Chinchilla: IsoFLOP curve under the refit law L = E + A/N^a + B/D^b */
  function chinchilla(el) {
    const E = 1.8172, A = 482.01, B = 2085.43, al = 0.3478, be = 0.3658, L = (N, D) => E + A / N ** al + B / D ** be;
    el.innerHTML = `<div class="controls">${sliderHTML('c', 'Compute budget C', 20, 26, 0.1, 23.7)}</div>`;
    const c = canvas(el), out = document.createElement('div'); out.className = 'readout'; el.appendChild(out);
    const draw = () => {
      const C = 10 ** val(el, 'c');
      el.querySelector('[data-v="c"]').textContent = '10^' + val(el, 'c').toFixed(1) + ' FLOPs';
      const pts = []; let best = [0, 1e9];
      for (let i = 0; i <= 400; i++) { const lg = 7 + 6 * i / 400, N = 10 ** lg, y = L(N, C / (6 * N)); pts.push([lg, y]); if (y < best[1]) best = [lg, y]; }
      const Nb = 10 ** best[0], Db = C / (6 * Nb), Nr = sqrt(C / 120);
      plot(c, { x0: 7, x1: 13, y0: best[1] - 0.05, y1: Math.min(best[1] + 1.6, max(...pts.map(q => q[1]))) + 0.05, line: pts, mark: best[0], dot: [best[0], best[1]], xticks: [7, 8, 9, 10, 11, 12, 13], xfmt: t => human(10 ** t), yticks: [best[1], best[1] + 0.5, best[1] + 1], yfmt: t => t.toFixed(2) });
      out.innerHTML = `Curve: predicted loss for every model size N that spends exactly this budget (D = C / 6N tokens). Best: <strong>${human(Nb)} parameters on ${human(Db)} tokens</strong> (${(Db / Nb).toFixed(0)} tokens per parameter), loss ${best[1].toFixed(3)}. The 20:1 rule says ${human(Nr)} on ${human(20 * Nr)}. Half or double the best size costs only ${((L(Nb / 2, 2 * Db) / best[1] - 1) * 100).toFixed(2)}% / ${((L(Nb * 2, Db / 2) / best[1] - 1) * 100).toFixed(2)}% more loss.`;
    };
    bindSliders(el, draw); draw(); return draw;
  }

  /* Training memory per GPU: weights, gradients, optimizer state */
  function mem(el) {
    const methods = { ddp: 'Full training, plain DDP', z1: 'ZeRO-1 (shard optimizer)', z2: 'ZeRO-2 (+ gradients)', z3: 'ZeRO-3 / FSDP (+ weights)', lora: 'LoRA on a BF16 base', qlora: 'QLoRA on a 4-bit base' };
    const start = el.dataset.start && methods[el.dataset.start] ? el.dataset.start : 'ddp';
    el.innerHTML = `<div class="controls"><label>Model <select data-n>${[1, 7, 13, 70, 405].map(n => `<option value="${n}" ${n === 7 ? 'selected' : ''}>${n}B</option>`).join('')}</select></label>
      <label>Method <select data-m>${Object.keys(methods).map(k => `<option value="${k}" ${k === start ? 'selected' : ''}>${methods[k]}</option>`).join('')}</select></label>
      <label>GPUs d <select data-d>${[1, 2, 4, 8, 16, 32, 64, 128, 256].map(n => `<option ${n === 8 ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div><div class="out"></div><div class="readout"></div>`;
    const draw = () => {
      const N = +el.querySelector('[data-n]').value * 1e9, m = el.querySelector('[data-m]').value, single = m === 'lora' || m === 'qlora';
      const dSel = el.querySelector('[data-d]'); dSel.disabled = single || m === 'ddp';
      const d = single || m === 'ddp' ? 1 : +dSel.value, a = 0.006 * N; // adapters: ~0.6% of the parameters (rank 16 on every linear layer)
      let parts;
      if (m === 'ddp') parts = [2 * N, 2 * N, 12 * N];
      else if (m === 'z1') parts = [2 * N, 2 * N, 12 * N / d];
      else if (m === 'z2') parts = [2 * N, 2 * N / d, 12 * N / d];
      else if (m === 'z3') parts = [2 * N / d, 2 * N / d, 12 * N / d];
      else parts = [(m === 'lora' ? 2 : 4.127 / 8) * N + 2 * a, 2 * a, 12 * a];
      const tot = parts.reduce((x, y) => x + y, 0), GB = x => (x / 1e9).toFixed(x < 1e10 ? 1 : 0);
      const scale = Math.max(tot, 80e9) * 1.08, names = ['weights', 'gradients', 'optimizer state'];
      el.querySelector('.out').innerHTML = `<div class="stack">${parts.map((p, i) => `<i class="s${i}" style="width:${p / scale * 100}%" title="${names[i]}"></i>`).join('')}<span class="gpu-line" style="left:${80e9 / scale * 100}%"></span></div>
        <div class="legend">${parts.map((p, i) => `<span><i class="s${i}"></i>${names[i]} ${GB(p)} GB</span>`).join('')}<span class="muted">dashed line = one 80 GB GPU</span></div>`;
      el.querySelector('.readout').innerHTML = `<strong>${GB(tot)} GB per GPU</strong>, before activations. ${tot <= 80e9 ? 'Fits on one 80 GB GPU (if activations do too).' : 'Does not fit on one 80 GB GPU.'} ${single ? 'Adapters assumed to be about 0.6% of the parameters; only they carry gradients and Adam state.' : m === 'ddp' ? 'Plain DDP keeps a full copy on every GPU, so adding GPUs does not help.' : `Each of the ${d} GPUs holds 1/${d} of the sharded parts.`}`;
    };
    el.querySelectorAll('select').forEach(s => s.addEventListener('change', draw)); draw(); return draw;
  }

  /* Bradley-Terry / DPO: probability and loss as a function of the score gap */
  function bt(el) {
    const dpo = el.dataset.start === 'dpo', lab = dpo ? 'β · margin' : 'reward gap r_w − r_l';
    el.innerHTML = `<div class="controls">${sliderHTML('g', lab, -5, 5, 0.1, 0.8)}</div>`;
    const c = canvas(el), out = document.createElement('div'); out.className = 'readout'; el.appendChild(out);
    const draw = () => {
      const g = val(el, 'g'), pts = []; for (let i = 0; i <= 200; i++) { const x = -5 + 10 * i / 200; pts.push([x, -log(sig(x))]); }
      plot(c, { x0: -5, x1: 5, y0: 0, y1: 5.2, line: pts, dot: [g, -log(sig(g))], xticks: [-4, -2, 0, 2, 4], yticks: [0, 2.5, 5], yfmt: t => t.toFixed(1) });
      out.innerHTML = `Curve: the loss −log σ(x). At ${lab} = ${g.toFixed(1)}: P(chosen wins) = σ = <strong>${sig(g).toFixed(3)}</strong>, loss = <strong>${(-log(sig(g))).toFixed(3)}</strong>, gradient weight σ(−x) = ${sig(-g).toFixed(3)}. ${g < 0 ? 'Wrong order: big loss and a strong push.' : g > 3 ? 'Well ordered: the loss has almost let go.' : ''}${dpo && Math.abs(g) < 0.05 ? ' At the start of DPO the policy equals the reference, so x = 0 and the loss is log 2 ≈ 0.693.' : ''}`;
    };
    bindSliders(el, draw); draw(); return draw;
  }

  /* GRPO group-relative advantages */
  function grpo(el) {
    const r = [0, 1, 0, 0, 1, 0, 1, 0];
    el.innerHTML = `<div class="controls"><span>Click an answer to mark it right or wrong.</span><label><input type="checkbox" data-dr> Dr. GRPO (no division by std)</label></div><div class="toggles"></div><div class="out"></div><div class="readout"></div>`;
    const draw = () => {
      const dr = el.querySelector('[data-dr]').checked, G = r.length, mean = r.reduce((a, b) => a + b, 0) / G;
      const sd = sqrt(r.reduce((a, b) => a + (b - mean) ** 2, 0) / G), adv = r.map(x => dr ? x - mean : (x - mean) / (sd + 1e-6));
      const big = Math.max(1, ...adv.map(Math.abs));
      el.querySelector('.toggles').innerHTML = r.map((x, i) => `<button type="button" class="chip tog ${x ? 'ok' : 'no'}" data-i="${i}">#${i + 1} ${x ? '✓' : '✗'}</button>`).join('');
      el.querySelectorAll('.tog').forEach(b => b.addEventListener('click', () => { r[+b.dataset.i] ^= 1; draw(); }));
      el.querySelector('.out').innerHTML = hbars(adv.map((a, i) => ({ label: `answer ${i + 1}`, v: a / big, text: (a >= 0 ? '+' : '') + a.toFixed(2) })), { signed: true });
      el.querySelector('.readout').innerHTML = sd === 0 ? '<strong>Every answer got the same reward, so every advantage is 0.</strong> This question produced no gradient, after paying for 8 generations.' :
        `Group mean ${mean.toFixed(3)}, std ${sd.toFixed(3)}. Right answers go up, wrong ones go down, and the advantages sum to zero. ${dr ? 'Dr. GRPO keeps r − mean only.' : 'Fewer correct answers give each one a bigger push.'}`;
    };
    el.querySelector('[data-dr]').addEventListener('change', draw); draw(); return draw;
  }

  /* pass@k = 1 - C(n-c, k) / C(n, k) */
  function passk(el) {
    el.innerHTML = `<div class="controls">${sliderHTML('n', 'samples n', 1, 100, 1, 10)}${sliderHTML('c', 'correct c', 0, 10, 1, 2)}${sliderHTML('k', 'k', 1, 10, 1, 5)}</div>`;
    const c = canvas(el), out = document.createElement('div'); out.className = 'readout'; el.appendChild(out);
    const pk = (n, cc, k) => n - cc < k ? 1 : 1 - exp(lchoose(n - cc, k) - lchoose(n, k));
    const draw = () => {
      const n = val(el, 'n'), ci = el.querySelector('[data-k="c"]'), ki = el.querySelector('[data-k="k"]');
      ci.max = n; ki.max = n; if (+ci.value > n) ci.value = n; if (+ki.value > n) ki.value = n;
      el.querySelector('[data-v="c"]').textContent = ci.value; el.querySelector('[data-v="k"]').textContent = ki.value;
      const cc = +ci.value, k = +ki.value, pts = []; for (let j = 1; j <= n; j++) pts.push([j, pk(n, cc, j)]);
      plot(c, { x0: 0.5, x1: n + 0.5, y0: 0, y1: 1.02, line: pts, dot: [k, pk(n, cc, k)], xticks: (() => { const st = Math.max(1, Math.ceil((n - 1) / 8)), o = []; for (let j = 1; j <= n; j += st) o.push(j); return o; })(), yticks: [0, 0.5, 1] });
      out.innerHTML = `Curve: pass@k for every k from these n samples. pass@1 = c/n = <strong>${(cc / n).toFixed(3)}</strong>; pass@${k} = <strong>${pk(n, cc, k).toFixed(3)}</strong>, the chance that a random ${k} of the ${n} samples contain at least one of the ${cc} correct ones.`;
    };
    bindSliders(el, draw); draw(); return draw;
  }

  const KINDS = { dist, clt, lik, softmax, lsh, chinchilla, mem, bt, grpo, passk };
  let live = [];
  window.StudyWidgets = {
    mount(root) {
      live = [];
      root.querySelectorAll('[data-widget]').forEach(el => { const k = el.dataset.widget.split(':'); el.dataset.start = k[1] || ''; if (KINDS[k[0]]) live.push(KINDS[k[0]](el)); });
    }
  };
  let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => live.forEach(f => f && f()), 150); });
})();
