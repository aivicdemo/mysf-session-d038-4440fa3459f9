import { validateInvoiceReferenceIntegrity, DealInvoiceMismatch } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-105: 請求書のdeal_idが指定されたdealIdと一致しない、または請求書のcustomer_idが商談のcustomer_idと一致しない場合、DealInvoiceMismatchエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('請求書のcustomer_idが商談のcustomer_idと一致しない場合、isValid が false で referenceAnomalies に異常を含むオブジェクトが返される', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';

    const mockDealRecord = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      customer_id: 'cust-001',
      dealAmount: 300000,
      dealStatus: 'closed_won',
    };

    const mockInvoiceRecords = [
      {
        invoiceId: 'inv-001',
        deal_id: '550e8400-e29b-41d4-a716-446655440000',
        customer_id: 'cust-002',
        invoiceAmount: 300000,
        invoiceStatus: 'issued',
      },
    ];

    const mockInvoiceLineItemRecords = [
      {
        lineId: 'line-001',
        invoiceId: 'inv-001',
        deal_id: '550e8400-e29b-41d4-a716-446655440000',
        lineAmount: 300000,
        productId: 'prod-001',
      },
    ];

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDealRecord);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(mockInvoiceRecords);
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValue(mockInvoiceLineItemRecords);

    const result = await validateInvoiceReferenceIntegrity({ dealId });

    expect(result.isValid).toBe(false);
    expect(result.referenceAnomalies).toContainEqual({
      anomalyType: 'DealInvoiceMismatch',
      description: '請求書のcustomer_idが商談のcustomer_idと一致しません（請求書: cust-002, 商談: cust-001）',
      affectedRecordId: 'inv-001',
    });
    expect(result.invoiceIds).toContain('inv-001');
  });
});
