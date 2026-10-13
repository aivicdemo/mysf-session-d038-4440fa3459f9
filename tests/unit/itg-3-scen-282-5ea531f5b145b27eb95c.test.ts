import { renderDashboardWithLatestData, RenderDashboardWithLatestDataInput } from '../../src/logic/dashboard-presentation';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveMonitoringLogsAndCorrectionHistory: jest.fn()
}));

describe('SCEN-282: renderDashboardWithLatestData - 権限あり・期間正常・差異とコレクション取得できた場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('差異検出結果・営業データ日次照合結果・是正追跡管理が返され、5つのパネルが集計・整形される', async () => {
    const mockDiscrepancyData = [
      {
        discrepancyId: 'diff-001',
        type: '金額差異',
        amountDifference: 50000,
        countDifference: 0,
        statusDifference: 0,
        severity: '高',
        withinTolerance: false,
        detectedAt: '2025-01-15T10:30:00Z'
      },
      {
        discrepancyId: 'diff-002',
        type: '件数差異',
        amountDifference: 0,
        countDifference: 5,
        statusDifference: 0,
        severity: '中',
        withinTolerance: true,
        detectedAt: '2025-01-20T14:15:00Z'
      },
      {
        discrepancyId: 'diff-003',
        type: 'ステータス差異',
        amountDifference: 0,
        countDifference: 0,
        statusDifference: 3,
        severity: '低',
        withinTolerance: true,
        detectedAt: '2025-01-25T09:45:00Z'
      }
    ];

    const mockCorrectionData = [
      {
        correctionId: 'corr-001',
        discrepancyId: 'diff-001',
        correctionMethod: '取引データ再入力',
        correctionStatus: '実施済',
        executedBy: 'staff-01',
        executedAt: '2025-01-16T11:00:00Z',
        verificationResult: '差異解消'
      },
      {
        correctionId: 'corr-002',
        discrepancyId: 'diff-002',
        correctionMethod: 'システム同期処理',
        correctionStatus: '進行中',
        executedBy: 'staff-02',
        executedAt: '2025-01-21T15:30:00Z',
        verificationResult: '検証待ち'
      }
    ];

    const mockSalesData = {
      totalCountDifference: 5,
      totalAmountDifference: 50000,
      totalStatusDifference: 3,
      legacySystemCount: 1000,
      newSystemCount: 995,
      legacySystemAmount: 5000000,
      newSystemAmount: 4950000,
      reconciliationDate: '2025-01-31T23:59:59Z'
    };

    (discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as jest.Mock).mockResolvedValue({
      discrepancies: mockDiscrepancyData,
      correctionTrackingRecords: mockCorrectionData,
      salesDataDailyReconciliation: mockSalesData
    });

    const input: RenderDashboardWithLatestDataInput = {
      requestUserId: 'user-001',
      startDate: new Date('2025-01-01T00:00:00Z'),
      endDate: new Date('2025-01-31T23:59:59Z')
    };

    const result = await renderDashboardWithLatestData(input);

    expect(result).toBeDefined();
    expect(result.parallelExecutionStatus).toBeDefined();
    expect(result.discrepancySummary).toBeDefined();
    expect(result.discrepancyDetailList).toBeDefined();
    expect(result.correctionTrackingList).toBeDefined();
    expect(result.salesDataDailyReconciliation).toBeDefined();

    // discrepancySummary の検証
    expect(result.discrepancySummary.totalDiscrepancyCount).toBe(3);
    expect(result.discrepancySummary.exceedsToleranceCount).toBe(1);
    expect(result.discrepancySummary.withinToleranceCount).toBe(2);

    // discrepancyDetailList の検証（3件）
    expect(result.discrepancyDetailList).toHaveLength(3);
    expect(result.discrepancyDetailList[0].discrepancyId).toBe('diff-001');
    expect(result.discrepancyDetailList[0].amountDifference).toBe(50000);
    expect(result.discrepancyDetailList[0].severity).toBe('高');
    expect(result.discrepancyDetailList[1].discrepancyId).toBe('diff-002');
    expect(result.discrepancyDetailList[1].countDifference).toBe(5);
    expect(result.discrepancyDetailList[2].discrepancyId).toBe('diff-003');

    // correctionTrackingList の検証（2件）
    expect(result.correctionTrackingList).toHaveLength(2);
    expect(result.correctionTrackingList[0].correctionId).toBe('corr-001');
    expect(result.correctionTrackingList[0].correctionStatus).toBe('実施済');
    expect(result.correctionTrackingList[0].verificationResult).toBe('差異解消');
    expect(result.correctionTrackingList[1].correctionId).toBe('corr-002');
    expect(result.correctionTrackingList[1].correctionStatus).toBe('進行中');

    // salesDataDailyReconciliation の検証
    expect(result.salesDataDailyReconciliation.legacySystemCount).toBe(1000);
    expect(result.salesDataDailyReconciliation.newSystemCount).toBe(995);
    expect(result.salesDataDailyReconciliation.countDifference).toBe(5);
    expect(result.salesDataDailyReconciliation.legacySystemTotalAmount).toBe(5000000);
    expect(result.salesDataDailyReconciliation.newSystemTotalAmount).toBe(4950000);
    expect(result.salesDataDailyReconciliation.amountDifference).toBe(50000);
    expect(result.salesDataDailyReconciliation.statusMismatchCount).toBe(3);
  });
});
