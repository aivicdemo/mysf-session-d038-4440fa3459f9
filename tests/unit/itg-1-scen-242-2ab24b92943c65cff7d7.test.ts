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

describe('SCEN-242: 対象期間の開始日が終了日より後になっている場合、対象期間設定エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('開始日が終了日より後の場合、エラーが発生する', async () => {
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue([
      { customerId: 'cust-001', customerName: 'Test Customer', isActive: true },
    ]);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue([
      { dealId: 'deal-001', dealName: 'Test Deal', status: '成約済み', closedDate: '2025-01-15' },
    ]);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([
      { invoiceId: 'inv-001', invoiceDate: '2025-01-20', amount: 100000 },
    ]);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue([
      { stageId: 'stage-001', stageName: '成約済み' },
    ]);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue([
      { ruleId: 'rule-001', ruleName: 'deal_invoice_linkage', description: '商談と請求書の紐付け確認' },
    ]);

    const mockError = new Error('対象期間の設定が不正です。開始日が終了日より後になっています。');
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockRejectedValueOnce(mockError);

    await expect(
      prepareMonthlyClosing({
        closingInstructionId: 'instr-20250131-001',
        targetMonth: '2025-01',
        operatorUserId: 'user-sales-ops-001',
        executionTimestamp: new Date('2025-02-01T09:00:00Z'),
      })
    ).rejects.toThrow();
  });
});
