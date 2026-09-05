/**
 * Shared Airtable schema provisioning for TaalofDB.
 */

type FieldConfig = {
  name: string;
  type: string;
  options?: Record<string, unknown>;
};

type MetaTable = {
  id: string;
  name: string;
  fields: Array<{ id: string; name: string; type: string }>;
};

const DATE_OPTS = {
  dateFormat: { name: 'iso' as const },
};

const DATETIME_OPTS = {
  timeZone: 'Asia/Riyadh',
  dateFormat: { name: 'iso' as const },
  timeFormat: { name: '24hour' as const },
};

const NUMBER_OPTS = { precision: 0 };
const NUMBER_DEC_OPTS = { precision: 2 };
const CHECKBOX_OPTS = { color: 'greenBright', icon: 'check' };

function select(choices: string[]): FieldConfig['options'] {
  return {
    choices: choices.map((name) => ({ name })),
  };
}

function link(tableId: string): FieldConfig['options'] {
  return { linkedTableId: tableId };
}

async function api(
  method: string,
  path: string,
  apiKey: string,
  body?: unknown
): Promise<unknown> {
  const res = await fetch(`https://api.airtable.com/v0/meta${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      typeof data === 'object' && data && 'error' in data
        ? JSON.stringify((data as { error: unknown }).error)
        : text;
    throw new Error(`${method} ${path} → ${res.status}: ${msg}`);
  }
  return data;
}

export async function fetchTables(
  apiKey: string,
  baseId: string
): Promise<MetaTable[]> {
  const data = (await api('GET', `/bases/${baseId}/tables`, apiKey)) as {
    tables: MetaTable[];
  };
  return data.tables || [];
}

export async function listBases(apiKey: string) {
  const data = (await api('GET', '/bases', apiKey)) as {
    bases: { id: string; name: string }[];
  };
  return data.bases || [];
}

export async function resolveWorkspaceForBase(apiKey: string, baseId: string) {
  try {
    const data = (await api('GET', `/bases/${baseId}`, apiKey)) as {
      workspaceId?: string;
    };
    return data.workspaceId?.trim() || null;
  } catch {
    return null;
  }
}

async function createTable(
  apiKey: string,
  baseId: string,
  name: string,
  fields: FieldConfig[]
): Promise<MetaTable> {
  return (await api('POST', `/bases/${baseId}/tables`, apiKey, {
    name,
    fields,
  })) as MetaTable;
}

async function createField(
  apiKey: string,
  baseId: string,
  tableId: string,
  field: FieldConfig
): Promise<void> {
  await api('POST', `/bases/${baseId}/tables/${tableId}/fields`, apiKey, field);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ensureTable(
  apiKey: string,
  baseId: string,
  byName: Map<string, MetaTable>,
  name: string,
  fields: FieldConfig[]
): Promise<MetaTable> {
  const existing = byName.get(name);
  if (existing) {
    const have = new Set(existing.fields.map((f) => f.name));
    const missing = fields.filter((f) => !have.has(f.name));
    for (const field of missing) {
      console.log(`   ➕ إضافة حقل ${name}.${field.name}`);
      await createField(apiKey, baseId, existing.id, field);
      await sleep(250);
    }
    if (missing.length === 0) {
      console.log(`⏭  ${name} — موجود مسبقاً`);
    } else {
      console.log(`✅ ${name} — اكتملت الحقول الناقصة (${missing.length})`);
    }
    const refreshed = await fetchTables(apiKey, baseId);
    for (const t of refreshed) byName.set(t.name, t);
    return byName.get(name)!;
  }

  console.log(`🆕 إنشاء جدول ${name}…`);
  const created = await createTable(apiKey, baseId, name, fields);
  byName.set(created.name, created);
  console.log(`✅ ${name}`);
  await sleep(350);
  return created;
}

export async function provisionTaalofTables(apiKey: string, baseId: string) {
  let tables = await fetchTables(apiKey, baseId);
  const byName = new Map(tables.map((t) => [t.name, t]));

  await ensureTable(apiKey, baseId, byName, 'Students', [
    { name: 'Name', type: 'singleLineText' },
    { name: 'DOB', type: 'date', options: DATE_OPTS },
    { name: 'Gender', type: 'singleLineText' },
    { name: 'ParentName', type: 'singleLineText' },
    { name: 'ParentPhone', type: 'singleLineText' },
    { name: 'ParentEmail', type: 'singleLineText' },
    { name: 'Status', type: 'singleLineText' },
    { name: 'Notes', type: 'multilineText' },
  ]);

  await ensureTable(apiKey, baseId, byName, 'Specialists', [
    { name: 'Name', type: 'singleLineText' },
    { name: 'Email', type: 'email' },
    { name: 'PasswordHash', type: 'singleLineText' },
    { name: 'Specialty', type: 'singleLineText' },
  ]);

  const studentsId = byName.get('Students')!.id;
  const specialistsId = byName.get('Specialists')!.id;

  await ensureTable(apiKey, baseId, byName, 'Assessments', [
    { name: 'Classification', type: 'singleLineText' },
    { name: 'Student', type: 'multipleRecordLinks', options: link(studentsId) },
    {
      name: 'Specialist',
      type: 'multipleRecordLinks',
      options: link(specialistsId),
    },
    { name: 'AssessmentDate', type: 'dateTime', options: DATETIME_OPTS },
    { name: 'TotalScore', type: 'number', options: NUMBER_DEC_OPTS },
    { name: 'MaxScore', type: 'number', options: NUMBER_DEC_OPTS },
    { name: 'ScoresJSON', type: 'multilineText' },
    { name: 'Status', type: 'singleLineText' },
  ]);

  const assessmentsId = byName.get('Assessments')!.id;

  await ensureTable(apiKey, baseId, byName, 'AssessmentCriteria', [
    { name: 'CriterionCode', type: 'singleLineText' },
    {
      name: 'Assessment',
      type: 'multipleRecordLinks',
      options: link(assessmentsId),
    },
    { name: 'Domain', type: 'singleLineText' },
    { name: 'CriterionName', type: 'singleLineText' },
    { name: 'Score', type: 'number', options: NUMBER_OPTS },
  ]);

  await ensureTable(apiKey, baseId, byName, 'Reports', [
    { name: 'Summary', type: 'multilineText' },
    {
      name: 'Assessment',
      type: 'multipleRecordLinks',
      options: link(assessmentsId),
    },
    { name: 'PDFUrl', type: 'url' },
    { name: 'CreatedAt', type: 'dateTime', options: DATETIME_OPTS },
  ]);

  await ensureTable(apiKey, baseId, byName, 'ParentSurveys', [
    { name: 'ParentName', type: 'singleLineText' },
    { name: 'Student', type: 'multipleRecordLinks', options: link(studentsId) },
    { name: 'TotalScore', type: 'number', options: NUMBER_DEC_OPTS },
    { name: 'SubmittedAt', type: 'dateTime', options: DATETIME_OPTS },
  ]);

  await ensureTable(apiKey, baseId, byName, 'GameSessions', [
    { name: 'child_id', type: 'singleLineText' },
    { name: 'game_code', type: 'singleLineText' },
    { name: 'score', type: 'number', options: NUMBER_DEC_OPTS },
    { name: 'level_reached', type: 'number', options: NUMBER_OPTS },
    { name: 'metrics_json', type: 'multilineText' },
    { name: 'trials_json', type: 'multilineText' },
    { name: 'started_at', type: 'dateTime', options: DATETIME_OPTS },
    { name: 'ended_at', type: 'dateTime', options: DATETIME_OPTS },
  ]);

  await ensureTable(apiKey, baseId, byName, 'Consents', [
    { name: 'User', type: 'singleLineText' },
    { name: 'Child', type: 'singleLineText' },
    { name: 'ConsentType', type: 'singleLineText' },
    { name: 'ConsentText', type: 'multilineText' },
    { name: 'AcceptedAt', type: 'dateTime', options: DATETIME_OPTS },
    { name: 'IPAddress', type: 'singleLineText' },
  ]);

  await ensureTable(apiKey, baseId, byName, 'AuditLog', [
    { name: 'User', type: 'singleLineText' },
    {
      name: 'Action',
      type: 'singleSelect',
      options: select([
        'login',
        'logout',
        'create_student',
        'create_assessment',
        'view_report',
        'delete_data',
        'consent_accepted',
      ]),
    },
    { name: 'EntityType', type: 'singleLineText' },
    { name: 'EntityId', type: 'singleLineText' },
    { name: 'IPAddress', type: 'singleLineText' },
    { name: 'Timestamp', type: 'dateTime', options: DATETIME_OPTS },
    { name: 'UserAgent', type: 'singleLineText' },
  ]);

  await ensureTable(apiKey, baseId, byName, 'Payments', [
    { name: 'chargeId', type: 'singleLineText' },
    { name: 'userId', type: 'singleLineText' },
    { name: 'childId', type: 'singleLineText' },
    { name: 'amount', type: 'number', options: NUMBER_DEC_OPTS },
    {
      name: 'currency',
      type: 'singleSelect',
      options: select(['SAR', 'AED', 'EGP', 'USD']),
    },
    {
      name: 'status',
      type: 'singleSelect',
      options: select(['pending', 'captured', 'failed', 'refunded']),
    },
    { name: 'description', type: 'singleLineText' },
    { name: 'createdAt', type: 'dateTime', options: DATETIME_OPTS },
  ]);

  await ensureTable(apiKey, baseId, byName, 'Messages', [
    { name: 'From', type: 'singleLineText' },
    { name: 'To', type: 'singleLineText' },
    { name: 'ChildId', type: 'singleLineText' },
    { name: 'Body', type: 'multilineText' },
    { name: 'Read', type: 'checkbox', options: CHECKBOX_OPTS },
    { name: 'CreatedAt', type: 'dateTime', options: DATETIME_OPTS },
  ]);

  await ensureTable(apiKey, baseId, byName, 'Goals', [
    { name: 'childId', type: 'singleLineText' },
    { name: 'criterionId', type: 'singleLineText' },
    { name: 'title', type: 'singleLineText' },
    { name: 'domain', type: 'singleLineText' },
    { name: 'baseline', type: 'number', options: NUMBER_OPTS },
    { name: 'target', type: 'number', options: NUMBER_OPTS },
    { name: 'current', type: 'number', options: NUMBER_OPTS },
    { name: 'status', type: 'singleLineText' },
    { name: 'sessions_json', type: 'multilineText' },
  ]);
}

export async function createPreviewBase(
  apiKey: string,
  workspaceId: string,
  name: string
) {
  const created = (await api('POST', '/bases', apiKey, {
    workspaceId,
    name,
    tables: [
      {
        name: 'Students',
        description: 'Preview sandbox — not production data',
        fields: [{ name: 'Name', type: 'singleLineText' }],
      },
    ],
  })) as { id: string };
  return created.id;
}
