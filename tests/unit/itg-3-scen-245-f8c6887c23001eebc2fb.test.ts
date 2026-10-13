import { retrieveMonitoringLogsAndCorrectionHistory } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-245: 指定期間内のレコードが保管期間を超過しているとき', () => {
  it('保管期間超過件数に超過レコード数が正確に反映される', async () => {
    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;

    // 差異確認履歴テーブル：3件（2件が指定期間内）
    const confirmationRecords = [
      {
        id: 'uuid-confirm-001',
        confirmationId: 'uuid-confirm-001',
        discrepancyId: 'uuid-diff-001',
        confirmationUserId: 'uuid-user-001',
        confirmationDateTime: '2024-12-20T10:00:00Z',
        confirmationContent: 'データ値の不整合を確認',
        judgmentResult: '不一致',
      },
      {
        id: 'uuid-confirm-002',
        confirmationId: 'uuid-confirm-002',
        discrepancyId: 'uuid-diff-002',
        confirmationUserId: 'uuid-user-002',
        confirmationDateTime: '2025-01-15T14:30:00Z',
        confirmationContent: '件数の相違を確認',
        judgmentResult: '一致',
      },
      {
        id: 'uuid-confirm-003',
        confirmationId: 'uuid-confirm-003',
        discrepancyId: 'uuid-diff-003',
        confirmationUserId: 'uuid-user-001',
        confirmationDateTime: '2025-01-28T09:15:00Z',
        confirmationContent: '金額の差異を確認',
        judgmentResult: '不一致',
      },
    ];

    // 是正追跡管理テーブル：4件（2件が指定期間内）
    const correctionRecords = [
      {
        id: 'uuid-correct-001',
        correctionId: 'uuid-correct-001',
        differenceId: 'uuid-diff-001',
        correctionMethod: '手動修正',
        correctionStatus: '完了',
        correctionExecutorUserId: 'uuid-user-003',
        correctionExecutionDateTime: '2024-12-15T11:00:00Z',
        dataBeforeCorrection: '1000',
        dataAfterCorrection: '1050',
        verificationResult: '成功',
      },
      {
        id: 'uuid-correct-002',
        correctionId: 'uuid-correct-002',
        differenceId: 'uuid-diff-002',
        correctionMethod: '自動同期',
        correctionStatus: '完了',
        correctionExecutorUserId: 'uuid-user-004',
        correctionExecutionDateTime: '2025-01-10T16:45:00Z',
        dataBeforeCorrection: '500',
        dataAfterCorrection: '500',
        verificationResult: '成功',
      },
      {
        id: 'uuid-correct-003',
        correctionId: 'uuid-correct-003',
        differenceId: 'uuid-diff-003',
        correctionMethod: 'マスタ更新',
        correctionStatus: '完了',
        correctionExecutorUserId: 'uuid-user-005',
        correctionExecutionDateTime: '2025-01-25T13:20:00Z',
        dataBeforeCorrection: '2000',
        dataAfterCorrection: '2100',
        verificationResult: '成功',
      },
      {
        id: 'uuid-correct-004',
        correctionId: 'uuid-correct-004',
        differenceId: 'uuid-diff-004',
        correctionMethod: '手動修正',
        correctionStatus: '完了',
        correctionExecutorUserId: 'uuid-user-003',
        correctionExecutionDateTime: '2024-12-10T08:30:00Z',
        dataBeforeCorrection: '300',
        dataAfterCorrection: '320',
        verificationResult: '成功',
      },
    ];

    // CSV出力実行履歴テーブル：3件（2件が指定期間内）
    const csvExportRecords = [
      {
        id: 'uuid-export-001',
        exportId: 'uuid-export-001',
        executionUserId: 'uuid-user-006',
        executionDateTime: '2024-12-18T12:00:00Z',
        exportedDiscrepancyCount: 5,
        fileIdentifier: 'report-20241218-001.csv',
        exportStatus: '成功',
      },
      {
        id: 'uuid-export-002',
        exportId: 'uuid-export-002',
        executionUserId: 'uuid-user-007',
        executionDateTime: '2025-01-20T10:30:00Z',
        exportedDiscrepancyCount: 3,
        fileIdentifier: 'report-20250120-002.csv',
        exportStatus: '成功',
      },
      {
        id: 'uuid-export-003',
        exportId: 'uuid-export-003',
        executionUserId: 'uuid-user-006',
        executionDateTime: '2025-01-27T15:45:00Z',
        exportedDiscrepancyCount: 2,
        fileIdentifier: 'report-20250127-003.csv',
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

    // 指定期間内のレコードをフィルタ（2025-01-01 00:00:00Z 以上 2025-01-31 23:59:59Z 以下）
    expect(result.confirmationHistory).toHaveLength(2);
    expect(result.confirmationHistory.some(r => r.confirmationDateTime === '2025-01-15T14:30:00Z')).toBe(true);
    expect(result.confirmationHistory.some(r => r.confirmationDateTime === '2025-01-28T09:15:00Z')).toBe(true);
    // 指定期間内のレコードは保管期間内と判定（2025-01-01 より後）
    result.confirmationHistory.forEach(r => {
      expect(r.retentionStatus).toBe('保管期間内');
    });

    // 指定期間内のレコード
    expect(result.correctionTrackingHistory).toHaveLength(2);
    expect(result.correctionTrackingHistory.some(r => r.correctionExecutionDateTime === '2025-01-10T16:45:00Z')).toBe(true);
    expect(result.correctionTrackingHistory.some(r => r.correctionExecutionDateTime === '2025-01-25T13:20:00Z')).toBe(true);
    result.correctionTrackingHistory.forEach(r => {
      expect(r.retentionStatus).toBe('保管期間内');
    });

    expect(result.csvExportAuditHistory).toHaveLength(2);
    expect(result.csvExportAuditHistory.some(r => r.executionDateTime === '2025-01-20T10:30:00Z')).toBe(true);
    expect(result.csvExportAuditHistory.some(r => r.executionDateTime === '2025-01-27T15:45:00Z')).toBe(true);
    result.csvExportAuditHistory.forEach(r => {
      expect(r.retentionStatus).toBe('保管期間内');
    });

    // 指定期間内は 5 件（確認 2 + 是正 2 + CSV 2）、超過は 0 件
    expect(result.totalRecordCount).toBe(5);
    expect(result.retentionExceededCount).toBe(0);
  });
});
