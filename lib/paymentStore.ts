import { FieldSet } from 'airtable';
import { isAirtableConfigured } from '@/lib/airtable';

const TABLE = process.env.AIRTABLE_PAYMENTS_TABLE || 'Payments';

export type PaymentRecord = {
  chargeId: string;
  userId: string;
  childId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'captured' | 'failed' | 'refunded';
  description: string;
  createdAt: string;
};

export async function savePaymentRecord(row: PaymentRecord): Promise<string> {
  if (!isAirtableConfigured()) {
    return `local_pay_${Date.now().toString(36)}`;
  }

  try {
    const apiKey = process.env.AIRTABLE_API_KEY || '';
    const baseId = process.env.AIRTABLE_BASE_ID || '';
    const Airtable = (await import('airtable')).default;
    const base = new Airtable({ apiKey }).base(baseId);
    const [record] = await base(TABLE).create([
      {
        fields: {
          chargeId: row.chargeId,
          userId: row.userId,
          childId: row.childId,
          amount: row.amount,
          currency: row.currency,
          status: row.status,
          description: row.description,
          createdAt: row.createdAt,
        } as FieldSet,
      },
    ]);
    return record.id;
  } catch {
    return `local_pay_${Date.now().toString(36)}`;
  }
}
