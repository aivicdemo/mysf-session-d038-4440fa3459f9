import { renderDashboardWithLatestData, RenderDashboardWithLatestDataInput } from '../../src/logic/dashboard-presentation';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveMonitoringLogsAndCorrectionHistory: jest.fn()
}));

describe('SCEN-291: renderDashboardWithLatestData - 営業データ日次照合結果の差異が差異検出結果から正しく集計される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('差異検出結果から集計される件数差異・金額差異・ステータス差異が正しく反映される', async () => {
    const mockDiscrepancyData = [
      {
        '差異ID': 'diff-001',
        '種類': '件数差異',
        '金額差異': 0,
        '件数差異': 5,
        'ステータス差異': 0,
        '重大度': '中',
        '許容範囲判定': false,
        '検出日時': '2024-01-15T10:30:00Z'
      },
      {
        '差異ID': 'diff-002',
        '種類': '金額差異',
        '金額差異': 15000,
        '件数差異': 0,
        'ステータス差異': 0,
        '重大度': '高',
        '許容範囲判定': false,
        '検出日時': '2024-01-15T11:45:00Z'
      },
      {
        '差異ID': 'diff-003',
        '種類': 'ステータス差異',
        '金額差異': 0,
        '件数差異': 0,
        'ステータス差異': 3,
        '重大度': '低',
        '許容範囲判定': true,
        '検出日時': '2024-01-20T14:20:00Z'
      },
      {
        '差異ID': 'diff-004',
        '種類': '件数差異',
        '金額差異': 0,
        '件数差異': 2,
        'ステータス差異': 0,
        '重大度': '中',
        '許容範囲判定': false,
        '検出日時': '2024-01-25T09:15:00Z'
      }
    ];

    const mockCorrectionData = [
      {
        '是正ID': 'corr-001',
        '差異ID': 'diff-001',
        '是正方法': 'データ再入力',
        '是正ステータス': '完了',
        '是正実行者': 'user-002',
        '是正実行日時': '2024-01-16T08:00:00Z',
        '検証結果': '確認済み'
      },
      {
        '是正ID': 'corr-002',
        '差異ID': 'diff-002',
        '是正方法': 'システム調整',
        '是正ステータス': '進行中',
        '是正実行者': 'user-003',
        '是正実行日時': '2024-01-16T10:30:00Z',
        '検証結果': '未確認'
      },
      {
        '是正ID': 'corr-003',
        '差異ID': 'diff-003',
        '是正方法': 'マスタ修正',
        '是正ステータス': '完了',
        '是正実行者': 'user-002',
        '是正実行日時': '2024-01-21T15:45:00Z',
        '検証結果': '確認済み'
      },
      {
        '是正ID': 'corr-004',
        '差異ID': 'diff-004',
        '是正方法': 'データ再入力',
        '是正ステータス': '未実施',
        '是正実行者': null,
        '是正実行日時': null,
        '検証結果': null
      }
    ];

    const mockSalesData = {
      '照合期間開始': '2024-01-01',
      '照合期間終了': '2024-01-31',
      '旧システム件数': 1005,
      '新システム件数': 992,
      '件数差異合計': 7,
      '旧システム金額': 5000000,
      '新システム金額': 4985000,
      '金額差異合計': 15000,
      'ステータス差異合計': 3,
      '照合結果': '差異検出'
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

    // 集計値の確認
    expect(result.discrepancySummary.totalDiscrepancyCount).toBe(4);

    // 差異詳細一覧が4件
    expect(result.discrepancyDetailList).toHaveLength(4);

    // 是正追跡管理が4件
    expect(result.correctionTrackingList).toHaveLength(4);

    // salesDataDailyReconciliation の集計値が一致
    expect(result.salesDataDailyReconciliation.legacySystemCount).toBe(1005);
    expect(result.salesDataDailyReconciliation.newSystemCount).toBe(992);
    expect(result.salesDataDailyReconciliation.countDifference).toBe(7);
    expect(result.salesDataDailyReconciliation.legacySystemTotalAmount).toBe(5000000);
    expect(result.salesDataDailyReconciliation.newSystemTotalAmount).toBe(4985000);
    expect(result.salesDataDailyReconciliation.amountDifference).toBe(15000);
    expect(result.salesDataDailyReconciliation.statusMismatchCount).toBe(3);
  });
});
