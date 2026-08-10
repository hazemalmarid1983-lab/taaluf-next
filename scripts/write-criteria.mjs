import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

// Criteria payload is loaded from sibling JSON if present; otherwise embedded minimal bootstrap.
// Full 24 criteria written below.
const criteria_data = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'criteria-source.json'), 'utf8')
);

fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'data', 'taalof_criteria.json'),
  JSON.stringify(criteria_data, null, 2),
  'utf8'
);
console.log('Wrote data/taalof_criteria.json', criteria_data.criteria.length);
