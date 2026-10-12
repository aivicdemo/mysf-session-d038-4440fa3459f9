import { prepareMonthlyClosing, InvalidTargetMonth } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllCustomers: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-235: 対象月の形式が不正であるか過去の月次締めが既に完了している場合、InvalidTargetMonthエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('不正な月形式(2024-13)を指定した場合、InvalidTargetMonthエラーが発生する', async () => {
    await expect(
      prepareMonthlyClosing({
        closingInstructionId: 'CI-20250107-001',
        targetMonth: '2024-13',
        operatorUserId: 'USR-OP-20250107',
        executionTimestamp: new Date('2025-01-08T09:00:00Z'),
      })
    ).rejects.toThrow(InvalidTargetMonth);

    try {
      await prepareMonthlyClosing({
        closingInstructionId: 'CI-20250107-001',
        targetMonth: '2024-13',
        operatorUserId: 'USR-OP-20250107',
        executionTimestamp: new Date('2025-01-08T09:00:00Z'),
      });
    } catch (error) {
      if (error instanceof InvalidTargetMonth) {
        expect(error.message).toContain('対象月の形式が不正です。YYYY-MM形式で指定してください。');
      }
    }
  });
});
