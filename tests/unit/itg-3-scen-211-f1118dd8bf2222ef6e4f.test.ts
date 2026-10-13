import { retrieveDiscrepancyDetailsForConfirmation, DataStoreError } from '../../src/logic/discrepancy-persistence';
import type { RetrieveDiscrepancyDetailsForConfirmationInput } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-211: 差異検出結果テーブルのデータ読み取り操作が失敗した場合、DataStoreErrorを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異検出結果テーブル読み取りエラーの場合、DataStoreErrorを発生させる', async () => {
    const dataStoreError = new DataStoreError('Database connection failed');
    (dataStore.listRecords as jest.Mock).mockRejectedValue(dataStoreError);

    const input: RetrieveDiscrepancyDetailsForConfirmationInput = {
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
    };

    await expect(retrieveDiscrepancyDetailsForConfirmation(input)).rejects.toThrow(DataStoreError);
    await expect(retrieveDiscrepancyDetailsForConfirmation(input)).rejects.toThrow('データベースアクセスエラーが発生しました。');
  });
});
