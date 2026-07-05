/* chevere -- shared site behavior: icons, nav dropdown, search, newsletter */

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

/* newsletter: POST to Substack in the background — no redirect */
(function () {
  var form = document.getElementById('newsletter-form');
  if (!form) return;
  var input = document.getElementById('newsletter-email');
  var btn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = input.value.trim();
    if (!email) return;

    btn.disabled = true;
    btn.textContent = 'Sending…';

    var body = new URLSearchParams();
    body.append('email', email);

    fetch('https://itschevere.substack.com/api/v1/subscribe', {
      method: 'POST',
      mode: 'no-cors',
      body: body
    }).then(function () {
      input.value = '';
      btn.textContent = 'You\'re in!';
      showPopup();
      setTimeout(function () {
        btn.textContent = 'I\'m In';
        btn.disabled = false;
      }, 2500);
    }).catch(function () {
      btn.textContent = 'Something went wrong';
      setTimeout(function () {
        btn.textContent = 'I\'m In';
        btn.disabled = false;
      }, 3000);
    });
  });

  function showPopup() {
    var popup = document.getElementById('newsletter-popup');
    if (!popup) return;
    popup.classList.add('newsletter-popup--visible');
    setTimeout(function () {
      popup.classList.remove('newsletter-popup--visible');
    }, 5000);
  }

  var closePopup = document.getElementById('newsletter-popup-close');
  if (closePopup) {
    closePopup.addEventListener('click', function () {
      document.getElementById('newsletter-popup').classList.remove('newsletter-popup--visible');
    });
  }
})();