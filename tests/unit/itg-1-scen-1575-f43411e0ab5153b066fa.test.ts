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

describe('SCEN-1575: 異常通知により営業部システム担当が修正依頼準備状態に遷移する', () => {
  const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fetchAllCustomers
    (mockDataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue([
      { customerId: 'CUST-001', customerName: '顧客A', isActive: true, isTestData: false },
      { customerId: 'CUST-002', customerName: '顧客B', isActive: true, isTestData: false },
    ]);

    // Mock fetchDealsForPeriod
    (mockDataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue([
      {
        dealId: 'DEAL-001',
        dealName: '案件A',
        status: '成約済み',
        closedDate: '2025-01-15',
        amount: 500000,
        customerId: 'CUST-001',
        isCancelled: false,
      },
      {
        dealId: 'DEAL-002',
        dealName: '案件B',
        status: '成約済み',
        closedDate: '2025-01-10',
        amount: 300000,
        customerId: 'CUST-002',
        isCancelled: false,
      },
    ]);

    // Mock fetchInvoicesForPeriod
    (mockDataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'INV-001',
        invoiceDate: '2025-01-16',
        amount: 500000,
        dealId: 'DEAL-001',
        status: 'issued',
      },
      {
        invoiceId: 'INV-002',
        invoiceDate: '2025-01-11',
        amount: 300000,
        dealId: 'DEAL-002',
        status: 'issued',
      },
    ]);

    // Mock fetchAllDealStages
    (mockDataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue([
      { stageId: 'STAGE-001', stageName: '初期接触', sequenceOrder: 1, isActive: true },
      { stageId: 'STAGE-005', stageName: '成約済み', sequenceOrder: 5, isActive: true },
    ]);

    // Mock fetchAllValidationRules
    (mockDataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue([
      { ruleId: 'RULE-001', ruleName: '商談金額と請求金額の一致確認', isActive: true, checkType: 'deal_invoice_amount_match' },
      { ruleId: 'RULE-002', ruleName: 'テスト取引先の除外', isActive: true, checkType: 'exclude_test_customers' },
    ]);
  });

  it('should prepare monthly closing and transition operator to correction request preparation state', async () => {
    const input = {
      closingInstructionId: 'CI-2025-01-20-001',
      targetMonth: '2025-01',
      operatorUserId: 'USR-SALES-OPS-001',
      executionTimestamp: new Date('2025-01-20T10:30:00Z'),
    };

    const result = await prepareMonthlyClosing(input);

    // Verify output structure
    expect(result).toBeDefined();
    expect(result.closingPeriod).toBeDefined();
    expect(result.extractionScope).toBeDefined();
    expect(result.extractionCriteria).toBeDefined();
    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toEqual(new Date('2025-01-20T10:30:00Z'));

    // Verify closingPeriod with January 2025 calendar dates
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2025-01-01T00:00:00Z'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2025-01-31T23:59:59Z'));

    // Verify extractionScope contains correct customers
    expect(result.extractionScope.customerIds).toContain('CUST-001');
    expect(result.extractionScope.customerIds).toContain('CUST-002');
    expect(result.extractionScope.totalCustomerCount).toBe(2);

    // Verify extractionScope contains correct deals
    expect(result.extractionScope.dealIds).toContain('DEAL-001');
    expect(result.extractionScope.dealIds).toContain('DEAL-002');
    expect(result.extractionScope.totalDealCount).toBe(2);

    // Verify extractionScope contains correct invoices
    expect(result.extractionScope.invoiceIds).toContain('INV-001');
    expect(result.extractionScope.invoiceIds).toContain('INV-002');
    expect(result.extractionScope.totalInvoiceCount).toBe(2);

    // Verify extractionCriteria includes deal stage filters
    expect(result.extractionCriteria.dealStageFilter).toContain('成約済み');

    // Verify validation rules are applied
    expect(result.extractionCriteria.validationRulesToApply).toContain('RULE-001');
    expect(result.extractionCriteria.validationRulesToApply).toContain('RULE-002');

    // Verify all required data fetch calls were made
    expect(mockDataPersistence.fetchAllCustomers).toHaveBeenCalled();

    expect(mockDataPersistence.fetchDealsForPeriod).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-01-31T23:59:59Z'),
      })
    );

    expect(mockDataPersistence.fetchInvoicesForPeriod).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-01-31T23:59:59Z'),
      })
    );

    expect(mockDataPersistence.fetchAllDealStages).toHaveBeenCalled();
    expect(mockDataPersistence.fetchAllValidationRules).toHaveBeenCalled();
  });
});
