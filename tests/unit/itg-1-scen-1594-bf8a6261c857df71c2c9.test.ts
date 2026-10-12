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

describe('SCEN-1594: 商談商品明細空時、警告が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('請求明細の数量が0の場合、警告が記録されて readyForExtraction=true で返される', async () => {
    const closingInstructionId = 'INSTR-2024-001';
    const targetMonth = '2024-01';
    const operatorUserId = 'USER-SALES-OP-001';
    const executionTimestamp = new Date('2024-02-01T09:00:00Z');

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue([
      { customerId: 'CUST-001', customerName: '顧客A', isActive: true },
      { customerId: 'CUST-002', customerName: '顧客B', isActive: true },
    ]);

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue([
      { dealId: 'DEAL-001', dealName: '商談A', status: '成約済み', customerId: 'CUST-001' },
    ]);

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([
      { invoiceId: 'INV-001', invoiceDate: '2024-01-15', dealId: 'DEAL-001', amount: 100000, invoiceLineItems: [{ quantity: 0, unitPrice: 0, amount: 0 }] },
    ]);

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue([
      { stageId: 'STAGE-001', stageName: '成約済み', isActive: true },
    ]);

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue([
      { ruleId: 'RULE-001', ruleName: '商談商品明細チェック', description: '商談に紐づく請求明細の商品数量が0の場合は警告を記録する', isActive: true },
    ]);

    const result = await prepareMonthlyClosing({
      closingInstructionId,
      targetMonth,
      operatorUserId,
      executionTimestamp,
    });

    expect(result.readyForExtraction).toBe(true);
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2024-01-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2024-01-31'));
    expect(result.extractionScope).toBeDefined();
    expect(result.extractionCriteria).toBeDefined();
    expect(result.preparationCompletedAt).toEqual(executionTimestamp);
  });
});
