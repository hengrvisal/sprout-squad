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
  // 1) typing a win
  const typeCard = $('[data-demo="type"]');
  whenVisible(typeCard, async () => {
    const typed = $('[data-typed]', typeCard);
    const list = $('[data-typed-list]', typeCard);
    const go = $('.go', typeCard);
    const lines = [['Lecture notes, week 9', '#7CC4FF'], ['Laundry, finally', '#6FE0C8'], ['Guitar practice', '#FFE45C']];
    if (reduce) {
      lines.forEach(([t, c]) => list.insertAdjacentHTML('beforeend', `<div class="win"><span class="dot" style="background:${c}"></span><span class="t">${t}</span><span class="when">now</span></div>`));
      return;
    }
    for (let round = 0; ; round++) {
      for (const [t, c] of lines) {
        for (const ch of t) { typed.textContent += ch; await sleep(55 + Math.random() * 60); }
        await sleep(350);
        go.classList.add('press'); await sleep(150); go.classList.remove('press');
        const row = document.createElement('div');
        row.className = 'win new';
        row.innerHTML = `<span class="dot" style="background:${c}"></span><span class="t"></span><span class="when">now</span>`;
        row.querySelector('.t').textContent = t;
        list.prepend(row);
        while (list.children.length > 3) list.lastElementChild.remove();
        typed.textContent = '';
        await sleep(900);
      }
      await sleep(1500);
      list.innerHTML = '';
    }
  });

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

  // 4) kudos popping
  const kudosCard = $('[data-demo="kudos"]');
  whenVisible(kudosCard, async () => {
    if (reduce) return;
    const btns = $$('[data-kudos] button', kudosCard);
    const counts = btns.map((b) => parseInt(b.querySelector('b').textContent || '0', 10));
    for (let i = 0; ; i = (i + 1) % btns.length) {
      await sleep(1100);
      const b = btns[i];
      const on = b.classList.toggle('on');
      counts[i] += on ? 1 : -1;
      b.querySelector('b').textContent = counts[i] > 0 ? String(counts[i]) : '';
      b.classList.add('pop');
      setTimeout(() => b.classList.remove('pop'), 280);
    }
  });

  // ---------- marquee of example wins ----------
  const mq = $('[data-marquee]');
  if (mq) {
    const items = [
      ['Lecture notes', '#7CC4FF'], ['5km run', '#FF6F91'], ['Closing shift', '#FFB443'], ['Shipped a feature', '#B9A6FF'],
      ['Meal prep', '#6FE0C8'], ['Sketchbook page', '#FFE45C'], ['Flashcards: 40 done', '#7CC4FF'], ['Bouldering', '#FF6F91'],
      ['Wrote the weekly update', '#FFB443'], ['Fixed the flaky test', '#B9A6FF'], ['Laundry, finally', '#6FE0C8'], ['Recorded a demo', '#FFE45C'],
    ];
    const html = items.map(([t, c]) => `<span class="pillx"><span class="dot" style="background:${c}"></span>${t}</span>`).join('');
    mq.innerHTML = html + html; // doubled for a seamless loop
  }

  // ---------- a year of squares ----------
  const yearEl = $('[data-year]');
  if (yearEl) {
    const r = rng(17);
    const start = new Date(Y, 0, 1);
    const lead = (start.getDay() + 6) % 7;
    let html = '', days = 0, wins = 0, run = 0, best = 0;
    for (let k = 0; k < lead; k++) html += '<i style="visibility:hidden"></i>';
    for (let d = 0; d < 365; d++) {
      const week = Math.floor((d + lead) / 7);
      // a little ramp-up through the year, like a real habit forming
      const rate = 0.35 + 0.5 * (d / 365);
      const n = r() < rate ? 1 + Math.floor(r() * 5) : 0;
      if (n) { days++; wins += n; run++; best = Math.max(best, run); } else run = 0;
      html += `<i class="l${level(n)}" style="--w:${week}"></i>`;
    }
    yearEl.innerHTML = html;
    const stats = { days, wins, streak: best };
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
      $$('[data-stat]').forEach((el) => countUp(el, stats[el.dataset.stat]));
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
      el('rect', { x: -b / 2 + 4, y: -b / 2 + 5, width: b, height: b, rx: b * 0.28, fill: 'var(--line)' }, grow);
      el('rect', { x: -b / 2, y: -b / 2, width: b, height: b, rx: b * 0.28, class: 'bud', fill: BUDS[(pi + 2) % 4] }, grow);
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
