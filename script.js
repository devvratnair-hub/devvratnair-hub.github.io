(() => {
  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  const links = [...document.querySelectorAll('.site-nav a[href^="#"]')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  function closeMenu() {
    nav?.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Open navigation');
  }
  toggle?.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });
  links.forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav?.classList.contains('is-open')) {
      closeMenu(); toggle.focus();
    }
  });
  // Section start positions remain reliable even when a section is taller than the viewport.
  function updateNavigation() {
    header?.classList.toggle('is-scrolled', window.scrollY > 24);
    const marker = (header?.getBoundingClientRect().bottom || 0) + 36;
    let active;
    sections.forEach(section => {
      if (section.getBoundingClientRect().top <= marker) active = section.id;
    });
    if (sections.length && window.scrollY + innerHeight >= document.documentElement.scrollHeight - 4) {
      active = sections[sections.length - 1].id;
    }
    links.forEach(link => {
      const isActive = link.getAttribute('href') === `#${active}`;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  let scheduled = false;
  function scheduleNavigation() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; updateNavigation(); });
  }
  window.addEventListener('scroll', scheduleNavigation, { passive: true });
  window.addEventListener('resize', () => {
    if (innerWidth > 720) closeMenu();
    scheduleNavigation();
  });
  window.addEventListener('load', scheduleNavigation);
  updateNavigation();

  const privacyKey = 'dragonfruit-privacy-v1';
  const banner = document.querySelector('[data-cookie-banner]');
  const settings = [...document.querySelectorAll('[data-privacy-settings]')];
  let returnFocus;
  let choice;
  try { choice = localStorage.getItem(privacyKey); } catch { /* No optional scripts by default. */ }
  function clearHubSpotCookies(names = ['__hstc', 'hubspotutk', '__hssc', '__hssrc', 'messagesUtk', 'hs-messages-is-open', 'hs-messages-hide-welcome-message']) {
    names.forEach(name => {
      const expired = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      document.cookie = expired;
      document.cookie = `${expired}; domain=${location.hostname}`;
      document.cookie = `${expired}; domain=.${location.hostname}`;
    });
  }
  function loadHubSpot() {
    if (document.getElementById('hs-script-loader')) return;
    clearHubSpotCookies(['__hs_do_not_track']);
    window.hsConversationsSettings = { enableWidgetCookieBanner: true };
    const script = document.createElement('script');
    script.id = 'hs-script-loader'; script.async = true;
    script.src = 'https://js-na3.hs-scripts.com/343398568.js';
    script.addEventListener('error', () => {
      document.querySelectorAll('[data-chat-status]').forEach(status => {
        status.textContent = 'Chat could not load. Please use email or book a consultation.';
      });
    });
    document.body.append(script);
  }
  function updateChatStatus() {
    document.querySelectorAll('[data-chat-status]').forEach(status => {
      status.textContent = choice === 'optional'
        ? 'Chat is enabled. Reply times vary; email or booking are available for project enquiries.'
        : 'To use chat, allow chat and analytics in Privacy settings. Email and booking are always available.';
    });
  }
  settings.forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      returnFocus = button; banner.hidden = false;
      document.getElementById('privacy-choice-title').focus();
    });
  });
  document.querySelectorAll('[data-privacy-choice]').forEach(button => {
    button.addEventListener('click', () => {
      const previous = choice;
      choice = button.dataset.privacyChoice;
      try { localStorage.setItem(privacyKey, choice); } catch { /* Applies to this visit if storage is blocked. */ }
      banner.hidden = true; returnFocus?.focus(); updateChatStatus();
      if (choice === 'optional') loadHubSpot();
      else {
        if (window.HubSpotConversations) {
          window.HubSpotConversations.clear();
          window.HubSpotConversations.widget.remove();
        }
        if (window._hsq) {
          window._hsq.push(['revokeCookieConsent']);
          window._hsq.push(['doNotTrack']);
        }
        clearHubSpotCookies();
        // Unload previously accepted third-party scripts completely.
        if (previous === 'optional') location.reload();
      }
    });
  });
  window.addEventListener('storage', event => {
    if (event.key === privacyKey) location.reload();
  });
  if (choice === 'optional') loadHubSpot();
  else {
    clearHubSpotCookies();
    if (banner) banner.hidden = choice === 'essential';
  }
  updateChatStatus();
})();
