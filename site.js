/* chevere -- shared site behavior: icons, nav dropdown, search, newsletter */

/* global newsletter component: render once, after page content and before the footer */
(function renderGlobalNewsletter() {
  if (document.getElementById('newsletter')) return;

  var section = [
    '<section class="newsletter" id="newsletter" aria-labelledby="newsletter-heading">',
    '  <h2 id="newsletter-heading">The Edit, Delivered</h2>',
    '  <p class="newsletter-sub">Get Chévere in your inbox&mdash;a weekly curation of finds worth discovering.</p>',
    '  <form id="newsletter-form">',
    '    <label class="sr-only" for="newsletter-email">Email address</label>',
    '    <input id="newsletter-email" name="email" type="email" placeholder="Email address" autocomplete="email" required />',
    '    <button type="submit">I&rsquo;M IN</button>',
    '  </form>',
    '</section>'
  ].join('');

  var popup = [
    '<div id="newsletter-popup" class="newsletter-popup" role="status" aria-live="polite">',
    '  <button id="newsletter-popup-close" class="newsletter-popup-close" aria-label="Close">&times;</button>',
    '  <h3>Check your inbox</h3>',
    '  <p>Confirm your email to join The Edit, Delivered.</p>',
    '  <p class="newsletter-popup-signoff">Stay <em>chévere</em></p>',
    '</div>'
  ].join('');

  var footer = document.querySelector('footer');
  var firstScript = document.querySelector('script');

  if (footer) {
    footer.insertAdjacentHTML('beforebegin', section);
    footer.insertAdjacentHTML('afterend', popup);
  } else if (firstScript) {
    firstScript.insertAdjacentHTML('beforebegin', section + popup);
  } else {
    document.body.insertAdjacentHTML('beforeend', section + popup);
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

lucide.createIcons();

/* nav dropdown: tap-to-open on touch devices (hover handles desktop via CSS) */
document.querySelectorAll('.nav-item.has-dropdown > a').forEach(function (a) {
  a.addEventListener('click', function (e) {
    var item = a.parentElement;
    if (window.matchMedia('(hover: none)').matches && !item.classList.contains('open')) {
      e.preventDefault();
      item.classList.add('open');
      document.addEventListener('click', function (ev) {
        if (!item.contains(ev.target)) item.classList.remove('open');
      }, { once: true });
    }
  });
});

/* search: toggle panel, build index from blog.html post cards, live-filter with debounce */
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

  function loadIndex(cb) {
    if (index) return cb(index);
    if (loading) { setTimeout(function () { loadIndex(cb); }, 200); return; }
    loading = true;
    fetch('blog.html')
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
            url: c.getAttribute('href') || 'blog.html'
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

  function render(q) {
    var query = q.trim().toLowerCase();
    if (!query) { results.innerHTML = ''; return; }
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
    loadIndex(function () {});
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
      render(input.value);
    });
  }

  input.addEventListener('input', debounce(function () {
    render(input.value);
  }, 250));

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      render(input.value);
    }
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

/* newsletter: create a pending subscriber and send double-opt-in confirmation */
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    }).then(function (response) {
      if (!response.ok) throw new Error('Subscription request failed');
      input.value = '';
      btn.textContent = 'Check your inbox';
      showPopup();
      setTimeout(function () {
        btn.textContent = defaultButtonText;
        btn.disabled = false;
      }, 2500);
    }).catch(function () {
      btn.textContent = 'Something went wrong';
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
    var kicker = card.querySelector('.kicker');
    var title = card.querySelector('h2');
    return '<li class="splide__slide"><a class="featured-card" href="' + (card.getAttribute('href') || 'blog.html') + '">' +
      '<div class="featured-thumb" style="' + (thumb ? thumb.getAttribute('style') : '') + '"></div>' +
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
      gap: '24px',
      speed: 650,
      drag: true,
      keyboard: 'global',
      pagination: false,
      breakpoints: {
        980: { perPage: 2 },
        620: { perPage: 1, gap: '16px', padding: { right: '12%' } }
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
      var newest = Array.prototype.slice.call(doc.querySelectorAll('.post-card')).slice(0, 4);
      if (newest.length) track.innerHTML = newest.map(cardMarkup).join('');
    })
    .catch(function () { /* Keep the four server-rendered fallback cards. */ })
    .then(mountCarousel);
})();
