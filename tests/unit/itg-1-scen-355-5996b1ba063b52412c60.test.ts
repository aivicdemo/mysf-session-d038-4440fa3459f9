import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as dataPersistence from '../../src/logic/data-persistence';
import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-355: 請求済み金額が契約金額の1%以上99%未満で請求書が1件の場合、請求ステータスが「部分請求」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return invoiceStatus as "partial_billing" when invoice amount is 45% of deal amount with single invoice', async () => {
    const dealId = 'DEAL-20240115-001';
    const currentDateTime = new Date('2024-01-20T10:00:00Z');
    const dealAmount = 1000000;
    const invoiceAmount = 450000;
    const taxAmount = 45000;
    const paidAmount = 450000;
    const dueDate = '2024-02-15';

    (dataPersistence.fetchDealById as jest.Mock<any>).mockResolvedValue({
      dealId,
      customerId: 'CUST-001',
      salesRepresentativeId: 'REP-001',
      dealName: 'Test Deal',
      dealAmount,
      stageId: 'stage-001',
      expectedContractDate: '2024-01-10',
      contractedDate: '2024-01-10',
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-10T00:00:00Z',
      createdBy: 'SYSTEM',
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock<any>).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-20240115-001',
          dealId,
          customerId: 'CUST-001',
          salesRepresentativeId: 'REP-001',
          invoiceNumber: 'INV-001',
          invoiceDate: '2024-01-15',
          dueDate,
          invoiceAmount,
          taxAmount,
          untaxedAmount: invoiceAmount,
          invoiceStatus: 'issued',
          paidDate: '2024-01-18',
          paidAmount,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-18T00:00:00Z',
          createdBy: 'SYSTEM',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-20T10:00:00Z',
    });

    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock<any>).mockResolvedValue({
      lineItems: [
        {
          invoiceLineItemId: 'LINE-001',
          invoiceId: 'INV-20240115-001',
          lineItemNumber: 1,
          lineItemAmount: invoiceAmount,
          lineItemTaxAmount: taxAmount,
          lineItemTaxIncludedAmount: invoiceAmount + taxAmount,
          description: null,
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          createdBy: 'SYSTEM',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-20T10:00:00Z',
    });

    (dataPersistence.fetchAllValidationRules as jest.Mock<any>).mockResolvedValue({
      validationRules: [
        {
          validationRuleId: 'RULE-001',
          ruleName: 'Overdue Threshold',
          ruleDescription: null,
          targetTable: 'INVOICE',
          targetColumn: 'dueDate',
          validationType: 'threshold',
          validationCondition: 'days >= 30',
          errorMessage: 'Invoice is overdue',
          warningLevel: 'warning',
          validFlag: true,
          applicationStartDate: '2024-01-01',
          applicationEndDate: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-20T10:00:00Z',
    });

    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.dealId).toBe(dealId);
    expect(result.invoiceStatus).toBe('partial_billing');
    expect(result.invoiceCount).toBe(1);
    expect(result.totalInvoiceAmount).toBe(invoiceAmount);
    expect(result.totalPaidAmount).toBe(paidAmount);
    expect(result.dealAmount).toBe(dealAmount);
    expect(result.amountConsistency).toBe(true);
    expect(result.invoiceDetails).toEqual([
      {
        invoiceId: 'INV-20240115-001',
        invoiceAmount,
        paidAmount,
        invoiceStatus: 'issued',
        dueDate,
        isOverdue: false,
      },
    ]);
  });
});
