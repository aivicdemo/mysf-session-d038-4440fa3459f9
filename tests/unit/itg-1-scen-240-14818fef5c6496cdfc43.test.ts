import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllCustomers: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-240: 会計年度タイプが設定されていない場合、会計年度タイプ未設定エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('会計年度タイプが未設定の場合、エラーが発生する', async () => {
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue([
      { customerId: 'CUST-001', name: '取引先A', isActive: true },
    ]);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue([
      { dealId: 'DEAL-001', dealName: '案件A', status: 'Closed Won', closedDate: '2024-12-05' },
    ]);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([
      { invoiceId: 'INV-001', invoiceDate: '2024-12-05', amount: 1000000 },
    ]);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue([
      { stageId: 'STAGE-001', stageName: 'Closed Won', isActive: true },
    ]);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue([
      { ruleId: 'RULE-001', ruleName: 'Deal-Invoice Match', isActive: true },
    ]);

    const mockError = new Error('会計年度タイプが未設定です。システム設定で暦月または会計月を指定してください。');
    (dataPersistence.fetchAllCustomers as jest.Mock).mockRejectedValueOnce(mockError);

    await expect(
      prepareMonthlyClosing({
        closingInstructionId: 'INSTR-2024-001',
        targetMonth: '2024-12',
        operatorUserId: 'USER-SALES-OPS-001',
        executionTimestamp: new Date('2024-12-15T09:00:00Z'),
      })
    ).rejects.toThrow();
  });
});
