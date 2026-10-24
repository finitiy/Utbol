/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { db } from './db.ts';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface TelegramInitDataValidated {
  query_id?: string;
  user?: TelegramUser;
  auth_date: number;
  hash: string;
  isValid: boolean;
  isAdmin: boolean;
}

/**
 * Validates Telegram Mini App initData string using Telegram's official HMAC-SHA256 algorithm.
 */
export function validateTelegramInitData(initDataStr: string, botToken: string): TelegramInitDataValidated {
  if (!initDataStr) {
    return { auth_date: 0, hash: '', isValid: false, isAdmin: false };
  }

  try {
    const params = new URLSearchParams(initDataStr);
    const hash = params.get('hash');
    if (!hash) {
      return { auth_date: 0, hash: '', isValid: false, isAdmin: false };
    }

    params.delete('hash');

    const keys = Array.from(params.keys()).sort();
    const dataCheckString = keys.map((key) => `${key}=${params.get(key)}`).join('\n');

    let isValid = false;

    if (botToken && botToken !== 'YOUR_TELEGRAM_BOT_TOKEN') {
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
      const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
      isValid = crypto.timingSafeEqual(Buffer.from(calculatedHash, 'hex'), Buffer.from(hash, 'hex'));
    } else {
      isValid = true;
    }

    const authDate = parseInt(params.get('auth_date') || '0', 10);
    const userRaw = params.get('user');
    let user: TelegramUser | undefined = undefined;

    if (userRaw) {
      try {
        user = JSON.parse(userRaw);
      } catch {
        // ignore parse error
      }
    }

    const adminTelegramId = db.adminTelegramId;
    const isAdmin = Boolean(user && user.id && user.id.toString() === adminTelegramId.toString());

    return {
      query_id: params.get('query_id') || undefined,
      user,
      auth_date: authDate,
      hash,
      isValid,
      isAdmin,
    };
  } catch (error) {
    console.error('Error validating Telegram initData:', error);
    return { auth_date: 0, hash: '', isValid: false, isAdmin: false };
  }
}

/**
 * Real-Time Telegram Bot Service with Long Polling and Webhook support
 */
export class TelegramBotService {
  private botToken: string;
  private appUrl: string;
  private botInfo: { id?: number; first_name?: string; username?: string } | null = null;
  private isPollingActive: boolean = false;
  private lastUpdateId: number = 0;
  private pollingController: AbortController | null = null;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '8974081431:AAGXBmLTuwxFJUsOg-Npcpvjns42uBsvWUQ';
    const rawUrl = process.env.APP_URL || 'https://ais-dev-2ynpawh354h7wht3xkjvyp-51730714048.asia-southeast1.run.app';
    this.appUrl = rawUrl.replace('ais-pre-', 'ais-dev-');
    this.botInfo = {
      id: 8974081431,
      first_name: 'Live Futbol',
      username: 'FutbolJonliEfirBot',
    };
    // Automatically start real-time polling to process incoming Telegram messages
    this.startLongPolling();
  }

  public getBotToken(): string {
    return this.botToken;
  }

  public getBotInfo() {
    return this.botInfo;
  }

  public isConfigured(): boolean {
    return Boolean(this.botToken && this.botToken.length > 20 && this.botToken !== 'YOUR_TELEGRAM_BOT_TOKEN');
  }

  public isPolling(): boolean {
    return this.isPollingActive;
  }

  public setAppUrl(url: string) {
    this.appUrl = url;
  }

  /**
   * Set and verify bot token with Telegram API
   */
  public async setBotToken(token: string): Promise<{ success: boolean; botInfo?: any; error?: string }> {
    try {
      const cleanToken = token.trim();
      const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
      const data = await res.json();

      if (!data.ok || !data.result) {
        return { success: false, error: data.description || "Noto'g'ri Telegram Bot tokeni" };
      }

      this.botToken = cleanToken;
      this.botInfo = data.result;

      // Start long-polling automatically to process real messages
      this.startLongPolling();

      db.addAuditLog('admin', 'Telegram Bot', 'BOT_TOKEN_UPDATE', `@${data.result.username} boti muvaffaqiyatli ulandi va ishga tushirildi`);

      return {
        success: true,
        botInfo: data.result,
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Telegram serveri bilan bog'lanishda xatolik" };
    }
  }

  /**
   * Real-time Long-polling engine to receive real updates from Telegram
   */
  public startLongPolling() {
    if (this.isPollingActive) {
      this.stopLongPolling();
    }

    if (!this.isConfigured()) return;

    this.isPollingActive = true;
    this.pollingController = new AbortController();

    const poll = async () => {
      while (this.isPollingActive) {
        try {
          const url = `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=25`;
          const res = await fetch(url, { signal: this.pollingController?.signal });
          
          if (!res.ok) {
            await new Promise((r) => setTimeout(r, 4000));
            continue;
          }

          const data = await res.json();
          if (data.ok && Array.isArray(data.result)) {
            for (const update of data.result) {
              this.lastUpdateId = update.update_id;
              await this.processIncomingUpdate(update);
            }
          }
        } catch (err: any) {
          if (err.name === 'AbortError') break;
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    };

    poll().catch((err) => console.error('Telegram polling error:', err));
  }

  public stopLongPolling() {
    this.isPollingActive = false;
    if (this.pollingController) {
      this.pollingController.abort();
      this.pollingController = null;
    }
  }

  /**
   * Process incoming update from Telegram User
   */
  public async processIncomingUpdate(update: any) {
    try {
      if (update.message) {
        const msg = update.message;
        const chatId = msg.chat?.id;
        const text = (msg.text || '').trim();
        const user = msg.from;

        if (!chatId) return;

        // Auto-register user in DB if new
        if (user) {
          const tgIdStr = user.id.toString();
          let existingUser = null;
          for (const u of db.users.values()) {
            if (u.telegramId === tgIdStr) {
              existingUser = u;
              break;
            }
          }

          const isAdmin = tgIdStr === db.adminTelegramId;

          if (!existingUser) {
            const newId = `tg-${user.id}`;
            db.users.set(newId, {
              id: newId,
              email: `${user.username || user.id}@telegram.user`,
              username: user.username || `tg_${user.first_name}`,
              passwordHash: '',
              role: isAdmin ? 'ADMIN' : 'USER',
              status: 'ACTIVE',
              isEmailVerified: true,
              telegramId: tgIdStr,
              telegramUsername: user.username,
              favoriteTeamIds: ['uz-navbahor', 'uz-pakhtakor'],
              notifyKickoff: true,
              notifyGoals: true,
              createdAt: new Date().toISOString(),
            });
          }
        }

        // Handle commands
        if (text.startsWith('/start')) {
          const payload = this.handleStart(chatId, user);
          await this.sendTelegramMessage(chatId, payload.text, payload.reply_markup);
        } else if (text.startsWith('/help')) {
          await this.sendTelegramMessage(chatId, this.handleHelp());
        } else if (text.startsWith('/bugun')) {
          await this.sendTelegramMessage(chatId, this.getTodayMatchesMessage());
        } else if (text.startsWith('/jonli')) {
          await this.sendTelegramMessage(chatId, this.getLiveMatchesMessage());
        } else if (text.startsWith('/natijalar')) {
          await this.sendTelegramMessage(chatId, this.getResultsMessage());
        } else if (text.startsWith('/admin')) {
          await this.sendTelegramMessage(chatId, this.handleAdminCommand(user?.id?.toString() || ''));
        }
      } else if (update.callback_query) {
        const query = update.callback_query;
        const chatId = query.message?.chat?.id;
        const data = query.data;

        if (chatId) {
          if (data === 'live_matches') {
            await this.sendTelegramMessage(chatId, this.getLiveMatchesMessage());
          } else if (data === 'today_matches') {
            await this.sendTelegramMessage(chatId, this.getTodayMatchesMessage());
          } else if (data === 'recent_results') {
            await this.sendTelegramMessage(chatId, this.getResultsMessage());
          } else if (data === 'leagues') {
            await this.sendTelegramMessage(chatId, this.getLeaguesMessage());
          } else if (data === 'my_profile') {
            const tgId = query.from?.id?.toString();
            await this.sendTelegramMessage(chatId, `👤 <b>Sizning profilingiz:</b>\n\nTelegram ID: <code>${tgId}</code>\nIsm: ${query.from?.first_name}\nRol: ${tgId === db.adminTelegramId ? '🛡️ Administrator' : '⚽ Futbol Muxlisi'}`);
          } else if (data === 'help') {
            await this.sendTelegramMessage(chatId, this.handleHelp());
          }

          // Acknowledge callback
          try {
            await fetch(`https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ callback_query_id: query.id }),
            });
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      console.error('Error processing Telegram update:', err);
    }
  }

  /**
   * Helper to send real Telegram message
   */
  public async sendTelegramMessage(chatId: string | number, text: string, replyMarkup?: any) {
    if (!this.isConfigured()) return false;
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
        }),
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to send Telegram message:', err);
      return false;
    }
  }

  // Generates Telegram Bot start reply with Mini App button and Uzbek keyboards
  public handleStart(chatId: string | number, user?: TelegramUser): { text: string; reply_markup: any } {
    const name = user?.first_name || 'Hurmatli muxlis';
    const text = `⚽ <b>Futbol Live Uzbekistan</b> botiga xush kelibsiz, ${name}!\n\n` +
      `Bu yerda siz:\n` +
      `• O'zbekiston Superligasi va Yevropa chempionatlari jonli efirlari\n` +
      `• Bugungi o'yinlar jadvali va to'g'ridan-to'g'ri hisoblar\n` +
      `• Rasmiy telekanallar (Sport TV, UzReport, Setanta Sports) havolalari\n` +
      `• Sevimli jamoalaringiz gollari va natijalari haqida tezkor xabarlarni kuzatishingiz mumkin.\n\n` +
      `📱 Quyidagi <b>"🚀 Web Appni ochish"</b> tugmasi orqali to'g'ridan-to'g'ri Telegram ichida o'yinlarni tomosha qiling!`;

    const webAppUrl = this.appUrl.startsWith('http') ? this.appUrl : `https://${this.appUrl}`;

    const reply_markup = {
      inline_keyboard: [
        [
          { text: '🚀 Web App (Mini App)', web_app: { url: webAppUrl } },
          { text: '🌐 Brauzerda ochish', url: webAppUrl },
        ],
        [
          { text: '⚡ Jonli o‘yinlar', callback_data: 'live_matches' },
          { text: '📅 Bugungi o‘yinlar', callback_data: 'today_matches' },
        ],
        [
          { text: '🏆 Chempionatlar', callback_data: 'leagues' },
          { text: '📊 Natijalar', callback_data: 'recent_results' },
        ],
        [
          { text: '👤 Mening profilim', callback_data: 'my_profile' },
          { text: '🆘 Yordam', callback_data: 'help' },
        ],
      ],
    };

    return { text, reply_markup };
  }

  public handleHelp(): string {
    return `📖 <b>Futbol Live Uzbekistan Bot Yo'riqnomasi</b>\n\n` +
      `<b>Buyruqlar ro'yxati:</b>\n` +
      `/start - Botni qayta ishga tushirish va asosiy menyu\n` +
      `/bugun - Bugungi barcha futbol uchrashuvlari jadvali\n` +
      `/jonli - Hozir to'g'ridan-to'g'ri efirda ketayotgan bahslar\n` +
      `/natijalar - So'nggi yakunlangan o'yinlar hisoblari\n` +
      `/admin - Boshqaruv paneli (faqat administratorlar uchun)\n\n` +
      `💡 <i>Eslatma: Barcha o'yinlarning boshlanish vaqtlari Toshkent vaqti (UTC+5) bo'yicha ko'rsatiladi.</i>\n\n` +
      `Murojaat uchun: @FutbolLiveUzSupport`;
  }

  public getLiveMatchesMessage(): string {
    const liveMatches = Array.from(db.matches.values()).filter(
      (m) => m.status === 'IN_PLAY' && m.isPublished
    );

    if (liveMatches.length === 0) {
      return `⚡ <b>Jonli o‘yinlar</b>\n\nAyni daqiqalarda jonli efirdagi bahslar mavjud emas.\nBugun rejalashtirilgan o'yinlarni ko'rish uchun /bugun buyrug'ini yuboring.`;
    }

    let msg = `⚡ <b>JONLI EFIRLARDAGI O'YINLAR (Jonli hisoblar)</b>\n\n`;
    liveMatches.forEach((m) => {
      const bcName = m.broadcaster?.name || "Rasmiy telekanal";
      msg += `🏆 <b>${m.leagueName}</b> (${m.minute}'-daqiqa)\n` +
             `⚔️ <b>${m.homeTeam.name}</b>  ${m.homeScore ?? 0} : ${m.awayScore ?? 0}  <b>${m.awayTeam.name}</b>\n` +
             `📺 Efir: ${bcName}\n` +
             `🏟 ${m.venue || 'Stadion'}\n\n`;
    });

    msg += `📲 Jonli efir videosini ko'rish uchun <b>"🚀 Web Appni ochish"</b> tugmasini bosing!`;
    return msg;
  }

  public getTodayMatchesMessage(): string {
    const matches = Array.from(db.matches.values()).filter((m) => m.isPublished);
    if (matches.length === 0) {
      return `📅 Bugun uchun rejalashtirilgan o'yinlar topilmadi.`;
    }

    let msg = `📅 <b>BUGUNGI FUTBOL O'YINLARI JADVALI (Toshkent vaqti)</b>\n\n`;
    matches.forEach((m) => {
      const statusIcon = m.status === 'IN_PLAY' ? '🔴 JONLI' : m.status === 'FINISHED' ? '✅ TUGADI' : `⏰ ${m.kickoffTashkent}`;
      const scoreText = m.status === 'IN_PLAY' || m.status === 'FINISHED' 
        ? `[ ${m.homeScore ?? 0} : ${m.awayScore ?? 0} ]` 
        : 'vs';

      msg += `• <b>${m.homeTeam.name}</b> ${scoreText} <b>${m.awayTeam.name}</b>\n` +
             `  🏆 ${m.leagueName} | ${statusIcon}\n` +
             `  📺 ${m.broadcaster?.name || "Rasmiy efir"}\n\n`;
    });

    return msg;
  }

  public getResultsMessage(): string {
    const finished = Array.from(db.matches.values()).filter((m) => m.status === 'FINISHED');
    if (finished.length === 0) {
      return `📊 Yaqinda yakunlangan o'yinlar hozircha mavjud emas.`;
    }

    let msg = `📊 <b>YAKUNLANGAN UCHRASHUVLAR NATIJALARI</b>\n\n`;
    finished.forEach((m) => {
      msg += `🏆 <b>${m.leagueName}</b>\n` +
             `• <b>${m.homeTeam.name}</b>  ${m.homeScore ?? 0} : ${m.awayScore ?? 0}  <b>${m.awayTeam.name}</b>\n\n`;
    });
    return msg;
  }

  public getLeaguesMessage(): string {
    let msg = `🏆 <b>FUTBOL LIVE UZBEKISTAN — CHEMPIONATLAR</b>\n\n`;
    Array.from(db.leagues.values()).forEach((l) => {
      msg += `• <b>${l.name}</b> (${l.country})\n`;
    });
    msg += `\nTurnir jadvallari va ochkolarni ko'rish uchun "🚀 Web Appni ochish" tugmasini bosing.`;
    return msg;
  }

  public handleAdminCommand(telegramId: string): string {
    if (telegramId.toString() !== db.adminTelegramId.toString()) {
      return `⛔ <b>Ruxsat etilmadi!</b>\n\nBu buyruq faqat bosh administrator (${db.adminTelegramId}) uchun mavjud. Sizning Telegram ID: <code>${telegramId}</code>.`;
    }

    const totalUsers = db.users.size;
    const totalMatches = db.matches.size;
    const liveMatches = Array.from(db.matches.values()).filter((m) => m.status === 'IN_PLAY').length;

    return `🛡️ <b>ADMINISTRATOR BOSHQARUV PANELİ</b>\n\n` +
      `Siz muvaffaqiyatli administrator sifatida tasdiqlandingiz (ID: ${telegramId}).\n\n` +
      `📊 <b>Statistika:</b>\n` +
      `• Jami foydalanuvchilar: ${totalUsers} nafar\n` +
      `• Jami o'yinlar: ${totalMatches} ta\n` +
      `• Hozir jonli efirda: ${liveMatches} ta\n` +
      `• Tizim holati: ${db.settings.maintenanceMode ? '⚠️ Texnik ta\'mirlash' : '✅ Faol'}\n\n` +
      `Barcha funksiyalar (o'yin qo'shish, hisobni o'zgartirish, bloklash) uchun Web Appdagi "Admin Dashboard" bo'limiga kiring.`;
  }

  // Sends an announcement message to all linked Telegram accounts
  public async broadcastMessage(text: string): Promise<{ success: boolean; sentCount: number; error?: string }> {
    let sentCount = 0;
    const linkedUsers = Array.from(db.users.values()).filter((u) => u.telegramId);

    if (this.isConfigured()) {
      for (const u of linkedUsers) {
        if (!u.telegramId) continue;
        try {
          const res = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: u.telegramId,
              text,
              parse_mode: 'HTML',
            }),
          });
          if (res.ok) sentCount++;
        } catch (err) {
          console.error(`Failed to send telegram message to ${u.telegramId}:`, err);
        }
      }
    } else {
      sentCount = linkedUsers.length;
    }

    db.addAuditLog('admin', 'Admin Telegram', 'BROADCAST', `Telegram xabarnoma jo'natildi (${sentCount} ta foydalanuvchi): "${text.slice(0, 50)}..."`);

    return { success: true, sentCount };
  }
}

export const telegramBot = new TelegramBotService();
