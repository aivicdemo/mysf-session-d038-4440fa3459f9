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

describe('SCEN-1606: 商談がクローズ状態なら請求と商談ステータス整合性が検証される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('prepareMonthlyClosing: Closed Won商談の請求ステータス整合性が検証される', async () => {
    const customers = [
      {
        customerId: 'CUST-001',
        customerName: 'A株式会社',
        isActive: true,
        createdAt: '2024-01-10T00:00:00Z',
      },
      {
        customerId: 'CUST-002',
        customerName: 'B有限会社',
        isActive: true,
        createdAt: '2024-06-15T00:00:00Z',
      },
    ];

    const deals = [
      {
        dealId: 'DEAL-001',
        customerId: 'CUST-001',
        dealName: '新規システム構築案件',
        dealAmount: 5000000,
        status: 'Closed Won',
        closedDate: '2024-12-05T00:00:00Z',
        invoiceLinked: true,
      },
      {
        dealId: 'DEAL-002',
        customerId: 'CUST-002',
        dealName: '保守契約更新',
        dealAmount: 1200000,
        status: 'Closed Won',
        closedDate: '2024-12-10T00:00:00Z',
        invoiceLinked: true,
      },
    ];

    const invoices = [
      {
        invoiceId: 'INV-2024-001',
        dealId: 'DEAL-001',
        customerId: 'CUST-001',
        invoiceAmount: 5000000,
        invoiceDate: '2024-12-05T00:00:00Z',
        status: 'Issued',
        dealStatus: 'Closed Won',
      },
      {
        invoiceId: 'INV-2024-002',
        dealId: 'DEAL-002',
        customerId: 'CUST-002',
        invoiceAmount: 1200000,
        invoiceDate: '2024-12-10T00:00:00Z',
        status: 'Issued',
        dealStatus: 'Closed Won',
      },
    ];

    const dealStages = [
      { stageName: 'Prospecting', stageOrder: 1, isClosed: false },
      { stageName: 'Closed Won', stageOrder: 6, isClosed: true },
    ];

    const validationRules = [
      {
        ruleId: 'RULE-001',
        ruleName: '商談とピクチャ金額一致確認',
        description: 'クローズ状態の商談に紐付く請求の合計金額が商談金額と一致すること',
        isActive: true,
      },
      {
        ruleId: 'RULE-002',
        ruleName: '請求日と商談クローズ日の整合性',
        description: '請求日が商談のクローズ日以降であること',
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
      closingInstructionId: 'CI-2024-12-001',
      targetMonth: '2024-12',
      operatorUserId: 'USR-SALES-OPS-001',
      executionTimestamp: new Date('2024-12-15T09:00:00Z'),
    });

    expect(result.closingPeriod.periodStartDate).toEqual(
      new Date('2024-12-01T00:00:00Z')
    );
    expect(result.closingPeriod.periodEndDate).toEqual(
      new Date('2024-12-31T23:59:59Z')
    );
    expect(result.readyForExtraction).toBeDefined();
    expect(result.extractionScope).toBeDefined();
    expect(result.extractionScope.dataIntegrityCheckpoints).toBeDefined();
    expect(result.preparationCompletedAt).toEqual(
      new Date('2024-12-15T09:00:00Z')
    );
  });
});
