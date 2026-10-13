import { recordCSVExportAuditLog } from '../../src/logic/discrepancy-persistence';
import type { RecordCSVExportAuditLogInput, RecordCSVExportAuditLogOutput } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-206: ISO 8601形式の実行日時が正しく保存・返却される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ISO 8601形式の実行日時がそのまま保存・返却される', async () => {
    const mockRecord: RecordCSVExportAuditLogOutput = {
      exportId: 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7',
      executionUserId: '550e8400-e29b-41d4-a716-446655440000',
      executionDateTime: '2026-01-15T14:30:45.123Z',
      exportedDiscrepancyCount: 42,
      fileIdentifier: 'export_2026-01-15_14-30-45.csv',
      exportStatus: '成功',
    };

    (dataStore.createRecord as jest.Mock).mockResolvedValue(mockRecord);

    const input: RecordCSVExportAuditLogInput = {
      executionUserId: '550e8400-e29b-41d4-a716-446655440000',
      executionDateTime: '2026-01-15T14:30:45.123Z',
      exportedDiscrepancyCount: 42,
      fileIdentifier: 'export_2026-01-15_14-30-45.csv',
      exportStatus: '成功',
    };

    const result = await recordCSVExportAuditLog(input);

    expect(result.exportId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.executionUserId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.executionDateTime).toBe('2026-01-15T14:30:45.123Z');
    expect(result.exportedDiscrepancyCount).toBe(42);
    expect(result.fileIdentifier).toBe('export_2026-01-15_14-30-45.csv');
    expect(result.exportStatus).toBe('成功');
  });
});
