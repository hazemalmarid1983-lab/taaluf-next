// Removes self-signup test accounts (default prefix "qa-signup-") from user-accounts.json.
// Dry run by default; pass --apply to write.
// Usage:
//   node scripts/cleanup-qa-accounts.mjs [--tier=production|preview|development] [--prefix=qa-signup-] [--apply]
// Blob mode needs BLOB_READ_WRITE_TOKEN (e.g. `vercel env pull .env.local`); otherwise the local
// data dir (TAALUF_DATA_DIR or .data) is used.
import { promises as fs } from 'fs';
import path from 'path';
import { get, put } from '@vercel/blob';

for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile?.(file);
  } catch {}
}

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const apply = args.includes('--apply');
const tier = flag('tier', 'production');
const prefix = flag('prefix', 'qa-signup-').toLowerCase();
const FILE = 'user-accounts.json';

if (prefix.length < 4) {
  console.error('Refusing to run with a prefix shorter than 4 characters.');
  process.exit(1);
}

const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
const blobPath = `taaluf-data/${tier}/${FILE}`;
const localPath = path.join(process.env.TAALUF_DATA_DIR?.trim() || path.join(process.cwd(), '.data'), FILE);

async function read() {
  if (useBlob) {
    const res = await get(blobPath, { access: 'private', useCache: false });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    return new Response(res.stream).text();
  }
  return fs.readFile(localPath, 'utf8').catch(() => null);
}

async function write(body) {
  if (useBlob) {
    await put(blobPath, body, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
    return;
  }
  await fs.writeFile(localPath, body, 'utf8');
}

console.log(`Source: ${useBlob ? `blob ${blobPath}` : `file ${localPath}`}`);
const raw = await read();
if (!raw) {
  console.log('No accounts file found — nothing to do.');
  process.exit(0);
}

const parsed = JSON.parse(raw);
const accounts = Array.isArray(parsed?.accounts) ? parsed.accounts : [];
const matches = (row) => String(row?.email || '').toLowerCase().startsWith(prefix);
const removed = accounts.filter(matches);
const kept = accounts.filter((row) => !matches(row));

console.log(`Total: ${accounts.length}  matching "${prefix}": ${removed.length}  kept: ${kept.length}`);
for (const row of removed) console.log(`  - ${row.email} (${row.role}, ${row.createdAt})`);

if (!removed.length) process.exit(0);
if (!apply) {
  console.log('Dry run — re-run with --apply to delete.');
  process.exit(0);
}

await write(JSON.stringify({ ...parsed, accounts: kept }));
console.log(`Deleted ${removed.length} account(s).`);
