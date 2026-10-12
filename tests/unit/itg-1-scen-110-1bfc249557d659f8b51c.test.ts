import { validateInvoiceReferenceIntegrity } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-110: 請求書と請求明細の参照関係に破損がある場合、警告が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数の参照関係の破損が検出された場合、isValid が false で 2 件の異常を含む ValidateInvoiceReferenceIntegrityOutput が返される', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';

    const mockDealRecord = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: 'cust-001',
      dealAmount: 300000,
      status: 'CLOSED_WON',
    };

    const mockInvoiceRecords = [
      {
        invoiceId: 'inv-001',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        customerId: 'cust-001',
        invoiceAmount: 150000,
        status: 'ISSUED',
      },
      {
        invoiceId: 'inv-002',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        customerId: 'cust-002',
        invoiceAmount: 150000,
        status: 'ISSUED',
      },
    ];

    const mockInvoiceLineItemRecords = [
      {
        lineItemId: 'line-001',
        invoiceId: 'inv-001',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        lineAmount: 150000,
      },
      {
        lineItemId: 'line-002',
        invoiceId: 'inv-002',
        dealId: '999e8400-e29b-41d4-a716-446655440099',
        lineAmount: 150000,
      },
    ];

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDealRecord);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(mockInvoiceRecords);
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockImplementation(
      (invoiceId: string) => {
        if (invoiceId === 'inv-001') {
          return Promise.resolve([{ lineItemId: 'line-001', invoiceId: 'inv-001', dealId: '550e8400-e29b-41d4-a716-446655440000', lineAmount: 150000 }]);
        } else if (invoiceId === 'inv-002') {
          return Promise.resolve([{ lineItemId: 'line-002', invoiceId: 'inv-002', dealId: '999e8400-e29b-41d4-a716-446655440099', lineAmount: 150000 }]);
        }
        return Promise.resolve([]);
      }
    );

    const result = await validateInvoiceReferenceIntegrity({ dealId });

    expect(result.isValid).toBe(false);
    expect(result.referenceAnomalies).toHaveLength(2);

    const dealMismatch = result.referenceAnomalies.find(a => a.anomalyType === 'DealInvoiceMismatch');
    expect(dealMismatch).toBeDefined();
    expect(dealMismatch?.description).toBe('請求書と商談の参照関係が不整合です。');
    expect(dealMismatch?.affectedRecordId).toBe('inv-002');

    const lineItemMismatch = result.referenceAnomalies.find(a => a.anomalyType === 'InvoiceLineItemDealMismatch');
    expect(lineItemMismatch).toBeDefined();
    expect(lineItemMismatch?.description).toBe('請求明細と商談の参照関係が不整合です。');
    expect(lineItemMismatch?.affectedRecordId).toBe('line-002');

    expect(result.invoiceIds).toContain('inv-001');
    expect(result.invoiceIds).toContain('inv-002');
    expect(result.validationTimestamp).toBeInstanceOf(Date);
  });
});
