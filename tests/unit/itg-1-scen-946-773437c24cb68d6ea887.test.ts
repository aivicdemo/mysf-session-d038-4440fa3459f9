import { fetchInvoiceModificationHistory, InvoiceNotFound } from '../../src/logic/data-persistence';
import type { FetchInvoiceModificationHistoryInput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-946: fetchInvoiceModificationHistory - InvoiceNotFoundエラー', () => {
  const invoiceId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された請求書IDが存在しない場合、InvoiceNotFoundエラーを発生させること', async () => {
    // 前提：指定されたinvoiceIdに紐付く修正内容レコードが存在しない（空の配列）
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    // 対象の処理を呼び出す
    const input: FetchInvoiceModificationHistoryInput = { invoiceId };

    // 検証：InvoiceNotFoundエラーが発生すること
    await expect(fetchInvoiceModificationHistory(input)).rejects.toThrow(InvoiceNotFound);
    await expect(fetchInvoiceModificationHistory(input)).rejects.toThrow('指定された請求書が見つかりません。');
  });
});
