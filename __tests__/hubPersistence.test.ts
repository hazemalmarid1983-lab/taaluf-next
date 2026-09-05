import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import {
  CLINICAL_HUB_FILE,
  readHubJsonFile,
  writeHubJsonFile,
} from '../lib/hubPersistence';

describe('hubPersistence', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'taaluf-hub-'));
    process.env.TAALUF_DATA_DIR = tmpDir;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.VERCEL;
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    delete process.env.TAALUF_DATA_DIR;
  });

  it('reads and writes JSON via local filesystem fallback', async () => {
    const payload = { hello: 'world' };
    await writeHubJsonFile(CLINICAL_HUB_FILE, JSON.stringify(payload));
    const raw = await readHubJsonFile(CLINICAL_HUB_FILE);
    expect(JSON.parse(raw || '{}')).toEqual(payload);
  });
});
