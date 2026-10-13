import { exportDiscrepanciesAsCSV, InvalidDiscrepancySelectionError } from '../../src/logic/csv-export-audit';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepanciesForCSVExport: jest.fn(),
  recordCSVExportAuditLog: jest.fn(),
}));

describe('SCEN-315: InvalidDiscrepancySelectionError when empty array is selected', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidDiscrepancySelectionError when selectedDiscrepancyIds is empty array', async () => {
    const selectedDiscrepancyIds: string[] = [];
    const executingUserId = 'user-001';
    const executionTimestamp = new Date('2026-10-07T10:30:00.000Z');

    await expect(
      exportDiscrepanciesAsCSV({
        selectedDiscrepancyIds,
        executingUserId,
        executionTimestamp,
      })
    ).rejects.toThrow(InvalidDiscrepancySelectionError);

    await expect(
      exportDiscrepanciesAsCSV({
        selectedDiscrepancyIds,
        executingUserId,
        executionTimestamp,
      })
    ).rejects.toThrow('有効な差異レコードが選択されていません。');

    expect(discrepancyPersistence.retrieveDiscrepanciesForCSVExport).not.toHaveBeenCalled();
    expect(discrepancyPersistence.recordCSVExportAuditLog).not.toHaveBeenCalled();
  });
});
