import { retrieveMonitoringLogsAndCorrectionHistory } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-729: 監視ログと是正履歴の分類保管', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('各ログエントリの保管先が監査ログ専用ストレージ、コンプライアンス記録庫、通常ログ保管、削除スケジュールのいずれかに指定されて返される', async () => {
    const confirmationHistoryData = [
      {
        id: 'conf-001',
        確認ID: 'conf-001',
        差異ID: 'diff-001',
        確認ユーザーID: 'user-001',
        確認日時: '2025-01-15T10:30:00Z',
        確認内容: '差異内容の確認完了',
        判定結果: 'CONFIRMED',
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-15T10:30:00Z',
      },
      {
        id: 'conf-002',
        確認ID: 'conf-002',
        差異ID: 'diff-002',
        確認ユーザーID: 'user-002',
        確認日時: '2024-10-01T14:20:00Z',
        確認内容: '期間外の古いレコード',
        判定結果: 'CONFIRMED',
        createdAt: '2024-10-01T14:20:00Z',
        updatedAt: '2024-10-01T14:20:00Z',
      },
    ];

    const correctionTrackingData = [
      {
        id: 'corr-001',
        是正ID: 'corr-001',
        差異ID: 'diff-001',
        是正方法: 'DATA_UPDATE',
        是正ステータス: 'COMPLETED',
        是正実行者: 'user-003',
        是正実行日時: '2025-01-20T09:15:00Z',
        是正前データ: 'old_value_1',
        是正後データ: 'new_value_1',
        検証結果: 'VERIFIED',
        createdAt: '2025-01-20T09:15:00Z',
        updatedAt: '2025-01-20T09:15:00Z',
      },
      {
        id: 'corr-002',
        是正ID: 'corr-002',
        差異ID: 'diff-003',
        是正方法: 'MANUAL_REVIEW',
        是正ステータス: 'PENDING',
        是正実行者: 'user-004',
        是正実行日時: '2024-09-15T11:45:00Z',
        是正前データ: 'old_value_2',
        是正後データ: 'new_value_2',
        検証結果: 'PENDING',
        createdAt: '2024-09-15T11:45:00Z',
        updatedAt: '2024-09-15T11:45:00Z',
      },
    ];

    const csvExportData = [
      {
        id: 'csv-001',
        出力ID: 'csv-001',
        実行ユーザーID: 'user-005',
        実行日時: '2025-01-25T16:30:00Z',
        出力対象差異件数: 42,
        出力ファイル識別子: 'report_2025_01_25.csv',
        出力ステータス: 'SUCCESS',
        createdAt: '2025-01-25T16:30:00Z',
        updatedAt: '2025-01-25T16:30:00Z',
      },
      {
        id: 'csv-002',
        出力ID: 'csv-002',
        実行ユーザーID: 'user-006',
        実行日時: '2024-09-20T13:00:00Z',
        出力対象差異件数: 15,
        出力ファイル識別子: 'report_2024_09_20.csv',
        出力ステータス: 'SUCCESS',
        createdAt: '2024-09-20T13:00:00Z',
        updatedAt: '2024-09-20T13:00:00Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '差異確認履歴') return Promise.resolve(confirmationHistoryData);
      if (tableName === '是正追跡管理') return Promise.resolve(correctionTrackingData);
      if (tableName === 'CSV出力実行履歴') return Promise.resolve(csvExportData);
      return Promise.resolve([]);
    });

    const result = await retrieveMonitoringLogsAndCorrectionHistory({
      startDateTime: '2025-01-01T00:00:00Z',
      endDateTime: '2025-01-31T23:59:59Z',
      retentionDays: 90,
    });

    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].confirmationId).toBe('conf-001');
    expect(result.confirmationHistory[0].confirmationDateTime).toBe('2025-01-15T10:30:00Z');
    expect(result.confirmationHistory[0]).toHaveProperty('retentionStatus');
    expect(result.confirmationHistory[0]).toHaveProperty('isWithinRetentionPeriod');

    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0].correctionId).toBe('corr-001');
    expect(result.correctionTrackingHistory[0].correctionExecutionDateTime).toBe('2025-01-20T09:15:00Z');
    expect(result.correctionTrackingHistory[0]).toHaveProperty('retentionStatus');
    expect(result.correctionTrackingHistory[0]).toHaveProperty('isWithinRetentionPeriod');

    expect(result.csvExportAuditHistory).toHaveLength(1);
    expect(result.csvExportAuditHistory[0].exportId).toBe('csv-001');
    expect(result.csvExportAuditHistory[0].executionDateTime).toBe('2025-01-25T16:30:00Z');
    expect(result.csvExportAuditHistory[0]).toHaveProperty('retentionStatus');
    expect(result.csvExportAuditHistory[0]).toHaveProperty('isWithinRetentionPeriod');

    expect(result.totalRecordCount).toBe(3);
    expect(result.retentionExceededCount).toBe(0);

    // All records within the retention period should have valid retentionStatus
    const validRetentionStatuses = [
      '監査ログ専用ストレージ',
      'コンプライアンス記録庫',
      '通常ログ保管',
      '削除スケジュール',
    ];
    result.confirmationHistory.forEach((record) => {
      expect(validRetentionStatuses).toContain(record.retentionStatus);
    });
    result.correctionTrackingHistory.forEach((record) => {
      expect(validRetentionStatuses).toContain(record.retentionStatus);
    });
    result.csvExportAuditHistory.forEach((record) => {
      expect(validRetentionStatuses).toContain(record.retentionStatus);
    });
  });
});
