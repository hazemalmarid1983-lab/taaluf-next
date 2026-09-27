# Clinical Rules

- Hide "Add Student" buttons and registration forms in /dashboard/parent if child is already registered.
- Restrict parent interface strictly to: Progress tracking, session reports, and teacher messaging.
- Goal mastery follows the skill-type config in `lib/skillMastery.ts` (threshold, consecutive sessions, spacing, cold probe, distinct trainers/settings). Closed cognitive/language and self-help goals require 100% independence over 3 consecutive sessions; social goals 80% over 3 sessions across ≥2 trainers and ≥2 settings; self-regulation goals are frequency/duration based. Activity-level unlocks inside digital media keep 100% independence over 3 consecutive sessions.
- Generalization index (`lib/generalizationIndex.ts`): equal weights across person, place, and material; ≥85 fully generalized, ≥50 partial.
- EducationalIllustration components must match ABA targets across all domains.
- Free screening (`lib/screeningEngine.ts`) recommends a full assessment on any red-flag item (S8 response to name ≥2, S12 joint attention ≥2, S4 eye contact ≥2, S1 or S2 at 3), any dimension ≥67%, or an elevated overall score. Screening results must show the "not a diagnosis" notice and must not auto-redirect to pricing.
- Parent routes are enforced in middleware (`lib/parentRouteGuard.ts`): child-specific pages require a registered child; community pages are closed once a child is registered.
