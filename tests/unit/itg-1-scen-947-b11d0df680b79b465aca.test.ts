import { fetchInvoiceModificationHistory, DataStoreError } from '../../src/logic/data-persistence';
import type { FetchInvoiceModificationHistoryInput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-947: fetchInvoiceModificationHistory - DataStoreError', () => {
  const invoiceId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('請求書修正内容テーブルの読み取りに失敗した場合、DataStoreErrorエラーを発生させること', async () => {
    // 前提：請求書修正内容テーブルの読み取りがDataStoreErrorで失敗する
    (dataStore.listRecords as jest.Mock).mockRejectedValue(
      new DataStoreError('修正履歴の取得に失敗しました。')
    );

    // 対象の処理を呼び出す
    const input: FetchInvoiceModificationHistoryInput = { invoiceId };

    // 検証：DataStoreErrorが発生すること
    await expect(fetchInvoiceModificationHistory(input)).rejects.toThrow(DataStoreError);
    await expect(fetchInvoiceModificationHistory(input)).rejects.toThrow('修正履歴の取得に失敗しました。');
  });
});
