
const fmt=n=>new Intl.NumberFormat('pt-BR').format(n||0), el=id=>document.getElementById(id);
let schools=[],filtered=[],page=0; const perPage=25, regions=['Norte','Nordeste','Centro-Oeste','Sudeste','Sul'];
regions.forEach(v=>el('reg').add(new Option(v,v)));[...new Set(STATES.map(a=>a[1]))].sort().forEach(v=>el('uf').add(new Option(v,v)));
function csvParse(text){text=text.replace(/^\uFEFF/,'');let rows=[],row=[],val='',quotes=false;
for(let i=0;i<text.length;i++){let c=text[i];if(c==='"'){if(quotes&&text[i+1]==='"'){val+='"';i++}else quotes=!quotes}else if(c===','&&!quotes){row.push(val);val=''}else if((c==='\n'||c==='\r')&&!quotes){if(c==='\r'&&text[i+1]==='\n')i++;row.push(val);if(row.length>1)rows.push(row);row=[];val=''}else val+=c;}
if(row.length||val){row.push(val);rows.push(row)}const header=rows.shift().map(x=>x.trim());
let required=['inep','escola','regiao','uf','municipio','fund','medio','ambos','matriculas'];if(!required.every(x=>header.includes(x)))throw Error('As colunas do CSV não correspondem à base consolidada.');
return rows.map(r=>Object.fromEntries(required.map(k=>[k,r[header.indexOf(k)]]))).filter(r=>r.inep);}
function dbOpen(){return new Promise((res,rej)=>{let req=indexedDB.open('exitus-intelligence',1);req.onupgradeneeded=()=>req.result.createObjectStore('data');req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error)})}
async function dbStore(value){const db=await dbOpen();return new Promise((res,rej)=>{let tx=db.transaction('data','readwrite');tx.objectStore('data').put(value,'schools');tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}
async function dbLoad(){const db=await dbOpen();return new Promise((res,rej)=>{let tx=db.transaction('data','readonly'),r=tx.objectStore('data').get('schools');r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}
async function upload(event){const file=event.target.files[0];if(!file)return;el('loadstatus').textContent='Carregando e conferindo a base...';try{schools=csvParse(await file.text());await dbStore(schools);el('loadstatus').textContent=fmt(schools.length)+' escolas carregadas. Base salva no navegador.';updateCities();render()}catch(err){el('loadstatus').textContent='Erro: '+err.message}}
el('csvupload').addEventListener('change',upload);
function updateCities(){let reg=el('reg').value,uf=el('uf').value;let c=[...new Set(schools.filter(x=>(!reg||x.regiao===reg)&&(!uf||x.uf===uf)).map(x=>x.municipio))].sort((a,b)=>a.localeCompare(b,'pt-BR'));let previous=el('city').value;el('city').innerHTML='<option value="">Todos os municípios</option>';c.forEach(v=>el('city').add(new Option(v,v)));el('city').value=c.includes(previous)?previous:''}
function isSize(x){let n=+x.matriculas;return el('size').value==='500'?n>=500:el('size').value==='under'?n<500&&n>=0:true}
function isStage(x){let t=el('stage').value;return !t||(t==='fund'&&x.fund==='1')||(t==='med'&&x.medio==='1')||(t==='both'&&x.ambos==='1')}
function selected(x){return (!el('reg').value||x.regiao===el('reg').value)&&(!el('uf').value||x.uf===el('uf').value)&&(!el('city').value||x.municipio===el('city').value)&&isStage(x)&&isSize(x)}
function stageName(x){return x.ambos==='1'?'Fundamental + Médio':x.fund==='1'?'Só Fundamental':'Só Médio'}
function render(){
filtered=schools.filter(selected);let total=filtered.length,f=filtered.filter(x=>x.fund==='1').length,m=filtered.filter(x=>x.medio==='1').length,a=filtered.filter(x=>x.ambos==='1').length,big=filtered.filter(x=>+x.matriculas>=500).length;
[['kt',total],['kf',f],['km',m],['ka',a],['k5',big]].forEach(([id,v])=>el(id).textContent=fmt(v));
let rg=regions.map(r=>[r,filtered.filter(x=>x.regiao===r).length]).sort((a,b)=>b[1]-a[1]),max=Math.max(1,...rg.map(x=>x[1]));
el('bars').innerHTML=rg.map(x=>'<div class="barrow"><strong>'+x[0]+'</strong><div class="track"><div class="fill" style="width:'+(x[1]/max*100)+'%"></div></div><b>'+fmt(x[1])+'</b></div>').join('');
let af=total?100*f/total:0,am=total?100*(f+m)/total:0;el('donut').style.background='conic-gradient(#123c88 0 '+af+'%,#66aeff '+af+'% '+am+'%,#f5a201 '+am+'% 100%)';
el('dn').textContent=fmt(total);el('lf').textContent=fmt(f);el('lm').textContent=fmt(m);el('la').textContent=fmt(a);
let byUF={};for(let x of filtered){let k=x.uf;if(!byUF[k])byUF[k]={reg:x.regiao,uf:k,all:0,big:0,f:0,m:0,a:0,mat:0};let z=byUF[k];z.all++;z.big+=+x.matriculas>=500;z.f+=x.fund==='1';z.m+=x.medio==='1';z.a+=x.ambos==='1';z.mat+=Math.max(0,+x.matriculas)}
let d=Object.values(byUF).sort((a,b)=>b.big-a.big);el('tbody').innerHTML=d.map(x=>'<tr><td>'+x.reg+'</td><td><strong>'+x.uf+'</strong></td><td>'+fmt(x.all)+'</td><td>'+fmt(x.big)+'</td><td>'+fmt(x.f)+'</td><td>'+fmt(x.m)+'</td><td>'+fmt(x.a)+'</td><td>'+fmt(x.mat)+'</td></tr>').join('')||'<tr><td colspan="8">Nenhuma escola no recorte.</td></tr>';
el('summary').textContent=fmt(total)+' escolas privadas no recorte escolhido, em '+d.length+' unidades federativas. Total calculado pela mesma base da lista nominal.';
showPage();}
function showPage(){let q=el('searchbox').value.trim().toLocaleLowerCase('pt-BR');let matches=q?filtered.filter(x=>x.escola.toLocaleLowerCase('pt-BR').includes(q)||x.inep.includes(q)):filtered;el('listcount').textContent=fmt(matches.length)+' escolas encontradas';let pages=Math.max(1,Math.ceil(matches.length/perPage));page=Math.max(0,Math.min(page,pages-1));let slice=matches.slice(page*perPage,(page+1)*perPage);el('schoolbody').innerHTML=slice.map(x=>'<tr><td><strong>'+x.inep+'</strong></td><td>'+escapeHTML(x.escola)+'</td><td>'+x.uf+'</td><td>'+escapeHTML(x.municipio)+'</td><td>'+stageName(x)+'</td><td>'+fmt(+x.matriculas)+'</td></tr>').join('')||'<tr><td colspan="6">Nenhuma escola encontrada.</td></tr>';el('pagelabel').textContent='Página '+(page+1)+' de '+pages;el('prev').disabled=page===0;el('next').disabled=page>=pages-1}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
['reg','uf','city','stage','size'].forEach(id=>el(id).onchange=()=>{if(id==='reg'){el('uf').value='';updateCities()}if(id==='uf')updateCities();page=0;render()});
el('searchbox').oninput=()=>{page=0;showPage()};
el('prev').onclick=()=>{page--;showPage()};el('next').onclick=()=>{page++;showPage()};
el('clear').onclick=()=>{['reg','uf','city','stage','size'].forEach(id=>el(id).value='');updateCities();page=0;render()};
function exportCSV(rows,name){let csv='\uFEFF'+rows.map(x=>x.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\n');let a=document.createElement('a'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
el('csvschools').onclick=()=>exportCSV([['INEP','Escola','Região','UF','Município','Etapa','Matrículas'],...filtered.map(x=>[x.inep,x.escola,x.regiao,x.uf,x.municipio,stageName(x),x.matriculas])],'exitus-escolas-filtradas.csv');
el('export').onclick=()=>{let rows=[['Região','UF','Escolas','500+','Só Fundamental','Só Médio','Ambas','Matrículas']];for(let x of el('tbody').rows){if(x.cells.length===8)rows.push([...x.cells].map(c=>c.innerText))}exportCSV(rows,'exitus-resumo-estados.csv')};
dbLoad().then(data=>{schools=data;el('loadstatus').textContent=schools.length?fmt(schools.length)+' escolas carregadas automaticamente do armazenamento local.':'Baixe a base consolidada e importe o CSV uma única vez.';updateCities();render()}).catch(()=>{el('loadstatus').textContent='Importe o CSV consolidado para iniciar.';render()});
