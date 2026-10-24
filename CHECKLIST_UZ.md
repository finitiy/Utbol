# ✅ Futbol Live Uzbekistan — Sinov va Tekshirish Nazorat Ro'yxati (Checklist)

Loyihaning barcha bo'limlari to'g'ri va xavfsiz ishlayotganini tekshirish uchun ushbu nazorat ro'yxatidan foydalaning:

---

## 1. Ro'yxatdan O'tish va Foydalanuvchi Hisobi (Authentication)
- [ ] Yangi foydalanuvchi sifatida ro'yxatdan o'tish (email, username, parol kamida 6 belgi).
- [ ] Email tasdiqlash kodi tekshiruvi: 6 xonali kod to'g'ri kiritilganda hisob tasdiqlanadi.
- [ ] Noto'g'ri parol yoki mavjud email bilan ro'yxatdan o'tishda xatolik xabari chiqadi.
- [ ] Kirish (Login) va Chiqish (Logout) muammosiz ishlaydi.
- [ ] Parollar bazada ochiq saqlanmaydi, balki PBKDF2 (SHA-512) orqali xeshlanadi.

---

## 2. Administrator Huquqi va Boshqaruv Paneli (Admin Access)
- [ ] Standart admin hisobi bilan kirish: `admin@futballive.uz` / `Admin12345!`.
- [ ] Boshqaruv panelida (Admin Panel) umumiy statistika, foydalanuvchilar va o'yinlar ro'yxati to'g'ri ko'rinadi.
- [ ] O'yin hisobini va daqiqasini o'zgartirish: jonli efir kartochkalarida hisob bir zumda yangilanadi.
- [ ] Yangi o'yin qo'shish va o'chirish: tasdiqlash so'rovi (confirmation dialog) chiqadi.
- [ ] Oddiy foydalanuvchi admin paneliga kira olmaydi (server 403 Forbidden qaytaradi).
- [ ] Administrator harakatlari Audit jurnalida (Audit Log) qayd etiladi.

---

## 3. Telegram Bot va Telegram Mini App
- [ ] Brauzerdagi Telegram Hub markazida `/start`, `/bugun`, `/jonli`, `/admin` buyruqlari simulyatori to'liq o'zbek tilida javob beradi.
- [ ] `7853449314` Telegram ID si bilan `/admin` buyrug'i yuborilganda admin huquqi tasdiqlanadi.
- [ ] Boshqa har qanday Telegram ID si bilan `/admin` buyrug'i yuborilganda kirish taqiqlanadi (403).
- [ ] Telegram Mini App ochilganda `initData` serverda HMAC-SHA256 yordamida bot tokeni orqali xavfsiz tekshiriladi.
- [ ] Telegram ommaviy xabarnomasi (Broadcast) barcha ulangan hisoblarga yetkaziladi.

---

## 4. Futbol Ma'lumotlari va Vaqt Muvofiqligi (Football Data & Timezone)
- [ ] Barcha o'yinlarning boshlanish vaqti Toshkent vaqti (Asia/Tashkent, UTC+5) bo'yicha hisoblangan.
- [ ] O'zbekiston Superligasi va xalqaro chempionatlar (UCL, EPL, La Liga) bo'yicha filtrlar ishlaydi.
- [ ] Turnir jadvalida (Standings) ochkolar, gollar va o'yinlar soni tabular raqamlar bilan to'g'ri ko'rinadi.
- [ ] football-data.org API kaliti kiritilganda tashqi yangi o'yinlar avtomatik yuklanadi; kalit bo'lmaganda doimiy mahalliy baza uzluksiz ishlaydi.

---

## 5. Litsenziyalangan Efirlar va Pleyer (Licensed Streaming)
- [ ] O'yin kartochkalarida rasmiy telekanal nomi (MTRK Sport TV, UzReport TV, Setanta Sports) ko'rinadi.
- [ ] "Jonli efirni tomosha qilish" bosilganda rasmiy teleradiokompaniyaning qonuniy havolasi yoki litsenziyalangan pleyer ochiladi.
- [ ] Piratik yoki qonunga zid havolalar kiritilmagan.
- [ ] Litsenziyalangan efir haqida ogohlantiruvchi yuridik ma'lumot ko'rsatiladi.

---

## 6. Mobil Moslashuvchanlik va Dizayn (Mobile Ergonomics)
- [ ] Android telefonlarda pastki qulay menyu (Bottom Tab Bar) ekranning 15% qismidan oshmaydi.
- [ ] Barcha tugmalarning bosilish maydoni kamida 44x44px.
- [ ] Dark theme (to'q rangli sport dizayni) va yashil maydon aksentlari uyg'unlashgan.
