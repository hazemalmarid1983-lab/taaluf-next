/**
 * Local dev on port 3010 (matches NEXTAUTH_URL in .env.local).
 * On Windows + OneDrive, `next dev` after `next build` can crash with EINVAL
 * readlink — remove production .next output first when detected.
 */
import { existsSync, rmSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const root = process.cwd();
const nextDir = path.join(root, '.next');
const prodMarker = path.join(nextDir, 'server', 'app', 'bookings.html');
const port = process.env.TAALUF_DEV_PORT || '3010';

if (process.platform === 'win32' && existsSync(prodMarker)) {
  console.log(
    '[taaluf] Removing production .next cache before dev (OneDrive-safe)…'
  );
  try {
    rmSync(nextDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch (err) {
    console.warn(
      '[taaluf] Could not remove .next — stop other Next.js processes, then retry.',
      err instanceof Error ? err.message : err
    );
  }
}

const result = spawnSync('npx', ['next', 'dev', '-p', port], {
  stdio: 'inherit',
  shell: true,
  cwd: root,
});

process.exit(result.status ?? 1);
