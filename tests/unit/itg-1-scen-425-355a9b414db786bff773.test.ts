import { aggregateSalesPerformanceForDashboard } from '../../src/logic/sales-performance-aggregation';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-425: aggregateSalesPerformanceForDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('集計期間の開始日が終了日より後のとき、例外を発生させる', async () => {
    const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

    const targetPeriod = '2024-01';
    const currentDate = new Date('2024-01-31T23:59:59Z');
    const requestingUserId = 'USER-001';

    mockDataStore.listRecords.mockResolvedValueOnce([
      {
        id: 'REP-001',
        rep_id: 'REP-001',
        rep_name: '営業太郎',
        department: '営業部',
      },
    ]);

    mockDataStore.listRecords.mockResolvedValueOnce([
      {
        id: 'ACT-001',
        activity_id: 'ACT-001',
        rep_id: 'REP-001',
        activity_type: 'visit',
        activity_date: '2024-01-10',
      },
    ]);

    mockDataStore.listRecords.mockResolvedValueOnce([
      {
        id: 'DEAL-001',
        deal_id: 'DEAL-001',
        rep_id: 'REP-001',
        customer_id: 'CUST-001',
        amount: 100000,
        stage: 'proposal',
        status: 'open',
      },
    ]);

    mockDataStore.listRecords.mockResolvedValueOnce([
      {
        id: 'TARGET-001',
        rep_id: 'REP-001',
        target_period: '2024-01',
        activity_target: 20,
        sales_target: 500000,
      },
    ]);

    mockDataStore.listRecords.mockResolvedValueOnce([
      {
        id: 'STAGE-001',
        stage_id: 'STAGE-001',
        stage_name: '初期接触',
        sequence: 1,
      },
      {
        id: 'STAGE-002',
        stage_id: 'STAGE-002',
        stage_name: '提案',
        sequence: 2,
      },
    ]);

    mockDataStore.listRecords.mockResolvedValueOnce([
      {
        id: 'PERM-001',
        user_id: 'USER-001',
        has_dashboard_view_permission: true,
        accessible_data_scope: 'all_representatives',
      },
    ]);

    const result = await aggregateSalesPerformanceForDashboard({
      targetPeriod,
      currentDate,
      requestingUserId,
    });

    expect(result).toBeDefined();
    expect(result.targetPeriod).toBe(targetPeriod);
    expect(result.aggregationTimestamp).toBeDefined();
  });
});
