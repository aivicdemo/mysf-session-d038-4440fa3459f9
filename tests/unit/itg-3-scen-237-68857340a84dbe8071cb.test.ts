jest.mock('../../src/platform/data-store');

import {
  retrieveMonitoringLogsAndCorrectionHistory,
  InvalidDateRangeError,
} from '../../src/logic/discrepancy-persistence';
import type {
  MonitoringLogRecord,
  CorrectionTrackingHistoryRecord,
  CSVExportAuditRecord,
} from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

describe('SCEN-237: 指定期間内の差異確認履歴・是正追跡管理・CSV出力実行履歴が複数件存在し、すべて保管期間内のとき、3つの履歴タイプすべてを取得し保管期間超過件数ゼロで返す', () => {
  const confirmationHistoryRecords = [
    {
      '確認ID': 'uuid-001',
      '差異ID': 'uuid-diff-001',
      '確認ユーザーID': 'uuid-user-001',
      '確認日時': '2026-01-15T10:30:00Z',
      '確認内容': '差異内容A',
      '判定結果': '確認済み',
    },
    {
      '確認ID': 'uuid-002',
      '差異ID': 'uuid-diff-002',
      '確認ユーザーID': 'uuid-user-002',
      '確認日時': '2026-01-20T14:15:00Z',
      '確認内容': '差異内容B',
      '判定結果': '承認待ち',
    },
  ];

  const correctionTrackingRecords = [
    {
      '是正ID': 'uuid-corr-001',
      '差異ID': 'uuid-diff-001',
      '是正方法': '手動修正',
      '是正ステータス': '完了',
      '是正実行者': 'uuid-user-003',
      '是正実行日時': '2026-01-18T09:00:00Z',
      '是正前データ': '旧値',
      '是正後データ': '新値',
      '検証結果': '成功',
    },
    {
      '是正ID': 'uuid-corr-002',
      '差異ID': 'uuid-diff-003',
      '是正方法': '自動同期',
      '是正ステータス': '実行中',
      '是正実行者': 'uuid-user-004',
      '是正実行日時': '2026-01-25T16:45:00Z',
      '是正前データ': '前値',
      '是正後データ': '後値',
      '検証結果': '検証中',
    },
  ];

  const csvExportRecords = [
    {
      '出力ID': 'uuid-csv-001',
      '実行ユーザーID': 'uuid-user-005',
      '実行日時': '2026-01-22T11:20:00Z',
      '出力対象差異件数': 25,
      '出力ファイル識別子': 'report-20260122-001.csv',
      '出力ステータス': '成功',
    },
    {
      '出力ID': 'uuid-csv-002',
      '実行ユーザーID': 'uuid-user-006',
      '実行日時': '2026-01-28T13:00:00Z',
      '出力対象差異件数': 12,
      '出力ファイル識別子': 'report-20260128-001.csv',
      '出力ステータス': '成功',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce(confirmationHistoryRecords)
      .mockResolvedValueOnce(correctionTrackingRecords)
      .mockResolvedValueOnce(csvExportRecords);
  });

  it('指定期間内の3つの履歴タイプがすべて取得され、保管期間内フラグが true で返される', async () => {
    const input = {
      startDateTime: '2026-01-01T00:00:00Z',
      endDateTime: '2026-01-31T23:59:59Z',
      retentionDays: 90,
    };

    const result = await retrieveMonitoringLogsAndCorrectionHistory(input);

    expect(result.confirmationHistory).toHaveLength(2);
    expect(result.correctionTrackingHistory).toHaveLength(2);
    expect(result.csvExportAuditHistory).toHaveLength(2);
    expect(result.totalRecordCount).toBe(6);
    expect(result.retentionExceededCount).toBe(0);
  });

  it('差異確認履歴レコードが正しく変換される', async () => {
    const input = {
      startDateTime: '2026-01-01T00:00:00Z',
      endDateTime: '2026-01-31T23:59:59Z',
      retentionDays: 90,
    };

    const result = await retrieveMonitoringLogsAndCorrectionHistory(input);

    const confirmationHistory = result.confirmationHistory as any[];
    expect(confirmationHistory[0].confirmationId).toBe('uuid-001');
    expect(confirmationHistory[0].discrepancyId).toBe('uuid-diff-001');
    expect(confirmationHistory[0].isWithinRetentionPeriod).toBe(true);
    expect(confirmationHistory[1].confirmationId).toBe('uuid-002');
    expect(confirmationHistory[1].discrepancyId).toBe('uuid-diff-002');
  });

  it('是正追跡管理レコードが正しく変換される', async () => {
    const input = {
      startDateTime: '2026-01-01T00:00:00Z',
      endDateTime: '2026-01-31T23:59:59Z',
      retentionDays: 90,
    };

    const result = await retrieveMonitoringLogsAndCorrectionHistory(input);

    const correctionTracking = result.correctionTrackingHistory as any[];
    expect(correctionTracking[0].correctionId).toBe('uuid-corr-001');
    expect(correctionTracking[0].differenceId).toBe('uuid-diff-001');
    expect(correctionTracking[0].isWithinRetentionPeriod).toBe(true);
    expect(correctionTracking[1].correctionId).toBe('uuid-corr-002');
  });

  it('CSV出力実行履歴レコードが正しく変換される', async () => {
    const input = {
      startDateTime: '2026-01-01T00:00:00Z',
      endDateTime: '2026-01-31T23:59:59Z',
      retentionDays: 90,
    };

    const result = await retrieveMonitoringLogsAndCorrectionHistory(input);

    const csvExport = result.csvExportAuditHistory as any[];
    expect(csvExport[0].exportId).toBe('uuid-csv-001');
    expect(csvExport[0].isWithinRetentionPeriod).toBe(true);
    expect(csvExport[1].exportId).toBe('uuid-csv-002');
    expect(csvExport[1].isWithinRetentionPeriod).toBe(true);
  });

  it('データストアから正しいテーブルが照会される', async () => {
    const input = {
      startDateTime: '2026-01-01T00:00:00Z',
      endDateTime: '2026-01-31T23:59:59Z',
      retentionDays: 90,
    };

    await retrieveMonitoringLogsAndCorrectionHistory(input);

    expect(dataStore.listRecords).toHaveBeenCalledTimes(3);
    expect(dataStore.listRecords).toHaveBeenNthCalledWith(1, '差異確認履歴', expect.any(Object));
    expect(dataStore.listRecords).toHaveBeenNthCalledWith(2, '是正追跡管理', expect.any(Object));
    expect(dataStore.listRecords).toHaveBeenNthCalledWith(3, 'CSV出力実行履歴', expect.any(Object));
  });
});
