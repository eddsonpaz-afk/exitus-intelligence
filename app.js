
const fmt=n=>new Intl.NumberFormat('pt-BR').format(n||0);
const E=id=>document.getElementById(id);
const REGIONS=['Norte','Nordeste','Centro-Oeste','Sudeste','Sul'];
function syncUF(){let current=E('uf').value,reg=E('reg').value;E('uf').innerHTML='<option value="">Todos os estados</option>';STATES.filter(s=>!reg||s[0]===reg).map(s=>s[1]).sort().forEach(uf=>E('uf').add(new Option(uf,uf)));E('uf').value=[...E('uf').options].some(x=>x.value===current)?current:'';}
REGIONS.forEach(r=>E('reg').add(new Option(r,r)));
syncUF();
const ABBR={'Acre':'AC','Alagoas':'AL','Amapá':'AP','Amazonas':'AM','Bahia':'BA','Ceará':'CE','Distrito Federal':'DF','Espírito Santo':'ES','Goiás':'GO','Maranhão':'MA','Mato Grosso':'MT','Mato Grosso do Sul':'MS','Minas Gerais':'MG','Pará':'PA','Paraíba':'PB','Paraná':'PR','Pernambuco':'PE','Piauí':'PI','Rio de Janeiro':'RJ','Rio Grande do Norte':'RN','Rio Grande do Sul':'RS','Rondônia':'RO','Roraima':'RR','Santa Catarina':'SC','São Paulo':'SP','Sergipe':'SE','Tocantins':'TO'};
let hovered='',geoShapes=[];
function view(){const reg=E('reg').value,uf=E('uf').value,stage=E('stage').value,size=E('size').value;return STATES.filter(x=>(!reg||x[0]===reg)&&(!uf||x[1]===uf)).map(x=>{
 let a=x.slice();if(stage){a[2]=a[stage==='fund'?3:stage==='med'?4:5];a[3]=stage==='fund'?a[3]:0;a[4]=stage==='med'?a[4]:0;a[5]=stage==='both'?a[5]:0;a[6]=null;a[7]=null;}if(size){if(stage){a[2]=null;a[3]=null;a[4]=null;a[5]=null;}else{a[2]=size==='500'?x[6]:x[2]-x[6];a[3]=null;a[4]=null;a[5]=null;a[6]=size==='500'?x[6]:0;}a[7]=null;}return a;});}
function sum(d,i){return d.reduce((t,x)=>t+(x[i]||0),0)}function showValue(v){return v==null?'—':fmt(v)}
function refresh(){let d=view(),total=sum(d,2),f=sum(d,3),m=sum(d,4),b=sum(d,5),big=sum(d,6),stage=E('stage').value,size=E('size').value,compound=!!stage&&!!size;
E('kt').textContent=compound?'—':fmt(total);E('kf').textContent=size?'—':fmt(f);E('km').textContent=size?'—':fmt(m);E('ka').textContent=size?'—':fmt(b);E('k5').textContent=stage?'—':fmt(big);
const regs=REGIONS.map(r=>[r,d.filter(x=>x[0]===r).reduce((n,x)=>n+(x[2]||0),0)]),max=Math.max(...regs.map(x=>x[1]),1);
const lines=regs.map(([name,n])=>'<div class="barrow"><strong>'+name+'</strong><div class="track"><div class="fill" style="width:'+n/max*100+'%"></div></div><b>'+fmt(n)+'</b></div>').join('');
E('bars').innerHTML=lines;let barsData=E('uf').value?[[E('uf').value,total]]:E('reg').value?d.map(x=>[x[1],x[2]||0]).sort((a,b)=>b[1]-a[1]):regs;let mx=Math.max(1,...barsData.map(x=>x[1]));E('regionBars').innerHTML=barsData.map(([n,v])=>'<div class="barrow"><strong>'+n+'</strong><div class="track"><div class="fill" style="width:'+(v/mx*100)+'%"></div></div><b>'+fmt(v)+'</b></div>').join('');
let p=total?f/total*100:0,q=total?(f+m)/total*100:0;E('donut').style.background=size?'#e8f2fa':'conic-gradient(#123c88 0 '+p+'%,#66aeff '+p+'% '+q+'%,#f5a201 '+q+'% 100%)';E('dn').textContent=compound?'—':fmt(total);E('lf').textContent=size?'—':fmt(f);E('lm').textContent=size?'—':fmt(m);E('la').textContent=size?'—':fmt(b);
E('tbody').innerHTML=d.sort((a,b)=>(b[2]||0)-(a[2]||0)).map(a=>'<tr><td>'+a[0]+'</td><td><strong>'+a[1]+'</strong></td><td>'+showValue(a[2])+'</td><td>'+showValue(a[6])+'</td><td>'+((size||compound)?'—':showValue(a[3]))+'</td><td>'+((size||compound)?'—':showValue(a[4]))+'</td><td>'+((size||compound)?'—':showValue(a[5]))+'</td><td>'+showValue(a[7])+'</td></tr>').join('')||'<tr><td colspan="8">Nenhuma escola no recorte.</td></tr>';
E('summary').textContent=compound?'A base agregada não permite cruzar simultaneamente porte e etapa; não inventamos esse número.':'Escolas privadas e matrículas agregadas, conforme o recorte selecionado.';
updateMap();}
function updateMap(){let selected=E('uf').value,reg=E('reg').value;for(let el of geoShapes){let active=selected?el.dataset.uf===selected:reg&&STATES.some(x=>x[1]===el.dataset.uf&&x[0]===reg);el.classList.toggle('selected',!!active);el.classList.toggle('hover',el.dataset.uf===hovered&&!active)}}
function pointsToPath(geometry){let rings=[];if(geometry.type==='Polygon')rings=geometry.coordinates;else if(geometry.type==='MultiPolygon')rings=geometry.coordinates.flat();const project=([lon,lat])=>[((lon+75)*10.4+25).toFixed(1),((6-lat)*10.4+16).toFixed(1)];return rings.map(r=>r.map((p,i)=>{let [x,y]=project(p);return(i?'L':'M')+x+' '+y}).join('')+'Z').join('');}
async function drawMap(){const map=E('brmap');map.innerHTML='<text x="18" y="220" fill="#3f6593" font-size="19">Carregando mapa...</text>';let urls=['https://cdn.jsdelivr.net/gh/codeforamerica/click_that_hood@master/public/data/brazil-states.geojson','https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson'];
let data;for(let url of urls){try{let r=await fetch(url);if(r.ok){data=await r.json();break}}catch(e){}}
if(!data){map.innerHTML='<text x="20" y="180" fill="#1b3554">Não foi possível carregar o mapa.</text>';return;}
map.innerHTML='';for(let f of data.features){let name=f.properties.name||f.properties.nome||'',uf=ABBR[name]||f.properties.sigla||f.properties.abbrev||f.properties.id;if(!uf)continue;let path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',pointsToPath(f.geometry));path.dataset.uf=uf;path.onmouseenter=()=>{hovered=uf;let row=STATES.find(x=>x[1]===uf);E('maptip').style.display='block';E('maptip').textContent=uf+' · '+fmt(row?.[2])+' escolas privadas';updateMap()};path.onmouseleave=()=>{hovered='';E('maptip').style.display='none';updateMap()};path.onclick=()=>{let clicked=E('uf').value===uf;E('uf').value=clicked?'':uf;E('reg').value=STATES.find(s=>s[1]===uf)?.[0]||'';syncUF();E('uf').value=clicked?'':uf;refresh()};map.appendChild(path);geoShapes.push(path)}
updateMap();}
['reg','uf','stage','size'].forEach(id=>E(id).addEventListener('change',()=>{if(id==='reg')syncUF();refresh()}));
E('clear').onclick=()=>{for(let id of ['reg','uf','stage','size'])E(id).value='';syncUF();refresh()};
E('city').disabled=true;E('city').title='Disponível após integração da lista nominal integral';
E('schoolbody').innerHTML='<tr><td colspan="6">Os nomes das escolas ainda não foram incorporados ao servidor. A lista completa será liberada após a carga integral dos registros.</td></tr>';E('listcount').textContent='Integração da lista nominal em andamento';
E('csvschools').disabled=true;E('searchbox').disabled=true;E('prev').disabled=true;E('next').disabled=true;
E('export').onclick=()=>{let rows=[['Região','UF','Escolas','500+','Somente Fundamental','Somente Médio','Ambos','Matrículas'],...view().map(x=>x.map(v=>v??''))];let csv='\uFEFF'+rows.map(row=>row.join(';')).join('\n');let a=document.createElement('a'),u=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.href=u;a.download='exitus-intelligence-uf-2025.csv';a.click();URL.revokeObjectURL(u)};
refresh();drawMap();
