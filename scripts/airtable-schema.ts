/** مخطط جداول Airtable المتوقع لمنصة تآلف */

export type ExpectedField = {
  name: string;
  type: string;
  note?: string;
};

export type ExpectedTable = {
  name: string;
  fields: ExpectedField[];
};

export const EXPECTED_TABLES: ExpectedTable[] = [
  {
    name: 'Students',
    fields: [
      { name: 'Name', type: 'singleLineText' },
      { name: 'DOB', type: 'date' },
      { name: 'Gender', type: 'singleLineText' },
      { name: 'ParentName', type: 'singleLineText' },
      { name: 'ParentPhone', type: 'singleLineText' },
      { name: 'ParentEmail', type: 'singleLineText' },
      { name: 'Status', type: 'singleLineText' },
      { name: 'Notes', type: 'multilineText' },
    ],
  },
  {
    name: 'Specialists',
    fields: [
      { name: 'Name', type: 'singleLineText' },
      { name: 'Email', type: 'email' },
      { name: 'PasswordHash', type: 'singleLineText' },
      { name: 'Specialty', type: 'singleLineText' },
    ],
  },
  {
    name: 'Assessments',
    fields: [
      { name: 'Student', type: 'multipleRecordLinks' },
      { name: 'Specialist', type: 'multipleRecordLinks' },
      { name: 'AssessmentDate', type: 'dateTime' },
      { name: 'TotalScore', type: 'number' },
      { name: 'MaxScore', type: 'number' },
      { name: 'Classification', type: 'singleLineText' },
      { name: 'ScoresJSON', type: 'multilineText' },
      { name: 'Status', type: 'singleLineText' },
    ],
  },
  {
    name: 'AssessmentCriteria',
    fields: [
      { name: 'Assessment', type: 'multipleRecordLinks' },
      { name: 'Domain', type: 'singleLineText' },
      { name: 'CriterionCode', type: 'singleLineText' },
      { name: 'CriterionName', type: 'singleLineText' },
      { name: 'Score', type: 'number' },
    ],
  },
  {
    name: 'Reports',
    fields: [
      { name: 'Assessment', type: 'multipleRecordLinks' },
      { name: 'PDFUrl', type: 'url' },
      { name: 'Summary', type: 'multilineText' },
      { name: 'CreatedAt', type: 'dateTime' },
    ],
  },
  {
    name: 'ParentSurveys',
    fields: [
      { name: 'Student', type: 'multipleRecordLinks' },
      { name: 'ParentName', type: 'singleLineText' },
      { name: 'TotalScore', type: 'number' },
      { name: 'SubmittedAt', type: 'dateTime' },
    ],
  },
  {
    name: 'GameSessions',
    fields: [
      { name: 'child_id', type: 'singleLineText' },
      { name: 'game_code', type: 'singleLineText' },
      { name: 'score', type: 'number' },
      { name: 'level_reached', type: 'number' },
      { name: 'metrics_json', type: 'multilineText' },
      { name: 'trials_json', type: 'multilineText' },
      { name: 'started_at', type: 'dateTime' },
      { name: 'ended_at', type: 'dateTime' },
    ],
  },
  {
    name: 'Consents',
    fields: [
      { name: 'User', type: 'singleLineText' },
      { name: 'Child', type: 'singleLineText' },
      { name: 'ConsentType', type: 'singleLineText' },
      { name: 'ConsentText', type: 'multilineText' },
      { name: 'AcceptedAt', type: 'dateTime' },
      { name: 'IPAddress', type: 'singleLineText' },
    ],
  },
  {
    name: 'AuditLog',
    fields: [
      { name: 'User', type: 'singleLineText' },
      { name: 'Action', type: 'singleSelect' },
      { name: 'EntityType', type: 'singleLineText' },
      { name: 'EntityId', type: 'singleLineText' },
      { name: 'IPAddress', type: 'singleLineText' },
      { name: 'Timestamp', type: 'dateTime' },
      { name: 'UserAgent', type: 'singleLineText' },
    ],
  },
  {
    name: 'Payments',
    fields: [
      { name: 'chargeId', type: 'singleLineText' },
      { name: 'userId', type: 'singleLineText' },
      { name: 'childId', type: 'singleLineText' },
      { name: 'amount', type: 'number' },
      { name: 'currency', type: 'singleSelect' },
      { name: 'status', type: 'singleSelect' },
      { name: 'description', type: 'singleLineText' },
      { name: 'createdAt', type: 'dateTime' },
    ],
  },
  {
    name: 'Messages',
    fields: [
      { name: 'From', type: 'singleLineText' },
      { name: 'To', type: 'singleLineText' },
      { name: 'ChildId', type: 'singleLineText' },
      { name: 'Body', type: 'multilineText' },
      { name: 'Read', type: 'checkbox' },
      { name: 'CreatedAt', type: 'dateTime' },
    ],
  },
  {
    name: 'Goals',
    fields: [
      { name: 'childId', type: 'singleLineText' },
      { name: 'criterionId', type: 'singleLineText' },
      { name: 'title', type: 'singleLineText' },
      { name: 'domain', type: 'singleLineText' },
      { name: 'baseline', type: 'number' },
      { name: 'target', type: 'number' },
      { name: 'current', type: 'number' },
      { name: 'status', type: 'singleLineText' },
      { name: 'sessions_json', type: 'multilineText' },
    ],
  },
];
