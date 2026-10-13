import { retrieveMonitoringLogsAndCorrectionHistory, DataStoreError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-723: 監視ログの必須フィールド不完全によるエラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('是正追跡管理レコードの必須フィールド「是正実行者」がnullの場合、DataStoreErrorが発生する', async () => {
    const mockListRecords = jest.mocked(dataStore.listRecords);

    const confirmationHistoryData = [{
      id: "550e8400-e29b-41d4-a716-446655440001",
      "確認ID": "550e8400-e29b-41d4-a716-446655440001",
      "差異ID": "550e8400-e29b-41d4-a716-446655440010",
      "確認ユーザーID": "550e8400-e29b-41d4-a716-446655440020",
      "確認日時": "2025-01-15T10:30:00Z",
      "確認内容": "金額不一致を確認",
      "判定結果": "差異あり"
    }];

    const correctionHistoryData = [{
      id: "550e8400-e29b-41d4-a716-446655440002",
      "是正ID": "550e8400-e29b-41d4-a716-446655440002",
      "差異ID": "550e8400-e29b-41d4-a716-446655440010",
      "是正方法": "手動修正",
      "是正ステータス": "完了",
      "是正実行者": null,
      "是正実行日時": "2025-01-20T14:00:00Z",
      "是正前データ": "{\"amount\": 10000}",
      "是正後データ": "{\"amount\": 15000}",
      "検証結果": "成功"
    }];

    const csvHistoryData = [{
      id: "550e8400-e29b-41d4-a716-446655440003",
      "出力ID": "550e8400-e29b-41d4-a716-446655440003",
      "実行ユーザーID": "550e8400-e29b-41d4-a716-446655440020",
      "実行日時": "2025-01-25T09:15:00Z",
      "出力対象差異件数": 5,
      "出力ファイル識別子": "report_20250125_001.csv",
      "出力ステータス": null
    }];

    mockListRecords
      .mockResolvedValueOnce(confirmationHistoryData)
      .mockResolvedValueOnce(correctionHistoryData)
      .mockResolvedValueOnce(csvHistoryData);

    const input = {
      startDateTime: '2025-01-01T00:00:00Z',
      endDateTime: '2025-01-31T23:59:59Z',
      retentionDays: 90
    };

    await expect(retrieveMonitoringLogsAndCorrectionHistory(input)).rejects.toThrow(DataStoreError);
    await expect(retrieveMonitoringLogsAndCorrectionHistory(input)).rejects.toThrow('監視ログと是正履歴の取得に失敗しました。');
  });
});
