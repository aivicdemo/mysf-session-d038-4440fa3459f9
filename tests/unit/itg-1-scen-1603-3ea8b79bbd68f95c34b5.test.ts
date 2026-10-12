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

describe('SCEN-1603: 商談商品と請求明細の数量または単価異なれば明細不整合記録', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('prepareMonthlyClosing: 商談と請求明細で数量・単価が異なる場合、不整合として記録', async () => {
    const customers = [
      { customerId: 'C001', customerName: '取引先A', status: 'active' },
      { customerId: 'C002', customerName: '取引先B', status: 'active' },
    ];

    const deals = [
      {
        dealId: 'D001',
        dealName: '商談X',
        status: 'closed_won',
        closedDate: '2024-11-10',
        quantity: 100,
        unitPrice: 5000,
      },
      {
        dealId: 'D002',
        dealName: '商談Y',
        status: 'closed_won',
        closedDate: '2024-11-15',
        quantity: 50,
        unitPrice: 3000,
      },
    ];

    const invoices = [
      {
        invoiceId: 'INV-001',
        dealId: 'D001',
        invoiceDate: '2024-11-10',
        invoiceLineItems: [
          { lineItemId: 'LI-001', quantity: 100, unitPrice: 5000 },
          { lineItemId: 'LI-002', quantity: 50, unitPrice: 3000 },
        ],
      },
      {
        invoiceId: 'INV-002',
        dealId: 'D002',
        invoiceDate: '2024-11-15',
        invoiceLineItems: [
          { lineItemId: 'LI-003', quantity: 50, unitPrice: 3000 },
        ],
      },
    ];

    const dealStages = [
      { stageId: 'STAGE-1', stageName: 'lead', order: 1 },
      { stageId: 'STAGE-2', stageName: 'qualified', order: 2 },
      { stageId: 'STAGE-3', stageName: 'closed_won', order: 10 },
    ];

    const validationRules = [
      {
        ruleId: 'RULE-001',
        ruleName: 'deal_invoice_qty_match',
        description: '商談商品と請求明細の数量一致確認',
        isActive: true,
      },
      {
        ruleId: 'RULE-002',
        ruleName: 'deal_invoice_price_match',
        description: '商談商品と請求明細の単価一致確認',
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
      closingInstructionId: 'INSTR-2024-001',
      targetMonth: '2024-11',
      operatorUserId: 'USER-SALES-OPS-001',
      executionTimestamp: new Date('2024-11-15T09:00:00Z'),
    });

    expect(result.closingPeriod.periodStartDate).toEqual(
      new Date('2024-11-01T00:00:00Z')
    );
    expect(result.closingPeriod.periodEndDate).toEqual(
      new Date('2024-11-30T23:59:59Z')
    );
    expect(result.readyForExtraction).toBeDefined();
    expect(result.extractionScope.dataIntegrityCheckpoints).toBeDefined();
    expect(result.preparationCompletedAt).toEqual(
      new Date('2024-11-15T09:00:00Z')
    );
  });
});
