# 🚀 Arti Tube - Supabase, Google Auth & Vercel Deployment လမ်းညွှန် (Student Edition)

မင်္ဂလာပါ! ဒီ Guide ဟာ **Arti Tube** project ကို Supabase, Google Login တို့နဲ့ ချိတ်ဆက်ပြီး Vercel ပေါ်မှာ အောင်မြင်စွာ Deploy လုပ်နိုင်ဖို့အတွက် AI Companion အနေနဲ့ မင်းနဲ့အတူ လက်တွဲပြီး တစ်ဆင့်ချင်း လမ်းညွှန်ပေးသွားမယ့် သင်ခန်းစာဖြစ်ပါတယ်။ 

အောက်ပါ Task Checklist တွေကို ဖတ်ပြီး အတူတူ လိုက်လုပ်ကြည့်ရအောင်!

---

## 📋 Course Tasks Checklist (မင်းနဲ့ AI အတူတူလုပ်မယ့် အစီအစဉ်)
- [ ] Task 0: Developer/Admin Gmail ပြောင်းလဲသတ်မှတ်ခြင်း (Codebase Configuration)
- [ ] Task 1: Supabase Project ဆောက်ပြီး Database & Storage Bucket ပြင်ဆင်ခြင်း
- [ ] Task 2: Supabase Storage တွင် `payment-screenshots` bucket ဖန်တီးပြီး policies သတ်မှတ်ခြင်း
- [ ] Task 3: Google Developer Console တွင် OAuth Client ID ဆောက်ခြင်း
- [ ] Task 4: Supabase Auth တွင် Google Login ချိတ်ဆက်ခြင်း
- [ ] Task 5: Vercel ပေါ်တွင် Environment Variables များဖြင့် Deploy လုပ်ခြင်း
- [ ] Task 6: Supabase Dashboard တွင် Production Redirect URLs များ အပ်ဒိတ်လုပ်ခြင်း

---

## ⚙️ Task 0: Developer/Admin Gmail ပြောင်းလဲသတ်မှတ်ခြင်း (Codebase Configuration)

မင်းကိုယ်တိုင် Admin Panel ကို အပြည့်အဝ ထိန်းချုပ်နိုင်ဖို့အတွက် application codebase ထဲက Admin Email ကို မင်းရဲ့ ကိုယ်ပိုင် Google/Gmail Address နဲ့ အရင်ဆုံး အစားထိုး ပြောင်းလဲပေးဖို့ လိုအပ်ပါတယ်။ 

> [!IMPORTANT]
> လက်ရှိ repository ကုဒ်ထဲမှာ သတ်မှတ်ထားတဲ့ `phyodynamics@gmail.com` ဆိုတာကတော့ မင်းကို သင်ကြားပြသပေးတဲ့ ဆရာ (Instructor) ရဲ့ Gmail ဖြစ်ပါတယ်။ အခု မင်းကိုယ်ပိုင် deployed system အတွက် မင်းကိုယ်တိုင် Admin ဖြစ်ဖို့ အောက်ပါအတိုင်း ပြောင်းလဲပေးပါ -

### ပြောင်းလဲရမည့် File များနှင့် လိုင်းနံပါတ်များ:
1. **[auth-context.tsx](file:///Users/phyozinko/Projects/KoZNL/artitube-app/src/lib/auth-context.tsx) (လိုင်း 30)**:
   ```typescript
   // လက်ရှိကုဒ်:
   const isAdmin = user?.email === "phyodynamics@gmail.com";
   
   // ပြောင်းလဲရန်:
   const isAdmin = user?.email === "မင်းရဲ့ကိုယ်ပိုင်ဂျီမေးလ်@gmail.com";
   ```

2. **[actions.ts](file:///Users/phyozinko/Projects/KoZNL/artitube-app/src/app/admin/actions.ts) (လိုင်း ၂၇၊ ၆၇၊ ၉၃)**:
   ```typescript
   // လက်ရှိကုဒ်:
   if (userError || !user || user.email !== "phyodynamics@gmail.com")
   
   // ပြောင်းလဲရန် (သုံးနေရာစလုံးတွင် ပြောင်းပါ):
   if (userError || !user || user.email !== "မင်းရဲ့ကိုယ်ပိုင်ဂျီမေးလ်@gmail.com")
   ```

3. **[supabase_schema.sql](file:///Users/phyozinko/Projects/KoZNL/artitube-app/supabase_schema.sql) (လိုင်း ၅၀)**:
   ```sql
   -- လက်ရှိကုဒ်:
   CASE WHEN new.email = 'phyodynamics@gmail.com' THEN 'active' ELSE 'pending' END
   
   -- ပြောင်းလဲရန် (ဒီ SQL file ကို run မှသာ user status က auto active ဖြစ်မှာပါ):
   CASE WHEN new.email = 'မင်းရဲ့ကိုယ်ပိုင်ဂျီမေးလ်@gmail.com' THEN 'active' ELSE 'pending' END
   ```

ဒီ ၃ ခုကို ပြောင်းလဲပြီးမှသာ Task 1 ရဲ့ database schema setup ကို ဆက်လက်လုပ်ဆောင်ရမှာ ဖြစ်ပါတယ်။

---

## 🛠 Task 1: Supabase Project ဆောက်ပြီး Database ပြင်ဆင်ခြင်း

Supabase ဟာ open-source Firebase alternative တစ်ခုဖြစ်ပြီး PostgreSQL database, Authentication နဲ့ Storage တွေကို အလွယ်တကူ သုံးနိုင်အောင် ကူညီပေးပါတယ်။

### ၁။ Supabase Project အသစ်ပြုလုပ်ခြင်း
1. [Supabase Website](https://supabase.com/) သို့သွားပြီး မင်းရဲ့ GitHub account နဲ့ sign in လုပ်ပါ။
2. **New Project** ကိုနှိပ်ပါ။
3. အောက်ပါအချက်အလက်များကို ဖြည့်စွက်ပါ -
   * **Name**: `artitube-app` (သို့မဟုတ် မိမိကြိုက်နှစ်သက်ရာ)
   * **Database Password**: *လုံခြုံစိတ်ချရသော စကားဝှက်တစ်ခုကို ပေးပြီး မှတ်ထားပါ (Vercel ပေါ်မှာ backup လုပ်ဖို့ လိုအပ်ပါလိမ့်မယ်)*
   * **Region**: မင်းနဲ့ အနီးစပ်ဆုံး region (ဥပမာ - `Singapore` သို့မဟုတ် `Southeast Asia`)
4. **Create new project** ကို နှိပ်ပြီး ခေတ္တစောင့်ပါ။ (Database အဆင်သင့်ဖြစ်ရန် ၁ မိနစ်ခန့် ကြာနိုင်သည်)

### ၂။ Database Table schema များ တည်ဆောက်ခြင်း (Backup Apply လုပ်နည်း)
မင်းဆီမှာ ရှိနှင့်ပြီးသား [supabase_schema.sql](file:///Users/phyozinko/Projects/KoZNL/artitube-app/supabase_schema.sql) ထဲက schema တွေကို database ထဲ ထည့်သွင်းရပါမယ်။

1. Supabase Dashboard ရဲ့ ဘယ်ဘက် Sidebar မှာရှိတဲ့ **SQL Editor** အိုင်ကွန် (SQL code ပုံစံ) ကို နှိပ်ပါ။
2. **New query** သို့မဟုတ် **Quick start** ကိုနှိပ်ပါ။
3. မင်းရဲ့စက်ထဲက `supabase_schema.sql` ဖိုင်ထဲမှာရှိတဲ့ code အားလုံးကို Select All လုပ်ပြီး copy ကူးယူပါ။
4. ၎င်း SQL ကုဒ်များကို SQL Editor box ထဲတွင် paste လုပ်ပါ။
5. ညာဘက်အောက်ခြေရှိ **Run** button ကို နှိပ်ပါ။
6. Success ပြသွားပါက မင်းရဲ့ database ထဲမှာ `profiles`, `videos`, `notes`, `chats` စတဲ့ table ၄ ခု အောင်မြင်စွာ တည်ဆောက်ပြီးစီးသွားပါပြီ။

---

## 🖼 Task 2: Supabase Storage တွင် Bucket ဆောက်ပြီး RLS (Row Level Security) သတ်မှတ်ခြင်း

သုံးစွဲသူတွေက lifetime access ရရှိဖို့ သူတို့ရဲ့ ငွေလွှဲပြေစာ (payment screenshot) တင်တဲ့အခါ Supabase Storage ထဲကို upload လုပ်မှာ ဖြစ်ပါတယ်။ အဲ့ဒါကြောင့် storage bucket ဆောက်ပေးဖို့ လိုပါတယ်။

### ၁။ `payment-screenshots` Bucket တည်ဆောက်ပုံ
1. Supabase Dashboard ရှိ ဘယ်ဘက် Sidebar ရှိ **Storage** အိုင်ကွန် (Folder ပုံစံ) သို့ သွားပါ။
2. **New bucket** ကို နှိပ်ပါ။
3. Bucket Name အဖြစ် `payment-screenshots` ဟု အတိအကျ ပေးပါ။
4. Bucket settings တွင် **Public** Option ကို **On** ပေးပါ။ (Public bucket အဖြစ် ထားမှသာ browser ကနေ screenshot ပုံကို တိုက်ရိုက်ပြန်ဖတ်နိုင်မှာပါ)
5. **Save** ကို နှိပ်ပါ။

### ၂။ Storage RLS Policies (Upload ခွင့်ပြုချက်) သတ်မှတ်ခြင်း
Public bucket ဖြစ်သော်လည်း client-side ကနေ ပုံတင်နိုင်ဖို့ RLS policies သတ်မှတ်ပေးရပါမယ် -
1. `payment-screenshots` bucket ထဲကို ရောက်နေချိန် ညာဘက်အပေါ်ရှိ **Policies** tab ကို နှိပ်ပါ။
2. **Storage Policies** အောက်ရှိ `payment-screenshots` bucket နေရာတွင် **New Policy** ကို နှိပ်ပါ။
3. **Get started quickly** ကို ရွေးပါ။
4. **Give users access to upload (INSERT)** option ကို ရွေးချယ်ပြီး `Allowed roles` တွင် `authenticated` သို့မဟုတ် `public` ကို သတ်မှတ်နိုင်ပါတယ်။ (ငါတို့ App မှာတော့ authentication မဝင်ခင်လည်း upload ဖြစ်နိုင်အောင် **public/anon** ကို ရွေးချယ်ပေးပါမယ်)
5. **Use this template** -> **Review** -> **Save policy** ကို နှိပ်ပါ။
6. ထို့ပြင် ပုံများကို ပြန်ကြည့်နိုင်ရန် (SELECT) အတွက်လည်း Policy ထပ်ဆောက်ပါ။ **Give read access (SELECT)** template ကို ရွေးချယ်ပြီး Save လုပ်ပါ။

---

## 🔑 Task 3: Google Developer Console တွင် OAuth Client ID ဆောက်ခြင်း

မင်းရဲ့ app မှာ Google Login သုံးနိုင်ဖို့အတွက် Google API Console မှာ application တစ်ခု ဆောက်ရပါမယ်။

1. [Google Cloud Console](https://console.cloud.google.com/) သို့ သွားပါ။
2. Project အသစ်တစ်ခုဆောက်ပါ (ဥပမာ - `Arti Tube OAuth`)။
3. Sidebar မှ **APIs & Services** -> **OAuth consent screen** သို့ သွားပါ။
4. User Type တွင် **External** ကို ရွေးပြီး **Create** နှိပ်ပါ။
5. **App Information** ဖြည့်ပါ -
   * **App name**: `Arti Tube`
   * **User support email**: မင်းရဲ့ Gmail
   * **Developer contact information**: မင်းရဲ့ Gmail
   * **Save and Continue** ကို နှိပ်ပြီး ကျန်တဲ့ tabs များကို default အတိုင်းထားကာ ပြီးဆုံးအောင်လုပ်ပါ။
6. ၎င်းနောက် ဘယ်ဘက် Sidebar မှ **Credentials** သို့ သွားပါ။
7. **Create Credentials** -> **OAuth client ID** ကို နှိပ်ပါ။
8. Application type တွင် **Web application** ကို ရွေးပါ။
9. Name အဖြစ် `Arti Tube Client` ဟု ပေးပါ။
10. **Authorized redirect URIs** အပိုင်းတွင် add URL နှိပ်ပြီး မင်းရဲ့ Supabase auth callback URL ကို ထည့်ပေးရပါမယ်။

> **❓ Supabase Auth Redirect URI ဘယ်ကရမလဲ?**
> * Supabase Dashboard -> **Authentication** -> **Providers** -> **Google** ကို နှိပ်ရင် အောက်ခြေမှာ `Redirect URI` တစ်ခု တွေ့ရပါလိမ့်မယ်။ (ပုံစံမှာ `https://<your-project-ref>.supabase.co/auth/v1/callback` ဖြစ်သည်)
> * ၎င်း URL ကို ကူးယူပြီး Google Credentials ရဲ့ **Authorized redirect URIs** ထဲတွင် ထည့်သွင်းပေးပါ။
11. **Create** ကို နှိပ်ပါ။ ထိုအခါ **Client ID** နှင့် **Client Secret** တို့ကို ရရှိလာပါလိမ့်မယ်။ (၎င်းတို့ကို ကူးယူသိမ်းဆည်းထားပါ)

---

## 🔗 Task 4: Supabase Auth တွင် Google Login ချိတ်ဆက်ခြင်း

ယခုရရှိလာတဲ့ Google credentials တွေကို Supabase ထဲမှာ သတ်မှတ်ပေးပါမယ်။

1. Supabase Dashboard -> **Authentication** -> **Providers** သို့ သွားပါ။
2. **Google** provider ကို ရှာပြီး Click နှိပ်ပါ။
3. **Enable Google Provider** ကို **On** လုပ်ပါ။
4. Google Console မှ ရရှိလာသော **Client ID** နှင့် **Client Secret** များကို သက်ဆိုင်ရာ field များတွင် ထည့်ပါ။
5. **Save** ကို နှိပ်ပါ။

---

## 💻 Task 5: Vercel ပေါ်တွင် Environment Variables များဖြင့် Deploy လုပ်ခြင်း

မင်းရဲ့ application ကို တစ်ကမ္ဘာလုံးက ဝင်သုံးလို့ရအောင် Vercel ပေါ်ကို deploy လုပ်ပါမယ်။ Vercel ဟာ environment variables တွေကို လုံခြုံစွာ သိမ်းဆည်းပေးပြီး Next.js app တွေကို အကောင်းဆုံး hosting ပေးနိုင်ပါတယ်။

> **⚠️ Gemini API Key Setup မှတ်ချက်:**
> ဤ application သည် Gemini API Key ကို Environment variables ထဲတွင် ထည့်သွင်းရန် **မလိုအပ်ပါ**။ Application dashboard ထဲတွင် Interactive UI (Settings Modal) မှတစ်ဆင့် တိုက်ရိုက်ထည့်သွင်းအသုံးပြုရမည့် ပုံစံဖြစ်သည်။

### ၁။ Local setup ကို စစ်ဆေးခြင်း
Project root ထဲမှာ `.env.example` ဖိုင်တစ်ခု ပါဝင်ပြီးသားဖြစ်ပါတယ်။ ၎င်းကို copy ကူးပြီး `.env.local` အဖြစ် ပြောင်းလဲပေးပါ -
```bash
cp .env.example .env.local
```
ပြီးရင် `.env.local` ဖိုင်ထဲမှာ မင်းရဲ့ Supabase Dashboard (Settings > API) မှ ရရှိသော key များကို ဖြည့်ပေးပါ -
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

> [!WARNING]
> `SUPABASE_SERVICE_ROLE_KEY` သည် Admin Panel server actions များအတွက် မဖြစ်မနေ လိုအပ်ပါသည်။ ၎င်းမပါပါက Admin Dashboard ထဲဝင်သောအခါ "Supabase environment variables are missing" error ပေါ်ပါလိမ့်မယ်။

### ၂။ Project ကို Vercel ပေါ်တင်ခြင်း
1. [Vercel Dashboard](https://vercel.com/) သို့ သွားပြီး Sign in ဝင်ပါ။
2. **Add New...** -> **Project** ကို နှိပ်ပါ။
3. မင်းရဲ့ GitHub account ကို ချိတ်ဆက်ပြီး `KoZNL` Repo ကို ရှာပြီး **Import** နှိပ်ပါ။
4. Configure Project settings တွင်:
   * **Framework Preset**: `Next.js`
   * **Root Directory**: `artitube-app` (မင်းရဲ့ app folder ကို ရွေးပါ)
5. **Environment Variables** Section ကို ဖြန့်ချပါ။
6. အောက်ပါ key-value ၃ ခုကို ထည့်သွင်းပေးပါ -
   * `NEXT_PUBLIC_SUPABASE_URL` = (မင်းရဲ့ Supabase project URL)
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (မင်းရဲ့ Supabase Anon Key)
   * `SUPABASE_SERVICE_ROLE_KEY` = (မင်းရဲ့ Supabase Service Role Key - Settings > API > service_role secret)
7. အားလုံးဖြည့်ပြီးပါက **Deploy** button ကို နှိပ်ပါ။ 
8. Vercel domain link တစ်ခု (ဥပမာ - `https://artitube-app.vercel.app`) ကို ရရှိလာပါလိမ့်မယ်။

---

## ⚙ Task 6: Supabase Dashboard တွင် Production Redirect URLs များ အပ်ဒိတ်လုပ်ခြင်း

Google Auth စနစ်သည် user login ဝင်ပြီးနောက် မင်းရဲ့ live website ဖြစ်တဲ့ Vercel app ဆီကို ပြန်လည်ရောက်ရှိစေဖို့ Supabase dashboard မှာ domain setting ပြင်ပေးဖို့ လိုအပ်ပါတယ်။

1. Supabase Dashboard -> **Authentication** -> **URL Configuration** သို့ သွားပါ။
2. **Site URL** နေရာတွင် မင်းရဲ့ Vercel live domain ကို ထည့်ပါ (ဥပမာ - `https://artitube-app.vercel.app`)။
3. **Redirect URLs** အောက်ရှိ **Add URL** ကို နှိပ်ပြီး Vercel app ရဲ့ callback URL ကို ပေါင်းထည့်ပါ -
   * `https://artitube-app.vercel.app/auth/callback`
4. **Save** ကို နှိပ်ပါ။

*မှတ်ချက်: Developer/Admin Bypass စနစ်ကို စမ်းသပ်ရန်အတွက် Google Login အသုံးပြုမည့် Developer account ၏ Gmail အား Task 0 တွင် ပြောင်းလဲထားသည့် မင်းရဲ့ ကိုယ်ပိုင် Gmail ကို အသုံးပြုရပါမည်။*

---

### 🎉 ကောင်းမွန်စွာ ပြီးမြောက်သွားပါပြီ!
ယခုဆိုလျှင် မင်းဟာ Next.js full-stack app တစ်ခုကို Supabase Database, Storage, Google OAuth Consent screen တွေနဲ့ အောင်မြင်စွာ ပေါင်းစပ်ပြီး Vercel ပေါ်သို့ အောင်မြင်စွာ တင်နိုင်ခဲ့ပြီ ဖြစ်ပါတယ်။ Happy Coding! 💻✨
