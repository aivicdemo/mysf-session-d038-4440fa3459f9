import { jest } from '@jest/globals';
import { retrieveMonitoringLogsAndCorrectionHistory } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

const mockedDataStore = dataStore as jest.Mocked<typeof dataStore>;

describe('SCEN-717: IT部門への報告権限を持つユーザーであることが検証され、分類保管処理の実行権限が確認される', () => {
  const now = new Date('2026-01-31T23:59:59Z');
  const startDateTime = '2026-01-01T00:00:00Z';
  const endDateTime = '2026-01-31T23:59:59Z';
  const retentionDays = 90;

  const confirmationHistoryData = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      確認ID: '550e8400-e29b-41d4-a716-446655440001',
      差異ID: '650e8400-e29b-41d4-a716-446655440001',
      確認ユーザーID: '750e8400-e29b-41d4-a716-446655440001',
      確認日時: '2026-01-15T10:30:00Z',
      確認内容: '差異内容の確認完了',
      判定結果: '確認済み',
      createdAt: '2026-01-15T10:30:00Z',
    },
  ];

  const correctionTrackingData = [
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      是正ID: '550e8400-e29b-41d4-a716-446655440002',
      差異ID: '650e8400-e29b-41d4-a716-446655440001',
      是正方法: '手動修正',
      是正ステータス: '完了',
      是正実行者: '750e8400-e29b-41d4-a716-446655440002',
      是正実行日時: '2026-01-16T14:20:00Z',
      是正前データ: '修正前の値',
      是正後データ: '修正後の値',
      検証結果: '検証成功',
      createdAt: '2026-01-16T14:20:00Z',
    },
  ];

  const csvExportHistoryData = [
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      出力ID: '550e8400-e29b-41d4-a716-446655440003',
      実行ユーザーID: '750e8400-e29b-41d4-a716-446655440003',
      実行日時: '2026-01-20T09:15:00Z',
      出力対象差異件数: 25,
      出力ファイル識別子: 'export_2026_01_20_091500.csv',
      出力ステータス: '成功',
      createdAt: '2026-01-20T09:15:00Z',
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

  it('指定期間内の各テーブルから1件ずつレコードを取得し、保管期間内として返す', async () => {
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
    expect(result.confirmationHistory[0].confirmationId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.confirmationHistory[0].confirmationDateTime).toBe('2026-01-15T10:30:00Z');
    expect(result.confirmationHistory[0].isWithinRetentionPeriod).toBe(true);

    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0].correctionId).toBe('550e8400-e29b-41d4-a716-446655440002');
    expect(result.correctionTrackingHistory[0].correctionExecutionDateTime).toBe('2026-01-16T14:20:00Z');
    expect(result.correctionTrackingHistory[0].isWithinRetentionPeriod).toBe(true);

    expect(result.csvExportAuditHistory).toHaveLength(1);
    expect(result.csvExportAuditHistory[0].exportId).toBe('550e8400-e29b-41d4-a716-446655440003');
    expect(result.csvExportAuditHistory[0].executionDateTime).toBe('2026-01-20T09:15:00Z');
    expect(result.csvExportAuditHistory[0].isWithinRetentionPeriod).toBe(true);

    expect(result.totalRecordCount).toBe(3);
    expect(result.retentionExceededCount).toBe(0);
  });
});
