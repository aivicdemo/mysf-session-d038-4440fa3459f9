import {
  validateInvoiceReferenceIntegrity,
  ValidateInvoiceReferenceIntegrityOutput,
} from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>(
    '../../src/logic/data-persistence'
  ),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
}));

describe('SCEN-100: 商談IDが有効で、請求書と請求明細が完全に紐付き、金額が全て一致している場合、参照関係が有効と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('商談IDが有効で、すべての請求書と請求明細が紐付き、金額が完全に一致する場合、isValid が true で invoiceIds が返される', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';

    const mockDealRecord = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealAmount: 300000,
    };

    const mockInvoiceRecords = [
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

    const mockInvoiceLineItemRecords = [
      {
        lineId: 'line-001',
        invoiceId: 'inv-001',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        lineAmount: 100000,
      },
      {
        lineId: 'line-002',
        invoiceId: 'inv-001',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        lineAmount: 50000,
      },
      {
        lineId: 'line-003',
        invoiceId: 'inv-002',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        lineAmount: 150000,
      },
    ];

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(
      mockDealRecord
    );
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(
      mockInvoiceRecords
    );
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockImplementation(
      (invoiceId: string) => {
        if (invoiceId === 'inv-001') {
          return Promise.resolve([
            { lineId: 'line-001', lineAmount: 100000 },
            { lineId: 'line-002', lineAmount: 50000 },
          ]);
        } else if (invoiceId === 'inv-002') {
          return Promise.resolve([{ lineId: 'line-003', lineAmount: 150000 }]);
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
