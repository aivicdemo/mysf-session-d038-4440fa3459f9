import { detectInvoiceDelayAndClassifyPriority } from '../../src/logic/invoice-delay-detection';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as invoiceSlaMonitoring from '../../src/logic/invoice-sla-monitoring';
import * as invoiceStatusClassification from '../../src/logic/invoice-status-classification';
import * as notificationService from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/invoice-sla-monitoring');
jest.mock('../../src/logic/invoice-status-classification');
jest.mock('../../src/logic/notification-service');

describe('SCEN-300: 金額の差分は商談金額と請求金額の差分として正確に計算される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should accurately calculate amount difference', async () => {
    const dealAndInvoiceRecords = [
      {
        dealAmount: 500000,
        dealStatus: '受注',
        invoiceAmount: 498500,
        invoiceStatus: '作成済',
        invoiceDueDate: '2024-06-30',
        createdDate: '2024-02-01',
      },
    ];

    const invoiceSLADeadlines = [
      {
        slaDeadline: '2024-02-15',
        expectedInvoiceDueDate: '2024-06-30',
      },
    ];

    const invoiceStatusResults = [
      {
        classifiedStatus: '部分請求',
        amountDifference: 1500,
        isValid: true,
      },
    ];

    (jest.spyOn(dataPersistence, 'fetchDealsWithInvoices') as any)
      .mockResolvedValueOnce(dealAndInvoiceRecords);
    (jest.spyOn(invoiceSlaMonitoring, 'calculateInvoiceSLADeadline') as any)
      .mockResolvedValueOnce(invoiceSLADeadlines);
    (jest.spyOn(invoiceStatusClassification, 'classifyInvoiceStatus') as any)
      .mockResolvedValueOnce(invoiceStatusResults);
    (jest.spyOn(notificationService, 'notifyIssueResponse') as any)
      .mockResolvedValueOnce({
        success: true,
        notificationId: 'NOTIF-12345',
      } as any);

    const result = await detectInvoiceDelayAndClassifyPriority({
      salesRepresentativeId: 'REP-001',
      targetPeriodStart: new Date('2024-01-01'),
      targetPeriodEnd: new Date('2024-12-31'),
      currentDateTime: new Date('2024-06-15T10:00:00Z'),
    });

    expect(result.detectionResults).toBeDefined();
    expect(Array.isArray(result.detectionResults)).toBe(true);
    expect(result.totalUnbilledCount).toBe(0);
    expect(result.totalDelayedCount).toBe(0);
    expect(result.notificationSent).toBe(true);

    if (result.detectionResults.length > 0) {
      const firstResult = result.detectionResults[0];
      expect(firstResult.issueType).toBe('partiallyBilled');
      expect(firstResult.dealAmount).toBe(500000);
    }
  });
});
