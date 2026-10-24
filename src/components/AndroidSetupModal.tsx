/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Smartphone, Globe, Shield, Terminal, CheckCircle2, ChevronRight, Copy, Check } from 'lucide-react';

interface AndroidSetupModalProps {
  onClose: () => void;
}

export const AndroidSetupModal: React.FC<AndroidSetupModalProps> = ({ onClose }) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Android Telefonda Loyihani Boshqarish va Joylash</h3>
              <span className="text-[11px] text-slate-400">Boshlovchilar uchun oddiy o'zbek tilidagi qo'llanma</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation */}
        <div className="px-6 pt-4 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs pb-3">
          {[
            { id: 1, title: '1. Termux & Android' },
            { id: 2, title: '2. @BotFather & Bot' },
            { id: 3, title: '3. Bepul Hosting (Render)' },
            { id: 4, title: '4. Baza (Supabase)' },
            { id: 5, title: '5. Domen & SSL' },
          ].map((step) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeStep === step.id
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {step.title}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-xs text-slate-300">
          {/* STEP 1: TERMUX */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>1-qadam: Android telefonda Termux orqali ishga tushirish</span>
              </h4>
              <p className="leading-relaxed">
                Kompyuter shart emas! Android telefoningizda <strong>Termux</strong> yoki <strong>Acode</strong> dasturi orqali loyihani to'liq tahrirlashingiz va boshqarishingiz mumkin:
              </p>

              <ol className="list-decimal list-inside space-y-2.5 text-slate-200">
                <li>
                  Google Play o'rniga <strong>F-Droid</strong> saytidan Termux dasturini o'rnating (eng so'nggi versiyasi).
                </li>
                <li>
                  Termux-ni oching va quyidagi buyruqlarni ketma-ket nusxalab kiritib <code>Enter</code> bosing:
                </li>
              </ol>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Termux buyruqlari (Node.js & Git o'rnatish):</span>
                  <button
                    onClick={() => copyText('pkg update && pkg install nodejs-lts git -y', 'c1')}
                    className="text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {copiedCode === 'c1' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode === 'c1' ? 'Nusxalandi' : 'Nusxa olish'}</span>
                  </button>
                </div>
                <pre className="font-mono text-emerald-400 text-xs overflow-x-auto p-2 bg-slate-900 rounded">
pkg update && pkg install nodejs-lts git -y
                </pre>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Loyihani ishga tushirish:</span>
                  <button
                    onClick={() => copyText('npm install\nnpm run dev', 'c2')}
                    className="text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {copiedCode === 'c2' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode === 'c2' ? 'Nusxalandi' : 'Nusxa olish'}</span>
                  </button>
                </div>
                <pre className="font-mono text-emerald-400 text-xs overflow-x-auto p-2 bg-slate-900 rounded">
npm install
npm run dev
                </pre>
              </div>

              <p className="text-slate-400 text-[11px]">
                Endi telefoningizdagi Chrome brauzerida <code>http://localhost:3000</code> manzilini ochsangiz, loyihangiz ishlaydi!
              </p>
            </div>
          )}

          {/* STEP 2: TELEGRAM BOTFATHER */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                <span>2-qadam: @BotFather orqali Telegram Bot va Mini App yaratish</span>
              </h4>
              <p className="leading-relaxed">
                Telegram botingiz 1 daqiqada tayyor bo'ladi va hech qanday to'lov talab qilmaydi:
              </p>

              <div className="space-y-2">
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                  <span className="font-bold text-emerald-400">1. Bot ochish:</span> Telegramda <code>@BotFather</code> ni qidiring va <code>/newbot</code> yuboring.
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                  <span className="font-bold text-emerald-400">2. Token olish:</span> BotFather sizga <code>TELEGRAM_BOT_TOKEN</code> beradi (masalan: <code>123456789:ABCdef...</code>). Uni nusxalab oling.
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                  <span className="font-bold text-emerald-400">3. Web App / Mini App menyusini ulash:</span> BotFather-ga <code>/setmenubutton</code> yozing, botingizni tanlang va saytingiz manzilini kiriting (masalan: <code>https://sizning-sayt.onrender.com</code>). Tugma nomiga <code>Futbol Live UZ</code> deb yozing.
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                  <span className="font-bold text-amber-400">4. Admin ruxsati:</span> Boshlang'ich administrator Telegram ID si <code>7853449314</code> qilib sozlangan. Botga <code>/admin</code> deb yozsangiz, bot sizni darhol boshqaruvchi sifatida taniydi!
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: BEPUL HOSTING */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>3-qadam: Bepul Onlayn Serverga Joylash (Render.com)</span>
              </h4>
              <p className="leading-relaxed">
                Sayt va Telegram botingiz telefoningiz o'chiq bo'lsa ham 24/7 ishlashi uchun bepul <strong>Render.com</strong> yoki <strong>Railway.app</strong> dan foydalanishingiz mumkin:
              </p>

              <ol className="list-decimal list-inside space-y-2 text-slate-200">
                <li>Telefonda GitHub ilovasida yoki brauzerda <code>github.com</code> ga kiring va yangi repository oching.</li>
                <li>Loyiha fayllarini yuklang (yoki Termux-da git push qiling).</li>
                <li><strong>render.com</strong> saytiga kiring va "New Web Service" tugmasini bosing.</li>
                <li>Quyidagi sozlamalarni kiriting:</li>
              </ol>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div><span className="text-slate-500">Build Command:</span> <span className="text-emerald-400">npm install && npm run build</span></div>
                <div><span className="text-slate-500">Start Command:</span> <span className="text-emerald-400">npm run start</span></div>
                <div><span className="text-slate-500">Instance Type:</span> <span className="text-emerald-400">Free ($0/month)</span></div>
              </div>

              <p className="text-slate-400 text-[11px]">
                Render avtomatik ravishda bepul <strong>https://sizning-loyihangiz.onrender.com</strong> manzilini taqdim etadi.
              </p>
            </div>
          )}

          {/* STEP 4: SUPABASE POSTGRESQL */}
          {activeStep === 4 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>4-qadam: Bepul PostgreSQL Ma'lumotlar Bazasi (Supabase)</span>
              </h4>
              <p className="leading-relaxed">
                Prisma ORM va foydalanuvchilar hisobini saqlash uchun bepul <strong>Supabase.com</strong> (yoki Neon.tech):
              </p>
              <ol className="list-decimal list-inside space-y-2 text-slate-200">
                <li><strong>supabase.com</strong> saytida hisob oching va yangi loyiha (New Project) yarating.</li>
                <li>Database settings bo'limidan <strong>Connection String</strong> (URI) nusxalab oling.</li>
                <li>Uni Render.com dagi Environment Variables qismiga <code>DATABASE_URL</code> nomi bilan kiriting.</li>
                <li>Termux-da <code>npx prisma db push</code> buyrug'ini bir marta bosing va barcha jadvallar avtomatik yaratiladi!</li>
              </ol>
            </div>
          )}

          {/* STEP 5: DOMEN & SSL */}
          {activeStep === 5 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                <span>5-qadam: Shaxsiy Domen (.UZ) va Bepul HTTPS/SSL</span>
              </h4>
              <p className="leading-relaxed">
                Agar o'zingizning <code>futbollive.uz</code> domeningiz bo'lsa:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-200">
                <li>CCTLD.uz yoki Eskiz.uz orqali o'zbek domenini xarid qiling (yillik ~35-40 ming so'm).</li>
                <li>Render yoki Cloudflare boshqaruv panelida "Custom Domain" bo'limiga domeningizni yozing.</li>
                <li>DNS sozlamalariga <code>CNAME</code> yozuvini ko'rsating.</li>
                <li>Render va Cloudflare 1 daqiqada bepul <strong>Let's Encrypt SSL (HTTPS)</strong> sertifikatini avtomatik faollashtiradi!</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Savollar yoki yordam uchun: <code>@FutbolLiveUzBot</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg text-xs"
          >
            Tushundim, davom etish
          </button>
        </div>
      </div>
    </div>
  );
};
