import { jest } from '@jest/globals';
import { retrieveMonitoringLogsAndCorrectionHistory, DataStoreError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

const mockedDataStore = dataStore as jest.Mocked<typeof dataStore>;

describe('SCEN-720: 監視ログエントリが空のとき、エラーが発生して処理が中断される', () => {
  const startDateTime = '2024-01-01T00:00:00Z';
  const endDateTime = '2024-01-31T23:59:59Z';
  const retentionDays = 90;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異確認履歴テーブルへのアクセスが DataStoreError で失敗する場合、エラーが返される', async () => {
    const storeError = new DataStoreError('監視ログと是正履歴の取得に失敗しました。');
    mockedDataStore.listRecords.mockRejectedValue(storeError);

    await expect(
      retrieveMonitoringLogsAndCorrectionHistory({
        startDateTime,
        endDateTime,
        retentionDays,
      }),
    ).rejects.toThrow(DataStoreError);

    await expect(
      retrieveMonitoringLogsAndCorrectionHistory({
        startDateTime,
        endDateTime,
        retentionDays,
      }),
    ).rejects.toThrow('監視ログと是正履歴の取得に失敗しました。');
  });
});
