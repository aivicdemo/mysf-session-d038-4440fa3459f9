import { retrieveMonitoringLogsAndCorrectionHistory } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-726: 1年保管期間の通常監視ログ分類', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('通常の監視ログが通常保管として分類され、1年間の保管期間で保管終了日が計算される', async () => {
    const mockListRecords = jest.mocked(dataStore.listRecords);

    const confirmationHistoryData = [
      {
        id: "confirm-001",
        "確認ID": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "差異ID": "d47ac10b-58cc-4372-a567-0e02b2c3d400",
        "確認ユーザーID": "a47ac10b-58cc-4372-a567-0e02b2c3d401",
        "確認日時": "2024-01-15T10:30:00Z",
        "確認内容": "通常の差異確認",
        "判定結果": "要確認",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ];

    const correctionHistoryData: any[] = [];
    const csvHistoryData: any[] = [];

    mockListRecords
      .mockResolvedValueOnce(confirmationHistoryData)
      .mockResolvedValueOnce(correctionHistoryData)
      .mockResolvedValueOnce(csvHistoryData);

    const input = {
      startDateTime: '2024-01-01T00:00:00Z',
      endDateTime: '2024-01-31T23:59:59Z',
      retentionDays: 365
    };

    const result = await retrieveMonitoringLogsAndCorrectionHistory(input);

    // 確認履歴: 1件が期間内で取得
    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].confirmationDateTime).toBe('2024-01-15T10:30:00Z');
    expect(result.confirmationHistory[0].judgmentResult).toBe('要確認');
    expect(result.confirmationHistory[0].isWithinRetentionPeriod).toBe(true);

    // 是正追跡履歴: 0件（空配列）
    expect(result.correctionTrackingHistory).toHaveLength(0);

    // CSV出力監査履歴: 0件（空配列）
    expect(result.csvExportAuditHistory).toHaveLength(0);

    // 合計件数: 1件
    expect(result.totalRecordCount).toBe(1);

    // 保管期間超過件数: 0件
    expect(result.retentionExceededCount).toBe(0);
  });
});
