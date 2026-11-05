(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const storageKey = 'candles-100-review-v1';
  const fold = value => String(value ?? '').toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let products = [], categories = [], target = 100, complete = false, kind = '', favoritesOnly = false;
  let current = null, dialogIds = [], heroId = null, saved = new Set();
  const kindName = value => categories.find(category => category.kind === value)?.label || products.find(product => product.kind === value)?.kind_label || 'Mum';
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(stored)) saved = new Set(stored.filter(id => typeof id === 'string'));
  } catch {}

  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify([...saved])); } catch {}
    $('#fav-count').textContent = saved.size;
  }
  function visible() {
    const query = fold($('#search').value.trim());
    const theme = $('#theme').value;
    return products.filter(product => (!kind || product.kind === kind)
      && (!theme || product.theme === theme)
      && (!favoritesOnly || saved.has(product.id))
      && fold(`${product.id} ${kindName(product.kind)} ${product.title} ${product.theme} ${product.product_name} ${product.description || ''}`).includes(query));
  }
  function cardMarkup(product) {
    const label = kindName(product.kind);
    return `<button class="card-open" data-open="${esc(product.id)}" aria-label="${esc(product.title)} ${esc(label.toLocaleLowerCase('tr'))} ürününü büyüt"><div class="photo"><img src="${esc(product.image)}" alt="${esc(product.title)} — ${esc(label.toLocaleLowerCase('tr'))} ürün önizlemesi" loading="lazy" decoding="async" width="1254" height="1254"></div><div class="meta"><span>${esc(label.toLocaleUpperCase('tr'))}</span><span>${esc(product.theme)}</span></div><h3>${esc(product.title)}</h3></button><span class="badge">${esc(product.id)}</span><button class="heart" data-fav="${esc(product.id)}" aria-pressed="${saved.has(product.id)}" aria-label="${esc(product.title)}: ${saved.has(product.id) ? 'beğenimi kaldır' : 'beğen'}">${saved.has(product.id) ? '♥' : '♡'}</button>`;
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
    $('#result-count').textContent = `${filtered.length} tasarım${filtered.length !== products.length ? ` / ${products.length} hazır ürün` : ''}`;
    $('#empty').hidden = filtered.length > 0;
    const waiting = !complete && (!products.length || (kind && !products.some(product => product.kind === kind)));
    $('#empty-title').textContent = waiting ? `${kind ? kindName(kind) + ' tasarımları' : 'Mum tasarımları'} hazırlanıyor.` : 'Bu seçimde tasarım yok.';
    $('#empty-copy').textContent = waiting ? 'Hazır olan ürün görselleri burada kendiliğinden görünecek.' : 'Filtreleri değiştirerek diğer tasarımlara göz atabilirsin.';
    $('#reset').hidden = !kind && !favoritesOnly && !$('#search').value && !$('#theme').value;
    $('#favorites').setAttribute('aria-pressed', String(favoritesOnly));
    for (const button of document.querySelectorAll('[data-kind]')) {
      const active = button.dataset.kind === kind;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
    $('#selection-note').textContent = kind ? kindName(kind).toLocaleUpperCase('tr') : 'MUM SEÇKİSİ';
    persist();
  }
  function refreshSummary() {
    const readyKinds = new Set(products.map(product => product.kind));
    $('#ready-total').textContent = products.length;
    $('#target-total').textContent = target;
    $('#kind-total').textContent = readyKinds.size;
    $('#progress').textContent = complete
      ? `${products.length} mum tasarımı · Seçki tamamlandı`
      : `${products.length} / ${target} ürün hazır · Yeni görseller ekleniyor`;
    const tabs = `<button class="kind-tab${kind ? '' : ' active'}" data-kind="" aria-pressed="${!kind}"><strong>Tüm mumlar</strong><span>${products.length} / ${target} hazır</span></button>` + categories.map(category => {
      const count = products.filter(product => product.kind === category.kind).length;
      const countLabel = category.target ? `${count} / ${category.target} hazır` : `${count} tasarım`;
      return `<button class="kind-tab${kind === category.kind ? ' active' : ''}" data-kind="${esc(category.kind)}" aria-pressed="${kind === category.kind}"><strong>${esc(category.label)}</strong><span>${countLabel}</span></button>`;
    }).join('');
    const tabContainer = $('.kind-tabs');
    if (tabContainer.dataset.markup !== tabs) {
      const focusedKind = document.activeElement?.closest('[data-kind]')?.dataset.kind;
      tabContainer.innerHTML = tabs;
      tabContainer.dataset.markup = tabs;
      if (focusedKind !== undefined) [...tabContainer.children].find(button => button.dataset.kind === focusedKind)?.focus({preventScroll:true});
    }
    refreshOptions('#theme', 'theme', 'Tüm temalar');
    if (!heroId && products.length) {
      const product = products[0];
      heroId = product.id;
      $('#hero-image').src = product.image;
      $('#hero-image').alt = `${product.title} — ${kindName(product.kind).toLocaleLowerCase('tr')} ürün önizlemesi`;
      $('#hero-title').textContent = `${kindName(product.kind).toLocaleUpperCase('tr')} / ${product.title}`;
      $('#hero-image').hidden = $('#hero-caption').hidden = false;
      $('#hero-wait').hidden = true;
    }
  }
  function refreshOptions(selector, field, label) {
    const select = $(selector);
    const selected = select.value;
    const values = [...new Set(products.map(product => product[field]).filter(Boolean))].sort((a,b) => a.localeCompare(b,'tr'));
    const options = `<option value="">${label}</option>` + values.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('');
    if (select.innerHTML !== options) {
      select.innerHTML = options;
      if (values.includes(selected)) select.value = selected;
    }
    select.hidden = values.length < 2;
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
    $('#detail-id').textContent = `${kindName(product.kind).toLocaleUpperCase('tr')} / ${product.id}`;
    $('#detail-title').textContent = product.title;
    $('#detail-theme').textContent = `${kindName(product.kind)}${product.theme ? ' · ' + product.theme : ''}`;
    $('#detail-image').src = product.image;
    $('#detail-image').alt = `${product.title} ${kindName(product.kind).toLocaleLowerCase('tr')} ürününün büyük önizlemesi`;
    $('#detail-description').textContent = product.description || 'Tasarımın mum etiketindeki yerleşimini, renklerini ve malzemeyle buluşmasını incele.';
    $('#detail-product-name').textContent = product.product_name || kindName(product.kind);
    $('#product-reference').hidden = !product.printify_url;
    if (product.printify_url) $('#printify-link').href = product.printify_url;
    else $('#printify-link').removeAttribute('href');
    $('#detail-fav').textContent = saved.has(id) ? 'Beğenimi kaldır ♥' : 'Bu tasarımı beğendim ♡';
    $('#detail-fav').setAttribute('aria-pressed', String(saved.has(id)));
    $('#download').href = product.image;
    $('#download').download = `${id}-urun-onizlemesi.${product.image.split('.').pop()}`;
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
  function printifyUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && (url.hostname === 'printify.com' || url.hostname.endsWith('.printify.com')) ? url.href : '';
    } catch { return ''; }
  }
  async function load() {
    try {
      const response = await fetch('candles-100.json', {cache: 'no-store'});
      if (!response.ok) throw new Error('Collection not ready');
      const data = await response.json();
      if (!Array.isArray(data.products)) throw new Error('Invalid collection');
      target = Number.isFinite(data.target) && data.target > 0 ? data.target : 100;
      const unique = new Map();
      for (const product of data.products) {
        const validKind = typeof product.kind === 'string' && /^[a-zA-Z0-9_-]+$/.test(product.kind);
        const validImage = /^assets\/candles-100\/[a-zA-Z0-9_.-]+\.(png|jpg|jpeg|webp)$/.test(product.image || '');
        if (validKind && validImage && typeof product.id === 'string' && typeof product.title === 'string') {
          unique.set(product.id, {...product, kind_label: String(product.kind_label || 'Mum'), theme: String(product.theme || ''), product_name: String(product.product_name || ''), printify_url: printifyUrl(product.printify_url)});
        }
      }
      products = [...unique.values()].sort((a,b) => (a.number || 0) - (b.number || 0) || a.id.localeCompare(b.id));
      const kindMap = new Map();
      for (const category of Array.isArray(data.categories) ? data.categories : []) {
        if (typeof category.kind === 'string' && typeof category.label === 'string') {
          kindMap.set(category.kind, {kind:category.kind, label:category.label, target:Number.isFinite(category.target) && category.target > 0 ? category.target : null});
        }
      }
      for (const product of products) if (!kindMap.has(product.kind)) kindMap.set(product.kind, {kind:product.kind, label:product.kind_label, target:null});
      categories = [...kindMap.values()];
      if (kind && !kindMap.has(kind)) kind = '';
      complete = data.complete === true && products.length >= target;
      refreshSummary();
      render(true);
      if (current) showDetail(current, false);
    } catch {
      if (!products.length) render();
      $('#progress').textContent = products.length
        ? `${products.length} / ${target} ürün hazır · Yeni görseller kontrol ediliyor`
        : 'Seçki hazırlanıyor · Hazır ürünler burada görünecek';
    } finally {
      if (!complete) setTimeout(load, 15000);
    }
  }

  $('.kind-tabs').addEventListener('click', event => {
    const button = event.target.closest('[data-kind]');
    if (!button) return;
    kind = button.dataset.kind;
    render();
  });
  $('#grid').addEventListener('click', event => {
    const favorite = event.target.closest('[data-fav]');
    const open = event.target.closest('[data-open]');
    if (favorite) toggleFavorite(favorite.dataset.fav);
    else if (open) showDetail(open.dataset.open);
  });
  $('#search').addEventListener('input', () => render());
  $('#theme').addEventListener('change', () => render());
  $('#favorites').addEventListener('click', () => { favoritesOnly = !favoritesOnly; render(); $('#collection').scrollIntoView(); });
  $('#reset').addEventListener('click', () => {
    kind = '';
    favoritesOnly = false;
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
