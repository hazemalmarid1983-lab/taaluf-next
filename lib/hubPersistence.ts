import { getHubDataDir, isEphemeralHubStorage } from '@/lib/hubDataDir';

export function hubStorageMode(): 'local' | 'custom' | 'ephemeral' {
  if (isEphemeralHubStorage()) return 'ephemeral';
  if (process.env.TAALUF_DATA_DIR?.trim()) return 'custom';
  return 'local';
}

export function hubStorageIsEphemeral() {
  return isEphemeralHubStorage();
}

export function hubStorageDirectory() {
  return getHubDataDir();
}
