# Clinical Rules

- Hide "Add Student" buttons and registration forms in /dashboard/parent if child is already registered.
- Restrict parent interface strictly to: Progress tracking, session reports, and teacher messaging.
- Goal mastery follows the skill-type config in `lib/skillMastery.ts` (threshold, consecutive sessions, spacing, cold probe, distinct trainers/settings). Closed cognitive/language and self-help goals require 100% independence over 3 consecutive sessions; social goals 80% over 3 sessions across ≥2 trainers and ≥2 settings; self-regulation goals are frequency/duration based. Activity-level unlocks inside digital media keep 100% independence over 3 consecutive sessions.
- Generalization index (`lib/generalizationIndex.ts`): equal weights across person, place, and material; ≥85 fully generalized, ≥50 partial.
- EducationalIllustration components must match ABA targets across all domains.
