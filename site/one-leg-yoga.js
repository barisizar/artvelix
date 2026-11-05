(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const fold = value => String(value ?? '').toLocaleLowerCase('tr').replace(/ı/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const groups = [{id:'yoga',label:'Yoga pantolonları & taytları'},{id:'leggings',label:'Günlük, capri & büyük beden taytlar'}];
  const groupName = value => groups.find(group => group.id === value)?.label || 'Asimetrik seçki';
  const colorName = value => ({Black:'Siyah',White:'Beyaz',Cream:'Krem',Ivory:'Fildişi',Sage:'Adaçayı',Lavender:'Lavanta',Navy:'Lacivert',Charcoal:'Antrasit',Blush:'Pudra',Sand:'Kum',Taupe:'Vizon',Olive:'Zeytin',Teal:'Petrol',Burgundy:'Bordo',Brown:'Kahverengi',Stone:'Taş',Mint:'Nane',Terracotta:'Kiremit',Slate:'Arduvaz'}[value] || value);
  const legName = value => value === 'left' ? 'Sol bacak desenli' : value === 'right' ? 'Sağ bacak desenli' : '';
  const sizeName = value => value === 'One size' ? 'Tek ölçü' : value;
  const printingName = value => value === 'Digital Printing' ? 'Dijital baskı' : value;
  const storageKey = 'one-leg-yoga-review-v1';
  let products = [], target = 100, complete = false, loading = false, loaded = false;
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
      && (!$('#color').value || product.base_color === $('#color').value)
      && (!$('#leg').value || product.patterned_leg === $('#leg').value)
      && (!favoritesOnly || saved.has(product.id))
      && product.search.includes(query));
  }
  function cardMarkup(product) {
    return `<button class="card-open" data-open="${esc(product.id)}" aria-label="${esc(product.title + ', ' + product.model)} ürününü büyüt"><div class="photo"><img src="${esc(product.image)}" alt="${esc(product.title + ' — ' + product.model)} ürün önizlemesi" loading="lazy" decoding="async" width="1254" height="1254"></div><div class="meta"><span>${esc(groupName(product.group).toLocaleUpperCase('tr'))}</span><span>${esc(product.theme)}</span></div><h3>${esc(product.title)}</h3><p class="card-model">${esc(product.model)}</p><p class="card-colors"><span>${esc(colorName(product.base_color))}</span><span>${esc(legName(product.patterned_leg))}</span></p></button><span class="badge">${esc(product.id)}</span><button class="heart" data-fav="${esc(product.id)}" aria-pressed="${saved.has(product.id)}" aria-label="${esc(product.title)}: ${saved.has(product.id) ? 'beğenimi kaldır' : 'beğen'}">${saved.has(product.id) ? '♥' : '♡'}</button>`;
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
    const hasNarrowFilter = favoritesOnly || $('#search').value.trim() || $('#model').value || $('#theme').value || $('#color').value || $('#leg').value;
    const waiting = !complete && !hasNarrowFilter && (!products.length || (group && !products.some(product => product.group === group)));
    $('#empty-title').textContent = waiting ? `${group ? groupName(group) + ' tasarımları' : 'Asimetrik tasarımlar'} hazırlanıyor.` : favoritesOnly ? 'Henüz bu seçimde beğendiğin ürün yok.' : 'Bu seçimde tasarım yok.';
    $('#empty-copy').textContent = waiting ? 'Hazır olan ürün görselleri burada kendiliğinden görünecek.' : favoritesOnly ? 'Bir ürünün üzerindeki kalbe dokunarak onu buraya ekleyebilirsin.' : 'Filtreleri değiştirerek diğer tasarımlara göz atabilirsin.';
    $('#reset').hidden = !group && !hasNarrowFilter;
    $('#favorites').setAttribute('aria-pressed',String(favoritesOnly));
    for (const button of document.querySelectorAll('[data-group]')) {
      const active = button.dataset.group === group;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed',String(active));
    }
    $('#selection-note').textContent = group ? groupName(group).toLocaleUpperCase('tr') : 'ASİMETRİK YOGA & TAYT';
    persist();
  }
  function refreshOptions(selector, field, label, format = value => value) {
    const select = $(selector), selected = select.value;
    const values = [...new Set(products.map(product => product[field]).filter(Boolean))].sort((a,b) => a.localeCompare(b,'tr'));
    const options = `<option value="">${label}</option>` + values.map(value => `<option value="${esc(value)}">${esc(format(value))}</option>`).join('');
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
    document.title = `Asimetrik yoga & tayt — ${products.length}/${target}`;
    $('#progress').textContent = complete ? `${products.length} ürün önizlemesi · Seçki tamamlandı` : `${products.length} / ${target} ürün hazır · Yeni görseller ekleniyor`;
    const tabs = `<button class="group-tab${group ? '' : ' active'}" data-group="" aria-pressed="${!group}"><strong>Tüm tasarımlar</strong><span>${products.length} / ${target} hazır</span></button>` + groups.map(item => {
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
    refreshOptions('#color','base_color','Tüm zemin renkleri',colorName);
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
    const facts = [['Model',product.model],['Zemin rengi',colorName(product.base_color)],['Desen yerleşimi',legName(product.patterned_leg)],['Bedenler',sizeName(product.selected_size || product.size)],['Malzeme',product.material],['Baskı alanı',product.print_area],['Uygulama',printingName(product.decoration_method || product.print_method)],['Katalog',product.catalog_status]].filter(([,value]) => value);
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
    if (!product || !/^YLG-(?:00[1-9]|0[1-9][0-9]|100)$/.test(product.id || '') || typeof product.title !== 'string' || typeof product.group !== 'string') return null;
    if (product.image !== `assets/one-leg-yoga-100/${product.id}.webp`) return null;
    if (product.status !== 'complete' || product.tool !== 'image_gen built-in' || product.source_inspected !== true || product.output_inspected !== true) return null;
    if (!['passed','one_leg_only','plain_other_leg','no_added_text','construction','full_product'].every(key => product.qa?.[key] === true)) return null;
    if (!/^[a-f0-9]{64}$/.test(product.output_sha256 || '') || !/^[a-f0-9]{64}$/.test(product.source_sha256 || '')) return null;
    if (!['left','right'].includes(product.patterned_leg)) return null;
    const result = {...product, model:String(product.model || product.product_name || 'Tayt'), printify_url:printifyUrl(product.printify_url)};
    for (const key of ['theme','description','selected_size','size','age_label','color','product_name','print_method','decoration_method','source_adaptation','catalog_status','material','print_area']) result[key] = String(product[key] || '');
    result.base_color = String(product.base_color || product.selected_color || product.color || '');
    result.group_label = String(product.group_label || product.kind_label || result.model);
    result.search = fold([result.id,result.title,result.group_label,result.model,result.theme,result.description,result.base_color,colorName(result.base_color),legName(result.patterned_leg)].join(' '));
    return result;
  }
  async function load() {
    if (loading || (document.hidden && loaded)) return;
    loading = true;
    try {
      const response = await fetch('one-leg-yoga-100.json',{cache:'no-store'});
      if (!response.ok) throw new Error('Collection unavailable');
      const data = await response.json();
      if (!Array.isArray(data.products)) throw new Error('Invalid collection');
      target = Number.isFinite(data.target) && data.target > 0 ? data.target : 100;
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
  for (const selector of ['#model','#theme','#color','#leg']) $(selector).addEventListener('change',() => { limit = 24; render(); });
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
    $('#search').value = $('#model').value = $('#theme').value = $('#color').value = $('#leg').value = '';
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
