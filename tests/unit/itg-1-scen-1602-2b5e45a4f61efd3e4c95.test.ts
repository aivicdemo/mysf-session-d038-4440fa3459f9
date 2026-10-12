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

describe('SCEN-1602: 請求明細含有・商談無い商品があれば余剰商品リストに含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('prepareMonthlyClosing: 商談無し請求明細がある場合、余剰商品リストに含まれる', async () => {
    const customers = [
      { customerId: 'CUST-001', customerName: '顧客A', isActive: true },
      { customerId: 'CUST-002', customerName: '顧客B', isActive: true },
    ];

    const deals = [
      {
        dealId: 'DEAL-001',
        dealName: '案件A',
        status: 'closed_won',
        closedDate: '2024-01-15T00:00:00Z',
        amount: 1000000,
      },
      {
        dealId: 'DEAL-002',
        dealName: '案件B',
        status: 'closed_won',
        closedDate: '2024-01-20T00:00:00Z',
        amount: 500000,
      },
    ];

    const invoices = [
      {
        invoiceId: 'INV-2024-001',
        dealId: 'DEAL-001',
        invoiceDate: '2024-01-15T00:00:00Z',
        totalAmount: 1000000,
        invoiceLineItems: [
          {
            lineItemId: 'LINE-001',
            productId: 'PROD-001',
            quantity: 10,
            unitPrice: 100000,
            lineAmount: 1000000,
          },
        ],
      },
      {
        invoiceId: 'INV-2024-002',
        dealId: null,
        invoiceDate: '2024-01-18T00:00:00Z',
        totalAmount: 200000,
        invoiceLineItems: [
          {
            lineItemId: 'LINE-002',
            productId: 'PROD-002',
            quantity: 2,
            unitPrice: 100000,
            lineAmount: 200000,
          },
        ],
      },
    ];

    const dealStages = [
      { stageId: 'STAGE-01', stageName: '初期接触', sequenceNumber: 1 },
      { stageId: 'STAGE-05', stageName: '成約済み', sequenceNumber: 5 },
    ];

    const validationRules = [
      {
        ruleId: 'RULE-001',
        ruleName: '請求書と商談の紐付け確認',
        ruleType: 'invoice_deal_reconciliation',
      },
      {
        ruleId: 'RULE-002',
        ruleName: '金額一致確認',
        ruleType: 'amount_reconciliation',
      },
      {
        ruleId: 'RULE-003',
        ruleName: '請求明細の整合性確認',
        ruleType: 'invoice_line_item_integrity',
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
      closingInstructionId: 'INSTR-2024-001',
      targetMonth: '2024-01',
      operatorUserId: 'USR-SALES-ADMIN-001',
      executionTimestamp: new Date('2024-02-05T10:00:00Z'),
    });

    expect(result.closingPeriod.periodStartDate).toEqual(
      new Date('2024-01-01T00:00:00Z')
    );
    expect(result.closingPeriod.periodEndDate).toEqual(
      new Date('2024-01-31T23:59:59Z')
    );
    expect(result.readyForExtraction).toBeDefined();
    expect(result.extractionScope.extractionObjects).toBeDefined();
    expect(result.extractionScope.dataIntegrityCheckpoints).toBeDefined();
    expect(result.preparationCompletedAt).toEqual(
      new Date('2024-02-05T10:00:00Z')
    );
  });
});
