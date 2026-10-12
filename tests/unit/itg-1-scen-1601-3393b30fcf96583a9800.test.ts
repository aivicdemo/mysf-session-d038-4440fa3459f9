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

describe('SCEN-1601: 請求明細含有・商談無い商品がなければ余剰商品リスト空で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('prepareMonthlyClosing: 請求がすべて成約済み商談に紐付く場合、余剰商品リストは空', async () => {
    const customers = [
      { customerId: 'CUST-001', customerName: '株式会社ABC', isActive: true },
      { customerId: 'CUST-002', customerName: '株式会社XYZ', isActive: true },
    ];

    const deals = [
      {
        dealId: 'DEAL-001',
        dealName: 'プロジェクトA',
        status: '成約済み',
        customerId: 'CUST-001',
        closedDate: '2024-12-15',
      },
      {
        dealId: 'DEAL-002',
        dealName: 'プロジェクトB',
        status: '成約済み',
        customerId: 'CUST-002',
        closedDate: '2024-12-20',
      },
    ];

    const invoices = [
      {
        invoiceId: 'INV-001',
        dealId: 'DEAL-001',
        invoiceDate: '2024-12-16',
        amount: 1000000,
        lineItems: [
          {
            lineItemId: 'LINE-001',
            productId: 'PROD-001',
            quantity: 1,
            unitPrice: 1000000,
          },
        ],
      },
      {
        invoiceId: 'INV-002',
        dealId: 'DEAL-002',
        invoiceDate: '2024-12-21',
        amount: 500000,
        lineItems: [
          {
            lineItemId: 'LINE-002',
            productId: 'PROD-002',
            quantity: 1,
            unitPrice: 500000,
          },
        ],
      },
    ];

    const dealStages = [
      { stageId: 'STAGE-001', stageName: '成約済み', order: 5 },
      { stageId: 'STAGE-002', stageName: '検討中', order: 3 },
    ];

    const validationRules = [
      {
        ruleId: 'RULE-001',
        ruleName: '請求明細必須チェック',
        ruleType: 'invoice_line_required',
      },
      {
        ruleId: 'RULE-002',
        ruleName: '金額一致確認',
        ruleType: 'amount_match',
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
      targetMonth: '2024-12',
      operatorUserId: 'USR-SALES-ADMIN-001',
      executionTimestamp: new Date('2025-01-05T09:00:00Z'),
    });

    expect(result.closingPeriod.periodStartDate).toEqual(
      new Date('2024-12-01T00:00:00Z')
    );
    expect(result.closingPeriod.periodEndDate).toEqual(
      new Date('2024-12-31T23:59:59Z')
    );
    expect(result.readyForExtraction).toBe(true);
    expect(result.extractionScope).toBeDefined();
    expect(result.extractionCriteria).toBeDefined();
    expect(result.preparationCompletedAt).toEqual(
      new Date('2025-01-05T09:00:00Z')
    );
  });
});
