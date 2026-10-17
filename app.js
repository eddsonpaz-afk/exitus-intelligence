
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
let SCHOOLS=[],listed=[],page=0;
const nfmt=n=>new Intl.NumberFormat('pt-BR').format(n||0);
function esc(t){return String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function parseCSV(t){let rows=[],row=[],v='',q=false;for(let i=0;i<t.length;i++){let c=t[i];if(c==='"'){if(q&&t[i+1]==='"'){v+='"';i++}else q=!q}else if(c===','&&!q){row.push(v);v=''}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&t[i+1]==='\n')i++;row.push(v);if(row.length>1)rows.push(row);row=[];v=''}else v+=c;}if(row.length||v){row.push(v);rows.push(row)}let h=rows.shift()?.map(x=>x.trim().replace(/^\uFEFF/,''))||[];let needed=['inep','escola','regiao','uf','municipio','fund','medio','ambos','matriculas'];if(!needed.every(x=>h.includes(x)))throw Error('Formato da base nominal inesperado');return rows.map(r=>Object.fromEntries(needed.map(k=>[k,r[h.indexOf(k)]]))).filter(x=>x.inep)}
function chosen(x){let p=E('stage').value,z=E('size').value;return (!E('reg').value||x.regiao===E('reg').value)&&(!E('uf').value||x.uf===E('uf').value)&&(!E('city').value||x.municipio===E('city').value)&&(!p||(p==='fund'&&x.fund==='1')||(p==='med'&&x.medio==='1')||(p==='both'&&x.ambos==='1'))&&(!z||(z==='500'?+x.matriculas>=500:z==='under400'?+x.matriculas<400:+x.matriculas<500))}
function refreshCities(){let old=E('city').value;E('city').innerHTML='<option value="">Todos os municípios</option>';[...new Set(SCHOOLS.filter(x=>(!E('reg').value||x.regiao===E('reg').value)&&(!E('uf').value||x.uf===E('uf').value)).map(x=>x.municipio))].sort((a,b)=>a.localeCompare(b,'pt-BR')).forEach(x=>E('city').add(new Option(x,x)));if([...E('city').options].some(o=>o.value===old))E('city').value=old}
function currentData(){if(!SCHOOLS.length)return;listed=SCHOOLS.filter(chosen);let f=listed.filter(x=>x.fund==='1').length,m=listed.filter(x=>x.medio==='1').length,b=listed.filter(x=>x.ambos==='1').length,total=listed.length,big=listed.filter(x=>+x.matriculas>=500).length;
[['kt',total],['kf',f],['km',m],['ka',b],['k5',listed.reduce((sum,x)=>sum+(Number(x.matriculas)||0),0)]].forEach(([k,v])=>E(k).textContent=nfmt(v));
let regs=REGIONS.map(r=>[r,listed.filter(x=>x.regiao===r).length]);let max=Math.max(1,...regs.map(x=>x[1]));E('bars').innerHTML=regs.map(([r,v])=>'<div class="barrow"><strong>'+r+'</strong><div class="track"><div class="fill" style="width:'+(100*v/max)+'%"></div></div><b>'+nfmt(v)+'</b></div>').join('');
let byUf={};for(let x of listed){let u=x.uf;if(!byUf[u])byUf[u]={u,region:x.regiao,n:0,f:0,m:0,b:0,big:0,mat:0};let t=byUf[u];t.n++;t.f+=x.fund==='1';t.m+=x.medio==='1';t.b+=x.ambos==='1';t.big+=+x.matriculas>=500;t.mat+=Number(x.matriculas)||0}
let vals=Object.values(byUf);let chart=E('uf').value?[[E('uf').value,total]]:E('reg').value?vals.map(x=>[x.u,x.n]).sort((a,b)=>b[1]-a[1]):regs;max=Math.max(1,...chart.map(x=>x[1]));E('regionBars').innerHTML=chart.map(([r,v])=>'<div class="barrow"><strong>'+r+'</strong><div class="track"><div class="fill" style="width:'+(100*v/max)+'%"></div></div><b>'+nfmt(v)+'</b></div>').join('');
E('donut').style.background='conic-gradient(#123c88 0 '+(total?100*f/total:0)+'%,#66aeff '+(total?100*f/total:0)+'% '+(total?100*(f+m)/total:0)+'%,#f5a201 '+(total?100*(f+m)/total:0)+'% 100%)';E('dn').textContent=nfmt(total);E('lf').textContent=nfmt(f);E('lm').textContent=nfmt(m);E('la').textContent=nfmt(b);
E('tbody').innerHTML=vals.sort((a,b)=>b.big-a.big).map(x=>'<tr><td>'+x.region+'</td><td><strong>'+x.u+'</strong></td><td>'+nfmt(x.n)+'</td><td>'+nfmt(x.big)+'</td><td>'+nfmt(x.f)+'</td><td>'+nfmt(x.m)+'</td><td>'+nfmt(x.b)+'</td><td>'+nfmt(x.mat)+'</td></tr>').join('');
E('summary').textContent=nfmt(total)+' escolas privadas no recorte. Dados e escolas derivados da mesma base nominal.';page=0;renderNames()}
function renderNames(){if(!SCHOOLS.length)return;let search=E('searchbox').value.trim().toLowerCase(),rs=search?listed.filter(x=>x.escola.toLowerCase().includes(search)||x.inep.includes(search)):listed;let maxPage=Math.max(1,Math.ceil(rs.length/30));page=Math.min(Math.max(0,page),maxPage-1);E('schoolbody').innerHTML=rs.slice(page*30,(page+1)*30).map(x=>'<tr><td>'+esc(x.inep)+'</td><td><strong>'+esc(x.escola)+'</strong></td><td>'+esc(x.uf)+'</td><td>'+esc(x.municipio)+'</td><td>'+(x.ambos==='1'?'Fundamental + Médio':x.fund==='1'?'Só Fundamental':'Só Médio')+'</td><td>'+nfmt(+x.matriculas)+'</td></tr>').join('')||'<tr><td colspan="6">Nenhuma escola encontrada.</td></tr>';E('listcount').textContent=nfmt(rs.length)+' escolas encontradas';E('pagelabel').textContent='Página '+(page+1)+' de '+maxPage;E('prev').disabled=!page;E('next').disabled=page===maxPage-1}
E('searchbox').oninput=()=>{page=0;renderNames()};
E('prev').onclick=()=>{page--;renderNames()};E('next').onclick=()=>{page++;renderNames()};
E('city').onchange=()=>{currentData();updateMap()};
const originalRefresh=refresh;refresh=()=>{if(SCHOOLS.length){refreshCities();currentData();updateMap()}else originalRefresh()};
E('csvschools').onclick=()=>{let csv='\uFEFFinep;escola;regiao;uf;municipio;fund;medio;ambos;matriculas\n'+listed.map(x=>[x.inep,x.escola,x.regiao,x.uf,x.municipio,x.fund,x.medio,x.ambos,x.matriculas].map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\n');let a=document.createElement('a'),u=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.href=u;a.download='escolas-privadas-exitus.csv';a.click();URL.revokeObjectURL(u)};
fetch('/Exitus_Escolas_Privadas_Com_Matriculas_2025.csv?base=2025v3').then(x=>{if(!x.ok)throw Error('Arquivo pendente');return x.text()}).then(t=>{SCHOOLS=parseCSV(t);refreshCities();currentData();updateMap();E('listcount').textContent=nfmt(listed.length)+' escolas encontradas no recorte'}).catch(e=>{E('listcount').textContent='Aguardando publicação da base nominal no projeto';E('schoolbody').innerHTML='<tr><td colspan="6">Não foi possível ler a base nominal. Verifique a publicação do arquivo e atualize a página.</td></tr>'});
E('export').onclick=()=>{let rows=[['Região','UF','Escolas','500+','Somente Fundamental','Somente Médio','Ambos','Matrículas'],...view().map(x=>x.map(v=>v??''))];let csv='\uFEFF'+rows.map(row=>row.join(';')).join('\n');let a=document.createElement('a'),u=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.href=u;a.download='exitus-intelligence-uf-2025.csv';a.click();URL.revokeObjectURL(u)};
refresh();drawMap();


const DATA_FIELDS=['internet','bandaLarga','redesSociais','internetAprendizagem','labInformatica','biblioteca','quadra','salaProfessor','lousaDigital','multimidia','computador'];
function updateInstitutionalPanels(){
 const u=E('uf').value,reg=E('reg').value,city=E('city').value,stage=E('stage').value,porte=E('size').value;
 const unsupported=!!(city||stage||porte);
 const list=EXITUS_FEATURES.filter(x=>(!u||x[0]===u)&&(!reg||STATES.some(s=>s[1]===x[0]&&s[0]===reg)));
 const sumX=i=>list.reduce((acc,x)=>acc+x[i],0);const total=sumX(1);
 E('insightsScope').textContent=u?'UF: '+u:reg?'Região: '+reg:'Brasil inteiro';
 E('insightsWarn').hidden=!unsupported;
 const show=v=>unsupported?'—':nfmt(v);
 E('digitalNumber').textContent=show(sumX(7));E('iInternet').textContent=show(sumX(5));E('iBroadband').textContent=show(sumX(6));
 E('digitalBar').style.width=unsupported?'0%':(total?100*sumX(7)/total:0)+'%';
 E('networkNumber').textContent=show(sumX(2));
 E('networkGroups').textContent=unsupported?'—':u?nfmt(sumX(3)):'Ver por UF';
 E('networkPercent').textContent=unsupported?'—':(total?(100*sumX(2)/total).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':'—');
 const rank=list.map(x=>[x[0],x[2]]).sort((a,b)=>b[1]-a[1]).slice(0,5),peak=Math.max(1,...rank.map(x=>x[1]));
 E('networkRank').innerHTML=unsupported?'<div class="insight-note">Disponível para filtros de região e UF.</div>':rank.map(([sig,n])=>'<div class="network-line"><b>'+sig+'</b><div class="meter"><span style="width:'+(100*n/peak)+'%"></span></div><b>'+nfmt(n)+'</b></div>').join('');
 function line(title,n,percent){return '<div class="insight-line"><span>'+title+'</span><span class="meter"><span style="width:'+(unsupported?0:percent)+'%"></span></span><strong>'+show(n)+'</strong></div>'}
 E('infraRows').innerHTML=[['Biblioteca',10],['Laboratório de informática',9],['Quadra',11],['Sala dos professores',12]].map(([title,i])=>line(title,sumX(i),total?100*sumX(i)/total:0)).join('');
 E('maturityRows').innerHTML=['Sem internet','Conectividade básica','Conectada','Tecnologia pedagógica'].map((name,i)=>{const v=list.reduce((s,x)=>s+x[4][i],0);return line(name,v,total?100*v/total:0)}).join('');
}
const prevCurrentData=currentData;currentData=function(){prevCurrentData();updateInstitutionalPanels()};
const prevRefresh=refresh;refresh=function(){prevRefresh();updateInstitutionalPanels()};
updateInstitutionalPanels();
