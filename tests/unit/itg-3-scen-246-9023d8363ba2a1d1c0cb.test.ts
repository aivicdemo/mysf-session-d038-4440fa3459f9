import { retrieveMonitoringLogsAndCorrectionHistory } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-246: 3タイプが混在し、それぞれ保管期間内と超過のレコードが両方存在するとき', () => {
  it('総レコード数と超過件数が正確に集計される', async () => {
    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;

    // 差異確認履歴：2件（1件は保管期間内、1件は超過）
    const confirmationRecords = [
      {
        id: 'uuid-conf-001',
        confirmationId: 'uuid-conf-001',
        discrepancyId: 'uuid-diff-001',
        confirmationUserId: 'uuid-user-001',
        confirmationDateTime: '2025-01-05T10:00:00Z',
        confirmationContent: '差異内容A',
        judgmentResult: '確認済',
      },
      {
        id: 'uuid-conf-002',
        confirmationId: 'uuid-conf-002',
        discrepancyId: 'uuid-diff-002',
        confirmationUserId: 'uuid-user-002',
        confirmationDateTime: '2024-12-01T14:30:00Z',
        confirmationContent: '差異内容B',
        judgmentResult: '承認',
      },
    ];

    // 是正追跡管理：2件（1件は保管期間内、1件は超過）
    const correctionRecords = [
      {
        id: 'uuid-corr-001',
        correctionId: 'uuid-corr-001',
        differenceId: 'uuid-diff-003',
        correctionMethod: 'データ修正',
        correctionStatus: '完了',
        correctionExecutorUserId: 'uuid-user-003',
        correctionExecutionDateTime: '2025-01-15T09:00:00Z',
        dataBeforeCorrection: '旧データ1',
        dataAfterCorrection: '新データ1',
        verificationResult: '検証済',
      },
      {
        id: 'uuid-corr-002',
        correctionId: 'uuid-corr-002',
        differenceId: 'uuid-diff-004',
        correctionMethod: 'システム調整',
        correctionStatus: '進行中',
        correctionExecutorUserId: 'uuid-user-004',
        correctionExecutionDateTime: '2024-11-20T11:15:00Z',
        dataBeforeCorrection: '旧データ2',
        dataAfterCorrection: '新データ2',
        verificationResult: '未検証',
      },
    ];

    // CSV出力実行履歴：2件（1件は保管期間内、1件は超過）
    const csvExportRecords = [
      {
        id: 'uuid-csv-001',
        exportId: 'uuid-csv-001',
        executionUserId: 'uuid-user-005',
        executionDateTime: '2025-01-20T15:45:00Z',
        exportedDiscrepancyCount: 5,
        fileIdentifier: 'report-2025-01-20-001',
        exportStatus: '成功',
      },
      {
        id: 'uuid-csv-002',
        exportId: 'uuid-csv-002',
        executionUserId: 'uuid-user-006',
        executionDateTime: '2024-12-20T16:20:00Z',
        exportedDiscrepancyCount: 3,
        fileIdentifier: 'report-2024-12-20-001',
        exportStatus: '成功',
      },
    ];

    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '差異確認履歴') return Promise.resolve(confirmationRecords as any);
      if (tableName === '是正追跡管理') return Promise.resolve(correctionRecords as any);
      if (tableName === 'CSV出力実行履歴') return Promise.resolve(csvExportRecords as any);
      return Promise.resolve([]);
    });

    const result = await retrieveMonitoringLogsAndCorrectionHistory({
      startDateTime: '2025-01-01T00:00:00Z',
      endDateTime: '2025-01-31T23:59:59Z',
      retentionDays: 30,
    });

    // 指定期間内（2025-01-01 以上 2025-01-31 以下）のレコードをフィルタ
    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].confirmationId).toBe('uuid-conf-001');
    expect(result.confirmationHistory[0].confirmationDateTime).toBe('2025-01-05T10:00:00Z');
    expect(result.confirmationHistory[0].retentionStatus).toBe('保管期間内');

    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0].correctionId).toBe('uuid-corr-001');
    expect(result.correctionTrackingHistory[0].correctionExecutionDateTime).toBe('2025-01-15T09:00:00Z');
    expect(result.correctionTrackingHistory[0].retentionStatus).toBe('保管期間内');

    expect(result.csvExportAuditHistory).toHaveLength(1);
    expect(result.csvExportAuditHistory[0].exportId).toBe('uuid-csv-001');
    expect(result.csvExportAuditHistory[0].executionDateTime).toBe('2025-01-20T15:45:00Z');
    expect(result.csvExportAuditHistory[0].retentionStatus).toBe('保管期間内');

    expect(result.totalRecordCount).toBe(3);
    expect(result.retentionExceededCount).toBe(3);
  });
});
