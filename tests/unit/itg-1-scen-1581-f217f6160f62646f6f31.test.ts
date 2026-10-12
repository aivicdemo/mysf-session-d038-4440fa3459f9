import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1581: 請求明細各行の期待金額が再計算され計算済み金額と比較される', () => {
  it('請求明細の期待金額と計算済み金額が一致する場合、readyForExtractionがtrueで返される', async () => {
    const mockCustomers = [
      { customerId: 'CUST-001', customerName: '顧客A', isActive: true, isTestData: false },
      { customerId: 'CUST-002', customerName: '顧客B', isActive: true, isTestData: false },
    ];
    const mockDeals = [
      {
        dealId: 'DEAL-001',
        dealName: '案件A',
        status: '成約済み',
        customerId: 'CUST-001',
        invoicedAmount: 1000000,
        invoiceDate: '2024-11-10',
      },
      {
        dealId: 'DEAL-002',
        dealName: '案件B',
        status: '成約済み',
        customerId: 'CUST-002',
        invoicedAmount: 500000,
        invoiceDate: '2024-11-15',
      },
    ];
    const mockInvoices = [
      {
        invoiceId: 'INV-001',
        dealId: 'DEAL-001',
        invoiceDate: '2024-11-10',
        totalAmount: 1000000,
        invoiceLines: [
          {
            lineId: 'LINE-001-001',
            productName: '商品A',
            quantity: 10,
            unitPrice: 100000,
            expectedAmount: 1000000,
            calculatedAmount: 1000000,
          },
        ],
      },
      {
        invoiceId: 'INV-002',
        dealId: 'DEAL-002',
        invoiceDate: '2024-11-15',
        totalAmount: 500000,
        invoiceLines: [
          {
            lineId: 'LINE-002-001',
            productName: '商品B',
            quantity: 5,
            unitPrice: 100000,
            expectedAmount: 500000,
            calculatedAmount: 500000,
          },
        ],
      },
    ];
    const mockDealStages = [
      { stageId: 'STAGE-001', stageName: '成約済み', isActive: true },
      { stageId: 'STAGE-002', stageName: 'キャンセル', isActive: true },
    ];
    const mockValidationRules = [
      {
        ruleId: 'RULE-001',
        ruleName: '請求明細金額整合性チェック',
        description: '期待金額と計算済み金額が一致すること',
        isActive: true,
      },
      {
        ruleId: 'RULE-002',
        ruleName: '商談請求書紐付けチェック',
        description: '成約済み商談に請求書が存在すること',
        isActive: true,
      },
    ];

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue(mockCustomers);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue(mockDeals);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(mockInvoices);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue(mockDealStages);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue(mockValidationRules);

    const input = {
      closingInstructionId: 'CI-2024-11-001',
      targetMonth: '2024-11',
      operatorUserId: 'USER-SALES-OPS-001',
      executionTimestamp: new Date('2024-11-15T10:30:00Z'),
    };

    const result = await prepareMonthlyClosing(input);

    expect(result.readyForExtraction).toBe(true);
    expect(result.closingPeriod.targetMonth).toBe('2024-11');
    expect(result.extractionScope.totalCustomerCount).toBeGreaterThanOrEqual(2);
    expect(result.extractionScope.totalDealCount).toBeGreaterThanOrEqual(2);
    expect(result.extractionScope.totalInvoiceCount).toBeGreaterThanOrEqual(2);
    expect(result.extractionCriteria.dealStageFilter).toContain('成約済み');
    expect(result.extractionScope.dataIntegrityCheckpoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ checkpoint: expect.any(String), description: expect.any(String) }),
      ]),
    );
    expect(result.preparationCompletedAt).toBeDefined();
  });
});
