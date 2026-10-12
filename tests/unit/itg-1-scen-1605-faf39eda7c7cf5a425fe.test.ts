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

describe('SCEN-1605: 商談商品と請求明細完全一致なら推奨アクション承認で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('prepareMonthlyClosing: 商談と請求が完全一致する場合、readyForExtraction=true', async () => {
    const customers = [
      { customerId: 'CUST-001', customerName: '株式会社ABC', isActive: true },
      { customerId: 'CUST-002', customerName: '株式会社DEF', isActive: true },
    ];

    const deals = [
      {
        dealId: 'DEAL-2025-001',
        dealName: 'A商談',
        customerId: 'CUST-001',
        dealAmount: 500000,
        status: 'Closed Won',
        isActive: true,
      },
      {
        dealId: 'DEAL-2025-002',
        dealName: 'B商談',
        customerId: 'CUST-002',
        dealAmount: 300000,
        status: 'Closed Won',
        isActive: true,
      },
    ];

    const invoices = [
      {
        invoiceId: 'INV-2025-001',
        dealId: 'DEAL-2025-001',
        totalAmount: 500000,
        invoiceDetails: [
          {
            lineItemId: 'LINE-001',
            productName: '製品A',
            quantity: 1,
            unitPrice: 500000,
            lineAmount: 500000,
          },
        ],
      },
      {
        invoiceId: 'INV-2025-002',
        dealId: 'DEAL-2025-002',
        totalAmount: 300000,
        invoiceDetails: [
          {
            lineItemId: 'LINE-002',
            productName: '製品B',
            quantity: 1,
            unitPrice: 300000,
            lineAmount: 300000,
          },
        ],
      },
    ];

    const dealStages = [
      { stageId: 'STAGE-CLOSED-WON', stageName: '成約済み', isActive: true },
      {
        stageId: 'STAGE-NEGOTIATION',
        stageName: '交渉中',
        isActive: true,
      },
    ];

    const validationRules = [
      {
        ruleId: 'RULE-DEAL-INVOICE-MATCH',
        ruleName: '商談と請求完全一致チェック',
        ruleDescription: '商談額と請求明細合計が完全一致すること',
        isActive: true,
        severity: 'critical',
      },
      {
        ruleId: 'RULE-EXCLUDE-TEST-CUSTOMERS',
        ruleName: 'テスト取引先除外ルール',
        ruleDescription: 'テスト用の取引先を抽出から除外',
        isActive: true,
        severity: 'high',
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
      closingInstructionId: 'INSTR-2025-01-20-001',
      targetMonth: '2025-01',
      operatorUserId: 'USER-SALES-OPS-001',
      executionTimestamp: new Date('2025-01-20T09:00:00Z'),
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
      new Date('2025-01-20T09:00:00Z')
    );
  });
});
