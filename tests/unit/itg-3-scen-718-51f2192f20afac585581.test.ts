import { jest } from '@jest/globals';
import { retrieveMonitoringLogsAndCorrectionHistory } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

const mockedDataStore = dataStore as jest.Mocked<typeof dataStore>;

describe('SCEN-718: 監視ログと是正履歴の分類保管アクティビティ実行が記録され、実行者と実行日時が追跡可能になる', () => {
  const now = new Date('2024-01-31T23:59:59Z');
  const startDateTime = '2024-01-01T00:00:00Z';
  const endDateTime = '2024-01-31T23:59:59Z';
  const retentionDays = 90;

  const confirmationHistoryData = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      確認ID: '550e8400-e29b-41d4-a716-446655440001',
      差異ID: '550e8400-e29b-41d4-a716-446655440101',
      確認ユーザーID: '550e8400-e29b-41d4-a716-446655440201',
      確認日時: '2024-01-15T10:30:00Z',
      確認内容: '金額の差異を確認、原因は請求書計算誤り',
      判定結果: '差異確定',
      createdAt: '2024-01-15T10:30:00Z',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      確認ID: '550e8400-e29b-41d4-a716-446655440002',
      差異ID: '550e8400-e29b-41d4-a716-446655440102',
      確認ユーザーID: '550e8400-e29b-41d4-a716-446655440202',
      確認日時: '2024-01-20T14:15:00Z',
      確認内容: '商品単価の齟齬を確認',
      判定結果: '差異確定',
      createdAt: '2024-01-20T14:15:00Z',
    },
  ];

  const correctionTrackingData = [
    {
      id: '550e8400-e29b-41d4-a716-446655440301',
      是正ID: '550e8400-e29b-41d4-a716-446655440301',
      差異ID: '550e8400-e29b-41d4-a716-446655440101',
      是正方法: '請求書再計算',
      是正ステータス: '完了',
      是正実行者: '550e8400-e29b-41d4-a716-446655440203',
      是正実行日時: '2024-01-16T09:00:00Z',
      是正前データ: '{"amount": 150000}',
      是正後データ: '{"amount": 155000}',
      検証結果: '検証完了',
      createdAt: '2024-01-16T09:00:00Z',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440302',
      是正ID: '550e8400-e29b-41d4-a716-446655440302',
      差異ID: '550e8400-e29b-41d4-a716-446655440102',
      是正方法: 'マスタ単価更新',
      是正ステータス: '完了',
      是正実行者: '550e8400-e29b-41d4-a716-446655440204',
      是正実行日時: '2024-01-21T11:45:00Z',
      是正前データ: '{"unitPrice": 10000}',
      是正後データ: '{"unitPrice": 10500}',
      検証結果: '検証完了',
      createdAt: '2024-01-21T11:45:00Z',
    },
  ];

  const csvExportHistoryData = [
    {
      id: '550e8400-e29b-41d4-a716-446655440401',
      出力ID: '550e8400-e29b-41d4-a716-446655440401',
      実行ユーザーID: '550e8400-e29b-41d4-a716-446655440205',
      実行日時: '2024-01-25T16:20:00Z',
      出力対象差異件数: 2,
      出力ファイル識別子: 'diff_report_20240125_001.csv',
      出力ステータス: '成功',
      createdAt: '2024-01-25T16:20:00Z',
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

  it('各レコードの実行者と実行日時が含まれ、追跡可能な状態で返される', async () => {
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
    expect(result.confirmationHistory[0].confirmationUserId).toBe('550e8400-e29b-41d4-a716-446655440201');
    expect(result.confirmationHistory[0].confirmationDateTime).toBe('2024-01-15T10:30:00Z');
    expect(result.confirmationHistory[1].confirmationUserId).toBe('550e8400-e29b-41d4-a716-446655440202');
    expect(result.confirmationHistory[1].confirmationDateTime).toBe('2024-01-20T14:15:00Z');

    expect(result.correctionTrackingHistory).toHaveLength(2);
    expect(result.correctionTrackingHistory[0].correctionExecutorUserId).toBe(
      '550e8400-e29b-41d4-a716-446655440203',
    );
    expect(result.correctionTrackingHistory[0].correctionExecutionDateTime).toBe('2024-01-16T09:00:00Z');
    expect(result.correctionTrackingHistory[1].correctionExecutorUserId).toBe(
      '550e8400-e29b-41d4-a716-446655440204',
    );
    expect(result.correctionTrackingHistory[1].correctionExecutionDateTime).toBe('2024-01-21T11:45:00Z');

    expect(result.csvExportAuditHistory).toHaveLength(1);
    expect(result.csvExportAuditHistory[0].executionUserId).toBe('550e8400-e29b-41d4-a716-446655440205');
    expect(result.csvExportAuditHistory[0].executionDateTime).toBe('2024-01-25T16:20:00Z');

    expect(result.totalRecordCount).toBe(5);
    expect(result.retentionExceededCount).toBe(0);
  });
});
