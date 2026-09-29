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
