import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1566: 抽出スコープ確定後、取引先マスタが請求先情報・支払条件とともに抽出される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should extract customers with billing information and payment terms', async () => {
    const closingInstructionId = 'CI-2024-001';
    const targetMonth = '2024-01';
    const operatorUserId = 'USR-SALES-OPS-001';
    const executionTimestamp = new Date('2024-02-01T09:00:00Z');

    // Mock fetchAllCustomers
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [
        {
          id: 'CUST-001',
          name: '顧客A',
          billingInfo: { terms: '月末締め翌月末払い' },
          status: 'active',
        },
        {
          id: 'CUST-002',
          name: '顧客B',
          billingInfo: { terms: '翌月末払い' },
          status: 'active',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchDealsForPeriod
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: [
        {
          id: 'DEAL-001',
          name: '案件A',
          customerId: 'CUST-001',
          stageName: 'closed_won',
          amount: 500000,
        },
        {
          id: 'DEAL-002',
          name: '案件B',
          customerId: 'CUST-002',
          stageName: 'closed_won',
          amount: 300000,
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchInvoicesForPeriod
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          id: 'INV-001',
          dealId: 'DEAL-001',
          customerId: 'CUST-001',
          amount: 500000,
          status: 'issued',
        },
        {
          id: 'INV-002',
          dealId: 'DEAL-002',
          customerId: 'CUST-002',
          amount: 300000,
          status: 'issued',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchAllDealStages
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        { id: 'STAGE-001', name: 'closed_won', order: 5 },
        { id: 'STAGE-002', name: 'closed_lost', order: 6 },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchAllValidationRules
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      rules: [
        {
          id: 'RULE-001',
          name: 'amountValidation',
          description: '請求金額と商談金額が一致すること',
        },
        {
          id: 'RULE-002',
          name: 'dealInvoiceMapping',
          description: '商談と請求書が正しく紐付けられていること',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId,
      targetMonth,
      operatorUserId,
      executionTimestamp,
    });

    expect(result.closingPeriod.targetMonth).toBe('2024-01');
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2024-01-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2024-01-31'));

    expect(result.extractionScope.customerIds).toContain('CUST-001');
    expect(result.extractionScope.customerIds).toContain('CUST-002');
    expect(result.extractionScope.totalCustomerCount).toBe(2);

    // Verify extraction objects include billing information
    expect(result.extractionScope.extractionObjects).toBeDefined();
    const customerExtractionObject = result.extractionScope.extractionObjects.find(
      (obj) => obj.objectName === 'Customer' || obj.objectName.includes('取引先'),
    );
    expect(customerExtractionObject).toBeDefined();

    // Verify exclusion rules for closed_lost deals
    expect(result.extractionScope.exclusionRules).toContainEqual(
      expect.stringContaining('closed_lost'),
    );

    // Verify data integrity checkpoints
    expect(result.extractionScope.dataIntegrityCheckpoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          checkpoint: expect.any(String),
          description: expect.stringContaining('紐付け'),
        }),
        expect.objectContaining({
          checkpoint: expect.any(String),
          description: expect.stringContaining('一致'),
        }),
      ]),
    );

    expect(result.extractionCriteria.dealStageFilter).toContain('closed_won');
    expect(result.extractionCriteria.customerStatusFilter).toContain('active');

    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toBeDefined();
    expect(result.preparationCompletedAt.getTime()).toBeGreaterThanOrEqual(executionTimestamp.getTime());
  });
});
