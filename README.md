# Taqdimot App

"Taqdimot App" - bu sun'iy intellekt yordamida taqdimotlar va referatlar yaratishga mo'ljallangan web ilova. Foydalanuvchilar mavzu, til va boshqa parametrlarni kiritish orqali tezda professional hujjatlarni yaratishlari mumkin.

## Xususiyatlar

*   **Foydalanuvchi autentifikatsiyasi:** Maxsus kod orqali tizimga kirish.
*   **Hujjat yaratish:** Taqdimotlar va referatlar yaratish imkoniyati.
*   **Mavzu va til tanlash:** Hujjat mavzusi va tilini belgilash.
*   **Rasmli/Rasmsiz taqdimotlar:** Rasmlar bilan yoki rasmlarsiz taqdimotlar yaratish.
*   **Slaydlar sonini sozlash:** Taqdimot slaydlari sonini belgilash (6-20).
*   **Shablon tanlash:** Turli kategoriyadagi (Popular, Classic, Education, Modern) shablonlarni tanlash va oldindan ko'rish.
*   **Matn muharriri:** Yaratilgan hujjatlardagi matnlarni tahrirlash.
*   **Rasm yuklash:** Taqdimot slaydlari uchun mahalliy rasmlarni yuklash.
*   **Balansni to'ldirish:** To'lov tizimlari orqali balansni to'ldirish.
*   **Hujjat holatini kuzatish:** Yaratilayotgan hujjatlarning holatini kuzatish.
*   **Hujjatlarni yuklab olish va ulashish:** Yaratilgan hujjatlarni yuklab olish va ulashish.
*   **Profil sozlamalari:** Ism va avatar kabi profil ma'lumotlarini yangilash, tungi rejimni yoqish/o'chirish.
*   **Qo'llab-quvvatlash va FAQ:** Yordam va tez-tez beriladigan savollar bo'limlari.

## Texnologiyalar

*   **Frontend:** React, Vite
*   **Styling:** Tailwind CSS
*   **Icons:** Lucide React

## Loyihani ishga tushirish

Loyihani mahalliy muhitda ishga tushirish uchun quyidagi qadamlarni bajaring:

1.  **Bog'liqliklarni o'rnatish:**
    ```bash
    npm install
    ```
2.  **Ishlab chiqish serverini ishga tushirish:**
    ```bash
    npm run dev
    ```
    Ilova `http://localhost:5173` (yoki boshqa mavjud portda) ishga tushadi.

## Ishlab chiqarish uchun qurish

Ilovani ishlab chiqarish uchun qurish:

```bash
npm run build
```
Qurilgan fayllar `dist/` katalogida joylashadi.

## Qurilgan ilovani oldindan ko'rish

Qurilgan ilovani lokal serverda ko'rish uchun:

```bash
npm run preview
```
Ilova `http://localhost:4173` (yoki boshqa mavjud portda) ishga tushadi.

## Muhim eslatma: CORS va Fayl hajmi cheklovlari

Ilova tashqi API (`https://api.tm.ismailov.uz`) bilan o'zaro aloqada bo'ladi. Agar siz CORS (Cross-Origin Resource Sharing) xatolariga duch kelsangiz ("Access-Control-Allow-Origin" sarlavhasi yo'q), bu API serverining konfiguratsiyasida hal qilinishi kerak bo'lgan muammo. Server sizning frontend ilovangizdan kelayotgan so'rovlarga ruxsat berishini ko'rsatishi kerak.

Shuningdek, `413 Payload Too Large` xatosi serverning maksimal yuklash hajmi cheklovlari bilan bog'liq. Bu ham server konfiguratsiyasida oshirilishi kerak. Frontendda katta fayllarni yuborishning oldini olish uchun cheklov qo'shilgan bo'lsa-da, serverning o'zi ham bu cheklovni qo'llab-quvvatlashi kerak.
