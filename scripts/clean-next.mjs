import { existsSync, rmSync } from 'fs';
import path from 'path';

const nextDir = path.join(process.cwd(), '.next');
if (!existsSync(nextDir)) {
  process.exit(0);
}

rmSync(nextDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
console.log('[taaluf] Removed .next');
