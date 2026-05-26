/* ═══════════════════════════════════════════════════════════════
   CAVERO DIEGO — global.js
   Shared behaviour for all pages. Page-specific JS stays inline.
   ═══════════════════════════════════════════════════════════════ */

/* ── Translations loader ────────────────────────────────────────── */
let translationsData = null;
let translationsPromise = null;

async function loadTranslations() {
  if (translationsData) return translationsData;
  if (translationsPromise) return translationsPromise;

  translationsPromise = fetch('/assets/data/translations.json')
    .then(res => res.json())
    .then(data => {
      translationsData = data;
      return data;
    })
    .catch(() => {
      // Fallback if fetch fails
      translationsData = {
        es: { cart: {}, cc: {} },
        en: { cart: {}, cc: {} }
      };
      return translationsData;
    });

  return translationsPromise;
}

function getCurrentLanguage() {
  return window.location.pathname.startsWith('/en') || document.documentElement.lang === 'en' ? 'en' : 'es';
}

function getTranslation(key, lang) {
  if (!translationsData) return '';
  const keys = key.split('.');
  let value = translationsData[lang];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || '';
}

/* ── Cart state ─────────────────────────────────────────────────── */
const Cart = (() => {
  const STORAGE_KEY = 'cd_cart';

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }
  function save(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  let items = load();
  const listeners = [];

  function notify() { listeners.forEach(fn => fn(items)); }

  return {
    subscribe(fn) { listeners.push(fn); fn(items); },
    add(product) {
      const existing = items.find(i => i.id === product.id);
      if (existing) {
        existing.qty += 1;
      } else {
        items.push({ ...product, qty: 1 });
      }
      save(items);
      notify();
    },
    remove(id) {
      items = items.filter(i => i.id !== id);
      save(items);
      notify();
    },
    total() {
      return items.reduce((sum, i) => sum + i.price * i.qty, 0);
    },
    count() {
      return items.reduce((sum, i) => sum + i.qty, 0);
    },
    items() { return items; },
  };
})();

/* ── Cart panel DOM (injected once) ─────────────────────────────── */
async function injectCartPanel() {
  // Load translations first
  await loadTranslations();

  const lang = getCurrentLanguage();

  // Get translations from loaded data
  const t = {
    title: getTranslation('cart.title', lang),
    close: getTranslation('cart.close', lang),
    emptyLabel: getTranslation('cart.emptyLabel', lang),
    emptyHint: getTranslation('cart.emptyHint', lang),
    totalLabel: getTranslation('cart.totalLabel', lang),
    checkoutBtn: getTranslation('cart.checkoutBtn', lang),
    checkoutNote: getTranslation('cart.checkoutNote', lang),
    itemRemove: getTranslation('cart.itemRemove', lang),
    itemAdded: getTranslation('cart.itemAdded', lang)
  };

  // Store translations globally for use in other functions
  window._cartTranslations = t;

  const overlay = document.createElement('div');
  overlay.className = 'cart-overlay';
  overlay.id = 'cartOverlay';

  const panel = document.createElement('div');
  panel.className = 'cart-panel';
  panel.id = 'cartPanel';
  panel.innerHTML = `
    <div class="cart-header">
      <span class="cart-title">${t.title}</span>
      <button class="cart-close" id="cartClose" aria-label="${t.close}">[ ${t.close} ]</button>
    </div>
    <div class="cart-items" id="cartItems"></div>
    <div class="cart-footer" id="cartFooter" style="display:none">
      <div class="cart-subtotal">
        <span class="cart-subtotal-label">${t.totalLabel}</span>
        <span class="cart-subtotal-amount" id="cartTotal">0 €</span>
      </div>
      <a href="#" class="cart-checkout-btn" id="cartCheckoutBtn">
        ${t.checkoutBtn}
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
        </svg>
      </a>
      <span class="cart-checkout-note">${t.checkoutNote}</span>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  function openCart()  { overlay.classList.add('open'); panel.classList.add('open'); }
  function closeCart() { overlay.classList.remove('open'); panel.classList.remove('open'); }

  overlay.addEventListener('click', closeCart);
  document.getElementById('cartClose').addEventListener('click', closeCart);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });

  window._openCart = openCart;

  /* Ruta relativa a checkout.html desde cualquier profundidad */
  const _depth = (location.pathname.match(/\//g) || []).length - 1;
  const _checkoutUrl = '../'.repeat(Math.max(0, _depth)) + 'checkout.html';
  document.getElementById('cartCheckoutBtn').href = _checkoutUrl;

  Cart.subscribe(renderCart);

  function renderCart(items) {
    const container = document.getElementById('cartItems');
    const footer    = document.getElementById('cartFooter');
    const totalEl   = document.getElementById('cartTotal');
    const count     = Cart.count();
    const t         = window._cartTranslations || {};

    if (count === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <span class="cart-empty-label">${t.emptyLabel || 'Carrito vacío'}</span>
          <p class="cart-empty-hint">${t.emptyHint || 'Todavía no has añadido ningún componente.'}</p>
        </div>
      `;
      footer.style.display = 'none';
    } else {
      container.innerHTML = items.map(item => `
        <div class="cart-item" data-id="${item.id}">
          <div class="cart-item-img" style="background:${item.color || 'var(--ink-4)'}"></div>
          <div class="cart-item-info">
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-variant">${item.variant || ''}</span>
          </div>
          <span class="cart-item-price">${(item.price * item.qty).toFixed(2).replace('.', ',')} €</span>
          <button class="cart-item-remove" data-remove="${item.id}" aria-label="${t.itemRemove || 'Eliminar'}">✕</button>
        </div>
      `).join('');

      container.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', () => Cart.remove(btn.dataset.remove));
      });

      const t = Cart.total();
      totalEl.textContent = t.toFixed(2).replace('.', ',') + ' €';
      footer.style.display = 'flex';

      /* Build Stripe checkout URL — single-product shortcut */
      const checkoutBtn = document.getElementById('cartCheckoutBtn');
      if (items.length === 1 && items[0].stripeUrl) {
        checkoutBtn.href = items[0].stripeUrl + '?quantity=' + items[0].qty;
      } else if (items[0] && items[0].stripeUrl) {
        /* Multiple products: link to first item's payment link (Stripe limitation) */
        checkoutBtn.href = items[0].stripeUrl;
      } else {
        checkoutBtn.removeAttribute('href');
      }
    }

    /* Update nav badge */
    const badge = document.getElementById('cartCountBadge');
    if (badge) {
      badge.textContent = count;
      badge.classList.toggle('visible', count > 0);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {

  /* ── Inject cart panel ──────────────────────────────────────── */
  injectCartPanel();

  /* ── 1. Custom cursor (cursorLuminance) ─────────────────────── */
  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursorRing');
  let mx = 0, my = 0, rx = 0, ry = 0;

  function cursorLuminance(x, y) {
    const els = document.elementsFromPoint(x, y);
    for (const el of els) {
      if (el === cursor || el === ring) continue;
      const bg = getComputedStyle(el).backgroundColor;
      const m = bg.match(/[\d.]+/g);
      if (!m) continue;
      const a = m[3] !== undefined ? +m[3] : 1;
      if (a < 0.05) continue;
      return 0.2126 * (+m[0] / 255) + 0.7152 * (+m[1] / 255) + 0.0722 * (+m[2] / 255);
    }
    return 1;
  }

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  (function tick() {
    rx += (mx - rx) * .14;
    ry += (my - ry) * .14;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
    ring.style.left   = rx + 'px';
    ring.style.top    = ry + 'px';
    document.body.classList.toggle('dark-bg', cursorLuminance(mx, my) < 0.5);
    requestAnimationFrame(tick);
  })();

  /* ── 2. Link hover — event delegation ──────────────────────── */
  document.addEventListener('mouseover', e => {
    if (e.target.closest('a, button, #footerStrip')) document.body.classList.add('link-hover');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest('a, button, #footerStrip')) document.body.classList.remove('link-hover');
  });

  /* ── 3. Nav scroll (hide/show with scrollingUp) ─────────────── */
  const nav = document.getElementById('nav');
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const scrollingUp = y < lastY;
    nav.classList.toggle('scrolled', y > 60);
    nav.classList.toggle('nav-hidden', y > 80 && !scrollingUp);
    lastY = y;
  });

  /* ── 4. Reveal on scroll ────────────────────────────────────── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(r => io.observe(r));

  /* ── 5. Panel Círculo Cavero ────────────────────────────────── */
  const ccOverlay = document.getElementById('ccOverlay');
  const ccPanel   = document.getElementById('ccPanel');
  const ccClose   = document.getElementById('ccClose');

  function openCC()  {
    ccOverlay.classList.add('open');
    ccPanel.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeCC() {
    ccOverlay.classList.remove('open');
    ccPanel.classList.remove('open');
    document.body.style.overflow = '';
    document.body.style.background = '';
  }

  const footerStrip     = document.getElementById('footerStrip');
  const navLogoBtn      = document.getElementById('navLogoBtn');
  const footerLogoBtn   = document.getElementById('footerLogoBtn');
  const footerLogoInner = document.getElementById('footerLogoInner');

  if (footerStrip) footerStrip.addEventListener('click', openCC);
  if (navLogoBtn)  navLogoBtn.addEventListener('click', openCC);
  if (footerLogoInner) {
    const flip = () => footerLogoInner.classList.toggle('flipped');
    if (footerLogoBtn) footerLogoBtn.addEventListener('click', flip);
    const footerLogoBtnBack = document.getElementById('footerLogoBtnBack');
    if (footerLogoBtnBack) footerLogoBtnBack.addEventListener('click', flip);
  }

  if (ccClose)   ccClose.addEventListener('click', closeCC);
  if (ccOverlay) ccOverlay.addEventListener('click', closeCC);

  /* CTA button in articles */
  const ccCtaBtn = document.getElementById('ccCtaBtn');
  if (ccCtaBtn) ccCtaBtn.addEventListener('click', openCC);

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCC(); });

  const ccForm = document.getElementById('ccForm');
  if (ccForm) {
    ccForm.addEventListener('submit', async e => {
      e.preventDefault();
      await loadTranslations();
      const lang = getCurrentLanguage();
      const eyebrow = getTranslation('cc.eyebrow', lang);
      const successTitle = ccForm.dataset.successTitle || getTranslation('cc.successTitle', lang);
      const successDesc = ccForm.dataset.successDesc || getTranslation('cc.successDesc', lang);
      ccPanel.innerHTML = `<div style="display:flex;flex-direction:column;justify-content:center;height:100%;gap:1.2rem;padding:4rem 3.2rem"><span class="cc-eyebrow">${eyebrow}</span><h2 class="cc-titulo">${successTitle}</h2><p class="cc-desc">${successDesc}</p></div>`;
    });
  }

  /* ── 6. Filtros (only activates if .filter-btn exists) ─────── */
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        document.querySelectorAll('.entrada-card').forEach(card => {
          const show = f === 'all' || card.dataset.categoria === f;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* ── 7. Add to cart buttons ─────────────────────────────────── */
  document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', () => {
      const product = {
        id:         btn.dataset.productId,
        name:       btn.dataset.productName,
        variant:    btn.dataset.productVariant || '',
        price:      parseFloat(btn.dataset.productPrice),
        color:      btn.dataset.productColor || 'var(--ink)',
        stripeUrl:  btn.dataset.stripeUrl || '',
      };
      Cart.add(product);

      /* Visual feedback */
      const t = window._cartTranslations || {};
      const original = btn.textContent;
      btn.textContent = t.itemAdded || '✓ Añadido';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
      }, 1800);

      if (window._openCart) window._openCart();
    });
  });

  /* ── 8. Cart button in nav ──────────────────────────────────── */
  const cartNavBtn = document.getElementById('cartNavBtn');
  if (cartNavBtn) {
    cartNavBtn.addEventListener('click', () => {
      if (window._openCart) window._openCart();
    });
  }

  /* ── 9. Language switcher ───────────────────────────────────── */
  // Skip language switcher logic on home page (it has its own inline handler)
  const isHomePage = document.body.classList.contains('home-page');

  if (!isHomePage) {
    // Check localStorage and redirect on page load if needed
    const currentPath = window.location.pathname;
    const isCurrentlyEnglish = currentPath.startsWith('/en');
    const preferredLang = localStorage.getItem('preferredLang');

    // Auto-redirect based on stored preference (only if different from current)
    if (preferredLang === 'en' && !isCurrentlyEnglish) {
      const newPath = '/en' + currentPath;
      window.location.href = newPath;
    } else if (preferredLang === 'es' && isCurrentlyEnglish) {
      const newPath = currentPath.replace(/^\/en/, '') || '/';
      window.location.href = newPath;
    }

    const langBtn = document.getElementById('langBtn');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        const currentPath = window.location.pathname;
        const isEnglish = currentPath.startsWith('/en');

        if (isEnglish) {
          // Switch to Spanish: remove /en prefix and save preference
          localStorage.setItem('preferredLang', 'es');
          const newPath = currentPath.replace(/^\/en/, '') || '/';
          window.location.href = newPath;
        } else {
          // Switch to English: add /en prefix and save preference
          localStorage.setItem('preferredLang', 'en');
          const newPath = '/en' + currentPath;
          window.location.href = newPath;
        }
      });

      // Update button label based on current language
      const langLabel = document.getElementById('langLabel');
      if (langLabel) {
        langLabel.textContent = isCurrentlyEnglish ? 'EN' : 'ES';
      }
    }
  } else {
    // On home page, update button label based on actual page language
    const currentPath = window.location.pathname;
    const isCurrentlyEnglish = currentPath.startsWith('/en');
    const langLabel = document.getElementById('langLabel');
    if (langLabel) {
      langLabel.textContent = isCurrentlyEnglish ? 'EN' : 'ES';
    }

    // Also update heroLangLabel if exists
    const heroLabel = document.getElementById('heroLangLabel');
    if (heroLabel) {
      heroLabel.textContent = isCurrentlyEnglish ? 'EN' : 'ES';
    }
  }

  /* ── 10. Mobile hamburger menu ──────────────────────────────── */
  const navHamburger = document.getElementById('navHamburger');
  const navOverlay   = document.getElementById('navOverlay');
  const navPanel     = document.getElementById('navPanel');

  if (navHamburger && navOverlay && navPanel) {
    function openMenu() {
      navHamburger.classList.add('active');
      navOverlay.classList.add('active');
      navPanel.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
      navHamburger.classList.remove('active');
      navOverlay.classList.remove('active');
      navPanel.classList.remove('active');
      document.body.style.overflow = '';
    }

    navHamburger.addEventListener('click', () => {
      if (navPanel.classList.contains('active')) closeMenu();
      else openMenu();
    });

    navOverlay.addEventListener('click', closeMenu);

    /* Close menu on link click */
    navPanel.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

});
