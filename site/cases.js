(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const storageKey = 'phone-cases-100-review-v1';
  const imageChecks = new Map();
  let products = [], target = 100, complete = false, textOnly = false, favoritesOnly = false;
  let current = null, dialogIds = [], heroId = null, saved = new Set();
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(stored)) saved = new Set(stored.filter(id => typeof id === 'string'));
  } catch {}

  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify([...saved])); } catch {}
    $('#fav-count').textContent = saved.size;
  }
  function visible() {
    const query = $('#search').value.trim().toLocaleLowerCase('tr');
    const theme = $('#theme').value;
    return products.filter(product => (!theme || product.theme === theme)
      && (!textOnly || product.slogan)
      && (!favoritesOnly || saved.has(product.id))
      && `${product.id} ${product.title} ${product.theme} ${product.slogan}`.toLocaleLowerCase('tr').includes(query));
  }
  function cardMarkup(product) {
    return `<button class="card-open" data-open="${esc(product.id)}" aria-label="${esc(product.title)} telefon kılıfını büyüt"><div class="photo"><img src="${esc(product.image)}" alt="${esc(product.title)} desenli telefon kılıfı ürün önizlemesi" loading="lazy" decoding="async" width="1254" height="1254"></div><div class="meta"><span>TELEFON KILIFI</span><span>${esc(product.theme)}</span></div><h3>${esc(product.title)}</h3><p class="quote"${product.slogan ? ' lang="en"' : ''}>${product.slogan ? `“${esc(product.slogan)}”` : '&nbsp;'}</p></button><span class="badge">${esc(product.id)}</span><button class="heart" data-fav="${esc(product.id)}" aria-pressed="${saved.has(product.id)}" aria-label="${esc(product.title)}: ${saved.has(product.id) ? 'beğenimi kaldır' : 'beğen'}">${saved.has(product.id) ? '♥' : '♡'}</button>`;
  }
  function variedOrder(items) {
    const groups = new Map();
    for (const item of items) {
      if (!groups.has(item.theme)) groups.set(item.theme, []);
      groups.get(item.theme).push(item);
    }
    const ordered = [];
    while (ordered.length < items.length) {
      for (const group of groups.values()) if (group.length) ordered.push(group.shift());
    }
    return ordered;
  }
  function render(preserveScroll = false) {
    const grid = $('#grid');
    const anchor = preserveScroll ? [...grid.children].find(element => element.getBoundingClientRect().bottom > 0) : null;
    const anchorTop = anchor?.getBoundingClientRect().top;
    const filtered = visible();
    const existing = new Map([...grid.children].map(element => [element.dataset.id, element]));
    const activeIds = new Set(filtered.map(product => product.id));
    for (const [id, element] of existing) if (!activeIds.has(id)) element.remove();
    filtered.forEach((product, index) => {
      let element = existing.get(product.id);
      const signature = JSON.stringify([product, saved.has(product.id)]);
      if (!element) {
        element = document.createElement('article');
        element.className = 'card';
        element.dataset.id = product.id;
      }
      if (element.dataset.signature !== signature) {
        element.innerHTML = cardMarkup(product);
        element.dataset.signature = signature;
      }
      if (grid.children[index] !== element) grid.insertBefore(element, grid.children[index] || null);
    });
    if (anchor?.isConnected && anchorTop < window.innerHeight && !$('#detail').open) {
      const delta = anchor.getBoundingClientRect().top - anchorTop;
      if (delta) window.scrollTo({top: window.scrollY + delta, behavior: 'instant'});
    }
    $('#result-count').textContent = `${filtered.length} tasarım${products.length !== filtered.length ? ` / ${products.length} hazır` : ''}`;
    $('#empty').hidden = filtered.length > 0;
    $('#empty-title').textContent = products.length ? 'Bu seçimde tasarım yok.' : 'Yeni kılıflar hazırlanıyor.';
    $('#empty-copy').textContent = products.length ? 'Farklı bir tema seçebilir veya filtreleri temizleyebilirsin.' : 'Hazır olan tasarımlar bu sayfada kendiliğinden görünecek.';
    $('#reset').hidden = !textOnly && !favoritesOnly && !$('#search').value && !$('#theme').value;
    $('#only-text').setAttribute('aria-pressed', String(textOnly));
    $('#favorites').setAttribute('aria-pressed', String(favoritesOnly));
    persist();
  }
  function refreshSummary() {
    const written = products.filter(product => product.slogan).length;
    $('#ready-total').textContent = products.length;
    $('#target-total').textContent = target;
    $('#written-total').textContent = written;
    $('#progress').textContent = complete
      ? `${products.length} farklı tasarım · ${written} İngilizce yazılı · ${products.length - written} yalnızca desenli`
      : `${products.length} / ${target} tasarım hazır · Yenileri buraya ekleniyor`;
    const theme = $('#theme').value;
    const themes = [...new Set(products.map(product => product.theme).filter(Boolean))].sort((a,b) => a.localeCompare(b,'tr'));
    $('#theme').innerHTML = '<option value="">Tüm temalar</option>' + themes.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('');
    if (themes.includes(theme)) $('#theme').value = theme;
    if (!heroId && products.length) {
      const product = products.find(item => item.slogan) || products[0];
      heroId = product.id;
      $('#hero-image').src = product.image;
      $('#hero-image').alt = `${product.title} desenli telefon kılıfı ürün önizlemesi`;
      $('#hero-title').textContent = `${product.id} / ${product.title}`;
      $('#hero-image').hidden = $('#hero-caption').hidden = false;
      $('#hero-wait').hidden = true;
    }
  }
  function toggleFavorite(id) {
    saved.has(id) ? saved.delete(id) : saved.add(id);
    render();
    if (current) showDetail(current, false);
  }
  function showDetail(id, resetList = true) {
    const product = products.find(item => item.id === id);
    if (!product) return;
    const changed = current !== id;
    current = id;
    if (resetList) dialogIds = visible().map(item => item.id);
    if (!dialogIds.includes(id)) dialogIds = [id];
    $('#detail-id').textContent = `TELEFON KILIFI / ${product.id}`;
    $('#detail-title').textContent = product.title;
    $('#detail-theme').textContent = product.theme;
    $('#detail-image').src = product.image;
    $('#detail-image').alt = `${product.title} desenli telefon kılıfının büyük ürün önizlemesi`;
    $('#detail-quote').hidden = !product.slogan;
    $('#detail-quote').textContent = product.slogan ? `“${product.slogan}”` : '';
    $('#detail-description').textContent = product.slogan
      ? 'İngilizce söz, bu desenin renklerine ve kompozisyonuna göre yerleştirildi. Yazıyı ve resmi kılıfın üzerinde birlikte incele.'
      : 'Bu tasarımda desen tek başına. Renklerin, çizgilerin ve resmin kılıf üzerindeki yerleşimini incele.';
    $('#detail-fav').textContent = saved.has(id) ? 'Beğenimi kaldır ♥' : 'Bu tasarımı beğendim ♡';
    $('#detail-fav').setAttribute('aria-pressed', String(saved.has(id)));
    $('#download').href = product.image;
    $('#download').download = `${id}-telefon-kilifi.webp`;
    $('#position').textContent = `${dialogIds.indexOf(id) + 1} / ${dialogIds.length}`;
    $('#prev').disabled = $('#next').disabled = dialogIds.length < 2;
    if (!$('#detail').open) {
      $('#detail').showModal();
      document.body.classList.add('modal-open');
    }
    if (changed) $('#detail').scrollTop = 0;
  }
  function move(direction) {
    if (!dialogIds.length) return;
    const index = dialogIds.indexOf(current);
    showDetail(dialogIds[(index + direction + dialogIds.length) % dialogIds.length], false);
  }
  function imageReady(path) {
    if (!/^assets\/cases-100\/[a-zA-Z0-9_.-]+\.(png|jpe?g|webp)$/i.test(path || '')) return Promise.resolve(false);
    if (imageChecks.has(path)) return imageChecks.get(path);
    const check = new Promise(resolve => {
      const image = new Image();
      const timer = setTimeout(() => finish(false), 12000);
      const finish = ready => {
        clearTimeout(timer);
        image.onload = image.onerror = null;
        if (!ready) imageChecks.delete(path);
        resolve(ready);
      };
      image.onload = () => finish(image.naturalWidth > 0);
      image.onerror = () => finish(false);
      image.src = path;
    });
    imageChecks.set(path, check);
    return check;
  }
  async function load() {
    try {
      const response = await fetch('cases-100.json', {cache: 'no-store'});
      if (!response.ok) throw new Error('Collection not ready');
      const data = await response.json();
      if (!Array.isArray(data.products)) throw new Error('Invalid collection');
      target = Number.isFinite(data.target) && data.target > 0 ? data.target : 100;
      const unique = new Map();
      for (const product of data.products) {
        if (typeof product.id === 'string' && typeof product.title === 'string' && product.image) {
          unique.set(product.id, {...product, theme: String(product.theme || ''), slogan: String(product.slogan || '')});
        }
      }
      const candidates = [...unique.values()];
      const checks = await Promise.all(candidates.map(product => imageReady(product.image)));
      products = variedOrder(candidates.filter((_, index) => checks[index]).sort((a,b) => (a.number || 0) - (b.number || 0) || a.id.localeCompare(b.id)));
      complete = data.complete === true && products.length >= target;
      refreshSummary();
      render(true);
    } catch {
      if (!products.length) render();
      $('#progress').textContent = products.length
        ? `${products.length} / ${target} tasarım hazır · Yeni görseller kontrol ediliyor`
        : 'Seçki hazırlanıyor · Tasarımlar hazır oldukça burada görünecek';
    } finally {
      if (!complete) setTimeout(load, 15000);
    }
  }

  $('#grid').addEventListener('click', event => {
    const favorite = event.target.closest('[data-fav]');
    const open = event.target.closest('[data-open]');
    if (favorite) toggleFavorite(favorite.dataset.fav);
    else if (open) showDetail(open.dataset.open);
  });
  $('#search').addEventListener('input', () => render());
  $('#theme').addEventListener('change', () => render());
  $('#only-text').addEventListener('click', () => { textOnly = !textOnly; render(); });
  $('#favorites').addEventListener('click', () => { favoritesOnly = !favoritesOnly; render(); $('#collection').scrollIntoView(); });
  $('#reset').addEventListener('click', () => {
    textOnly = favoritesOnly = false;
    $('#search').value = $('#theme').value = '';
    render();
  });
  $('#close').addEventListener('click', () => $('#detail').close());
  $('#detail').addEventListener('close', () => { current = null; document.body.classList.remove('modal-open'); });
  $('#detail').addEventListener('click', event => {
    if (event.target !== $('#detail')) return;
    const bounds = $('#detail').getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) $('#detail').close();
  });
  $('#detail-fav').addEventListener('click', () => { if (current) toggleFavorite(current); });
  $('#prev').addEventListener('click', () => move(-1));
  $('#next').addEventListener('click', () => move(1));
  document.addEventListener('keydown', event => {
    if (!$('#detail').open) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
  });
  persist();
  load();
})();
