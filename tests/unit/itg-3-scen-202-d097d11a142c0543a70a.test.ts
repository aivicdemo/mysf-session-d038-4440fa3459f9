import { recordCSVExportAuditLog } from '../../src/logic/discrepancy-persistence';
import type { RecordCSVExportAuditLogInput, RecordCSVExportAuditLogOutput } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-202: 標準的なCSV出力操作の監査ログを記録し、採番されたIDを含むレコードを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('CSV出力実行履歴テーブルにレコードを作成し、採番されたexportIdを含むレコードを返す', async () => {
    const mockRecord: RecordCSVExportAuditLogOutput = {
      exportId: '123e4567-e89b-12d3-a456-426614174000',
      executionUserId: '550e8400-e29b-41d4-a716-446655440001',
      executionDateTime: '2026-01-15T14:30:45.000Z',
      exportedDiscrepancyCount: 42,
      fileIdentifier: 'export_20260115_143045_abc123.csv',
      exportStatus: '成功',
    };

    (dataStore.createRecord as jest.Mock).mockResolvedValue(mockRecord);

    const input: RecordCSVExportAuditLogInput = {
      executionUserId: '550e8400-e29b-41d4-a716-446655440001',
      executionDateTime: '2026-01-15T14:30:45.000Z',
      exportedDiscrepancyCount: 42,
      fileIdentifier: 'export_20260115_143045_abc123.csv',
      exportStatus: '成功',
    };

    const result = await recordCSVExportAuditLog(input);

    expect(dataStore.createRecord).toHaveBeenCalledWith(
      'CSV出力実行履歴',
      expect.objectContaining({
        executionUserId: '550e8400-e29b-41d4-a716-446655440001',
        executionDateTime: '2026-01-15T14:30:45.000Z',
        exportedDiscrepancyCount: 42,
        fileIdentifier: 'export_20260115_143045_abc123.csv',
        exportStatus: '成功',
      })
    );

    expect(result.exportId).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(result.executionUserId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.executionDateTime).toBe('2026-01-15T14:30:45.000Z');
    expect(result.exportedDiscrepancyCount).toBe(42);
    expect(result.fileIdentifier).toBe('export_20260115_143045_abc123.csv');
    expect(result.exportStatus).toBe('成功');
  });
});
