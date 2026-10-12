import { fetchUnresolvedAnomalyDetectionLogs } from '../../src/logic/data-persistence';
import type { FetchUnresolvedAnomalyDetectionLogsInput, FetchUnresolvedAnomalyDetectionLogsOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-940: 未対応状態の異常検知ログが0件のとき、空配列と件数0を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('未対応状態の異常検知ログが0件のとき、空配列と件数0を返す', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const input: FetchUnresolvedAnomalyDetectionLogsInput = {
      sortBy: 'detectionDateTime',
    };

    const result: FetchUnresolvedAnomalyDetectionLogsOutput = await fetchUnresolvedAnomalyDetectionLogs(input);

    expect(result.anomalyLogs).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
