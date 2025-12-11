# 404 Error Fix - SPA Routing Configuration

## Muammo:
- ✅ http://localhost:5173/login - ishlayapti
- ❌ https://taqdimot.ismailov.uz/login - 404 error

**Sabab:** Production serverda SPA routing konfiguratsiyasi yo'q.

---

## Yechim 1: Nginx Server (Eng Ko'p Ishlatiladigan)

### 1. SSH orqali serverga kiring:

```bash
ssh user@taqdimot.ismailov.uz
# yoki
ssh user@server_ip_address
```

---

### 2. Nginx konfiguratsiya faylini toping:

```bash
# Odatda bu joyda:
sudo nano /etc/nginx/sites-available/taqdimot.ismailov.uz

# yoki
sudo nano /etc/nginx/conf.d/taqdimot.ismailov.uz.conf

# yoki default konfiguratsiya:
sudo nano /etc/nginx/sites-available/default
```

---

### 3. Server block ichiga quyidagini qo'shing/o'zgartiring:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name taqdimot.ismailov.uz www.taqdimot.ismailov.uz;
    
    root /var/www/taqdimot/dist;  # dist papkangiz joylashgan joy
    index index.html;

    # ✅ SPA ROUTING - ASOSIY QISM (Bu qator muhim!)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static fayllar uchun cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression (ixtiyoriy, lekin tavsiya etiladi)
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}

# HTTPS uchun (SSL/TLS bor bo'lsa)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name taqdimot.ismailov.uz www.taqdimot.ismailov.uz;
    
    # SSL sertifikatlari
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    
    root /var/www/taqdimot/dist;
    index index.html;

    # ✅ SPA ROUTING
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static fayllar cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

---

### 4. Konfiguratsiyani tekshiring:

```bash
sudo nginx -t
```

Agar "syntax is ok" deb chiqsa, hammasi to'g'ri! ✅

---

### 5. Nginx'ni restart qiling:

```bash
sudo systemctl restart nginx

# yoki
sudo service nginx restart
```

---

### 6. Test qiling:

```bash
# Browser'da:
https://taqdimot.ismailov.uz/login
https://taqdimot.ismailov.uz/showcase
https://taqdimot.ismailov.uz/hujjatlarim
```

Hammasi ishlashi kerak! ✅

---

## Yechim 2: Apache Server

Agar Apache ishlatayotgan bo'lsangiz:

### 1. `.htaccess` faylini yarating:

```bash
# dist papkangiz ichida
cd /var/www/taqdimot/dist
sudo nano .htaccess
```

### 2. Quyidagini qo'shing:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # HTTPS'ga yo'naltirish (ixtiyoriy)
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  
  # SPA routing - barcha so'rovlarni index.html'ga yo'naltirish
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript
</IfModule>

# Cache static files
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
</IfModule>
```

### 3. Apache'ni restart qiling:

```bash
sudo systemctl restart apache2

# yoki
sudo service apache2 restart
```

---

## Yechim 3: Vercel/Netlify (Agar Hosting)

Bizda `vercel.json` va `public/_redirects` allaqachon bor! ✅

Deploy qilganda avtomatik ishlashi kerak.

### Vercel:
```bash
vercel --prod
```

### Netlify:
```bash
netlify deploy --prod
```

---

## Yechim 4: Build fayllarini to'g'ri deploy qilganingizni tekshiring

### 1. Local'da build qiling:

```bash
npm run build
```

### 2. dist/ papkasini server'ga ko'chiring:

```bash
# SCP orqali
scp -r dist/* user@server_ip:/var/www/taqdimot/dist/

# yoki rsync
rsync -avz dist/ user@server_ip:/var/www/taqdimot/dist/
```

### 3. Fayl ruxsatlarini tekshiring:

```bash
sudo chown -R www-data:www-data /var/www/taqdimot/dist
sudo chmod -R 755 /var/www/taqdimot/dist
```

---

## Tezkor Test (SSH'dan):

```bash
# Nginx konfiguratsiyani ko'rish
cat /etc/nginx/sites-available/taqdimot.ismailov.uz | grep try_files

# Agar "try_files $uri $uri/ /index.html" ko'rsatmasa, qo'shish kerak!
```

---

## Debugging:

### 1. Nginx error log'larni ko'ring:

```bash
sudo tail -f /var/log/nginx/error.log
```

### 2. Access log'ni ko'ring:

```bash
sudo tail -f /var/log/nginx/access.log
```

### 3. /login ga kirishda 404 bo'lsa:

```bash
# Error log'da ko'rasiz:
# "open() "/var/www/taqdimot/dist/login" failed (2: No such file or directory)"

# Bu degani: try_files qatori yo'q yoki noto'g'ri!
```

---

## Eng Tez Yechim (Agar SSH access bo'lsa):

```bash
# 1. SSH ga kiring
ssh user@server

# 2. Nginx konfig ochish
sudo nano /etc/nginx/sites-available/taqdimot.ismailov.uz

# 3. "location /" blokini toping va ichiga qo'shing:
#    try_files $uri $uri/ /index.html;

# 4. Saqlang (Ctrl+O, Enter, Ctrl+X)

# 5. Test qiling
sudo nginx -t

# 6. Restart qiling
sudo systemctl restart nginx

# 7. Browser'da test qiling
# https://taqdimot.ismailov.uz/login
```

---

## Xulosa:

**Muammo:** Server `/login` faylini qidirayapti va topilmayapti.

**Yechim:** `try_files $uri $uri/ /index.html;` - bu qator serverga aytadiki:
1. Avval `/login` faylini qidir
2. Topilmasa, `/login/` papkasini qidir  
3. Topilmasa, `/index.html` ni qaytir ✅

Bu React Router'ni ishlashiga imkon beradi!

---

Server'ga kirish huquqingiz bormi? Qaysi hosting ishlatayapsiz?
