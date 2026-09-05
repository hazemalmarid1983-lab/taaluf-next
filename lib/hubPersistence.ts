import { promises as fs } from 'fs';
import path from 'path';
import { get, put } from '@vercel/blob';
import { getHubDataDir, isEphemeralHubStorage } from '@/lib/hubDataDir';
import { hubStorageNamespace } from '@/lib/platformEnvironment';

export const CLINICAL_HUB_FILE = 'clinical-hub.json';
export const PRIVILEGED_CREDENTIALS_FILE = 'privileged-credentials.json';

function blobPathname(filename: string) {
  return `${hubStorageNamespace()}/${filename}`;
}

function localPath(filename: string) {
  return path.join(getHubDataDir(), filename);
}

export function hubBlobEnabled() {
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) return true;
  // Vercel linked Blob stores inject BLOB_STORE_ID + OIDC auth at runtime.
  if (process.env.VERCEL === '1' && process.env.BLOB_STORE_ID?.trim()) return true;
  return false;
}

export function hubStorageIsEphemeral() {
  return isEphemeralHubStorage() && !hubBlobEnabled();
}

/** On Vercel, reload from durable storage on every request to avoid stale lambdas. */
export function hubReloadEachRequest() {
  return process.env.VERCEL === '1' || hubBlobEnabled();
}

async function readFromBlob(filename: string): Promise<string | null> {
  if (!hubBlobEnabled()) return null;
  try {
    const result = await get(blobPathname(filename), {
      access: 'private',
      useCache: false,
    });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return await new Response(result.stream).text();
  } catch {
    return null;
  }
}

async function writeToBlob(filename: string, body: string): Promise<boolean> {
  if (!hubBlobEnabled()) return false;
  try {
    await put(blobPathname(filename), body, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
    return true;
  } catch {
    return false;
  }
}

export async function readHubJsonFile(filename: string): Promise<string | null> {
  const fromBlob = await readFromBlob(filename);
  if (fromBlob != null) return fromBlob;
  try {
    return await fs.readFile(localPath(filename), 'utf8');
  } catch {
    return null;
  }
}

export async function writeHubJsonFile(
  filename: string,
  body: string
): Promise<void> {
  const wroteBlob = await writeToBlob(filename, body);
  if (wroteBlob) return;
  const filePath = localPath(filename);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, body, 'utf8');
}

export function hubStorageMode(): 'blob' | 'filesystem' {
  return hubBlobEnabled() ? 'blob' : 'filesystem';
}
