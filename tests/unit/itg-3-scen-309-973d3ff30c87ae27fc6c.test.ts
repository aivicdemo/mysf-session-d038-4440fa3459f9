import { formatCSVExportData, InvalidDiscrepancySelectionError } from '../../src/logic/dashboard-presentation';
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

describe('SCEN-309: 指定された差異IDが存在しないか、リクエストユーザーがアクセス権限を持たない場合、InvalidDiscrepancySelectionErrorが発生する', () => {
  it('指定された差異レコードが見つからない場合、InvalidDiscrepancySelectionErrorが発生する', async () => {
    (authValidation.validateUserAuthorizationForCSVExport as jest.Mock).mockResolvedValue({
      authorized: true,
    });

    (discrepancyPersistence.retrieveDiscrepanciesForCSVExport as jest.Mock).mockResolvedValue({
      discrepancies: [],
      totalCount: 0,
    });

    (toleranceCriteria.getAllToleranceCriteria as jest.Mock).mockResolvedValue([]);

    const input = {
      requestUserId: 'user-001',
      selectedDiscrepancyIds: ['discrepancy-999', 'discrepancy-1000'],
      exportDateTime: new Date('2026-10-07T10:30:00.000Z'),
    };

    await expect(formatCSVExportData(input)).rejects.toThrow(InvalidDiscrepancySelectionError);
    await expect(formatCSVExportData(input)).rejects.toThrow('指定された差異レコードが見つかりません。');
  });
});
