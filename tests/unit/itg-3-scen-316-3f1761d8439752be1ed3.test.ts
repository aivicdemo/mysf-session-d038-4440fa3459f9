import { exportDiscrepanciesAsCSV, DiscrepancyRecordNotFoundError } from '../../src/logic/csv-export-audit';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepanciesForCSVExport: jest.fn(),
  recordCSVExportAuditLog: jest.fn(),
}));

describe('SCEN-316: DiscrepancyRecordNotFoundError when records do not exist in database', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DiscrepancyRecordNotFoundError when retrieveDiscrepanciesForCSVExport returns null', async () => {
    const selectedDiscrepancyIds = ['discrepancy-id-001', 'discrepancy-id-002'];
    const executingUserId = 'user-sales-dept-001';
    const executionTimestamp = new Date('2026-01-15T10:30:00Z');

    (discrepancyPersistence.retrieveDiscrepanciesForCSVExport as jest.Mock).mockResolvedValue(null);

    await expect(
      exportDiscrepanciesAsCSV({
        selectedDiscrepancyIds,
        executingUserId,
        executionTimestamp,
      })
    ).rejects.toThrow(DiscrepancyRecordNotFoundError);

    await expect(
      exportDiscrepanciesAsCSV({
        selectedDiscrepancyIds,
        executingUserId,
        executionTimestamp,
      })
    ).rejects.toThrow('指定された差異レコードが見つかりません。');

    expect(discrepancyPersistence.retrieveDiscrepanciesForCSVExport).toHaveBeenCalledWith({
      discrepancyIds: selectedDiscrepancyIds,
    });

    expect(discrepancyPersistence.recordCSVExportAuditLog).not.toHaveBeenCalled();
  });
});
