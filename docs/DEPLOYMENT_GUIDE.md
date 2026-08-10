# دليل النشر — منصة تآلف

## 1. Vercel Setup

1. Go to vercel.com → New Project → Import from GitHub
2. Select `taaluf-next` repository
3. Framework: Next.js (auto-detected)
4. Root Directory: `./` (default)
5. Build Command: `npm run build` (auto)
6. Output Directory: `.next` (auto)

## 2. Environment Variables

Add ALL variables from `.env.production.example` in Vercel → Settings → Environment Variables

- Set for: Production + Preview + Development
- Critical: `NEXTAUTH_URL` must be your Vercel domain (`https://taaluf.vercel.app` or custom domain)

## 3. Airtable Setup

1. Create base `TaalofDB` at airtable.com
2. Create all tables (see `npx tsx scripts/setup-airtable-guide.ts`)
3. Generate Personal Access Token at airtable.com/create/tokens
4. Set scopes: `data.records:read`, `data.records:write`, `schema.bases:read`
5. Add `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` to Vercel env vars
6. Verify: `npx tsx scripts/verify-airtable.ts`

## 4. Tap Payments Setup

1. Create account at dashboard.tap.company
2. Get API keys (sandbox first, then production)
3. Set `TAP_SECRET_KEY`, `TAP_PUBLIC_KEY`, `TAP_ENVIRONMENT` in Vercel
4. Configure webhook URL: `https://yourdomain.com/api/payments/webhook`
5. Test with sandbox: use test card `4111 1111 1111 1111`

## 5. Custom Domain (optional but recommended)

1. Buy domain (`taaluf.app` / `taaluf.com`)
2. Vercel → Settings → Domains → Add
3. Add DNS records as instructed by Vercel
4. Update `NEXTAUTH_URL` to custom domain
5. SSL is automatic via Vercel

## 6. Pre-deploy Checklist

- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] `npm run lint` passes
- [ ] `npx tsx scripts/security-audit.ts` reviewed
- [ ] `npx tsx scripts/predeploy-check.ts` reviewed
- [ ] All env vars set in Vercel
- [ ] Airtable tables created and verified
- [ ] Tap webhook configured
- [ ] No `console.log` in production app code
- [ ] No hardcoded localhost in app/lib/components
- [ ] `.gitignore` correct

## 7. Deploy

1. Push to `main` branch → Vercel auto-deploys
2. OR: Vercel CLI → `vercel --prod`
3. Check deployment logs for errors
4. Test: visit the URL, try to register/login, screening

## 8. Post-deploy

1. Test full flow: register → consent → screening → assessment → report
2. Test payment (sandbox then production): select assessment → pay → callback
3. Test: specialist role → view student → review report
4. Test: admin → overview → analytics
5. Monitor Vercel logs for first 24 hours
6. Set up Vercel alerts (email on deployment failure)

## Useful scripts

```bash
npx tsx scripts/setup-airtable-guide.ts
npx tsx scripts/verify-airtable.ts
npx tsx scripts/security-audit.ts
npx tsx scripts/predeploy-check.ts
npm test && npm run lint && npm run build
```
