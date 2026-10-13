import { jest } from '@jest/globals';
import { retrieveMonitoringLogsAndCorrectionHistory } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

const mockedDataStore = dataStore as jest.Mocked<typeof dataStore>;

describe('SCEN-719: 取得した監視ログと是正履歴が記録項目ごとに分類され、保管期間ルールに基づいて保管対象が判定されて是正追跡管理テーブルに永続化される', () => {
  const now = new Date('2024-01-31T23:59:59Z');
  const startDateTime = '2024-01-01T00:00:00Z';
  const endDateTime = '2024-01-31T23:59:59Z';
  const retentionDays = 90;

  const confirmationHistoryData = [
    {
      id: 'conf-001',
      確認ID: 'conf-001',
      差異ID: 'diff-001',
      確認ユーザーID: 'user-001',
      確認日時: '2024-01-10T10:30:00Z',
      確認内容: '差異内容確認完了',
      判定結果: '確認済み',
      createdAt: '2024-01-10T10:30:00Z',
      updatedAt: '2024-01-10T10:30:00Z',
    },
    {
      id: 'conf-002',
      確認ID: 'conf-002',
      差異ID: 'diff-002',
      確認ユーザーID: 'user-002',
      確認日時: '2023-09-15T14:20:00Z',
      確認内容: '過去の差異確認',
      判定結果: '確認済み',
      createdAt: '2023-09-15T14:20:00Z',
      updatedAt: '2023-09-15T14:20:00Z',
    },
  ];

  const correctionTrackingData = [
    {
      id: 'corr-001',
      是正ID: 'corr-001',
      差異ID: 'diff-001',
      是正方法: '手動修正',
      是正ステータス: '完了',
      是正実行者: 'user-003',
      是正実行日時: '2024-01-15T11:45:00Z',
      是正前データ: 'before_value_1',
      是正後データ: 'after_value_1',
      検証結果: '検証完了',
      createdAt: '2024-01-15T11:45:00Z',
      updatedAt: '2024-01-15T11:45:00Z',
    },
    {
      id: 'corr-002',
      是正ID: 'corr-002',
      差異ID: 'diff-003',
      是正方法: '自動修正',
      是正ステータス: '完了',
      是正実行者: 'user-004',
      是正実行日時: '2023-10-01T09:00:00Z',
      是正前データ: 'before_value_2',
      是正後データ: 'after_value_2',
      検証結果: '検証完了',
      createdAt: '2023-10-01T09:00:00Z',
      updatedAt: '2023-10-01T09:00:00Z',
    },
  ];

  const csvExportHistoryData = [
    {
      id: 'export-001',
      出力ID: 'export-001',
      実行ユーザーID: 'user-005',
      実行日時: '2024-01-20T15:30:00Z',
      出力対象差異件数: 25,
      出力ファイル識別子: 'report_20240120_001.csv',
      出力ステータス: '成功',
      createdAt: '2024-01-20T15:30:00Z',
      updatedAt: '2024-01-20T15:30:00Z',
    },
    {
      id: 'export-002',
      出力ID: 'export-002',
      実行ユーザーID: 'user-006',
      実行日時: '2023-08-10T12:00:00Z',
      出力対象差異件数: 10,
      出力ファイル識別子: 'report_20230810_001.csv',
      出力ステータス: '成功',
      createdAt: '2023-08-10T12:00:00Z',
      updatedAt: '2023-08-10T12:00:00Z',
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

  it('指定期間内のレコードのみを分類して返し、期間外のレコードは除外される', async () => {
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

    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].confirmationId).toBe('conf-001');
    expect(result.confirmationHistory[0].isWithinRetentionPeriod).toBe(true);

    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0].correctionId).toBe('corr-001');
    expect(result.correctionTrackingHistory[0].isWithinRetentionPeriod).toBe(true);

    expect(result.csvExportAuditHistory).toHaveLength(1);
    expect(result.csvExportAuditHistory[0].exportId).toBe('export-001');
    expect(result.csvExportAuditHistory[0].isWithinRetentionPeriod).toBe(true);

    expect(result.totalRecordCount).toBe(3);
    expect(result.retentionExceededCount).toBe(0);
  });
});
