import { recordCSVExportAuditLog } from '../../src/logic/discrepancy-persistence';
import type { RecordCSVExportAuditLogInput, RecordCSVExportAuditLogOutput } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-205: 出力対象差異件数が0件の場合も正常に記録できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異件数0件でもレコードが正常に記録され返却される', async () => {
    const mockRecord: RecordCSVExportAuditLogOutput = {
      exportId: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
      executionUserId: '550e8400-e29b-41d4-a716-446655440000',
      executionDateTime: '2026-01-15T09:30:00Z',
      exportedDiscrepancyCount: 0,
      fileIdentifier: 'export_20260115_093000_zero_discrepancies.csv',
      exportStatus: 'success',
    };

    (dataStore.createRecord as jest.Mock).mockResolvedValue(mockRecord);

    const input: RecordCSVExportAuditLogInput = {
      executionUserId: '550e8400-e29b-41d4-a716-446655440000',
      executionDateTime: '2026-01-15T09:30:00Z',
      exportedDiscrepancyCount: 0,
      fileIdentifier: 'export_20260115_093000_zero_discrepancies.csv',
      exportStatus: 'success',
    };

    const result = await recordCSVExportAuditLog(input);

    expect(result.exportId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.executionUserId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.executionDateTime).toBe('2026-01-15T09:30:00Z');
    expect(result.exportedDiscrepancyCount).toBe(0);
    expect(result.fileIdentifier).toBe('export_20260115_093000_zero_discrepancies.csv');
    expect(result.exportStatus).toBe('success');
  });
});
