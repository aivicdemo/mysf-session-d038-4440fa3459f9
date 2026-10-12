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

describe('SCEN-1589: 金額検証結果に集計サマリーが含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('集計サマリーと金額検証結果が出力に含まれる', async () => {
    const closingInstructionId = 'INSTR-2025-01-001';
    const targetMonth = '2025-01';
    const operatorUserId = 'USER-SALES-OPS-001';
    const executionTimestamp = new Date('2025-02-01T09:00:00Z');

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue([
      { customerId: 'CUST-001', customerName: '株式会社A', isActive: true },
      { customerId: 'CUST-002', customerName: '株式会社B', isActive: true },
    ]);

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue([
      { dealId: 'DEAL-001', dealName: '案件A', status: '成約済み', dealDate: '2025-01-15', invoiceDate: '2025-01-20', amount: 1000000 },
      { dealId: 'DEAL-002', dealName: '案件B', status: '成約済み', dealDate: '2025-01-10', invoiceDate: '2025-01-25', amount: 500000 },
    ]);

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([
      { invoiceId: 'INV-001', dealId: 'DEAL-001', invoiceDate: '2025-01-20', invoiceAmount: 1000000, status: '発行済み' },
      { invoiceId: 'INV-002', dealId: 'DEAL-002', invoiceDate: '2025-01-25', invoiceAmount: 500000, status: '発行済み' },
    ]);

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue([
      { stageId: 'STAGE-001', stageName: '初期接触', isActive: true },
      { stageId: 'STAGE-002', stageName: '成約済み', isActive: true },
    ]);

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue([
      { ruleId: 'RULE-001', ruleName: '商談と請求書の金額一致確認', description: '商談金額と請求金額が完全に一致すること', isActive: true },
      { ruleId: 'RULE-002', ruleName: '請求書発行日の妥当性確認', description: '請求書発行日が対象期間内であること', isActive: true },
    ]);

    const result = await prepareMonthlyClosing({
      closingInstructionId,
      targetMonth,
      operatorUserId,
      executionTimestamp,
    });

    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2025-01-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2025-01-31'));
    expect(result.extractionScope.totalCustomerCount).toBe(2);
    expect(result.extractionScope.totalDealCount).toBe(2);
    expect(result.extractionScope.totalInvoiceCount).toBe(2);
    expect(result.extractionCriteria.validationRulesToApply).toBeDefined();
    expect(result.extractionCriteria.validationRulesToApply.length).toBeGreaterThan(0);
    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toEqual(executionTimestamp);
  });
});
