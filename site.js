/* chévere — shared site behavior: icons, nav dropdown, search, newsletter */

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

/* search: toggle panel, build index from blog.html post cards, live-filter */
(function () {
  var toggle = document.getElementById('search-toggle');
  var panel = document.getElementById('search-panel');
  var input = document.getElementById('search-input');
  var results = document.getElementById('search-results');
  if (!toggle || !panel || !input || !results) return;

  var index = null;

  function loadIndex(cb) {
    if (index) return cb(index);
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
        cb(index);
      })
      .catch(function () { index = []; cb(index); });
  }

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
        results.innerHTML = '<p class="search-note">No posts found for “' + esc(q.trim()) + '”.</p>';
        return;
      }
      results.innerHTML = hits.map(function (p) {
        return '<a class="search-hit" href="' + esc(p.url) + '">' +
          '<span class="kicker">' + esc(p.kicker) + '</span>' +
          '<span class="hit-title">' + esc(p.title) + '</span>' +
          '</a>';
      }).join('');
    });
  }

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      input.focus();
      loadIndex(function () {});
    }
  });

  input.addEventListener('input', function () { render(input.value); });

  document.addEventListener('click', function (e) {
    if (!panel.hidden && !panel.contains(e.target) && !toggle.contains(e.target)) {
      panel.hidden = true;
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') panel.hidden = true;
  });
})();

/* newsletter: hand the email to the Chévere Substack subscribe flow */
(function () {
  var form = document.getElementById('newsletter-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = document.getElementById('newsletter-email').value.trim();
    var url = 'https://itschevere.substack.com/subscribe';
    if (email) url += '?email=' + encodeURIComponent(email);
    window.open(url, '_blank', 'noopener');
  });
})();
