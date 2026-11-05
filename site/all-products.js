(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fold = value => String(value ?? '').toLocaleLowerCase('tr').replace(/ı/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const number = value => new Intl.NumberFormat('tr-TR').format(value);
  const gallery = Boolean($('#all-products-grid'));
  const sloganBatch = 'slogans-2026-11-03';
  const collections = [
    {id:'outerwear-chest', title:'Kalbe yakın', subtitle:'Sol göğüste küçük motif · Dış giyim', file:'outerwear-chest-100.json', page:'outerwear-chest.html', target:100, type:p=>p.model || p.kind_label || 'Dış giyim'},
    {id:'lighting-new', title:'Işığın yeni desenleri', subtitle:'Akrilik gece lambaları · UV & lazer kazıma', file:'lighting-new-50.json', page:'lighting-new.html', target:50, type:p=>p.model || p.kind_label || 'Aydınlatma'},
    {id:'one-leg-yoga', title:'Asimetrik yoga & tayt', subtitle:'Tek bacakta desen · 5 model', file:'one-leg-yoga-100.json', page:'one-leg-yoga.html', target:100, type:p=>p.model || p.kind_label || 'Tayt'},
    {id:'barware-bottom-band', title:'Cam içki bardakları · Alt şerit', subtitle:'Bira · Viski · Şarap', file:'barware-bottom-band-50.json', page:'barware-bottom-band.html', target:50, type:p=>p.kind_label || p.model || 'Bardak'},
    {id:'barware', title:'Cam içki bardakları', subtitle:'Bira · Viski · Şarap', file:'barware-50.json', page:'barware.html', target:50, type:p=>p.kind_label || p.model || 'Bardak'},
    {id:'beauty-50', title:'Bakımın Renkleri', file:'beauty-50.json', page:'beauty.html', anchor:'beauty', target:50, type:p=>p.kind_label || p.model || 'Bakım aksesuarı'},
    {id:'planners-100', title:'Günün Çizgileri', file:'planners-100.json', page:'planners.html', anchor:'planners', target:100, type:p=>p.kind_label || p.model || 'Tasarım'},
    {id:'curtains-50', title:'Pencerede Sanat', file:'curtains-50.json', page:'curtains.html', anchor:'curtains', target:50, type:p=>p.kind_label || p.model || 'Tasarım'},
    {id:'decorative-pillows-150', title:'Sanatın Yumuşak Hali · Dekoratif Yastıklar', file:'decorative-pillows-150.json', page:'decorative-pillows.html', anchor:'decorative-pillows', target:150, type:p=>p.kind_label || p.model || 'Dekoratif yastık'},
    {id:'clocks-50-new', title:'Sanatın Zamanı · Yeni Saatler', file:'clocks-50-new.json', page:'clocks-new.html', anchor:'clocks-new', target:50, type:p=>p.kind_label || p.model || 'Duvar saati'},
    {id:'bedding-100', title:'Rüyaların Rengi · Yatak Tekstili', file:'bedding-100.json', page:'bedding.html', anchor:'bedding', target:100, type:p=>p.kind_label || p.model || 'Yatak tekstili'},
    {id:'pets-50', title:'Can Dostlara Sanat · Hayvan Ürünleri', file:'pets-50.json', page:'pets.html', anchor:'pets', target:50, type:p=>p.kind_label || p.model || 'Hayvan ürünü'},
    {id:'rugs-100', title:'Zeminde Sanat · Halı & Paspas', file:'rugs-100.json', page:'rugs.html', anchor:'rugs', target:100, type:p=>p.kind_label || p.model || 'Halı'},
    {id:'sherpa-20', title:'Yumuşak Tablolar · Sherpa', file:'sherpa-20.json', page:'sherpa.html', anchor:'sherpa', target:20, type:p=>p.kind_label || p.model || 'Sherpa battaniye'},
    {id:'automotive-50', title:'Yolda Sanat · Araç Aksesuarları', file:'automotive-50.json', page:'automotive.html', anchor:'automotive', target:50, type:p=>p.kind_label || p.model || 'Araç aksesuarı'},
    {id:'calendars-2027', title:'2027 Takvimleri', file:'calendars-2027.json', page:'new-year-2027.html', anchor:'calendars', target:100, type:p=>p.kind_label || p.model || '2027 takvimi'},
    {id:'ornaments-2027', title:'Yılbaşı Ağacı Süsleri', file:'ornaments-2027.json', page:'new-year-2027.html', anchor:'ornaments', target:200, type:p=>p.kind_label || p.model || 'Yılbaşı ağacı süsü'},
    {id:'pera', title:'Pera Social Club', file:'pera-128.json', page:'pera-social-club.html', anchor:'psc-collection', target:128, type:p=>p.type || 'Giyim'},
    {id:'cups', title:'Kupalar', file:'cups.json', page:'cups.html', target:100, type:p=>p.model || 'Kupa'},
    {id:'daily', title:'Günlük objeler', file:'photoreal.json', page:'collection.html', target:190, type:p=>p.category_name || p.model || 'Günlük obje'},
    {id:'cases', title:'Telefon kılıfları', file:'cases-100.json', page:'cases.html', target:100, type:()=> 'Telefon kılıfı'},
    {id:'wall-art', title:'Tuval & poster', file:'wall-art-200.json', page:'wall-art.html', target:200, type:p=>p.kind==='canvas'?'Kanvas tablo':'Poster'},
    {id:'canvas-paintings', title:'Yağlı boya & sulu boya tuvalleri', file:'canvas-paintings-200.json', page:'canvas-paintings.html', target:200, type:p=>p.model || 'Tuval'},
    {id:'lighting', title:'Aydınlatma koleksiyonu', file:'lighting-50.json', page:'lighting.html', target:50, type:p=>p.model || 'Aydınlatma ürünü'},
    {id:'hats', title:'Şapka koleksiyonu', file:'hats-100.json', page:'hats.html', target:100, type:p=>p.model || 'Şapka'},
    {id:'kids', title:'Çocuk koleksiyonu', file:'kids-150.json', page:'kids.html', target:150, type:p=>p.model || 'Çocuk ürünü'},
    {id:'home-textiles', title:'Battaniye & duş perdesi', file:'home-textiles-100.json', page:'home-textiles.html', target:100, type:p=>p.kind==='blanket'?'Battaniye':'Duş perdesi'},
    {id:'bags', title:'Çantalar', file:'bags-100.json', page:'bags.html', target:100, type:p=>p.kind_label || 'Çanta'},
    {id:'luggage', title:'Bavullar', file:'luggage-20.json', page:'luggage.html', target:20, type:()=> 'Bavul'},
    {id:'yoga', title:'Yoga Matları', file:'yoga-mats.json', page:'yoga.html', target:20, type:p=>p.kind_label || 'Yoga matı'},
    {id:'tech', title:'Teknoloji', file:'tech-100.json', page:'tech.html', target:100, type:p=>p.kind_label || 'Teknoloji aksesuarı'},
    {id:'textile-half', title:'Yarım desen tekstil', file:'textile-half-100.json', page:'textile-half.html', target:100, type:p=>p.kind_label || 'Tekstil'},
    {id:'notebooks', title:'Defterler', file:'notebooks-100.json', page:'notebooks.html', target:100, type:p=>p.kind_label || 'Defter'},
    {id:'puzzles', title:'Puzzle', file:'puzzles-150.json', page:'puzzles.html', target:150, type:p=>p.pieces ? p.pieces+' parçalı puzzle' : 'Puzzle'},
    {id:'candles', title:'Mumlar', file:'candles-100.json', page:'candles.html', target:100, type:p=>p.kind_label || 'Mum'},
    {id:'studio-originals', title:'Atölyenin ilk örnekleri', file:'studio-originals.json', page:'index.html', target:3, type:p=>p.type || 'Ürün'}
  ];
  const models = new Map();
  const state = {products:[], collection:'', type:'', query:'', order:'collection', edit:'', limit:24, current:null, dialogKeys:[], loaded:false, loading:false};
  let lastSignature = '';
  let pendingProduct = '';
  if (gallery) {
    const params = new URLSearchParams(location.search);
    state.collection = collections.some(c=>c.id===params.get('collection')) ? params.get('collection') : '';
    state.type = params.get('type') || '';
    state.query = params.get('q') || '';
    state.order = params.get('order')==='mixed' ? 'mixed' : 'collection';
    state.edit = params.get('edit')===sloganBatch ? sloganBatch : '';
    pendingProduct = params.get('product') || '';
    $('#all-search').value = state.query;
    if($('#all-order')) $('#all-order').value = state.order;
  }
  function safeExternal(url) {
    try { const parsed = new URL(url); return ['http:','https:'].includes(parsed.protocol) ? parsed.href : ''; } catch { return ''; }
  }
  function normalise(product, collection) {
    if (!product || !product.id || typeof product.image !== 'string' || !/^assets\//.test(product.image)) return null;
    if (collection.id === 'outerwear-chest') {
      if (!/^OWC-(?:00[1-9]|0[1-9][0-9]|100)$/.test(product.id) || product.image !== 'assets/outerwear-chest-100/'+product.id+'.webp') return null;
      if (product.status !== 'complete' || product.tool !== 'image_gen built-in' || product.source_inspected !== true || product.output_inspected !== true) return null;
      if (!['passed','source_fidelity','no_added_text','construction','full_product','left_chest_only','small_motif','plain_remaining_garment','no_human_figures'].every(key => product.qa?.[key] === true)) return null;
      if (!/^[a-f0-9]{64}$/.test(product.output_sha256 || '') || !/^[a-f0-9]{64}$/.test(product.source_sha256 || '')) return null;
      if (product.placement !== 'left_chest') return null;
    }
    if (collection.id === 'lighting-new') {
      if (!/^LUM-(?:00[1-9]|0[1-4][0-9]|050)$/.test(product.id) || product.image !== 'assets/lighting-new-50/'+product.id+'.webp') return null;
      if (product.status !== 'complete' || product.tool !== 'image_gen built-in' || product.source_inspected !== true || product.output_inspected !== true) return null;
      if (!['passed','source_fidelity','no_added_text','construction','full_product'].every(key => product.qa?.[key] === true)) return null;
      if (!/^[a-f0-9]{64}$/.test(product.output_sha256 || '') || !/^[a-f0-9]{64}$/.test(product.source_sha256 || '')) return null;
    }
    if (collection.id === 'one-leg-yoga') {
      if (!/^YLG-(?:00[1-9]|0[1-9][0-9]|100)$/.test(product.id) || product.image !== 'assets/one-leg-yoga-100/'+product.id+'.webp') return null;
      if (product.status !== 'complete' || product.tool !== 'image_gen built-in' || product.source_inspected !== true || product.output_inspected !== true) return null;
      if (!['passed','one_leg_only','plain_other_leg','no_added_text','construction','full_product'].every(key => product.qa?.[key] === true)) return null;
      if (!/^[a-f0-9]{64}$/.test(product.output_sha256 || '') || !/^[a-f0-9]{64}$/.test(product.source_sha256 || '')) return null;
      if (!['left','right'].includes(product.patterned_leg)) return null;
    }
    if (collection.id === 'barware-bottom-band') {
      if (!/^BND-(?:00[1-9]|0[1-4][0-9]|050)$/.test(product.id) || product.image !== 'assets/barware-bottom-band-50/'+product.id+'.webp') return null;
      if (product.status !== 'complete' || product.tool !== 'image_gen built-in' || product.source_inspected !== true || product.output_inspected !== true) return null;
      if (!['passed','bottom_band_only','plain_upper_glass','model_construction','text_free','source_fidelity'].every(key => product.qa?.[key] === true)) return null;
      if (!/^[a-f0-9]{64}$/.test(product.output_sha256 || '') || !/^[a-f0-9]{64}$/.test(product.source_sha256 || '')) return null;
    }
    if (collection.id === 'bedding-100' && (product.status !== 'complete' || product.qa?.passed === false)) return null;
    if (collection.id === 'decorative-pillows-150' && (product.status !== 'complete' || product.qa?.passed !== true || !/^assets\/decorative-pillows-150\/products\/DP-\d{3}\.webp$/.test(product.image))) return null;
    if (collection.id === 'clocks-50-new') {
      if (!/^CLK-\d{3}$/.test(product.id) || Number(product.id.slice(4)) < 1 || Number(product.id.slice(4)) > 50) return null;
      if (product.status !== 'complete' || product.qa?.passed !== true || product.output_inspected !== true || product.source_inspected !== true || product.source_visual_qa?.passed !== true || product.tool !== 'image_gen built-in') return null;
      if (product.image !== 'assets/clocks-50-new/products/'+product.id+'.webp' || !/^[a-f0-9]{64}$/.test(product.output_sha256 || '') || !/^[a-f0-9]{64}$/.test(product.source_sha256 || '')) return null;
    }
    const type = collection.type(product);
    return {
      ...product,
      key:collection.id+':'+product.id, collection:collection.id, collectionTitle:collection.title,
      collectionPage:collection.page+'#'+(collection.anchor || 'collection'), type, title:product.title || product.name || product.id,
      printify:safeExternal(product.printify_url || product.catalog || ''),
      search:fold([product.id, product.title, product.name, product.artist, product.style_label, product.theme, product.slogan, type, collection.title, product.description, product.product_name, product.model].filter(Boolean).join(' '))
    };
  }
  function rebuildProducts() {
    const groups = collections.map(c=>models.get(c.id)?.products || []);
    const usedImages = new Set();
    state.products = [];
    const max = Math.max(0,...groups.map(g=>g.length));
    for (let row=0; row<max; row++) {
      for (const group of groups) {
        const product = group[row];
        if (product && !usedImages.has(product.image)) {
          usedImages.add(product.image);
          state.products.push(product);
        }
      }
    }
  }
  function tileMarkup(collection) {
    const model = models.get(collection.id);
    const count = model?.products.length || 0;
    const cover = model?.products[Math.min(1,Math.max(0,count-1))];
    const label = !model ? 'Şu an yüklenemedi' : count === 0 ? 'Hazırlanıyor' : count < model.target ? number(count)+' / '+number(model.target)+' hazır' : number(count)+' ürün';
    return '<a class="overview-tile" href="'+esc(collection.page)+'#'+esc(collection.anchor || 'collection')+'"><div class="overview-photo">'+(cover?'<img src="'+esc(cover.image)+'" alt="'+esc(collection.title)+' koleksiyonundan ürün önizlemesi" loading="lazy" decoding="async" width="1254" height="1254">':'<span class="waiting-mark" aria-hidden="true">✳</span>')+'</div><h3>'+esc(collection.title)+' <span aria-hidden="true">↗</span></h3>'+(collection.subtitle?'<p>'+esc(collection.subtitle)+'</p>':'')+'<p'+(count===0?' class="tile-status"':'')+'>'+esc(label)+'</p></a>';
  }
  function updateOverview() {
    const overview = $('#catalog-overview');
    const markup = collections.map(tileMarkup).join('');
    if (overview && overview.dataset.signature !== markup) { overview.innerHTML = markup; overview.dataset.signature = markup; }
    const total = state.products.length;
    const readyCollections = collections.filter(c=>(models.get(c.id)?.products.length || 0)>0).length;
    if ($('#hub-total')) $('#hub-total').textContent = number(total);
    if ($('#hub-collections')) $('#hub-collections').textContent = readyCollections;
    if ($('#home-hub-total')) $('#home-hub-total').textContent = number(total)+' hazır ürün önizlemesi';
    const failed = collections.filter(c=>!models.has(c.id)).length;
    const progress = collections.filter(c=>models.has(c.id) && models.get(c.id).products.length < models.get(c.id).target);
    const note = failed ? failed+' koleksiyon şu an yüklenemedi; gösterilen sayı yüklenen koleksiyonlara aittir.' : progress.length ? progress.map(c=>c.title+': '+models.get(c.id).products.length+'/'+models.get(c.id).target).join(' · ')+' — hazır görseller otomatik eklenir.' : 'Bütün koleksiyonlar güncel.';
    if ($('#hub-update')) $('#hub-update').textContent = note;
  }
  function visible() {
    const query = fold(state.query.trim());
    const list = state.products.filter(p=>(!state.edit || p.edit_batch===state.edit) && (!state.collection || p.collection===state.collection) && (!state.type || p.type===state.type) && (!query || p.search.includes(query)));
    if(state.order==='collection'){
      const ranks = new Map(collections.map((c,i)=>[c.id,i]));
      list.sort((a,b)=>ranks.get(a.collection)-ranks.get(b.collection) || a.id.localeCompare(b.id,'tr',{numeric:true}));
    }
    return list;
  }
  function updateFilters() {
    const filterProducts = state.edit ? state.products.filter(p=>p.edit_batch===state.edit) : state.products;
    const sloganToggle = $('#all-slogan-filter');
    if(sloganToggle){
      sloganToggle.setAttribute('aria-pressed',String(Boolean(state.edit)));
      $('#all-slogan-count').textContent=number(state.products.filter(p=>p.edit_batch===sloganBatch).length);
    }
    const collectionSelect = $('#all-collection-filter');
    collectionSelect.innerHTML = '<option value="">Tüm koleksiyonlar ('+number(filterProducts.length)+')</option>'+collections.map(c=>{
      const m=models.get(c.id);
      const count=state.edit ? filterProducts.filter(p=>p.collection===c.id).length : (m?.products.length || (m?'hazırlanıyor':'yüklenemedi'));
      return '<option value="'+c.id+'">'+esc(c.title)+' · '+count+'</option>';
    }).join('');
    collectionSelect.value = state.collection;
    const types = [...new Set(state.products.filter(p=>!state.collection || p.collection===state.collection).map(p=>p.type))].sort((a,b)=>a.localeCompare(b,'tr',{numeric:true}));
    if (state.type && !types.includes(state.type)) state.type='';
    const typeSelect = $('#all-type-filter');
    typeSelect.innerHTML = '<option value="">Tüm ürün türleri</option>'+types.map(t=>'<option value="'+esc(t)+'">'+esc(t)+'</option>').join('');
    typeSelect.value = state.type;
  }
  function cardMarkup(p) {
    return '<button type="button" data-product-key="'+esc(p.key)+'" aria-label="'+esc(p.title+', '+p.type)+': ürünü büyüt"><div class="all-card-photo"><img src="'+esc(p.image)+'" alt="'+esc(p.title+' — '+p.type+' ürün önizlemesi')+'" loading="lazy" decoding="async" width="1254" height="1254"><span>'+esc(p.id)+'</span></div><div class="all-card-meta"><span>'+esc(p.collectionTitle)+'</span><span>'+esc(p.theme || '')+'</span></div><h3>'+esc(p.title)+'</h3><p class="product-type">'+esc(p.type)+'</p>'+(p.edit_batch===sloganBatch && p.slogan ? '<p class="product-slogan" lang="en">'+esc(p.slogan)+'</p>' : '')+'</button>';
  }
  function renderGrid(keepPosition = false) {
    const grid = $('#all-products-grid');
    const anchor = keepPosition ? [...grid.children].find(el=>el.getBoundingClientRect().bottom>0) : null;
    const anchorTop = anchor?.getBoundingClientRect().top;
    const list = visible();
    const shown = list.slice(0,state.limit);
    const old = new Map([...grid.children].map(el=>[el.dataset.key,el]));
    const shownKeys = new Set(shown.map(p=>p.key));
    for(const [key,el] of old) if(!shownKeys.has(key)) el.remove();
    shown.forEach((p,index)=>{
      let article = old.get(p.key);
      if(!article){article=document.createElement('article');article.className='all-card';article.dataset.key=p.key;}
      const signature = JSON.stringify([p.image,p.title,p.type,p.collectionTitle,p.theme,p.slogan,p.edit_batch]);
      if(article.dataset.signature!==signature){article.innerHTML=cardMarkup(p);article.dataset.signature=signature;}
      if(grid.children[index]!==article) grid.insertBefore(article,grid.children[index] || null);
    });
    grid.setAttribute('aria-busy','false');
    if(anchor?.isConnected && anchorTop<window.innerHeight && !$('#all-detail').open){
      const delta=anchor.getBoundingClientRect().top-anchorTop;
      if(delta) window.scrollTo({top:window.scrollY+delta,behavior:'instant'});
    }
    $('#all-result-count').textContent=number(list.length)+' ürün'+(state.edit?' · Yeni sloganlılar':'')+(state.collection?' · '+collections.find(c=>c.id===state.collection).title:'')+(list.length!==state.products.length?' / '+number(state.products.length)+' hazır ürün':'');
    $('#all-shown').textContent=shown.length?number(shown.length)+' / '+number(list.length)+' ürün gösteriliyor.':'';
    $('#all-more').hidden=shown.length>=list.length;
    if($('#all-show-everything')) $('#all-show-everything').hidden=shown.length>=list.length;
    $('#all-empty').hidden=list.length>0;
    const selected=models.get(state.collection);
    const pending=state.collection && selected && !selected.products.length;
    $('#all-empty-title').textContent=pending ? collections.find(c=>c.id===state.collection).title+' hazırlanıyor.' : 'Bu seçimde ürün bulunamadı.';
    $('#all-empty-copy').textContent=pending ? 'Tamamlanan ürün görselleri burada kendiliğinden görünecek.' : 'Aramayı veya filtreleri değiştirebilirsin.';
    $('#all-reset').hidden=!state.collection && !state.type && !state.query && !state.edit;
  }
  function saveUrl() {
    const url=new URL(location.href);
    for(const [key,value] of Object.entries({collection:state.collection,type:state.type,q:state.query,order:state.order==='mixed'?'mixed':'',edit:state.edit,product:state.current || ''})){
      if(value) url.searchParams.set(key,value); else url.searchParams.delete(key);
    }
    history.replaceState(null,'',url.pathname+url.search+url.hash);
  }
  function changeFilters() {
    state.limit=24;updateFilters();renderGrid();saveUrl();
  }
  function openProduct(key, preserveKeys=false) {
    const product=state.products.find(p=>p.key===key);
    if(!product) return;
    state.current=key;
    if(!preserveKeys){
      state.dialogKeys=visible().map(p=>p.key);
      if(!state.dialogKeys.includes(key))state.dialogKeys=state.products.map(p=>p.key);
    }
    const index=state.dialogKeys.indexOf(key);
    $('#all-detail-image').src=product.image;
    $('#all-detail-image').alt=product.title+' — '+product.type+' ürün önizlemesi';
    $('#all-detail-title').textContent=product.title;
    $('#all-detail-collection').textContent=product.collectionTitle.toLocaleUpperCase('tr');
    $('#all-detail-type').textContent=product.type+(product.theme?' · '+product.theme:'');
    $('#all-detail-id').textContent=product.id;
    $('#all-detail-description').textContent=product.description || (product.slogan?'Ürün üzerindeki yazı: '+product.slogan:'');
    $('#all-detail-source').href=product.collectionPage;
    $('#all-detail-printify').hidden=!product.printify;
    if(product.printify)$('#all-detail-printify').href=product.printify;else $('#all-detail-printify').removeAttribute('href');
    $('#all-detail-download').href=product.image;
    $('#all-detail-download').download=product.image.split('/').pop();
    const mediaHost=$('#all-detail-media');
    if(mediaHost){
      const media=[{image:product.image,label:'Tasarımın tamamı'},...(Array.isArray(product.media)?product.media:[])];
      const seen=new Set();
      const views=media.filter(m=>typeof m.image==='string' && /^assets\//.test(m.image) && !seen.has(m.image) && seen.add(m.image));
      mediaHost.replaceChildren();
      mediaHost.hidden=views.length<2;
      for(const [i,view] of views.entries()){
        const button=document.createElement('button');
        button.type='button';
        button.textContent=view.label || 'Görünüm '+(i+1);
        button.setAttribute('aria-pressed',String(i===0));
        button.addEventListener('click',()=>{
          $('#all-detail-image').src=view.image;
          $('#all-detail-image').alt=product.title+' — '+button.textContent;
          $('#all-detail-download').href=view.image;
          $('#all-detail-download').download=view.image.split('/').pop();
          for(const item of mediaHost.children) item.setAttribute('aria-pressed',String(item===button));
        });
        mediaHost.append(button);
      }
    }
    $('#all-position').textContent=(index+1)+' / '+state.dialogKeys.length;
    $('#all-prev').disabled=index<=0;
    $('#all-next').disabled=index>=state.dialogKeys.length-1;
    if(!$('#all-detail').open)$('#all-detail').showModal();
    saveUrl();
  }
  async function refresh() {
    if(state.loading || document.hidden && state.loaded) return;
    state.loading=true;
    try{
      const results=await Promise.allSettled(collections.map(async c=>{
        const response=await fetch(c.file,{cache:'no-store'});
        if(!response.ok)throw new Error(c.file+' '+response.status);
        const data=await response.json();
        const raw=Array.isArray(data)?data:data.products;
        if(!Array.isArray(raw))throw new Error('Missing product list');
        const seenClockIds=new Set(), seenClockSources=new Set(), seenClockOutputs=new Set();
        const products=raw.map(p=>normalise(p,c)).filter(Boolean).filter(p=>{
          if(c.id!=='clocks-50-new')return true;
          if(seenClockIds.has(p.id)||seenClockSources.has(p.source_sha256)||seenClockOutputs.has(p.output_sha256))return false;
          seenClockIds.add(p.id);seenClockSources.add(p.source_sha256);seenClockOutputs.add(p.output_sha256);return true;
        });
        const target=Number(data.target)||c.target;
        models.set(c.id,{products,target});
      }));
      results.forEach((result,index)=>{if(result.status==='rejected') console.warn('Collection unavailable:',collections[index].id,result.reason);});
      rebuildProducts();
      const signature=JSON.stringify(collections.map(c=>[c.id,models.get(c.id)?.products.map(p=>[p.id,p.image,p.title,p.type,p.slogan,p.edit_batch]),models.get(c.id)?.target]));
      if(signature!==lastSignature){
        lastSignature=signature;updateOverview();
        if(gallery){updateFilters();renderGrid(state.loaded);}
      }
      if(gallery && !state.loaded && pendingProduct){openProduct(pendingProduct);pendingProduct='';}
      state.loaded=true;
    }finally{state.loading=false;}
  }
  if(gallery){
    $('#all-search').addEventListener('input',event=>{state.query=event.target.value;changeFilters();});
    $('#all-collection-filter').addEventListener('change',event=>{state.collection=event.target.value;state.type='';changeFilters();});
    $('#all-type-filter').addEventListener('change',event=>{state.type=event.target.value;changeFilters();});
    if($('#all-order')) $('#all-order').addEventListener('change',event=>{state.order=event.target.value;changeFilters();});
    if($('#all-slogan-filter')) $('#all-slogan-filter').addEventListener('click',()=>{state.edit=state.edit?'':sloganBatch;changeFilters();});
    $('#all-reset').addEventListener('click',()=>{state.collection='';state.type='';state.query='';state.edit='';$('#all-search').value='';changeFilters();});
    $('#all-more').addEventListener('click',()=>{
      const previous=state.limit;
      state.limit+=24;renderGrid(true);
      const next=$('#all-products-grid').children[previous]?.querySelector('button');
      next?.focus({preventScroll:true});
    });
    if($('#all-show-everything')) $('#all-show-everything').addEventListener('click',()=>{
      state.limit=visible().length;renderGrid(true);
    });
    $('#all-products-grid').addEventListener('click',event=>{const button=event.target.closest('[data-product-key]');if(button)openProduct(button.dataset.productKey);});
    $('#all-close').addEventListener('click',()=>$('#all-detail').close());
    $('#all-detail').addEventListener('close',()=>{state.current=null;saveUrl();});
    $('#all-detail').addEventListener('click',event=>{
      if(event.target!==$('#all-detail'))return;
      const rect=event.target.getBoundingClientRect();
      if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)event.target.close();
    });
    for(const [selector,delta] of [['#all-prev',-1],['#all-next',1]]){
      $(selector).addEventListener('click',()=>{const key=state.dialogKeys[state.dialogKeys.indexOf(state.current)+delta];if(key)openProduct(key,true);});
    }
    document.addEventListener('keydown',event=>{
      if(!$('#all-detail').open || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName))return;
      if(event.key==='ArrowLeft')$('#all-prev').click();
      if(event.key==='ArrowRight')$('#all-next').click();
    });
  }
  refresh();
  setInterval(refresh,15000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
})();
