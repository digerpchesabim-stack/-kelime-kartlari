# Kelime Kartları

İngilizce kelime öğrenme uygulaması (tek dosyalık, çevrimdışı çalışabilen PWA).
Kırmızı seviye: 1288 kelime. Kartlar, boşluk doldurma, eşleştirme, zor kelimeler, JSON yedek.

## Yayın
GitHub Pages: Settings > Pages > Branch `main` / Folder `/docs`.
Adres: `https://KULLANICI_ADI.github.io/REPO_ADI/`

## Yeni kelime ekleme
1. Yeni parti JSON dosyasını `src/data/red_batchNN_....json` olarak ekle.
2. Repo kökünde çalıştır: `python3 src/build.py`
3. `docs/` değişir; commit + push yap. Sayfa otomatik güncellenir.
`docs/sw.js` içindeki `kelime-v1` sürüm adını değiştirirsen cihazlar önbelleği yeniler.

## Yapı
- `src/template.html` : uygulama kodu
- `src/words.csv` : kırmızı kelime listesi
- `src/data/` : kelime başına anlam, cümle, IPA, ipucu (parti parti)
- `src/build.py` : derleyici
- `docs/` : yayınlanan site (index.html, manifest.json, sw.js, simgeler)

## Metin Çalışması (v1.1)
- Metinler `src/data/texts/*.json` içinde; `python3 src/build.py` ile uygulamaya gömülür.
- Uygulama içinden de eklenebilir: Ayarlar > Metin ekle (JSON yapıştır) — yeniden derleme gerekmez.
- Şema: `{id,title,topic,date,paragraphs[],tr[],gloss{}}` (tr, paragraphs ile aynı sayıda).
- `texts_01.json` ÖRNEK metinlerdir; gerçek güncel metinleri Argon üretir.
