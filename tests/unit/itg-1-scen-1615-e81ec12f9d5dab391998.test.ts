import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1615: ステータス検証結果に推奨アクションが含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include recommended actions in status validation results', async () => {
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [
        {
          customerId: 'CUST-001',
          customerName: '取引先A',
          isActive: true,
          customerCategory: 'standard'
        },
        {
          customerId: 'CUST-002',
          customerName: '取引先B',
          isActive: true,
          customerCategory: 'standard'
        }
      ]
    });

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: [
        {
          dealId: 'DEAL-001',
          dealName: '商談A',
          status: 'closed_won',
          amount: 500000
        },
        {
          dealId: 'DEAL-002',
          dealName: '商談B',
          status: 'closed_won',
          amount: 300000
        }
      ]
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-001',
          invoiceDate: '2024-12-10',
          dealId: 'DEAL-001',
          amount: 500000,
          status: 'issued'
        },
        {
          invoiceId: 'INV-002',
          invoiceDate: '2024-12-15',
          dealId: 'DEAL-002',
          amount: 300000,
          status: 'issued'
        }
      ]
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        { stageId: 'STAGE-01', stageName: 'prospecting', sequenceNumber: 1 },
        { stageId: 'STAGE-02', stageName: 'qualification', sequenceNumber: 2 },
        { stageId: 'STAGE-03', stageName: 'negotiation', sequenceNumber: 3 },
        { stageId: 'STAGE-04', stageName: 'closed_won', sequenceNumber: 4 }
      ]
    });

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      validationRules: [
        {
          ruleId: 'RULE-001',
          ruleName: 'deal_invoice_matching',
          description: '商談と請求書の紐付け確認'
        },
        {
          ruleId: 'RULE-002',
          ruleName: 'amount_consistency',
          description: '金額一致確認'
        },
        {
          ruleId: 'RULE-003',
          ruleName: 'exclude_test_customers',
          description: 'テスト取引先の除外'
        },
        {
          ruleId: 'RULE-004',
          ruleName: 'exclude_cancelled_deals',
          description: 'キャンセル済み商談の除外'
        }
      ]
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId: 'CI-2024-12-001',
      targetMonth: '2024-12',
      operatorUserId: 'USR-SALES-ADMIN-001',
      executionTimestamp: new Date('2024-12-15T10:30:00Z')
    });

    expect(result).toBeDefined();
    expect(result.readyForExtraction).toBe(true);
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2024-12-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2024-12-31'));
    expect(result.extractionScope.customerIds).toContain('CUST-001');
    expect(result.extractionScope.customerIds).toContain('CUST-002');
    expect(result.extractionScope.dealIds).toContain('DEAL-001');
    expect(result.extractionScope.dealIds).toContain('DEAL-002');
    expect(result.extractionScope.invoiceIds).toContain('INV-001');
    expect(result.extractionScope.invoiceIds).toContain('INV-002');
    expect(result.extractionCriteria.validationRulesToApply).toContainEqual(
      expect.stringContaining('RULE')
    );
    expect(result.preparationCompletedAt).toEqual(new Date('2024-12-15T10:30:00Z'));
  });
});
