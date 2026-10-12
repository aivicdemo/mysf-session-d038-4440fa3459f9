import { generateInvoiceFromDeal, InvoiceLineItemSaveFailure } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as modificationTracking from '../../src/logic/modification-tracking';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/modification-tracking');

describe('SCEN-117: 請求明細レコードの保存に失敗したとき、InvoiceLineItemSaveFailureエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvoiceLineItemSaveFailure when saveInvoiceLineItem fails', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const currentDateTime = new Date('2026-10-07T10:30:00.000Z');
    const executingUserId = 'user-001';

    const dealData = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'ABC株式会社 システム導入案件',
      customerId: 'cust-001',
      ownerUserId: 'user-002',
      dealAmount: 1100000,
      stage: '契約確定',
      taxRate: 0.1,
    };

    const invoiceGenerationPrerequisites = {
      isValid: true,
      validationResults: {
        customerIdExists: true,
        ownerUserIdExists: true,
        dealAmountValid: true,
        stageAllowsInvoiceGeneration: true,
      },
    };

    const calculatedAmountAndTax = {
      untaxedAmount: 1000000,
      taxAmount: 100000,
      invoiceAmount: 1100000,
    };

    const amountCalculationValidation = {
      isValid: true,
      discrepancies: [],
    };

    const invoiceData = {
      invoiceId: 'inv-550e8400-e29b-41d4-a716-446655440000',
      invoiceNumber: 'INV-2026-10-0001',
      createdAt: new Date('2026-10-07T10:30:00.000Z'),
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(dealData);
    (dataPersistence.saveInvoice as jest.Mock).mockResolvedValue(invoiceData);
    (dataPersistence.saveInvoiceLineItem as jest.Mock).mockRejectedValue(new InvoiceLineItemSaveFailure());

    await expect(
      generateInvoiceFromDeal({
        dealId,
        currentDateTime,
        executingUserId,
      })
    ).rejects.toThrow(InvoiceLineItemSaveFailure);
  });
});
