import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  judgeInvoiceStatusConsistency,
  DealNotFound,
  InvoiceNotFound,
  InvoiceLineItemsNotFound,
  StatusMismatchDetected,
} from '../../src/logic/invoice-status-judgment';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-272: 商談がクローズ状態で請求書・請求明細が存在し、ステータスが整合している場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('整合性が確認された状態で正常に検証完了する', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const executedAt = new Date('2026-10-07T10:00:00.000Z');

    const mockDealData = {
      dealId,
      customerId: 'cust-001',
      salesRepresentativeId: 'rep-001',
      dealName: 'Deal A',
      dealAmount: 500000,
      stageId: 'stage-closed',
      expectedContractDate: '2026-10-01T00:00:00.000Z',
      contractedDate: '2026-10-01T00:00:00.000Z',
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
      createdBy: 'user-001',
    };

    const mockInvoiceData = {
      invoice: {
        invoiceId: 'inv-20261001-001',
        dealId,
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        invoiceNumber: '20261001-001',
        invoiceDate: '2026-10-02T00:00:00.000Z',
        dueDate: '2026-10-31T00:00:00.000Z',
        invoiceAmount: 500000,
        taxAmount: 50000,
        untaxedAmount: 500000,
        invoiceStatus: 'issued',
        paidDate: null,
        paidAmount: null,
        remarks: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2026-10-02T00:00:00.000Z',
        updatedAt: '2026-10-02T00:00:00.000Z',
        createdBy: 'user-001',
      },
      lineItems: [
        {
          lineItemId: 'line-001',
          invoiceId: 'inv-20261001-001',
          dealId,
          activityId: null,
          lineNumber: 1,
          productName: 'Product A',
          productDescription: null,
          quantity: 100,
          unitPrice: 5000,
          amount: 500000,
          taxRate: 0.1,
          taxAmount: 50000,
          taxIncludedAmount: 550000,
          remarks: null,
          modificationPreviousQuantity: null,
          modificationPreviousUnitPrice: null,
          modificationPreviousAmount: null,
          createdAt: '2026-10-02T00:00:00.000Z',
          updatedAt: '2026-10-02T00:00:00.000Z',
          createdBy: 'user-001',
        },
      ],
    };

    (
      dataPersistence.fetchDealById as jest.MockedFunction<
        typeof dataPersistence.fetchDealById
      >
    ).mockResolvedValue(mockDealData);

    (
      dataPersistence.fetchInvoiceWithLineItems as jest.MockedFunction<
        typeof dataPersistence.fetchInvoiceWithLineItems
      >
    ).mockResolvedValue(mockInvoiceData);

    const result = await judgeInvoiceStatusConsistency({
      dealId,
      executedAt,
    });

    expect(result).toEqual({
      isConsistent: true,
      dealStatus: 'closed',
      invoiceStatus: 'issued',
      mismatchDetails: null,
      invoiceId: 'inv-20261001-001',
    });

    expect(dataPersistence.fetchDealById).toHaveBeenCalled();
    expect(dataPersistence.fetchInvoiceWithLineItems).toHaveBeenCalled();
  });
});
