# قائمة الإطلاق التجريبي — منصة تآلف

## Clinical (10)

- [ ] All 36 criteria reviewed by clinical lead
- [ ] 20 parent items reviewed for clarity
- [ ] 12 screening items validated
- [ ] Classification bands reviewed (طبيعي→شديد جداً)
- [ ] Goal generation tested with real scores
- [ ] Report language reviewed (no medical terms)
- [ ] Disclaimers visible in all 5 locations
- [ ] Age band filtering tested (3yo vs 12yo)
- [ ] Fusion weights reviewed (2:1:1.5)
- [ ] AI prompt reviewed for educational tone

## Security (10)

- [ ] bcrypt active for all passwords
- [ ] JWT expiry configured
- [ ] Rate limiting on auth + AI endpoints
- [ ] No secrets in client code
- [ ] CORS locked to production domain
- [ ] `.gitignore` verified
- [ ] AuditLog recording all actions
- [ ] Consent required before assessment
- [ ] Data deletion functional
- [ ] Security audit script passes

## Functional (10)

- [ ] Register → login → logout works
- [ ] Screening flow → results → recommendation
- [ ] Specialist assessment → 36 items → scoring → classification
- [ ] Parent questionnaire → 20 items → mapped to criteria
- [ ] Games: imitation + visual tracking → data saved
- [ ] Report: fusion → all tabs → PDF export
- [ ] Goals: generated → tracked → progress logged
- [ ] Messages: send → receive → mark read
- [ ] Payment: Tap checkout → callback → entitlements
- [ ] Admin: overview → students → specialists

## UX (10)

- [ ] RTL throughout
- [ ] Fonts load (Cairo)
- [ ] Mobile responsive (375px)
- [ ] Tablet responsive (768px)
- [ ] Desktop (1920px)
- [ ] No horizontal scroll on mobile
- [ ] Touch targets ≥ 44px
- [ ] Focus rings visible
- [ ] Loading states present
- [ ] Error messages in Arabic

## Launch (10)

- [ ] Vercel deployed
- [ ] Airtable connected
- [ ] Tap payments live
- [ ] Custom domain configured
- [ ] SSL active
- [ ] 10 pilot families invited
- [ ] 2 specialists onboarded
- [ ] Monitoring dashboard checked
- [ ] Support channel ready (email/WhatsApp)
- [ ] Feedback form prepared
