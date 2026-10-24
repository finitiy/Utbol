"""
Telegram IPTV Player Bot (aiogram 3.x)
Muallif: AI Studio
Vazifasi: channels.json faylidan .m3u8 oqimlarini o'qib, Telegram WebApp orqali to'g'ridan-to'g'ri ko'rsatish.
"""

import asyncio
import json
import logging
import os
import sys
import urllib.parse
from pathlib import Path

from aiogram import Bot, Dispatcher, html
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandStart
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
    WebAppInfo,
)

# ==================== SOZLAMALAR ====================
# Telegram botingizning tokeni (@BotFather'dan olinadi)
# Yoki BOT_TOKEN muhit o'zgaruvchisiga (Environment Variable) o'rnating
BOT_TOKEN = os.getenv("BOT_TOKEN", "BOT_TOKENINGIZNI_SHU_YERGA_YOZING")

# Telegram WebApp ochiladigan asosiy HTTPS manzil:
# Ushbu ilovangizning onlayn manzili avtomatik o'rnatilgan:
WEBAPP_BASE_URL = os.getenv(
    "WEBAPP_BASE_URL",
    "https://ais-dev-2ynpawh354h7wht3xkjvyp-51730714048.asia-southeast1.run.app/player.html"
)

# Kanallar saqlanadigan JSON fayl yo'li
CHANNELS_FILE = Path(__file__).parent / "channels.json"
# ====================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stdout
)
logger = logging.getLogger("IPTVBot")

dp = Dispatcher()


def load_channels() -> list[dict]:
    """channels.json faylidan kanallar ro'yxatini yuklash"""
    if not CHANNELS_FILE.exists():
        logger.warning(f"Diqqat: {CHANNELS_FILE} topilmadi!")
        return []

    try:
        with open(CHANNELS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            logger.error("channels.json formati massiv (list) bo'lishi kerak!")
            return []
    except Exception as e:
        logger.error(f"channels.json faylini o'qishda xatolik: {e}")
        return []


def create_channels_keyboard(channels: list[dict]) -> InlineKeyboardMarkup:
    """Kanallar uchun Telegram WebApp inline tugmalarini shakllantirish"""
    keyboard_rows = []

    for item in channels:
        name = item.get("name", "Noma'lum Kanal")
        stream_url = item.get("url", "").strip()

        if not stream_url:
            continue

        # WebApp player uchun URL parametrlarini tayyorlash
        query = urllib.parse.urlencode({
            "url": stream_url,
            "name": name
        })
        webapp_url = f"{WEBAPP_BASE_URL}?{query}"

        # WebApp tugmasini yaratish
        btn = InlineKeyboardButton(
            text=name,
            web_app=WebAppInfo(url=webapp_url)
        )
        keyboard_rows.append([btn])

    return InlineKeyboardMarkup(inline_keyboard=keyboard_rows)


@dp.message(CommandStart())
async def cmd_start(message: Message) -> None:
    """Foydalanuvchi /start bosganda ishlaydi"""
    channels = load_channels()

    if not channels:
        await message.answer(
            "⚠️ Hozirda birorta ham faol kanal mavjud emas.\n"
            "Iltimos, `channels.json` faylini to'ldiring.",
            parse_mode=ParseMode.MARKDOWN
        )
        return

    keyboard = create_channels_keyboard(channels)

    welcome_text = (
        f"Assalomu alaykum, {html.bold(message.from_user.full_name)}! 👋\n\n"
        f"📺 <b>Jonli Sport Efirlari</b> portaliga xush kelibsiz!\n\n"
        f"Quyidagi kanallardan birini tanlang. Tugmani bosishingiz bilan "
        f"o'yin to'g'ridan-to'g'ri Telegram ichida ochiladi 👇"
    )

    await message.answer(welcome_text, reply_markup=keyboard)


@dp.message(Command("refresh"))
async def cmd_refresh(message: Message) -> None:
    """Kanallar ro'yxatini yangilash buyrug'i"""
    channels = load_channels()
    keyboard = create_channels_keyboard(channels)
    await message.answer(
        f"🔄 Kanallar ro'yxati yangilandi! ({len(channels)} ta kanal topildi).",
        reply_markup=keyboard
    )


@dp.message(Command("help"))
async def cmd_help(message: Message) -> None:
    """Yordam bo'limi"""
    help_text = (
        "📖 <b>Botdan foydalanish qo'llanmasi:</b>\n\n"
        "1. /start - Barcha mavjud kanallar ro'yxatini chiqarish.\n"
        "2. /refresh - `channels.json` faylidagi o'zgarishlarni yangilash.\n"
        "3. Istalgan kanal tugmasini bosing va o'yinni to'liq ekranda tomosha qiling.\n\n"
        "<i>Eslatma: Video yuklanishi internet tezligingizga bog'liq.</i>"
    )
    await message.answer(help_text)


async def main() -> None:
    if BOT_TOKEN == "BOT_TOKENINGIZNI_SHU_YERGA_YOZING" or not BOT_TOKEN:
        logger.error(
            "XATO: Iltimos, bot.py faylidagi BOT_TOKEN o'zgaruvchisiga @BotFather'dan olgan tokenni qo'ying!"
        )
        print("\n" + "=" * 60)
        print("DIQQAT: bot.py ichidagi BOT_TOKEN qiymatini o'zgartiring!")
        print("Telegramda @BotFather orqali bot oching va berilgan tokenni kiriting.")
        print("=" * 60 + "\n")
        return

    bot = Bot(
        token=BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )

    logger.info("IPTV Telegram Bot ishga tushirildi...")
    try:
        await dp.start_polling(bot)
    finally:
        await bot.session.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Bot to'xtatildi.")
