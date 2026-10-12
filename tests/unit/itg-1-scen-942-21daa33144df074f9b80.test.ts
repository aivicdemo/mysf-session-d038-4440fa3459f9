import { fetchInvoiceModificationHistory } from '../../src/logic/data-persistence';
import type { FetchInvoiceModificationHistoryInput, FetchInvoiceModificationHistoryOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-942: 指定した請求書に紐付く修正内容レコードが複数件ある場合、修正日時の降順で全件取得できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定した請求書に紐付く修正内容レコードが複数件ある場合、修正日時の降順で全件取得できる', async () => {
    const mockModificationRecords: any[] = [
      {
        modificationRecordId: 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6',
        invoiceId: '550e8400-e29b-41d4-a716-446655440000',
        modificationCategory: '金額修正',
        modificationBeforeValue: '100000',
        modificationAfterValue: '95000',
        modificationReason: '割引適用',
        modifierId: 'user-001',
        modificationTimestamp: '2026-01-15T14:30:00.000Z',
        createdAt: '2026-01-15T14:30:00.000Z',
      },
      {
        modificationRecordId: 'b2c3d4e5-f6g7-48h9-i0j1-k2l3m4n5o6p7',
        invoiceId: '550e8400-e29b-41d4-a716-446655440000',
        modificationCategory: '商品削除',
        modificationBeforeValue: '商品A',
        modificationAfterValue: '削除',
        modificationReason: '誤計上の訂正',
        modifierId: 'user-002',
        modificationTimestamp: '2026-01-10T09:15:00.000Z',
        createdAt: '2026-01-10T09:15:00.000Z',
      },
      {
        modificationRecordId: 'c3d4e5f6-g7h8-49i0-j1k2-l3m4n5o6p7q8',
        invoiceId: '550e8400-e29b-41d4-a716-446655440000',
        modificationCategory: '手数料追加',
        modificationBeforeValue: 'なし',
        modificationAfterValue: '5000',
        modificationReason: '送料追加計上',
        modifierId: 'user-003',
        modificationTimestamp: '2026-01-05T16:45:30.000Z',
        createdAt: '2026-01-05T16:45:30.000Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockModificationRecords);

    const input: FetchInvoiceModificationHistoryInput = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result: FetchInvoiceModificationHistoryOutput = await fetchInvoiceModificationHistory(input);

    expect(result.modificationRecords).toHaveLength(3);
    expect((result.modificationRecords[0] as any).modificationRecordId).toBe('a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6');
    expect((result.modificationRecords[0] as any).modificationTimestamp).toBe('2026-01-15T14:30:00.000Z');

    expect((result.modificationRecords[1] as any).modificationRecordId).toBe('b2c3d4e5-f6g7-48h9-i0j1-k2l3m4n5o6p7');
    expect((result.modificationRecords[1] as any).modificationTimestamp).toBe('2026-01-10T09:15:00.000Z');

    expect((result.modificationRecords[2] as any).modificationRecordId).toBe('c3d4e5f6-g7h8-49i0-j1k2-l3m4n5o6p7q8');
    expect((result.modificationRecords[2] as any).modificationTimestamp).toBe('2026-01-05T16:45:30.000Z');

    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
