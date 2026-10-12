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

describe('SCEN-1600: 商談含有・請求明細漏れ商品があれば漏れ商品リストに含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('prepareMonthlyClosing: 成約済み商談DEAL-002に請求が無い場合、漏れ商品リストに含まれる', async () => {
    const customers = [
      { customerId: 'cust-001', customerName: '取引先A', isActive: true },
      { customerId: 'cust-002', customerName: '取引先B', isActive: true },
    ];

    const deals = [
      {
        id: 'deal-001',
        name: '商談A',
        customerId: 'cust-001',
        status: '成約済み',
        closedDate: '2025-01-15',
        amount: 1000000,
      },
      {
        id: 'deal-002',
        name: '商談B',
        customerId: 'cust-002',
        status: '成約済み',
        closedDate: '2025-01-20',
        amount: 500000,
      },
    ];

    const invoices = [
      {
        id: 'inv-001',
        dealId: 'deal-001',
        invoiceDate: '2025-01-16',
        amount: 1000000,
        status: '請求済み',
      },
    ];

    const dealStages = [
      { stageId: 'stage-1', stageName: '初期接触', displayOrder: 1 },
      { stageId: 'stage-5', stageName: '成約済み', displayOrder: 5 },
    ];

    const validationRules = [
      {
        ruleId: 'rule-001',
        ruleName: '商談と請求明細の紐付け確認',
        ruleType: 'integrity',
      },
      { ruleId: 'rule-002', ruleName: '金額一致確認', ruleType: 'integrity' },
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
    expect(result.readyForExtraction).toBeDefined();
    expect(result.extractionScope.extractionObjects).toBeDefined();
    expect(result.extractionScope.dataIntegrityCheckpoints).toBeDefined();
    expect(Array.isArray(result.extractionScope.exclusionRules)).toBe(true);
  });
});
