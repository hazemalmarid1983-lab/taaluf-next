'use client';

import ParentPricingCards from '@/components/access/ParentPricingCards';
import { useLanguage } from '@/components/LanguageProvider';
import { localizePlanName } from '@/lib/i18n/pricingI18n';
import { TAALUF_PRICING } from '@/lib/pricingConfig';

export default function PricingCatalog() {
  const { lang, t } = useLanguage();

  return (
    <div className="space-y-14">
      <ParentPricingCards />

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[#0b1f14]">{t('specialistBundles')}</h2>
        <p className="text-sm text-slate-500">{t('specialistBundlesLead')}</p>
        <div className="grid gap-4 md:grid-cols-3">
          {TAALUF_PRICING.specialistBundles.map((plan) => (
            <article
              key={plan.id}
              className={`rounded-2xl border bg-white p-6 ${
                plan.recommended ? 'border-[#2E7D8E]/40' : 'border-slate-100'
              }`}
            >
              {plan.recommended ? (
                <p className="text-xs font-bold text-[#2E7D8E]">{t('recommendedStart')}</p>
              ) : null}
              <h3 className="mt-1 text-lg font-bold text-[#0b1f14]">
                {localizePlanName(plan.name, lang)}
              </h3>
              <p className="mt-2 text-2xl font-bold text-[#2E7D8E]">
                {plan.priceOMR} {t('omr')}
              </p>
              <p className="text-xs text-slate-400">
                {t('usdAndCase', { usd: plan.priceUSD, omr: plan.costPerCaseOMR })}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[#0b1f14]">{t('centerPlans')}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {TAALUF_PRICING.centers.map((plan) => (
            <article
              key={plan.id}
              className={`rounded-2xl border bg-white p-6 ${
                plan.recommended ? 'border-[#2D8B5A]/40' : 'border-slate-100'
              }`}
            >
              <h3 className="text-lg font-bold text-[#0b1f14]">
                {localizePlanName(plan.name, lang)}
              </h3>
              <p className="mt-1 text-xs text-slate-500">{plan.capacity}</p>
              <p className="mt-2 text-2xl font-bold text-[#2D8B5A]">
                {plan.priceMonthlyOMR} {t('omr')}
                <span className="text-sm font-normal text-slate-400"> {t('perMonth')}</span>
              </p>
              <p className="text-xs text-slate-400">
                {t('orAnnual', { price: plan.priceAnnualOMR })}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[#2E7D8E]/20 bg-[#F0FDFA] p-6">
        <h2 className="text-xl font-bold text-[#0b1f14]">{t('clinicLicense')}</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          {t('clinicLicenseBody', {
            monthly: TAALUF_PRICING.clinicLicense.monthlyOMR,
            annual: TAALUF_PRICING.clinicLicense.annualOMR,
            share: TAALUF_PRICING.clinicLicense.affiliateSharePercent,
          })}
        </p>
      </section>
    </div>
  );
}
