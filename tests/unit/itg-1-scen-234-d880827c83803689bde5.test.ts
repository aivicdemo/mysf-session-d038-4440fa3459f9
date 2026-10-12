import { prepareMonthlyClosing, InvalidClosingInstructionId } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllCustomers: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-234: 指定された月次締め確認指示IDが存在しないか無効である場合、InvalidClosingInstructionIdエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('存在しない指示IDを指定した場合、InvalidClosingInstructionIdエラーが発生する', async () => {
    await expect(
      prepareMonthlyClosing({
        closingInstructionId: 'INSTR-2024-001-INVALID',
        targetMonth: '2024-11',
        operatorUserId: 'USER-OP-001',
        executionTimestamp: new Date('2024-11-15T10:30:00Z'),
      })
    ).rejects.toThrow(InvalidClosingInstructionId);

    try {
      await prepareMonthlyClosing({
        closingInstructionId: 'INSTR-2024-001-INVALID',
        targetMonth: '2024-11',
        operatorUserId: 'USER-OP-001',
        executionTimestamp: new Date('2024-11-15T10:30:00Z'),
      });
    } catch (error) {
      if (error instanceof InvalidClosingInstructionId) {
        expect(error.message).toContain('月次締め確認指示が見つかりません。指示IDを確認してください。');
      }
    }
  });
});
