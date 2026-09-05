/**
 * Production deploy gate — runs safety checks then `vercel --prod`.
 * Usage: npm run deploy:prod
 */

import { execSync } from 'child_process';
import { loadEnvFiles } from './load-env';
import {
  isProductionPlatform,
  previewUsesProductionAirtable,
} from '../lib/platformEnvironment';

loadEnvFiles();

function fail(msg: string) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

function main() {
  console.log('\n━━━ Taaluf production deploy gate ━━━\n');

  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    fail(
      `VERCEL_ENV=${process.env.VERCEL_ENV} — run deploy:prod from local CLI, not from a Preview build.`
    );
  }

  if (previewUsesProductionAirtable()) {
    fail(
      'AIRTABLE_BASE_ID matches AIRTABLE_PRODUCTION_BASE_ID outside production. ' +
        'Use a separate Airtable base for Preview/Development.'
    );
  }

  if (process.env.MAINTENANCE_MODE === 'true') {
    console.warn('⚠️  MAINTENANCE_MODE=true — users will see the maintenance page.');
  }

  try {
    execSync('npm test -- --passWithNoTests', { stdio: 'inherit' });
  } catch {
    fail('Tests failed — fix before production deploy.');
  }

  console.log('\n→ Deploying to Vercel production…\n');
  execSync('npx vercel --prod --yes', { stdio: 'inherit' });
  console.log('\n✅ Production deploy finished.\n');
}

main();
