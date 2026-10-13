import { retrieveMonitoringLogsAndCorrectionHistory } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-724: 金額ズレ・請求ミスの監査対象分類と保管', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('金額ズレと請求ミスのログが監査対象として分類される', async () => {
    const mockListRecords = jest.mocked(dataStore.listRecords);

    const confirmationHistoryData = [
      {
        id: "uuid-1",
        "確認ID": "uuid-1",
        "差異ID": "diff-001",
        "確認ユーザーID": "user-001",
        "確認日時": "2024-01-15T10:30:00Z",
        "確認内容": "金額ズレ確認: 請求額と実績が1000円不一致",
        "判定結果": "金額ズレ"
      },
      {
        id: "uuid-2",
        "確認ID": "uuid-2",
        "差異ID": "diff-002",
        "確認ユーザーID": "user-002",
        "確認日時": "2024-01-20T14:15:00Z",
        "確認内容": "請求ミス確認: 請求書に記載漏れ",
        "判定結果": "請求ミス"
      },
      {
        id: "uuid-3",
        "確認ID": "uuid-3",
        "差異ID": "diff-003",
        "確認ユーザーID": "user-003",
        "確認日時": "2024-01-25T09:45:00Z",
        "確認内容": "その他の差異確認",
        "判定結果": "その他"
      }
    ];

    const correctionHistoryData = [
      {
        id: "corr-001",
        "是正ID": "corr-001",
        "差異ID": "diff-001",
        "是正方法": "金額調整",
        "是正ステータス": "完了",
        "是正実行者": "user-001",
        "是正実行日時": "2024-01-16T11:20:00Z",
        "是正前データ": "請求額: 100000円",
        "是正後データ": "請求額: 101000円",
        "検証結果": "是正完了"
      },
      {
        id: "corr-002",
        "是正ID": "corr-002",
        "差異ID": "diff-002",
        "是正方法": "請求書再発行",
        "是正ステータス": "完了",
        "是正実行者": "user-002",
        "是正実行日時": "2024-01-21T15:30:00Z",
        "是正前データ": "請求書ID: INV-001 (不完全)",
        "是正後データ": "請求書ID: INV-001-v2 (完全)",
        "検証結果": "是正完了"
      }
    ];

    const csvHistoryData = [
      {
        id: "csv-001",
        "出力ID": "csv-001",
        "実行ユーザーID": "user-001",
        "実行日時": "2024-01-22T08:00:00Z",
        "出力対象差異件数": 150,
        "出力ファイル識別子": "audit_export_20240122_001.csv",
        "出力ステータス": "成功"
      },
      {
        id: "csv-002",
        "出力ID": "csv-002",
        "実行ユーザーID": "user-003",
        "実行日時": "2024-01-28T17:45:00Z",
        "出力対象差異件数": 75,
        "出力ファイル識別子": "audit_export_20240128_002.csv",
        "出力ステータス": "成功"
      }
    ];

    mockListRecords
      .mockResolvedValueOnce(confirmationHistoryData)
      .mockResolvedValueOnce(correctionHistoryData)
      .mockResolvedValueOnce(csvHistoryData);

    const input = {
      startDateTime: '2024-01-01T00:00:00Z',
      endDateTime: '2024-01-31T23:59:59Z',
      retentionDays: 90
    };

    const result = await retrieveMonitoringLogsAndCorrectionHistory(input);

    // 確認履歴: 3件が期間内で取得
    expect(result.confirmationHistory).toHaveLength(3);

    // 是正追跡履歴: 2件が期間内で取得
    expect(result.correctionTrackingHistory).toHaveLength(2);

    // CSV出力監査履歴: 2件が期間内で取得
    expect(result.csvExportAuditHistory).toHaveLength(2);

    // 合計件数: 7件
    expect(result.totalRecordCount).toBe(7);

    // 保管期間超過件数: 0件
    expect(result.retentionExceededCount).toBe(0);
  });
});
