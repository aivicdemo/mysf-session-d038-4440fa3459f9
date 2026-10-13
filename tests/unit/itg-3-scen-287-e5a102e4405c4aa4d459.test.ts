import { renderDashboardWithLatestData, RenderDashboardWithLatestDataInput } from '../../src/logic/dashboard-presentation';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveMonitoringLogsAndCorrectionHistory: jest.fn()
}));

describe('SCEN-287: renderDashboardWithLatestData - 指定期間内に差異検出結果が0件の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('空の差異詳細一覧が返される', async () => {
    const mockSalesData = {
      parallelExecutionStatus: {
        legacySystemStatus: 'RUNNING',
        newSystemStatus: 'RUNNING',
        lastSyncTime: '2025-01-31T23:59:59Z'
      },
      discrepancySummary: {
        totalDiscrepancyCount: 0,
        totalAmountDeviation: 0,
        totalStatusDeviationCount: 0
      }
    };

    (discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as jest.Mock).mockResolvedValue({
      discrepancies: [],
      correctionTrackingRecords: [],
      salesDataDailyReconciliation: mockSalesData
    });

    const input: RenderDashboardWithLatestDataInput = {
      requestUserId: 'user-001',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31')
    };

    const result = await renderDashboardWithLatestData(input);

    expect(result.discrepancyDetailList).toEqual([]);
    expect(result.correctionTrackingList).toEqual([]);
    expect(result.parallelExecutionStatus).toBeDefined();
    expect(result.discrepancySummary).toBeDefined();
    expect(result.salesDataDailyReconciliation).toBeDefined();
  });
});
