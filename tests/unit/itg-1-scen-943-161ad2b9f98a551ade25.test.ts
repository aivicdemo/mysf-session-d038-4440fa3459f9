import { fetchInvoiceModificationHistory } from '../../src/logic/data-persistence';
import type { FetchInvoiceModificationHistoryInput, FetchInvoiceModificationHistoryOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-943: 指定した請求書に紐付く修正内容レコードが1件もない場合、空のレコード一覧を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定した請求書に紐付く修正内容レコードが1件もない場合、空のレコード一覧を返す', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const input: FetchInvoiceModificationHistoryInput = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result: FetchInvoiceModificationHistoryOutput = await fetchInvoiceModificationHistory(input);

    expect(result.modificationRecords).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
