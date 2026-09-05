import {
  assertContractSigned,
  checkContractGate,
  contractGateLabel,
} from '../lib/contracts/contractGate';
import {
  CONTRACT_STORAGE_KEY,
  saveContract,
  __writeContractMapForTests,
} from '../lib/contracts/contractStore';

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  Object.defineProperty(global, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => memory.set(k, String(v)),
      removeItem: (k: string) => memory.delete(k),
    },
  });
  __writeContractMapForTests({});
});

describe('contractGate', () => {
  it('blocks home session when contract is pending', () => {
    const gate = checkContractGate('child_1', 'home_session');
    expect(gate.allowed).toBe(false);
    expect(gate.status).toBe('pending');
    expect(gate.contractType).toBe('parent');
    expect(gate.messageAr).toContain('الغرفة المنزلية');
  });

  it('blocks clinical report export when contract is pending', () => {
    const gate = checkContractGate('child_1', 'clinical_report_export');
    expect(gate.allowed).toBe(false);
    expect(gate.messageEn).toContain('parent agreement');
  });

  it('allows actions after electronic signature', () => {
    saveContract({
      childId: 'child_1',
      contractType: 'parent',
      status: 'signed_electronic',
      templateVersion: '2026.1',
      signerName: 'أحمد',
      signerRole: 'ولي أمر',
      signedAt: '2026-09-03T12:00:00.000Z',
      signatureImageBase64: 'data:image/png;base64,abc',
    });

    expect(assertContractSigned('child_1', 'home_session')).toBe(true);
    expect(checkContractGate('child_1', 'clinical_report_export').allowed).toBe(
      true
    );
  });

  it('allows actions after paper signature upload', () => {
    saveContract({
      childId: 'child_2',
      contractType: 'parent',
      status: 'signed_paper',
      templateVersion: '2026.1',
      signerName: 'سارة',
      signerRole: 'ولي أمر',
      signedAt: '2026-09-03T13:00:00.000Z',
      scannedCopyBase64: 'data:image/jpeg;base64,scan',
    });

    expect(assertContractSigned('child_2', 'home_session')).toBe(true);
  });

  it('blocks when childId is missing', () => {
    const gate = checkContractGate('', 'home_session');
    expect(gate.allowed).toBe(false);
    expect(gate.messageAr).toContain('ملف الطفل');
  });

  it('returns localized gate label', () => {
    const gate = checkContractGate('child_x', 'home_session');
    expect(contractGateLabel(gate, true)).toBe(gate.messageAr);
    expect(contractGateLabel(gate, false)).toBe(gate.messageEn);
  });

  it('persists signed contract in localStorage map', () => {
    saveContract({
      childId: 'child_3',
      contractType: 'parent',
      status: 'signed_electronic',
      templateVersion: '2026.1',
      signerName: 'Test',
      signerRole: 'Parent',
      signedAt: new Date().toISOString(),
    });
    const raw = memory.get(CONTRACT_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const map = JSON.parse(String(raw));
    expect(map['child_3:parent'].status).toBe('signed_electronic');
  });
});

describe('contract templates', () => {
  it('defines parent and provider agreement clauses', () => {
    const { PARENT_AGREEMENT, PROVIDER_AGREEMENT } = require('../lib/contracts/contractTemplates');
    expect(PARENT_AGREEMENT.clauses.length).toBeGreaterThanOrEqual(5);
    expect(PROVIDER_AGREEMENT.clauses.length).toBeGreaterThanOrEqual(4);
    expect(PARENT_AGREEMENT.clauses.some((c: { id: string }) => c.id === 'sensory_rooms')).toBe(true);
    expect(PROVIDER_AGREEMENT.clauses.some((c: { id: string }) => c.id === 'documentation')).toBe(true);
  });
});
