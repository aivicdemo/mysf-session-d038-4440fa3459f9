import { recordCSVExportAuditLog, DataStoreError } from '../../src/logic/discrepancy-persistence';
import type { RecordCSVExportAuditLogInput } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-203: CSV出力実行履歴テーブルへのレコード作成に失敗した場合、設計済みエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('DataStoreErrorが発生した場合、適切なエラーメッセージを含むDataStoreErrorを返す', async () => {
    const dataStoreError = new DataStoreError('Database connection failed');
    (dataStore.createRecord as jest.Mock).mockRejectedValue(dataStoreError);

    const input: RecordCSVExportAuditLogInput = {
      executionUserId: 'user-uuid-001',
      executionDateTime: '2026-10-07T10:30:00Z',
      exportedDiscrepancyCount: 150,
      fileIdentifier: 'export-20261007-103000.csv',
      exportStatus: '成功',
    };

    await expect(recordCSVExportAuditLog(input)).rejects.toThrow(DataStoreError);
    await expect(recordCSVExportAuditLog(input)).rejects.toThrow('CSV出力操作の監査ログ記録に失敗しました。');
  });
});
