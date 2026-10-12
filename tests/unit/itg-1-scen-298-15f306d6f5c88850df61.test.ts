import { detectInvoiceDelayAndClassifyPriority } from '../../src/logic/invoice-delay-detection';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as invoiceSlaMonitoring from '../../src/logic/invoice-sla-monitoring';
import * as invoiceStatusClassification from '../../src/logic/invoice-status-classification';
import * as notificationService from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/invoice-sla-monitoring');
jest.mock('../../src/logic/invoice-status-classification');
jest.mock('../../src/logic/notification-service');

describe('SCEN-298: 検出結果が複数件ある場合、totalUnbilledCount と totalDelayedCount をそれぞれ正確に集計する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should accurately count unbilled and delayed items', async () => {
    const dealAndInvoiceRecords = [
      {
        dealId: 'DEAL-001',
        dealStatus: '受注',
        dealAmount: 100000,
        invoiceId: 'INV-001',
        invoiceStatus: '未作成',
        invoiceAmount: 0,
        invoiceDueDate: '2024-01-20',
      },
      {
        dealId: 'DEAL-002',
        dealStatus: '受注',
        dealAmount: 200000,
        invoiceId: 'INV-002',
        invoiceStatus: '作成済',
        invoiceAmount: 180000,
        invoiceDueDate: '2024-02-10',
      },
      {
        dealId: 'DEAL-003',
        dealStatus: '受注',
        dealAmount: 150000,
        invoiceId: 'INV-003',
        invoiceStatus: '送付済',
        invoiceAmount: 150000,
        invoiceDueDate: '2024-01-25',
      },
    ];

    const invoiceSLADeadlines = [
      {
        dealId: 'DEAL-001',
        slaDueDate: '2024-01-15',
        actualDueDate: '2024-01-20',
      },
      {
        dealId: 'DEAL-002',
        slaDueDate: '2024-01-20',
        actualDueDate: '2024-02-10',
      },
      {
        dealId: 'DEAL-003',
        slaDueDate: '2024-01-20',
        actualDueDate: '2024-01-25',
      },
    ];

    const invoiceStatusResults = [
      { dealId: 'DEAL-001', invoiceStatus: '未請求' },
      { dealId: 'DEAL-002', invoiceStatus: '部分請求' },
      { dealId: 'DEAL-003', invoiceStatus: '請求済' },
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
      targetPeriodStart: new Date('2024-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2024-01-31T23:59:59Z'),
      currentDateTime: new Date('2024-02-15T10:00:00Z'),
    });

    expect(result.totalUnbilledCount).toBe(1);
    expect(result.totalDelayedCount).toBe(1);
    expect(result.notificationSent).toBe(true);
    expect(result.detectionResults).toBeDefined();
    expect(Array.isArray(result.detectionResults)).toBe(true);
    expect(result.detectionResults.length).toBeGreaterThanOrEqual(1);
  });
});
