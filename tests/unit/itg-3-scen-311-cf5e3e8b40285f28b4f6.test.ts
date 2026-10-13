import { formatCSVExportData } from '../../src/logic/dashboard-presentation';
import * as authValidation from '../../src/logic/authorization-validation';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';
import * as toleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/authorization-validation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authorization-validation')>('../../src/logic/authorization-validation'),
  validateUserAuthorizationForCSVExport: jest.fn(),
}));
jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepanciesForCSVExport: jest.fn(),
}));
jest.mock('../../src/logic/discrepancy-tolerance-criteria', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-tolerance-criteria')>('../../src/logic/discrepancy-tolerance-criteria'),
  getAllToleranceCriteria: jest.fn(),
}));

describe('SCEN-311: 選択された差異レコードが0件の場合、空のCSV行データ配列と0件のtotalRowCountが返される', () => {
  it('差異レコードが0件の場合、空のCSV行データと totalRowCount が 0 となる', async () => {
    (authValidation.validateUserAuthorizationForCSVExport as jest.Mock).mockResolvedValue({
      isAuthorized: true,
    });

    (discrepancyPersistence.retrieveDiscrepanciesForCSVExport as jest.Mock).mockResolvedValue({
      discrepancies: [],
      totalCount: 0,
    });

    (toleranceCriteria.getAllToleranceCriteria as jest.Mock).mockResolvedValue([]);

    const input = {
      requestUserId: 'user-001',
      selectedDiscrepancyIds: [],
      exportDateTime: new Date('2026-01-15T10:30:00Z'),
    };

    const result = await formatCSVExportData(input);

    expect(result.csvRows).toEqual([]);
    expect(result.totalRowCount).toBe(0);
    expect(result.exportFileIdentifier).toBeDefined();
    expect(typeof result.exportFileIdentifier).toBe('string');
  });
});
