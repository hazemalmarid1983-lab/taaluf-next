import fs from 'fs';

const t = fs.readFileSync('.env.vercel.check', 'utf8');
for (const line of t.split(/\r?\n/)) {
  if (
    line.startsWith('NEXTAUTH_URL=') ||
    line.startsWith('NEXT_PUBLIC_APP_URL=')
  ) {
    const i = line.indexOf('=');
    const k = line.slice(0, i);
    let val = line.slice(i + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    console.log(
      k,
      'len=' + val.length,
      'preview=' + JSON.stringify(val.slice(0, 48)),
      'ok=' + (val === 'https://taaluf-next.vercel.app')
    );
  }
}
