# Samo Moyka — Telegram Mini App (Cloudflare Workers)

Bu loyiha Cloudflare Workers + Static Assets va Supabase bilan ishlaydi. Mijozlar 2 ta yuvish boxi, navbat va izohni ko‘radi. Admin Telegram ID orqali tasdiqlanadi; admin box/navbat holatini boshqaradi va Telegram kanaliga e’lon yuboradi.

## Muhim ma’lumotlar
- Mini App nomi: **Samo Moyka**
- Kanal username: `@sabomoyka` (o‘zgarmaydi)
- Admin Telegram ID: `6177821743` (kerak bo‘lsa Cloudflare sozlamasida almashtiring)
- Database: Supabase

## 1. Supabase bazasi
1. Supabase'da project yarating.
2. SQL Editor'ga `schema.sql` faylini to‘liq joylab, Run bosing.
3. Project Settings → API bo‘limidan Project URL va `service_role` key oling.
4. `service_role` key maxfiy. Uni hech qachon GitHub yoki frontend fayllariga yozmang.

## 2. Telegram bot va kanal
1. BotFather'dan bot token oling (mavjud bot tokeni ishlatilishi mumkin).
2. Botni `@sabomoyka` kanaliga administrator qilib qo‘shing va post yuborish huquqini bering.
3. Mini App URL'ni deploydan keyin BotFather'da Web App URL sifatida kiriting.
4. Kanalning ko‘rinadigan nomini Telegram kanal sozlamalaridan **Samo Moyka** qilib o‘zgartiring. Username `@sabomoyka` o‘zgarishsiz qolishi mumkin.

## 3. Cloudflare'ga kompyutersiz deploy qilish
Eng qulay yo‘l — telefon brauzeridan GitHub va Cloudflare Dashboard orqali:
1. GitHub'da yangi private repository yarating.
2. Ushbu papkadagi fayllarni repository'ga yuklang (GitHub mobil saytida Add file → Upload files).
3. Cloudflare Dashboard → Workers & Pages → Create → Workers → Import a repository bo‘limidan GitHub repository'ni ulang.
4. Deploy sozlamasida build command talab qilinmasa, `wrangler.toml` asosida deploy qiling. Agar build sozlamasi so‘ralsa: `npm install`; deploy command: `npx wrangler deploy`.
5. Worker → Settings → Variables and Secrets bo‘limida quyidagilarni kiriting. Maxfiy qiymatlarni **Secret** sifatida saqlang:
   - `BOT_TOKEN` — Secret
   - `SUPABASE_SERVICE_ROLE_KEY` — Secret
   - `SUPABASE_URL` — Text
   - `ADMIN_TELEGRAM_ID` — Text (`6177821743`)
   - `CHANNEL_USERNAME` — Text (`@sabomoyka`)
6. O‘zgaruvchilarni saqlab, qayta deploy qiling. Worker manzili `https://...workers.dev` ko‘rinishida bo‘ladi.
7. `https://...workers.dev/api/health` ochib `{"ok":true,...}` javobini tekshiring.
8. Shu HTTPS manzilni BotFather'dagi Mini App/Web App URL'iga kiriting.

> Cloudflare Dashboard interfeysi va GitHub ulash jarayoni akkauntga qarab biroz farq qilishi mumkin. Agar telefon orqali repository import ko‘rinmasa, GitHub'ga fayllarni yuklash bosqichidan davom etamiz.

## 4. Xavfsizlik
- Telegram `initData` server tomonda HMAC bilan tekshiriladi.
- Admin API faqat `ADMIN_TELEGRAM_ID` ga ruxsat beradi.
- Bot tokeni va Supabase service-role key faqat Cloudflare Secret'larida turadi.
- Ommaviy `/api/status` faqat mijozga ko‘rinishi kerak bo‘lgan holatni qaytaradi.

## Eslatma
Hozirgi admin panelda boxlar, navbat, mijozlarga izoh va kanalga e’lon yuborish funksiyalari mavjud. Qo‘shimcha adminlar kerak bo‘lsa, keyingi bosqichda bir nechta Telegram ID qo‘llab-quvvatlashini qo‘shish mumkin.
