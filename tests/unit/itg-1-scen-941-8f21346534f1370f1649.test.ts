import { fetchUnresolvedAnomalyDetectionLogs, DataStoreError } from '../../src/logic/data-persistence';
import type { FetchUnresolvedAnomalyDetectionLogsInput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-941: 異常検知ログテーブルへのアクセスに失敗すると、DataStoreErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('異常検知ログテーブルへのアクセスに失敗すると、DataStoreErrorが発生する', async () => {
    (dataStore.listRecords as jest.Mock).mockRejectedValue(
      new DataStoreError('異常検知ログの取得に失敗しました。')
    );

    const input: FetchUnresolvedAnomalyDetectionLogsInput = {
      sortBy: 'detectionDateTime',
    };

    await expect(fetchUnresolvedAnomalyDetectionLogs(input)).rejects.toThrow(DataStoreError);
    await expect(fetchUnresolvedAnomalyDetectionLogs(input)).rejects.toThrow(
      '異常検知ログの取得に失敗しました。'
    );
  });
});
