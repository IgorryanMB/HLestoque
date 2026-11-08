(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const STORE = 'hl_gestao_v2', HISTORY_STORE = 'hl_gestao_history_v2', EXPENSE_STORE = 'hl_gestao_expenses_v3';
  const LEGACY_STORE = 'hl_gestao_v1', LEGACY_HISTORY = 'hl_gestao_history_v1';
  const formatter = new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'});
  const numberFormatter = new Intl.NumberFormat('pt-BR');
  const money = value => formatter.format(Number(value) || 0);
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const html = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const now = () => new Date().toISOString();
  const localYMD = input => {if(typeof input==='string' && /^\d{4}-\d{2}-\d{2}$/.test(input))return input;const d=new Date(input);return Number.isFinite(d.getTime())?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`:'';};
  const amount = value => Math.round((Number(value)||0)*100)/100;
  // Todos os dados, marcas e preços abaixo são EXEMPLOS; não representam o catálogo real do fornecedor.
  const demo = [
    {id:1001,sku:'HL-1001',name:'Máquina de corte profissional Pro X',brand:'Master Cut · Exemplo',category:'Máquinas',qty:8,min:3,cost:289.90,price:429.90},
    {id:1002,sku:'HL-1002',name:'Máquina de acabamento Precision T9',brand:'Prime Barber · Exemplo',category:'Máquinas',qty:5,min:3,cost:192,price:315},
    {id:1003,sku:'HL-1003',name:'Shaver duplo Titanium',brand:'Master Cut · Exemplo',category:'Máquinas',qty:7,min:4,cost:168.50,price:279.90},
    {id:1004,sku:'HL-1004',name:'Máquina de corte sem fio Fade',brand:'Prime Barber · Exemplo',category:'Máquinas',qty:2,min:4,cost:320,price:489},
    {id:1005,sku:'HL-1005',name:'Secador profissional 2200 W',brand:'Studio Pro · Exemplo',category:'Máquinas',qty:4,min:2,cost:114,price:189.90},
    {id:1006,sku:'HL-1006',name:'Pomada modeladora matte 150 g',brand:'Barber Lab · Exemplo',category:'Cosméticos',qty:26,min:10,cost:11.90,price:24.90},
    {id:1007,sku:'HL-1007',name:'Pomada efeito brilho 150 g',brand:'Barber Lab · Exemplo',category:'Cosméticos',qty:12,min:8,cost:12.50,price:25.90},
    {id:1008,sku:'HL-1008',name:'Pó modelador volumizador 20 g',brand:'Barber Lab · Exemplo',category:'Cosméticos',qty:6,min:8,cost:16.80,price:35},
    {id:1009,sku:'HL-1009',name:'Shampoo para barba 250 ml',brand:'Gentleman · Exemplo',category:'Cosméticos',qty:15,min:6,cost:14.90,price:32},
    {id:1010,sku:'HL-1010',name:'Óleo para barba 30 ml',brand:'Gentleman · Exemplo',category:'Cosméticos',qty:0,min:6,cost:13.20,price:29.90},
    {id:1011,sku:'HL-1011',name:'Gel de barbear transparente 500 g',brand:'Barber Lab · Exemplo',category:'Cosméticos',qty:18,min:8,cost:19.80,price:39.90},
    {id:1012,sku:'HL-1012',name:'Loção pós-barba 500 ml',brand:'Gentleman · Exemplo',category:'Cosméticos',qty:5,min:7,cost:17.40,price:36.90},
    {id:1013,sku:'HL-1013',name:'Tesoura profissional 6 polegadas',brand:'Studio Pro · Exemplo',category:'Acessórios',qty:9,min:3,cost:44,price:89.90},
    {id:1014,sku:'HL-1014',name:'Navalhete de aço profissional',brand:'Studio Pro · Exemplo',category:'Acessórios',qty:18,min:5,cost:15.90,price:34.90},
    {id:1015,sku:'HL-1015',name:'Escova para fade',brand:'Prime Barber · Exemplo',category:'Acessórios',qty:22,min:8,cost:8.50,price:18.90},
    {id:1016,sku:'HL-1016',name:'Kit de pentes profissionais',brand:'Studio Pro · Exemplo',category:'Acessórios',qty:10,min:5,cost:12,price:26.90},
    {id:1017,sku:'HL-1017',name:'Gola higiênica descartável (rolo)',brand:'HigiBarber · Exemplo',category:'Descartáveis',qty:3,min:12,cost:7.80,price:16.90},
    {id:1018,sku:'HL-1018',name:'Pacote de lâminas descartáveis 100 un.',brand:'HigiBarber · Exemplo',category:'Descartáveis',qty:19,min:10,cost:25.90,price:45},
    {id:1019,sku:'HL-1019',name:'Kit iniciante corte + acabamento',brand:'Master Cut · Exemplo',category:'Kits',qty:4,min:2,cost:447,price:699},
    {id:1020,sku:'HL-1020',name:'Kit barba completo 4 produtos',brand:'Gentleman · Exemplo',category:'Kits',qty:6,min:3,cost:56,price:109.90}
  ];
  const buildSampleHistory = () => [
    {date:new Date(Date.now()-25*60*1000).toISOString(),id:1006,sku:'HL-1006',name:'Pomada modeladora matte 150 g',type:'sale',qty:4,before:30,after:26,costUnit:11.90,saleUnit:24.90,revenue:99.60,cogs:47.60,note:'Venda demonstrativa',saleId:'S-DEMO-1'},
    {date:new Date(Date.now()-3*60*60*1000).toISOString(),id:1001,name:'Máquina de corte profissional Pro X',type:'in',qty:3,before:5,after:8,note:'Reposição demonstrativa'},
    {date:new Date(Date.now()-28*60*60*1000).toISOString(),id:1018,name:'Pacote de lâminas descartáveis 100 un.',type:'in',qty:10,before:9,after:19,note:'Entrada demonstrativa'},
    {date:new Date(Date.now()-46*60*60*1000).toISOString(),id:1010,name:'Óleo para barba 30 ml',type:'out',qty:2,before:2,after:0,note:'Saída demonstrativa'},
    {date:new Date(Date.now()-72*60*60*1000).toISOString(),id:1008,name:'Pó modelador volumizador 20 g',type:'set',qty:6,before:7,after:6,note:'Contagem física demonstrativa'}
  ];
  const demoExpenses = () => [{id:'E-DEMO-1',date:localYMD(new Date()),description:'Embalagens dos pedidos',category:'Embalagens',amount:18.90},{id:'E-DEMO-2',date:localYMD(new Date()),description:'Entrega local',category:'Transporte e frete',amount:15.00}];
  const parse = key => {try{return JSON.parse(localStorage.getItem(key))}catch{return null}};
  function hydrate() {
    const current = parse(STORE), old = parse(LEGACY_STORE);
    if(Array.isArray(current)) return {products:current,history:Array.isArray(parse(HISTORY_STORE))?parse(HISTORY_STORE):[]};
    if(Array.isArray(old) && old.length) {
      const originalDemo = old.length===4 && ['HL-001','HL-002','HL-003','HL-004'].every((code,i)=>old[i]?.sku===code) && Number(old[0]?.cost)===240 && Number(old[1]?.cost)===12;
      if(!originalDemo) return {products:old, history:Array.isArray(parse(LEGACY_HISTORY))?parse(LEGACY_HISTORY):[]};
    }
    return {products:demo.map(p=>({...p})),history:buildSampleHistory()};
  }
  const original = hydrate();
  let products = original.products.map(p=>({...p}));
  let history = original.history.map(h=>({...h}));
  let expenses = Array.isArray(parse(EXPENSE_STORE))?parse(EXPENSE_STORE).map(e=>({...e})):(!parse(STORE)&&!parse(LEGACY_STORE)?demoExpenses():[]);
  let selectMoveMode='in';
  let editing = null, moving = null;
  const pModal = new bootstrap.Modal($('productModal'));
  const mModal = new bootstrap.Modal($('moveModal'));
  const chooseModal = new bootstrap.Modal($('selectMoveModal'));
  const eModal = new bootstrap.Modal($('expenseModal'));
  const toastUI = new bootstrap.Toast($('appToast'),{delay:2800});
  function toast(message){$('toastText').textContent=message;toastUI.show()}
  function persist(){try{localStorage.setItem(STORE,JSON.stringify(products));localStorage.setItem(HISTORY_STORE,JSON.stringify(history));localStorage.setItem(EXPENSE_STORE,JSON.stringify(expenses));return true}catch{alert('O navegador não conseguiu salvar os dados. Libere o armazenamento ou exporte um backup.');return false}}
  function status(p){return Number(p.qty)<=0?'out':Number(p.qty)<=Number(p.min)?'low':'ok'}
  function margin(p){return Number(p.price)>0?(Number(p.price)-Number(p.cost))/Number(p.price)*100:0}
  function fmtPercent(p){return Number.isFinite(p)?p.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%':'0%'}
  function iconFor(p){return ({'Máquinas':'bi-scissors','Cosméticos':'bi-droplet','Acessórios':'bi-brush','Descartáveis':'bi-bandaid','Kits':'bi-box-seam','Outros':'bi-box-seam'})[p.category]||'bi-box-seam'}
  function statusLabel(s){return ({ok:'Disponível',low:'Estoque baixo',out:'Esgotado'})[s]}
  function badge(p){const s=status(p);return `<span class="stock-badge ${s}">${statusLabel(s)}</span>`}
  function productIcon(p){return `<span class="product-symbol"><i class="bi ${iconFor(p)}"></i></span>`}
  function actions(p){return `<div class="action-buttons"><button type="button" class="icon-button" data-action="move" data-id="${p.id}" aria-label="Movimentar ${html(p.name)}" title="Movimentar estoque"><i class="bi bi-arrow-left-right"></i></button><button type="button" class="icon-button" data-action="edit" data-id="${p.id}" aria-label="Editar ${html(p.name)}" title="Editar produto"><i class="bi bi-pencil"></i></button><button type="button" class="icon-button danger" data-action="delete" data-id="${p.id}" aria-label="Excluir ${html(p.name)}" title="Excluir produto"><i class="bi bi-trash"></i></button></div>`}
  function renderMetrics(){
    const totalCost=products.reduce((sum,p)=>sum+Number(p.qty)*Number(p.cost),0);
    const totalSale=products.reduce((sum,p)=>sum+Number(p.qty)*Number(p.price),0);
    const counts={ok:0,low:0,out:0};products.forEach(p=>counts[status(p)]++);
    $('stockCostValue').textContent=money(totalCost);$('stockSaleValue').textContent=money(totalSale);$('stockProfitValue').textContent=money(totalSale-totalCost);
    $('totalProducts').textContent=numberFormatter.format(products.length);$('totalUnits').textContent=numberFormatter.format(products.reduce((sum,p)=>sum+Number(p.qty),0));
    $('unitsLabel').textContent=numberFormatter.format(products.reduce((sum,p)=>sum+Number(p.qty),0))+' unidades';
    $('healthyCount').textContent=counts.ok;$('lowCount').textContent=counts.low;$('outCount').textContent=counts.out;
    const percent=products.length?Math.round(counts.ok/products.length*100):0;
    $('healthPct').textContent=percent+'%';$('healthDonut').style.setProperty('--ok-size',products.length?counts.ok/products.length*100:0);$('healthDonut').style.setProperty('--low-size',products.length?counts.low/products.length*100:0);
    $('healthDonut').setAttribute('aria-label',`${counts.ok} disponíveis, ${counts.low} com estoque baixo, ${counts.out} esgotados`);
    const attention=products.filter(p=>status(p)!=='ok').sort((a,b)=>Number(a.qty)/Math.max(1,Number(a.min))-Number(b.qty)/Math.max(1,Number(b.min))).slice(0,4);
    $('attentionList').innerHTML=attention.length?attention.map(p=>`<div class="attention-item">${productIcon(p)}<div class="flex-grow-1 overflow-hidden"><div class="attention-name">${html(p.name)}</div><div class="attention-sub">${html(p.sku)} · Mín. ${html(p.min)}</div></div><div class="attention-right"><strong>${html(p.qty)} un.</strong><small>${status(p)==='out'?'Esgotado':'Repor em breve'}</small></div></div>`).join(''):'<div class="empty-state"><i class="bi bi-check-circle"></i><span>Nenhum produto precisa de reposição.</span></div>';
  }
  function renderCatalog(){
    const old=$('categoryFilter').value, categories=[...new Set(products.map(p=>String(p.category)))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    $('categoryFilter').innerHTML='<option value="all">Todas as categorias</option>'+categories.map(c=>`<option value="${html(c)}">${html(c)}</option>`).join('');
    $('categoryFilter').value=categories.includes(old)?old:'all';
    const q=normalize($('searchInput').value),tokens=q.split(' ').filter(Boolean),c=$('categoryFilter').value,s=$('statusFilter').value,sort=$('sortFilter').value;
    const filtered=products.filter(p=>{
      const text=normalize([p.name,p.brand,p.category,p.sku].join(' '));return tokens.every(t=>text.includes(t))&&(c==='all'||p.category===c)&&(s==='all'||status(p)===s);
    });
    filtered.sort((a,b)=>sort==='low'?Number(a.qty)-Number(b.qty):sort==='priceDesc'?Number(b.price)-Number(a.price):sort==='marginDesc'?margin(b)-margin(a):a.name.localeCompare(b.name,'pt-BR'));
    $('visibleCount').textContent=filtered.length;$('resultsLabel').textContent=`Exibindo ${filtered.length} de ${products.length} produtos`;
    $('productRows').innerHTML=filtered.length?filtered.map(p=>{const percentage=Math.max(0,Math.min(100,Number(p.qty)/Math.max(1,Number(p.min)*3)*100));return `<tr><td><div class="product-cell">${productIcon(p)}<div class="product-info"><strong>${html(p.name)}</strong><small>${html(p.brand)}</small></div></div></td><td class="sku">${html(p.sku)}</td><td><div class="stock-qty"><strong>${html(p.qty)}</strong><span class="mini-track"><span class="${status(p)}" style="width:${percentage}%"></span></span></div></td><td>${money(p.cost)}</td><td><span class="table-money">${money(p.price)}</span></td><td><span class="margin-chip ${margin(p)<0?'negative':''}">${fmtPercent(margin(p))}</span></td><td>${badge(p)}</td><td>${actions(p)}</td></tr>`}).join(''):'<tr><td colspan="8" class="text-center py-5 text-secondary">Nenhum produto encontrado com esses filtros.</td></tr>';
    $('mobileProducts').innerHTML=filtered.length?filtered.map(p=>`<article class="mobile-product"><div class="mobile-product-head">${productIcon(p)}<div class="product-info"><strong>${html(p.name)}</strong><small>${html(p.brand)} · ${html(p.sku)}</small></div></div><div class="mobile-product-data"><div><span>Estoque</span><b>${html(p.qty)} un.</b></div><div><span>Custo</span><b>${money(p.cost)}</b></div><div><span>Venda</span><b>${money(p.price)}</b></div></div><div class="mobile-product-bottom">${badge(p)}${actions(p)}</div></article>`).join(''):'<div class="empty-state">Nenhum produto encontrado com esses filtros.</div>';
  }
  function renderHistory(){
    $('historyRows').innerHTML=history.length?history.slice(0,6).map(h=>{const icon=({in:'bi-arrow-down-left',out:'bi-arrow-up-right',sale:'bi-bag-check',set:'bi-arrow-repeat'})[h.type]||'bi-arrow-repeat';const amount=h.type==='in'?'+'+h.qty:['out','sale'].includes(h.type)?'-'+h.qty:'→ '+(h.after??h.qty);const op=({in:'Entrada',out:'Saída sem venda',sale:'Venda',set:'Ajuste'})[h.type]||'Movimentação';const date=new Date(h.date);const d=Number.isFinite(date.valueOf())?date.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'Data não informada';return `<div class="history-item"><span class="history-icon ${html(h.type)}"><i class="bi ${icon}"></i></span><div class="history-main"><strong>${html(h.name)}</strong><small>${op}${h.cancelled?' (estornada)':''} · ${html(h.note||'Sem observação')}</small></div><div class="history-amount ${html(h.type)}">${html(amount)}<small>${d}</small></div></div>`}).join(''):'<div class="empty-state"><i class="bi bi-clock-history"></i> Nenhuma movimentação registrada ainda.</div>';
  }
  function renderCategories(){
    const sums={};for(const p of products) sums[p.category]=(sums[p.category]||0)+Number(p.qty)*Number(p.cost);
    const pairs=Object.entries(sums).sort((a,b)=>b[1]-a[1]);const all=pairs.reduce((sum,p)=>sum+p[1],0);
    $('categoryBars').innerHTML=pairs.length?pairs.map(([name,value])=>{const percent=all?value/all*100:0;return `<div class="category-row"><div class="category-row-head"><strong>${html(name)}</strong><span>${money(value)} · ${fmtPercent(percent)}</span></div><div class="bar-track"><div class="bar-fill" style="--bar-w:${percent.toFixed(2)}%;width:${percent.toFixed(2)}%"></div></div></div>`}).join(''):'<div class="empty-state">Sem dados de categorias.</div>';
  }
  function render(){renderMetrics();renderCatalog();renderHistory();renderCategories();renderFinance()}
  function showProduct(id=null){
    editing=id;$('productForm').reset();$('pQty').disabled=false;$('pQty').value=0;$('pMin').value=3;$('pCost').value='';$('pPrice').value='';
    $('productModalTitle').textContent=id===null?'Novo produto':'Editar produto';
    $('editQtyHint').style.display=id===null?'none':'flex';
    if(id!==null){const p=products.find(p=>String(p.id)===String(id));if(!p)return;
      for(const [key,field] of [['name','pName'],['sku','pSku'],['brand','pBrand'],['category','pCategory'],['qty','pQty'],['min','pMin'],['cost','pCost'],['price','pPrice']]) $(field).value=p[key]??'';
      if(!Array.from($('pCategory').options).some(x=>x.value===p.category)){const option=document.createElement('option');option.textContent=p.category;$('pCategory').append(option);$('pCategory').value=p.category}
      $('pQty').disabled=true;
    }
    updateProfitPreview();pModal.show();
  }
  function updateProfitPreview(){const cost=Number($('pCost').value)||0,price=Number($('pPrice').value)||0;$('profitPreview').textContent=money(price-cost);$('marginPreview').textContent=price>0?fmtPercent((price-cost)/price*100):'0%'}
  function showMove(id,preferredType='in'){moving=id;const p=products.find(x=>String(x.id)===String(id));if(!p)return;$('moveForm').reset();$('moveType').value=preferredType;$('moveQty').value='1';$('moveSalePrice').value=Number(p.price).toFixed(2);$('moveProductName').textContent=`${p.name}  •  Estoque atual: ${p.qty} un.`;updateMovePreview();mModal.show()}
  function updateMovePreview(){const p=products.find(x=>String(x.id)===String(moving));if(!p)return;const type=$('moveType').value,qty=Number($('moveQty').value);$('moveQtyLabel').textContent=type==='set'?'Nova quantidade em estoque':'Quantidade';const after=type==='in'?Number(p.qty)+qty:['out','sale'].includes(type)?Number(p.qty)-qty:qty;$('moveAfter').textContent=Number.isInteger(qty)&&qty>=0&&after>=0?`${numberFormatter.format(after)} unidades`:'Quantidade inválida';$('saleMoveFields').hidden=type!=='sale';$('saleTotalPreview').textContent=money(amount(qty*Number($('moveSalePrice').value)));$('moveQtyLabel').textContent=type==='set'?'Nova quantidade em estoque':'Quantidade'}
  function saveProduct(event){
    event.preventDefault();const id=editing, old=id===null?null:products.find(p=>String(p.id)===String(id));
    const values={id:id===null?Date.now()+Math.floor(Math.random()*1000):old.id,name:$('pName').value.trim(),sku:$('pSku').value.trim(),brand:$('pBrand').value.trim(),category:$('pCategory').value,qty:id===null?Number($('pQty').value):Number(old.qty),min:Number($('pMin').value),cost:Number($('pCost').value),price:Number($('pPrice').value)};
    if(!values.name||!values.sku||!values.category||![values.qty,values.min].every(v=>Number.isInteger(v)&&v>=0)||![values.cost,values.price].every(v=>Number.isFinite(v)&&v>=0)){alert('Preencha corretamente todos os campos obrigatórios.');return}
    if(products.some(p=>p.sku.toLowerCase()===values.sku.toLowerCase()&&String(p.id)!==String(id))){alert('Já existe um produto com esse código/SKU.');return}
    if(id===null){products.push(values);if(values.qty>0)history.unshift({date:now(),id:values.id,name:values.name,type:'in',qty:values.qty,before:0,after:values.qty,note:'Estoque inicial do cadastro'})}
    else{products[products.findIndex(p=>String(p.id)===String(id))]=values}
    persist();render();pModal.hide();toast(id===null?'Produto cadastrado com sucesso!':'Produto atualizado com sucesso!');
  }
  function saveMove(event){
    event.preventDefault();const p=products.find(x=>String(x.id)===String(moving));if(!p)return;
    const type=$('moveType').value,qty=Number($('moveQty').value),before=Number(p.qty),note=$('moveNote').value.trim();
    if(!Number.isInteger(qty)||qty<0||(type!=='set'&&qty===0)){alert('Informe uma quantidade inteira e válida.');return}
    if(['out','sale'].includes(type)&&qty>before){alert('A saída não pode ser maior que a quantidade disponível.');return}
    const after=type==='in'?before+qty:['out','sale'].includes(type)?before-qty:qty;
    if(type==='set'&&after===before){alert('A nova quantidade é igual ao estoque atual.');return}
    if(type==='sale'&&(!Number.isFinite(Number($('moveSalePrice').value))||Number($('moveSalePrice').value)<0||$('moveSalePrice').value==='')){alert('Informe um preço de venda válido.');return}
    p.qty=after;
    const movement={date:now(),id:p.id,sku:p.sku,name:p.name,type,qty,before,after,note:note||({'in':'Entrada de estoque','out':'Saída sem venda','sale':'Venda realizada','set':'Ajuste de inventário'})[type]};
    if(type==='sale'){movement.saleId='S-'+Date.now()+'-'+Math.floor(Math.random()*10000);movement.saleUnit=amount($('moveSalePrice').value);movement.costUnit=amount(p.cost);movement.revenue=amount(qty*movement.saleUnit);movement.cogs=amount(qty*movement.costUnit)}
    history.unshift(movement);
    persist();render();mModal.hide();toast(type==='sale'?'Venda registrada e estoque atualizado!':'Movimentação registrada com sucesso!');
  }
  function deleteProduct(id){const p=products.find(x=>String(x.id)===String(id));if(!p)return;if(!confirm(`Excluir “${p.name}”?\n\nO produto será excluído. O histórico de movimentações será preservado.`))return;products=products.filter(x=>String(x.id)!==String(id));persist();render();toast('Produto excluído. Histórico preservado.')}
  function onActionClick(event){const button=event.target.closest('button[data-action]');if(!button)return;const {id,action}=button.dataset;if(action==='edit')showProduct(id);if(action==='move')showMove(id);if(action==='delete')deleteProduct(id)}
  function download(name,contents,type='text/plain;charset=utf-8'){const url=URL.createObjectURL(new Blob([contents],{type}));const anchor=document.createElement('a');anchor.href=url;anchor.download=name;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
  const xmoney = v => ({v:amount(v),type:'money'});
  const xdate = v => ({v:v,type:'date'});
  const xpct = v => ({v:(Number(v)||0)/100,type:'percent'});
  const headersStock = ['Código','Produto','Marca','Categoria','Quantidade','Estoque mínimo','Custo unitário (R$)','Venda unitária (R$)','Margem','Capital em estoque (R$)','Venda potencial (R$)','Lucro potencial (R$)'];
  const stockRows = () => [headersStock,...products.map(p=>[p.sku,p.name,p.brand,p.category,Number(p.qty),Number(p.min),xmoney(p.cost),xmoney(p.price),xpct(margin(p)),xmoney(p.cost*p.qty),xmoney(p.price*p.qty),xmoney((p.price-p.cost)*p.qty)])];
  const historyRows = () => [['Data','Código','Produto','Tipo','Quantidade','Estoque anterior','Estoque final','Observação','Status'],...history.map(h=>[xdate(h.date),h.sku||products.find(p=>String(p.id)===String(h.id))?.sku||'',h.name,({in:'Entrada',out:'Saída sem venda',sale:'Venda',set:'Ajuste'})[h.type]||h.type,Number(h.qty),Number(h.before)||0,Number(h.after)||0,h.note||'',h.cancelled?'Estornada':'Ativa'])];
  function exportStockExcel(){HLExcel.exportWorkbook([{name:'Estoque',rows:stockRows()}],'Grupo_HL_Estoque.xlsx');toast('Estoque exportado para Excel (.xlsx)!')}
  function exportHistory(){HLExcel.exportWorkbook([{name:'Movimentações',rows:historyRows()}],'Grupo_HL_Movimentacoes.xlsx');toast('Movimentações exportadas para Excel!')}
  function saveBackup(){const data={app:'Grupo HL Gestão',version:3,exportedAt:now(),products,history,expenses};download('Grupo_HL_Backup_'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(data,null,2),'application/json');toast('Backup salvo. Guarde o arquivo em local seguro.')}
  function validateBackup(data){return data&&data.app==='Grupo HL Gestão'&&Array.isArray(data.products)&&Array.isArray(data.history)&&data.products.length<=10000&&data.history.length<=100000&&data.products.every(p=>p&&typeof p.name==='string'&&typeof p.sku==='string'&&typeof p.category==='string'&&Number.isInteger(Number(p.qty))&&Number(p.qty)>=0&&Number(p.cost)>=0&&Number(p.price)>=0&&Number.isFinite(Number(p.cost))&&Number.isFinite(Number(p.price)))&&data.history.every(h=>h&&typeof h.name==='string'&&['in','out','sale','set'].includes(h.type))&&(!('expenses' in data)||(Array.isArray(data.expenses)&&data.expenses.length<=100000&&data.expenses.every(e=>e&&typeof e.description==='string'&&Number.isFinite(Number(e.amount))&&Number(e.amount)>0)))}
  async function restoreBackup(event){const file=event.target.files[0];event.target.value='';if(!file)return;if(file.size>8*1024*1024){alert('Arquivo muito grande para restaurar.');return}try{const contents=await file.text();const data=JSON.parse(contents);if(!validateBackup(data)){alert('Este arquivo não é um backup válido do Grupo HL Gestão.');return}if(!confirm(`Restaurar ${data.products.length} produtos e ${data.history.length} movimentações?\n\nIsso substitui todos os dados que estão salvos neste navegador. Faça um backup antes de continuar.`))return;products=data.products.map(p=>({...p,id:p.id??Date.now()+Math.random(),min:Number(p.min)||0,qty:Number(p.qty),cost:Number(p.cost),price:Number(p.price)}));history=data.history.map(h=>({...h}));expenses=(data.expenses||[]).map(e=>({...e}));persist();render();toast('Backup restaurado com sucesso!')}catch{alert('Não foi possível ler o arquivo JSON selecionado.')}}
  function reportRange(){
    const d=new Date(),y=d.getFullYear(),m=d.getMonth(),type=$('reportPeriod').value;
    let from='',to=localYMD(d);
    if(type==='month') from=localYMD(new Date(y,m,1));
    if(type==='prev'){from=localYMD(new Date(y,m-1,1));to=localYMD(new Date(y,m,0))}
    if(type==='30') from=localYMD(new Date(y,m,d.getDate()-29));
    if(type==='all'){from='';to=''}
    if(type==='custom'){from=$('reportFrom').value;to=$('reportTo').value}
    return {from,to};
  }
  function inRange(date,{from,to}){const day=localYMD(date);return day&&(!from||day>=from)&&(!to||day<=to)}
  function financeData(){
    const range=reportRange();
    const sales=history.filter(h=>h.type==='sale'&&!h.cancelled&&inRange(h.date,range));
    const costs=expenses.filter(e=>!e.cancelled&&inRange(e.date,range));
    const revenue=amount(sales.reduce((s,h)=>s+Number(h.revenue||0),0));
    const cogs=amount(sales.reduce((s,h)=>s+Number(h.cogs||0),0));
    const spending=amount(costs.reduce((s,e)=>s+Number(e.amount||0),0));
    return {range,sales,costs,revenue,cogs,spending,result:amount(revenue-cogs-spending)};
  }
  const dateFormat = value => {const d=new Date(String(value).length===10?`${value}T12:00:00`:value);return Number.isFinite(d.getTime())?d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}):'-'};
  function renderFinance(){
    const data=financeData();
    $('customDates').hidden=$('reportPeriod').value!=='custom';
    $('reportDateLabel').textContent=!data.range.from&&!data.range.to?'Todo o histórico':`${data.range.from?dateFormat(data.range.from):'Início'} a ${data.range.to?dateFormat(data.range.to):'Hoje'}`;
    $('reportRevenue').textContent=money(data.revenue);$('reportCogs').textContent=money(data.cogs);
    $('reportExpenses').textContent=money(data.spending);$('reportResult').textContent=money(data.result);
    $('reportResult').classList.toggle('financial-loss',data.result<0);
    $('reportSalesCount').textContent=`${data.sales.length} venda${data.sales.length===1?'':'s'} registrada${data.sales.length===1?'':'s'}`;
    $('reportExpenseCount').textContent=`${data.costs.length} despesa${data.costs.length===1?'':'s'}`;
    $('saleTableCount').textContent=data.sales.length;$('expenseTableCount').textContent=data.costs.length;
    const sortedSales=[...data.sales].sort((a,b)=>new Date(b.date)-new Date(a.date));
    const sortedExpenses=[...data.costs].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    $('salesReportRows').innerHTML=sortedSales.length?sortedSales.map(h=>`<tr><td><strong>${html(h.name)}</strong><small>${dateFormat(h.date)} · ${html(h.sku||'Venda registrada')}</small></td><td>${Number(h.qty)}</td><td class="finance-number">${money(h.revenue)}</td><td class="finance-number">${money(Number(h.revenue)-Number(h.cogs))}</td><td class="text-end"><button type="button" class="fin-mini-btn" data-cancel-sale="${html(h.saleId||h.date)}" title="Estornar venda">Estornar</button></td></tr>`).join(''):'<tr><td colspan="5" class="finance-empty">Nenhuma venda registrada neste período. Use “Registrar venda” para começar.</td></tr>';
    $('expensesReportRows').innerHTML=sortedExpenses.length?sortedExpenses.map(e=>`<tr><td><strong>${html(e.description)}</strong><small>${dateFormat(e.date)}</small></td><td><span class="expense-category">${html(e.category)}</span></td><td class="finance-number">${money(e.amount)}</td><td class="text-end"><button type="button" class="fin-mini-btn" data-cancel-expense="${html(e.id)}" title="Cancelar lançamento">Cancelar</button></td></tr>`).join(''):'<tr><td colspan="4" class="finance-empty">Nenhuma despesa registrada neste período.</td></tr>';
    const byProduct=new Map();
    data.sales.forEach(h=>{const key=String(h.sku||h.name),value=byProduct.get(key)||{name:h.name,qty:0,revenue:0};value.qty+=Number(h.qty);value.revenue+=Number(h.revenue);byProduct.set(key,value)});
    const leaders=[...byProduct.values()].sort((a,b)=>b.revenue-a.revenue).slice(0,5);
    $('topSoldProducts').innerHTML=leaders.length?leaders.map((p,i)=>`<div class="top-sale-item"><span class="top-index">${String(i+1).padStart(2,'0')}</span><span class="top-sale-copy"><b>${html(p.name)}</b><small>${p.qty} unidade${p.qty===1?'':'s'} vendida${p.qty===1?'':'s'}</small></span><strong>${money(p.revenue)}</strong></div>`).join(''):'<div class="finance-empty">Registre uma venda para visualizar os produtos com mais faturamento.</div>';
    renderMonthlySales();
  }
  function renderMonthlySales(){
    const months=[];const today=new Date();
    for(let i=5;i>=0;i--){const d=new Date(today.getFullYear(),today.getMonth()-i,1);months.push({key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,label:d.toLocaleDateString('pt-BR',{month:'short'}).replace('.',''),sum:0})}
    history.filter(h=>h.type==='sale'&&!h.cancelled).forEach(h=>{const mm=months.find(x=>x.key===localYMD(h.date).slice(0,7));if(mm)mm.sum+=Number(h.revenue||0)});
    const peak=Math.max(1,...months.map(v=>v.sum));
    $('monthlySalesBars').innerHTML=months.map(m=>`<div class="month-col" title="${html(m.key)} · ${money(m.sum)}"><span class="month-amount">${m.sum?money(m.sum):'—'}</span><div class="month-track"><div class="month-fill" style="height:${Math.round(m.sum/peak*100)}%"></div></div><span class="month-label">${html(m.label)}</span></div>`).join('');
  }
  function newExpense(){
    $('expenseForm').reset();$('eDate').value=localYMD(new Date());eModal.show();
  }
  function saveExpense(event){
    event.preventDefault();const description=$('eDescription').value.trim(),cost=Number($('eAmount').value),date=$('eDate').value;
    if(!description||!Number.isFinite(cost)||cost<=0||!/^\d{4}-\d{2}-\d{2}$/.test(date)){alert('Preencha descrição, data e valor válido.');return}
    expenses.unshift({id:'E-'+Date.now()+'-'+Math.floor(Math.random()*10000),description,date,category:$('eCategory').value,amount:amount(cost)});
    persist();renderFinance();eModal.hide();toast('Despesa registrada no financeiro!');
  }
  function cancelExpense(id){const e=expenses.find(x=>String(x.id)===String(id));if(!e||!confirm(`Cancelar a despesa “${e.description}” (${money(e.amount)})?\nO lançamento ficará preservado no backup.`))return;e.cancelled=true;persist();renderFinance();toast('Despesa cancelada.')}
  function cancelSale(id){
    const h=history.find(x=>x.type==='sale'&&!x.cancelled&&String(x.saleId||x.date)===String(id));if(!h)return;
    const p=products.find(x=>String(x.id)===String(h.id));
    if(!p){alert('Este produto foi excluído. Restaure/cadastre o produto antes de estornar a venda para preservar a consistência do estoque.');return}
    if(!confirm(`Estornar a venda de ${h.qty} unidade(s) de “${h.name}”?\nO estoque será devolvido e a venda sairá dos indicadores financeiros.`))return;
    const before=Number(p.qty);p.qty=before+Number(h.qty);h.cancelled=true;h.cancelledAt=now();
    history.unshift({id:p.id,sku:p.sku,name:p.name,type:'in',date:now(),qty:Number(h.qty),before,after:p.qty,note:'Estorno de venda '+String(h.saleId||'')});
    persist();render();toast('Venda estornada e estoque devolvido.');
  }
  function exportFinance(){
    const d=financeData();const total=products.reduce((s,p)=>s+Number(p.qty)*Number(p.cost),0);
    const categories={};products.forEach(p=>{const key=p.category;categories[key]??={products:0,units:0,cost:0,sale:0};categories[key].products++;categories[key].units+=Number(p.qty);categories[key].cost+=Number(p.qty)*Number(p.cost);categories[key].sale+=Number(p.qty)*Number(p.price)});
    const sheets=[
      {name:'Resumo',filter:false,rows:[['GRUPO HL · RELATÓRIO FINANCEIRO','VALOR'],['Período inicial',d.range.from||'Todo o histórico'],['Período final',d.range.to||'Todo o histórico'],['Emitido em',xdate(now())],['Vendas registradas',d.sales.length],['Receita real registrada',xmoney(d.revenue)],['Custo das mercadorias vendidas',xmoney(d.cogs)],['Lucro bruto de vendas',xmoney(d.revenue-d.cogs)],['Despesas operacionais',xmoney(d.spending)],['Resultado gerencial estimado',xmoney(d.result)],['Produtos cadastrados',products.length],['Capital em estoque (na data da exportação)',xmoney(total)],['Venda potencial do estoque',xmoney(products.reduce((s,p)=>s+Number(p.qty)*Number(p.price),0))],['IMPORTANTE','As saídas sem venda não entram na receita. Resultado sem tributos, contas a receber ou outras obrigações.'],['DADOS','Os preços e registros demonstrativos precisam ser substituídos por dados reais.']]},
      {name:'Vendas',rows:[['Data','Código','Produto','Quantidade','Preço unitário (R$)','Custo unitário (R$)','Receita (R$)','Custo total (R$)','Lucro bruto (R$)','Observação'],...d.sales.map(h=>[xdate(h.date),h.sku||'',h.name,Number(h.qty),xmoney(h.saleUnit),xmoney(h.costUnit),xmoney(h.revenue),xmoney(h.cogs),xmoney(Number(h.revenue)-Number(h.cogs)),h.note||''])]},
      {name:'Despesas',rows:[['Data','Descrição','Categoria','Valor (R$)'],...d.costs.map(e=>[xdate(e.date),e.description,e.category,xmoney(e.amount)])]},
      {name:'Estoque',rows:stockRows()},
      {name:'Movimentações',rows:historyRows()},
      {name:'Categorias',rows:[['Categoria','Produtos cadastrados','Unidades em estoque','Capital em estoque (R$)','Venda potencial (R$)'],...Object.entries(categories).map(([name,row])=>[name,row.products,row.units,xmoney(row.cost),xmoney(row.sale)])]}
    ];
    HLExcel.exportWorkbook(sheets,'Grupo_HL_Relatorio_Financeiro_'+localYMD(new Date())+'.xlsx');
    toast('Relatório Excel completo exportado (6 abas)!');
  }
  function setup(){
    $('todayLabel').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    document.querySelectorAll('[data-new-product]').forEach(b=>b.addEventListener('click',()=>showProduct()));
    $('productForm').addEventListener('submit',saveProduct);$('moveForm').addEventListener('submit',saveMove);
    $('productRows').addEventListener('click',onActionClick);$('mobileProducts').addEventListener('click',onActionClick);
    $('searchInput').addEventListener('input',renderCatalog);
    ['categoryFilter','statusFilter','sortFilter'].forEach(id=>$(id).addEventListener('change',renderCatalog));
    ['pPrice','pCost'].forEach(id=>$(id).addEventListener('input',updateProfitPreview));
    ['moveType','moveQty','moveSalePrice'].forEach(id=>$(id).addEventListener('input',updateMovePreview));
    $('exportStockExcelBtn').addEventListener('click',exportStockExcel);$('exportHistoryBtn').addEventListener('click',exportHistory);
    $('reportPeriod').addEventListener('change',renderFinance);['reportFrom','reportTo'].forEach(id=>$(id).addEventListener('change',renderFinance));
    $('newExpenseBtn').addEventListener('click',newExpense);$('expenseForm').addEventListener('submit',saveExpense);
    $('newSaleBtn').addEventListener('click',()=>openProductChooser('sale'));
    $('exportFinanceBtn').addEventListener('click',exportFinance);
    $('salesReportRows').addEventListener('click',event=>{const button=event.target.closest('[data-cancel-sale]');if(button)cancelSale(button.dataset.cancelSale)});
    $('expensesReportRows').addEventListener('click',event=>{const button=event.target.closest('[data-cancel-expense]');if(button)cancelExpense(button.dataset.cancelExpense)});
    $('backupBtn').addEventListener('click',saveBackup);$('restoreBtn').addEventListener('click',()=>$('restoreInput').click());$('restoreInput').addEventListener('change',restoreBackup);
    function openProductChooser(mode='in'){selectMoveMode=mode;const select=$('quickProductSelect');select.innerHTML=products.filter(p=>mode!=='sale'||Number(p.qty)>0).map(p=>`<option value="${html(p.id)}">${html(p.name)} (${html(p.qty)} un.)</option>`).join('');if(!select.options.length){alert(mode==='sale'?'Não há produtos com estoque disponível para venda.':'Cadastre um produto primeiro.');return}chooseModal.show()}
    $('quickMoveBtn').addEventListener('click',()=>openProductChooser('in'));
    $('continueMoveBtn').addEventListener('click',()=>{const id=$('quickProductSelect').value;chooseModal.hide();$('selectMoveModal').addEventListener('hidden.bs.modal',()=>showMove(id,selectMoveMode),{once:true})});
    document.querySelectorAll('[data-section]').forEach(link=>link.addEventListener('click',()=>{const name=link.dataset.section;document.querySelectorAll('[data-section]').forEach(el=>el.classList.toggle('active',el.dataset.section===name));const mobile=bootstrap.Offcanvas.getInstance($('mobileNav'));if(mobile)mobile.hide()}));
    render();
    if(!parse(STORE)||!parse(EXPENSE_STORE))persist();
  }
  setup();
})();
