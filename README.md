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

## Otomatik metin yayını (v1.5)
- `.github/workflows/update-texts.yml` her 6 saatte `src/fetch_feed.py` çalıştırır, `docs/feed.json` günceller.
- İlk kurulumdan sonra: Actions > Update texts feed > Run workflow.
- Uygulama önce `feed.json`'u (aynı site), olmazsa Wikipedia'yı doğrudan dener.
- Metinde `more` alanı varsa "Metni uzat" düğmesi çıkar.

## Sürüm 2.0 – 2.1
- **Öğrenme motoru:** Listeden ve metinden eklenen kelimeler ilk cevapta çalışılmaya başlar, 3 doğruda öğrenilir ve aralıklı tekrara girer. Tekrarda bilinemeyen kelime çalışma setine döner. Eski kayıtlar ilk açılışta otomatik düzeltilir.
- **Tarih:** Seri, günlük hedef ve grafik cihazın yerel saatine göre.
- **Önbellek:** Uygulama önce kayıtlı kopyadan açılır, arka planda güncellenir; dış istekler (çeviri vb.) saklanmaz. Yeni sürüm yüklenince "Yeni sürüm hazır — Yenile" çıkar.
- **Hatalarım:** 2 kez bilinemeyen kelimeler otomatik listesi; üst üste 3 doğruda çıkar.
- **Kartlar:** Yön seçimi (İng → Tür, Tür → İng, Karışık). Yazarak cevapta 1 harf hatasına "neredeyse doğru", "Harf al" ipucu.
- **Hızlı eleme:** Kelimeleri kaydırarak biliyorum / bilmiyorum; bilinenler 15 gün sonra kontrol tekrarında sorulur.
- **Metin:** Okudum sonrası 5 soruluk metin sınavı, "kırmızı kelimelerin %X'ini biliyorsun", "En uygun" sıralama, düz metin yapıştırarak ekleme, okunan cümle/kelime vurgulu seslendirme ve hız ayarı.
- **Öğretmen:** Liste paylaşımı (link + QR), yazdırılabilir ilerleme raporu, profil bazında basit öğrenci modu.
- **Ayarlar:** Yazı boyutu (Normal / Büyük / Çok büyük).

## Testler
- `node tests/run.js` (önce `python3 src/build.py`, Playwright gerekir). Tek grup: `node tests/run.js motor`.
- `.github/workflows/tests.yml` her yüklemede testleri çalıştırır; ayrıca `docs/index.html` ile `src/template.html` uyumsuzsa uyarır.
- QR kütüphanesi (qrcodejs 1.0.0) çalışma anında cdnjs'ten yüklenir; internet yoksa yalnızca link gösterilir.
- **İçerik:** 1288 kırmızı kelimenin tamamı kartlı (`red_batch12`–`red_batch17` eklendi); eksik 370 ipucu tamamlandı, her kartta ipucu var.
