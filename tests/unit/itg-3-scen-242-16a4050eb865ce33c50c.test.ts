import { retrieveMonitoringLogsAndCorrectionHistory, DataStoreError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-242: 是正追跡管理テーブルへのアクセスに失敗した場合、DataStoreErrorを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('是正追跡管理テーブルへのアクセスがDataStoreErrorで失敗することを確認する。DataStoreErrorが発生し、エラー文言は「監視ログと是正履歴の取得に失敗しました。」である', async () => {
    const mockDataStore = jest.mocked(dataStore);
    mockDataStore.listRecords = jest.fn()
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new DataStoreError('是正追跡管理テーブルへのアクセスエラー'));

    const input = {
      startDateTime: '2024-01-01T00:00:00Z',
      endDateTime: '2024-01-31T23:59:59Z',
      retentionDays: 90,
    };

    try {
      await retrieveMonitoringLogsAndCorrectionHistory(input);
      fail('DataStoreErrorが発生すべき');
    } catch (error) {
      expect(error).toBeInstanceOf(DataStoreError);
      expect((error as Error).message).toBe('監視ログと是正履歴の取得に失敗しました。');
    }
  });
});
