import { retrieveMonitoringLogsAndCorrectionHistory } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';
import type { MonitoringLogRecord, CorrectionTrackingHistoryRecord, CSVExportAuditRecord } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-722: 移行完了日が未指定のとき、保管期間終了日の計算精度に関する警告が発生するが処理は続行する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('移行完了日が未指定の場合、警告が記録されても処理が完了する', async () => {

    const confirmationHistory: MonitoringLogRecord[] = [
      {
        confirmationId: 'uuid-conf-001',
        discrepancyId: 'uuid-diff-001',
        confirmationUserId: 'uuid-user-001',
        confirmationDateTime: '2024-01-15T10:30:00Z',
        confirmationContent: '差異を確認しました',
        judgmentResult: '確認済',
        retentionStatus: 'active',
        isWithinRetentionPeriod: true,
      },
    ];

    const correctionTrackingHistory: CorrectionTrackingHistoryRecord[] = [
      {
        correctionId: 'uuid-corr-001',
        differenceId: 'uuid-diff-001',
        correctionMethod: 'データ修正',
        correctionStatus: '完了',
        correctionExecutorUserId: 'uuid-user-002',
        correctionExecutionDateTime: '2024-01-20T14:00:00Z',
        dataBeforeCorrection: '旧値',
        dataAfterCorrection: '新値',
        verificationResult: '正常',
        retentionStatus: 'active',
        isWithinRetentionPeriod: true,
      },
    ];

    const csvExportAuditHistory: CSVExportAuditRecord[] = [
      {
        exportId: 'uuid-csv-001',
        executionUserId: 'uuid-user-003',
        executionDateTime: '2024-01-25T09:15:00Z',
        exportedDiscrepancyCount: 5,
        fileIdentifier: 'report-20240125',
        exportStatus: '成功',
        retentionStatus: 'active',
        isWithinRetentionPeriod: true,
      },
    ];

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '差異確認履歴') {
        return Promise.resolve(confirmationHistory);
      } else if (tableName === '是正追跡管理') {
        return Promise.resolve(correctionTrackingHistory);
      } else if (tableName === 'CSV出力実行履歴') {
        return Promise.resolve(csvExportAuditHistory);
      }
      return Promise.resolve([]);
    });

    const input = {
      startDateTime: '2024-01-01T00:00:00Z',
      endDateTime: '2024-01-31T23:59:59Z',
      retentionDays: 90,
    };

    const result = await retrieveMonitoringLogsAndCorrectionHistory(input);

    // 処理が正常に完了し、期待する結果を返す
    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.csvExportAuditHistory).toHaveLength(1);
    expect(result.totalRecordCount).toBe(3);
    expect(result.retentionExceededCount).toBe(0);

    // dataStore.listRecords が期待通り呼ばれたことを確認
    expect(dataStore.listRecords).toHaveBeenCalledWith('差異確認履歴');
    expect(dataStore.listRecords).toHaveBeenCalledWith('是正追跡管理');
    expect(dataStore.listRecords).toHaveBeenCalledWith('CSV出力実行履歴');
  });

  it('指定期間内のレコードのみを返す', async () => {
    const confirmationHistory: MonitoringLogRecord[] = [
      {
        confirmationId: 'uuid-conf-001',
        discrepancyId: 'uuid-diff-001',
        confirmationUserId: 'uuid-user-001',
        confirmationDateTime: '2024-01-15T10:30:00Z',
        confirmationContent: '差異を確認しました',
        judgmentResult: '確認済',
        retentionStatus: 'active',
        isWithinRetentionPeriod: true,
      },
      {
        confirmationId: 'uuid-conf-002',
        discrepancyId: 'uuid-diff-002',
        confirmationUserId: 'uuid-user-001',
        confirmationDateTime: '2024-02-15T10:30:00Z',
        confirmationContent: '別の差異を確認',
        judgmentResult: '確認済',
        retentionStatus: 'active',
        isWithinRetentionPeriod: false,
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(confirmationHistory);

    const input = {
      startDateTime: '2024-01-01T00:00:00Z',
      endDateTime: '2024-01-31T23:59:59Z',
      retentionDays: 90,
    };

    const result = await retrieveMonitoringLogsAndCorrectionHistory(input);

    // 指定期間内の1件のレコードのみを返す
    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].confirmationId).toBe('uuid-conf-001');
    expect(result.confirmationHistory[0].confirmationDateTime).toBe('2024-01-15T10:30:00Z');
  });
});
