import { fetchAnomalyDetectionLogsByPeriod } from '../../src/logic/data-persistence';
import * as DataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-935: 検索条件に合致するログが0件の場合、空の配列とtotalCount=0が返される', () => {
  const mockDataStore = DataStore as jest.Mocked<typeof DataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('期間内にログが存在しない場合、空の配列を返す', async () => {
    mockDataStore.listRecords.mockResolvedValue([]);

    const result = await fetchAnomalyDetectionLogsByPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      anomalyTypeFilter: null,
      severityFilter: null,
      statusFilter: null,
      sortBy: 'detectionDateTime',
    });

    expect(result.anomalyLogs).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});
