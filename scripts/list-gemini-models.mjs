import fs from 'fs';

const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const key = env.GEMINI_API_KEY;
if (!key) {
  console.error('NO_KEY');
  process.exit(1);
}

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`
);
const text = await res.text();
if (!res.ok) {
  console.error('LIST_FAIL', res.status, text.slice(0, 400));
  process.exit(1);
}
const data = JSON.parse(text);
const withGen = (data.models || [])
  .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
  .map((m) => m.name.replace(/^models\//, ''));
console.log(withGen.join('\n'));
console.log('COUNT', withGen.length);
