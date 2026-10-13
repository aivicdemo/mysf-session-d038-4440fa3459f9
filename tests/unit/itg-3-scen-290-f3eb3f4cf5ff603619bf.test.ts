import { renderDashboardWithLatestData, RenderDashboardWithLatestDataInput } from '../../src/logic/dashboard-presentation';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveMonitoringLogsAndCorrectionHistory: jest.fn()
}));

describe('SCEN-290: renderDashboardWithLatestData - 並行実行ステータスが旧新システムで異なる状態', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('パネルデータに同期状況が正確に反映される', async () => {
    const mockDiscrepancyData = [
      {
        '差異ID': 'diff-001',
        '種類': '件数差異',
        '金額差異': 0,
        '件数差異': 5,
        'ステータス差異': 0,
        '重大度': '高',
        '許容範囲判定': false,
        '検出日時': '2025-01-15T10:30:00Z'
      },
      {
        '差異ID': 'diff-002',
        '種類': '金額差異',
        '金額差異': 150000,
        '件数差異': 0,
        'ステータス差異': 0,
        '重大度': '中',
        '許容範囲判定': true,
        '検出日時': '2025-01-20T14:45:00Z'
      }
    ];

    const mockCorrectionData = [
      {
        '是正ID': 'corr-001',
        '差異ID': 'diff-001',
        '是正方法': 'データ再入力',
        '是正ステータス': '実行中',
        '是正実行者': 'user-002',
        '是正実行日時': '2025-01-16T09:00:00Z',
        '検証結果': '未検証'
      },
      {
        '是正ID': 'corr-002',
        '差異ID': 'diff-002',
        '是正方法': 'システム設定調整',
        '是正ステータス': '完了',
        '是正実行者': 'user-003',
        '是正実行日時': '2025-01-21T11:20:00Z',
        '検証結果': '合致'
      }
    ];

    const mockSalesData = {
      '旧システム件数': 1000,
      '新システム件数': 995,
      '件数差異': 5,
      '旧システム金額': 5000000,
      '新システム金額': 4850000,
      '金額差異': 150000,
      '旧システムステータス': {
        '実行中': true,
        '最終実行日時': '2025-01-31T08:00:00Z',
        'ステータス': '稼働中',
        'データ件数': 1000
      },
      '新システムステータス': {
        '実行中': false,
        '最終実行日時': '2025-01-30T22:15:00Z',
        'ステータス': '停止',
        'データ件数': 995
      },
      'ステータス一致率': 98.5,
      'ステータス差異': 15,
      '照合日時': '2025-01-31T23:59:59Z'
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

    // parallelExecutionStatus が定義されている
    expect(result.parallelExecutionStatus).toBeDefined();
    expect(result.parallelExecutionStatus.legacySystemStatus).toBeDefined();
    expect(result.parallelExecutionStatus.newSystemStatus).toBeDefined();

    // discrepancySummary が集計されている
    expect(result.discrepancySummary.totalDiscrepancyCount).toBe(2);

    // 差異詳細一覧が2件
    expect(result.discrepancyDetailList).toHaveLength(2);

    // 是正追跡管理が2件
    expect(result.correctionTrackingList).toHaveLength(2);

    // salesDataDailyReconciliation に必要な情報が含まれている
    expect(result.salesDataDailyReconciliation.legacySystemCount).toBe(1000);
    expect(result.salesDataDailyReconciliation.newSystemCount).toBe(995);
    expect(result.salesDataDailyReconciliation.countDifference).toBe(5);
    expect(result.salesDataDailyReconciliation.amountDifference).toBe(150000);
    expect(result.salesDataDailyReconciliation.statusMismatchCount).toBe(15);
  });
});
