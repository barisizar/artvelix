'use strict';

const shops = {all:'Tümü',art:'Duvar sanatı',table:'Sofra',tech:'Teknoloji',home:'Ev & yaşam',digital:'Dijital'};
const languages = {tr:'Türkçe',en:'English',de:'Deutsch',fr:'Français',es:'Español',hi:'हिन्दी'};
const slogans = [
  {topic:'MUTLULUK',tr:'Küçük şeyler.\nBüyük mutluluk.',en:'Little things.\nA lot of joy.',de:'Kleine Dinge.\nGroßes Glück.',fr:'Petites choses.\nGrand bonheur.',es:'Pequeñas cosas.\nGran felicidad.',hi:'छोटी-छोटी बातें।\nढेर सारी खुशियाँ।'},
  {topic:'DÜRÜSTLÜK',tr:'Kendin ol.\nGerisi gürültü.',en:'Be yourself.\nThe rest is noise.',de:'Sei du selbst.\nDer Rest ist Lärm.',fr:'Sois toi-même.\nLe reste est du bruit.',es:'Sé tú mismo.\nLo demás es ruido.',hi:'खुद बनो।\nबाकी सब शोर है।'},
  {topic:'AŞK',tr:'Birlikte,\nher yer ev.',en:'Together,\nanywhere is home.',de:'Zusammen ist\nüberall Zuhause.',fr:'Ensemble,\npartout chez nous.',es:'Juntos,\ncualquier lugar es hogar.',hi:'साथ हों,\nतो हर जगह घर है।'},
  {topic:'MİZAH',tr:'Önce kahve.\nSonra dünya.',en:'Coffee first.\nThen the world.',de:'Erst Kaffee.\nDann die Welt.',fr:"D’abord le café.\nEnsuite, le monde.",es:'Primero el café.\nLuego, el mundo.',hi:'पहले कॉफ़ी।\nफिर दुनिया।'}
];
const products = window.STUDIO_PRODUCTS.filter(product => product.mockup);

const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money = value => new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(value);
let currentShop = 'all';
let currentType = 'all';
let visibleLimit = 20;
let currentLanguage = 'tr';
let currentQuote = 0;
let cart = [];
const cartKey = 'artvelix-selection-v1';
try {
  const stored = JSON.parse(localStorage.getItem(cartKey) || '[]');
  if(Array.isArray(stored)) cart = stored.filter(row => {
    const product = products.find(item => item.id === row.id);
    return product && Number.isInteger(row.option) && row.option >= 0 && row.option < product.options.length && Object.hasOwn(languages,row.language) && Number.isInteger(row.quantity) && row.quantity > 0 && row.quantity <= 99;
  }).slice(0,100);
} catch { cart = []; }

function matchingProducts(shop = currentShop, query = $('#search').value) {
  const term = query.toLocaleLowerCase('tr').trim();
  return products.filter(product => (shop === 'all' || product.shop === shop) && (currentType === 'all' || product.format === currentType) && `${product.name} ${product.type} ${product.description} ${shops[product.shop]}`.toLocaleLowerCase('tr').includes(term));
}
function renderTypeOptions() {
  const available = products.filter(product => currentShop === 'all' || product.shop === currentShop);
  const types = [...new Map(available.map(product => [product.format,product.type])).entries()];
  $('#product-type').innerHTML = '<option value="all">Tüm ürün türleri</option>'+types.map(([key,name])=>`<option value="${key}" ${key===currentType?'selected':''}>${name}</option>`).join('');
}
function renderCatalog() {
  $('#filters').innerHTML = Object.entries(shops).filter(([key]) => key === 'all' || products.some(product => product.shop === key)).map(([key,name])=>`<button class="filter ${currentShop===key?'active':''}" data-filter="${key}" aria-pressed="${currentShop===key}">${name} <span>${key==='all'?products.length:products.filter(p=>p.shop===key).length}</span></button>`).join('');
  const filtered = matchingProducts(), visible = filtered.slice(0,visibleLimit);
  $('#result-count').textContent = `${filtered.length} ürün · ${shops[currentShop]}${visible.length<filtered.length?' · İlk '+visible.length+' ürün gösteriliyor':''}`;
  $('#product-grid').innerHTML = visible.length ? visible.map(product => `<article class="product-card"><button class="product-image-button ${product.mockup?'mockup':''}" data-product="${product.id}" aria-label="${escapeHTML(product.name)} ürününü incele"><img src="assets/${product.image}.jpg" alt="${escapeHTML(product.name)} ${product.mockup?'ürün':'tasarım'} önizlemesi" loading="lazy" width="600" height="700"><span class="product-label">${product.shop==='digital'?'DİJİTAL DOSYA':shops[product.shop].toLocaleUpperCase('tr')}</span><span class="product-open" aria-hidden="true">+</span></button><div class="product-meta"><h3><button data-product="${product.id}" style="padding:0;text-align:left">${escapeHTML(product.name)}</button></h3></div><p>${product.type}</p><span class="product-stage">${product.mockup?'Ürün görselleştirmesi':product.stage}</span></article>`).join('') : '<div class="empty-state"><h3>Bu seçkide henüz bir eşleşme yok.</h3><p>Başka bir kelime dene veya tüm tasarımlara dön.</p><button class="button dark" data-reset>Tüm tasarımlar</button></div>';
  $('#load-more').hidden = visible.length >= filtered.length;
  $('#load-more').textContent = `Daha fazla ürün göster (${Math.min(20,filtered.length-visible.length)})`;
}
function chooseShop(shop) {
  if(!Object.hasOwn(shops,shop)) throw new Error('Geçersiz mağaza');
  currentShop = shop; currentType = 'all'; visibleLimit = 20;
  $('#search').value = '';
  renderTypeOptions(); renderCatalog();
}
function renderQuote() {
  $('#language-switch').innerHTML = Object.keys(languages).map(key=>`<button data-language="${key}" aria-label="${languages[key]} slogan" aria-pressed="${currentLanguage===key}" class="${currentLanguage===key?'active':''}">${key.toUpperCase()}</button>`).join('');
  $('#quote-topic').textContent = `${slogans[currentQuote].topic} / ${languages[currentLanguage].toLocaleUpperCase('tr')}`;
  $('#quote-text').textContent = slogans[currentQuote][currentLanguage];
  $('#quote-text').style.whiteSpace = 'pre-line';
  $('#quote-text').lang = currentLanguage;
  $('.quote-bottom>span').textContent = `Artvelix sözleri · ${String(currentQuote+1).padStart(2,'0')}`;
}
function unitPrice(row) {const product = products.find(item=>item.id===row.id);return product.price+product.options[row.option][1];}
function saveCart() {
  try {localStorage.setItem(cartKey,JSON.stringify(cart));} catch { /* The cart remains usable for this session. */ }
  $('#cart-count').textContent = String(cart.reduce((sum,row)=>sum+row.quantity,0));
  renderCart();
}
let toastTimer;
function toast(message) {
  $('#toast').textContent=message;
  $('#toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2800);
}
function openProduct(id) {
  const product = products.find(item=>item.id===id);
  if(!product) throw new Error('Tasarım bulunamadı');
  const isDigital=product.shop==='digital';
  $('#product-detail').innerHTML = `<div class="product-detail-grid"><div class="detail-visual"><div class="detail-image ${product.mockup?'mockup':''}"><img id="detail-art" src="assets/${product.image}.jpg" alt="${escapeHTML(product.name)} tasarım önizlemesi"></div><p class="visual-caption">${product.mockup?'AI ile hazırlanmış ürün görselleştirmesi; fiziksel numune değildir.':isDigital?'Arşiv görseli; teslim edilecek baskı paketi henüz hazırlanmadı.':'Ürüne uygulanacak kaynak tasarım. Fiziksel ürün fotoğrafı değildir.'}</p></div><div class="detail-copy"><p class="eyebrow">${shops[product.shop].toLocaleUpperCase('tr')} / TASARIM ÖNİZLEMESİ</p><h2 id="product-name">${escapeHTML(product.name)}</h2><p class="description">${product.description}</p><p class="price" id="detail-price" hidden>${money(product.price)}</p><p class="quiet-note">Dijital ürün önizlemesi · Henüz satışa açık değil</p><label class="detail-select">${product.optionLabel}<select id="detail-option">${product.options.map(([label,extra],index)=>`<option value="${index}">${escapeHTML(label)}</option>`).join('')}</select></label><label class="detail-select">Slogan dili · yerleşim taslağı<select id="detail-language">${Object.entries(languages).map(([key,name])=>`<option value="${key}" ${key===currentLanguage?'selected':''}>${name}</option>`).join('')}</select></label><p class="slogan-preview" id="detail-slogan" lang="${currentLanguage}">${escapeHTML(slogans[product.topic][currentLanguage]).replace('\n',' ')}</p><p class="quiet-note">Dil seçimi bu metni değiştirir; görseldeki baskı sabittir.</p><button class="button dark" id="add-to-cart">Seçkime ekle</button><p class="detail-disclaimer">${isDigital?'Bu sürümde dosya teslimi ve ödeme yoktur. Lisans seçenekleri taslaktır.':'Ölçü, malzeme ve cihaz seçenekleri örnektir. Üretici uyumu ve baskı kalitesi numuneyle doğrulanacak.'}</p><ul class="detail-specs">${isDigital?'<li>Teslim paketi: yüksek çözünürlüklü dosya + rehber (planlanan).</li><li>Kaynak dosyanın yeniden satışı lisansa dahil edilmeyecek.</li>':'<li>Artvelix tasarım koleksiyonundan.</li><li>Son malzeme, baskı ve teslim süresi satıştan önce belirlenecek.</li>'}</ul></div></div>`;
  $('#detail-option').addEventListener('change',event=>{$('#detail-price').textContent=money(product.price+product.options[Number(event.target.value)][1]);});
  $('#detail-language').addEventListener('change',event=>{$('#detail-slogan').textContent=slogans[product.topic][event.target.value].replace('\n',' ');$('#detail-slogan').lang=event.target.value;});
  $('#add-to-cart').addEventListener('click',()=>{
    const option=Number($('#detail-option').value), language=$('#detail-language').value;
    const existing=cart.find(row=>row.id===id && row.option===option && row.language===language);
    if(existing){if(existing.quantity===99){toast('Bir seçimden en fazla 99 adet eklenebilir.');return;}existing.quantity++;}
    else cart.push({id,option,language,quantity:1});
    saveCart();$('#product-dialog').close();toast(`${product.name} seçkine eklendi.`);
  });
  $('#product-dialog').showModal();
}
function renderCart() {
  if(!cart.length){$('#cart-content').innerHTML='<div class="empty-state" style="margin-top:25px"><h3>Biraz sanat için yer var.</h3><p>Sevdiğin tasarımları burada bir araya getir.</p><button class="button dark" id="cart-browse">Koleksiyonu keşfet</button></div>';$('#cart-browse').addEventListener('click',()=>{$('#cart-dialog').close();location.hash='collection';});return;}
  $('#cart-content').innerHTML=cart.map((row,index)=>{
    const product=products.find(item=>item.id===row.id);
    return `<div class="cart-row"><img src="assets/${product.image}.jpg" alt="${escapeHTML(product.name)}"><div><h3>${product.name}</h3><p>${escapeHTML(product.options[row.option][0])} · ${languages[row.language]}</p><div class="cart-line-actions"><div class="quantity"><button data-quantity="${index}" data-delta="-1" aria-label="${escapeHTML(product.name)} miktarını azalt">−</button><span aria-label="Adet">${row.quantity}</span><button data-quantity="${index}" data-delta="1" aria-label="${escapeHTML(product.name)} miktarını artır" ${row.quantity>=99?'disabled':''}>+</button></div><button class="remove" data-remove="${index}" aria-label="${escapeHTML(product.name)} ürününü seçkimden çıkar">Kaldır</button></div></div></div>`;
  }).join('')+`<p class="cart-info">Seçimlerin yalnızca bu tarayıcıda saklanır. Sevdiğin tasarımları burada bir araya getirebilirsin.</p><div class="cart-notice"><strong>Sana ait bir seçki.</strong><p>Bu sayfa bir ürün galerisi. Seçkine eklemek sipariş oluşturmaz; ödeme alınmaz.</p></div>`;
}



document.addEventListener('click',event=>{
  const button=event.target.closest('[data-filter],[data-shop],[data-product],[data-language],[data-reset],[data-close],[data-quantity],[data-remove]');
  if(!button)return;
  if(button.hasAttribute('data-filter'))chooseShop(button.dataset.filter);
  if(button.hasAttribute('data-shop'))chooseShop(button.dataset.shop);
  if(button.hasAttribute('data-product'))openProduct(button.dataset.product);
  if(button.hasAttribute('data-language')){currentLanguage=button.dataset.language;renderQuote();}
  if(button.hasAttribute('data-reset'))chooseShop('all');
  if(button.hasAttribute('data-close'))button.closest('dialog').close();
  if(button.hasAttribute('data-quantity')){
    const index=Number(button.dataset.quantity),row=cart[index],delta=Number(button.dataset.delta);
    if(row){row.quantity=Math.min(99,row.quantity+delta);if(row.quantity<=0)cart.splice(index,1);saveCart();}
  }
  if(button.hasAttribute('data-remove')){cart.splice(Number(button.dataset.remove),1);saveCart();}
});
$('#search').addEventListener('input',()=>{visibleLimit=20;renderCatalog();});
$('#product-type').addEventListener('change',event=>{currentType=event.target.value;visibleLimit=20;renderCatalog();});
$('#load-more').addEventListener('click',()=>{const firstNew=visibleLimit;visibleLimit+=20;renderCatalog();$('#product-grid').children[firstNew]?.querySelector('button')?.focus({preventScroll:true});});
$('#next-quote').addEventListener('click',()=>{currentQuote=(currentQuote+1)%slogans.length;renderQuote();});
$('#cart-open').addEventListener('click',()=>{renderCart();$('#cart-dialog').showModal();});
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}}));
renderTypeOptions();renderCatalog();renderQuote();saveCart();

// Optional browser tools mirror the catalog UI; neither can place an order.
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  const tools=[
    {name:'browse_design_catalog',title:'Tasarım kataloğunu filtrele',description:'Filter this local prototype catalog by store and text, and return matching preview products. Does not purchase anything.',inputSchema:{type:'object',properties:{shop:{type:'string',enum:Object.keys(shops)},query:{type:'string',maxLength:100}},required:['shop'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||!Object.hasOwn(shops,input.shop)||Object.keys(input).some(key=>!['shop','query'].includes(key))||(input.query!==undefined&&(typeof input.query!=='string'||input.query.length>100)))throw new Error('Geçersiz katalog filtresi');chooseShop(input.shop);$('#search').value=input.query||'';renderCatalog();$('#collection').scrollIntoView({behavior:'instant'});return{products:matchingProducts().map(({id,name,price,type})=>({id,name,type,examplePriceTRY:price})),prototype:true};}},
    {name:'read_demo_cart',title:'Seçkimi oku',description:'Read local prototype selections and example totals. Does not create an order.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(input){if(!input||Object.keys(input).length)throw new Error('Bu araç parametre almaz');return{items:cart.map(row=>({...row,name:products.find(item=>item.id===row.id).name,exampleUnitPriceTRY:unitPrice(row)})),exampleTotalTRY:cart.reduce((sum,row)=>sum+unitPrice(row)*row.quantity,0),prototype:true};}}
  ];
  for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
