import { retrieveMonitoringLogsAndCorrectionHistory } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-727: 分類別件数集計', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('分類結果に基づいて保管対象別の件数集計が返される', async () => {
    const mockListRecords = jest.mocked(dataStore.listRecords);

    const confirmationHistoryData = [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        "確認ID": "550e8400-e29b-41d4-a716-446655440001",
        "差異ID": "550e8400-e29b-41d4-a716-446655440011",
        "確認ユーザーID": "550e8400-e29b-41d4-a716-446655440021",
        "確認日時": "2024-01-15T10:30:00Z",
        "確認内容": "売上計上時期の相違を確認",
        "判定結果": "audit"
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        "確認ID": "550e8400-e29b-41d4-a716-446655440002",
        "差異ID": "550e8400-e29b-41d4-a716-446655440012",
        "確認ユーザーID": "550e8400-e29b-41d4-a716-446655440022",
        "確認日時": "2024-01-20T14:15:00Z",
        "確認内容": "手数料計算ロジック相違",
        "判定結果": "compliance"
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        "確認ID": "550e8400-e29b-41d4-a716-446655440003",
        "差異ID": "550e8400-e29b-41d4-a716-446655440013",
        "確認ユーザーID": "550e8400-e29b-41d4-a716-446655440023",
        "確認日時": "2024-01-25T09:45:00Z",
        "確認内容": "数量ピッキング誤差",
        "判定結果": "normal"
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440004",
        "確認ID": "550e8400-e29b-41d4-a716-446655440004",
        "差異ID": "550e8400-e29b-41d4-a716-446655440014",
        "確認ユーザーID": "550e8400-e29b-41d4-a716-446655440024",
        "確認日時": "2023-10-10T11:20:00Z",
        "確認内容": "レート換算誤差",
        "判定結果": "delete"
      }
    ];

    const correctionHistoryData = [
      {
        id: "550e8400-e29b-41d4-a716-446655440101",
        "是正ID": "550e8400-e29b-41d4-a716-446655440101",
        "差異ID": "550e8400-e29b-41d4-a716-446655440011",
        "是正方法": "manual_adjustment",
        "是正ステータス": "completed",
        "是正実行者": "550e8400-e29b-41d4-a716-446655440031",
        "是正実行日時": "2024-01-16T08:00:00Z",
        "是正前データ": "{\"amount\": 150000}",
        "是正後データ": "{\"amount\": 155000}",
        "検証結果": "compliance"
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440102",
        "是正ID": "550e8400-e29b-41d4-a716-446655440102",
        "差異ID": "550e8400-e29b-41d4-a716-446655440012",
        "是正方法": "system_recalc",
        "是正ステータス": "completed",
        "是正実行者": "550e8400-e29b-41d4-a716-446655440032",
        "是正実行日時": "2024-01-21T10:30:00Z",
        "是正前データ": "{\"fee\": 5000}",
        "是正後データ": "{\"fee\": 5250}",
        "検証結果": "audit"
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440103",
        "是正ID": "550e8400-e29b-41d4-a716-446655440103",
        "差異ID": "550e8400-e29b-41d4-a716-446655440015",
        "是正方法": "manual_adjustment",
        "是正ステータス": "pending",
        "是正実行者": "550e8400-e29b-41d4-a716-446655440033",
        "是正実行日時": "2023-09-01T15:45:00Z",
        "是正前データ": "{\"quantity\": 100}",
        "是正後データ": "{\"quantity\": 105}",
        "検証結果": "delete"
      }
    ];

    const csvHistoryData = [
      {
        id: "550e8400-e29b-41d4-a716-446655440201",
        "出力ID": "550e8400-e29b-41d4-a716-446655440201",
        "実行ユーザーID": "550e8400-e29b-41d4-a716-446655440041",
        "実行日時": "2024-01-18T16:20:00Z",
        "出力対象差異件数": 5,
        "出力ファイル識別子": "report-2024-01-18-001.csv",
        "出力ステータス": "success"
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440202",
        "出力ID": "550e8400-e29b-41d4-a716-446655440202",
        "実行ユーザーID": "550e8400-e29b-41d4-a716-446655440042",
        "実行日時": "2024-01-22T13:10:00Z",
        "出力対象差異件数": 3,
        "出力ファイル識別子": "report-2024-01-22-002.csv",
        "出力ステータス": "success"
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440203",
        "出力ID": "550e8400-e29b-41d4-a716-446655440203",
        "実行ユーザーID": "550e8400-e29b-41d4-a716-446655440043",
        "実行日時": "2023-08-15T09:30:00Z",
        "出力対象差異件数": 2,
        "出力ファイル識別子": "report-2023-08-15-003.csv",
        "出力ステータス": "success"
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

    // 期間内の確認履歴: 3件（2024-01-15, 2024-01-20, 2024-01-25）
    expect(result.confirmationHistory).toHaveLength(3);

    // 期間内の是正追跡管理: 2件（2024-01-16, 2024-01-21）
    expect(result.correctionTrackingHistory).toHaveLength(2);

    // 期間内のCSV出力実行履歴: 2件（2024-01-18, 2024-01-22）
    expect(result.csvExportAuditHistory).toHaveLength(2);

    // 合計件数: 7件
    expect(result.totalRecordCount).toBe(7);

    // 保管期間超過件数: 0件（期間内の全レコードが90日以内）
    expect(result.retentionExceededCount).toBe(0);
  });
});
