import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1609: 請求明細行金額合計と請求書合計金額が一致か検証される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate invoice line item totals match invoice total amounts', async () => {
    const mockDataPersistence = jest.requireActual<typeof dataPersistence>(
      '../../src/logic/data-persistence'
    );

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [
        { customerId: 'CUST-001', customerName: '株式会社A', isActive: true, isTestRecord: false },
        { customerId: 'CUST-002', customerName: '株式会社B', isActive: true, isTestRecord: false }
      ]
    });

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: [
        {
          dealId: 'DEAL-2025-001',
          dealName: '案件A',
          customerId: 'CUST-001',
          status: '成約済み',
          dealDate: '2025-01-15',
          invoiceAmount: 500000
        },
        {
          dealId: 'DEAL-2025-002',
          dealName: '案件B',
          customerId: 'CUST-002',
          status: '成約済み',
          dealDate: '2025-01-20',
          invoiceAmount: 300000
        }
      ]
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-2025-001',
          dealId: 'DEAL-2025-001',
          invoiceDate: '2025-01-15',
          totalAmount: 500000,
          invoiceLineItems: [
            { lineItemId: 'LINE-001', itemAmount: 300000 },
            { lineItemId: 'LINE-002', itemAmount: 200000 }
          ]
        },
        {
          invoiceId: 'INV-2025-002',
          dealId: 'DEAL-2025-002',
          invoiceDate: '2025-01-20',
          totalAmount: 300000,
          invoiceLineItems: [{ lineItemId: 'LINE-003', itemAmount: 300000 }]
        }
      ]
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [{ stageId: 'STAGE-001', stageName: '成約済み', isActive: true }]
    });

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      validationRules: [
        {
          ruleId: 'RULE-001',
          ruleName: '請求明細行金額合計と請求書合計金額の一致確認',
          description: '請求書の合計金額が請求明細行の金額合計と一致すること'
        }
      ]
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId: 'INSTR-2025-01-001',
      targetMonth: '2025-01',
      operatorUserId: 'USR-SALES-ADMIN-001',
      executionTimestamp: new Date('2025-02-01T09:00:00Z')
    });

    expect(result).toBeDefined();
    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toEqual(new Date('2025-02-01T09:00:00Z'));
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2025-01-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2025-01-31'));
    expect(result.extractionScope.customerIds).toContain('CUST-001');
    expect(result.extractionScope.customerIds).toContain('CUST-002');
    expect(result.extractionScope.dealIds).toContain('DEAL-2025-001');
    expect(result.extractionScope.dealIds).toContain('DEAL-2025-002');
    expect(result.extractionScope.invoiceIds).toContain('INV-2025-001');
    expect(result.extractionScope.invoiceIds).toContain('INV-2025-002');
    expect(result.extractionScope.dataIntegrityCheckpoints).toContainEqual(
      expect.objectContaining({
        checkpoint: expect.stringContaining('請求明細行金額合計と請求書合計金額')
      })
    );
  });
});
