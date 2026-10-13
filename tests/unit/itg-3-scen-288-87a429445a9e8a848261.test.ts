import { renderDashboardWithLatestData, RenderDashboardWithLatestDataInput } from '../../src/logic/dashboard-presentation';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveMonitoringLogsAndCorrectionHistory: jest.fn()
}));

describe('SCEN-288: renderDashboardWithLatestData - 差異検出結果は取得でき、是正追跡管理レコードが0件の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('空の是正追跡一覧が返される', async () => {
    const mockDiscrepancyData = [
      {
        discrepancyId: 'diff-001',
        type: '金額差異',
        amountDifference: 5000,
        quantityDifference: 0,
        statusDifference: 0,
        severity: 'HIGH',
        withinTolerance: false,
        detectedAt: '2024-01-15T10:30:00Z'
      },
      {
        discrepancyId: 'diff-002',
        type: '件数差異',
        amountDifference: 0,
        quantityDifference: 2,
        statusDifference: 0,
        severity: 'MEDIUM',
        withinTolerance: true,
        detectedAt: '2024-01-20T14:15:00Z'
      }
    ];

    const mockSalesData = {
      reconciliationDate: '2024-01-31',
      totalQuantityDifference: 2,
      totalAmountDifference: 5000,
      totalStatusDifference: 0,
      reconciliationStatus: 'COMPLETED_WITH_DISCREPANCIES'
    };

    (discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as jest.Mock).mockResolvedValue({
      discrepancies: mockDiscrepancyData,
      correctionTrackingRecords: [],
      salesDataDailyReconciliation: mockSalesData
    });

    const input: RenderDashboardWithLatestDataInput = {
      requestUserId: 'user-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:59Z')
    };

    const result = await renderDashboardWithLatestData(input);

    expect(result.discrepancyDetailList).toHaveLength(2);
    expect(result.correctionTrackingList).toEqual([]);
    expect(result.discrepancySummary.totalDiscrepancyCount).toBe(2);
  });
});
