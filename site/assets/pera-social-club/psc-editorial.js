(() => {
  const mount = root => {
    if (root.dataset.pscMounted) return;
    root.dataset.pscMounted = 'true';
    const $ = selector => root.querySelector(selector);
    const $$ = selector => [...root.querySelectorAll(selector)];
    const abort = new AbortController();
    const on = (node, event, handler, options = {}) => node.addEventListener(event, handler, {...options, signal: abort.signal});
    const words = JSON.parse($('[data-psc-translations]').textContent);
    let lang = root.dataset.language || (navigator.language.toLowerCase().startsWith('tr') ? 'tr' : 'en');
    try { const saved = localStorage.getItem('psc-site-language'); if (['tr', 'en'].includes(saved)) lang = saved; } catch {}
    if (!['tr', 'en'].includes(lang)) lang = 'en';
    const t = (key, variables = {}) => (words[lang][key] || words.en[key] || key).replace(/\{(\w+)\}/g, (_, name) => variables[name] ?? '');
    const cards = $$('.psc-card');
    const validIds = new Set(cards.map(card => card.dataset.id));
    const storageKey = 'psc-design-favorites-v2';
    let selected = new Set();
    let storageWorks = true;
    try { const ids = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (Array.isArray(ids)) selected = new Set(ids.filter(id => validIds.has(id))); } catch { storageWorks = false; }
    let filter = root.dataset.initialFilter || 'all', category = 'all', limit = 128, currentCard = null, media = [], mediaIndex = 0;
    const dialog = $('[data-modal]');
    const normalize = value => (value || '').toLocaleLowerCase('tr-TR').replace(/ı/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const status = value => { $('[data-status]').textContent = value; };
    const selectedText = () => 'Pera Social Club — ' + t('mySelection') + '\n' + cards.filter(card => selected.has(card.dataset.id)).map(card => `${card.dataset.id} — ${card.dataset.name}`).join('\n');
    const updateButtons = () => {
      $$('[data-favorite]').forEach(button => {
        const id = button.dataset.favorite, active = selected.has(id);
        button.setAttribute('aria-pressed', String(active));
        button.textContent = active ? '♥' : '♡';
        button.setAttribute('aria-label', `${id} — ${t(active ? 'removeFavorite' : 'addFavorite')}`);
      });
      $$('[data-favorite-count]').forEach(el => el.textContent = selected.size);
      $('[data-selection-count]').textContent = selected.size ? t('savedSelection', {count:selected.size}) : t('startSelection');
      $('[data-copy]').disabled = !selected.size;
      $('[data-download]').disabled = !selected.size;
      if (currentCard) {
        const active = selected.has(currentCard.dataset.id), button = $('[data-modal-favorite]');
        button.textContent = (active ? '♥ ' : '♡ ') + t(active ? 'inFavorites' : 'addFavorite');
        button.setAttribute('aria-pressed', String(active));
        button.setAttribute('aria-label', t(active ? 'removeFavorite' : 'addFavorite'));
      }
      if (!$('[data-copy-area]').hidden) $('[data-copy-area]').value = selectedText();
    };
    const render = () => {
      const query = normalize($('[data-search]').value.trim());
      const matches = cards.filter(card => (category === 'all' || category === card.dataset.category) && (filter === 'all' || (filter === 'favorites' ? selected.has(card.dataset.id) : filter === card.dataset.series)) && (!query || normalize(card.dataset.search).includes(query)));
      const visible = new Set(matches.slice(0, limit));
      cards.forEach(card => card.hidden = !visible.has(card));
      $('.psc-grid').classList.toggle('psc-grid-new', ['new','midjourney','wardrobe'].includes(filter) || ['sweatshirts','bottoms','tops'].includes(category));
      $$('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
      $$('[data-category-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.categoryFilter === category)));
      $('[data-results]').textContent = t('results', {count:matches.length}) + (matches.length > limit ? t('showingFirst', {count:limit}) : '');
      $('[data-empty]').hidden = matches.length > 0;
      $('[data-empty-text]').textContent = t(filter === 'favorites' && !selected.size ? 'noFavorites' : 'noResults');
      $('[data-more]').hidden = matches.length <= limit;
      updateButtons();
    };
    const toggleFavorite = id => {
      if (!validIds.has(id)) return;
      selected.has(id) ? selected.delete(id) : selected.add(id);
      try { localStorage.setItem(storageKey, JSON.stringify([...selected])); } catch { storageWorks = false; }
      render();
      status(storageWorks ? t(selected.has(id) ? 'favoriteAdded' : 'favoriteRemoved', {id}) : t('storageUnavailable'));
    };
    const chooseFilter = value => { filter = value; category = 'all'; limit = 128; render(); };
    $$('[data-category-filter]').forEach(button => on(button, 'click', () => { category = button.dataset.categoryFilter; filter = 'all'; limit = 128; $('[data-search]').value = ''; render(); }));
    $$('[data-filter]').forEach(button => on(button, 'click', () => chooseFilter(button.dataset.filter)));
    $$('[data-open-filter]').forEach(link => on(link, 'click', () => { $('[data-search]').value = ''; chooseFilter(link.dataset.openFilter); }));
    on($('[data-search]'), 'input', () => { limit = 128; render(); });
    on($('[data-more]'), 'click', () => { limit += 24; render(); });
    $$('[data-favorite]').forEach(button => on(button, 'click', () => toggleFavorite(button.dataset.favorite)));

    const showMedia = index => {
      if (!currentCard || !media.length) return;
      mediaIndex = (index + media.length) % media.length;
      const view = media[mediaIndex], img = $('[data-modal-image]');
      img.src = view.src;
      img.alt = `${currentCard.dataset.name} — ${t(view.key)}`;
      $('[data-media-label]').textContent = `${String(mediaIndex + 1).padStart(2, '0')} / ${String(media.length).padStart(2, '0')} — ${t(view.key)}`;
      $$('[data-thumbnail]').forEach((button, index) => button.setAttribute('aria-pressed', String(index === mediaIndex)));
      $('[data-modal-description]').textContent = currentCard.querySelector('.psc-card-caption').textContent + ' · ' + t('previewShort');
      $('[data-media-prev]').hidden = $('[data-media-next]').hidden = media.length < 2;
    };
    const fillThumbnails = () => {
      const list = $('[data-thumbnails]'); list.replaceChildren();
      media.forEach((view, index) => {
        const button = document.createElement('button'); button.type = 'button'; button.dataset.thumbnail = index;
        button.setAttribute('aria-label', t(view.key)); button.setAttribute('aria-pressed', String(index === mediaIndex));
        const image = document.createElement('img'); image.src = view.src; image.alt = ''; image.loading = 'lazy';
        const label = document.createElement('span'); label.textContent = t(view.key);
        button.append(image, label); button.addEventListener('click', () => showMedia(index)); list.append(button);
      });
    };
    $$('.psc-card-image-link, [data-open-card]').forEach(link => on(link, 'click', event => {
      if (typeof dialog.showModal !== 'function' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); currentCard = link.closest('.psc-card');
      media = [...currentCard.querySelectorAll('[data-media-src]')].map(el => ({src:el.dataset.mediaSrc, key:el.dataset.mediaKey}));
      if (!media.length) media = [{src:currentCard.dataset.full, key:'overview'}];
      const sourceLink = $('[data-source-link]');
      sourceLink.hidden = !currentCard.dataset.sourceOriginal;
      if (currentCard.dataset.sourceOriginal) sourceLink.href = currentCard.dataset.sourceOriginal; else sourceLink.removeAttribute('href');
      mediaIndex = 0; $('[data-modal-title]').textContent = `${currentCard.dataset.id} / ${currentCard.dataset.name}`;
      fillThumbnails(); showMedia(0); updateButtons(); dialog.showModal(); scheduleHero();
    }));
    on($('[data-media-prev]'), 'click', () => showMedia(mediaIndex - 1));
    on($('[data-media-next]'), 'click', () => showMedia(mediaIndex + 1));
    on($('[data-close]'), 'click', () => dialog.close());
    on(dialog, 'close', () => scheduleHero());
    on(dialog, 'keydown', event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); showMedia(mediaIndex + (event.key === 'ArrowRight' ? 1 : -1)); } });
    on(dialog, 'click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
    let touchStart = null;
    on($('.psc-gallery-stage'), 'touchstart', event => { touchStart = event.touches.length === 1 ? {x:event.touches[0].clientX,y:event.touches[0].clientY} : null; }, {passive:true});
    on($('.psc-gallery-stage'), 'touchend', event => {
      if (!touchStart || !event.changedTouches.length) return;
      const dx = event.changedTouches[0].clientX - touchStart.x, dy = event.changedTouches[0].clientY - touchStart.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) showMedia(mediaIndex + (dx < 0 ? 1 : -1));
      touchStart = null;
    }, {passive:true});
    on($('[data-modal-favorite]'), 'click', () => currentCard && toggleFavorite(currentCard.dataset.id));
    on($('[data-copy]'), 'click', async () => {
      try { await navigator.clipboard.writeText(selectedText()); status(t('copied')); }
      catch { const area = $('[data-copy-area]'); area.hidden = false; area.value = selectedText(); area.focus(); area.select(); status(t('copyFallback')); }
    });
    on($('[data-download]'), 'click', () => {
      const url = URL.createObjectURL(new Blob([selectedText()], {type:'text/plain;charset=utf-8'}));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `pera-social-club-${lang === 'tr' ? 'secimlerim' : 'my-selection'}.txt`; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000); status(t('downloaded'));
    });
    on(window, 'storage', event => {
      if (event.key === storageKey) try { const ids = JSON.parse(event.newValue || '[]'); if (Array.isArray(ids)) { selected = new Set(ids.filter(id => validIds.has(id))); render(); } } catch {}
    });

    const hero = $('[data-hero]'), slides = $$('[data-hero-slide]'), dots = $$('[data-hero-dot]');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let scene = 0, paused = reducedMotion.matches, hover = false, focused = false, timer;
    const updatePause = () => {
      $('[data-hero-pause]').textContent = paused ? '▶' : 'Ⅱ';
      $('[data-hero-pause]').setAttribute('aria-label', t(paused ? 'play' : 'pause'));
      $('[data-hero-pause]').setAttribute('aria-pressed', String(paused));
      $('[data-hero-pause]').title = t(paused ? 'play' : 'pause');
    };
    function scheduleHero() {
      clearTimeout(timer);
      if (root.isConnected && !paused && !hover && !focused && !document.hidden && !dialog.open) timer = setTimeout(() => setScene(scene + 1), 6500);
    }
    function setScene(index) {
      scene = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => { slide.classList.toggle('is-active', i === scene); slide.setAttribute('aria-hidden', String(i !== scene)); });
      dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === scene)));
      $('[data-hero-caption]').textContent = `${String(scene + 1).padStart(2,'0')} / ${slides[scene].dataset.caption}`;
      scheduleHero();
    }
    dots.forEach((button, index) => on(button, 'click', () => setScene(index)));
    on($('[data-hero-prev]'), 'click', () => setScene(scene - 1));
    on($('[data-hero-next]'), 'click', () => setScene(scene + 1));
    on($('[data-hero-pause]'), 'click', () => { paused = !paused; updatePause(); scheduleHero(); });
    on(hero, 'mouseenter', () => { hover = true; scheduleHero(); });
    on(hero, 'mouseleave', () => { hover = false; scheduleHero(); });
    on(hero, 'focusin', () => { focused = true; scheduleHero(); });
    on(hero, 'focusout', event => { focused = hero.contains(event.relatedTarget); scheduleHero(); });
    on(document, 'visibilitychange', scheduleHero);
    on(reducedMotion, 'change', event => { paused = event.matches; updatePause(); scheduleHero(); });
    const setLanguage = value => {
      lang = value; root.lang = lang;
      if (root.dataset.preview === 'true') { document.documentElement.lang = lang; document.title = `Pera Social Club — ${lang === 'tr' ? 'Koleksiyon | Artvelix' : 'Collection | Artvelix'}`; }
      $$('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
      for (const [dataKey, attribute] of [['i18nAria','aria-label'], ['i18nPlaceholder','placeholder'], ['i18nAlt','alt']]) {
        const selector = dataKey.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());
        $$(`[data-${selector}]`).forEach(el => el.setAttribute(attribute, t(el.dataset[dataKey])));
      }
      $$('[data-tr][data-en]').forEach(el => el.textContent = el.dataset[lang]);
      $$('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === lang)));
      dots.forEach((button, index) => button.setAttribute('aria-label', `${t('scene')} ${index + 1}: ${slides[index].dataset.caption}`));
      cards.forEach(card => {
        card.querySelectorAll('.psc-card-image-link, [data-open-card]').forEach(link => link.setAttribute('aria-label', `${card.dataset.name} — ${t('viewDesign')}`));
        card.querySelector('img').alt = `${card.dataset.name} — ${t(card.dataset.coverView || 'overview')}`;
      });
      status(''); updatePause(); render();
      if (currentCard) { fillThumbnails(); showMedia(mediaIndex); }
    };
    $$('[data-language]').forEach(button => on(button, 'click', () => {
      setLanguage(button.dataset.language);
      try { localStorage.setItem('psc-site-language', lang); } catch {}
    }));
    on(document, 'shopify:section:unload', event => { if (event.target.contains(root)) { clearTimeout(timer); abort.abort(); } });
    setLanguage(lang); setScene(0);
  };
  const boot = () => document.querySelectorAll('[data-psc-refresh]').forEach(mount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  document.addEventListener('shopify:section:load', boot);
})();
