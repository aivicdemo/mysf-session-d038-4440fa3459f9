import { retrieveMonitoringLogsAndCorrectionHistory, DataStoreError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-243: CSV出力実行履歴テーブルへのアクセスに失敗した場合、DataStoreErrorを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('CSV出力実行履歴テーブルへのアクセスがエラーで失敗するようにスタブを設定する。DataStoreErrorが発生し、エラーメッセージは「監視ログと是正履歴の取得に失敗しました。」である', async () => {
    const mockDataStore = jest.mocked(dataStore);
    mockDataStore.listRecords = jest.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new DataStoreError('CSV出力実行履歴テーブルへのアクセスエラー'));

    const input = {
      startDateTime: '2025-01-01T00:00:00Z',
      endDateTime: '2025-01-31T23:59:59Z',
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
