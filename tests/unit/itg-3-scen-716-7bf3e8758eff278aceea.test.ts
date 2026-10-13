import { jest } from '@jest/globals';
import { retrieveMonitoringLogsAndCorrectionHistory } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

const mockedDataStore = dataStore as jest.Mocked<typeof dataStore>;

describe('SCEN-716: 営業部システム担当が是正後のデータ整合性を再確認した状態から、監視ログと是正履歴を取得して記録項目ごとに分類対象データを抽出する', () => {
  const now = new Date('2026-01-31T23:59:59Z');
  const startDateTime = '2026-01-01T00:00:00Z';
  const endDateTime = '2026-01-31T23:59:59Z';
  const retentionDays = 90;

  const confirmationHistoryData = [
    {
      id: 'conf-001-uuid',
      確認ID: 'conf-001-uuid',
      差異ID: 'diff-001-uuid',
      確認ユーザーID: 'user-sales-manager-uuid',
      確認日時: '2026-01-10T10:30:00Z',
      確認内容: '営業部システムの顧客マスタ不整合を確認。顧客ID差異3件を特定。',
      判定結果: '確認済み',
      createdAt: '2026-01-10T10:30:00Z',
    },
    {
      id: 'conf-002-uuid',
      確認ID: 'conf-002-uuid',
      差異ID: 'diff-002-uuid',
      確認ユーザーID: 'user-sales-manager-uuid',
      確認日時: '2026-01-15T14:20:00Z',
      確認内容: '是正後データの再確認。整合性確認完了。',
      判定結果: '再確認完了',
      createdAt: '2026-01-15T14:20:00Z',
    },
    {
      id: 'conf-003-uuid',
      確認ID: 'conf-003-uuid',
      差異ID: 'diff-003-uuid',
      確認ユーザーID: 'user-sales-manager-uuid',
      確認日時: '2025-10-05T09:15:00Z',
      確認内容: '保管期間外の旧データ確認。',
      判定結果: '確認済み',
      createdAt: '2025-10-05T09:15:00Z',
    },
  ];

  const correctionTrackingData = [
    {
      id: 'corr-001-uuid',
      是正ID: 'corr-001-uuid',
      差異ID: 'diff-001-uuid',
      是正方法: 'マスタデータ統合',
      是正ステータス: '完了',
      是正実行者: 'user-sales-manager-uuid',
      是正実行日時: '2026-01-12T11:45:00Z',
      是正前データ: '{"customerID":"C-OLD-001","name":"顧客A"}',
      是正後データ: '{"customerID":"C-NEW-001","name":"顧客A"}',
      検証結果: '整合性確認済み',
      createdAt: '2026-01-12T11:45:00Z',
    },
    {
      id: 'corr-002-uuid',
      是正ID: 'corr-002-uuid',
      差異ID: 'diff-002-uuid',
      是正方法: 'データ同期',
      是正ステータス: '完了',
      是正実行者: 'user-sales-manager-uuid',
      是正実行日時: '2026-01-16T13:00:00Z',
      是正前データ: '{"amount":"1000000"}',
      是正後データ: '{"amount":"1000000","syncFlag":true}',
      検証結果: '再検証完了',
      createdAt: '2026-01-16T13:00:00Z',
    },
    {
      id: 'corr-003-uuid',
      是正ID: 'corr-003-uuid',
      差異ID: 'diff-003-uuid',
      是正方法: 'ロールバック',
      是正ステータス: '完了',
      是正実行者: 'user-admin-uuid',
      是正実行日時: '2025-10-06T08:30:00Z',
      是正前データ: '{"status":"error"}',
      是正後データ: '{"status":"active"}',
      検証結果: '確認完了',
      createdAt: '2025-10-06T08:30:00Z',
    },
  ];

  const csvExportHistoryData = [
    {
      id: 'csv-001-uuid',
      出力ID: 'csv-001-uuid',
      実行ユーザーID: 'user-sales-manager-uuid',
      実行日時: '2026-01-20T16:30:00Z',
      出力対象差異件数: 3,
      出力ファイル識別子: 'report-2026-01-20-001.csv',
      出力ステータス: '成功',
      createdAt: '2026-01-20T16:30:00Z',
    },
    {
      id: 'csv-002-uuid',
      出力ID: 'csv-002-uuid',
      実行ユーザーID: 'user-sales-manager-uuid',
      実行日時: '2026-01-25T15:45:00Z',
      出力対象差異件数: 5,
      出力ファイル識別子: 'report-2026-01-25-correction-log.csv',
      出力ステータス: '成功',
      createdAt: '2026-01-25T15:45:00Z',
    },
    {
      id: 'csv-003-uuid',
      出力ID: 'csv-003-uuid',
      実行ユーザーID: 'user-admin-uuid',
      実行日時: '2025-09-15T10:00:00Z',
      出力対象差異件数: 2,
      出力ファイル識別子: 'report-2025-09-15-archive.csv',
      出力ステータス: '成功',
      createdAt: '2025-09-15T10:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    mockedDataStore.listRecords.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('指定期間内のレコードを期間でフィルタリングし、保管期間判定を付与して返す', async () => {
    mockedDataStore.listRecords.mockImplementation(async (tableName: string) => {
      if (tableName === '差異確認履歴') {
        return confirmationHistoryData;
      } else if (tableName === '是正追跡管理') {
        return correctionTrackingData;
      } else if (tableName === 'CSV出力実行履歴') {
        return csvExportHistoryData;
      }
      return [];
    });

    const result = await retrieveMonitoringLogsAndCorrectionHistory({
      startDateTime,
      endDateTime,
      retentionDays,
    });

    expect(result.confirmationHistory).toHaveLength(2);
    expect(result.confirmationHistory[0].confirmationId).toBe('conf-001-uuid');
    expect(result.confirmationHistory[1].confirmationId).toBe('conf-002-uuid');
    expect(result.confirmationHistory.every((r) => r.isWithinRetentionPeriod === true)).toBe(true);

    expect(result.correctionTrackingHistory).toHaveLength(2);
    expect(result.correctionTrackingHistory[0].correctionId).toBe('corr-001-uuid');
    expect(result.correctionTrackingHistory[1].correctionId).toBe('corr-002-uuid');
    expect(result.correctionTrackingHistory.every((r) => r.isWithinRetentionPeriod === true)).toBe(
      true,
    );

    expect(result.csvExportAuditHistory).toHaveLength(2);
    expect(result.csvExportAuditHistory[0].exportId).toBe('csv-001-uuid');
    expect(result.csvExportAuditHistory[1].exportId).toBe('csv-002-uuid');
    expect(result.csvExportAuditHistory.every((r) => r.isWithinRetentionPeriod === true)).toBe(true);

    expect(result.totalRecordCount).toBe(6);
    expect(result.retentionExceededCount).toBe(0);
  });
});
