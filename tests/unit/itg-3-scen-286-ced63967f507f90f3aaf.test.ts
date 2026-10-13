import { renderDashboardWithLatestData, RenderDashboardWithLatestDataInput } from '../../src/logic/dashboard-presentation';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveMonitoringLogsAndCorrectionHistory: jest.fn()
}));

describe('SCEN-286: renderDashboardWithLatestData - 開始日と終了日が同じ場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('指定日付のみのデータが集計される', async () => {
    const mockDiscrepancyData = [
      {
        discrepancyId: 'diff-001',
        type: '金額差異',
        amountDifference: 5000,
        quantityDifference: 0,
        statusDifference: 0,
        severity: '高',
        withinTolerance: false,
        detectionDateTime: '2026-01-15T10:30:00Z'
      },
      {
        discrepancyId: 'diff-002',
        type: '件数差異',
        amountDifference: 0,
        quantityDifference: 2,
        statusDifference: 0,
        severity: '中',
        withinTolerance: true,
        detectionDateTime: '2026-01-15T14:15:00Z'
      }
    ];

    const mockCorrectionData = [
      {
        correctionId: 'corr-001',
        discrepancyId: 'diff-001',
        correctionMethod: '手動調整',
        correctionStatus: '実施済',
        correctionExecutor: 'user-002',
        correctionDateTime: '2026-01-15T11:45:00Z',
        verificationResult: '確認済'
      }
    ];

    const mockSalesData = {
      totalQuantityDifference: 2,
      totalAmountDifference: 5000,
      totalStatusDifference: 0,
      status: '完了'
    };

    (discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as jest.Mock).mockResolvedValue({
      discrepancies: mockDiscrepancyData,
      correctionTrackingRecords: mockCorrectionData,
      salesDataDailyReconciliation: mockSalesData
    });

    const input: RenderDashboardWithLatestDataInput = {
      requestUserId: 'user-001',
      startDate: new Date('2026-01-15T00:00:00Z'),
      endDate: new Date('2026-01-15T23:59:59Z')
    };

    const result = await renderDashboardWithLatestData(input);

    expect(result.discrepancyDetailList).toHaveLength(2);
    expect(result.discrepancyDetailList.every(d =>
      d.detectionDateTime.toISOString().startsWith('2026-01-15')
    )).toBe(true);

    expect(result.discrepancySummary.totalDiscrepancyCount).toBe(2);
    expect(result.correctionTrackingList).toHaveLength(1);
  });
});
