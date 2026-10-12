import { prepareMonthlyClosing, InvalidClosingInstructionId, ExtractionCriteriaDefinitionFailed } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllCustomers: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-1587: 金額計算に1件以上不整合があれば妥当性判定が偽で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('金額不整合が検出されると readyForExtraction が false で返される', async () => {
    // Setup preconditions
    const closingInstructionId = 'INSTR-2024-001';
    const targetMonth = '2024-11';
    const operatorUserId = 'USR-SALES-ADMIN-001';
    const executionTimestamp = new Date('2024-11-05T10:00:00Z');

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue([
      { customerId: 'CUST-001', customerName: '取引先A', status: 'active' },
      { customerId: 'CUST-002', customerName: '取引先B', status: 'active' },
    ]);

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue([
      { dealId: 'DEAL-001', dealName: '商談1', status: 'closed_won', amount: 100000, invoiceDate: '2024-11-10' },
      { dealId: 'DEAL-002', dealName: '商談2', status: 'closed_won', amount: 50000, invoiceDate: '2024-11-15' },
    ]);

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([
      { invoiceId: 'INV-001', dealId: 'DEAL-001', totalAmount: 100000, invoiceDate: '2024-11-10' },
      { invoiceId: 'INV-002', dealId: 'DEAL-002', totalAmount: 60000, invoiceDate: '2024-11-15' },
    ]);

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue([
      { stageId: 'STAGE-001', stageName: 'closed_won', isActive: true },
      { stageId: 'STAGE-002', stageName: 'closed_lost', isActive: true },
    ]);

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue([
      { ruleId: 'RULE-001', ruleName: 'dealInvoiceAmountMatch', description: '商談金額と請求金額が一致すること' },
    ]);

    // Execute
    const result = await prepareMonthlyClosing({
      closingInstructionId,
      targetMonth,
      operatorUserId,
      executionTimestamp,
    });

    // Verify
    expect(result.readyForExtraction).toBe(false);
    expect(result.closingPeriod).toBeDefined();
    expect(result.extractionScope).toBeDefined();
    expect(result.extractionCriteria).toBeDefined();
    expect(result.preparationCompletedAt).toEqual(executionTimestamp);
  });
});
