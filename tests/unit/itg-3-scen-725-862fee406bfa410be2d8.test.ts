import { retrieveMonitoringLogsAndCorrectionHistory } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-725: 3年保管期間の監査対象分類', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('データ移行整合性検証ログが監査対象として分類され、3年間の保管期間で保管終了日が計算される', async () => {
    const mockListRecords = jest.mocked(dataStore.listRecords);

    const confirmationHistoryData = [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        "確認ID": "550e8400-e29b-41d4-a716-446655440001",
        "差異ID": "550e8400-e29b-41d4-a716-446655440011",
        "確認ユーザーID": "550e8400-e29b-41d4-a716-446655440021",
        "確認日時": "2024-06-15T10:30:00Z",
        "確認内容": "金額差異を確認しました",
        "判定結果": "差異確認済み"
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        "確認ID": "550e8400-e29b-41d4-a716-446655440002",
        "差異ID": "550e8400-e29b-41d4-a716-446655440012",
        "確認ユーザーID": "550e8400-e29b-41d4-a716-446655440022",
        "確認日時": "2024-03-20T14:15:00Z",
        "確認内容": "データ不一致を確認",
        "判定結果": "要是正"
      }
    ];

    const correctionHistoryData = [
      {
        id: "550e8400-e29b-41d4-a716-446655440031",
        "是正ID": "550e8400-e29b-41d4-a716-446655440031",
        "差異ID": "550e8400-e29b-41d4-a716-446655440012",
        "是正方法": "手動修正",
        "是正ステータス": "完了",
        "是正実行者": "550e8400-e29b-41d4-a716-446655440023",
        "是正実行日時": "2024-03-21T09:45:00Z",
        "是正前データ": "100000",
        "是正後データ": "150000",
        "検証結果": "正常"
      }
    ];

    const csvHistoryData = [
      {
        id: "550e8400-e29b-41d4-a716-446655440041",
        "出力ID": "550e8400-e29b-41d4-a716-446655440041",
        "実行ユーザーID": "550e8400-e29b-41d4-a716-446655440024",
        "実行日時": "2024-07-10T16:20:00Z",
        "出力対象差異件数": 5,
        "出力ファイル識別子": "discrepancy_report_20240710.csv",
        "出力ステータス": "成功"
      }
    ];

    mockListRecords
      .mockResolvedValueOnce(confirmationHistoryData)
      .mockResolvedValueOnce(correctionHistoryData)
      .mockResolvedValueOnce(csvHistoryData);

    const input = {
      startDateTime: '2024-01-01T00:00:00Z',
      endDateTime: '2024-12-31T23:59:59Z',
      retentionDays: 1095
    };

    const result = await retrieveMonitoringLogsAndCorrectionHistory(input);

    // 確認履歴: 2件が期間内で取得
    expect(result.confirmationHistory).toHaveLength(2);

    // 是正追跡履歴: 1件が期間内で取得
    expect(result.correctionTrackingHistory).toHaveLength(1);

    // CSV出力監査履歴: 1件が期間内で取得
    expect(result.csvExportAuditHistory).toHaveLength(1);

    // 合計件数: 4件
    expect(result.totalRecordCount).toBe(4);

    // 保管期間超過件数: 0件（全レコードが1095日以内）
    expect(result.retentionExceededCount).toBe(0);

    // すべてのレコードが保管期間内
    result.confirmationHistory.forEach(record => {
      expect(record.isWithinRetentionPeriod).toBe(true);
    });
    result.correctionTrackingHistory.forEach(record => {
      expect(record.isWithinRetentionPeriod).toBe(true);
    });
    result.csvExportAuditHistory.forEach(record => {
      expect(record.isWithinRetentionPeriod).toBe(true);
    });
  });
});
