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
    (o.xticks || []).forEach(t => g.fillText(String(t), X(t), h - 8));
    g.textAlign = 'right';
    (o.yticks || []).forEach(t => g.fillText(o.yfmt ? o.yfmt(t) : t.toFixed(2), L - 4, Y(t) + 4));
    if (o.bars) { g.fillStyle = acc; g.globalAlpha = 0.8; o.bars.forEach(b => { const x = X(b.x - b.w / 2), x2 = X(b.x + b.w / 2); g.fillRect(x + 0.5, Y(b.y), max(1, x2 - x - 1), Y(o.y0) - Y(b.y)); }); g.globalAlpha = 1; }
    const path = (pts, color, width) => { g.strokeStyle = color; g.lineWidth = width; g.beginPath(); pts.forEach((p, i) => { const y = max(o.y0, min(o.y1, p[1])); i ? g.lineTo(X(p[0]), Y(y)) : g.moveTo(X(p[0]), Y(y)); }); g.stroke(); };
    if (o.line) path(o.line, acc, 2.5);
    if (o.overlay) path(o.overlay, good, 2);
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

  const KINDS = { dist, clt, lik };
  let live = [];
  window.StudyWidgets = {
    mount(root) {
      live = [];
      root.querySelectorAll('[data-widget]').forEach(el => { const k = el.dataset.widget.split(':'); el.dataset.start = k[1] || ''; if (KINDS[k[0]]) live.push(KINDS[k[0]](el)); });
    }
  };
  let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => live.forEach(f => f && f()), 150); });
})();
