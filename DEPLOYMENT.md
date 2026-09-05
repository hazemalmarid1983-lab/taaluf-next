# دليل النشر والتشغيل — منصة تآلف

> **الإصدار:** 0.1.0 · **Next.js 14.2** · **Node.js 20+**

---

## 1. متطلبات التشغيل

| المتطلب | الإصدار الموصى به |
|---------|-------------------|
| Node.js | **20.x LTS** أو أحدث (مُختبر على `@types/node ^20`) |
| npm | 10+ |
| نظام التشغيل | Linux / macOS / Windows (تجنّب OneDrive أثناء `npm run build` إن أمكن) |

### إعداد البيئة المحلية

```bash
git clone <repo-url> taaluf-next
cd taaluf-next
npm install
cp .env.example .env.local
# عدّل المفاتيح في .env.local (انظر القسم 2)
npm run dev        # http://localhost:3000
```

### فحوصات ما قبل النشر

```bash
npm test                    # 250+ اختبار وحدة
npx tsc --noEmit            # تحقق TypeScript
npm run build               # بناء الإنتاج
npm run predeploy           # فحص شامل (env + build)
npm run security:audit      # تدقيق أمني للمصدر
```

---

## 2. متغيرات البيئة

انسخ `.env.example` إلى `.env.local` (محلي) أو أضف المتغيرات في **Vercel → Settings → Environment Variables**.

### إلزامية للإنتاج

| المتغير | الوصف |
|---------|--------|
| `NEXTAUTH_URL` | عنوان التطبيق الكامل `https://your-domain.com` |
| `NEXTAUTH_SECRET` | مفتاح عشوائي ≥ 32 حرفاً |
| `NEXT_PUBLIC_APP_URL` | نفس عنوان الإنتاج (للروابط العامة) |
| `AIRTABLE_API_KEY` | Personal Access Token لـ TaalofDB |
| `AIRTABLE_BASE_ID` | معرّف قاعدة Airtable |
| `OPENAI_API_KEY` | توليد الأنشطة والتحليل الاحتياطي |
| `GEMINI_API_KEY` | التقارير السريرية وتحليل الفيديو (أولوية) |

### اختيارية / Pilot

| المتغير | الوصف |
|---------|--------|
| `TAP_SECRET_KEY` / `TAP_PUBLIC_KEY` | Tap Payments — بدونها يُعطّل الدفع |
| `TAP_ENVIRONMENT` | `sandbox` أو `production` |
| `NEXT_PUBLIC_PAYMENTS_DISABLED` | `true` = بوابات مفتوحة بدون دفع |
| `TAALUF_PILOT_MODE` | وضع تجريبي داخلي |
| `ALLOW_DEMO_USERS` | حسابات تجريبية (تطوير/Pilot فقط) |

### جداول Airtable (افتراضيات)

`Students`, `Specialists`, `Assessments`, `AssessmentCriteria`, `Reports`, `ParentSurveys`, `Consents`, `AuditLog`, `Payments`, `Messages`, `GameSessions`

### ⚠️ RBAC — شريط تبديل الأدوار

`RoleSwitcher` **مُعطّل تلقائياً** عند `NODE_ENV=production`.  
لا تضبط `NEXT_PUBLIC_RBAC_DEV` في الإنتاج — حتى لو ضُبط، الكود يفرض الإيقاف في production.

---

## 3. الهيكل السريري للمنصة

```
┌─────────────────────────────────────────────────────────────────┐
│                        مسار ولي الأمر                           │
│  فرز (12) → استبيان (20) → ألعاب → تقييم → تقرير ولي الأمر     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     التقييم الشامل (36 مؤشر / 8 مجالات)         │
│  /dashboard/assessments/new · دمج AI · PDF · Airtable           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              IEP + الغرفة المنزلية + التدفق السريري             │
│  أهداف IEP · VisualSchedule · ReinforcerDelivery · Check-in     │
│  adaptiveClinicalFlow · NextBestAction                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   الجناح الحسي (8 غرف)                          │
│  /sensory-rooms → bubbles · stars · tracing · sand · animals    │
│                   waves · rain · mirror                         │
│  SensoryRoomShell · useSensoryRoomSession · calmIndex           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              RBAC + التقارير السريرية التراكمية                 │
│  SUPER_ADMIN · SPECIALIST · PARENT (lib/permissions.ts)         │
│  aggregateClinicalProgressReport · اعتماد رسمي (Super Admin)     │
└─────────────────────────────────────────────────────────────────┘
```

### المسارات الرئيسية

| المسار | الغرض |
|--------|--------|
| `/parent` | بوابة ولي الأمر |
| `/dashboard` | لوحة الأخصائي/المشرف |
| `/dashboard/home-classroom` | الغرفة الصفية المنزلية |
| `/dashboard/students/[id]` | ملف الطفل + التقرير السريري |
| `/sensory-rooms/*` | الجناح الحسي (8 غرف ثابتة) |
| `/admin` | لوحة الإدارة (admin فقط) |

### نظام RBAC

| الدور | الصلاحيات |
|-------|-----------|
| **SUPER_ADMIN** | اعتماد التقارير، تعديل التقييمات، إدارة كل الحالات، لوحة الإدارة |
| **SPECIALIST** | تصدير التقارير، الحالات المسندة، خطط IEP، محاولات الجلسات |
| **PARENT** | عرض التقدم، الجلسات المنزلية، الغرف الحسية |

الحماية على مستويين:
1. **Middleware** (`middleware.ts`) — NextAuth + مسارات مسموحة للأهل
2. **PermissionGate** — إخفاء UI حسب `lib/permissions.ts`

---

## 4. النشر على Vercel

### الخطوات

1. **ربط المستودع** في [vercel.com](https://vercel.com) → Import Project
2. **Framework Preset:** Next.js (تلقائي)
3. **Environment Variables:** انسخ من `.env.example` — Production + Preview
4. **Build Command:** `npm run build` (افتراضي)
5. **Output:** `.next` (افتراضي Next.js)
6. بعد النشر الأول، اضبط:
   - `NEXTAUTH_URL=https://<your-vercel-domain>.vercel.app`
   - `NEXT_PUBLIC_APP_URL` بنفس القيمة

### نشر محلي (Production)

```bash
npm run build
npm run start          # http://localhost:3000
# أو مع PM2:
# pm2 start npm --name taaluf -- start
```

### OneDrive / Windows

إذا فشل البناء بخطأ `EINVAL readlink` على `.next`:
```powershell
Remove-Item -Recurse -Force .next
npm run build
```

---

### ⚠️ تخزين `/hub` (clinical-hub + platform-hub)

| البيئة | المسار | ملاحظة |
|--------|--------|--------|
| محلي | `.data/*.json` | دائم على القرص |
| Vercel | `/tmp/taaluf-data` | **مؤقت** — يُفقد عند إعادة النشر أو cold start |
| تجاوز | `TAALUF_DATA_DIR` | مسار قابل للكتابة (مثلاً volume مرفق) |

**Pilot:** يكفي `/tmp` لاختبار MOU وغرفة الاجتماعات بين المشرفين.  
**إطلاق واسع:** انقل بيانات الـ hub إلى Airtable أو KV/S3 — لا تعتمد على ملفات JSON على serverless.

---

## 5. Smoke Test Checklist — ما بعد النشر

شغّل الخادم (`npm run start` أو بعد نشر Vercel)، ثم:

```bash
# محلي
node scripts/smoke-paths.mjs

# إنتاج
SMOKE_BASE=https://your-domain.com node scripts/smoke-paths.mjs
```

### قائمة التحقق اليدوية

- [ ] **الصفحة الرئيسية** `/` — تحميل بدون أخطاء، ظهور «تآلف»
- [ ] **تسجيل الدخول** — parent / specialist / admin
- [ ] **RoleSwitcher غير ظاهر** في production (تحقق من DevTools)
- [ ] **مسار الأهل** `/parent` → `/dashboard/screening` → إرسال فرز
- [ ] **التقييم** `/dashboard/assessments/new` — 36 مؤشر + تحليل AI
- [ ] **الغرفة المنزلية** `/dashboard/home-classroom` — جلسة + معزّز
- [ ] **الجناح الحسي** `/sensory-rooms` — فتح 8 غرف (bubbles → mirror)
- [ ] **ملف الطفل** `/dashboard/students/[id]` — تقرير سريري + PDF
- [ ] **اعتماد التقرير** — يظهر لـ SUPER_ADMIN فقط
- [ ] **لوحة الإدارة** `/admin` — محظورة لغير admin (middleware)
- [ ] **APIs** — `POST /api/screening`, `POST /api/parent-assessment`, `POST /api/gemini`

### حسابات تجريبية (Pilot)

| البريد | كلمة المرور | الدور |
|--------|-------------|--------|
| parent@taaluf.local | taaluf123 | ولي أمر |
| specialist@taaluf.local | taaluf123 | أخصائي |
| admin@taaluf.local | taaluf123 | إدارة |

> **تعطّل في الإنتاج** ما لم يكن `ALLOW_DEMO_USERS=true`.

---

## 6. حجم البناء والأداء (مرجع)

| المؤشر | القيمة |
|--------|--------|
| صفحات مُولَّدة | **91** route |
| First Load JS (مشترك) | **~87.5 kB** |
| Middleware | **~53.9 kB** |
| أثقل صفحة | `/dashboard/students/[id]` — **~216 kB** First Load |
| أثقل غرفة حسية | `/sensory-rooms/stars` — **~119 kB** |
| الغرفة المنزلية | `/dashboard/home-classroom` — **~206 kB** |
| التقييم الكامل | `/dashboard/assessments/new` — **~254 kB** |

الغرف الحسية (`/sensory-rooms/*`) مُولَّدة **statically** (○) — مناسبة للـ CDN.

---

## 7. استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| Build فشل ESLint | `npm run lint` — أصلح unused imports |
| `EINVAL readlink` | احذف `.next` وأعد البناء |
| NextAuth redirect loop | تأكد `NEXTAUTH_URL` = عنوان HTTPS الصحيح |
| Airtable 401 | تحقق `AIRTABLE_API_KEY` و Base ID |
| Gemini/OpenAI فارغ | تحقق المفاتيح؛ التقرير يعمل محلياً بدون AI جزئياً |
| RoleSwitcher في prod | يجب ألا يظهر — تحقق `NODE_ENV=production` |

---

## 8. أوامر مفيدة

```bash
npm run dev              # تطوير
npm run build            # بناء إنتاج
npm run start            # تشغيل البناء
npm test                 # اختبارات Jest
npm run verify:airtable  # اتصال Airtable
npm run create:airtable  # إنشاء جداول (مرة واحدة)
npm run predeploy        # فحص ما قبل النشر
```

---

**جاهزية الإطلاق:** بعد نجاح `npm test` + `npm run build` + Smoke Tests + ضبط env في Vercel.
