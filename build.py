"""Kelime Kartları derleyici.
Kullanım (repo kökünden):  python3 src/build.py
src/words.csv + src/data/red_batch*.json + src/template.html  ->  docs/index.html
"""
import csv, json, re, glob, os
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'docs')
rows = list(csv.DictReader(open(os.path.join(HERE, 'words.csv'), encoding='utf-8-sig')))
listed = {r['word'] for r in rows}
data = {}
for f in sorted(glob.glob(os.path.join(HERE, 'data', 'red_batch*.json'))):
    for x in json.load(open(f, encoding='utf-8')):
        data[x['word']] = x
missing = [w for w in data if w not in listed]
assert not missing, missing
def pat(w):
    return r'(^|[^A-Za-z])' + re.sub(r'\\\((.*?)\\\)', r'(?:\1)?', re.escape(w)) + r'(?![A-Za-z])'
words, ids = [], set()
for r in rows:
    w = r['word']; i = w.lower()
    assert i not in ids, w
    ids.add(i)
    d = data.get(w, {})
    words.append({'id': i, 'word': w, 'pos': d.get('partOfSpeech', ''), 'tr': d.get('meaningTr', ''),
                  'en': d.get('sentenceEn', ''), 'entr': d.get('sentenceTr', ''),
                  'ipa': d.get('phonetic', ''), 'tip': d.get('memoryTip', '')})
bad = [w['word'] for w in words if w['tr'] and not re.search(pat(w['word']), w['en'], re.I)]
chk = [w['word'] for w in words if 'CHECK' in json.dumps(w, ensure_ascii=False)]
print('hazir:', sum(1 for w in words if w['tr']), '/', len(words), '| cumle-eslesmeyen:', bad, '| CHECK:', chk)
assert not bad
texts = []
for f in sorted(glob.glob(os.path.join(HERE, 'data', 'texts', '*.json'))):
    texts += json.load(open(f, encoding='utf-8'))
tids = [x['id'] for x in texts]
assert len(tids) == len(set(tids)), 'yinelenen metin id'
for x in texts:
    assert x['title'] and x['paragraphs'] and all(isinstance(p, str) for p in x['paragraphs']), x['id']
    if x.get('tr'): assert len(x['tr']) == len(x['paragraphs']), x['id'] + ': tr/paragraf sayisi'
texts.sort(key=lambda x: x.get('date', ''), reverse=True)
print('metin:', len(texts))
t = open(os.path.join(HERE, 'template.html'), encoding='utf-8').read()
out = t.replace('/*WORDS_JSON*/', json.dumps(words, ensure_ascii=False, separators=(',', ':'))).replace('/*TEXTS_JSON*/', json.dumps(texts, ensure_ascii=False, separators=(',', ':')))
os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(out)
print('docs/index.html yazildi')
