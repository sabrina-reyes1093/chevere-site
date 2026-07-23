/* chevere -- shared site behavior: theme, nav, search, editorial tools, newsletter */

/* theme: apply the saved preference before rendering injected site chrome */
(function applySavedTheme() {
  try {
    var savedTheme = window.localStorage.getItem('chevere-theme');
    if (savedTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  } catch (_) { /* Local storage can be unavailable in privacy modes. */ }
})();

/* global magazine footer: newsletter, brand, navigation, social, and copyright */
(function renderGlobalFooter() {
  if (document.querySelector('.site-footer')) return;

  var headerHome = document.querySelector('.header-logo');
  var prefix = headerHome && (headerHome.getAttribute('href') || '').indexOf('../') === 0 ? '../' : '';

  var footer = [
    '<footer class="site-footer">',
    '  <section class="newsletter" id="newsletter" aria-labelledby="newsletter-heading">',
    '    <p class="newsletter-eyebrow">A weekly note from Ch&eacute;vere</p>',
    '    <h2 id="newsletter-heading">Ch&eacute;vere, Delivered</h2>',
    '    <p class="newsletter-sub">Weekly recommendations chosen with intention, plus discoveries worth sharing&mdash;straight to your inbox.</p>',
    '    <form id="newsletter-form">',
    '      <label class="sr-only" for="newsletter-email">Email address</label>',
    '      <input id="newsletter-email" name="email" type="email" placeholder="Email address" autocomplete="email" required />',
    '      <button type="submit">JOIN THE LIST</button>',
    '    </form>',
    '  </section>',
    '  <div class="footer-editorial">',
    '    <a class="footer-logo" href="' + prefix + 'index.html" aria-label="Ch&eacute;vere home"><img src="' + prefix + 'assets/logo.png" alt="Ch&eacute;vere" /></a>',
    '    <p class="footer-motto">Culture. Style. Discovery.</p>',
    '    <p class="footer-description">A thoughtful edit of the stories, places, ideas, and everyday discoveries worth sharing.</p>',
    '    <nav class="footer-nav" aria-label="Footer navigation">',
    '      <a href="' + prefix + 'index.html">Home</a>',
    '      <a href="' + prefix + 'about.html">About</a>',
    '      <a href="' + prefix + 'blog.html">Categories</a>',
    '      <a href="#newsletter">Newsletter</a>',
    '      <a href="mailto:hello@itschevere.com">Contact</a>',
    '    </nav>',
    '    <div class="footer-social" aria-label="Social media">',
    '      <a href="https://www.instagram.com/itschevere/" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>',
    '      <a href="https://www.tiktok.com/@itschevere" target="_blank" rel="noopener" aria-label="TikTok"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.3 0 .59.05.87.13v-3.5a6.37 6.37 0 0 0-.87-.06A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.46a8.23 8.23 0 0 0 4.77 1.48v-3.4a4.86 4.86 0 0 1-1.01.15z"/></svg></a>',
    '    </div>',
    '    <p class="footer-copyright">&copy; ' + new Date().getFullYear() + ' Ch&eacute;vere. All rights reserved.</p>',
    '  </div>',
    '</footer>'
  ].join('');

  var popup = [
    '<div id="newsletter-popup" class="newsletter-popup" role="status" aria-live="polite">',
    '  <button id="newsletter-popup-close" class="newsletter-popup-close" aria-label="Close">&times;</button>',
    '  <h3>You&rsquo;re in</h3>',
    '  <p>You&rsquo;re subscribed to Chévere Weekly.</p>',
    '  <p class="newsletter-popup-signoff">Stay <em>chévere</em></p>',
    '</div>'
  ].join('');

  var firstScript = document.querySelector('script');

  if (firstScript) {
    firstScript.insertAdjacentHTML('beforebegin', footer + popup);
  } else {
    document.body.insertAdjacentHTML('beforeend', footer + popup);
  }
})();

/* back to top: shared, accessible control with footer collision avoidance */
(function renderBackToTop() {
  if (document.querySelector('.back-to-top')) return;

  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'back-to-top';
  button.setAttribute('aria-label', 'Back to top');
  button.setAttribute('title', 'Back to top');
  button.innerHTML = '<i data-lucide="arrow-up" aria-hidden="true"></i>';
  document.body.appendChild(button);

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var ticking = false;

  function updateButton() {
    var baseOffset = window.innerWidth <= 620 ? 18 : 24;
    var buttonHeight = button.offsetHeight || 44;
    var maxOffset = window.innerHeight - buttonHeight - 16;
    var offset = baseOffset;
    var blocked = false;

    document.querySelectorAll('.newsletter, footer').forEach(function (element) {
      var rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        offset = Math.max(offset, window.innerHeight - rect.top + 16);
      }
    });

    if (offset >= maxOffset) blocked = true;
    button.style.setProperty('--back-to-top-offset', Math.min(offset, maxOffset) + 'px');
    button.classList.toggle('back-to-top--visible', window.scrollY > 160);
    button.classList.toggle('back-to-top--blocked', blocked);
    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateButton);
  }

  button.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  });

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  updateButton();
})();

/* dark editorial mode: shared navigation toggle with a remembered preference */
(function renderThemeToggle() {
  var actions = document.querySelector('.header-actions');
  if (!actions || document.getElementById('theme-toggle')) return;

  var button = document.createElement('button');
  button.id = 'theme-toggle';
  button.type = 'button';
  button.className = 'theme-toggle';

  function updateLabel() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    button.setAttribute('aria-label', dark ? 'Use light mode' : 'Use dark editorial mode');
    button.setAttribute('title', dark ? 'Use light mode' : 'Use dark editorial mode');
    button.innerHTML = '<i data-lucide="' + (dark ? 'sun' : 'moon') + '" stroke-width="1.7" aria-hidden="true"></i>';
    if (window.lucide) window.lucide.createIcons({ nodes: [button] });
  }

  button.addEventListener('click', function () {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (dark) {
      document.documentElement.removeAttribute('data-theme');
      try { window.localStorage.setItem('chevere-theme', 'light'); } catch (_) {}
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      try { window.localStorage.setItem('chevere-theme', 'dark'); } catch (_) {}
    }
    updateLabel();
  });

  actions.insertBefore(button, document.getElementById('search-toggle')?.nextSibling || actions.firstChild);
  updateLabel();
})();

lucide.createIcons();

/* mobile navigation: keep the full taxonomy behind a compact menu button */
(function () {
  var toggle = document.getElementById('mobile-menu-toggle');
  var nav = document.getElementById('site-navigation');
  if (!toggle || !nav) return;

  function closeMenu() {
    nav.classList.remove('mobile-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    nav.querySelectorAll('.nav-item.open').forEach(function (item) { item.classList.remove('open'); });
  }

  toggle.addEventListener('click', function () {
    var open = !nav.classList.contains('mobile-open');
    nav.classList.toggle('mobile-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });

  nav.addEventListener('click', function (event) {
    if (event.target.closest('a') && !event.target.closest('.has-dropdown > a')) closeMenu();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeMenu();
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 820) closeMenu();
  });
})();

/* nav dropdown: tap-to-open on touch devices (hover handles desktop via CSS) */
document.querySelectorAll('.nav-item.has-dropdown > a').forEach(function (a) {
  a.addEventListener('click', function (e) {
    var item = a.parentElement;
    if ((window.innerWidth <= 820 || window.matchMedia('(hover: none)').matches) && !item.classList.contains('open')) {
      e.preventDefault();
      item.classList.add('open');
      document.addEventListener('click', function (ev) {
        if (!item.contains(ev.target)) item.classList.remove('open');
      }, { once: true });
    }
  });
});

/* search: full-screen editorial overlay with live results and discovery prompts */
(function () {
  var toggle = document.getElementById('search-toggle');
  var panel = document.getElementById('search-panel');
  var input = document.getElementById('search-input');
  var results = document.getElementById('search-results');
  var closeBtn = document.getElementById('search-close');
  var submitBtn = document.getElementById('search-submit');
  if (!toggle || !panel || !input || !results) return;

  var index = null;
  var loading = false;
  var headerHome = document.querySelector('.header-logo');
  var pagePrefix = headerHome && (headerHome.getAttribute('href') || '').indexOf('../') === 0 ? '../' : '';
  var blogUrl = pagePrefix + 'blog.html';

  function loadIndex(cb) {
    if (index) return cb(index);
    if (loading) { setTimeout(function () { loadIndex(cb); }, 200); return; }
    loading = true;
    fetch(blogUrl)
      .then(function (r) { return r.text(); })
      .then(function (t) {
        var doc = new DOMParser().parseFromString(t, 'text/html');
        index = Array.prototype.slice.call(doc.querySelectorAll('.post-card')).map(function (c) {
          var grab = function (sel) {
            var el = c.querySelector(sel);
            return el ? el.textContent.trim() : '';
          };
          return {
            title: grab('h2'),
            dek: grab('.dek'),
            kicker: grab('.kicker'),
            cat: c.getAttribute('data-cat') || '',
            url: pagePrefix + (c.getAttribute('href') || c.getAttribute('data-url') || 'blog.html')
          };
        });
        loading = false;
        cb(index);
      })
      .catch(function () { index = []; loading = false; cb(index); });
  }

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function debounce(fn, delay) {
    var timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }

  function recentSearches() {
    try { return JSON.parse(window.localStorage.getItem('chevere-recent-searches') || '[]').slice(0, 4); }
    catch (_) { return []; }
  }

  function rememberSearch(query) {
    var value = query.trim();
    if (!value) return;
    var next = [value].concat(recentSearches().filter(function (item) {
      return item.toLowerCase() !== value.toLowerCase();
    })).slice(0, 4);
    try { window.localStorage.setItem('chevere-recent-searches', JSON.stringify(next)); } catch (_) {}
  }

  function renderLanding(posts) {
    var recents = recentSearches();
    var recentMarkup = recents.length
      ? '<div class="search-recent-list">' + recents.map(function (item) {
          return '<button type="button" data-search-query="' + esc(item) + '">' + esc(item) + '</button>';
        }).join('') + '</div>'
      : '<p class="search-empty-note">Your recent searches will appear here.</p>';
    var trending = posts.slice(0, 3).map(function (post, index) {
      return '<a class="search-trending-item" href="' + esc(post.url) + '">' +
        '<span>0' + (index + 1) + '</span><div><small>' + esc(post.kicker) + '</small><strong>' + esc(post.title) + '</strong></div></a>';
    }).join('');
    var categories = [
      ['Books', 'books'], ['Film', 'film-tv'], ['Style', 'style'], ['Travel', 'travel'],
      ['Food', 'food'], ['Pop Culture', 'pop-culture'], ['Life & Wellness', 'life-wellness']
    ];

    results.innerHTML = '<div class="search-discovery">' +
      '<section><h2>Recent Searches</h2>' + recentMarkup + '</section>' +
      '<section><h2>Trending Articles</h2><div class="search-trending-list">' + trending + '</div></section>' +
      '<section><h2>Browse Categories</h2><div class="search-category-list">' +
        categories.map(function (category) {
          return '<a href="' + pagePrefix + 'blog.html?cat=' + category[1] + '">' + category[0] + '</a>';
        }).join('') +
      '</div></section></div>';

    results.querySelectorAll('[data-search-query]').forEach(function (button) {
      button.addEventListener('click', function () {
        input.value = button.getAttribute('data-search-query') || '';
        render(input.value);
        input.focus();
      });
    });
  }

  function render(q) {
    var query = q.trim().toLowerCase();
    if (!query) {
      loadIndex(renderLanding);
      return;
    }
    loadIndex(function (posts) {
      if (!posts.length) {
        results.innerHTML = '<p class="search-note">Nothing published yet — check back soon.</p>';
        return;
      }
      var terms = query.split(/\s+/);
      var hits = posts.filter(function (p) {
        var hay = (p.title + ' ' + p.dek + ' ' + p.kicker + ' ' + p.cat).toLowerCase();
        return terms.every(function (t) { return hay.indexOf(t) > -1; });
      }).slice(0, 8);
      if (!hits.length) {
        results.innerHTML = '<p class="search-note">No posts found for &ldquo;' + esc(q.trim()) + '&rdquo;.</p>';
        return;
      }
      results.innerHTML = hits.map(function (p) {
        return '<a class="search-hit" href="' + esc(p.url) + '">' +
          '<span class="search-hit-kicker">' + esc(p.kicker) + '</span>' +
          '<span class="search-hit-title">' + esc(p.title) + '</span>' +
          '</a>';
      }).join('');
    });
  }

  function open() {
    panel.classList.remove('search-panel--closing');
    panel.classList.add('search-panel--open');
    document.body.classList.add('search-open');
    input.disabled = false;
    input.focus();
    window.setTimeout(function () { input.focus(); }, 100);
    loadIndex(function (posts) {
      if (!input.value.trim()) renderLanding(posts);
    });
  }

  function close() {
    panel.classList.remove('search-panel--open');
    panel.classList.add('search-panel--closing');
    document.body.classList.remove('search-open');
    input.disabled = true;
    setTimeout(function () {
      panel.classList.remove('search-panel--closing');
    }, 200);
  }

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    if (panel.classList.contains('search-panel--open')) {
      close();
    } else {
      open();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      close();
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      rememberSearch(input.value);
      render(input.value);
    });
  }

  input.addEventListener('input', debounce(function () {
    render(input.value);
  }, 250));

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      rememberSearch(input.value);
      render(input.value);
    }
  });

  panel.addEventListener('click', function (e) {
    if (e.target === panel) close();
  });

  document.addEventListener('click', function (e) {
    if (panel.classList.contains('search-panel--open') &&
        !panel.contains(e.target) && !toggle.contains(e.target)) {
      close();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();

/* newsletter: subscribe immediately after a valid email is submitted */
(function () {
  var form = document.getElementById('newsletter-form');
  if (!form) return;
  var input = document.getElementById('newsletter-email');
  var btn = form.querySelector('button[type="submit"]');
  var defaultButtonText = btn.textContent;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = input.value.trim();
    if (!email) return;

    btn.disabled = true;
    btn.textContent = 'Sending…';

    var newsletterApi = window.CHEVERE_NEWSLETTER_API_URL || 'https://newsletter.itschevere.com';
    fetch(newsletterApi + '/api/subscribe', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) throw new Error(data.error || 'Subscription request failed');
        return data;
      });
    }).then(function () {
      input.value = '';
      btn.textContent = 'You\'re in';
      showPopup();
      setTimeout(function () {
        btn.textContent = defaultButtonText;
        btn.disabled = false;
      }, 2500);
    }).catch(function (error) {
      btn.textContent = error && error.message === 'Enter a valid email address.' ? 'Check your email' : 'Please try again';
      setTimeout(function () {
        btn.textContent = defaultButtonText;
        btn.disabled = false;
      }, 3000);
    });
  });

  function showPopup() {
    var popup = document.getElementById('newsletter-popup');
    if (!popup) return;
    popup.classList.add('newsletter-popup--visible');
    document.body.classList.add('popup-open');
  }

  function hidePopup() {
    var popup = document.getElementById('newsletter-popup');
    if (!popup) return;
    popup.classList.remove('newsletter-popup--visible');
    document.body.classList.remove('popup-open');
  }

  var closePopup = document.getElementById('newsletter-popup-close');
  if (closePopup) {
    closePopup.addEventListener('click', hidePopup);
  }

  document.addEventListener('click', function (e) {
    var popup = document.getElementById('newsletter-popup');
    if (popup && popup.classList.contains('newsletter-popup--visible') && !popup.contains(e.target)) {
      hidePopup();
    }
  });
})();

/* homepage featured reads: Splide carousel fed by the newest four blog cards */
(function () {
  var track = document.getElementById('featured-track');
  if (!track) return;

  function cardMarkup(card) {
    var thumb = card.querySelector('.thumb');
    var featuredImage = card.querySelector('.featured-image');
    var kicker = card.querySelector('.kicker');
    var title = card.querySelector('h2');
    var href = card.getAttribute('href') || card.getAttribute('data-url') || 'blog.html';
    var thumbStyle = thumb ? thumb.getAttribute('style') : '';
    if (featuredImage) thumbStyle = 'background-image:url(' + featuredImage.getAttribute('src') + ');background-size:cover;background-position:center';
    return '<li class="splide__slide"><a class="featured-card" href="' + href + '">' +
      '<div class="featured-thumb" style="' + thumbStyle + '"></div>' +
      '<p class="featured-meta">' + (kicker ? kicker.innerHTML : '') + '</p>' +
      '<h3>' + (title ? title.innerHTML : '') + '</h3>' +
      '</a></li>';
  }

  function mountCarousel() {
    if (typeof window.Splide === 'undefined') return;
    var carousel = new window.Splide('#featured-carousel', {
      type: 'slide',
      rewind: false,
      arrows: false,
      perPage: 3,
      perMove: 1,
      gap: '32px',
      speed: 650,
      drag: true,
      keyboard: 'global',
      pagination: false,
      breakpoints: {
        980: { perPage: 2, gap: '24px' },
        620: { perPage: 1, gap: '18px', padding: { right: '12%' } }
      }
    });

    var previous = document.getElementById('featured-previous');
    var next = document.getElementById('featured-next');

    function updateControls() {
      var end = carousel.Components.Controller.getEnd();
      if (previous) previous.disabled = carousel.index <= 0;
      if (next) next.disabled = carousel.index >= end;
    }

    carousel.on('mounted', updateControls);
    carousel.on('moved', updateControls);
    carousel.on('resized', updateControls);
    carousel.on('updated', updateControls);
    carousel.on('refresh', updateControls);

    if (previous) previous.addEventListener('click', function () { carousel.go('<'); });
    if (next) next.addEventListener('click', function () { carousel.go('>'); });

    carousel.mount();
    updateControls();
  }

  fetch('blog.html')
    .then(function (response) { return response.text(); })
    .then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var cards = Array.prototype.slice.call(doc.querySelectorAll('.post-card'));
      var featured = cards.filter(function (card) { return card.getAttribute('data-featured') === 'true'; });
      var newest = featured.concat(cards.filter(function (card) {
        return card.getAttribute('data-featured') !== 'true';
      })).slice(0, 4);
      if (newest.length) track.innerHTML = newest.map(cardMarkup).join('');
    })
    .catch(function () { /* Keep the four server-rendered fallback cards. */ })
    .then(mountCarousel);
})();

/* homepage editorial modules: seasonal edit and the editor's current favorites */
(function renderHomepageEditorialModules() {
  var hero = document.querySelector('.home-main');
  var featuredReads = document.querySelector('.featured-reads');
  if (!hero || !featuredReads) return;

  var seasonal = document.createElement('section');
  seasonal.className = 'seasonal-edit';
  seasonal.hidden = true;
  seasonal.setAttribute('aria-labelledby', 'seasonal-edit-title');
  hero.insertAdjacentElement('afterend', seasonal);

  var loving = document.createElement('section');
  loving.className = 'currently-loving';
  loving.hidden = true;
  loving.setAttribute('aria-labelledby', 'currently-loving-title');
  featuredReads.insertAdjacentElement('afterend', loving);

  function safe(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  fetch('site-content.json', { cache: 'no-store' })
    .then(function (response) { return response.ok ? response.json() : Promise.reject(new Error('Site content unavailable')); })
    .then(function (content) {
      var banner = content.seasonal_banner || {};
      if (banner.enabled && banner.headline) {
        var inner = '<div class="seasonal-edit-inner"><p class="seasonal-label">' + safe(banner.label) + '</p>' +
          '<h2 id="seasonal-edit-title">' + safe(banner.headline) + '</h2>' +
          (banner.description ? '<p>' + safe(banner.description) + '</p>' : '') + '</div>';
        seasonal.innerHTML = banner.href ? '<a href="' + safe(banner.href) + '">' + inner + '</a>' : inner;
        seasonal.hidden = false;
      }

      var items = Array.isArray(content.currently_loving) ? content.currently_loving.filter(function (item) { return item && item.title; }).slice(0, 6) : [];
      if (items.length) {
        loving.innerHTML = '<div class="currently-loving-heading"><p>The editor&rsquo;s weekly notes</p><h2 id="currently-loving-title">Currently Loving</h2></div>' +
          '<div class="currently-loving-grid">' + items.map(function (item) {
            var card = '<article class="loving-card">' +
              (item.image_url ? '<div class="loving-image"><img src="' + safe(item.image_url) + '" alt="" loading="lazy" /></div>' : '') +
              '<p class="loving-label">' + safe(item.category) + '</p><h3>' + safe(item.title) + '</h3>' +
              (item.description ? '<p class="loving-description">' + safe(item.description) + '</p>' : '') + '</article>';
            return item.url ? '<a class="loving-card-link" href="' + safe(item.url) + '">' + card + '</a>' : '<div class="loving-card-link">' + card + '</div>';
          }).join('') + '</div>';
        loving.hidden = false;
      }
    })
    .catch(function () {
      seasonal.remove();
      loving.remove();
    });
})();

/* blog reading progress: a quiet 4px strip that tracks only the article */
(function renderReadingProgress() {
  var article = document.querySelector('.post-body');
  if (!article) return;

  var progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = '<span></span>';
  document.body.appendChild(progress);
  document.body.classList.add('has-reading-progress');
  var fill = progress.firstElementChild;
  var ticking = false;

  function update() {
    var rect = article.getBoundingClientRect();
    var articleTop = window.scrollY + rect.top;
    var articleHeight = article.offsetHeight;
    var available = Math.max(1, articleHeight - window.innerHeight * 0.55);
    var value = Math.min(1, Math.max(0, (window.scrollY - articleTop + window.innerHeight * 0.2) / available));
    fill.style.transform = 'scaleX(' + value.toFixed(4) + ')';
    progress.classList.toggle('reading-progress--complete', value >= 0.995);
    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();
})();

/* desktop article sharing: appears after the hero and yields to the footer */
(function renderArticleShare() {
  var article = document.querySelector('.post-body');
  if (!article) return;

  var share = document.createElement('aside');
  share.className = 'article-share';
  share.setAttribute('aria-label', 'Share this article');
  share.innerHTML = '<button class="article-share-toggle" type="button" aria-expanded="false"><i data-lucide="share-2" aria-hidden="true"></i><span>Share</span></button>' +
    '<div class="article-share-menu" hidden>' +
    '<button type="button" data-share="copy">Copy Link</button>' +
    '<a data-share="x" target="_blank" rel="noopener">Share on X</a>' +
    '<a data-share="facebook" target="_blank" rel="noopener">Share on Facebook</a>' +
    '<a data-share="email">Email</a></div>';
  document.body.appendChild(share);

  var toggle = share.querySelector('.article-share-toggle');
  var menu = share.querySelector('.article-share-menu');
  var url = window.location.href.split('#')[0];
  var title = document.title.replace(/\s+[—-]\s+ch.+$/i, '');
  share.querySelector('[data-share="x"]').href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(title) + '&url=' + encodeURIComponent(url);
  share.querySelector('[data-share="facebook"]').href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
  share.querySelector('[data-share="email"]').href = 'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(url);

  toggle.addEventListener('click', function () {
    var open = menu.hidden;
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  });

  share.querySelector('[data-share="copy"]').addEventListener('click', function (event) {
    var button = event.currentTarget;
    navigator.clipboard.writeText(url).then(function () {
      button.textContent = 'Link copied';
      setTimeout(function () { button.textContent = 'Copy Link'; }, 1800);
    });
  });

  function updateVisibility() {
    var hero = document.querySelector('.post-hero');
    var threshold = hero ? window.scrollY + hero.getBoundingClientRect().bottom : window.scrollY + article.getBoundingClientRect().top;
    var footer = document.querySelector('.site-footer');
    var nearFooter = footer && footer.getBoundingClientRect().top < window.innerHeight * 0.9;
    share.classList.toggle('article-share--visible', window.scrollY > threshold && !nearFooter);
    if (nearFooter) {
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    }
  }

  window.addEventListener('scroll', updateVisibility, { passive: true });
  window.addEventListener('resize', updateVisibility);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
  if (window.lucide) window.lucide.createIcons({ nodes: [share] });
  updateVisibility();
})();
