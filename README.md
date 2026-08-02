# 🎨 UC AI Studio - Cloudflare Workers

تولید خودکار پرامپت + عکس با هوش مصنوعی — روزی ۳ بار

## ✨ ویژگی‌ها

- 🧠 **پرامپت خودکار**: LLM خودش پرامپت خلاقانه می‌سازه
- 🎨 **تولید عکس**: با FLUX-1-schnell (Cloudflare Workers AI)
- 📱 **ارسال به تلگرام**: روزی ۳ تا عکس/پرامپت
- 🔄 **غیرتکراری**: هر بار سبک متفاوت
- 💰 **کاملاً رایگان**: Cloudflare Workers AI free tier

## 🚀 راه‌اندازی با گوشی

### مرحله ۱: ربات تلگرام
1. `@BotFather` → `/newbot`
2. توکن رو کپی کن
3. ربات رو به **کانال** ادمین کن (یا آیدی عددی خودت)

### مرحله ۲: Cloudflare Worker
1. `dash.cloudflare.com` → Workers & Pages → Create Worker
2. اسم: `uc-ai-studio`
3. کد `src/index.js` رو کپی کن → Save and Deploy

### مرحله ۳: Variables
Worker → Settings → Variables → Add:

| Name | Value | Secret |
|------|-------|--------|
| `BOT_TOKEN` | توکن تلگرام | ✅ |
| `CHAT_ID` | آیدی عددی کانال/چت | ✅ |

### مرحله ۴: AI Binding
Worker → Settings → Bindings → Add:
- Type: **AI**
- Name: `AI`

### مرحله ۵: Cron Triggers
Worker → Settings → Triggers → Add:
- `0 4 * * *` (۸ صبح)
- `0 10 * * *` (۲ بعدازظهر)
- `0 18 * * *` (۱۰ شب)

### مرحله ۶: تست
1. مرورگر → `https://uc-ai-studio.xxx.workers.dev/test`
2. باید JSON با پرامپت ببینی
3. بعد `https://uc-ai-studio.xxx.workers.dev/generate`
4. عکس توی تلگرام باید بیاد!

## 📊 مدل‌های استفاده شده

| مدل | کاربرد | هزینه |
|-----|--------|-------|
| Llama 3.3 70B | ساخت پرامپت | رایگان |
| FLUX-1-schnell | تولید عکس | رایگان |

## 🎨 سبک‌های پشتیبانی

- Y2K film, Cinematic, Anime
- Studio portrait, Street photography
- Fantasy, Surrealist, Cyberpunk
- Vintage, Editorial, Documentary
- و ده‌ها سبک دیگه...

## 📄 License
MIT
