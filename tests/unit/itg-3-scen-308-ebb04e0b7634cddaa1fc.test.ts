import { formatCSVExportData, UnauthorizedCSVExportError } from '../../src/logic/dashboard-presentation';
import * as authValidation from '../../src/logic/authorization-validation';

jest.mock('../../src/logic/authorization-validation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authorization-validation')>('../../src/logic/authorization-validation'),
  validateUserAuthorizationForCSVExport: jest.fn(),
}));

describe('SCEN-308: リクエストユーザーがCSV出力権限を持たない場合、UnauthorizedCSVExportErrorが発生する', () => {
  it('CSV出力権限なしの場合、UnauthorizedCSVExportErrorが発生する', async () => {
    (authValidation.validateUserAuthorizationForCSVExport as jest.Mock).mockResolvedValue({
      authorized: false,
    });

    const input = {
      requestUserId: 'user-123',
      selectedDiscrepancyIds: ['discrepancy-001', 'discrepancy-002'],
      exportDateTime: new Date('2026-01-15T10:30:00Z'),
    };

    await expect(formatCSVExportData(input)).rejects.toThrow(UnauthorizedCSVExportError);
    await expect(formatCSVExportData(input)).rejects.toThrow('CSV出力権限がありません。');
  });
});
