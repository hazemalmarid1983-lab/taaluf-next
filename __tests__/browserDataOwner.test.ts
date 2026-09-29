import {
  BROWSER_OWNER_KEY,
  browserOwnerKey,
  ensureBrowserDataOwner,
} from '@/lib/browserDataOwner';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    key: (i: number) => [...data.keys()][i] ?? null,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    dump: () => Object.fromEntries(data),
  };
}

const previousChild = {
  'taaluf.activeStudent': JSON.stringify({ id: 'rec123', name: 'معاويه' }),
  'taaluf.screening.v1': '{}',
  taaluf_consented: 'true',
  taaluf_lang: 'ar',
  'other.app': 'keep',
};

describe('browserOwnerKey', () => {
  it('prefers normalized email, falls back to id', () => {
    expect(browserOwnerKey({ email: ' Saja@Example.com ', id: 'usr_1' })).toBe('saja@example.com');
    expect(browserOwnerKey({ id: 'usr_1' })).toBe('usr_1');
    expect(browserOwnerKey(null)).toBe('');
  });
});

describe('ensureBrowserDataOwner', () => {
  it('wipes another account child data for a new user but keeps device preferences', () => {
    const local = memoryStorage({ ...previousChild, [BROWSER_OWNER_KEY]: 'old@example.com' });
    const session = memoryStorage({ 'taaluf.parentAssessment.draft': '{}' });

    expect(ensureBrowserDataOwner('saja@example.com', [local, session])).toBe(true);
    expect(local.dump()).toEqual({
      taaluf_lang: 'ar',
      'other.app': 'keep',
      [BROWSER_OWNER_KEY]: 'saja@example.com',
    });
    expect(session.dump()).toEqual({});
  });

  it('treats unowned legacy data as foreign', () => {
    const local = memoryStorage(previousChild);
    expect(ensureBrowserDataOwner('saja@example.com', [local])).toBe(true);
    expect(local.getItem('taaluf.activeStudent')).toBeNull();
  });

  it('keeps data when the same account returns', () => {
    const local = memoryStorage({ ...previousChild, [BROWSER_OWNER_KEY]: 'saja@example.com' });
    expect(ensureBrowserDataOwner('saja@example.com', [local])).toBe(false);
    expect(local.getItem('taaluf.activeStudent')).toContain('معاويه');
  });

  it('does nothing without an owner key', () => {
    const local = memoryStorage(previousChild);
    expect(ensureBrowserDataOwner('', [local])).toBe(false);
    expect(local.getItem('taaluf.activeStudent')).not.toBeNull();
  });
});
