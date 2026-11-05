(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const fold = value => String(value ?? '').toLocaleLowerCase('tr').replace(/ı/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const number = value => new Intl.NumberFormat('tr-TR').format(value);
  const storageKey = 'atelier-pets-favorites-v1';
  const collections = [{id:'pets', file:'pets-50.json', title:'Can Dostlara Sanat', target:50, noun:'tasarım', pending:'Ürün önizlemeleri hazırlanıyor.'}];
  const states = new Map(collections.map(collection => [collection.id, {...collection, products:[], query:'', model:'', artist:'', favoritesOnly:false, limit:24, loaded:false, loading:false, failed:false, signature:''}]));
  let favorites = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if(Array.isArray(saved)) favorites = new Set(saved.filter(value => typeof value === 'string'));
  } catch { /* Browsing remains available when local storage is disabled. */ }
  const dialog = $('#product-dialog');
  const modal = {group:null, key:null, keys:[], opener:null};

  function safeExternal(value) {
    try { const url = new URL(value); return ['http:','https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
  }
  function normalise(product, state) {
    if(!product || !product.id || typeof product.image !== 'string' || !product.image.startsWith('assets/')) return null;
    const title = String(product.title || product.name || product.id);
    const artist = typeof product.artist === 'string' ? product.artist.trim() : '';
    const sourceArt = typeof product.source_art === 'string' ? product.source_art.trim() : (product.source_art && typeof product.source_art.title === 'string' ? product.source_art.title.trim() : '');
    const model = String(product.model || product.kind_label || product.kind || (state.id === 'calendars' ? '2027 takvimi' : 'Yılbaşı ağacı süsü'));
    const type = String(product.kind_label || model);
    return {
      artwork:typeof product.source_image === 'string' && product.source_image.startsWith('assets/') ? product.source_image : '',
      id:String(product.id), key:state.id+':'+product.id, title, image:product.image, artist, sourceArt,
      model, modelId:String(product.model_id || product.model || product.kind || product.kind_label || model), type,
      theme:typeof product.theme === 'string' ? product.theme : '',
      description:typeof product.description === 'string' ? product.description : '',
      attribution:typeof product.attribution === 'string' ? product.attribution : '',
      printify:safeExternal(product.printify_url), source:safeExternal(product.source_url),
      proof:typeof product.pdf_url === 'string' && /^assets\/new-year-2027\/calendar-proofs\/CAL-2027-\d{3}\.pdf$/.test(product.pdf_url) ? product.pdf_url : '',
      proofNote:typeof product.proof_note === 'string' ? product.proof_note : '',
      search:fold([product.id,title,artist,sourceArt,model,type,product.theme,product.description].filter(Boolean).join(' '))
    };
  }
  function visible(state) {
    const query = fold(state.query.trim());
    return state.products.filter(product => (!query || product.search.includes(query)) && (!state.model || product.modelId === state.model) && (!state.artist || product.artist === state.artist) && (!state.favoritesOnly || favorites.has(product.key)));
  }
  function productForKey(key) {
    for(const state of states.values()) {
      const product = state.products.find(item => item.key === key);
      if(product) return {product,state};
    }
    return null;
  }
  function updateOptions(state) {
    const models = new Map(state.products.map(product => [product.modelId,product.model]));
    if(state.model && !models.has(state.model)) models.set(state.model,state.model);
    const modelOptions = [...models].sort((a,b) => a[1].localeCompare(b[1],'tr'));
    const modelSelect = $('#'+state.id+'-model');
    modelSelect.innerHTML = '<option value="">Bütün modeller</option>'+modelOptions.map(([value,label]) => '<option value="'+esc(value)+'">'+esc(label)+'</option>').join('');
    modelSelect.value = state.model;
    const artists = new Set(state.products.map(product => product.artist).filter(Boolean));
    if(state.artist) artists.add(state.artist);
    const artistSelect = $('#'+state.id+'-artist');
    artistSelect.innerHTML = '<option value="">Bütün tarzlar</option>'+[...artists].sort((a,b) => a.localeCompare(b,'tr')).map(artist => '<option value="'+esc(artist)+'">'+esc(artist)+'</option>').join('');
    artistSelect.value = state.artist;
  }
  function cardMarkup(product) {
    const favorite = favorites.has(product.key);
    return '<button class="product-open" type="button" data-open="'+esc(product.key)+'" aria-label="'+esc(product.title+' — '+product.type)+': ürünü büyüt"><div class="product-photo"><img src="'+esc(product.image)+'" alt="'+esc(product.title+' — '+product.type+' ürün önizlemesi')+'" width="1024" height="1024" loading="lazy" decoding="async"><span class="product-code">'+esc(product.id)+'</span></div><div class="product-meta"><span>'+esc(product.artist ? product.artist+' esintisi' : 'Atölye seçkisi')+'</span><span>'+esc(product.theme)+'</span></div><h3>'+esc(product.title)+'</h3><p class="product-type">'+esc(product.type)+'</p></button><button class="card-favorite" type="button" data-favorite="'+esc(product.key)+'" aria-pressed="'+favorite+'" aria-label="'+esc(product.title)+(favorite?': seçkimden çıkar':': seçkime ekle')+'">'+(favorite?'♥':'♡')+'</button>';
  }
  function render(state, keepPosition = false) {
    const prefix = '#'+state.id;
    const grid = $(prefix+'-grid');
    const anchor = keepPosition && !dialog.open ? [...grid.children].find(element => element.getBoundingClientRect().bottom > 0 && element.getBoundingClientRect().top < window.innerHeight) : null;
    const anchorTop = anchor?.getBoundingClientRect().top;
    const list = visible(state);
    const shown = list.slice(0,state.limit);
    const old = new Map([...grid.children].map(element => [element.dataset.key,element]));
    const shownKeys = new Set(shown.map(product => product.key));
    for(const [key,element] of old) if(!shownKeys.has(key)) element.remove();
    shown.forEach((product,index) => {
      let article = old.get(product.key);
      if(!article) { article=document.createElement('article'); article.className='product-card'; article.dataset.key=product.key; }
      const signature = JSON.stringify([product.title,product.image,product.artist,product.theme,product.type,favorites.has(product.key)]);
      if(article.dataset.signature !== signature) { article.innerHTML=cardMarkup(product); article.dataset.signature=signature; }
      if(grid.children[index] !== article) grid.insertBefore(article,grid.children[index] || null);
    });
    grid.setAttribute('aria-busy','false');
    if(anchor?.isConnected && anchorTop !== undefined) {
      const delta = anchor.getBoundingClientRect().top-anchorTop;
      if(delta) window.scrollTo({top:window.scrollY+delta,behavior:'instant'});
    }
    const result = state.loaded ? number(list.length)+' '+state.noun+(list.length !== state.products.length ? ' / '+number(state.products.length)+' hazır ürün' : '') : (state.failed ? 'Koleksiyon henüz yüklenemedi.' : 'Koleksiyon yükleniyor…');
    $(prefix+'-result').textContent = result;
    $(prefix+'-ready').textContent = state.loaded ? number(state.products.length) : '—';
    $(prefix+'-shown').textContent = shown.length ? number(shown.length)+' / '+number(list.length)+' ürün gösteriliyor.' : '';
    $(prefix+'-more').hidden = shown.length >= list.length;
    $(prefix+'-all').hidden = shown.length >= list.length;
    $(prefix+'-reset').hidden = !state.query && !state.model && !state.artist && !state.favoritesOnly;
    $(prefix+'-favorite-count').textContent = number(state.products.filter(product => favorites.has(product.key)).length);
    $(prefix+'-favorites').setAttribute('aria-pressed',String(state.favoritesOnly));
    $(prefix+'-empty').hidden = list.length > 0 || !state.loaded;
    const pending = !state.products.length;
    $(prefix+'-empty-title').textContent = pending ? state.pending : state.favoritesOnly ? 'Bu seçimde favorin bulunmuyor.' : 'Bu filtrelerde tasarım bulunamadı.';
    $(prefix+'-empty-copy').textContent = pending ? 'Tamamlanan ürün görselleri burada kendiliğinden görünür. Sayfa, seçkiyi düzenli olarak kontrol eder.' : state.favoritesOnly ? 'Sevdiğin ürünlerin kalbine dokunarak kendi seçkini oluşturabilir veya filtreleri temizleyebilirsin.' : 'Farklı bir model veya tarz seçebilir, aramanı değiştirebilirsin.';
    const error = $(prefix+'-error');
    const errorText = state.failed ? (state.loaded ? 'Koleksiyon şu anda güncellenemiyor. Son yüklenen tasarımlar gösteriliyor; bağlantı yeniden kontrol edilecek.' : 'Koleksiyon şu anda yüklenemiyor. Birazdan otomatik olarak yeniden denenecek.') : '';
    if(error.textContent !== errorText) error.textContent = errorText;
    error.hidden = !state.failed;
  }
  function updateOverall() {
    $('#model-total').textContent = number(new Set([...states.values()].flatMap(state=>state.products.map(product=>product.modelId))).size);
    const groups = [...states.values()];
    const loaded = groups.filter(state => state.loaded);
    $('#overall-ready').textContent = loaded.length ? number(loaded.reduce((sum,state) => sum+state.products.length,0)) : '—';
    const failed = groups.filter(state => state.failed);
    const status = failed.length ? 'Bazı koleksiyonlar güncellenemiyor; gösterilen sayı son yüklenen ürünlere ait.' : loaded.length < groups.length ? 'Koleksiyonlar yükleniyor.' : groups.every(state => state.products.length >= state.target) ? '50 tasarımın ürün önizlemesi tamamlandı.' : 'Yeni tasarımlar hazır oldukça seçkiye eklenir.';
    if($('#overall-status').textContent !== status) $('#overall-status').textContent = status;
  }
  function applyFilters(state) { state.limit=24;render(state); }
  function setFavorite(key) {
    const focusedKey = document.activeElement?.dataset.favorite;
    if(favorites.has(key)) favorites.delete(key); else favorites.add(key);
    try { localStorage.setItem(storageKey,JSON.stringify([...favorites])); } catch { /* Keep the current selection for this page visit. */ }
    for(const state of states.values()) render(state,true);
    if(modal.key) updateFavoriteButton();
    if(focusedKey) {
      const replacement = [...document.querySelectorAll('[data-favorite]')].find(button => button.dataset.favorite === focusedKey);
      (replacement || $('#'+key.split(':')[0]+'-favorites')).focus({preventScroll:true});
    }
  }
  function updateFavoriteButton() {
    const favorite = favorites.has(modal.key);
    $('#detail-favorite').textContent = favorite ? 'Seçkimden çıkar ♥' : 'Seçkime ekle ♡';
    $('#detail-favorite').setAttribute('aria-pressed',String(favorite));
  }
  function updateModal() {
    const found = productForKey(modal.key);
    if(!found) { if(dialog.open) dialog.close(); return; }
    const {product,state} = found;
    const currentImage = $('#detail-image');
    if(currentImage.getAttribute('src') !== product.image) {
      $('#detail-image-error').hidden = true;
      currentImage.hidden = false;
      currentImage.src = product.image;
    }
    currentImage.alt = product.title+' — '+product.type+' ürün önizlemesi';
    $('#detail-collection').textContent = state.title.toLocaleUpperCase('tr');
    $('#detail-title').textContent = product.title;
    $('#detail-id').textContent = product.id;
    $('#detail-model').textContent = product.model+(product.theme ? ' · '+product.theme : '');
    $('#detail-description').textContent = product.description;
    $('#detail-description').hidden = !product.description;
    $('#detail-attribution').textContent = product.attribution || (product.artist ? product.artist+' tarzından esinlenen çalışma.' : 'Atölye için seçilmiş veya yeni oluşturulmuş tasarımın ürüne uygulanmış önizlemesi.');
    $('#detail-source-art').textContent = product.sourceArt ? 'MidJourney kaynak notu: '+product.sourceArt : '';
    $('#detail-source-art').hidden = !product.sourceArt;
    $('#detail-download').href = product.image;
    $('#detail-download').download = product.image.split('/').pop().split('?')[0];
    const proofLink = $('#detail-proof');
    proofLink.hidden = !product.proof;
    if(product.proof) { proofLink.href=product.proof;proofLink.download=product.proof.split('/').pop(); } else proofLink.removeAttribute('href');
    $('#detail-proof-note').textContent = product.proofNote;
    $('#detail-proof-note').hidden = !product.proof || !product.proofNote;
    for(const [id,url] of [['detail-printify',product.printify],['detail-source',product.source]]) {
      const link = $('#'+id);
      link.hidden = !url;
      if(url) link.href=url;else link.removeAttribute('href');
    }
    $('#detail-artwork-toggle').hidden = !product.artwork;
    $('#detail-artwork-toggle').textContent = 'Kaynak tasarımı göster ↔';
    $('#detail-artwork-download').hidden = !product.artwork;
    $('#detail-artwork-download').href = product.artwork || '#';
    $('#detail-artwork-download').download = product.artwork.split('/').pop();
    currentImage.dataset.artwork = 'false';
    updateFavoriteButton();
    const position = modal.keys.indexOf(modal.key);
    $('#detail-position').textContent = (position+1)+' / '+modal.keys.length;
    $('#detail-prev').disabled = position <= 0;
    $('#detail-next').disabled = position >= modal.keys.length-1;
  }
  function openProduct(key, opener) {
    const found = productForKey(key);
    if(!found) return;
    modal.key=key;modal.group=found.state.id;modal.keys=visible(found.state).map(product => product.key);modal.opener=opener || document.activeElement;

    updateModal();
    if(!dialog.open) dialog.showModal();
  }
  function moveProduct(delta) {
    const key = modal.keys[modal.keys.indexOf(modal.key)+delta];
    if(!key) return;
    modal.key=key;updateModal();dialog.scrollTop=0;
  }
  async function refreshCollection(state) {
    if(state.loading) return;
    state.loading=true;
    const wasFailed=state.failed;
    const controller=new AbortController();
    const timeout=setTimeout(() => controller.abort(),12000);
    try {
      const response = await fetch(state.file,{cache:'no-store',signal:controller.signal});
      if(!response.ok) throw new Error('Collection '+response.status);
      const data = await response.json();
      const raw = Array.isArray(data) ? data : data.products;
      if(!Array.isArray(raw)) throw new Error('Invalid product list');
      const ids = new Set();
      const products = raw.map(product => normalise(product,state)).filter(product => product && !ids.has(product.key) && ids.add(product.key)).sort((a,b) => a.id.localeCompare(b.id,'tr',{numeric:true}));
      const signature = JSON.stringify(products);
      const changed = signature !== state.signature;
      state.loaded=true;state.failed=false;
      if(changed) { state.products=products;state.signature=signature;updateOptions(state); }
      if(changed || wasFailed) render(state,true);
      if(changed && dialog.open && modal.group===state.id) {
        modal.keys=modal.keys.filter(key => products.some(product => product.key===key));
        updateModal();
      }
    } catch(error) {
      state.failed=true;
      if(!wasFailed) render(state,true);
      console.warn('Yeni yıl koleksiyonu yüklenemedi:',state.id,error);
    } finally { clearTimeout(timeout);state.loading=false;updateOverall(); }
  }
  function refreshAll() {
    if(document.hidden && [...states.values()].every(state => state.loaded)) return;
    for(const state of states.values()) void refreshCollection(state);
  }
  for(const state of states.values()) {
    const prefix='#'+state.id;
    $(prefix+'-search').addEventListener('input',event => {state.query=event.target.value;applyFilters(state);});
    $(prefix+'-model').addEventListener('change',event => {state.model=event.target.value;applyFilters(state);});
    $(prefix+'-artist').addEventListener('change',event => {state.artist=event.target.value;applyFilters(state);});
    $(prefix+'-favorites').addEventListener('click',() => {state.favoritesOnly=!state.favoritesOnly;applyFilters(state);});
    $(prefix+'-reset').addEventListener('click',() => {state.query='';state.model='';state.artist='';state.favoritesOnly=false;$(prefix+'-search').value='';updateOptions(state);applyFilters(state);});
    $(prefix+'-more').addEventListener('click',() => {
      const previous=state.limit;state.limit+=24;render(state,true);
      $(prefix+'-grid').children[previous]?.querySelector('.product-open')?.focus({preventScroll:true});
    });
    $(prefix+'-all').addEventListener('click',() => {state.limit=Infinity;render(state,true);});
    $(prefix+'-grid').addEventListener('click',event => {
      const favorite=event.target.closest('[data-favorite]');
      if(favorite) {setFavorite(favorite.dataset.favorite);return;}
      const button=event.target.closest('[data-open]');
      if(button) openProduct(button.dataset.open,button);
    });
  }
  $('#dialog-close').addEventListener('click',() => dialog.close());
  dialog.addEventListener('close',() => {
    const replacement=[...document.querySelectorAll('[data-open]')].find(button => button.dataset.open===modal.key);
    const opener=modal.opener?.isConnected ? modal.opener : replacement || (modal.group ? $('#'+modal.group+'-search') : null);
    modal.key=null;modal.group=null;modal.keys=[];modal.opener=null;
    opener?.focus({preventScroll:true});
  });
  dialog.addEventListener('click',event => {
    if(event.target !== dialog) return;
    const rect=dialog.getBoundingClientRect();
    if(event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom) dialog.close();
  });
  $('#detail-favorite').addEventListener('click',() => {if(modal.key) setFavorite(modal.key);});
  $('#detail-prev').addEventListener('click',() => moveProduct(-1));
  $('#detail-next').addEventListener('click',() => moveProduct(1));
  $('#detail-image').addEventListener('error',() => {$('#detail-image').hidden=true;$('#detail-image-error').hidden=false;});
  $('#detail-image').addEventListener('load',() => {$('#detail-image').hidden=false;$('#detail-image-error').hidden=true;});
  document.addEventListener('keydown',event => {
    if(!dialog.open || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
    if(event.key==='ArrowLeft') {event.preventDefault();moveProduct(-1);}
    if(event.key==='ArrowRight') {event.preventDefault();moveProduct(1);}
  });
  window.addEventListener('storage',event => {
    if(event.key !== storageKey) return;
    try {const values=JSON.parse(event.newValue || '[]');if(Array.isArray(values)) favorites=new Set(values.filter(value => typeof value==='string'));} catch {return;}
    for(const state of states.values()) render(state,true);
    if(modal.key) updateFavoriteButton();
  });
  document.addEventListener('visibilitychange',() => {if(!document.hidden) refreshAll();});
  $('#detail-artwork-toggle').addEventListener('click',() => {
    const found=productForKey(modal.key); if(!found || !found.product.artwork) return;
    const img=$('#detail-image'); const show=img.dataset.artwork!=='true';
    img.src=show?found.product.artwork:found.product.image;
    img.alt=found.product.title+(show?' — MidJourney kaynak tasarımı':' — ürün önizlemesi');
    img.dataset.artwork=String(show);
    $('#detail-artwork-toggle').textContent=show?'Ürün önizlemesini göster ↔':'Kaynak tasarımı göster ↔';
  });
  refreshAll();
  setInterval(refreshAll,15000);
})();
