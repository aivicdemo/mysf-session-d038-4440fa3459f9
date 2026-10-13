import { recordCSVExportAuditLog } from '../../src/logic/discrepancy-persistence';
import type { RecordCSVExportAuditLogInput, RecordCSVExportAuditLogOutput } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-204: 入力値がすべて正しく保存先レコードに反映される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('すべての入力値がレコードに反映され、UUIDで採番されたexportIdを含んで返される', async () => {
    const mockRecord: RecordCSVExportAuditLogOutput = {
      exportId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      executionUserId: '550e8400-e29b-41d4-a716-446655440000',
      executionDateTime: '2026-10-07T06:33:43.539Z',
      exportedDiscrepancyCount: 42,
      fileIdentifier: 'discrepancy-export-20261007-063343.csv',
      exportStatus: '成功',
    };

    (dataStore.createRecord as jest.Mock).mockResolvedValue(mockRecord);

    const input: RecordCSVExportAuditLogInput = {
      executionUserId: '550e8400-e29b-41d4-a716-446655440000',
      executionDateTime: '2026-10-07T06:33:43.539Z',
      exportedDiscrepancyCount: 42,
      fileIdentifier: 'discrepancy-export-20261007-063343.csv',
      exportStatus: '成功',
    };

    const result = await recordCSVExportAuditLog(input);

    expect(result.exportId).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    expect(result.executionUserId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.executionDateTime).toBe('2026-10-07T06:33:43.539Z');
    expect(result.exportedDiscrepancyCount).toBe(42);
    expect(result.fileIdentifier).toBe('discrepancy-export-20261007-063343.csv');
    expect(result.exportStatus).toBe('成功');
  });
});
