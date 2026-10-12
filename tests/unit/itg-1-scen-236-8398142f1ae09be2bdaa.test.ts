import { prepareMonthlyClosing, OperatorNotAuthorized } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllCustomers: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-236: 指定されたユーザーが営業部システム担当の権限を持たない場合、OperatorNotAuthorizedエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('権限のないユーザーを指定した場合、OperatorNotAuthorizedエラーが発生する', async () => {
    await expect(
      prepareMonthlyClosing({
        closingInstructionId: 'CI-2025-01-001',
        targetMonth: '2025-01',
        operatorUserId: 'USR-99999',
        executionTimestamp: new Date('2025-02-01T09:00:00Z'),
      })
    ).rejects.toThrow(OperatorNotAuthorized);

    try {
      await prepareMonthlyClosing({
        closingInstructionId: 'CI-2025-01-001',
        targetMonth: '2025-01',
        operatorUserId: 'USR-99999',
        executionTimestamp: new Date('2025-02-01T09:00:00Z'),
      });
    } catch (error) {
      if (error instanceof OperatorNotAuthorized) {
        expect(error.message).toContain('このユーザーは月次締め準備の権限がありません。');
      }
    }
  });
});
