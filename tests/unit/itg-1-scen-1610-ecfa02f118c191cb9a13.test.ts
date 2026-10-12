import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1610: 同一商談に複数請求書存在時、ステータス一貫性が検証される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate status consistency for multiple invoices linked to same deal', async () => {
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [
        { customerId: 'CUST-001', customerName: '取引先A', isActive: true }
      ]
    });

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: [
        {
          dealId: 'DEAL-001',
          customerId: 'CUST-001',
          dealName: '商談A',
          status: '成約済み',
          closedDate: '2025-01-15'
        },
        {
          dealId: 'DEAL-002',
          customerId: 'CUST-001',
          dealName: '商談B',
          status: '成約済み',
          closedDate: '2025-01-20'
        }
      ]
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-001',
          dealId: 'DEAL-001',
          customerId: 'CUST-001',
          invoiceDate: '2025-01-16',
          amount: 100000,
          status: '発行済み'
        },
        {
          invoiceId: 'INV-002',
          dealId: 'DEAL-001',
          customerId: 'CUST-001',
          invoiceDate: '2025-01-17',
          amount: 50000,
          status: '発行済み'
        },
        {
          invoiceId: 'INV-003',
          dealId: 'DEAL-002',
          customerId: 'CUST-001',
          invoiceDate: '2025-01-21',
          amount: 200000,
          status: '発行済み'
        }
      ]
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        { stageId: 'STAGE-001', stageName: '初期接触', displayOrder: 1 },
        { stageId: 'STAGE-005', stageName: '成約済み', displayOrder: 5 }
      ]
    });

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      validationRules: [
        {
          ruleId: 'RULE-001',
          ruleType: 'invoice_deal_consistency',
          description: '同一商談に紐付く複数請求書のステータス一貫性チェック',
          isActive: true
        },
        {
          ruleId: 'RULE-002',
          ruleType: 'amount_matching',
          description: '商談金額と請求金額の合計一致確認',
          isActive: true
        }
      ]
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId: 'CI-2025-01-001',
      targetMonth: '2025-01',
      operatorUserId: 'USR-SALES-SYS-001',
      executionTimestamp: new Date('2025-01-31T10:00:00Z')
    });

    expect(result).toBeDefined();
    expect(result.readyForExtraction).toBe(true);
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2025-01-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2025-01-31'));
    expect(result.extractionScope.dealIds).toContain('DEAL-001');
    expect(result.extractionScope.dealIds).toContain('DEAL-002');
    expect(result.extractionScope.invoiceIds).toContain('INV-001');
    expect(result.extractionScope.invoiceIds).toContain('INV-002');
    expect(result.extractionScope.invoiceIds).toContain('INV-003');
    expect(result.extractionCriteria.validationRulesToApply).toContain('RULE-001');
    expect(result.extractionCriteria.validationRulesToApply).toContain('RULE-002');
    expect(result.extractionScope.dataIntegrityCheckpoints).toContainEqual(
      expect.objectContaining({
        checkpoint: expect.stringContaining('複数請求書')
      })
    );
  });
});
