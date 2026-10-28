"""Metin yayını üretici. GitHub Actions her 6 saatte bir çalıştırır:  python3 src/fetch_feed.py
Wikipedia'dan (Simple English, Current events, On this day, News) metin çekip docs/feed.json yazar.
Uygulama bu dosyayı aynı siteden okur (CORS/ağ engeli sorunu olmaz)."""
import json, re, random, hashlib, datetime, os, sys, time, urllib.request, urllib.parse
from bs4 import BeautifulSoup

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'docs', 'feed.json')
UA = {'User-Agent': 'KelimeKartlari-feed/1.0 (educational app; github.com/digerpchesabim-stack/-kelime-kartlari)'}
CL = {'gundem': 'Gündem', 'siyaset': 'Siyaset', 'ekonomi': 'Ekonomi', 'bilim': 'Bilim', 'teknoloji': 'Teknoloji', 'sanat': 'Sanat',
      'gezi': 'Gezi', 'spor': 'Spor', 'saglik': 'Sağlık', 'doga': 'Doğa', 'tarih': 'Tarih'}
CE_MAP = [('politic', 'siyaset'), ('business', 'ekonomi'), ('science', 'bilim'), ('sport', 'spor'), ('art', 'sanat'),
          ('health', 'saglik'), ('environment', 'doga'), ('armed', 'gundem'), ('disaster', 'gundem'),
          ('international', 'gundem'), ('law', 'gundem')]
KW = {'bilim': ['astronomy', 'physics', 'chemistry', 'biology', 'scientist', 'space exploration', 'planet', 'medicine'],
      'teknoloji': ['computer', 'internet', 'robot', 'invention', 'electric car', 'smartphone', 'satellite', 'engine'],
      'sanat': ['painter', 'museum', 'film director', 'musician', 'novel', 'architecture', 'sculpture', 'theatre'],
      'gezi': ['capital city', 'tourist attraction', 'island', 'national park', 'mountain', 'famous bridge', 'beach', 'castle'],
      'doga': ['animal', 'rainforest', 'ocean', 'climate', 'bird', 'volcano', 'river', 'desert'],
      'tarih': ['ancient', 'empire', 'explorer', 'revolution', 'king', 'famous battle', 'pyramid', 'inventor']}
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
PER_CAT = 6

def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def hid(s): return hashlib.md5(s.encode('utf-8')).hexdigest()[:8]

def sentences(x):
    x = re.sub(r'^=+.*?=+\s*$', ' ', x, flags=re.M)
    x = re.sub(r'\s*\([^)]*\)', '', x)
    x = re.sub(r'\[\d+\]', '', x)
    x = re.sub(r'\s+', ' ', x).strip()
    return [s.strip() for s in re.findall(r'[^.!?]+[.!?]+(?:\s|$)', x) if len(s.split()) >= 4]

def chunk(ss, maxw=85):
    out, cur, n = [], [], 0
    for s in ss:
        w = len(s.split())
        if cur and n + w > maxw:
            out.append(cur); cur, n = [], 0
        cur.append(s); n += w
    if cur and (len(cur) >= 2 or not out): out.append(cur)
    return out

def paras(ss):
    if len(ss) < 2: return [' '.join(ss)]
    h = (len(ss) + 1) // 2
    return [' '.join(ss[:h]), ' '.join(ss[h:])]

def mk(id_, title, cat, date, chunks, src, url):
    return {'id': id_, 'title': title, 'topic': CL[cat], 'cat': cat, 'date': date, 'paragraphs': paras(chunks[0]),
            'more': [paras(c) for c in chunks[1:3]], 'tr': [], 'gloss': {}, 'src': src, 'url': url, 'online': 1}

def simple_texts(cat, today):
    out, seen = [], set()
    for kw in random.sample(KW[cat], 3):
        off = random.randint(0, 40)
        try:
            j = get('https://simple.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=%s&gsrlimit=12&gsroffset=%d&prop=info&format=json'
                    % (urllib.parse.quote(kw), off))
        except Exception as e:
            print('simple search fail', kw, e); continue
        pages = sorted((j.get('query') or {}).get('pages', {}).values(), key=lambda p: p.get('index', 0))
        for p in pages:
            if p['pageid'] in seen or len(out) >= PER_CAT: continue
            seen.add(p['pageid'])
            try:
                e = get('https://simple.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exchars=3800&pageids=%d&format=json' % p['pageid'])
                txt = e['query']['pages'][str(p['pageid'])].get('extract', '')
            except Exception as ex:
                print('simple extract fail', p.get('title'), ex); continue
            if re.search(r'may refer to|can mean', txt[:200]): continue
            ch = chunk(sentences(txt))
            if not ch or len(ch[0]) < 3: continue
            out.append(mk('w%d' % p['pageid'], p['title'], cat, today, ch, 'Wikipedia (Simple English)',
                          'https://simple.wikipedia.org/?curid=%d' % p['pageid']))
    return out

def parse_ce(html, date):
    soup = BeautifulSoup(html, 'html.parser')
    root = soup.select_one('.current-events-content') or soup
    items, cat = [], None
    for el in root.find_all(['p', 'ul'], recursive=False):
        if el.name == 'p':
            b = el.find('b'); h = (b.get_text() if b else el.get_text()).lower()
            cat = next((c for k, c in CE_MAP if k in h), None)
        elif cat:
            for li in el.find_all('li'):
                if li.find('li'): continue
                for n in li.find_all(['sup', 'ul']): n.decompose()
                x = re.sub(r'\s+', ' ', li.get_text()).strip()
                for _ in range(3):
                    m = re.search(r'\s\([^()]*\)\s*$', x)
                    if m and len(m.group(0)) < 40: x = x[:m.start()]
                    else: break
                if 60 <= len(x) <= 380 and re.match(r'["A-Z]', x): items.append((cat, x, date))
    return items

def ce_texts():
    items = []
    for i in range(1, 5):
        d = datetime.date.today() - datetime.timedelta(days=i)
        page = 'Portal:Current_events/%d_%s_%d' % (d.year, MONTHS[d.month - 1], d.day)
        try:
            j = get('https://en.wikipedia.org/w/api.php?action=parse&page=%s&prop=text&format=json&disabletoc=1&redirects=1' % urllib.parse.quote(page))
            items += parse_ce(j['parse']['text']['*'], d.isoformat())
        except Exception as e:
            print('ce fail', page, e)
    by = {}
    for c, x, d in items: by.setdefault(c, []).append((x, d))
    out = []
    for c, a in by.items():
        for i in range(0, len(a), 9):
            g = a[i:i + 9]
            if len(g) < 3: continue
            groups = [[x for x, _ in g[k:k + 3]] for k in range(0, len(g), 3)]
            groups = [x for x in groups if len(x) >= 2]
            if not groups: continue
            t = g[0][0].split(' ')
            title = ' '.join(t[:7]).rstrip(',;:') + '…'
            o = mk('n' + hid(g[0][0]), title, c, g[0][1], [[s if s.endswith(('.', '!', '?', '"')) else s + '.' for s in grp] for grp in groups],
                   'Wikipedia Current events', 'https://en.wikipedia.org/wiki/Portal:Current_events')
            out.append(o)
    return out

def news_texts():
    d = datetime.date.today() - datetime.timedelta(days=0)
    try:
        j = get('https://en.wikipedia.org/api/rest_v1/feed/featured/%04d/%02d/%02d' % (d.year, d.month, d.day))
    except Exception as e:
        print('news fail', e); return []
    st = []
    for n in j.get('news', []):
        x = re.sub(r'\s+', ' ', BeautifulSoup(n.get('story', ''), 'html.parser').get_text()).strip()
        if 40 <= len(x) <= 380: st.append(x if x.endswith('.') else x + '.')
    out = []
    for i in range(0, len(st), 9):
        g = st[i:i + 9]
        if len(g) < 3: continue
        chunks = [g[k:k + 3] for k in range(0, len(g), 3) if len(g[k:k + 3]) >= 2]
        out.append(mk('s' + hid(g[0]), ' '.join(g[0].split(' ')[:7]).rstrip(',;:.') + '…', 'gundem', d.isoformat(), chunks,
                      'Wikipedia In the news', 'https://en.wikipedia.org/wiki/Portal:Current_events'))
    return out

def history_texts():
    d = datetime.date.today()
    try:
        j = get('https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/%02d/%02d' % (d.month, d.day))
    except Exception as e:
        print('history fail', e); return []
    ev = sorted(j.get('events', []), key=lambda e: -e.get('year', 0))
    ev = [e for e in ev if 25 <= len(e.get('text', '')) <= 220][:9]
    st = ['In %s: %s' % (e['year'], e['text'] if e['text'].endswith('.') else e['text'] + '.') for e in ev]
    chunks = [st[k:k + 3] for k in range(0, len(st), 3) if len(st[k:k + 3]) >= 2]
    if not chunks: return []
    return [mk('o%02d%02d%d' % (d.month, d.day, d.year), 'On this day: %s %d' % (MONTHS[d.month - 1], d.day), 'tarih', d.isoformat(), chunks,
               'Wikipedia On this day', 'https://en.wikipedia.org/wiki/Wikipedia:Selected_anniversaries')]

_fails = [0]
def gtx(q):
    j = get('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tr&dt=t&q=' + urllib.parse.quote(q))
    return ''.join(x[0] for x in j[0] if x and x[0])

def tr_para(p):
    ss = re.findall(r'[^.!?]+[.!?]+["\u201d]?(?:\s|$)|[^.!?]+$', p) or [p]
    gs, cur = [], ''
    for x in ss:
        if cur and len(cur + x) > 700: gs.append(cur); cur = ''
        cur += x
    if cur: gs.append(cur)
    out = []
    for g in gs:
        out.append(gtx(g.strip())); time.sleep(0.25)
    return ' '.join(out)

def translate(t, old):
    o = old.get(t['id'])
    if o and o.get('tr') and len(o['tr']) == len(t['paragraphs']):
        t['tr'] = o['tr']; t['moretr'] = o.get('moretr', []); return
    if _fails[0] >= 5: return
    try:
        tr = [tr_para(p) for p in t['paragraphs']]
        mt = [[tr_para(p) for p in c] for c in t.get('more', [])]
        t['tr'], t['moretr'] = tr, mt
    except Exception as e:
        _fails[0] += 1; print('translate fail', t['id'], e)

def main():
    today = datetime.date.today().isoformat()
    texts = ce_texts() + news_texts() + history_texts()
    for c in KW: texts += simple_texts(c, today)
    per, final, ids = {}, [], set()
    for t in texts:
        if t['id'] in ids: continue
        ids.add(t['id'])
        per[t['cat']] = per.get(t['cat'], 0) + 1
        if per[t['cat']] <= PER_CAT: final.append(t)
    if not final:
        print('Hiç metin alınamadı; feed.json değişmedi.'); sys.exit(0)
    try: old = {t['id']: t for t in json.load(open(OUT, encoding='utf-8')).get('texts', [])}
    except Exception: old = {}
    for t in final: translate(t, old)
    json.dump({'generated': datetime.datetime.utcnow().isoformat() + 'Z', 'texts': final}, open(OUT, 'w', encoding='utf-8'),
              ensure_ascii=False, separators=(',', ':'))
    print('yazildi:', len(final), 'metin', {k: v for k, v in per.items()})

if __name__ == '__main__':
    main()
