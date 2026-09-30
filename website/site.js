(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const Y = today.getFullYear();
  const M = today.getMonth();
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- helpers ----------
  function rng(seed) {
    let s = seed;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  }
  const level = (n) => (n <= 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n <= 4 ? 3 : 4);
  const SEEDS = { me: [7, 0.8], mia: [11, 0.82], jun: [29, 0.55], ari: [53, 0.68], grow: [5, 0.78] };

  /** Render a Monday-first month into el. Returns the list of past-day cells. */
  function renderMonth(el) {
    const key = el.dataset.grid;
    const [seed, rate] = SEEDS[key] || [1, 0.6];
    const r = rng(seed);
    const mini = el.classList.contains('mini');
    const lead = (new Date(Y, M, 1).getDay() + 6) % 7;
    const days = new Date(Y, M + 1, 0).getDate();
    let html = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<span class="wd">${d}</span>`).join('');
    for (let k = 0; k < lead; k++) html += '<i class="pad"></i>';
    for (let d = 1; d <= days; d++) {
      const date = new Date(Y, M, d);
      const isToday = +date === +today;
      if (date > today) {
        html += `<i class="future">${mini ? '' : d}</i>`;
        continue;
      }
      let n = r() < rate ? 1 + Math.floor(r() * 5) : 0;
      if (isToday && el.hasAttribute('data-live')) n = 1;
      html += `<i class="l${level(n)}${isToday ? ' today' : ''}" data-n="${n}">${mini ? '' : d}</i>`;
    }
    el.innerHTML = html;
    return $$('i[data-n]', el);
  }

  $$('[data-grid]').forEach(renderMonth);
  $$('[data-month-title]').forEach((el) => (el.innerHTML = `${MONTHS[M]} <span>${Y}</span>`));
  $$('[data-year-now]').forEach((el) => (el.textContent = String(Y)));

  // ---------- "green" in the headline, filled with grid squares ----------
  const growWord = $('.hero h1 .grow');
  if (growWord) {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const pal = dark ? ['#8DF08A', '#3DBB57', '#86DB6E', '#23883F', '#C5F0B4'] : ['#86DB6E', '#3DBB57', '#23883F', '#157F3B', '#3DBB57'];
    const c = document.createElement('canvas');
    const N = 6, cell = 20;
    c.width = c.height = N * cell;
    const ctx = c.getContext('2d');
    const r = rng(42);
    for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) {
      ctx.fillStyle = pal[Math.floor(r() * pal.length)];
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
    growWord.style.backgroundImage = `url(${c.toDataURL()})`;
    growWord.classList.add('mosaic');
  }

  // ---------- scroll reveal ----------
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          e.target.dispatchEvent(new CustomEvent('visible'));
          io.unobserve(e.target);
        }),
        { threshold: 0.18, rootMargin: '0px 0px -40px 0px' },
      )
    : null;
  $$('[data-reveal]').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));
  const whenVisible = (el, fn) => {
    if (!el) return;
    if (!io || reduce) return fn();
    el.addEventListener('visible', fn, { once: true });
  };

  // ---------- hero phone: wins keep arriving ----------
  const WINS = [
    ['Finished assignment draft', '#7CC4FF'],
    ['5km run', '#FF6F91'],
    ['Closing shift, 6 hours', '#FFB443'],
    ['Pushed 4 commits', '#B9A6FF'],
    ['Meal prep for the week', '#6FE0C8'],
    ['Edited a 30s reel', '#FFE45C'],
    ['Read 20 pages', '#7CC4FF'],
    ['Bouldering session', '#FF6F91'],
  ];
  const phone = $('#hero-phone');
  const winsEl = $('[data-wins]');
  const countEl = $('[data-count]');
  const labelEl = $('[data-count-label]');
  const weekEl = $('[data-week]');
  const todayCell = $('[data-grid="me"] i.today');
  let count = 1;
  let wi = 0;

  function burst(emoji) {
    if (!phone) return;
    const b = document.createElement('span');
    b.className = 'burst';
    b.textContent = emoji;
    b.style.left = `${40 + Math.random() * 50}%`;
    b.style.top = '42%';
    b.style.setProperty('--dx', `${(Math.random() - 0.5) * 60}px`);
    phone.parentElement.appendChild(b);
    const rect = phone.getBoundingClientRect();
    const stage = phone.parentElement.getBoundingClientRect();
    b.style.left = `${rect.left - stage.left + rect.width * (0.3 + Math.random() * 0.4)}px`;
    b.style.top = `${rect.top - stage.top + rect.height * 0.35}px`;
    setTimeout(() => b.remove(), 2300);
  }

  /** Emoji that floats up from any element. */
  function burstAt(target, emoji) {
    if (reduce || !target) return;
    const r = target.getBoundingClientRect();
    const b = document.createElement('span');
    b.className = 'burst fx';
    b.textContent = emoji;
    b.style.left = `${r.left + r.width / 2 - 13 + (Math.random() - 0.5) * 20}px`;
    b.style.top = `${r.top - 6}px`;
    b.style.setProperty('--dx', `${(Math.random() - 0.5) * 70}px`);
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 2300);
  }

  // the hero glow takes on the colour of each new win
  const aurora = $$('[data-aurora] i');
  let auroraN = 0;
  const tintAurora = (color) => {
    if (!aurora.length) return;
    aurora[1 + (auroraN++ % 2)].style.backgroundColor = color;
  };

  function addWin() {
    if (count >= 5) {
      // new day: reset quietly
      count = 0;
      winsEl.innerHTML = '';
    }
    const [text, color] = WINS[wi++ % WINS.length];
    const row = document.createElement('div');
    row.className = 'win new';
    row.innerHTML = `<span class="dot" style="background:${color}"></span><span class="t"></span><span class="when">now</span>`;
    row.querySelector('.t').textContent = text;
    tintAurora(color);
    $$('.win .when', winsEl).forEach((w) => { if (w.textContent === 'now') w.textContent = '1m'; });
    winsEl.prepend(row);
    while (winsEl.children.length > 3) winsEl.lastElementChild.remove();
    count++;
    countEl.textContent = String(count);
    countEl.classList.remove('tick'); void countEl.offsetWidth; countEl.classList.add('tick');
    labelEl.innerHTML = `${count === 1 ? 'thing' : 'things'} done<br>today`;
    weekEl.textContent = String(16 + count);
    if (todayCell) {
      todayCell.className = `l${level(count)} today bump`;
      setTimeout(() => todayCell.classList.remove('bump'), 400);
    }
    if (count % 2 === 0) {
      burst('🔥');
      const f = $('[data-k-fire]');
      if (f) f.textContent = String(parseInt(f.textContent, 10) % 6 + 1);
    }
  }
  if (phone && !reduce) {
    setTimeout(function loop() {
      if (!document.hidden) addWin();
      setTimeout(loop, 2800);
    }, 1600);
  }

  // ---------- gentle parallax on the floating cards ----------
  const floats = $$('.float[data-depth]');
  if (floats.length && !reduce) {
    let mx = 0, my = 0, sy = 0, ticking = false;
    const apply = () => {
      ticking = false;
      floats.forEach((f) => {
        const d = parseFloat(f.dataset.depth);
        f.style.transform = `translate(${mx * d * 18}px, ${my * d * 14 - sy * d * 0.12}px)`;
      });
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } };
    window.addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; req(); }, { passive: true });
    window.addEventListener('scroll', () => { sy = scrollY; req(); }, { passive: true });
  }

  // ---------- feature demos ----------
  // 1) typing a win: plays on its own until someone tries it
  const typeCard = $('[data-demo="type"]');
  if (typeCard) {
    const input = $('[data-typed]', typeCard);
    const list = $('[data-typed-list]', typeCard);
    const go = $('.go', typeCard);
    const cats = $$('.cats button', typeCard);
    let color = '#7CC4FF';
    let userOn = false;
    const addRow = (t, c, when = 'now') => {
      const row = document.createElement('div');
      row.className = 'win new';
      row.innerHTML = `<span class="dot" style="background:${c}"></span><span class="t"></span><span class="when">${when}</span>`;
      row.querySelector('.t').textContent = t;
      list.prepend(row);
      while (list.children.length > 3) list.lastElementChild.remove();
    };
    const takeOver = () => {
      if (userOn) return;
      userOn = true;
      input.value = '';
      list.innerHTML = '';
    };
    const pickCat = (b) => {
      cats.forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      color = b.dataset.c;
    };
    const log = () => {
      takeOver();
      const t = input.value.trim();
      if (t.length < 3) {
        input.classList.remove('nope'); void input.offsetWidth; input.classList.add('nope');
        input.focus();
        return;
      }
      addRow(t, color);
      input.value = '';
      input.focus();
      ['🌱', '🔥', '🌱'].forEach((e, k) => setTimeout(() => burstAt(go, e), k * 140));
    };
    ['pointerdown', 'focus', 'keydown'].forEach((ev) => input.addEventListener(ev, takeOver));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); log(); } });
    go.addEventListener('click', log);
    cats.forEach((b) => b.addEventListener('click', () => { takeOver(); pickCat(b); }));

    whenVisible(typeCard, async () => {
      const lines = [['Lecture notes, week 9', 0], ['Laundry, finally', 4], ['Guitar practice', 2]];
      if (reduce) { lines.forEach(([t, ci]) => addRow(t, cats[ci].dataset.c)); return; }
      for (;;) {
        for (const [t, ci] of lines) {
          if (userOn) return;
          pickCat(cats[ci]);
          for (const ch of t) { if (userOn) return; input.value += ch; await sleep(55 + Math.random() * 60); }
          await sleep(350);
          if (userOn) return;
          go.classList.add('press'); await sleep(150); go.classList.remove('press');
          addRow(t, cats[ci].dataset.c);
          input.value = '';
          await sleep(900);
        }
        await sleep(1500);
        if (userOn) return;
        list.innerHTML = '';
      }
    });
  }

  // 2) month filling in
  const gridCard = $('[data-demo="grid"]');
  whenVisible(gridCard, async () => {
    const cells = $$('[data-grid="grow"] i[data-n]', gridCard);
    const finals = cells.map((c) => c.className);
    if (reduce) return;
    for (;;) {
      cells.forEach((c) => (c.className = c.classList.contains('today') ? 'l0 today' : 'l0'));
      await sleep(500);
      for (let i = 0; i < cells.length; i++) {
        cells[i].className = finals[i] + ' bump';
        const cell = cells[i];
        setTimeout(() => cell.classList.remove('bump'), 300);
        await sleep(90);
      }
      await sleep(3500);
    }
  });

  // 3) squad: friends' today squares breathe
  const squadCard = $('[data-demo="squad"]');
  whenVisible(squadCard, async () => {
    if (reduce) return;
    const todays = $$('i.today', squadCard);
    for (let n = 1; ; n = (n % 4) + 1) {
      todays.forEach((t, i) => { t.className = `l${Math.min(4, n + i)} today bump`; setTimeout(() => t.classList.remove('bump'), 350); });
      await sleep(1800);
    }
  });

  // 4) kudos: pops on its own until someone taps one
  const kudosCard = $('[data-demo="kudos"]');
  if (kudosCard) {
    const btns = $$('[data-kudos] button', kudosCard);
    const counts = btns.map((b) => parseInt(b.querySelector('b').textContent || '0', 10));
    let userOn = false;
    const toggle = (i, fromUser) => {
      const b = btns[i];
      const on = b.classList.toggle('on');
      b.setAttribute('aria-pressed', String(on));
      counts[i] += on ? 1 : -1;
      b.querySelector('b').textContent = counts[i] > 0 ? String(counts[i]) : '';
      b.classList.add('pop');
      setTimeout(() => b.classList.remove('pop'), 280);
      if (fromUser && on) for (let k = 0; k < 4; k++) setTimeout(() => burstAt(b, b.dataset.k), k * 110);
    };
    btns.forEach((b, i) => b.addEventListener('click', () => {
      if (!userOn) {
        userOn = true;
        btns.forEach((x, k) => { if (x.classList.contains('on')) toggle(k, false); });
      }
      toggle(i, true);
    }));
    whenVisible(kudosCard, async () => {
      if (reduce) return;
      for (let i = 0; ; i = (i + 1) % btns.length) {
        await sleep(1100);
        if (userOn) return;
        toggle(i, false);
      }
    });
  }

  // ---------- crossed bands ----------
  const BAND = {
    wins: [['Lecture notes', '#7CC4FF'], ['5km run', '#FF6F91'], ['Closing shift', '#FFB443'], ['Shipped a feature', '#B9A6FF'],
      ['Meal prep', '#6FE0C8'], ['Sketchbook page', '#FFE45C'], ['40 flashcards', '#7CC4FF'], ['Bouldering', '#FF6F91'],
      ['Laundry, finally', '#6FE0C8'], ['Fixed the flaky test', '#B9A6FF'], ['Recorded a demo', '#FFE45C'], ['Weekly update', '#FFB443']],
    kudos: [['🔥 Jun sent Mia kudos', '#3DBB57'], ['💪 Ari cheered you on', '#8DF08A'], ['🌱 Your plant grew a leaf', '#3DBB57'],
      ['👏 Mia sent Jun kudos', '#86DB6E'], ['🔥 Full squad day', '#3DBB57'], ['🌻 Ari is on a 6 day streak', '#8DF08A'],
      ['💬 Mia left you a note', '#86DB6E'], ['🌿 Jun started a focus session', '#3DBB57'], ['✅ Ticked off: lab report', '#8DF08A']],
  };
  $$('[data-marquee]').forEach((track) => {
    const items = BAND[track.dataset.marquee] || [];
    const html = items.map(([t, c]) => `<span class="it"><span class="sq" style="background:${c}"></span>${t}</span>`).join('');
    track.innerHTML = html + html; // doubled for a seamless loop
  });

  // ---------- a year of squares (paintable) ----------
  const yearEl = $('[data-year]');
  if (yearEl) {
    const start = new Date(Y, 0, 1);
    const lead = (start.getDay() + 6) % 7;
    const VALUE = [0, 1, 2, 3, 5]; // things done that a painted level stands for
    let ns = [];
    const example = () => {
      const r = rng(17);
      // a little ramp-up through the year, like a real habit forming
      return Array.from({ length: 365 }, (_, d) => (r() < 0.35 + 0.5 * (d / 365) ? 1 + Math.floor(r() * 5) : 0));
    };
    ns = example();
    let html = '';
    for (let k = 0; k < lead; k++) html += '<i style="visibility:hidden"></i>';
    for (let d = 0; d < 365; d++) html += `<i data-i="${d}" class="l${level(ns[d])}" style="--w:${Math.floor((d + lead) / 7)}"></i>`;
    yearEl.innerHTML = html;
    const cells = $$('i[data-i]', yearEl);
    const statEls = $$('[data-stat]');
    const compute = () => {
      let days = 0, wins = 0, run = 0, best = 0;
      ns.forEach((n) => { if (n) { days++; wins += n; run++; best = Math.max(best, run); } else run = 0; });
      return { days, wins, streak: best };
    };
    const showStats = () => { const st = compute(); statEls.forEach((el) => (el.textContent = String(st[el.dataset.stat]))); };
    const paint = (i, lv) => {
      ns[i] = VALUE[lv];
      const c = cells[i];
      c.className = `l${lv} painted`;
      setTimeout(() => c.classList.remove('painted'), 350);
    };
    const setAll = (arr) => { ns = arr; cells.forEach((c, i) => (c.className = `l${level(ns[i])}`)); showStats(); };

    let painting = false, paintLv = 0;
    yearEl.addEventListener('pointerdown', (e) => {
      const c = e.target.closest('i[data-i]');
      if (!c) return;
      const i = +c.dataset.i;
      paintLv = (level(ns[i]) + 1) % 5;
      paint(i, paintLv);
      showStats();
      painting = e.pointerType === 'mouse';
      if (painting) e.preventDefault();
    });
    yearEl.addEventListener('pointerover', (e) => {
      if (!painting) return;
      const c = e.target.closest('i[data-i]');
      if (!c || level(ns[+c.dataset.i]) === paintLv) return;
      paint(+c.dataset.i, paintLv);
      showStats();
    });
    window.addEventListener('pointerup', () => (painting = false));
    $('[data-year-clear]')?.addEventListener('click', () => setAll(ns.map(() => 0)));
    $('[data-year-example]')?.addEventListener('click', () => setAll(example()));

    const countUp = (el, to) => {
      if (reduce) { el.textContent = String(to); return; }
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / 1400);
        el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    whenVisible(yearEl.closest('[data-reveal]'), () => {
      yearEl.classList.add('on');
      const st = compute();
      statEls.forEach((el) => countUp(el, st[el.dataset.stat]));
      setTimeout(() => yearEl.classList.add('live'), reduce ? 0 : 2200);
    });
  }

  // ---------- vines ----------
  const NS = 'http://www.w3.org/2000/svg';
  const LEAF = 'M0,0 C 18,-26 62,-34 96,-6 C 70,26 26,24 0,0 Z';
  const BUDS = ['var(--g1)', 'var(--g2)', 'var(--g3)', 'var(--g4)'];
  let gradN = 0;
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (parent) parent.appendChild(n);
    return n;
  };

  function buildVines(svg) {
    const paths = JSON.parse(svg.dataset.vine);
    const id = `leafgrad${gradN++}`;
    const defs = el('defs', {}, svg);
    const g = el('linearGradient', { id, x1: '0', y1: '0', x2: '1', y2: '0' }, defs);
    el('stop', { offset: '0', 'stop-color': '#3DBB57' }, g);
    el('stop', { offset: '1', 'stop-color': '#A6E57F' }, g);
    const r = rng(paths.join('').length);
    const DRAW = 2.4;

    paths.forEach((d, pi) => {
      const main = pi === 0;
      const grp = el('g', {}, svg);
      const shadow = el('path', { d, class: 'stem-shadow' }, grp);
      const stem = el('path', { d, class: `stem${main ? '' : ' thin'}` }, grp);
      const len = stem.getTotalLength();
      const dur = DRAW * (main ? 1 : 0.8);
      [shadow, stem].forEach((p) => { p.style.setProperty('--len', len); p.style.setProperty('--dur', `${dur}s`); });
      const start = pi * 0.25;
      if (start) [shadow, stem].forEach((p) => (p.style.animationDelay = `${start}s`));

      // leaves along the stem, alternating sides, bigger near the edge
      const step = main ? 58 : 50;
      let side = 1;
      for (let s = 50; s < len - 24; s += step + r() * 18) {
        const p = stem.getPointAtLength(s);
        const q = stem.getPointAtLength(Math.min(len, s + 2));
        const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
        const t = s / len;
        const size = (main ? 0.95 : 0.7) * (1.15 - 0.55 * t) * (0.85 + r() * 0.3);
        const at = el('g', { transform: `translate(${p.x.toFixed(1)},${p.y.toFixed(1)}) rotate(${(ang + side * (48 + r() * 18)).toFixed(1)})` }, grp);
        const grow = el('g', { class: 'grow' }, at);
        grow.style.setProperty('--delay', `${(start + dur * t * 0.9 + 0.1).toFixed(2)}s`);
        el('path', { d: LEAF, class: 'leaf', fill: `url(#${id})`, transform: `scale(${size.toFixed(2)})` }, grow);
        el('path', { d: 'M4,-2 C 30,-10 58,-12 84,-6', class: 'rib', transform: `scale(${size.toFixed(2)})` }, grow);
        side = -side;
      }

      // a bud at the tip: one of the grid's green squares, the app's signature
      const tip = stem.getPointAtLength(len);
      const at = el('g', { transform: `translate(${tip.x.toFixed(1)},${tip.y.toFixed(1)}) rotate(${(r() * 20 - 10).toFixed(1)})` }, grp);
      const grow = el('g', { class: 'grow' }, at);
      grow.style.setProperty('--delay', `${(start + dur * 0.92).toFixed(2)}s`);
      const b = main ? 34 : 24;
      // soft contact shadow, the glazed square, then a highlight across its top
      el('rect', { x: -b / 2 + 1, y: -b / 2 + 5, width: b, height: b, rx: b * 0.28, class: 'bud-shadow' }, grow);
      el('rect', { x: -b / 2, y: -b / 2, width: b, height: b, rx: b * 0.28, class: 'bud', fill: BUDS[(pi + 2) % 4] }, grow);
      el('rect', { x: -b / 2 + 2.5, y: -b / 2 + 2, width: b - 5, height: b * 0.4, rx: b * 0.2, class: 'bud-gloss' }, grow);
    });
  }

  $$('svg[data-vine]').forEach((svg) => {
    buildVines(svg);
    const go = () => svg.classList.add('go');
    if (reduce) return go();
    if (svg.hasAttribute('data-on-visible') && io) {
      const holder = svg.closest('section') || svg;
      const vio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { go(); vio.disconnect(); } }), { threshold: 0.1 });
      vio.observe(holder);
    } else setTimeout(go, 200);
  });

  // vines drift outward as you scroll past the hero, like curtains opening
  const heroVines = $$('.stage > .vines .vine');
  if (heroVines.length && !reduce) {
    let queued = false;
    const onScroll = () => {
      queued = false;
      const y = Math.min(scrollY, 900);
      heroVines[0].style.translate = `${-y * 0.18}px ${y * 0.08}px`;
      if (heroVines[1]) heroVines[1].style.translate = `${y * 0.18}px ${y * 0.05}px`;
    };
    window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }, { passive: true });
  }

  // ---------- the garden ----------
  const garden = $('[data-garden]');
  if (garden) {
    const r = rng(99);
    const n = Math.max(10, Math.ceil(innerWidth / 64));
    for (let i = 0; i < n; i++) {
      const h = 70 + r() * 150;
      const w = 70 + r() * 30;
      const svg = el('svg', { viewBox: `0 0 100 ${h}`, width: w, height: h });
      const bend = (r() - 0.5) * 18;
      const top = 30;
      el('path', { d: `M50 ${h} C ${50 + bend} ${h * 0.6}, ${50 - bend} ${top + 30}, 50 ${top}`, fill: 'none', stroke: 'var(--g3)', 'stroke-width': 5, 'stroke-linecap': 'round' }, svg);
      const s = 0.45 + r() * 0.25;
      el('path', { d: LEAF, fill: i % 3 ? 'var(--g3)' : 'var(--g2)', transform: `translate(50 ${top}) rotate(${-150 - r() * 20}) scale(${s})` }, svg);
      el('path', { d: LEAF, fill: i % 2 ? 'var(--g2)' : 'var(--g1)', transform: `translate(50 ${top}) rotate(${-30 + r() * 20}) scale(${s * 0.9})` }, svg);
      if (r() < 0.35) {
        const b = 14;
        el('rect', { x: 50 - b / 2, y: top - 22, width: b, height: b, rx: 4, fill: BUDS[i % 4], stroke: 'var(--line)', 'stroke-width': 2 }, svg);
      }
      svg.style.setProperty('--delay', `${(Math.abs(i - n / 2) / n) * 1.2}s`);
      if (r() < 0.6) svg.classList.add('swaying');
      garden.appendChild(svg);
    }
    const grow = () => garden.classList.add('go');
    if (reduce || !io) grow();
    else {
      const gio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { grow(); gio.disconnect(); } }), { threshold: 0.2 });
      gio.observe(garden);
    }
  }

  // ---------- the squad plant: grows as you scroll ----------
  // Geometry ported from src/lib/plant.ts and drawing from src/components/squad/Plant.tsx, so it matches the app.
  const plantSec = $('[data-plant]');
  if (plantSec) {
    const STAGES = [['Seed', 0], ['Sprout', 10], ['Seedling', 35], ['Sapling', 90], ['Bush', 180], ['Flowering', 320], ['Fruiting', 520]];
    const MEMBER_COLORS = ['#7CC4FF', '#FF6F91', '#FFB443', '#B9A6FF', '#6FE0C8', '#FFE45C', '#FF9D5C', '#9BE15D', '#E58CFF', '#5CC8FF'];
    const LEAVES_BY_STAGE = [0, 2, 4, 8, 14, 16, 18];
    const MEMBERS = [{ recent_days: 6 }, { recent_days: 5 }, { recent_days: 4 }, { recent_days: 6 }];
    const PLEAF = 'M0,0 C 12,-16 38,-20 58,-4 C 42,14 14,14 0,0 Z';
    const PRIB = 'M4,-1 C 18,-6 34,-7 50,-4';
    const INK = '#131B33';

    const stageFor = (g) => {
      let i = 0;
      while (i + 1 < STAGES.length && g >= STAGES[i + 1][1]) i++;
      const next = STAGES[i + 1];
      return { index: i, name: STAGES[i][0], progress: next ? Math.min(1, (g - STAGES[i][1]) / (next[1] - STAGES[i][1])) : 1, next: next && next[0] };
    };
    const prng = (seed) => { let x = seed % 2147483647 || 1; return () => (x = (x * 16807) % 2147483647) / 2147483647; };
    const hashString = (str) => { let h = 7; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 2147483647; return h; };
    function assignLeaves(count, members) {
      const w = members.map((m) => Math.max(0, m.recent_days));
      const total = w.reduce((a, b) => a + b, 0);
      if (!count || !total) return Array.from({ length: count }, (_, i) => i % members.length);
      const exact = w.map((x) => (x / total) * count);
      const base = exact.map(Math.floor);
      let left = count - base.reduce((a, b) => a + b, 0);
      exact.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { base[i]++; left--; } });
      const out = [], pool = base.slice();
      while (out.length < count) for (let i = 0; i < pool.length && out.length < count; i++) if (pool[i] > 0) { out.push(i); pool[i]--; }
      return out;
    }
    function plantModel(stage, progress, health, drooping, members, seedKey) {
      const r = prng(hashString(seedKey));
      if (stage === 0) return { stems: [], leaves: [], blossoms: [], seed: true };
      const heights = [0, 34, 60, 88, 104, 112, 116];
      const h = heights[stage] + (stage < 6 ? (heights[stage + 1] - heights[stage]) * progress * 0.8 : 0);
      const baseY = 170, topY = baseY - h;
      const sway = (r() - 0.5) * 16;
      const stems = [`M100 ${baseY} C ${100 + sway} ${baseY - h * 0.45}, ${100 - sway} ${baseY - h * 0.75}, 100 ${topY}`];
      const n = LEAVES_BY_STAGE[stage];
      const owners = assignLeaves(n, members);
      const leaves = [], blossoms = [];
      const vigour = 0.78 + 0.32 * Math.min(1, health);
      const droop = drooping ? 38 : 0;
      const at = (t) => {
        const p0 = [100, baseY], p1 = [100 + sway, baseY - h * 0.45], p2 = [100 - sway, baseY - h * 0.75], p3 = [100, topY];
        const u = 1 - t;
        return { x: u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0], y: u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1] };
      };
      if (stage <= 2) {
        const top = at(1);
        leaves.push({ x: top.x, y: top.y, angle: -150 + droop * -0.5 + (r() - 0.5) * 8, size: 0.95 * vigour, member: owners[0] ?? 0 });
        leaves.push({ x: top.x, y: top.y, angle: -30 + droop * 0.5 + (r() - 0.5) * 8, size: 0.9 * vigour, member: owners[1] ?? 0 });
        for (let i = 2; i < n; i++) {
          const p = at(0.55 + (i - 2) * 0.12);
          const side = i % 2 ? 1 : -1;
          leaves.push({ x: p.x, y: p.y, angle: side > 0 ? -25 + droop : -155 - droop, size: 0.7 * vigour, member: owners[i] ?? 0 });
        }
      } else {
        const branchCount = stage >= 4 ? 4 : 0;
        const tips = [];
        for (let b = 0; b < branchCount; b++) {
          const p = at(0.3 + b * 0.16);
          const side = b % 2 ? 1 : -1;
          const len = (34 - b * 4) * (0.9 + r() * 0.2);
          const tip = { x: p.x + side * len, y: p.y - len * 0.7 };
          stems.push(`M${p.x.toFixed(1)} ${p.y.toFixed(1)} Q ${(p.x + side * len * 0.6).toFixed(1)} ${(p.y - 4).toFixed(1)}, ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}`);
          tips.push(tip);
        }
        const anchors = [...tips, at(1)];
        for (let i = 0; i < n; i++) {
          let x, y, base;
          if (i < anchors.length * 2 && stage >= 4) { const a = anchors[Math.floor(i / 2)]; x = a.x; y = a.y; base = i % 2 ? -35 : -145; }
          else { const p = at(0.22 + ((i * 0.618) % 1) * 0.72); x = p.x; y = p.y; base = i % 2 ? -28 : -152; }
          const d = base > -90 ? droop : -droop;
          leaves.push({ x, y, angle: base + d + (r() - 0.5) * 14, size: (0.62 + r() * 0.22) * vigour, member: owners[i] ?? 0 });
        }
        if (stage >= 5 && !drooping) anchors.forEach((a, i) => blossoms.push({ x: a.x + (i % 2 ? 4 : -4), y: a.y - 8, kind: stage >= 6 && i % 2 === 0 ? 'fruit' : 'flower' }));
      }
      return { stems, leaves, blossoms, seed: false };
    }

    function drawPlant(m, drooping, prev) {
      // Rendered, not flat: shaded leaves with veins, a textured clay pot, soft contact shadow.
      const f = (v) => v.toFixed(1);
      const EDGE = drooping ? '#4d5a33' : '#0f4a22';
      const POT = 'M58 178 L142 178 L132 216 L68 216 Z';
      let out = `<defs>
        <linearGradient id="pl-leaf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1f9a45"/><stop offset=".55" stop-color="#4cc864"/><stop offset="1" stop-color="#a6ec82"/></linearGradient>
        <linearGradient id="pl-dry" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7d8f55"/><stop offset="1" stop-color="#cbd39a"/></linearGradient>
        <linearGradient id="pl-under" x1="0" y1="-12" x2="0" y2="12" gradientUnits="userSpaceOnUse"><stop offset=".45" stop-color="#062a12" stop-opacity="0"/><stop offset="1" stop-color="#062a12" stop-opacity=".38"/></linearGradient>
        <linearGradient id="pl-stem" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1c8a3d"/><stop offset=".5" stop-color="#57c96a"/><stop offset="1" stop-color="#1c8a3d"/></linearGradient>
        <linearGradient id="pl-pot" x1="58" y1="0" x2="142" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#b8480c"/><stop offset=".28" stop-color="#f07a2c"/><stop offset=".45" stop-color="#ff9a52"/><stop offset=".72" stop-color="#e2661c"/><stop offset="1" stop-color="#9a3a08"/></linearGradient>
        <linearGradient id="pl-rim" x1="0" y1="166" x2="0" y2="182" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffc08a"/><stop offset=".45" stop-color="#f58a45"/><stop offset="1" stop-color="#c55614"/></linearGradient>
        <radialGradient id="pl-soil" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#6b4a33"/><stop offset="1" stop-color="#2e1d12"/></radialGradient>
        <radialGradient id="pl-fruit" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffc07a"/><stop offset=".45" stop-color="#ff7a1a"/><stop offset="1" stop-color="#c24a05"/></radialGradient>
        <radialGradient id="pl-petal" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffe0ee"/><stop offset="1" stop-color="#ff86b8"/></radialGradient>
        <filter id="pl-clay" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="3" seed="7" result="n"/><feColorMatrix in="n" values="0 0 0 0 0.25  0 0 0 0 0.1  0 0 0 0 0.02  0 0 0 1.1 -0.35" result="g"/><feComposite in="g" in2="SourceAlpha" operator="in"/></filter>
        <filter id="pl-blur" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="4"/></filter>
      </defs>`;
      const fill = drooping ? 'url(#pl-dry)' : 'url(#pl-leaf)';
      // contact shadow on the ground
      out += '<ellipse cx="102" cy="217" rx="46" ry="5" fill="#000" opacity=".35" filter="url(#pl-blur)"/>';
      m.stems.forEach((d, i) => (out += `<path d="${d}" stroke="${EDGE}" stroke-width="${i ? 5.5 : 8}" stroke-linecap="round" fill="none" opacity=".85"/>`));
      m.stems.forEach((d, i) => (out += `<path d="${d}" stroke="${drooping ? '#8FA86A' : 'url(#pl-stem)'}" stroke-width="${i ? 3.4 : 5.4}" stroke-linecap="round" fill="none"/>`));
      m.leaves.forEach((l, i) => {
        const member = MEMBER_COLORS[l.member % MEMBER_COLORS.length];
        out += `<g transform="translate(${f(l.x)} ${f(l.y)}) rotate(${f(l.angle)}) scale(${l.size.toFixed(2)})"><g class="lf${i >= prev.leaves ? ' new' : ''}">
          <path d="${PLEAF}" fill="${fill}" stroke="${EDGE}" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="${PLEAF}" fill="url(#pl-under)"/>
          <path d="${PLEAF}" fill="none" stroke="${member}" stroke-width="1.1" stroke-opacity=".9" stroke-linejoin="round"/>
          <path d="${PRIB}" fill="none" stroke="#e9ffd9" stroke-opacity=".55" stroke-width="1.3" stroke-linecap="round"/>
          <path d="M18,-3 L22,-10 M30,-5 L35,-12 M42,-5 L46,-10 M22,-2 L25,4 M34,-3 L38,3" stroke="#e9ffd9" stroke-opacity=".28" stroke-width=".9" stroke-linecap="round"/></g></g>`;
      });
      m.blossoms.forEach((b, i) => {
        const cls = `bl${i >= prev.blossoms ? ' new' : ''}`;
        out += b.kind === 'flower'
          ? `<g transform="translate(${f(b.x)} ${f(b.y)})"><g class="${cls}">${[0, 72, 144, 216, 288]
              .map((a) => `<circle cx="${f(7 * Math.cos((a * Math.PI) / 180))}" cy="${f(7 * Math.sin((a * Math.PI) / 180))}" r="5.6" fill="url(#pl-petal)" stroke="#b84a7c" stroke-opacity=".5" stroke-width=".8"/>`)
              .join('')}<circle r="3.8" fill="#ffd93b" stroke="#b58a00" stroke-opacity=".6" stroke-width=".8"/><circle cx="-1.2" cy="-1.2" r="1.2" fill="#fff" opacity=".7"/></g></g>`
          : `<g transform="translate(${f(b.x)} ${f(b.y)})"><g class="${cls}"><circle r="9" fill="url(#pl-fruit)"/><path d="M0,-9 q2,-4 5,-5" stroke="#2d6b1f" stroke-width="1.6" fill="none" stroke-linecap="round"/><ellipse cx="-3.2" cy="-3.6" rx="2.6" ry="1.7" fill="#fff" opacity=".75" transform="rotate(-30 -3.2 -3.6)"/></g></g>`;
      });
      out += '<ellipse cx="100" cy="168" rx="46" ry="8" fill="url(#pl-soil)"/>';
      if (m.seed) out += `<g transform="translate(100 161) rotate(-20)"><ellipse rx="9" ry="6" fill="#c9924e"/><ellipse rx="9" ry="6" fill="url(#pl-under)"/><path d="M-4,-1 C -1,-3 2,-3 5,-1" stroke="#fff3d6" stroke-opacity=".6" stroke-width="1.2" fill="none"/></g>`;
      // the pot: shaded body + clay texture + a glazed rim with a highlight
      out += `<path d="${POT}" fill="url(#pl-pot)"/>
        <path d="${POT}" fill="#000" filter="url(#pl-clay)" opacity=".55"/>
        <path d="M60 182 L140 182 L139 186 L61 186 Z" fill="#000" opacity=".18"/>
        <rect x="50" y="166" width="100" height="16" rx="6" fill="url(#pl-rim)"/>
        <rect x="50" y="166" width="100" height="16" rx="6" fill="#000" filter="url(#pl-clay)" opacity=".35"/>
        <path d="M56 169.5 H 120" stroke="#fff" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/>
        <path d="M72 188 L76 212" stroke="#fff" stroke-opacity=".18" stroke-width="5" stroke-linecap="round"/>`;
      return out;
    }

    // scroll timeline: [progress, growth]
    const KEYS = [[0, 0], [0.05, 0], [0.24, 40], [0.46, 190], [0.66, 420], [0.8, 420], [0.96, 560], [1, 560]];
    const growthAt = (p) => {
      for (let k = 1; k < KEYS.length; k++) {
        const [p1, g1] = KEYS[k], [p0, g0] = KEYS[k - 1];
        if (p <= p1) return g0 + (g1 - g0) * ((p - p0) / (p1 - p0 || 1));
      }
      return 560;
    };
    const stepAt = (p) => (p < 0.24 ? 0 : p < 0.46 ? 1 : p < 0.66 ? 2 : p < 0.8 ? 3 : 4);
    // scene colour per stage: night soil, then greener, then warm at bloom
    const SKY = [
      ['#0b1022', '#1a2244', 'rgba(61,187,87,0)'],
      ['#0c1a2a', '#15333a', 'rgba(61,187,87,0.18)'],
      ['#0d2626', '#1b4d33', 'rgba(61,187,87,0.3)'],
      ['#0e3226', '#1f6b39', 'rgba(141,240,138,0.32)'],
      ['#0f3a28', '#23883f', 'rgba(141,240,138,0.4)'],
      ['#123f2c', '#2b8f46', 'rgba(255,158,199,0.45)'],
      ['#14402c', '#2f9a4a', 'rgba(255,180,67,0.5)'],
    ];
    const DRY = ['#1c1f1a', '#3d4431', 'rgba(201,212,154,0.18)'];
    const CHIPS = {
      0: [['🐸 You · lecture notes', 0], ['🦊 Mia · 5km run', 1], ['🐙 Jun · closing shift', 2], ['🌻 Ari · sketchbook page', 3], ['🐸 You · laundry, finally', 0]],
      1: [['🔥 Jun → Mia', 2], ['💪 Ari → You', 3], ['👏 Mia → Jun', 1], ['🌱 You → Ari', 0]],
      2: [['🦊 Mia · meal prep', 1], ['🐙 Jun · shipped it', 2], ['🌻 Ari · yoga', 3], ['🐸 You · 40 flashcards', 0]],
      4: [['🐸 You · back at it', 0], ['🦊 Mia · bouldering', 1], ['🔥 Ari → You', 3], ['🐙 Jun · weekly update', 2]],
    };

    const svg = $('[data-plant-svg]');
    const chipsEl = $('[data-plant-chips]');
    const word = $('[data-stage-word]');
    const pmStage = $('[data-pm-stage]'), pmHealth = $('[data-pm-health]'), pmBar = $('[data-pm-bar]'), pmToday = $('[data-pm-today]');
    const avs = $$('[data-pm-av]');
    const steps = $$('.plant-steps li');
    let prev = { leaves: 0, blossoms: 0, key: '' };
    let lastStage = -1, lastStep = -1, lastTick = 0, chipN = 0, bonusShown = false;

    const chip = (text, member, big = false) => {
      if (reduce || chipsEl.childElementCount > 3) return;
      const c = document.createElement('span');
      c.className = `pchip${big ? ' big' : ''}`;
      c.textContent = text;
      c.style.setProperty('--m', MEMBER_COLORS[member % MEMBER_COLORS.length]);
      const spread = innerWidth < 700 ? 18 : 70;
      c.style.setProperty('--x', `${(chipN++ % 2 ? 1 : -1) * (spread * 0.5 + Math.random() * spread) - 50}%`);
      chipsEl.appendChild(c);
      setTimeout(() => c.remove(), 2500);
    };

    function render(p) {
      const g = growthAt(p);
      const step = stepAt(p);
      const drooping = step === 3;
      const health = drooping ? 0.1 : 0.9;
      const st = stageFor(g);
      const key = `${st.index}|${Math.round(st.progress * 40)}|${drooping}`;
      if (key !== prev.key) {
        const model = plantModel(st.index, st.progress, health, drooping, MEMBERS, 'uni-crew');
        svg.innerHTML = drawPlant(model, drooping, prev);
        prev = { leaves: model.leaves.length, blossoms: model.blossoms.length, key };
      }
      const sky = drooping ? DRY : SKY[st.index];
      plantSec.style.setProperty('--sky1', sky[0]);
      plantSec.style.setProperty('--sky2', sky[1]);
      plantSec.style.setProperty('--glow', sky[2]);
      if (st.index !== lastStage) {
        word.textContent = st.name;
        pmStage.textContent = st.name;
        if (lastStage !== -1 && !reduce) { word.classList.remove('tick'); void word.offsetWidth; word.classList.add('tick'); }
        if (st.index > lastStage && lastStage !== -1) chip(`🌱 ${st.name}!`, 7, true);
        lastStage = st.index;
      }
      pmBar.style.width = `${Math.round((st.next ? st.progress : 1) * 100)}%`;
      pmHealth.textContent = g === 0 ? 'Waiting for the first win' : drooping ? 'Thirsty. One log perks it up' : st.next ? `Growing into a ${st.next.toLowerCase()}` : 'Thriving';
      pmHealth.classList.toggle('low', drooping);
      const active = step === 2 || step === 4 ? 4 : step === 3 ? 0 : g === 0 ? 0 : step === 1 ? 3 : Math.min(4, 1 + Math.floor(g / 12));
      avs.forEach((a, i) => a.classList.toggle('on', i < active));
      pmToday.textContent = `${active} of 4 logged today`;
      if (step !== lastStep) {
        steps.forEach((li, i) => { li.classList.toggle('on', i === step); li.classList.toggle('done', i < step); });
        if (step === 2 && !bonusShown) { chip('Full squad day! Bonus growth', 5, true); bonusShown = true; }
        lastStep = step;
      }
      // a win or kudos chip every so often as it grows
      const tick = Math.floor(g / 24);
      if (tick > lastTick && CHIPS[step]) { const pool = CHIPS[step]; const [t, m] = pool[tick % pool.length]; chip(t, m); }
      lastTick = tick;
      plantSec.classList.toggle('moving', p > 0.02);
    }

    if (reduce) {
      render(1);
      steps.forEach((li) => li.classList.remove('on'));
    } else {
      let queued = false;
      const onScroll = () => {
        queued = false;
        const rect = plantSec.getBoundingClientRect();
        const span = rect.height - innerHeight;
        if (rect.bottom < -200 || rect.top > innerHeight + 200) return;
        render(Math.min(1, Math.max(0, -rect.top / (span || 1))));
      };
      window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }, { passive: true });
      window.addEventListener('resize', onScroll);
      render(0);
      onScroll();
    }
  }

  // ---------- together: plans, focus sessions, notes, last 7 days, nudges ----------
  // Each demo starts when its tile scrolls in, and only animates while it's on screen.
  const onScreen = new WeakMap();
  const watch = (el) => {
    if (!el || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(([e]) => onScreen.set(el, e.isIntersecting)).observe(el);
  };
  const visibleNow = (el) => onScreen.get(el) !== false;
  const waitVisible = async (el) => { while (!visibleNow(el)) await sleep(400); };

  // grow together: people join, the clock runs, wins arrive, the bonus switches on
  const sessionTile = $('[data-tile="session"]');
  if (sessionTile) {
    watch(sessionTile);
    const clockEl = $('[data-sd-clock]', sessionTile);
    const statusEl = $('[data-sd-status]', sessionTile);
    const peopleEl = $('[data-sd-people]', sessionTile);
    const feedEl = $('[data-sd-feed]', sessionTile);
    const joinBtn = $('[data-sd-join]', sessionTile);
    const people = new Set();
    let secs = 25 * 60;
    const addPerson = (emoji, name, color) => {
      if (people.has(name)) return;
      people.add(name);
      const el = document.createElement('div');
      el.className = 'sd-person pop-in';
      el.style.setProperty('--m', color);
      el.innerHTML = `<span class="av">${emoji}</span>${name}`;
      peopleEl.appendChild(el);
      const bonus = people.size >= 2;
      statusEl.textContent = bonus ? '🌿 Plant bonus is on' : 'Bonus starts when a second person joins';
      statusEl.classList.toggle('on', bonus);
    };
    const addWin = (who, text) => {
      const el = document.createElement('div');
      el.className = 'sd-win pop-in';
      el.innerHTML = `<b></b><span></span>${people.size >= 2 ? '<em class="bonus">+ bonus</em>' : ''}`;
      el.querySelector('b').textContent = who;
      el.querySelector('span').textContent = text;
      feedEl.prepend(el);
      while (feedEl.children.length > 4) feedEl.lastElementChild.remove();
    };
    const fmt = (t) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    joinBtn.addEventListener('click', () => {
      addPerson('🐸', 'You', '#7CC4FF');
      joinBtn.hidden = true;
      for (let k = 0; k < 4; k++) setTimeout(() => burstAt(joinBtn.parentElement.querySelector('.sd-person:last-child'), '🌿'), k * 120);
    });
    // a couple of wins already in, so it never looks empty
    addPerson('🦊', 'Mia', '#FF6F91');
    addWin('🦊 Mia', 'Read the brief');
    addWin('🦊 Mia', 'Outline, done');
    whenVisible(sessionTile, async () => {
      if (reduce) {
        addPerson('🐙', 'Jun', '#FFB443');
        addWin('🐙 Jun', 'Chapter 3 notes');
        addWin('🦊 Mia', 'Lab report intro');
        clockEl.textContent = '18:42';
        return;
      }
      setInterval(() => {
        if (!visibleNow(sessionTile)) return;
        secs = secs > 1 ? secs - 1 : 25 * 60;
        clockEl.textContent = fmt(secs);
      }, 1000);
      const WINS = [['🦊 Mia', 'Lab report intro'], ['🐙 Jun', 'Chapter 3 notes'], ['🦊 Mia', '20 flashcards'], ['🐙 Jun', 'Fixed the login bug'], ['🦊 Mia', 'Emails, done'], ['🐙 Jun', 'Problem set Q1–4']];
      await sleep(2200);
      addPerson('🐙', 'Jun', '#FFB443');
      for (let i = 0; ; i = (i + 1) % WINS.length) {
        await sleep(3200);
        await waitVisible(sessionTile);
        addWin(...WINS[i]);
      }
    });
  }

  // plans: tick one off and it's logged (ticks itself until you tap one)
  const planTile = $('[data-tile="plan"]');
  if (planTile) {
    watch(planTile);
    const rows = $$('[data-pd]', planTile);
    const countEl = $('[data-pd-count]', planTile);
    let userOn = false;
    const update = () => (countEl.textContent = `${rows.filter((r) => r.classList.contains('done')).length}/${rows.length}`);
    const tick = (r, fromUser) => {
      const done = r.classList.toggle('done');
      r.setAttribute('aria-pressed', String(done));
      update();
      if (fromUser && done) ['🌱', '✅'].forEach((e, k) => setTimeout(() => burstAt(r.querySelector('.box'), e), k * 140));
    };
    rows.forEach((r) => {
      r.setAttribute('aria-pressed', 'false');
      r.addEventListener('click', () => {
        if (!userOn) {
          userOn = true;
          rows.forEach((x) => x.classList.contains('done') && tick(x, false));
        }
        tick(r, true);
      });
    });
    update();
    whenVisible(planTile, async () => {
      if (reduce) return tick(rows[0], false);
      for (;;) {
        for (const r of rows) {
          await sleep(1400);
          await waitVisible(planTile);
          if (userOn) return;
          tick(r, false);
        }
        await sleep(2600);
        if (userOn) return;
        rows.forEach((r) => r.classList.contains('done') && tick(r, false));
      }
    });
  }

  // notes: a couple of private notes come in, one after another
  const notesEl = $('[data-nd]');
  if (notesEl) {
    const tile = notesEl.closest('.tile');
    watch(tile);
    const NOTES = [
      ['🦊', 'Mia', 'you finally did the laundry 😭 so proud', 'Only you and Mia'],
      ['🐙', 'Jun', 'that lab report was brutal, well done', 'Only you and Jun'],
      ['🌻', 'Ari', 'see you at the library tomorrow?', 'Only you and Ari'],
      ['🦊', 'Mia', 'three days in a row!!', 'Only you and Mia'],
    ];
    const show = ([emoji, name, text, who]) => {
      const el = document.createElement('div');
      el.className = 'nd-note pop-in';
      el.innerHTML = `<span class="av">${emoji}</span><div class="nd-bubble"><b></b><p></p><small>🔒 ${who}</small></div>`;
      el.querySelector('b').textContent = name;
      el.querySelector('p').textContent = text;
      notesEl.appendChild(el);
      const live = $$('.nd-note:not(.out)', notesEl);
      if (live.length > 2) {
        live[0].classList.add('out');
        setTimeout(() => live[0].remove(), 400);
      }
    };
    whenVisible(tile, async () => {
      if (reduce) return NOTES.slice(0, 2).forEach(show);
      for (let i = 0; ; i = (i + 1) % NOTES.length) {
        await waitVisible(tile);
        show(NOTES[i]);
        await sleep(3400);
      }
    });
  }

  // last 7 days: squares stack up per day, then a search types itself
  const weekTile = $('[data-tile="week"]');
  if (weekTile) {
    watch(weekTile);
    const bars = $('[data-wd-bars]', weekTile);
    const DAYS = [['M', 2], ['T', 3], ['W', 0], ['T', 4], ['F', 2], ['S', 1], ['S', 2]];
    bars.innerHTML = DAYS.map(([d, n], col) => {
      const cells = n ? Array.from({ length: n }, (_, k) => `<i style="--dl:${(col * 0.08 + k * 0.06).toFixed(2)}s"></i>`).join('') : '<i class="rest" style="--dl:0s"></i>';
      return `<div class="wd-day"><small>${d}</small>${cells}</div>`;
    }).join('');
    const q = $('[data-wd-q]', weekTile);
    const n = $('[data-wd-n]', weekTile);
    const SEARCHES = [['assignment', '4 matches'], ['run', '11 matches'], ['shipped', '6 matches']];
    whenVisible(weekTile, async () => {
      $('.week-demo', weekTile).classList.add('on');
      if (reduce) {
        q.textContent = SEARCHES[0][0];
        n.textContent = SEARCHES[0][1];
        return;
      }
      for (let i = 0; ; i = (i + 1) % SEARCHES.length) {
        const [word, hits] = SEARCHES[i];
        await waitVisible(weekTile);
        for (const ch of word) { q.textContent += ch; await sleep(90 + Math.random() * 60); }
        await sleep(300);
        n.textContent = hits;
        await sleep(2400);
        n.textContent = '';
        while (q.textContent) { q.textContent = q.textContent.slice(0, -1); await sleep(40); }
        await sleep(500);
      }
    });
  }

  // nudges: notifications land one by one, and the evening one gets a typed reply
  const nudgeEl = $('[data-nudges]');
  if (nudgeEl) {
    const tile = nudgeEl.closest('.tile');
    watch(tile);
    const cards = $$('.nn', nudgeEl);
    const reply = $('.nn-reply', nudgeEl);
    const typed = $('[data-nn-typed]', nudgeEl);
    const btn = $('.nn-field em', nudgeEl);
    whenVisible(tile, async () => {
      if (reduce) {
        cards.forEach((c) => c.classList.add('show'));
        typed.textContent = 'Laundry, finally';
        reply.classList.add('logged');
        btn.textContent = 'Logged ✓';
        return;
      }
      for (;;) {
        await waitVisible(tile);
        cards[0].classList.add('show');
        await sleep(900);
        for (const ch of 'Laundry, finally') { typed.textContent += ch; await sleep(70 + Math.random() * 50); }
        await sleep(350);
        btn.classList.add('press'); await sleep(150); btn.classList.remove('press');
        reply.classList.add('logged');
        btn.textContent = 'Logged ✓';
        await sleep(1100);
        cards[1].classList.add('show');
        await sleep(1500);
        cards[2].classList.add('show');
        await sleep(4200);
        cards.forEach((c) => c.classList.remove('show'));
        await sleep(700);
        typed.textContent = '';
        reply.classList.remove('logged');
        btn.textContent = 'Log';
      }
    });
  }

  // ---------- waitlist ----------
  const cfg = window.SPROUT || {};
  const configured = cfg.supabaseUrl && cfg.publishableKey && !cfg.publishableKey.includes('xxx');

  $$('[data-join]').forEach((form) => {
    const msg = $('.join-msg', form);
    const btn = $('button[type=submit]', form);
    const input = $('input[type=email]', form);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      const phoneType = ($('input[type=radio]:checked', form) || {}).value || null;
      msg.className = 'join-msg';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        msg.textContent = 'That email doesn’t look right. Check for typos.';
        msg.classList.add('err');
        input.focus();
        return;
      }
      if (!configured) {
        msg.textContent = 'Sign-ups aren’t switched on yet. Try again soon.';
        msg.classList.add('err');
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Joining…';
      try {
        const res = await fetch(`${cfg.supabaseUrl}/rest/v1/rpc/join_waitlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: cfg.publishableKey },
          body: JSON.stringify({ p_email: email, p_phone: phoneType }),
        });
        if (!res.ok) throw new Error(String(res.status));
        msg.textContent = 'You’re on the list 🌱 We’ll email your invite.';
        msg.classList.add('ok');
        input.value = '';
        btn.textContent = 'Joined';
        if (!reduce) for (let i = 0; i < 4; i++) setTimeout(() => burst('🌱'), i * 180);
        return;
      } catch {
        msg.textContent = 'Couldn’t join just now. Check your connection and try again.';
        msg.classList.add('err');
      }
      btn.disabled = false;
      btn.textContent = 'Join the beta';
    });
  });
})();
