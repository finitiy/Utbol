# ⚽ Futbol Live Uzbekistan

**Futbol Live Uzbekistan** — zamonaviy, xavfsiz va yuqori tezlikda ishlovchi futbol translyatsiyalari, o'yinlar taqvimi va Telegram Mini App platformasi.

Ushbu platforma O'zbekiston Superligasi va jahon futboli muxlislari uchun maxsus ishlab chiqilgan bo'lib, rasmiy telekanallar (Sport TV, UzReport TV, Setanta Sports) havolalarini birlashtiradi, Telegram bot va Mini App orqali real vaqtda jonli hisoblar va bildirishnomalarni yetkazadi.

---

## 🚀 Asosiy Imkoniyatlar

1. **Zamonaviy Veb-Ilova (Web App)**:
   - To'q rangli (dark theme) professional sport dizayni (navy/black va emerald pitch yashil urg'usi).
   - Android telefonlar, planshetlar va kompyuterlar uchun 100% moslashuvchan (responsive).
   - O'zbekiston Superligasi, UEFA Chempionlar Ligasi, Angliya Premyer-ligasi, La Liga bahslari.
   - Barcha o'yinlarning boshlanish vaqtlari avtomatik ravishda **Toshkent vaqti (Asia/Tashkent, UTC+5)** bo'yicha hisoblanadi.
   - Sevimli jamoalarni tanlash (Favorites) va filtrlar.

2. **Telegram Bot va Telegram Mini App**:
   - Rasmiy Telegram bot: `/start`, `/help`, `/bugun`, `/jonli`, `/natijalar`, `/admin`.
   - O'zbek tilidagi qulay inline tugmalar (Inline Keyboards).
   - Mini App integratsiyasi: foydalanuvchilar Telegramdan chiqmasdan turib veb-ilovaning barcha imkoniyatlaridan to'liq foydalanishi mumkin.
   - Telegram server tekshiruvi: Telegram `initData` ma'lumotlari serverda HMAC-SHA256 algoritmi bo'yicha bot tokeni bilan qat'iy tekshiriladi (soxtalashtirishdan himoyalangan).
   - Ommaviy xabarnoma (Broadcast): barcha obunachilarga jonli efirlar haqida xabar tarqatish.

3. **Xavfsiz Autentifikatsiya va Foydalanuvchi Hisoblari**:
   - Email, login (username) va parol orqali ro'yxatdan o'tish.
   - Parollarni xavfsiz xesh qilish (PBKDF2 SHA-512 / bcrypt).
   - Emailni tasdiqlash uchun 6 xonali maxfiy kod tekshiruvi.
   - Sessiya xavfsizligi va Telegram hisobini veb-profilga ulash.

4. **Xavfsiz Administrator Boshqaruv Paneli (Admin Dashboard)**:
   - Boshlang'ich administrator Telegram ID: `7853449314` (yoki `.env` dagi `ADMIN_TELEGRAM_ID`).
   - Server-side role verification: Hech qanday foydalanuvchi mijoz tomondan o'zini admin qila olmaydi.
   - Jonli efir va o'yinlarni boshqarish: Yangi o'yin qo'shish, hisobni o'zgartirish, daqiqani belgilash, efir holatini yoqish/o'chirish.
   - Foydalanuvchilarni qidirish, bloklash (suspend) va faollashtirish.
   - Audit jurnali (Audit Logs): Barcha admin harakatlari vaqti va tafsiloti bilan yozib boriladi.
   - Sayt sozlamalari va texnik ta'mirlash (Maintenance mode) rejimi.

5. **Litsenziyalangan Translyatsiyalar**:
   - Faqat rasmiy, litsenziyalangan teleradiokompaniyalar (MTRK Sport TV, UzReport TV, Setanta Sports) ochiq havolalari.
   - Piratik yoki ruxsatsiz strimlar joylashtirilmaydi.

---

## 🛠 Texnologiyalar To'plami (Tech Stack)

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend**: Node.js, Express REST API, crypto (HMAC-SHA256, PBKDF2).
- **Ma'lumotlar bazasi**: PostgreSQL uchun Prisma ORM schema va migratsiyalar (`prisma/schema.prisma`).
- **Telegram**: Telegram Bot API va Telegram Mini App WebApp SDK.
- **Futbol API**: football-data.org integratsiyasi va mahalliy doimiy kesh.

---

## ⚙️ Sozlash va Ishga Tushirish (Environment Variables)

`.env` faylini yaratish uchun `.env.example` dan nusxa oling:

```bash
cp .env.example .env
```

Quyidagi o'zgaruvchilarni to'ldiring:

| O'zgaruvchi | Tavsif | Misol |
|---|---|---|
| `DATABASE_URL` | PostgreSQL ulanish manzili | `postgresql://user:pass@localhost:5432/futbol_uz?schema=public` |
| `TELEGRAM_BOT_TOKEN` | @BotFather bergan bot tokeni | `123456789:ABCdefGHI...` |
| `ADMIN_TELEGRAM_ID` | Bosh administrator Telegram ID | `7853449314` |
| `FOOTBALL_API_KEY` | football-data.org API kaliti | `abc123...` |
| `AUTH_SECRET` | 32+ belgili tasodifiy xavfsizlik kaliti | `k48fhq...` |
| `APP_URL` | Saytingizning to'liq HTTPS manzili | `https://futbollive.uz` |

---

## 📱 Android Telefonda Ishga Tushirish

Batafsil ko'rsatmalar uchun `DEPLOYMENT_ANDROID_UZ.md` fayliga qarang.

Oddiy 3 qadam:
1. Termux-ni o'rnating: `pkg update && pkg install nodejs-lts git -y`
2. Kutubxonalarni o'rnating: `npm install`
3. Ishga tushiring: `npm run dev`
4. Brauzerda oching: `http://localhost:3000`
