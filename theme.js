/**
 * Nexus — Focus Theme  v1.1.0
 * theme.js
 *
 * Responsibilities:
 *  1. Inject the site name / logo into the topbar
 *  2. Inject a hamburger button into the topbar
 *  3. Wire the hamburger to open/close the sidebar as an overlay
 *  4. Inject an overlay backdrop that closes the sidebar on click
 *  5. Close the sidebar when a nav item is clicked
 *  6. Clean everything up if the theme is deactivated (window unload / SPA)
 */
(function focusThemeJS() {
  'use strict';

  console.log('[Focus] theme.js executing');

  var OPEN_ATTR    = 'data-focus-sidebar';
  var LOGO_ID      = 'focus-tb-logo';
  var BURGER_ID    = 'focus-tb-burger';
  var OVERLAY_ID   = 'focus-sidebar-overlay';
  var CLEANUP_KEY  = '__nexusThemeCleanup';

  // ── Run any previous cleanup before re-initialising ────────────────────────
  if (typeof window[CLEANUP_KEY] === 'function') {
    window[CLEANUP_KEY]();
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function getSiteName() {
    console.log('[Focus] getSiteName: _appBrandingForTheme=', window._appBrandingForTheme);
    // 1. Live branding object set by applyBranding
    if (window._appBrandingForTheme && window._appBrandingForTheme.site_name) {
      return { type: 'text', value: window._appBrandingForTheme.site_name };
    }
    // 2. Cached branding in localStorage (set before theme.js runs)
    try {
      var b = JSON.parse(localStorage.getItem('nexus_branding') || '{}');
      if (b.logo_url) return { type: 'img', value: b.logo_url, alt: b.site_name || 'logo' };
      if (b.site_name) return { type: 'text', value: b.site_name };
    } catch (_) {}
    // 3. Read from the sidebar logo element if React has already rendered
    var logoEl = document.querySelector('.sb-logo .logo-text');
    if (logoEl && logoEl.textContent.trim()) {
      return { type: 'text', value: logoEl.textContent.trim() };
    }
    var logoImg = document.querySelector('.sb-logo img');
    if (logoImg) {
      return { type: 'img', value: logoImg.src, alt: logoImg.alt || 'logo' };
    }
    return { type: 'text', value: 'nexus' };
  }

  function openSidebar() {
    document.documentElement.setAttribute(OPEN_ATTR, 'open');
  }

  function closeSidebar() {
    document.documentElement.removeAttribute(OPEN_ATTR);
  }

  function toggleSidebar() {
    if (document.documentElement.hasAttribute(OPEN_ATTR)) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  // ── Inject topbar elements ──────────────────────────────────────────────────

  function injectTopbarElements() {
    var topbar = document.querySelector('.topbar');
    console.log('[Focus] injectTopbarElements: topbar=', !!topbar, 'burgerExists=', !!document.getElementById(BURGER_ID));
    if (!topbar) return false;

    // Don't inject twice
    if (document.getElementById(BURGER_ID)) return true;

    // ── Hamburger button ──────────────────────────────────────────────────────
    var burger = document.createElement('button');
    burger.id        = BURGER_ID;
    burger.className = 'focus-tb-burger';
    burger.setAttribute('aria-label', 'Toggle navigation');
    burger.setAttribute('title', 'Navigation');
    burger.innerHTML = '<i class="fa-solid fa-bars"></i>';
    burger.addEventListener('click', toggleSidebar);

    // ── Site name / logo ──────────────────────────────────────────────────────
    var logo = document.createElement('div');
    logo.id        = LOGO_ID;
    logo.className = 'focus-tb-logo';

    var branding = getSiteName();
    if (branding.type === 'img') {
      var img = document.createElement('img');
      img.src = branding.value;
      img.alt = branding.alt;
      logo.appendChild(img);
    } else {
      logo.textContent = branding.value;
    }

    // Insert: burger then logo, both before the search bar (topbar's first child)
    var firstChild = topbar.firstChild;
    topbar.insertBefore(logo, firstChild);
    topbar.insertBefore(burger, logo);

    return true;
  }

  // ── Overlay backdrop ────────────────────────────────────────────────────────

  function injectOverlay() {
    if (document.getElementById(OVERLAY_ID)) return;
    var overlay = document.createElement('div');
    overlay.id        = OVERLAY_ID;
    overlay.className = 'focus-sidebar-overlay';
    overlay.addEventListener('click', closeSidebar);
    document.body.appendChild(overlay);
  }

  // ── Close sidebar when a nav item is clicked ───────────────────────────────

  function onNavClick(e) {
    if (e.target.closest('.sb-item') || e.target.closest('.sb-sub-item')) {
      closeSidebar();
    }
  }

  // ── Initialise ──────────────────────────────────────────────────────────────

  function init() {
    console.log('[Focus] init() called, readyState:', document.readyState);
    injectOverlay();

    // If topbar is already in the DOM, inject immediately
    if (injectTopbarElements()) {
      console.log('[Focus] topbar found immediately, elements injected');
      document.addEventListener('click', onNavClick);
      return;
    }

    console.log('[Focus] topbar not found yet, starting MutationObserver');
    // Otherwise wait for React to render the topbar
    var observer = new MutationObserver(function() {
      if (injectTopbarElements()) {
        console.log('[Focus] topbar found via observer, elements injected');
        observer.disconnect();
        document.addEventListener('click', onNavClick);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Store observer reference for cleanup
    window[CLEANUP_KEY]._observer = observer;
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  // Called if the theme is swapped or the page navigates away

  window[CLEANUP_KEY] = function cleanup() {
    // Disconnect any pending observer
    if (cleanup._observer) {
      cleanup._observer.disconnect();
      cleanup._observer = null;
    }
    // Close sidebar if open
    closeSidebar();
    // Remove injected elements
    var burger  = document.getElementById(BURGER_ID);
    var logo    = document.getElementById(LOGO_ID);
    var overlay = document.getElementById(OVERLAY_ID);
    if (burger)  burger.remove();
    if (logo)    logo.remove();
    if (overlay) overlay.remove();
    // Remove nav click listener
    document.removeEventListener('click', onNavClick);
  };

  // Run on DOMContentLoaded if not yet ready, otherwise immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
