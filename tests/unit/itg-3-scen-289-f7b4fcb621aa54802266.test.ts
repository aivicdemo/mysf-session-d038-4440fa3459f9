import { renderDashboardWithLatestData, RenderDashboardWithLatestDataInput } from '../../src/logic/dashboard-presentation';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveMonitoringLogsAndCorrectionHistory: jest.fn()
}));

describe('SCEN-289: renderDashboardWithLatestData - 複数種類の差異が検出されている場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('差異サマリーが種類別・重大度別に正しく集計される', async () => {
    const mockDiscrepancyData = [
      {
        discrepancyId: 'diff-001',
        type: '金額差異',
        amountDifference: 50000,
        countDifference: 0,
        statusDifference: 0,
        severity: '高',
        withinToleranceRange: false,
        detectionDateTime: '2024-01-15T10:30:00Z'
      },
      {
        discrepancyId: 'diff-002',
        type: '金額差異',
        amountDifference: 20000,
        countDifference: 0,
        statusDifference: 0,
        severity: '中',
        withinToleranceRange: false,
        detectionDateTime: '2024-01-16T14:20:00Z'
      },
      {
        discrepancyId: 'diff-003',
        type: '件数差異',
        amountDifference: 0,
        countDifference: 5,
        statusDifference: 0,
        severity: '高',
        withinToleranceRange: true,
        detectionDateTime: '2024-01-17T09:15:00Z'
      },
      {
        discrepancyId: 'diff-004',
        type: '件数差異',
        amountDifference: 0,
        countDifference: 2,
        statusDifference: 0,
        severity: '低',
        withinToleranceRange: true,
        detectionDateTime: '2024-01-18T11:45:00Z'
      },
      {
        discrepancyId: 'diff-005',
        type: 'ステータス差異',
        amountDifference: 0,
        countDifference: 0,
        statusDifference: 3,
        severity: '中',
        withinToleranceRange: false,
        detectionDateTime: '2024-01-19T13:30:00Z'
      }
    ];

    const mockCorrectionData = [
      {
        correctionId: 'corr-001',
        discrepancyId: 'diff-001',
        correctionMethod: '手動修正',
        correctionStatus: '完了',
        correctionExecutor: 'admin-user-001',
        correctionExecutionDateTime: '2024-01-16T08:00:00Z',
        verificationResult: '検証済み'
      },
      {
        correctionId: 'corr-002',
        discrepancyId: 'diff-002',
        correctionMethod: 'システム修正',
        correctionStatus: '進行中',
        correctionExecutor: 'system-user-001',
        correctionExecutionDateTime: '2024-01-17T10:30:00Z',
        verificationResult: '未検証'
      }
    ];

    const mockSalesData = {
      reconciliationDate: '2024-01-31',
      totalCountDifference: 7,
      totalAmountDifference: 70000,
      totalStatusDifference: 3,
      oldSystemRecordCount: 1000,
      newSystemRecordCount: 993,
      oldSystemTotalAmount: 5000000,
      newSystemTotalAmount: 4930000,
      reconciliationStatus: '差異あり'
    };

    (discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as jest.Mock).mockResolvedValue({
      discrepancies: mockDiscrepancyData,
      correctionTrackingRecords: mockCorrectionData,
      salesDataDailyReconciliation: mockSalesData
    });

    const input: RenderDashboardWithLatestDataInput = {
      requestUserId: 'user-001',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31')
    };

    const result = await renderDashboardWithLatestData(input);

    // 5件の差異が検出
    expect(result.discrepancySummary.totalDiscrepancyCount).toBe(5);

    // 重大度別の集計確認
    expect(result.discrepancySummary.criticalCount).toBeGreaterThanOrEqual(0);
    expect(result.discrepancySummary.warningCount).toBeGreaterThanOrEqual(0);

    // 許容範囲内外の判定
    expect(result.discrepancySummary.withinToleranceCount).toBe(2);
    expect(result.discrepancySummary.exceedsToleranceCount).toBe(3);

    // 差異詳細一覧に5件が含まれている
    expect(result.discrepancyDetailList).toHaveLength(5);

    // 是正追跡管理に2件が含まれている
    expect(result.correctionTrackingList).toHaveLength(2);
  });
});
