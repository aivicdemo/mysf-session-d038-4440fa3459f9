import { classifyInvoiceStatus, DealNotFound, InvalidDealStatus, InvoiceDataInconsistency, MultipleInvoiceAmountMismatch } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-325: 商談が存在し請求書がない場合、請求ステータスが「未請求」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('商談が存在し請求書がない場合、invoiceStatus が unbilled と判定される', async () => {
    const dealId = 'DEAL-20240115-001';
    const currentDateTime = new Date('2024-01-20T10:00:00Z');

    const mockDeal = {
      dealId: 'DEAL-20240115-001',
      customerId: 'CUST-001',
      salesRepresentativeId: 'REP-001',
      dealName: 'Test Deal',
      dealAmount: 500000,
      stageId: 'stage-closed',
      expectedContractDate: '2024-01-15',
      contractedDate: '2024-01-15',
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      createdBy: 'user-001',
    };

    const mockInvoices = {
      invoices: [],
      totalCount: 0,
      fetchedAt: '2024-01-20T10:00:00Z',
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValueOnce(mockDeal);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValueOnce(mockInvoices);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValueOnce({
      validationRules: [{ validationRuleId: 'rule-1', ruleName: 'Overdue Check', validationCondition: '30' }],
      totalCount: 1,
      fetchedAt: '2024-01-20T10:00:00Z',
    });

    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.invoiceStatus).toBe('unbilled');
    expect(result.dealId).toBe('DEAL-20240115-001');
    expect(result.invoiceCount).toBe(0);
    expect(result.totalInvoiceAmount).toBe(0);
    expect(result.totalPaidAmount).toBe(0);
    expect(result.invoiceDetails).toEqual([]);
    expect(result.dealAmount).toBe(500000);
    expect(result.amountConsistency).toBe(true);
  });
});
