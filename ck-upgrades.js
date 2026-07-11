/* ============================================================
   CreatorKit Upgrades — analytics, deep links, UX & a11y fixes
   Add to index.html just before </body>:
   <script defer src="/ck-upgrades.js"></script>
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. VERCEL ANALYTICS (pageviews) ----------
     Enable in Vercel dashboard: Project → Analytics → Enable */
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  var s = document.createElement('script');
  s.defer = true;
  s.src = '/_vercel/insights/script.js';
  document.head.appendChild(s);

  function track(name, data) {
    try { window.va('event', { name: name, data: data || {} }); } catch (e) {}
  }

  /* ---------- 2. FUNNEL EVENTS ---------- */
  // paywall_seen — user scrolled to pricing
  var pricing = document.getElementById('pricing');
  if (pricing && 'IntersectionObserver' in window) {
    var seen = false;
    new IntersectionObserver(function (entries) {
      if (!seen && entries[0].isIntersecting) {
        seen = true;
        track('paywall_seen');
      }
    }, { threshold: 0.3 }).observe(pricing);
  }

  // checkout_opened — any "$5" unlock CTA clicked
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.price-cta, #navCtaBtn');
    if (btn && /\$5|unlock/i.test(btn.textContent)) track('checkout_opened');
    var card = e.target.closest('.tool-card');
    if (card) {
      var title = card.querySelector('.tool-title');
      track('tool_opened', { tool: title ? title.textContent.trim() : 'unknown' });
    }
  }, true);

  // demo_used — free caption demo generated
  var genBtn = document.getElementById('generateBtn');
  if (genBtn) genBtn.addEventListener('click', function () { track('demo_used'); });

  /* ---------- 3. ?tool= DEEP LINKS (used by the SEO tool pages) ----------
     /?tool=qr | invoice | image | screenshot | caption  */
  var TOOL_OPENERS = {
    qr: 'openQrModal',
    invoice: 'openInvoiceModal',
    image: 'openImageToolModal',
    screenshot: 'openScreenshotModal',
    caption: 'openCaptionModal'
  };
  function openFromParam() {
    try {
      var tool = new URLSearchParams(location.search).get('tool');
      if (!tool || !TOOL_OPENERS[tool]) return;
      var fn = window[TOOL_OPENERS[tool]];
      if (typeof fn === 'function') {
        fn();
        track('tool_opened', { tool: tool, source: 'seo_page' });
      }
    } catch (e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(openFromParam, 300); });
  } else {
    setTimeout(openFromParam, 300);
  }

  /* ---------- 4. ESCAPE KEY CLOSES MODALS (a11y) ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal-overlay.active').forEach(function (m) {
      m.classList.remove('active');
    });
  });

  /* ---------- 5. PREFERS-REDUCED-MOTION (perf + a11y) ---------- */
  var css = document.createElement('style');
  css.textContent =
    '@media (prefers-reduced-motion: reduce){' +
    '*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important}' +
    'html{scroll-behavior:auto!important}' +
    '#cursorGlow,#heroParticles{display:none!important}' +
    '}';
  document.head.appendChild(css);

  // Also hide the custom cursor glow on touch devices (it's pointless there)
  if (window.matchMedia('(hover: none)').matches) {
    var glow = document.getElementById('cursorGlow');
    if (glow) glow.style.display = 'none';
  }

  /* ---------- 6. INR PRICE HINT FOR INDIAN VISITORS ---------- */
  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') {
      var amount = document.querySelector('.price-amount[data-count="5"]');
      if (amount && !document.getElementById('ckInrHint')) {
        var hint = document.createElement('div');
        hint.id = 'ckInrHint';
        hint.style.cssText = 'font-size:0.8rem;color:var(--muted);margin-top:4px;font-family:monospace;';
        hint.textContent = '≈ ₹425 · UPI accepted';
        var top = amount.closest('.price-top');
        if (top && top.parentNode) top.parentNode.insertBefore(hint, top.nextSibling);
      }
    }
  } catch (e) {}
})();
