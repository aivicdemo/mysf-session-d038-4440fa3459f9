import { fetchInvoiceModificationHistory, InvoiceNotFound, DataStoreError } from '../../src/logic/data-persistence';
import type { FetchInvoiceModificationHistoryInput, FetchInvoiceModificationHistoryOutput, InvoiceModificationRecord } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-945: fetchInvoiceModificationHistory - ISO 8601形式でfetchedAtに記録する', () => {
  const invoiceId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('修正日時の降順で2件のレコードを返し、fetchedAtがISO 8601形式で記録されていること', async () => {
    // 前提：請求書修正内容テーブルに2件のレコードが存在する（修正日時の昇順で保存されている）
    const mockModificationRecords: InvoiceModificationRecord[] = [
      {
        modificationRecordId: '660e8400-e29b-41d4-a716-446655440001',
        invoiceId: '550e8400-e29b-41d4-a716-446655440000',
        modificationCategory: '金額修正',
        modificationBeforeValue: '100000',
        modificationAfterValue: '105000',
        modificationReason: '税率計算誤り',
        modifierId: '770e8400-e29b-41d4-a716-446655440001',
        modificationTimestamp: '2025-01-15T14:30:00Z',
        createdAt: '2025-01-15T14:30:00Z',
      },
      {
        modificationRecordId: '660e8400-e29b-41d4-a716-446655440002',
        invoiceId: '550e8400-e29b-41d4-a716-446655440000',
        modificationCategory: '受取人修正',
        modificationBeforeValue: '部門A',
        modificationAfterValue: '部門B',
        modificationReason: '配置転換に伴う変更',
        modifierId: '770e8400-e29b-41d4-a716-446655440002',
        modificationTimestamp: '2025-01-10T10:15:00Z',
        createdAt: '2025-01-10T10:15:00Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockModificationRecords);

    // 対象の処理を呼び出す
    const input: FetchInvoiceModificationHistoryInput = { invoiceId };
    const result = await fetchInvoiceModificationHistory(input);

    // 検証：修正日時の降順で2件のレコードが返されること
    expect(result.modificationRecords).toHaveLength(2);
    expect(result.modificationRecords[0].modificationTimestamp).toBe('2025-01-15T14:30:00Z');
    expect(result.modificationRecords[0].modificationCategory).toBe('金額修正');
    expect(result.modificationRecords[1].modificationTimestamp).toBe('2025-01-10T10:15:00Z');
    expect(result.modificationRecords[1].modificationCategory).toBe('受取人修正');

    // 検証：totalCountが2であること
    expect(result.totalCount).toBe(2);

    // 検証：fetchedAtがISO 8601形式（UTC/Zサフィックス）であること
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
