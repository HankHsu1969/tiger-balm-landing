/* =========================================================
   虎標萬金油 — 互動腳本
   ========================================================= */
(() => {
  'use strict';

  /* ===== 商品設定：價格、組合折扣、免運門檻請依實際營運修改 ===== */
  const PRODUCT = {
    name: '虎標萬金油（紅）',
    thumb: 'images/tiger-balm-red-packshot-480.webp',
    sizes: {
      '10g':   { label: '10g 隨身瓶', price: 99 },
      '19.4g': { label: '19.4g 經典瓶', price: 169 },
      '30g':   { label: '30g 大容量', price: 229 }
    },
    bundles: {
      '1': { label: '單入', qty: 1, off: 0 },
      '3': { label: '3 入組', qty: 3, off: 0.10 },
      '6': { label: '6 入家庭組', qty: 6, off: 0.15 }
    },
    freeShipping: 599,
    shippingFee: 80,
    shipCutoffHour: 16
  };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = n => 'NT$' + Math.round(n).toLocaleString('zh-TW');
  const pad = n => String(n).padStart(2, '0');

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* 私密模式等情況忽略 */ }
    }
  };

  /* ---------- Toast ---------- */
  const toastZone = $('.toast-zone');
  function toast(msg) {
    if (!toastZone) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    toastZone.appendChild(el);
    setTimeout(() => { el.classList.add('out'); el.addEventListener('animationend', () => el.remove(), { once: true }); }, 2600);
  }

  /* ---------- Header / Nav ---------- */
  const header = $('.site-header');
  const menuToggle = $('.menu-toggle');
  const onScrollHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  function setNav(open) {
    document.body.classList.toggle('nav-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
  }
  menuToggle.addEventListener('click', () => setNav(!document.body.classList.contains('nav-open')));
  $$('.main-nav a').forEach(a => a.addEventListener('click', () => setNav(false)));

  // 目前所在區塊的導覽高亮
  const navLinks = $$('.main-nav a[href^="#"]:not(.btn)');
  const navTargets = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const navObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        navLinks.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navTargets.forEach(t => navObs.observe(t));
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  /* ---------- Parallax ---------- */
  const heroImg = $('.hero-media img');
  const storyImg = $('.story-bg img');
  const storySec = $('#story');
  let ticking = false;
  function parallax() {
    const y = window.scrollY;
    if (heroImg && y < window.innerHeight * 1.2) heroImg.style.setProperty('--py', (y * 0.22).toFixed(1) + 'px');
    if (storyImg && storySec) {
      const r = storySec.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        const max = r.height * 0.08; // 背景框上下各預留 10%，位移不超過 8%
        const p = Math.max(-max, Math.min(max, (r.top + r.height / 2 - window.innerHeight / 2) * -0.12));
        storyImg.style.setProperty('--py', p.toFixed(1) + 'px');
      }
    }
    ticking = false;
  }
  if (!reduceMotion) {
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }, { passive: true });
    parallax();
  }

  /* ---------- Hero 金粉粒子 ---------- */
  (function goldDust() {
    const canvas = $('.hero-dust');
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext('2d');
    const hero = $('.hero');
    let w, h, dpr, particles = [], running = true, raf;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(70, w / 22));
      particles = Array.from({ length: count }, () => spawn(true));
    }
    function spawn(initial) {
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : h + 10,
        r: Math.random() * 1.8 + 0.4,
        vy: -(Math.random() * 0.35 + 0.08),
        vx: (Math.random() - 0.5) * 0.15,
        a: Math.random() * 0.6 + 0.2,
        t: Math.random() * Math.PI * 2
      };
    }
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.t += 0.02;
        p.x += p.vx + Math.sin(p.t) * 0.12;
        p.y += p.vy;
        if (p.y < -10) Object.assign(p, spawn(false));
        const alpha = p.a * (0.6 + Math.sin(p.t * 1.6) * 0.4);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, `rgba(245, 222, 160, ${alpha})`);
        g.addColorStop(1, 'rgba(201, 162, 74, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    resize();
    frame();
    window.addEventListener('resize', () => { cancelAnimationFrame(raf); resize(); if (running) frame(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        const vis = e.isIntersecting;
        if (vis && !running) { running = true; frame(); }
        if (!vis) { running = false; cancelAnimationFrame(raf); }
      }).observe(hero);
    }
  })();

  /* ---------- Benefit 卡片光暈跟隨 ---------- */
  $$('.benefit').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- 圖庫 ---------- */
  const mainImg = $('#gallery-main');
  const zoomBox = $('[data-zoom]');
  $$('.thumb').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) return;
      $$('.thumb').forEach(t => t.classList.remove('is-active'));
      btn.classList.add('is-active');
      mainImg.classList.add('is-swapping');
      const next = new Image();
      next.src = btn.dataset.full;
      const swap = () => {
        mainImg.src = btn.dataset.full;
        mainImg.alt = btn.dataset.alt;
        requestAnimationFrame(() => mainImg.classList.remove('is-swapping'));
      };
      next.complete ? setTimeout(swap, 180) : (next.onload = swap);
    });
  });
  if (zoomBox && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    zoomBox.addEventListener('pointerenter', () => zoomBox.classList.add('is-zooming'));
    zoomBox.addEventListener('pointerleave', () => { zoomBox.classList.remove('is-zooming'); mainImg.style.transformOrigin = ''; });
    zoomBox.addEventListener('pointermove', e => {
      const r = zoomBox.getBoundingClientRect();
      mainImg.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    });
  }

  /* ---------- 價格與選項 ---------- */
  const state = { size: '19.4g', bundle: '1', qty: 1 };
  const qtyInput = $('#qty');

  const bundlePrice = (size, bundle) => {
    const s = PRODUCT.sizes[size], b = PRODUCT.bundles[bundle];
    return Math.round(s.price * b.qty * (1 - b.off));
  };

  function renderPrice() {
    const s = PRODUCT.sizes[state.size];
    const b = PRODUCT.bundles[state.bundle];
    const each = bundlePrice(state.size, state.bundle);
    const total = each * state.qty;
    const full = s.price * b.qty * state.qty;
    const save = full - total;

    const priceEl = $('[data-price]');
    priceEl.textContent = fmt(total);
    priceEl.classList.remove('tick'); void priceEl.offsetWidth; priceEl.classList.add('tick');

    const compare = $('[data-compare]');
    const saveEl = $('[data-save]');
    compare.hidden = saveEl.hidden = save <= 0;
    if (save > 0) { compare.textContent = fmt(full); saveEl.textContent = `省 ${fmt(save)}`; }

    const jars = b.qty * state.qty;
    $('[data-unit]').textContent = `${s.label}・共 ${jars} 罐・每罐約 ${fmt(each / b.qty)}`;
    $('[data-buy-total]').textContent = fmt(total);
    $('[data-sticky-price]').textContent = `${fmt(each)}／${b.label}`;

    Object.keys(PRODUCT.bundles).forEach(id => {
      const el = $(`[data-bundle-price="${id}"]`);
      if (el) el.textContent = fmt(bundlePrice(state.size, id));
    });
    renderShip($('[data-ship-bar]'), $('[data-ship-text]'), cartSubtotal() || total, !cartSubtotal());
  }

  function renderShip(bar, text, amount, preview) {
    if (!bar || !text) return;
    const pct = Math.min(100, (amount / PRODUCT.freeShipping) * 100);
    bar.style.width = pct + '%';
    const gap = PRODUCT.freeShipping - amount;
    if (gap > 0) {
      text.innerHTML = `${preview ? '選這個組合，' : ''}再買 <b>${fmt(gap)}</b> 即享免運`;
    } else {
      text.innerHTML = `${preview ? '這個組合' : '已'}<b>享有免運</b>，今天就把溫暖帶回家`;
    }
  }

  $$('input[name="size"]').forEach(r => r.addEventListener('change', () => { state.size = r.value; renderPrice(); }));
  $$('input[name="bundle"]').forEach(r => r.addEventListener('change', () => { state.bundle = r.value; renderPrice(); }));

  function setQty(v) {
    state.qty = Math.max(1, Math.min(20, parseInt(v, 10) || 1));
    qtyInput.value = state.qty;
    renderPrice();
  }
  $$('[data-qty]').forEach(b => b.addEventListener('click', () => setQty(state.qty + Number(b.dataset.qty))));
  qtyInput.addEventListener('change', () => setQty(qtyInput.value));

  // CTA：直接選定組合並捲動到購買區
  $$('[data-pick-bundle]').forEach(a => a.addEventListener('click', () => {
    const id = a.dataset.pickBundle;
    const input = $(`input[name="bundle"][value="${id}"]`);
    if (input) { input.checked = true; state.bundle = id; renderPrice(); }
  }));

  /* ---------- 購物車 ---------- */
  let cart = store.get('tb-cart', []).filter(i => PRODUCT.sizes[i.size] && PRODUCT.bundles[i.bundle] && i.qty > 0);
  const drawer = $('#cart-drawer');
  const overlay = $('.drawer-overlay');
  const countEl = $('[data-cart-count]');
  let lastFocus = null;

  function cartSubtotal() {
    return cart.reduce((sum, i) => sum + bundlePrice(i.size, i.bundle) * i.qty, 0);
  }

  function addToCart() {
    const key = `${state.size}|${state.bundle}`;
    const found = cart.find(i => i.key === key);
    if (found) found.qty = Math.min(99, found.qty + state.qty);
    else cart.push({ key, size: state.size, bundle: state.bundle, qty: state.qty });
    saveCart();
    renderCart();
    countEl.classList.remove('bump'); void countEl.offsetWidth; countEl.classList.add('bump');
    toast(`已加入購物車：${PRODUCT.sizes[state.size].label}・${PRODUCT.bundles[state.bundle].label} × ${state.qty}`);
  }

  function saveCart() { store.set('tb-cart', cart); }

  function renderCart() {
    const list = $('[data-cart-items]');
    const totalSets = cart.reduce((n, i) => n + i.qty, 0);
    countEl.textContent = totalSets;
    countEl.classList.toggle('has-items', totalSets > 0);
    drawer.classList.toggle('is-empty', cart.length === 0);

    list.innerHTML = cart.map(i => {
      const s = PRODUCT.sizes[i.size], b = PRODUCT.bundles[i.bundle];
      return `
        <li class="cart-item" data-key="${i.key}">
          <img src="${PRODUCT.thumb}" width="64" height="64" alt="">
          <div>
            <p class="ci-name">${PRODUCT.name}</p>
            <p class="ci-meta">${s.label}・${b.label}${b.off ? `（${Math.round((1 - b.off) * 100) / 10} 折）` : ''}</p>
            <div class="ci-qty">
              <button type="button" data-ci="-1" aria-label="減少">−</button>
              <span>${i.qty}</span>
              <button type="button" data-ci="1" aria-label="增加">＋</button>
            </div>
          </div>
          <div class="ci-right">
            <p class="ci-price">${fmt(bundlePrice(i.size, i.bundle) * i.qty)}</p>
            <button type="button" class="ci-remove" data-ci-remove>移除</button>
          </div>
        </li>`;
    }).join('');

    const sub = cartSubtotal();
    $('[data-cart-subtotal]').textContent = fmt(sub);
    $('[data-cart-shipping]').textContent = sub >= PRODUCT.freeShipping ? '免運' : fmt(PRODUCT.shippingFee);
    renderShip($('[data-cart-ship-bar]'), $('[data-cart-ship-text]'), sub, false);
    renderShip($('[data-ship-bar]'), $('[data-ship-text]'), sub || bundlePrice(state.size, state.bundle) * state.qty, !sub);
  }

  $('[data-cart-items]').addEventListener('click', e => {
    const li = e.target.closest('.cart-item');
    if (!li) return;
    const item = cart.find(i => i.key === li.dataset.key);
    if (!item) return;
    if (e.target.closest('[data-ci-remove]')) {
      cart = cart.filter(i => i !== item);
    } else if (e.target.closest('[data-ci]')) {
      item.qty += Number(e.target.closest('[data-ci]').dataset.ci);
      if (item.qty <= 0) cart = cart.filter(i => i !== item);
    } else return;
    saveCart();
    renderCart();
  });

  function openCart() {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('is-visible'));
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    setNav(false);
    setTimeout(() => drawer.focus(), 50);
  }
  function closeCart() {
    overlay.classList.remove('is-visible');
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    setTimeout(() => { overlay.hidden = true; }, 400);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  $$('[data-open-cart]').forEach(b => b.addEventListener('click', openCart));
  $$('[data-close-cart]').forEach(b => b.addEventListener('click', closeCart));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (drawer.classList.contains('is-open')) closeCart(); setNav(false); }
  });

  $$('[data-add-to-cart]').forEach(b => b.addEventListener('click', addToCart));
  $('[data-buy-now]').addEventListener('click', () => { addToCart(); openCart(); });
  $('[data-checkout]').addEventListener('click', () => {
    // TODO：在此串接您的金流／電商平台結帳流程（例如綠界、藍新、Shopline、Shopify）
    toast('結帳流程尚未串接，請於 main.js 的 data-checkout 處接上金流');
  });

  /* ---------- 行動版浮動購買列 ---------- */
  const sticky = $('[data-sticky-buy]');
  const buyBox = $('#buy-box');
  const heroSec = $('.hero');
  if (sticky && 'IntersectionObserver' in window) {
    const vis = { hero: true, buy: false };
    const update = () => {
      const show = !vis.hero && !vis.buy;
      sticky.classList.toggle('is-visible', show);
      sticky.setAttribute('aria-hidden', String(!show));
      $('button', sticky).tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(([e]) => { vis.hero = e.isIntersecting; update(); }).observe(heroSec);
    new IntersectionObserver(([e]) => { vis.buy = e.isIntersecting; update(); }, { threshold: 0.05 }).observe(buyBox);
  }

  /* ---------- 商品資訊手風琴 ---------- */
  $$('.acc-btn').forEach(btn => btn.addEventListener('click', () => {
    const item = btn.closest('.acc');
    const open = !item.classList.contains('is-open');
    item.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
  }));

  /* ---------- FAQ ---------- */
  $$('.faq-btn').forEach(btn => btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const open = !item.classList.contains('is-open');
    $$('.faq-item').forEach(i => { i.classList.remove('is-open'); $('.faq-btn', i).setAttribute('aria-expanded', 'false'); });
    item.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
  }));

  /* ---------- 評價篩選與載入更多 ---------- */
  const reviews = $$('.review');
  const loadMore = $('[data-load-more]');
  const emptyMsg = $('[data-review-empty]');
  const PAGE = 6;
  let filter = 'all', expanded = false;

  function renderReviews(animate) {
    const matched = reviews.filter(r => filter === 'all' || r.dataset.tags.split(' ').includes(filter));
    const limit = filter === 'all' && !expanded ? PAGE : Infinity;
    reviews.forEach(r => r.classList.add('is-hidden'));
    matched.forEach((r, i) => {
      if (i >= limit) return;
      r.classList.remove('is-hidden');
      if (animate) { r.classList.remove('pop'); r.style.animationDelay = (i * 0.06) + 's'; void r.offsetWidth; r.classList.add('pop'); }
    });
    loadMore.hidden = !(filter === 'all' && !expanded && matched.length > PAGE);
    emptyMsg.hidden = matched.length > 0;
  }
  $$('.filter').forEach(btn => btn.addEventListener('click', () => {
    $$('.filter').forEach(b => b.classList.toggle('is-active', b === btn));
    filter = btn.dataset.filter;
    renderReviews(true);
  }));
  loadMore.addEventListener('click', () => { expanded = true; renderReviews(true); });
  renderReviews(false);

  /* ---------- 數字計數 ---------- */
  const counters = $$('[data-count]');
  function runCounter(el) {
    const target = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = target; return; }
    const dur = 1600, start = performance.now();
    const step = now => {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { runCounter(e.target); co.unobserve(e.target); }
    }), { threshold: 0.6 });
    counters.forEach(c => co.observe(c));
  } else counters.forEach(runCounter);

  /* ---------- 出貨倒數 ---------- */
  const cd = $('[data-countdown]');
  const cdLabel = $('[data-cutoff-label]');
  function nextCutoff(now) {
    const t = new Date(now);
    t.setHours(PRODUCT.shipCutoffHour, 0, 0, 0);
    // 週六、週日或已過截止時間 → 順延到下一個平日
    while (t <= now || t.getDay() === 0 || t.getDay() === 6) {
      t.setDate(t.getDate() + 1);
      t.setHours(PRODUCT.shipCutoffHour, 0, 0, 0);
    }
    return t;
  }
  function tickCountdown() {
    if (!cd) return;
    const now = new Date();
    const target = nextCutoff(now);
    const sameDay = target.toDateString() === now.toDateString();
    cdLabel.textContent = sameDay ? '今日出貨倒數' : '下一個出貨日倒數';
    let diff = Math.max(0, Math.floor((target - now) / 1000));
    const h = Math.floor(diff / 3600); diff %= 3600;
    $('[data-h]', cd).textContent = pad(h);
    $('[data-m]', cd).textContent = pad(Math.floor(diff / 60));
    $('[data-s]', cd).textContent = pad(diff % 60);
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ---------- 其他 ---------- */
  const yearEl = $('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  renderCart();
  renderPrice();
})();
