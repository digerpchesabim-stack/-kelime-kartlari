// Kelime Kartları otomatik test seti — kullanım: python3 src/build.py && node tests/run.js
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..','docs');const PORT=8800+Math.floor(Math.random()*100);
const MT={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0].split('#')[0]);if(u==='/')u='/index.html';const f=path.join(ROOT,u);if(!f.startsWith(ROOT)||!fs.existsSync(f)){r.statusCode=404;return r.end('nf')}r.setHeader('content-type',MT[path.extname(f)]||'text/plain');r.end(fs.readFileSync(f))}).listen(PORT);
const URL0=`http://localhost:${PORT}/`;let pass=0,fail=0;const fails=[];
function ok(name,cond,info){if(cond){pass++;console.log('  ✓',name)}else{fail++;fails.push(name);console.log('  ✗',name,info===undefined?'':JSON.stringify(info))}}
async function mocks(ctx){
 await ctx.route(/translate\.googleapis\.com/,r=>{const q=new URL(r.request().url()).searchParams.get('q')||'';r.fulfill({contentType:'application/json',body:JSON.stringify([[['TR('+q+')',q,null,null,1]],null,'en'])})});
 await ctx.route(/tatoeba\.org/,r=>r.fulfill({contentType:'application/json',body:JSON.stringify({results:[]})}));
 await ctx.route(/wiktionary\.org|wikipedia\.org|mymemory/,r=>r.abort());
 await ctx.route(/dictionaryapi\.dev/,r=>r.fulfill({contentType:'application/json',body:'[{"phonetic":"/x/","meanings":[{"partOfSpeech":"noun","definitions":[{"definition":"d","example":"This is a good example sentence here."}]}]}]'}));
 await ctx.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/qrcodejs/,r=>{const f=path.join(__dirname,'qrcode.min.js');fs.existsSync(f)?r.fulfill({contentType:'text/javascript',body:fs.readFileSync(f)}):r.abort()});
}
async function fresh(b,name='T',opts={}){const ctx=await b.newContext(Object.assign({viewport:{width:390,height:844}},opts));await mocks(ctx);const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
 await p.goto(URL0);await p.waitForTimeout(150);if(name){await p.fill('#pn',name);await p.click('[data-act=saveprof]');await p.waitForTimeout(150)}return {ctx,p}}
const T={};
// ---------- A: motor ----------
T.motor=async b=>{const {ctx,p}=await fresh(b);const E=(f,a)=>p.evaluate(f,a);
 const r1=await E(()=>{const id=WORDS.find(w=>hasData(w)&&P(w.id).status==='unseen'&&!setIds().includes(w.id)).id;getList('main').ids.push(id);save();grade(id,true,false);const a=P(id).status;grade(id,true,false);grade(id,true,false);return{id,a,b:P(id).status,due:Math.round((P(id).due-Date.now())/864e5)}});
 ok('1 liste kelimesi ilk cevapta çalışılıyor olur',r1.a==='active',r1);ok('1 liste kelimesi 3 doğruda öğrenilir',r1.b==='learned',r1);
 ok('1 liste kelimesi set sayısını şişirmez',await E(()=>setIds().length===S.settings.activeSize));
 const r3=await E(()=>{const id=learnedIds()[0];const L0=learnedIds().length;PW(id).due=Date.now()-1;startSession('review');const inq=session.queue.includes(id);grade(id,false,false);return{inq,st:P(id).status,L:learnedIds().length,L0}});
 ok('3 tekrarda bilinemeyen kelime çalışma setine döner',r3.inq&&r3.st==='active'&&r3.L===r3.L0-1,r3);
 const r4=await E(()=>{const ids=WORDS.filter(w=>hasData(w)&&P(w.id).status==='unseen').slice(0,8).map(w=>w.id);const L={id:'x1',name:'x',ids};lists().push(L);
  const d=ids[0];grade(d,true,false);PW(d).due=Date.now()-1;let hit=0;for(let i=0;i<10;i++){startSession('flash');if(session.queue.includes(d))hit++}return hit});
 ok('4 tekrarı gelmiş liste kelimesi her oturumda öncelikli',r4===10,r4);
 const r5=await E(()=>{const real=Date.now;const t=new Date(2026,9,31,0,30).getTime();const D=Date;return today()});
 ok('5 tarih yerel saate göre',r5===await E(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}));
 const r6=await E(()=>{S.cw={zz:{id:'zz',word:'zz',tr:'x',en:'The zz is here now.',entr:'',custom:1}};save();reloadCustom();const a=!!byId.zz;S=StorageService.reset();reloadCustom();return{a,b:!!byId.zz}});
 ok('6 sıfırlamada özel kelimeler kalkar',r6.a&&!r6.b,r6);
 const r8=await E(()=>{const w=WORDS.find(x=>x.word==='forgot(ten)');return accepts(w).map(x=>x.length).join(' ya da ')});ok('8 parantezli kelimede harf ipucu',r8==='6 ya da 9',r8);
 const r8b=await E(()=>{const L={id:'emp',name:'e',ids:[]};lists().push(L);curList='emp';go('lst');return [...document.querySelectorAll('[data-act=startl]')].every(x=>x.disabled)});ok('8 boş listede düğmeler pasif',r8b);
 const r8c=await E(()=>{let bad=0;for(let i=0;i<40;i++){const w=WORDS.filter(hasData)[i*13];session={m:'fill',queue:[w.id],idx:0,res:{ok:0,bad:0},total:1};go('study');const o=session.opts.map(x=>shortTr(byId[x.id]));if(new Set(o).size!==o.length)bad++}session=null;go('home');return bad});ok('8 boşluk doldurda aynı anlamlı şık yok',r8c===0,r8c);
 // migration
 const r2=await E(()=>{const id=WORDS.filter(hasData)[500].id;S.progress[id]={status:'unseen',mastery:0,seen:4,ok:4,bad:1,step:3};S.mig=0;ensureActive();return P(id)});
 ok('2 eski veri geçişi takılı kelimeyi düzeltir',r2.status==='learned'||(r2.status==='active'&&r2.mastery===3),r2);
 ok('A hata yok',p.errs.length===0,p.errs);await ctx.close()};
T.offline=async b=>{const {ctx,p}=await fresh(b);await p.waitForTimeout(1200);await p.reload();await p.waitForTimeout(500);
 const ctl=await p.evaluate(()=>!!navigator.serviceWorker.controller);ok('7 servis çalışanı devrede',ctl);
 const ext=await p.evaluate(async()=>{const ks=await caches.keys();let n=0,ext=0;for(const k of ks){const c=await caches.open(k);for(const r of await c.keys()){n++;if(!r.url.startsWith(location.origin))ext++}}return{n,ext,ks}});
 ok('7 dış istekler önbelleğe yazılmıyor',ext.ext===0,ext);
 await ctx.setOffline(true);await p.reload();await p.waitForTimeout(400);ok('7 çevrimdışı açılış',await p.evaluate(()=>WORDS.length===1288||WORDS.length>1288));await ctx.setOffline(false);await ctx.close()};
// ---------- B: hızlı kazançlar ----------
T.quick=async b=>{const {ctx,p}=await fresh(b);const E=(f,a)=>p.evaluate(f,a),W=ms=>p.waitForTimeout(ms);
 const m=await E(()=>{const id=setIds()[0];grade(id,false,false);const a=mistIds().includes(id);grade(id,false,false);const b2=mistIds().includes(id);grade(id,true,false);grade(id,true,false);const c=mistIds().includes(id);grade(id,true,false);return{a,b2,c,d:mistIds().includes(id)}});
 ok('9 iki yanlışta Hatalarım\'a girer',!m.a&&m.b2,m);ok('9 üç doğruda Hatalarım\'dan çıkar',m.c&&!m.d,m);
 await E(()=>{const id=setIds()[1];grade(id,false,false);grade(id,false,false);go('hard')});await W(80);
 ok('9 Hatalarım listesi Listelerim\'de',await E(()=>!!document.querySelector('[data-act=openl][data-l=mist]')));
 await p.click('[data-act=openl][data-l=mist]');await W(80);
 ok('9 Hatalarım adı değiştirilemez, silinemez',await E(()=>!document.querySelector('#rnm')&&!document.querySelector('[data-act=dellist]')&&!document.querySelector('[data-act=unlist]')));
 ok('9 Hatalarım listesi çalışılabilir',await E(()=>{startSession('flash','mist');return session&&session.queue.length>0}));
 await E(()=>{session=null;go('smenu')});await W(80);await p.click('[data-act=setdir][data-d=tr]');await W(50);await p.click('[data-act=start][data-m=flash]');await W(80);
 const front=await E(()=>({txt:document.querySelector('.fc').innerText,tr:byId[session.queue[0]].tr}));ok('10 ters yönde önde Türkçe',front.txt.includes(front.tr),front);
 await p.click('[data-act=flip]');await W(50);ok('10 ters yönde arkada İngilizce kelime',await E(()=>document.querySelector('.fc').innerText.includes(byId[session.queue[0]].word)));
 await E(()=>{S.settings.dir='en';session=null;startSession('type')});await W(80);
 const wd=await E(()=>accepts(byId[session.queue[0]])[0]);
 if(wd.length>=4){await p.fill('#ti',wd.slice(0,-1)+(wd.slice(-1)==='z'?'q':'z'));await p.click('[data-act=tsubmit]');await W(60);
  ok('11 tek harf hatası "neredeyse doğru"',await E(()=>session.lastOk&&session.near&&document.body.innerText.includes('Neredeyse')))}
 await p.click('[data-act=next]');await W(60);
 const w2=await E(()=>accepts(byId[session.queue[0]])[0]);await p.click('[data-act=thint]');await p.click('[data-act=thint]');await W(40);
 ok('11 harf al girdiye harf yazar',await E(()=>document.querySelector('#ti').value)===w2.slice(0,2));
 await p.fill('#ti',w2);await p.click('[data-act=tsubmit]');await W(50);const L=w2.length;
 ok('11 ipucuyla doğru: yarıdan az ipucu doğru sayılır',await E(()=>session.lastOk)===(2<Math.ceil(L/2)),{L});
 await E(()=>{session=null;showUpd()});ok('12 yeni sürüm bildirimi',await E(()=>!!document.querySelector('#upd button')));
 await E(()=>{document.getElementById('upd').remove();go('settings')});await W(60);await p.selectOption('#fsz','1.3');await W(80);
 ok('13 yazı boyutu uygulanır',await E(()=>document.querySelector('#app').style.zoom==='1.3'));
 await E(()=>go('home'));await W(80);ok('13 büyük yazıda yatay taşma yok',await E(()=>document.documentElement.scrollWidth<=window.innerWidth+1),await E(()=>[document.documentElement.scrollWidth,window.innerWidth]));
 await p.screenshot({path:path.join(__dirname,'..','..','shot_b_home13.png')});
 await E(()=>{S.settings.fs=1;applyFs()});
 ok('B hata yok',p.errs.length===0,p.errs);await ctx.close()};
// ---------- C: seviye eleme ----------
T.sort=async b=>{const {ctx,p}=await fresh(b);const E=(f,a)=>p.evaluate(f,a),W=ms=>p.waitForTimeout(ms);
 ok('15 yeni profilde eleme önerisi',await E(()=>!!document.querySelector('[data-act=sortgo]')&&!!document.querySelector('[data-act=sortoff]')));
 await p.click('.card [data-act=sortgo]');await W(100);ok('14 eleme ekranı açılır',await E(()=>view==='sort'&&!!document.querySelector('#sortcard')));
 const id0=await E(()=>sortSt.q[0]);await p.click('[data-act=sortk]');await W(60);
 const k=await E(id=>({st:P(id).status,days:Math.round((P(id).due-Date.now())/864e5)}),id0);ok('14 biliyorum → öğrenildi',k.st==='learned',k);ok('16 biliyorum → ~2 hafta sonra kontrol',k.days>=14&&k.days<=15,k);
 await p.click('[data-act=sortundo]');await W(60);ok('14 geri al çalışır',await E(id=>P(id).status==='unseen'&&sortSt.i===0,id0));
 const box=await p.$eval('#sortcard',e=>{const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}});
 await p.mouse.move(box.x,box.y);await p.mouse.down();await p.mouse.move(box.x-60,box.y,{steps:4});await p.mouse.move(box.x-140,box.y,{steps:4});await p.mouse.up();await W(80);
 const u=await E(id=>({i:sortSt.i,front:S.order[0]===id,n:sortSt.n}),id0);ok('14 sola kaydırma → bilmiyorum, sıranın başına',u.i===1&&u.front&&u.n.u===1,u);
 await p.click('[data-act=speak]');ok('14 eleme ekranında seslendirme hatasız',p.errs.length===0,p.errs);
 await E(()=>{for(let i=0;i<30;i++){if(sortSt.i>=sortSt.q.length)break;sortAct(i%3===0?'k':i%3===1?'u':'s')}});await W(60);
 ok('14 bitiş özeti',await E(()=>document.body.innerText.includes('Ayıklama bitti')));
 await p.click('[data-act=sortend]');await W(60);ok('15 öneri bir kez gösterilir',await E(()=>!document.querySelector('[data-act=sortoff]')));
 const r=await E(()=>{const id=learnedIds().find(i=>P(i).via==='sort');PW(id).due=Date.now()-1;return dueIds().includes(id)});ok('16 tarihi gelince Tekrar\'a girer',r);
 ok('C hata yok',p.errs.length===0,p.errs);await ctx.close()};
// ---------- D: metin ----------
T.text=async b=>{const {ctx,p}=await fresh(b);const E=(f,a)=>p.evaluate(f,a),W=ms=>p.waitForTimeout(ms);
 await E(()=>{curText=allTexts()[0].id;go('text')});await W(100);await p.click('[data-act=txdone]');await W(100);
 const q=await E(()=>({v:view,m:session&&session.m,n:session&&session.queue.length,qq:session&&session.qq}));ok('19 Okudum → metin sınavı açılır',q.v==='study'&&q.m==='fill'&&q.n>=2&&q.n<=5,q);
 const inText=await E(()=>{const ids=twAll(getText(curText)).ids;return session.qq.every(id=>ids.includes(id))});ok('19 sınav soruları metnin kelimeleri',inText);
 await E(()=>{while(session.queue.length){grade(session.queue[0],true,false);session.queue.shift()}go('end')});await W(80);
 ok('19 bitişte "Metne dön"',await E(()=>!!document.querySelector('[data-act=backtext]')));await p.click('[data-act=backtext]');await W(80);
 ok('19 okunan metinde sınavı tekrar çöz',await E(()=>!!document.querySelector('[data-act=txquiz]')));
 await E(()=>go('texts'));await W(80);ok('20 kapsama yüzdesi gösterilir',await E(()=>/Bildiğin kırmızı kelime oranı: %\d+/.test(document.body.innerText)));
 await E(()=>{const t=allTexts()[3];twAll(t).ids.slice(0,12).forEach(id=>{if(hasData(byId[id]))learn(id)})});await p.click('[data-act=txsort][data-s=fit]');await W(80);
 const top=await E(()=>{const cards=[...document.querySelectorAll('[data-act=opentx]')].map(e=>e.dataset.id);const unread=cards.filter(id=>!(S.read||{})[id]);return{first:unread[0],best:allTexts().filter(t=>!(S.read||{})[t.id]).sort((a,b)=>txCov(b)-txCov(a))[0].id}});
 ok('20 "En uygun" en yüksek kapsamayı üste alır',top.first===top.best,top);
 await E(()=>go('settings'));await W(80);await p.fill('#ptt','Benim Metnim');await p.fill('#ptx','My brother likes football very much.\n\nEvery Sunday he plays with his friends in the park near our house.');await p.click('[data-act=addplain]');await W(120);
 const pt=await E(()=>{const t=getText(curText);return{v:view,title:t&&t.title,paras:t&&t.paragraphs.length,custom:t&&t.custom}});ok('21 düz metin eklenir ve açılır',pt.v==='text'&&pt.title==='Benim Metnim'&&pt.paras===2,pt);
 // speech mock
 await E(()=>{window.__spoken=[];window.SpeechSynthesisUtterance=function(t){this.text=t};window.speechSynthesis.speak=function(u){window.__spoken.push(u.text);setTimeout(()=>{u.onstart&&u.onstart();setTimeout(()=>{u.onboundary&&u.onboundary({name:'word',charIndex:3});window.__hl={rd:document.querySelectorAll('.tk.rd').length,rw:[...document.querySelectorAll('.tk.rw')].map(e=>e.textContent)};},20)},10)};window.speechSynthesis.cancel=function(){}});
 await p.click('[data-act=txlisten]');await W(120);const hl=await E(()=>({sp:window.__spoken,hl:window.__hl,btn:document.querySelector('[data-act=txlisten]').textContent}));
 ok('22 cümle cümle okunur',hl.sp.length===1&&hl.sp[0].startsWith('My brother'),hl);ok('22 okunan cümle vurgulanır',hl.hl&&hl.hl.rd>=5,hl);ok('22 okunan kelime vurgulanır',hl.hl&&hl.hl.rw[0]==='brother',hl);ok('22 Durdur düğmesi',hl.btn.includes('Durdur'),hl);
 await p.click('[data-act=txrate]');ok('22 hız değişir',await E(()=>S.settings.rate===1.15));
 await p.click('[data-act=txlisten]');await W(50);ok('22 durdurunca vurgu temizlenir',await E(()=>!window._spk&&!document.querySelector('.tk.rd')));
 ok('D hata yok',p.errs.length===0,p.errs);await ctx.close()};
// ---------- E: öğretmen ----------
T.teacher=async b=>{let {ctx,p}=await fresh(b,'Öğretmen');const E=(f,a)=>p.evaluate(f,a),W=ms=>p.waitForTimeout(ms);
 await E(()=>{const ids=WORDS.filter(hasData).slice(40,52).map(w=>w.id);S.cw={zorbla:{id:'zorbla',word:'zorbla',tr:'deneme kelime',en:'The zorbla is on the table.',entr:'Zorbla masada.',ipa:'/z/',pos:'noun',custom:1}};reloadCustom();ids.push('zorbla');lists().push({id:'ls1',name:'7-A Hafta 3',ids});save();curList='ls1';go('lst')});await W(80);
 ok('23 listede Paylaş düğmesi',await E(()=>!!document.querySelector('[data-act=sharel]')));
 await E(()=>{window.QRCode=function(el,o){el.innerHTML='<canvas data-len="'+o.text.length+'"></canvas>'};window.QRCode.CorrectLevel={L:1}});
 await p.click('[data-act=sharel]');await W(150);const url=await p.$eval('#shurl',e=>e.value);
 ok('23 paylaşım linki üretilir',/#l=[A-Za-z0-9_-]+$/.test(url),url.slice(0,80));ok('23 QR çizilir',await E(()=>!!document.querySelector('#qr canvas')));
 await ctx.close();
 // QR fallback (CDN yok)
 ({ctx,p}=await fresh(b,'X'));await ctx.unroute(/cdnjs\.cloudflare\.com\/ajax\/libs\/qrcodejs/);await ctx.route(/cdnjs/,r=>r.abort());
 await p.evaluate(()=>{lists().push({id:'q',name:'q',ids:[WORDS.find(hasData).id]});shareSt={lid:'q'};go('share')});await p.waitForTimeout(300);
 ok('23 internet yoksa QR yerine açıklama',await p.evaluate(()=>/internet gerekir/.test(document.querySelector('#qr').innerText)));await ctx.close();
 // öğrenci tarafı
 const c2=await b.newContext({viewport:{width:390,height:844}});await mocks(c2);const s=await c2.newPage();s.errs=[];s.on('pageerror',e=>s.errs.push(e.message));
 await s.goto(url.replace(/^https?:\/\/[^/]+\//,URL0));await s.waitForTimeout(200);await s.fill('#pn','Öğrenci');await s.click('[data-act=saveprof]');await s.waitForTimeout(150);
 ok('23 öğrenci linki açınca liste önizlemesi',await s.evaluate(()=>view==='share'&&document.body.innerText.includes('7-A Hafta 3')));
 await s.click('[data-act=shareadd]');await s.waitForTimeout(120);
 const got=await s.evaluate(()=>{const L=lists().find(l=>l.name==='7-A Hafta 3');return{n:L&&L.ids.length,custom:!!byId.zorbla&&byId.zorbla.tr,hash:location.hash}});
 ok('23 liste öğrenciye eklenir (özel kelime dahil)',got.n===13&&got.custom==='deneme kelime',got);ok('23 link adresten temizlenir',got.hash==='',got);
 await s.evaluate(()=>{location.hash='#l=bozukveri'});await s.reload();await s.waitForTimeout(200);ok('23 bozuk link güvenle reddedilir',s.errs.length===0&&await s.evaluate(()=>view!=='share'),s.errs);await c2.close();
 // rapor
 ({ctx,p}=await fresh(b,'Ali'));await p.evaluate(()=>{const a=setIds();a.forEach(id=>{grade(id,true,false);grade(id,true,false);grade(id,true,false)});grade(setIds()[0],false,false);go('settings')});await p.waitForTimeout(80);
 await p.click('[data-act=goreport]');await p.waitForTimeout(100);const rp=await p.evaluate(()=>document.body.innerText);
 ok('24 rapor açılır',/RAPORU|raporu/.test(rp)&&/Öğrenilen kelime\n?\s*10/.test(rp),rp.slice(0,200));ok('24 zorlanılan kelimeler tablosu',/1 yanlış/.test(rp));
 await p.emulateMedia({media:'print'});ok('24 yazdırmada menü ve düğmeler gizli',await p.evaluate(()=>getComputedStyle(document.querySelector('nav')).display==='none'&&getComputedStyle(document.querySelector('.no-print')).display==='none'));await p.emulateMedia({media:'screen'});
 await p.screenshot({path:path.join(__dirname,'..','..','shot_e_report.png'),fullPage:true});
 // basit mod
 await p.evaluate(()=>go('settings'));await p.waitForTimeout(60);await p.selectOption('#smp','1');await p.evaluate(()=>go('smenu'));await p.waitForTimeout(60);
 ok('25 basit modda Yazarak/Eşleştirme/Eleme gizli',await p.evaluate(()=>!document.querySelector('[data-m=type]')&&!document.querySelector('[data-m=match]')&&!document.querySelector('[data-act=sortgo]')));
 ok('25 basit modda 5+1 kelimelik oturum',await p.evaluate(()=>{startSession('flash');return session.queue.length<=6}));
 ok('25 basit modda 3 şık',await p.evaluate(()=>{startSession('fill');go('study');return session.opts.length===3}));
 ok('25 basit modda yazı büyür',await p.evaluate(()=>document.querySelector('#app').style.zoom==='1.15'));
 ok('E hata yok',p.errs.length===0,p.errs);await ctx.close()};
T.handlers=async b=>{const {ctx,p}=await fresh(b,'Ali',{timezoneId:'Europe/Istanbul'});const E=(f,a)=>p.evaluate(f,a),W=ms=>p.waitForTimeout(ms);
 await p.clock.setFixedTime(new Date('2026-10-31T01:30:00+03:00'));ok('5 İstanbul 01:30 → bugün 31 Ekim',await E(()=>today())==='2026-10-31');
 const bk=await E(()=>{const st=JSON.parse(JSON.stringify(S));st.cw={qqq:{id:'qqq',word:'qqq',tr:'d',en:'A qqq is here now.',entr:'',custom:1}};return JSON.stringify({app:'kelime-kartlari',state:st})});
 await E(()=>go('settings'));await W(80);const ta=await p.$('#bk');if(ta){await p.fill('#bk',bk);await p.click('[data-act=loadbk]');await W(120);ok('6 yedekten yüklemede özel kelime hemen görünür',await E(()=>!!byId.qqq))}else ok('6 yedek metin alanı bulundu',false);
 await E(()=>go('settings'));await W(60);await p.click('[data-act=reset]');await p.click('[data-act=reset]');await W(120);const rs=await E(()=>({qqq:!!byId.qqq,cw:Object.keys(S.cw||{}).length,learned:learnedIds().length,seen:totalSeen()}));ok('6 Sıfırla düğmesi özel kelimeleri kaldırır',!rs.qqq&&rs.cw===0&&rs.learned===0&&rs.seen===0,rs);
 ok('H hata yok',p.errs.length===0,p.errs);await ctx.close()};
(async()=>{const only=process.argv[2];const b=await chromium.launch();for(const k of Object.keys(T)){if(only&&!only.split(',').includes(k))continue;console.log('▶',k);try{await T[k](b)}catch(e){fail++;fails.push(k+': '+e.message.split('\n')[0]);console.log('  ✗ HATA',e.message.split('\n')[0])}}
 await b.close();srv.close();console.log(`\n${pass} geçti, ${fail} kaldı`);if(fail){console.log('Kalanlar:',fails.join(' | '));process.exit(1)}})();
