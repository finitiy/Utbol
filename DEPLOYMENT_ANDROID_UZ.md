# 📱 Android Telefonda "Futbol Live Uzbekistan" Loyihasini Boshqarish va Joylash Qo'llanmasi

Ushbu qo'llanma **boshlovchilar uchun oddiy o'zbek tilida** yozilgan. Loyihani yaratish, sinab ko'rish va internetga chiqarish uchun sizga faqat **Android telefon** kerak bo'ladi (kompyuter shart emas).

---

## 1-BOB. Android Telefonga Kerakli Dasturlar (Mutlaqo Bepul)

1. **Termux**:
   - Google Play-dagi Termux eskirgan, shuning uchun uni [F-Droid.org](https://f-droid.org/packages/com.termux/) saytidan yuklab oling.
   - Bu dastur telefoningizda Linux terminalini yaratadi.
2. **Acode** (yoki QuickEdit):
   - Google Play-dan o'rnating. Bu telefoningizda fayllar kodini qulay tahrirlash uchun matn muharriri.
3. **Telegram**:
   - Botni boshqarish va test qilish uchun.
4. **Chrome Brauzer**:
   - Saytni ko'rish va boshqaruv paneliga kirish uchun.

---

## 2-BOB. Termux-da Loyihani Ishga Tushirish

Termux dasturini oching va quyidagi buyruqlarni birma-bir nusxalab kiritib, klaviaturadagi `Enter` tugmasini bosing:

### 1-qadam: Tizimni yangilash va Node.js o'rnatish
```bash
pkg update -y && pkg upgrade -y
pkg install nodejs-lts git -y
```

### 2-qadam: Loyiha papkasiga kirish va kutubxonalarni o'rnatish
```bash
cd futbol-live-uzbekistan
npm install
```

### 3-qadam: Loyihani telefoningizda ishga tushirish
```bash
npm run dev
```

Ekranda `Server running on http://0.0.0.0:3000` yozuvi paydo bo'ladi.
Endi telefoningizdagi Chrome brauzerini oching va manzil qatoriga yozing:
👉 `http://localhost:3000`

Tabriklaymiz! Futbol Live Uzbekistan platformasi telefoningizda ishlamoqda.

---

## 3-BOB. Telegram Bot (@BotFather) Yaratish va Sozlash

Telegram botingiz orqali muxlislar jonli hisoblar va taqvimlarni bilib olishadi va saytingizni Telegram ichida ochishadi:

1. Telegramda **@BotFather** rasmiy botiga kiring va `/start` bosing.
2. Yangi bot ochish uchun `/newbot` buyrug'ini yuboring.
3. Botga nom bering (masalan: `Futbol Live Uzbekistan`).
4. Botga username bering (oxiri `bot` bilan tugashi kerak, masalan: `FutbolLiveUzBot`).
5. BotFather sizga **API Token** beradi:
   `123456789:ABCdefGhIJKlmNoPQRsTUVwXyz`
   Uni nusxalab oling — bu sizning `TELEGRAM_BOT_TOKEN`ingiz.
6. **Mini App tugmasini yoqish**:
   - BotFather-ga `/setmenubutton` yuboring.
   - Botingizni tanlang.
   - Saytingiz manzilini kiriting (masalan: `https://sizning-sayt.onrender.com`).
   - Tugma nomiga `Futbol Live UZ` deb yozing.
7. Botni ishga tushiring: o'zingiz yaratgan botingizga kirib `/start` bosing!

---

## 4-BOB. Bepul Onlayn Serverga Joylash (Render.com)

Telefoningiz o'chsa ham, internetingiz uzilsa ham saytingiz va botingiz 24/7 onlayn ishlashi uchun bepul **Render.com** hostingidan foydalanamiz:

1. Telefonda brauzer orqali [github.com](https://github.com) ga kiring va hisob oching.
2. Yangi repository oching (masalan `futbol-live-uz`).
3. Loyihani GitHub-ga yuklang.
4. [render.com](https://render.com) ga kiring va GitHub orqali ro'yxatdan o'ting.
5. **"New +" -> "Web Service"** tugmasini bosing va o'zingizning GitHub repository-ingizni tanlang.
6. Quyidagi parametrlarni kiriting:
   - **Name**: `futbol-live-uzbekistan`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: `Free ($0/month)`
7. **Environment Variables (Atrof-muhit o'zgaruvchilari)** bo'limiga quyidagilarni kiriting:
   - `DATABASE_URL`: *(Supabase bazangiz manzili)*
   - `TELEGRAM_BOT_TOKEN`: *(BotFather bergan token)*
   - `ADMIN_TELEGRAM_ID`: `7853449314`
   - `AUTH_SECRET`: `mening_juda_maxfiy_kuchli_kalitim_2026_super`
   - `APP_URL`: Render bergan manzil (masalan: `https://futbol-live-uz.onrender.com`)
8. **"Create Web Service"** tugmasini bosing! 2-3 daqiqada saytingiz butun dunyo uchun ochiq bo'ladi.

---

## 5-BOB. Bepul PostgreSQL Ma'lumotlar Bazasi (Supabase)

Foydalanuvchilar, hisoblar va sevimlilarni saqlash uchun:

1. [supabase.com](https://supabase.com) ga kiring va bepul ro'yxatdan o'ting.
2. "New Project" tugmasini bosib loyiha yarating.
3. **Project Settings -> Database** bo'limiga kiring.
4. **Connection String (URI)** ni nusxalab oling:
   `postgresql://postgres:[PAROLINGIZ]@db.xxxx.supabase.co:5432/postgres`
5. Ushbu manzilni Render.com-dagi `DATABASE_URL` maydoniga qo'ying.
6. Termux-da bir marta:
   ```bash
   npx prisma db push
   ```
   buyrug'ini bering. Barcha jadvallar avtomatik yaratiladi!

---

## 6-BOB. Shaxsiy Domen (.UZ) va Bepul HTTPS (SSL) Ulash

1. Agar `futbollive.uz` domenini olmoqchi bo'lsangiz, [cctld.uz](https://cctld.uz) yoki `eskiz.uz` orqali yiliga ~35 000 so'mga xarid qiling.
2. Render.com boshqaruv panelida:
   - **Settings -> Custom Domains** bo'limiga o'ting.
   - O'zingizning `futbollive.uz` domeningizni kiriting.
3. Domen sotib olgan joyingizdagi DNS sozlamalariga:
   - `Type`: `CNAME`
   - `Name`: `@` yoki `www`
   - `Value`: Render ko'rsatgan manzil (masalan: `futbol-live-uz.onrender.com`)
4. Render 5 daqiqada avtomatik ravishda bepul **HTTPS (Let's Encrypt SSL)** sertifikatini ulaydi. Saytingiz xavfsiz `https://` bilan ishlaydi!

---

## 7-BOB. Administratorlik Huquqini Tekshirish

Platformada boshqaruvchi sifatida to'liq nazoratga ega bo'lish uchun:
- **Telegram orqali**: `7853449314` Telegram ID raqamiga ega akkauntingizdan botingizga `/admin` deb yozing yoki Mini Appni oching. Tizim sizni avtomatik ravishda Administrator deb belgilaydi.
- **Veb-sayt orqali**:
  - Email: `admin@futballive.uz`
  - Parol: `Admin12345!`
  - Kirgandan so'ng yuqori o'ng burchakda **"Admin Panel"** tugmasi ochiladi.
  - Bu yerdan yangi o'yinlar qo'shishingiz, jonli efir hisobini o'zgartirishingiz, efir havolalarini yangilashingiz va foydalanuvchilarga xabarnomalar yuborishingiz mumkin.
