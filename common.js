var ph=document.getElementById('ph'),tk=localStorage.getItem('nf_t'),hist=[],msg='';
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function money(n){return Number(n).toLocaleString('fr-FR')+' FCFA'}
function dt(s){return new Date(s).toLocaleDateString('fr-FR')}
function v(id){return document.getElementById(id).value}
async function api(p,b){var r=await fetch('/api/'+p,{method:b?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tk},body:b?JSON.stringify(b):undefined});var j=await r.json().catch(function(){return{}});if(!r.ok)throw new Error(j.error||'Erreur');return j}
function toast(t){msg=t;draw();setTimeout(function(){msg='';draw()},2200)}
function top(t){return '<div class="top"><button onclick="back()" aria-label="Retour">←</button>'+t+'</div>'}
function nav(items,cur){return '<div class="nav">'+items.map(function(i){return '<button class="'+(cur==i[0]?'on':'')+'" onclick="hist=[];go(\''+i[0]+'\',1)"><i>'+i[1]+'</i>'+i[2]+'</button>'}).join('')+'</div>'}
function rows(a,f){return a.map(f).join('')}
var brand='<div class="logo"><img src="/assets/nafa-logo.png" alt="Nafa Finance"></div><h1>Nafa<b>Finance</b></h1><div class="tag">Ensemble, faisons grandir nos projets.</div>';
function back(){screen=hist.pop()||'home';draw()}
function logout(){localStorage.removeItem('nf_t');tk=null;hist=[];screen=START;draw()}
async function go(s,nb){if(!nb)hist.push(screen);try{await load(s)}catch(e){if(e.message=='auth'){logout();return}toast(e.message);return}screen=s;draw()}
function draw(){ph.innerHTML=V[screen]()+(msg?'<div class="toast">'+esc(msg)+'</div>':'')}
