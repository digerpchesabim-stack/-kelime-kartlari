const C='kelime-v21';const F=['./','./index.html','./manifest.json','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;const key=u.origin+u.pathname;
 if(u.pathname.endsWith('feed.json')){e.respondWith(fetch(r).then(x=>{if(x.ok){const c=x.clone();caches.open(C).then(ch=>ch.put(key,c))}return x}).catch(()=>caches.match(key)));return}
 e.respondWith(caches.match(key).then(m=>{const net=fetch(r).then(x=>{if(x.ok){const c=x.clone();caches.open(C).then(ch=>ch.put(key,c))}return x}).catch(()=>m||caches.match('./index.html'));if(m){e.waitUntil(net.catch(()=>{}));return m}return net}))});
