(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const fold = value => String(value ?? '').toLocaleLowerCase('tr').replace(/ı/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const groups = [{id:'beer',label:'Bira bardakları'},{id:'whiskey',label:'Viski bardakları'},{id:'wine',label:'Şarap bardakları'}];
  const groupName = value => groups.find(group => group.id === value)?.label || 'Bardak koleksiyonu';
  const colorName = value => ({'Clear glass':'Şeffaf cam','Frosted glass':'Buzlu cam','White':'Beyaz','Black':'Siyah','Clear':'Şeffaf','Transparent':'Şeffaf','Natural':'Doğal ahşap','Natural wood':'Doğal ahşap','Wood':'Ahşap','Warm white':'Sıcak beyaz','Multicolor':'Çok renkli','Multicolour':'Çok renkli','Cream':'Krem','Silver':'Gümüş','Gold':'Altın'}[value] || value);
  const sizeName = value => value === 'One size' ? 'Tek ölçü' : value;
  const dimensionsName = value => {
    const labels = {height_in:'Yükseklik',rim_diameter_in:'Ağız çapı',base_diameter_in:'Taban çapı'};
    const parts = String(value || '').split(';').map(part => part.trim());
    if (!parts.some(part => /^\w+_in:/.test(part))) return value;
    return parts.map(part => {
      const [key, amount] = part.split(':').map(item => item.trim());
      return labels[key] && Number.isFinite(Number(amount)) ? `${labels[key]}: ${(Number(amount) * 2.54).toLocaleString('tr-TR',{maximumFractionDigits:1})} cm` : part;
    }).join(' · ');
  };
  const printingName = value => value === 'Digital Printing' ? 'Dijital baskı' : value;
  const storageKey = 'barware-bottom-band-review-v1';
  let products = [], target = 50, complete = false, loading = false, loaded = false;
  let group = '', favoritesOnly = false, current = null, dialogIds = [], heroId = null, saved = new Set(), limit = 24;
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(stored)) saved = new Set(stored.filter(id => typeof id === 'string'));
  } catch {}

  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify([...saved])); } catch {}
    $('#fav-count').textContent = products.filter(product => saved.has(product.id)).length;
  }
  function visible() {
    const query = fold($('#search').value.trim());
    return products.filter(product => (!group || product.group === group)
      && (!$('#model').value || product.model === $('#model').value)
      && (!$('#theme').value || product.theme === $('#theme').value)
      && (!favoritesOnly || saved.has(product.id))
      && product.search.includes(query));
  }
  function cardMarkup(product) {
    return `<button class="card-open" data-open="${esc(product.id)}" aria-label="${esc(product.title + ', ' + product.model)} ürününü büyüt"><div class="photo"><img src="${esc(product.image)}" alt="${esc(product.title + ' — ' + product.model)} ürün önizlemesi" loading="lazy" decoding="async" width="1254" height="1254"></div><div class="meta"><span>${esc(groupName(product.group).toLocaleUpperCase('tr'))}</span><span>${esc(product.theme)}</span></div><h3>${esc(product.title)}</h3><p class="card-model">${esc(product.model)}</p></button><span class="badge">${esc(product.id)}</span><button class="heart" data-fav="${esc(product.id)}" aria-pressed="${saved.has(product.id)}" aria-label="${esc(product.title)}: ${saved.has(product.id) ? 'beğenimi kaldır' : 'beğen'}">${saved.has(product.id) ? '♥' : '♡'}</button>`;
  }
  function render(preserveScroll = false) {
    const grid = $('#grid');
    const anchor = preserveScroll ? [...grid.children].find(element => element.getBoundingClientRect().bottom > 0) : null;
    const anchorTop = anchor?.getBoundingClientRect().top;
    const filtered = visible(), shown = filtered.slice(0, limit);
    const existing = new Map([...grid.children].map(element => [element.dataset.id, element]));
    const activeIds = new Set(shown.map(product => product.id));
    for (const [id, element] of existing) if (!activeIds.has(id)) element.remove();
    shown.forEach((product, index) => {
      let element = existing.get(product.id);
      if (!element) {
        element = document.createElement('article');
        element.className = 'card';
        element.dataset.id = product.id;
      }
      const signature = JSON.stringify([product, saved.has(product.id)]);
      if (element.dataset.signature !== signature) {
        element.innerHTML = cardMarkup(product);
        element.dataset.signature = signature;
      }
      if (grid.children[index] !== element) grid.insertBefore(element, grid.children[index] || null);
    });
    if (anchor?.isConnected && anchorTop < window.innerHeight && !$('#detail').open) {
      const delta = anchor.getBoundingClientRect().top - anchorTop;
      if (delta) window.scrollTo({top:window.scrollY + delta, behavior:'instant'});
    }
    $('#result-count').textContent = `${filtered.length} tasarım${filtered.length !== products.length ? ` / ${products.length} hazır ürün` : ''}`;
    $('#empty').hidden = filtered.length > 0;
    grid.setAttribute('aria-busy','false');
    $('#more').hidden = $('#show-all').hidden = shown.length >= filtered.length;
    $('#shown').textContent = shown.length ? `${shown.length} / ${filtered.length} ürün gösteriliyor.` : '';
    const hasNarrowFilter = favoritesOnly || $('#search').value.trim() || $('#model').value || $('#theme').value;
    const waiting = !complete && !hasNarrowFilter && (!products.length || (group && !products.some(product => product.group === group)));
    $('#empty-title').textContent = waiting ? `${group ? groupName(group) + ' tasarımları' : 'Bardak tasarımları'} hazırlanıyor.` : favoritesOnly ? 'Henüz bu seçimde beğendiğin ürün yok.' : 'Bu seçimde tasarım yok.';
    $('#empty-copy').textContent = waiting ? 'Hazır olan ürün görselleri burada kendiliğinden görünecek.' : favoritesOnly ? 'Bir ürünün üzerindeki kalbe dokunarak onu buraya ekleyebilirsin.' : 'Filtreleri değiştirerek diğer tasarımlara göz atabilirsin.';
    $('#reset').hidden = !group && !hasNarrowFilter;
    $('#favorites').setAttribute('aria-pressed',String(favoritesOnly));
    for (const button of document.querySelectorAll('[data-group]')) {
      const active = button.dataset.group === group;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed',String(active));
    }
    $('#selection-note').textContent = group ? groupName(group).toLocaleUpperCase('tr') : 'ALT ŞERİT KOLEKSİYONU';
    persist();
  }
  function refreshOptions(selector, field, label) {
    const select = $(selector), selected = select.value;
    const values = [...new Set(products.map(product => product[field]).filter(Boolean))].sort((a,b) => a.localeCompare(b,'tr'));
    const options = `<option value="">${label}</option>` + values.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('');
    if (select.dataset.options !== options) {
      select.innerHTML = options;
      select.dataset.options = options;
      if (values.includes(selected)) select.value = selected;
    }
    select.disabled = values.length === 0;
  }
  function refreshSummary() {
    $('#ready-total').textContent = products.length;
    $('#target-total').textContent = target;
    $('#model-total').textContent = new Set(products.map(product => product.model).filter(Boolean)).size;
    document.title = `Cam içki bardakları · Alt şerit — ${products.length}/${target}`;
    $('#progress').textContent = complete ? `${products.length} ürün önizlemesi · Seçki tamamlandı` : `${products.length} / ${target} ürün hazır · Yeni görseller ekleniyor`;
    const tabs = `<button class="group-tab${group ? '' : ' active'}" data-group="" aria-pressed="${!group}"><strong>Tüm bardaklar</strong><span>${products.length} / ${target} hazır</span></button>` + groups.map(item => {
      const count = products.filter(product => product.group === item.id).length;
      return `<button class="group-tab${group === item.id ? ' active' : ''}" data-group="${item.id}" aria-pressed="${group === item.id}"><strong>${esc(item.label)}</strong><span>${count ? count + ' tasarım' : complete ? '0 tasarım' : 'Hazırlanıyor'}</span></button>`;
    }).join('');
    const container = $('.group-tabs');
    if (container.dataset.markup !== tabs) {
      const focused = document.activeElement?.closest('[data-group]')?.dataset.group;
      container.innerHTML = tabs;
      container.dataset.markup = tabs;
      if (focused !== undefined) [...container.children].find(button => button.dataset.group === focused)?.focus({preventScroll:true});
    }
    refreshOptions('#model','model','Tüm ürün modelleri');
    refreshOptions('#theme','theme','Tüm temalar');
    if (products.length) {
      const product = products.find(item => item.id === heroId) || products[0];
      if ($('#hero-image').getAttribute('src') !== product.image) $('#hero-image').src = product.image;
      heroId = product.id;
      $('#hero-image').alt = `${product.title} — ${product.model} ürün önizlemesi`;
      $('#hero-title').textContent = `${groupName(product.group).toLocaleUpperCase('tr')} / ${product.title}`;
      $('#hero-image').hidden = $('#hero-caption').hidden = false;
      $('#hero-wait').hidden = true;
    } else {
      heroId = null;
      $('#hero-image').hidden = $('#hero-caption').hidden = true;
      $('#hero-wait').hidden = false;
    }
  }
  function toggleFavorite(id) {
    saved.has(id) ? saved.delete(id) : saved.add(id);
    render(true);
    if (current) showDetail(current,false);
  }
  function showDetail(id, resetList = true) {
    const product = products.find(item => item.id === id);
    if (!product) { if ($('#detail').open) $('#detail').close(); return; }
    const changed = current !== id;
    current = id;
    if (resetList) dialogIds = visible().map(item => item.id);
    else dialogIds = dialogIds.filter(item => products.some(product => product.id === item));
    if (!dialogIds.includes(id)) dialogIds = [id];
    $('#detail-id').textContent = `${groupName(product.group).toLocaleUpperCase('tr')} / ${product.id}`;
    $('#detail-title').textContent = product.title;
    $('#detail-theme').textContent = `${product.model}${product.theme ? ' · ' + product.theme : ''}`;
    $('#detail-image').src = product.image;
    $('#detail-image').alt = `${product.title} — ${product.model} ürününün büyük önizlemesi`;
    $('#detail-description').textContent = product.description || 'Tasarımın ürün üzerindeki yerleşimini ve renklerini incele.';
    const facts = [['Ölçü',sizeName(product.selected_size)],['Ürün ölçüleri',dimensionsName(product.physical_dimensions)],['Kapasite',product.capacity],['Baskı alanı',product.print_area],['Uygulama',printingName(product.decoration_method || product.print_method)],['Uyarlama',product.source_adaptation],['Ürün rengi',colorName(product.color)],['Katalog',product.catalog_status]].filter(([,value]) => value);
    $('#detail-facts').innerHTML = facts.map(([label,value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('');
    $('#detail-facts').hidden = facts.length === 0;
    $('#detail-product-name').textContent = product.product_name || product.model;
    $('#product-reference').hidden = !product.printify_url;
    if (product.printify_url) $('#printify-link').href = product.printify_url;
    else $('#printify-link').removeAttribute('href');
    $('#detail-fav').textContent = saved.has(id) ? 'Beğenimi kaldır ♥' : 'Bu tasarımı beğendim ♡';
    $('#detail-fav').setAttribute('aria-pressed',String(saved.has(id)));
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
    showDetail(dialogIds[(dialogIds.indexOf(current) + direction + dialogIds.length) % dialogIds.length],false);
  }
  function printifyUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && (url.hostname === 'printify.com' || url.hostname.endsWith('.printify.com')) ? url.href : '';
    } catch { return ''; }
  }
  function normalise(product) {
    if (!product || !groups.some(group => group.id === product.group) || !/^BND-(?:00[1-9]|0[1-4][0-9]|050)$/.test(product.id || '') || typeof product.title !== 'string') return null;
    if (product.image !== `assets/barware-bottom-band-50/${product.id}.webp`) return null;
    if (product.status !== 'complete' || product.tool !== 'image_gen built-in' || product.source_inspected !== true || product.output_inspected !== true) return null;
    if (!['passed','bottom_band_only','plain_upper_glass','model_construction','text_free','source_fidelity'].every(key => product.qa?.[key] === true)) return null;
    if (!/^[a-f0-9]{64}$/.test(product.output_sha256 || '') || !/^[a-f0-9]{64}$/.test(product.source_sha256 || '')) return null;
    const result = {...product, model:String(product.model || product.product_name || 'Bardak'), printify_url:printifyUrl(product.printify_url)};
    for (const key of ['theme','description','selected_size','age_label','color','product_name','print_method','decoration_method','source_adaptation','catalog_status','physical_dimensions','capacity','print_area']) result[key] = String(product[key] || '');
    result.search = fold([result.id,result.title,groupName(result.group),result.model,result.theme,result.description,result.color,result.age_label,result.selected_size].join(' '));
    return result;
  }
  async function load() {
    if (loading || (document.hidden && loaded)) return;
    loading = true;
    try {
      const response = await fetch('barware-bottom-band-50.json',{cache:'no-store'});
      if (!response.ok) throw new Error('Collection unavailable');
      const data = await response.json();
      if (!Array.isArray(data.products)) throw new Error('Invalid collection');
      target = Number.isFinite(data.target) && data.target > 0 ? data.target : 50;
      const unique = new Map();
      for (const item of data.products) {
        const product = normalise(item);
        if (product) unique.set(product.id,product);
      }
      products = [...unique.values()].sort((a,b) => (a.number || 0) - (b.number || 0) || a.id.localeCompare(b.id));
      complete = data.complete === true && products.length >= target;
      loaded = true;
      refreshSummary();
      render(true);
      if (current) showDetail(current,false);
    } catch {
      if (!products.length) render();
      $('#progress').textContent = products.length ? `${products.length} / ${target} ürün hazır · Yeni görseller kontrol ediliyor` : 'Seçki şu an yüklenemedi · Birazdan yeniden denenecek';
    } finally { loading = false; }
  }

  $('.group-tabs').addEventListener('click',event => {
    const button = event.target.closest('[data-group]');
    if (!button) return;
    group = button.dataset.group;
    limit = 24;
    render();
  });
  $('#grid').addEventListener('click',event => {
    const favorite = event.target.closest('[data-fav]'), open = event.target.closest('[data-open]');
    if (favorite) toggleFavorite(favorite.dataset.fav);
    else if (open) showDetail(open.dataset.open);
  });
  $('#search').addEventListener('input',() => { limit = 24; render(); });
  for (const selector of ['#model','#theme']) $(selector).addEventListener('change',() => { limit = 24; render(); });
  $('#more').addEventListener('click',() => {
    const previous = limit;
    limit += 24;
    render(true);
    $('#grid').children[previous]?.querySelector('button')?.focus({preventScroll:true});
  });
  $('#show-all').addEventListener('click',() => { limit = Infinity; render(true); });
  $('#favorites').addEventListener('click',() => { favoritesOnly = !favoritesOnly; limit = 24; render(); $('#collection').scrollIntoView(); });
  $('#reset').addEventListener('click',() => {
    group = '';
    favoritesOnly = false;
    $('#search').value = $('#model').value = $('#theme').value = '';
    limit = 24;
    render();
  });
  $('#close').addEventListener('click',() => $('#detail').close());
  $('#detail').addEventListener('close',() => { current = null; document.body.classList.remove('modal-open'); });
  $('#detail').addEventListener('click',event => {
    if (event.target !== $('#detail')) return;
    const bounds = event.target.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.target.close();
  });
  $('#detail-fav').addEventListener('click',() => { if (current) toggleFavorite(current); });
  $('#prev').addEventListener('click',() => move(-1));
  $('#next').addEventListener('click',() => move(1));
  document.addEventListener('keydown',event => {
    if (!$('#detail').open || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
  });
  document.addEventListener('visibilitychange',() => { if (!document.hidden) load(); });
  setInterval(() => { if (!complete) load(); },10000);
  persist();
  load();
})();
