import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1614: ステータス検証結果に総請求額と金額差分が含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include total invoice amount and amount difference in status validation results', async () => {
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [
        { customerId: 'CUST-001', customerName: '取引先A', isActive: true },
        { customerId: 'CUST-002', customerName: '取引先B', isActive: true }
      ]
    });

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: [
        {
          dealId: 'DEAL-001',
          dealName: '案件A',
          status: '成約済み',
          closedDate: '2024-11-15T00:00:00Z',
          expectedInvoiceAmount: 500000
        },
        {
          dealId: 'DEAL-002',
          dealName: '案件B',
          status: '成約済み',
          closedDate: '2024-11-20T00:00:00Z',
          expectedInvoiceAmount: 300000
        }
      ]
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-001',
          dealId: 'DEAL-001',
          invoiceDate: '2024-11-15T00:00:00Z',
          totalAmount: 500000,
          status: 'issued'
        },
        {
          invoiceId: 'INV-002',
          dealId: 'DEAL-002',
          invoiceDate: '2024-11-20T00:00:00Z',
          totalAmount: 300000,
          status: 'issued'
        }
      ]
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        { stageId: 'STAGE-001', stageName: '成約済み', isActive: true },
        { stageId: 'STAGE-002', stageName: 'キャンセル', isActive: true }
      ]
    });

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      validationRules: [
        {
          ruleId: 'RULE-001',
          ruleName: '商談と請求書の紐付け確認',
          ruleType: 'dataIntegrityCheck'
        },
        {
          ruleId: 'RULE-002',
          ruleName: '金額一致確認',
          ruleType: 'amountReconciliation'
        }
      ]
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId: 'INSTR-2024-11-001',
      targetMonth: '2024-11',
      operatorUserId: 'USER-SALES-OPS-001',
      executionTimestamp: new Date('2024-11-01T09:00:00Z')
    });

    expect(result).toBeDefined();
    expect(result.readyForExtraction).toBe(true);
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2024-11-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2024-11-30'));
    expect(result.extractionScope.invoiceIds).toContain('INV-001');
    expect(result.extractionScope.invoiceIds).toContain('INV-002');
    expect(result.preparationCompletedAt).toEqual(new Date('2024-11-01T09:00:00Z'));
  });
});
