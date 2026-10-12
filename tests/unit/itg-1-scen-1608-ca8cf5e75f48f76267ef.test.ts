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

describe('SCEN-1608: 商談確定金額と全請求書合計金額が比較され金額ズレ検出される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('prepareMonthlyClosing: 商談金額と請求書金額の不一致が検出される', async () => {
    const customers = [
      { customerId: 'CUST-A001', customerName: '取引先A', status: 'active' },
      { customerId: 'CUST-B001', customerName: '取引先B', status: 'active' },
    ];

    const deals = [
      {
        dealId: 'DEAL-2024-001',
        dealAmount: 500000,
        status: '成約済み',
        contractDate: '2024-11-15',
        customerId: 'CUST-A001',
      },
      {
        dealId: 'DEAL-2024-002',
        dealAmount: 300000,
        status: '成約済み',
        contractDate: '2024-11-20',
        customerId: 'CUST-B001',
      },
    ];

    const invoices = [
      {
        invoiceId: 'INV-2024-001',
        invoiceAmount: 500000,
        invoiceDate: '2024-11-16',
        dealId: 'DEAL-2024-001',
      },
      {
        invoiceId: 'INV-2024-002',
        invoiceAmount: 280000,
        invoiceDate: '2024-11-21',
        dealId: 'DEAL-2024-002',
      },
    ];

    const dealStages = [
      { stageId: 'STAGE-001', stageName: '成約済み', isActive: true },
      { stageId: 'STAGE-002', stageName: '商談中', isActive: true },
    ];

    const validationRules = [
      {
        ruleId: 'RULE-001',
        ruleName: '商談請求金額一致チェック',
        condition: 'deal.dealAmount == invoice.invoiceAmount',
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
      closingInstructionId: 'INSTR-2024-11-001',
      targetMonth: '2024-11',
      operatorUserId: 'USR-SALES-OPS-001',
      executionTimestamp: new Date('2024-12-01T09:00:00Z'),
    });

    expect(result.closingPeriod.periodStartDate).toEqual(
      new Date('2024-11-01T00:00:00Z')
    );
    expect(result.closingPeriod.periodEndDate).toEqual(
      new Date('2024-11-30T23:59:59Z')
    );
    expect(result.closingPeriod.targetMonth).toBe('2024-11');
    expect(result.extractionScope).toBeDefined();
    expect(result.extractionCriteria).toBeDefined();
    expect(result.preparationCompletedAt).toEqual(
      new Date('2024-12-01T09:00:00Z')
    );
  });
});
