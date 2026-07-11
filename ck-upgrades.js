/* ============================================================
   CreatorKit Upgrades v2 — analytics, deep links, UX, perf
   index.html me </body> se pehle: <script defer src="/ck-upgrades.js"></script>
   v2 ke saath: index.html ke <head> se Razorpay wali line DELETE karo:
   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
   (ye file usko page-load ke baad khud load kar legi — payment same rahega)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. VERCEL ANALYTICS (pageviews) ---------- */
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  var s = document.createElement('script');
  s.defer = true;
  s.src = '/_vercel/insights/script.js';
  document.head.appendChild(s);

  function track(name, data) {
    try { window.va('event', { name: name, data: data || {} }); } catch (e) {}
  }

  /* ---------- 2. RAZORPAY LAZY-LOAD (perf) ----------
     Head se hata ke page load ke BAAD load karte hain —
     pehli visit fast hogi, payment bilkul same kaam karega. */
  function loadRazorpay() {
    if (window.Razorpay || document.getElementById('ckRzpScript')) return;
    var r = document.createElement('script');
    r.id = 'ckRzpScript';
    r.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(r);
  }
  if (document.readyState === 'complete') {
    setTimeout(loadRazorpay, 1200);
  } else {
    window.addEventListener('load', function () { setTimeout(loadRazorpay, 1200); });
  }
  // Safety net: agar user turant unlock pe click kare to usi waqt load ho jaye
  document.addEventListener('click', function (e) {
    if (e.target.closest('.price-cta, #navCtaBtn')) loadRazorpay();
  }, true);

  /* ---------- 3. UNIVERSAL CSS TRANSITION FIX (perf) ----------
     `*, *::before, *::after { transition: ... }` wali rule puri site ko
     scroll/hover pe slow karti hai. Usse hata ke sirf theme-switch ke
     waqt 400ms ke liye lagate hain — theme toggle smooth hi rahega. */
  try {
    outer:
    for (var i = 0; i < document.styleSheets.length; i++) {
      var sheet = document.styleSheets[i];
      var rules;
      try { rules = sheet.cssRules; } catch (err) { continue; } // cross-origin skip
      if (!rules) continue;
      for (var j = 0; j < rules.length; j++) {
        var rule = rules[j];
        if (rule.selectorText &&
            rule.selectorText.indexOf('*') === 0 &&
            rule.selectorText.indexOf('::before') !== -1 &&
            rule.style && rule.style.transition) {
          sheet.deleteRule(j);
          break outer;
        }
      }
    }
    var themeCss = document.createElement('style');
    themeCss.textContent =
      '.ck-theme-anim, .ck-theme-anim *, .ck-theme-anim *::before, .ck-theme-anim *::after{' +
      'transition: background-color .25s ease, border-color .25s ease, color .2s ease !important;}';
    document.head.appendChild(themeCss);
    var themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        document.documentElement.classList.add('ck-theme-anim');
        setTimeout(function () {
          document.documentElement.classList.remove('ck-theme-anim');
        }, 450);
      }, true);
    }
  } catch (e) {}

  /* ---------- 4. FUNNEL EVENTS ---------- */
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
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.price-cta, #navCtaBtn');
    if (btn && /\$5|unlock/i.test(btn.textContent)) track('checkout_opened');
    var card = e.target.closest('.tool-card');
    if (card) {
      var title = card.querySelector('.tool-title');
      track('tool_opened', { tool: title ? title.textContent.trim() : 'unknown' });
    }
  }, true);
  var genBtn = document.getElementById('generateBtn');
  if (genBtn) genBtn.addEventListener('click', function () { track('demo_used'); });

  /* ---------- 5. ?tool= DEEP LINKS (SEO pages ke buttons) ---------- */
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

  /* ---------- 6. ESCAPE SE MODAL CLOSE (a11y) ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal-overlay.active').forEach(function (m) {
      m.classList.remove('active');
    });
  });

  /* ---------- 7. PREFERS-REDUCED-MOTION (perf + a11y) ---------- */
  var css = document.createElement('style');
  css.textContent =
    '@media (prefers-reduced-motion: reduce){' +
    '*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important}' +
    'html{scroll-behavior:auto!important}' +
    '#cursorGlow,#heroParticles{display:none!important}' +
    '}';
  document.head.appendChild(css);
  if (window.matchMedia('(hover: none)').matches) {
    var glow = document.getElementById('cursorGlow');
    if (glow) glow.style.display = 'none';
  }

  /* ---------- 8. INR PRICE HINT (India visitors) ---------- */
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
