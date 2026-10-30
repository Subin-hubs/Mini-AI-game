(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const pad=n=>String(n).padStart(2,'0'),ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const today=()=>ymd(new Date()),yest=()=>{const d=new Date();d.setDate(d.getDate()-1);return ymd(d)};
const fmt=n=>Math.round(n).toLocaleString();
/* ---------- catalogs ---------- */
const TT={aurora:[190,65,52,24],ember:[8,78,54,16],orchid:[285,50,56,22],jade:[150,48,44,18],slate:[215,14,48,0]};
const CAT={
 tile:{aurora:['Aurora',0],slate:['Slate',120],ember:['Ember',150],orchid:['Orchid',250],jade:['Jade',400]},
 bg:{night:['Midnight',0,'radial-gradient(900px 500px at 50% -10%,#1d2a52,#0c1020 60%)'],dusk:['Dusk',120,'radial-gradient(900px 500px at 80% -10%,#4a2150,#150d20 60%)'],forest:['Forest',200,'radial-gradient(900px 500px at 20% -10%,#17443a,#08141a 60%)'],ink:['Ink',300,'linear-gradient(#15171c,#0b0c0f)']},
 board:{soft:['Soft',0,'rgba(255,255,255,.07)','rgba(255,255,255,.06)',14],glass:['Glass',120,'rgba(255,255,255,.13)','rgba(255,255,255,.08)',22],sharp:['Sharp',200,'#05070d','#11162a',4]},
 fx:{spark:['Sparks',0],ring:['Ripples',100],conf:['Confetti',250],none:['Minimal',0]}};
const CN={tile:'Tiles',bg:'Backgrounds',board:'Boards',fx:'Effects'};
const POOL=[{id:'m5',t:'Merge 5 tiles',k:'merges',g:5},{id:'m30',t:'Merge 30 tiles',k:'merges',g:30},{id:'s500',t:'Reach a score of 500',k:'score',g:500,a:1},{id:'s1500',t:'Reach a score of 1,500',k:'score',g:1500,a:1},{id:'t128',t:'Create a 128 tile',k:'tile',g:128,a:1},{id:'t256',t:'Create a 256 tile',k:'tile',g:256,a:1},{id:'g1',t:'Complete a game',k:'games',g:1},{id:'mv10',t:'Make 10 valid moves',k:'moves',g:10},{id:'mv60',t:'Make 60 valid moves',k:'moves',g:60}];
const ACH=[['first','First Merge','Merge two tiles',s=>s.st.merges>=1],['t128','Getting Warm','Reach 128',s=>s.st.hiTile>=128],['t512','Halfway Hero','Reach 512',s=>s.st.hiTile>=512],['t1024','Four Digits','Reach 1024',s=>s.st.hiTile>=1024],['t2048','The Big One','Reach 2048',s=>s.st.hiTile>=2048],['s5k','High Roller','Score 5,000 in one game',s=>s.st.hiScore>=5000],['d5','Regular','Complete five daily challenges',s=>s.st.dailyDone>=5],['st7','Week Streak','Reach a seven-day daily streak',s=>s.daily.max>=7],['g10','Dedicated','Play 10 games',s=>s.st.games>=10],['ta300','Speed Merger','Score 300 in Time Attack',s=>s.st.bestT>=300]];
/* ---------- persistent state ---------- */
const KEY='mergelab.v1';
const DEF=()=>({coins:0,earned:0,own:{tile:['aurora'],bg:['night'],board:['soft'],fx:['spark']},sel:{tile:'aurora',bg:'night',board:'soft',fx:'spark'},ach:{},st:{games:0,merges:0,hiScore:0,hiTile:0,bestC:0,bestT:0,dailyDone:0},daily:{res:{},streak:0,max:0,last:''},ms:{date:'',list:[]},set:{sound:true,haptic:true,anim:2},games:{}});
function mix(d,o){if(Array.isArray(d))return Array.isArray(o)?o:d;
 if(d&&typeof d==='object'){if(!o||typeof o!=='object'||Array.isArray(o))return d;if(!Object.keys(d).length)return{...o};const r={};for(const k in d)r[k]=mix(d[k],o[k]);return r}
 if(typeof d==='number')return typeof o==='number'&&isFinite(o)?o:d;return typeof o===typeof d?o:d}
let S;try{S=mix(DEF(),JSON.parse(localStorage.getItem(KEY)))}catch(e){S=DEF()}
(function validate(){for(const c in CAT){S.own[c]=[...new Set(S.own[c].filter(i=>CAT[c][i]).concat(Object.keys(CAT[c]).filter(i=>CAT[c][i][1]===0&&c!=='tile'||i==='aurora')))];if(!CAT[c][S.sel[c]]||!S.own[c].includes(S.sel[c]))S.sel[c]=S.own[c][0]}
 S.set.anim=Math.min(2,Math.max(0,Math.round(S.set.anim)));
 for(const m of['classic','daily','ta'])S.games[m]=okG(S.games[m],m);
 const g=S.daily.res;for(const k in g)if(!g[k]||typeof g[k].s!=='number')delete g[k]})();
function okG(g,m){if(!g||typeof g!=='object'||!Array.isArray(g.tiles)||!g.tiles.length||!g.rs||typeof g.rs.s!=='number'||g.over||g.mode!==m)return null;
 const seen=new Set();for(const t of g.tiles){if(!t||!Number.isInteger(t.r)||!Number.isInteger(t.c)||t.r<0||t.r>3||t.c<0||t.c>3||!(t.v>=2&&t.v<=131072&&(t.v&(t.v-1))===0))return null;const k=t.r*4+t.c;if(seen.has(k))return null;seen.add(k);t.id=t.id|0}
 for(const k of['score','moves','merges','undos','time'])if(typeof g[k]!=='number'||!isFinite(g[k]))g[k]=k==='undos'?3:k==='time'?60:0;
 g.nid=Math.max(1,...g.tiles.map(t=>t.id+1));g.ms=Array.isArray(g.ms)?g.ms:[];g.prev=typeof g.prev==='string'?g.prev:null;g.run=false;
 if(m==='daily'&&g.date!==today())return null;return g}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
function ensureMissions(){const l=S.ms.list;if(S.ms.date!==today()||l.length!==3||l.some(x=>!POOL.find(p=>p.id===x.id))){
 S.ms={date:today(),list:[...POOL].sort(()=>Math.random()-.5).slice(0,3).map(p=>({id:p.id,p:0,done:0}))}}}
/* ---------- helpers: toast, sound, haptics, coins ---------- */
let tt;const toast=m=>{const e=$('#toast');e.textContent=m;e.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('on'),2200)};
let ac;const snd=(f,d=.09,t='sine',v=.05)=>{if(!S.set.sound)return;try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain(),n=ac.currentTime;o.type=t;o.frequency.value=f;g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(g);g.connect(ac.destination);o.start();o.stop(n+d)}catch(e){}};
const vib=ms=>{if(S.set.haptic&&navigator.vibrate)try{navigator.vibrate(ms)}catch(e){}};
const coin=(n,why)=>{S.coins+=n;S.earned+=n;$('#coins').textContent=fmt(S.coins);if(why)toast('+'+n+' coins · '+why)};
function prog(k,v,abs){for(const m of S.ms.list){const p=POOL.find(x=>x.id===m.id);if(p.k!==k||m.done)continue;m.p=abs?Math.max(m.p,v):m.p+v;if(m.p>=p.g){m.done=1;m.p=p.g;coin(20,'Mission: '+p.t)}}}
function chkAch(){for(const[id,n,,f]of ACH)if(!S.ach[id]&&f(S)){S.ach[id]=today();coin(30,'Achievement: '+n);snd(880,.25,'triangle')}}
/* ---------- theming + fx ---------- */
function theme(){const r=document.documentElement.style,b=CAT.board[S.sel.board];document.body.style.setProperty('--bgi',CAT.bg[S.sel.bg][2]);r.setProperty('--board',b[2]);r.setProperty('--cell',b[3]);r.setProperty('--rad',b[4]+'px');
 const rm=matchMedia('(prefers-reduced-motion:reduce)').matches;r.setProperty('--dur',rm||S.set.anim===0?'0ms':S.set.anim===1?'90ms':'130ms')}
const dur=()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur'))||0;
const hue=v=>{const[h,,,d]=TT[S.sel.tile];return(h+(Math.log2(v)-1)*d)%360};
const tcol=v=>{const[,s,l]=TT[S.sel.tile],h=hue(v);return`linear-gradient(145deg,hsl(${h} ${s}% ${l+9}%),hsl(${h+12} ${s}% ${l-7}%))`};
const cv=$('#fx'),cx=cv.getContext('2d');let P=[],raf=0,dpr=1;
const rsz=()=>{dpr=window.devicePixelRatio||1;cv.width=innerWidth*dpr;cv.height=innerHeight*dpr};addEventListener('resize',rsz);rsz();
function burst(x,y,h,kind,n=10){if(S.set.anim===0||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
 if(kind==='ring')P.push({x,y,k:'ring',l:0,m:22,h});
 else for(let i=0;i<n;i++){const a=Math.random()*6.28,s=1.5+Math.random()*(kind==='conf'?5:3.5);P.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-(kind==='conf'?3:0),l:0,m:kind==='conf'?70:26,h:kind==='conf'?Math.random()*360:h,k:kind})}
 if(!raf)raf=requestAnimationFrame(loop)}
function loop(){cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,innerWidth,innerHeight);
 P=P.filter(p=>p.l++<p.m);for(const p of P){const a=1-p.l/p.m;cx.globalAlpha=a;
  if(p.k==='ring'){cx.strokeStyle=`hsl(${p.h} 80% 70%)`;cx.lineWidth=3;cx.beginPath();cx.arc(p.x,p.y,10+p.l*3,0,6.28);cx.stroke()}
  else{p.x+=p.vx;p.y+=p.vy;p.vy+=p.k==='conf'?.13:.05;cx.fillStyle=`hsl(${p.h} 85% 62%)`;p.k==='conf'?cx.fillRect(p.x,p.y,6,9):(cx.beginPath(),cx.arc(p.x,p.y,3*a+1,0,6.28),cx.fill())}}
 cx.globalAlpha=1;raf=P.length?requestAnimationFrame(loop):0}
/* ---------- navigation ---------- */
let cur='home',G=null,mode='classic',els={},last=0,shopTab='tile';
const TITLES={home:'Merge Lab',game:'',daily:'Daily Challenge',ta:'Time Attack',stats:'Statistics',ach:'Achievements',shop:'Theme Shop',set:'Settings'};
function show(id){if(cur==='game'&&id!=='game')pause(true);cur=id;$$('.scr').forEach(s=>s.hidden=s.id!==id);
 $('#back').hidden=id==='home';$('#ttl').textContent=id==='game'?({classic:'Classic',daily:'Daily Challenge',ta:'Time Attack'})[mode]:TITLES[id];
 document.body.classList.toggle('playing',id==='game');({home:rHome,daily:rDaily,ta:rTA,stats:rStats,ach:rAch,shop:rShop,set:rSet})[id]?.();$('#coins').textContent=fmt(S.coins);scrollTo(0,0)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-go],[data-scr],[data-act]');if(!b)return;
 if(b.dataset.scr)return show(b.dataset.scr);if(b.dataset.go)return b.dataset.go==='classic'?start('classic'):show(b.dataset.go);act(b.dataset.act,b.dataset)});
$('#back').onclick=()=>show('home');
/* ---------- game flow ---------- */
function newG(m){const seed=m==='daily'?MG.hash('mergelab-'+today()):(Math.random()*4294967296)>>>0,g=MG.create(seed,m);g.date=today();return g}
function start(m,fresh){mode=m;ensureMissions();G=(!fresh&&S.games[m])||newG(m);S.games[m]=G;save();show('game');build();
 $('#undo').hidden=m!=='classic';$('#l3').textContent=m==='ta'?'Time':'Top tile';$('#hint').textContent=m==='ta'?'60 seconds. The clock starts on your first move.':'Swipe, or use arrow keys / WASD. Press U to undo.';
 render();hud();$('#ov').hidden=true;if(m==='ta'&&G.moves>0&&G.time<60&&!G.over)pauseOv();$('#board').focus({preventScroll:true})}
function build(){const c=$('#board .cells');if(!c.children.length)c.innerHTML='<i></i>'.repeat(16);$('#tiles').innerHTML='';els={}}
function render(r){const dm=dur(),T=$('#tiles');const pos=t=>`translate(${t.c*100}%,${t.r*100}%)`;
 for(const t of r?r.gone:[]){const e=els[t.id];if(!e)continue;delete els[t.id];e.style.transform=pos(t);e.style.zIndex=1;setTimeout(()=>e.remove(),dm+20)}
 const alive=new Set(G.tiles.map(t=>t.id));for(const id in els)if(!alive.has(+id)){els[id].remove();delete els[id]}
 for(const t of G.tiles){let e=els[t.id],fresh=!e;if(!e){e=els[t.id]=document.createElement('div');e.className='t';e.innerHTML='<div class="i"></div>';e.style.transform=pos(t);T.appendChild(e);if(t.n)e.classList.add('new')}
  e.style.zIndex=2;e.style.transform=pos(t);const i=e.firstChild;i.textContent=t.v;i.className='i d'+String(t.v).length;i.style.background=tcol(t.v);
  if(t.m&&!fresh){e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop')}}}
function hud(){const best=mode==='classic'?S.st.bestC:mode==='ta'?S.st.bestT:(S.daily.res[G.date]||{s:0}).s;
 $('#sc').textContent=fmt(G.score);$('#bs').textContent=fmt(Math.max(best,G.score));$('#v3').textContent=mode==='ta'?G.time.toFixed(1)+'s':MG.maxTile(G);$('#uc').textContent=G.undos}
function doMove(d){if(!G||G.over||cur!=='game'||!$('#ov').hidden)return;if(mode==='ta'&&G.time<=0)return;
 const snap=JSON.stringify({tiles:G.tiles,score:G.score,s:G.rs.s,nid:G.nid,moves:G.moves,merges:G.merges});
 const r=MG.move(G,d);if(!r.moved){const b=$('#board');b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');return}
 if(mode==='ta'&&!G.run){G.run=true;last=performance.now()}
 if(mode==='classic')G.prev=snap;MG.spawn(G);G.moves++;G.merges+=r.merges;G.score+=r.gain;
 S.st.merges+=r.merges;S.st.hiScore=Math.max(S.st.hiScore,G.score);const mt=MG.maxTile(G);S.st.hiTile=Math.max(S.st.hiTile,mt);
 const wasBest=mode==='classic'&&G.score>S.st.bestC;if(r.merges)coin(r.merges);
 prog('moves',1);prog('merges',r.merges);prog('score',G.score,1);prog('tile',mt,1);
 for(const[th,c]of[[500,10],[1000,15],[2500,25],[5000,40],[10000,60]])if(G.score>=th&&!G.ms.includes(th)){G.ms.push(th);coin(c,'Score '+fmt(th))}
 render(r);hud();
 if(r.merges){const big=Math.max(...r.gone.map(t=>t.v))*2;snd(220*Math.pow(2,Math.log2(big)/5),.12,'triangle');vib(big>=128?30:12);
  const m=G.tiles.find(t=>t.m&&t.v===big),e=m&&els[m.id];if(e){const q=e.getBoundingClientRect(),k=S.sel.fx;if(k!=='none')burst(q.left+q.width/2,q.top+q.height/2,hue(big),k==='conf'?'conf':k==='ring'?'ring':'spark',k==='conf'?18:10)}}
 else snd(160,.04,'sine',.025);
 if(wasBest&&!G.beat&&S.st.bestC>0){G.beat=1;toast('New personal best!');vib([20,40,20])}
 if(!G.won&&mt>=2048){G.won=true;burst(innerWidth/2,innerHeight/3,0,'conf',140);toast('2048! Keep going — there is no limit.');snd(660,.5,'triangle');vib([40,60,40])}
 chkAch();if(!MG.canMove(G))end();else save()}
function undo(){if(mode!=='classic'||!G.prev||G.undos<=0||G.over)return;const p=JSON.parse(G.prev);
 G.tiles=p.tiles;G.score=p.score;G.rs.s=p.s;G.nid=p.nid;G.moves=p.moves;G.merges=p.merges;G.undos--;G.prev=null;G.tiles.forEach(t=>{t.n=0;t.m=0});render();hud();save();snd(300,.06)}
function end(){if(G.over)return;G.over=true;G.run=false;pause(false);S.games[mode]=null;const st=S.st;st.games++;prog('games',1);
 let best=0,nb=false,extra='';
 if(mode==='classic'){nb=G.score>st.bestC&&G.score>0;st.bestC=Math.max(st.bestC,G.score);best=st.bestC}
 if(mode==='ta'){nb=G.score>st.bestT&&G.score>0;st.bestT=Math.max(st.bestT,G.score);best=st.bestT}
 if(mode==='daily'){const d=S.daily,o=d.res[G.date],first=!o;nb=!!o&&G.score>o.s;d.res[G.date]={s:Math.max(o?o.s:0,G.score),t:Math.max(o?o.t:0,MG.maxTile(G))};best=d.res[G.date].s;
  const ks=Object.keys(d.res).sort();while(ks.length>30)delete d.res[ks.shift()];
  if(first){st.dailyDone++;d.streak=d.last===yest()?d.streak+1:1;d.max=Math.max(d.max,d.streak);d.last=today();coin(25,'Daily complete');extra='Daily streak: '+d.streak+' day'+(d.streak>1?'s':'')}else extra='Best of the day kept.'}
 chkAch();save();hud();snd(180,.4,'sawtooth',.03);vib(40);if(nb){burst(innerWidth/2,innerHeight/3,45,'conf',90);snd(740,.4,'triangle')}
 $('#ov').innerHTML=`<h2>${mode==='ta'?'Time!':'Game over'}</h2><div class="n">${fmt(G.score)}</div><p class="${nb?'new-best':''}">${nb?'New best!':'Best: '+fmt(best)}</p><p>Top tile ${MG.maxTile(G)} · ${G.merges} merges</p>${extra?'<p>'+extra+'</p>':''}<div class="bt"><button class="btn p" data-act="again">${mode==='daily'?'Replay for a better score':'Play again'}</button><button class="btn" data-act="share">Share score card</button><button class="btn" data-act="home">Menu</button></div>`;$('#ov').hidden=false}
function pauseOv(){$('#ov').innerHTML='<h2>Paused</h2><p>Your clock is stopped.</p><div class="bt"><button class="btn p" data-act="resume">Resume</button><button class="btn" data-act="home">Menu</button></div>';$('#ov').hidden=false}
function pause(showOv){if(!G||G.over||mode!=='ta'||!G.run)return;G.run=false;save();if(showOv!==false&&cur==='game')pauseOv()}
function act(a,d){if(a==='again'){S.games[mode]=null;start(mode,true)}
 else if(a==='home')show('home');else if(a==='resume'){$('#ov').hidden=true;G.run=true;last=performance.now()}
 else if(a==='share')share();else if(a==='play'){start(d.m,!!d.fresh)}
 else if(a==='buy'){const[c,i]=d.i.split(':'),p=CAT[c][i][1];if(S.coins>=p){S.coins-=p;S.own[c].push(i);S.sel[c]=i;snd(700,.2,'triangle');save();theme();rShop();$('#coins').textContent=fmt(S.coins)}}
 else if(a==='eq'){const[c,i]=d.i.split(':');S.sel[c]=i;save();theme();rShop()}
 else if(a==='tab'){shopTab=d.t;rShop()}
 else if(a==='tog'){S.set[d.k]=!S.set[d.k];save();rSet()}else if(a==='anim'){S.set.anim=+d.v;save();theme();rSet()}
 else if(a==='reset'){if(confirm('Erase all progress, coins, unlocks and scores on this device? This cannot be undone.')){localStorage.removeItem(KEY);S=DEF();ensureMissions();save();theme();G=null;toast('Data reset');show('home')}}}
$('#rs').onclick=()=>{if(G.over||confirm('Restart this game?'+(mode==='daily'?' You will get the same daily board again.':''))){S.games[mode]=null;start(mode,true)}};
$('#fin').onclick=()=>{if(!G.over&&confirm('Finish this game and record your score?'))end()};
$('#undo').onclick=undo;
/* ---------- input ---------- */
const KM={ArrowUp:0,w:0,W:0,ArrowRight:1,d:1,D:1,ArrowDown:2,s:2,S:2,ArrowLeft:3,a:3,A:3};
addEventListener('keydown',e=>{if(cur!=='game'||e.ctrlKey||e.metaKey||e.altKey)return;if(e.target.closest&&e.target.closest('button')&&e.key==='Enter')return;
 if(e.key in KM){e.preventDefault();doMove(KM[e.key])}else if(e.key==='u'||e.key==='U')undo()});
let tx=0,ty=0,tr=false;const B=$('#board');
B.addEventListener('touchstart',e=>{const t=e.changedTouches[0];tx=t.clientX;ty=t.clientY;tr=true},{passive:true});
B.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
B.addEventListener('touchend',e=>{if(!tr)return;tr=false;const t=e.changedTouches[0],dx=t.clientX-tx,dy=t.clientY-ty;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;doMove(Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0))},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true)});addEventListener('pagehide',()=>{pause(false);save()});
setInterval(()=>{if(cur!=='game'||!G||!G.run||G.over)return;const n=performance.now();G.time=Math.max(0,G.time-(n-last)/1000);last=n;hud();if(G.time<=0){G.time=0;G.run=false;hud();end()}},100);
/* ---------- screens ---------- */
function rHome(){ensureMissions();const d=S.daily.res[today()];
 $('#hc').textContent='Best '+fmt(S.st.bestC)+(S.games.classic?' · game in progress':'');
 $('#hd').innerHTML=(d?'Done ✓ '+fmt(d.s):'New puzzle today')+(S.daily.streak?'<br>'+S.daily.streak+'-day streak':'');
 $('#ht').textContent='Best '+fmt(S.st.bestT);
 $('#ml').innerHTML=S.ms.list.map(m=>{const p=POOL.find(x=>x.id===m.id);return`<div class="ms"><div><span>${m.done?'✓ ':''}${p.t}</span><span>${m.done?'+20':fmt(m.p)+'/'+fmt(p.g)}</span></div><div class="pb"><i style="width:${Math.min(100,m.p/p.g*100)}%"></i></div></div>`}).join('')+'<p class="sub" style="margin:8px 0 0;font-size:13px">New missions every day. 20 coins each.</p>';save()}
function rDaily(){const t=today(),r=S.daily.res[t],h=Object.keys(S.daily.res).sort().reverse().slice(0,7),sg=S.games.daily;
 $('#daily').innerHTML=`<div class="pg"><h2>${new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</h2><p>Everyone gets the same starting board and tile sequence today. Restarting never changes it.</p>
 <div class="grid2" style="margin:14px 0"><div class="stat"><span>Today</span><b>${r?'✓ '+fmt(r.s):'Not played'}</b></div><div class="stat"><span>Streak</span><b>${S.daily.streak} day${S.daily.streak===1?'':'s'}</b></div></div>
 <button class="btn p" style="width:100%" data-act="play" data-m="daily" ${r&&!sg?'data-fresh="1"':''}>${sg?'Continue today\'s run':r?'Replay (keeps your best)':'Play today\'s puzzle'}</button>
 <div class="card" style="margin-top:14px"><h3>Previous results</h3>${h.length?h.map(k=>`<div class="hist"><span>${k}</span><span>${fmt(S.daily.res[k].s)} · tile ${S.daily.res[k].t}</span></div>`).join(''):'<p style="margin:0">No results yet. Finish a daily to start a streak.</p>'}</div></div>`}
function rTA(){const sg=S.games.ta;$('#ta').innerHTML=`<div class="pg"><h2>Time Attack</h2><p>You have 60 seconds. Every merge scores its new tile value. The clock starts on your first move.</p><div class="stat" style="margin:14px 0"><span>Best score</span><b>${fmt(S.st.bestT)}</b></div>
 <button class="btn p" style="width:100%" data-act="play" data-m="ta" data-fresh="1">Start</button>${sg?'<button class="btn" style="width:100%;margin-top:8px" data-act="play" data-m="ta">Resume paused run</button>':''}</div>`}
function rStats(){const s=S.st,v=[['Games played',s.games],['Total merges',s.merges],['Highest score',s.hiScore],['Highest tile',s.hiTile],['Best Classic',s.bestC],['Best Time Attack',s.bestT],['Daily streak',S.daily.streak],['Total coins earned',S.earned]];
 $('#stats').innerHTML='<div class="grid2">'+v.map(([l,n])=>`<div class="stat"><span>${l}</span><b>${fmt(n)}</b></div>`).join('')+'</div>'}
function rAch(){$('#ach').innerHTML=`<p class="sub" style="text-align:left">${Object.keys(S.ach).length} of ${ACH.length} unlocked. Each pays 30 coins.</p>`+ACH.map(([id,n,d])=>`<div class="ach ${S.ach[id]?'on':'lock'}"><div class="ck">${S.ach[id]?'✓':'·'}</div><div><b>${n}</b><small>${d}</small></div></div>`).join('')}
function rShop(){const c=shopTab;$('#shop').innerHTML=`<div class="tabs" role="tablist">${Object.keys(CN).map(k=>`<button role="tab" class="${k===c?'on':''}" data-act="tab" data-t="${k}">${CN[k]}</button>`).join('')}</div><div class="grid2">`+Object.keys(CAT[c]).map(i=>{const it=CAT[c][i],own=S.own[c].includes(i),on=S.sel[c]===i;let sw='';
  if(c==='tile'){const[h,s,l,d]=TT[i];sw=[2,8,32,128].map((v,k)=>{const hh=(h+(Math.log2(v)-1)*d)%360;return`<i style="background:linear-gradient(145deg,hsl(${hh} ${s}% ${l+9}%),hsl(${hh+12} ${s}% ${l-7}%))"></i>`}).join('')}
  else if(c==='bg')sw=`<i style="background:${it[2]}"></i>`;else if(c==='board')sw=`<i style="background:${it[2]};border:1px solid var(--ln);border-radius:${it[4]/2}px"></i>`;else sw=it[0]==='Minimal'?'No particles':'On merge';
  return`<div class="item"><div class="sw">${sw}</div><b>${it[0]}</b>${own?`<button class="btn s" data-act="eq" data-i="${c}:${i}" ${on?'disabled':''}>${on?'Equipped':'Equip'}</button>`:`<button class="btn s p" data-act="buy" data-i="${c}:${i}" ${S.coins<it[1]?'disabled':''}>Unlock · ${it[1]} coins</button>`}</div>`}).join('')+'</div><p class="sub" style="margin-top:14px">Everything is earned by playing. Nothing is for sale.</p>'}
function rSet(){const tg=(k,l)=>`<div class="srow"><span>${l}</span><button class="sw2" role="switch" aria-label="${l}" aria-pressed="${S.set[k]}" data-act="tog" data-k="${k}"></button></div>`;
 $('#set').innerHTML=tg('sound','Sound effects')+tg('haptic','Haptic feedback')+`<div class="srow"><span>Animation</span><div class="seg">${['Off','Subtle','Full'].map((n,i)=>`<button class="${S.set.anim===i?'on':''}" data-act="anim" data-v="${i}">${n}</button>`).join('')}</div></div>`+
 Object.keys(CN).map(c=>`<div class="srow"><label for="sel-${c}">${CN[c]}</label><select id="sel-${c}" data-c="${c}">${S.own[c].map(i=>`<option value="${i}" ${S.sel[c]===i?'selected':''}>${CAT[c][i][0]}</option>`).join('')}</select></div>`).join('')+
 '<p class="sub" style="text-align:left;margin-top:12px">Unlock more in the Shop. Sound is generated in your browser; there is no music.</p><button class="btn danger" style="width:100%;margin-top:10px" data-act="reset">Reset all game data</button>';
 $$('#set select').forEach(s=>s.onchange=()=>{S.sel[s.dataset.c]=s.value;save();theme()})}
/* ---------- share card ---------- */
function share(){const c=document.createElement('canvas');c.width=1080;c.height=566;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,1080,566);g.addColorStop(0,'#1d2a52');g.addColorStop(1,'#0c1020');x.fillStyle=g;x.fillRect(0,0,1080,566);
 const f='"Avenir Next","Segoe UI",system-ui,sans-serif';x.fillStyle='#8f98b8';x.font='600 34px '+f;x.fillText('MERGE LAB · '+({classic:'Classic',daily:'Daily '+G.date,ta:'Time Attack'})[mode],60,90);
 x.fillStyle='#fff';x.font='800 190px '+f;x.fillText(fmt(G.score),56,300);x.fillStyle='#8f98b8';x.font='600 36px '+f;x.fillText('points',64,356);
 [2,8,32,128,512].forEach((v,i)=>{x.fillStyle='hsl('+hue(v)+' 65% 55%)';x.beginPath();x.roundRect(60+i*104,420,88,88,16);x.fill()});
 x.fillStyle='#fff';x.font='700 44px '+f;x.textAlign='right';x.fillText('Top tile '+MG.maxTile(G),1020,490);
 const txt='I scored '+fmt(G.score)+' in Merge Lab ('+MG.maxTile(G)+' tile). Can you beat it?';
 c.toBlob(async b=>{const f2=new File([b],'merge-lab-score.png',{type:'image/png'});
  try{if(navigator.canShare&&navigator.canShare({files:[f2]})){await navigator.share({files:[f2],text:txt});return}}catch(e){if(e.name==='AbortError')return}
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='merge-lab-score.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  try{await navigator.clipboard.writeText(txt)}catch(e){}toast('Score card saved. Text copied.')})}
/* ---------- boot ---------- */
theme();ensureMissions();save();show('home');
if(window.matchMedia)matchMedia('(prefers-reduced-motion:reduce)').addEventListener?.('change',theme);
window.MERGELAB={get state(){return S}};
})();
