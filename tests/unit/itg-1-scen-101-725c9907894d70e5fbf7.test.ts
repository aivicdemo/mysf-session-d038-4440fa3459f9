import { validateInvoiceReferenceIntegrity } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>(
    '../../src/logic/data-persistence'
  ),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
}));

describe('SCEN-101: 複数の請求書が存在し、すべての請求明細が紐付き、各請求書の金額が請求明細合計と一致し、請求書合計が商談金額と一致している場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数請求書ですべての金額が一致する場合、すべての請求書IDが有効なリストとして返される', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';

    const mockDealData = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealAmount: 300000,
    };

    const mockInvoices = [
      {
        invoiceId: 'inv-001',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        invoiceAmount: 150000,
      },
      {
        invoiceId: 'inv-002',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        invoiceAmount: 150000,
      },
    ];

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(
      mockDealData
    );
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(
      mockInvoices
    );
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockImplementation(
      (invoiceId: string) => {
        if (invoiceId === 'inv-001') {
          return Promise.resolve([
            { lineId: 'line-001', lineAmount: 100000 },
            { lineId: 'line-002', lineAmount: 50000 },
          ]);
        } else if (invoiceId === 'inv-002') {
          return Promise.resolve([
            { lineId: 'line-003', lineAmount: 100000 },
            { lineId: 'line-004', lineAmount: 50000 },
          ]);
        }
        return Promise.resolve([]);
      }
    );

    const result = await validateInvoiceReferenceIntegrity({ dealId });

    expect(result.dealId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.isValid).toBe(true);
    expect(result.invoiceIds).toEqual(['inv-001', 'inv-002']);
    expect(result.referenceAnomalies).toEqual([]);
    expect(result.validationTimestamp).toBeInstanceOf(Date);

    expect(dataPersistence.fetchDealById).toHaveBeenCalledWith(dealId);
    expect(dataPersistence.fetchInvoicesForPeriod).toHaveBeenCalledWith(dealId);
    expect(dataPersistence.fetchInvoiceLineItemsByInvoice).toHaveBeenCalledWith(
      'inv-001'
    );
    expect(dataPersistence.fetchInvoiceLineItemsByInvoice).toHaveBeenCalledWith(
      'inv-002'
    );
  });
});
