import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1568: 商談金額と請求金額に差異があれば差異額と理由が検出される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect discrepancies between deal amounts and invoice amounts', async () => {
    const closingInstructionId = 'CI-2025-01-001';
    const targetMonth = '2025-01';
    const operatorUserId = 'OP-USR-001';
    const executionTimestamp = new Date('2025-02-01T09:00:00Z');

    // Mock fetchAllCustomers
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [
        { customerId: 'CUST-001', customerName: '取引先A', isActive: true },
        { customerId: 'CUST-002', customerName: '取引先B', isActive: true },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchDealsForPeriod
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: [
        {
          id: 'DEAL-001',
          amount: 1000000,
          status: '成約済み',
          closedDate: '2025-01-15',
          customerId: 'CUST-001',
        },
        {
          id: 'DEAL-002',
          amount: 500000,
          status: '成約済み',
          closedDate: '2025-01-20',
          customerId: 'CUST-002',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchInvoicesForPeriod - DEAL-002 has discrepancy (480000 instead of 500000)
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          id: 'INV-001',
          amount: 1000000,
          invoiceDate: '2025-01-15',
          dealId: 'DEAL-001',
          customerId: 'CUST-001',
        },
        {
          id: 'INV-002',
          amount: 480000,
          invoiceDate: '2025-01-20',
          dealId: 'DEAL-002',
          customerId: 'CUST-002',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchAllDealStages
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        { id: 'STAGE-001', name: '初期接触', isActive: true },
        { id: 'STAGE-002', name: '成約済み', isActive: true },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchAllValidationRules
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      rules: [
        {
          id: 'RULE-001',
          name: '商談請求金額一致確認',
          type: '差異検出',
        },
      ],
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId,
      targetMonth,
      operatorUserId,
      executionTimestamp,
    });

    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2025-01-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2025-01-31'));

    expect(result.extractionScope.totalDealCount).toBe(2);
    expect(result.extractionScope.totalInvoiceCount).toBe(2);

    // Verify that the extraction criteria includes the discrepancy detection rule
    expect(result.extractionCriteria.validationRulesToApply).toContainEqual(
      expect.stringContaining('差異'),
    );

    // Verify data integrity checkpoints include amount matching
    expect(result.extractionScope.dataIntegrityCheckpoints).toContainEqual(
      expect.objectContaining({
        checkpoint: expect.any(String),
        description: expect.stringContaining('金額'),
      }),
    );

    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toBeDefined();
  });
});
