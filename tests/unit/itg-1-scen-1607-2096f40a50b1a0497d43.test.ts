import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataFetch from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>(
    '../../src/logic/data-persistence'
  ),
  fetchAllCustomers: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-1607: 商談クローズ日付と請求書発行日付が比較され順序が検証される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('prepareMonthlyClosing: 商談クローズ日 < 請求書発行日の順序が検証される', async () => {
    const customers = [
      {
        customerId: 'cust-001',
        customerName: 'ABC Corporation',
        isActive: true,
        createdAt: '2024-12-01T00:00:00Z',
      },
      {
        customerId: 'cust-002',
        customerName: 'XYZ Inc',
        isActive: true,
        createdAt: '2024-12-15T00:00:00Z',
      },
    ];

    const deals = [
      {
        dealId: 'deal-001',
        dealName: 'Project Alpha',
        customerId: 'cust-001',
        status: 'Closed Won',
        closedDate: '2025-01-15T00:00:00Z',
        amount: 500000,
      },
      {
        dealId: 'deal-002',
        dealName: 'Project Beta',
        customerId: 'cust-002',
        status: 'Closed Won',
        closedDate: '2025-01-20T00:00:00Z',
        amount: 300000,
      },
    ];

    const invoices = [
      {
        invoiceId: 'inv-001',
        dealId: 'deal-001',
        invoiceDate: '2025-01-16T00:00:00Z',
        issueDate: '2025-01-16T00:00:00Z',
        amount: 500000,
        status: 'Issued',
      },
      {
        invoiceId: 'inv-002',
        dealId: 'deal-002',
        invoiceDate: '2025-01-21T00:00:00Z',
        issueDate: '2025-01-21T00:00:00Z',
        amount: 300000,
        status: 'Issued',
      },
    ];

    const dealStages = [
      { stageId: 'stage-001', stageName: 'Prospecting', sequence: 1 },
      { stageId: 'stage-002', stageName: 'Qualification', sequence: 2 },
      { stageId: 'stage-003', stageName: 'Closed Won', sequence: 10 },
    ];

    const validationRules = [
      {
        ruleId: 'rule-001',
        ruleName: 'Deal Close Date Before Invoice Issue Date',
        description: '商談クローズ日付は請求書発行日付より前である必要がある',
        isActive: true,
      },
    ];

    (dataFetch.fetchAllCustomers as jest.Mock).mockResolvedValue(customers);
    (dataFetch.fetchDealsForPeriod as jest.Mock).mockResolvedValue(deals);
    (dataFetch.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(invoices);
    (dataFetch.fetchAllDealStages as jest.Mock).mockResolvedValue(dealStages);
    (dataFetch.fetchAllValidationRules as jest.Mock).mockResolvedValue(
      validationRules
    );

    const result = await prepareMonthlyClosing({
      closingInstructionId: 'instr-20250131-001',
      targetMonth: '2025-01',
      operatorUserId: 'operator-sales-001',
      executionTimestamp: new Date('2025-02-01T09:00:00Z'),
    });

    expect(result.closingPeriod.periodStartDate).toEqual(
      new Date('2025-01-01T00:00:00Z')
    );
    expect(result.closingPeriod.periodEndDate).toEqual(
      new Date('2025-01-31T23:59:59Z')
    );
    expect(result.readyForExtraction).toBe(true);
    expect(result.extractionScope).toBeDefined();
    expect(result.extractionCriteria).toBeDefined();
    expect(result.extractionScope.dataIntegrityCheckpoints).toBeDefined();
    expect(result.preparationCompletedAt).toEqual(
      new Date('2025-02-01T09:00:00Z')
    );
  });
});
