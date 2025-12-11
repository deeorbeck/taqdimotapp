# Google Search Console Setup Guide

## 1. Google Search Console'ga Kirish

https://search.google.com/search-console

Gmail hisobingiz bilan kiring.

---

## 2. Property Qo'shish

1. **"Add property"** tugmasini bosing
2. **Domain** yoki **URL prefix** tanlang:
   - Domain: `taqdimot.ismailov.uz` (DNS verification kerak)
   - URL prefix: `https://taqdimot.ismailov.uz` (HTML tag yoki file)

---

## 3. Verification (Tasdiqlash)

### Option 1: HTML File (Eng oson)

1. Google sizga fayl beradi: `google1234567890abcdef.html`
2. Bu faylni `public/` papkasiga qo'ying
3. Deploy qiling
4. Google "Verify" tugmasini bosing
5. Tasdiqlangan! ✅

### Option 2: HTML Meta Tag

1. Google sizga meta tag beradi:
```html
<meta name="google-site-verification" content="abc123..." />
```

2. `index.html` `<head>` ichiga qo'ying:
```html
<head>
  ...
  <meta name="google-site-verification" content="abc123..." />
</head>
```

3. Deploy qiling
4. "Verify" bosing
5. Tasdiqlangan! ✅

---

## 4. Sitemap Submit Qilish

1. Search Console'da **"Sitemaps"** bo'limiga kiring
2. Sitemap URL kiriting:
```
https://taqdimot.ismailov.uz/sitemap.xml
```
3. **"Submit"** bosing
4. Google 1-7 kun ichida indekslaydi

---

## 5. URL Inspection (Tezkor Indekslash)

Agar tezroq Google'da chiqishini xohlasangiz:

1. **"URL Inspection"** toolni oching
2. URL kiriting: `https://taqdimot.ismailov.uz`
3. **"Request Indexing"** bosing
4. Google 24-48 soat ichida indekslaydi ✅

---

## 6. Monitoring (Kuzatish)

Search Console'da ko'rishingiz mumkin:

- **Performance:** Qancha odam qidirdi, bosdi
- **Coverage:** Qaysi sahifalar indekslandi
- **Enhancements:** Xatolar, ogohlantirishlar
- **Links:** Kimlar linkingizga havola qildi
- **Core Web Vitals:** Sayt tezligi

---

## 7. Kutilayotgan Natijalar

### 1-2 kun:
- ✅ Sitemap qabul qilinadi
- ✅ Landing page indekslashni boshlaydi

### 1 hafta:
- ✅ Asosiy sahifalar indekslanadi
- ✅ "Taqdimot App" qidirsangiz chiqadi

### 2-4 hafta:
- ✅ "taqdimot yaratish", "AI taqdimot" kabi so'zlar bo'yicha chiqadi
- ✅ Organic traffic boshlanadi

### 1-2 oy:
- ✅ 100+ kunlik tashrif
- ✅ Yaxshi pozitsiyada (top 10)

---

## 8. Yandex Webmaster (Qo'shimcha)

O'zbekistonda Yandex ham mashhur:

https://webmaster.yandex.ru

Xuddi Google kabi:
1. Sayt qo'shing
2. Verification
3. Sitemap submit qiling

---

## 9. Bing Webmaster Tools (Qo'shimcha)

https://www.bing.com/webmasters

Xuddi Google kabi prosess.

---

## Muhim Eslatma:

- **robots.txt** to'g'ri bo'lishi kerak ✅ (bizda bor)
- **sitemap.xml** mavjud bo'lishi kerak ✅ (bizda bor)
- **Meta tag'lar** to'g'ri bo'lishi kerak ✅ (qo'shilgan)
- **HTTPS** ishlatish kerak ✅ (sizda bor)
- **Mobile-friendly** bo'lishi kerak ✅ (responsive)

Hammasi tayyor! Faqat Google Search Console'ga qo'shishingiz kerak.
