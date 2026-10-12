import { fetchInvoiceModificationHistory } from '../../src/logic/data-persistence';
import type { FetchInvoiceModificationHistoryInput, FetchInvoiceModificationHistoryOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-944: 取得したレコード一覧の件数をtotalCountに正確に反映する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('取得したレコード一覧の件数をtotalCountに正確に反映する', async () => {
    const mockModificationRecords: any[] = [
      {
        modificationRecordId: '660e8400-e29b-41d4-a716-446655440001',
        invoiceId: '550e8400-e29b-41d4-a716-446655440000',
        modificationCategory: '金額修正',
        modificationBeforeValue: '100000',
        modificationAfterValue: '105000',
        modificationReason: '税率計算誤り',
        modifierId: '770e8400-e29b-41d4-a716-446655440001',
        modificationTimestamp: '2026-10-07T10:30:00Z',
        createdAt: '2026-10-07T10:30:00Z',
      },
      {
        modificationRecordId: '660e8400-e29b-41d4-a716-446655440002',
        invoiceId: '550e8400-e29b-41d4-a716-446655440000',
        modificationCategory: '品目修正',
        modificationBeforeValue: '商品A',
        modificationAfterValue: '商品B',
        modificationReason: '品目変更要望',
        modifierId: '770e8400-e29b-41d4-a716-446655440002',
        modificationTimestamp: '2026-10-07T09:15:00Z',
        createdAt: '2026-10-07T09:15:00Z',
      },
      {
        modificationRecordId: '660e8400-e29b-41d4-a716-446655440003',
        invoiceId: '550e8400-e29b-41d4-a716-446655440000',
        modificationCategory: '請求先修正',
        modificationBeforeValue: '東京支店',
        modificationAfterValue: '大阪支店',
        modificationReason: '請求先変更',
        modifierId: '770e8400-e29b-41d4-a716-446655440003',
        modificationTimestamp: '2026-10-07T08:00:00Z',
        createdAt: '2026-10-07T08:00:00Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockModificationRecords);

    const input: FetchInvoiceModificationHistoryInput = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result: FetchInvoiceModificationHistoryOutput = await fetchInvoiceModificationHistory(input);

    expect(result.modificationRecords).toHaveLength(3);
    expect((result.modificationRecords[0] as any).modificationTimestamp).toBe('2026-10-07T10:30:00Z');
    expect((result.modificationRecords[1] as any).modificationTimestamp).toBe('2026-10-07T09:15:00Z');
    expect((result.modificationRecords[2] as any).modificationTimestamp).toBe('2026-10-07T08:00:00Z');

    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
