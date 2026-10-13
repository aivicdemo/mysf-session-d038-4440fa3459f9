import { retrieveDiscrepanciesForCSVExport, DataStoreAccessError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-228: 差異検出結果テーブルへのアクセスに失敗した場合、DataStoreAccessErrorエラーを発生させる', () => {
  const discrepancyIds = ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異検出結果テーブルアクセスが DataStoreError で失敗した場合、DataStoreAccessError エラーを返す', async () => {
    const error = new dataStore.DataStoreError('Database connection failed');

    (dataStore.listRecords as jest.Mock).mockRejectedValueOnce(error);

    await expect(
      retrieveDiscrepanciesForCSVExport({ discrepancyIds })
    ).rejects.toThrow(DataStoreAccessError);

    try {
      await retrieveDiscrepanciesForCSVExport({ discrepancyIds });
    } catch (err) {
      if (err instanceof Error) {
        expect(err.message).toBe('データベースアクセスエラーが発生しました。');
      }
    }
  });
});
