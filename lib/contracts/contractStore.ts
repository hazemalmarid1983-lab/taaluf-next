/**
 * تخزين العقود الموقّعة — محلي (قابل للربط بـ API/Airtable لاحقاً).
 */

import type { ContractType } from './contractTemplates';
import { CONTRACT_TEMPLATE_VERSION } from './contractTemplates';

export const CONTRACT_STORAGE_KEY = 'taaluf.contracts.v1';

export type ContractStatus = 'pending' | 'signed_electronic' | 'signed_paper';

export type SignedContractRecord = {
  childId: string;
  contractType: ContractType;
  status: ContractStatus;
  templateVersion: string;
  signerName: string;
  signerRole: string;
  signedAt: string;
  signatureImageBase64?: string;
  scannedCopyBase64?: string;
  childName?: string;
  providerName?: string;
};

function storageKey(childId: string, contractType: ContractType) {
  return `${childId}:${contractType}`;
}

function readMap(): Record<string, SignedContractRecord> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CONTRACT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SignedContractRecord>) : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, SignedContractRecord>) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CONTRACT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}

export function loadContract(
  childId: string,
  contractType: ContractType = 'parent'
): SignedContractRecord | null {
  if (typeof localStorage === 'undefined') return null;
  const map = readMap();
  return map[storageKey(childId, contractType)] ?? null;
}

export function saveContract(record: SignedContractRecord) {
  const map = readMap();
  map[storageKey(record.childId, record.contractType)] = record;
  writeMap(map);
}

export function getContractStatus(
  childId: string,
  contractType: ContractType = 'parent'
): ContractStatus {
  const record = loadContract(childId, contractType);
  if (!record) return 'pending';
  return record.status;
}

export function isContractSigned(
  childId: string,
  contractType: ContractType = 'parent'
): boolean {
  const status = getContractStatus(childId, contractType);
  return status === 'signed_electronic' || status === 'signed_paper';
}

export function createPendingContract(
  childId: string,
  contractType: ContractType,
  meta?: { childName?: string; providerName?: string }
): SignedContractRecord {
  return {
    childId,
    contractType,
    status: 'pending',
    templateVersion: CONTRACT_TEMPLATE_VERSION,
    signerName: '',
    signerRole: '',
    signedAt: '',
    childName: meta?.childName,
    providerName: meta?.providerName,
  };
}

export function listContractsForChild(childId: string): SignedContractRecord[] {
  const map = readMap();
  return Object.values(map).filter((r) => r.childId === childId);
}

/** للاختبارات — حقن/قراءة الخريطة مباشرة */
export function __readContractMapForTests(): Record<string, SignedContractRecord> {
  return readMap();
}

export function __writeContractMapForTests(map: Record<string, SignedContractRecord>) {
  writeMap(map);
}
