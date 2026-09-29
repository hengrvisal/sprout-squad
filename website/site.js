(() => {
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const y = today.getFullYear();
  const m = today.getMonth();

  // ---------- example grids (illustrative, deterministic per name) ----------
  const seeds = { me: [7, 0.82], mia: [11, 0.8], jun: [29, 0.55], ari: [53, 0.68] };
  function rng(seed) {
    let s = seed;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  }
  function level(n) {
    return n <= 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n <= 4 ? 3 : 4;
  }
  function renderGrid(el) {
    const [seed, rate] = seeds[el.dataset.grid] || [1, 0.6];
    const r = rng(seed);
    const mini = el.classList.contains('mini');
    const lead = (new Date(y, m, 1).getDay() + 6) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    let html = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<span class="wd">${d}</span>`).join('');
    let i = 0;
    for (let k = 0; k < lead; k++) html += '<i class="pad"></i>';
    for (let d = 1; d <= days; d++) {
      const date = new Date(y, m, d);
      const isToday = date.getTime() === today.getTime();
      if (date > today) {
        html += `<i class="future">${mini ? '' : d}</i>`;
        continue;
      }
      const n = isToday && el.dataset.grid === 'me' ? 3 : r() < rate ? 1 + Math.floor(r() * 5) : 0;
      html += `<i class="l${level(n)}${isToday ? ' today' : ''}" style="--i:${i++}">${mini ? '' : d}</i>`;
    }
    el.innerHTML = html;
  }
  document.querySelectorAll('[data-grid]').forEach(renderGrid);
  document.querySelectorAll('[data-month-title]').forEach((el) => {
    el.innerHTML = `${MONTHS[m]} <span>${y}</span>`;
  });
  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = String(y)));

  // ---------- waitlist ----------
  const cfg = window.SPROUT || {};
  const configured = cfg.supabaseUrl && cfg.publishableKey && !cfg.publishableKey.includes('xxx');

  document.querySelectorAll('[data-join]').forEach((form) => {
    const msg = form.querySelector('.join-msg');
    const btn = form.querySelector('button');
    const input = form.querySelector('input[type=email]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      const phone = (form.querySelector('input[name=phone]:checked') || {}).value || null;
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
          headers: {
            'Content-Type': 'application/json',
            apikey: cfg.publishableKey,
          },
          body: JSON.stringify({ p_email: email, p_phone: phone }),
        });
        if (!res.ok) throw new Error(String(res.status));
        msg.textContent = 'You’re on the list 🌱 We’ll email your invite.';
        msg.classList.add('ok');
        input.value = '';
        btn.textContent = 'Joined';
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
