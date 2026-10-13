import { exportDiscrepanciesAsCSV, UnauthorizedCSVExportError } from '../../src/logic/csv-export-audit';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepanciesForCSVExport: jest.fn(),
  recordCSVExportAuditLog: jest.fn(),
}));

describe('SCEN-314: UnauthorizedCSVExportError when user lacks CSV export permission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedCSVExportError with message when user does not have CSV export permission', async () => {
    const selectedDiscrepancyIds = ['discrepancy-101', 'discrepancy-102', 'discrepancy-103'];
    const executingUserId = 'user-002';
    const executionTimestamp = new Date('2026-10-07T10:30:00Z');

    await expect(
      exportDiscrepanciesAsCSV({
        selectedDiscrepancyIds,
        executingUserId,
        executionTimestamp,
      })
    ).rejects.toThrow(UnauthorizedCSVExportError);

    await expect(
      exportDiscrepanciesAsCSV({
        selectedDiscrepancyIds,
        executingUserId,
        executionTimestamp,
      })
    ).rejects.toThrow('ユーザーはCSV出力権限がありません。');

    expect(discrepancyPersistence.retrieveDiscrepanciesForCSVExport).not.toHaveBeenCalled();
    expect(discrepancyPersistence.recordCSVExportAuditLog).not.toHaveBeenCalled();
  });
});
