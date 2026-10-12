import { detectInvoiceDelayAndClassifyPriority } from '../../src/logic/invoice-delay-detection';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as invoiceSlaMonitoring from '../../src/logic/invoice-sla-monitoring';
import * as invoiceStatusClassification from '../../src/logic/invoice-status-classification';
import * as notificationService from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/invoice-sla-monitoring');
jest.mock('../../src/logic/invoice-status-classification');
jest.mock('../../src/logic/notification-service');

describe('SCEN-294: 通知送信が失敗した場合、notificationSent を false で返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return notificationSent=false when notification fails', async () => {
    const dealAndInvoiceRecords = [
      {
        dealId: 'DEAL-001',
        dealStatus: '受注',
        dealAmount: 500000,
        dealClosedDate: '2024-03-15',
        invoiceId: 'INV-001',
        invoiceStatus: '未作成',
        invoiceAmount: 0,
        invoiceDueDate: '2024-04-15',
      },
      {
        dealId: 'DEAL-002',
        dealStatus: '受注',
        dealAmount: 300000,
        dealClosedDate: '2024-02-20',
        invoiceId: 'INV-002',
        invoiceStatus: '送付済',
        invoiceAmount: 300000,
        invoiceDueDate: '2024-05-20',
      },
    ];

    const invoiceSLADeadlines = [
      {
        dealId: 'DEAL-001',
        invoiceId: 'INV-001',
        invoiceSLADeadline: '2024-03-22',
        invoicePaymentDeadline: '2024-04-15',
      },
      {
        dealId: 'DEAL-002',
        invoiceId: 'INV-002',
        invoiceSLADeadline: '2024-02-27',
        invoicePaymentDeadline: '2024-05-20',
      },
    ];

    const invoiceStatusClassificationResults = [
      { dealId: 'DEAL-001', invoiceId: 'INV-001', classifiedStatus: '未請求' },
      { dealId: 'DEAL-002', invoiceId: 'INV-002', classifiedStatus: '請求済' },
    ];

    (jest.spyOn(dataPersistence, 'fetchDealsWithInvoices') as any)
      .mockResolvedValueOnce(dealAndInvoiceRecords);
    (jest.spyOn(invoiceSlaMonitoring, 'calculateInvoiceSLADeadline') as any)
      .mockResolvedValueOnce(invoiceSLADeadlines);
    (jest.spyOn(invoiceStatusClassification, 'classifyInvoiceStatus') as any)
      .mockResolvedValueOnce(invoiceStatusClassificationResults);

    (jest.spyOn(notificationService, 'notifyIssueResponse') as any).mockResolvedValueOnce({
      success: false,
      notificationId: null,
      error: '外部通知サービス呼び出し失敗',
    } as any);

    const result = await detectInvoiceDelayAndClassifyPriority({
      salesRepresentativeId: 'REP-001',
      targetPeriodStart: new Date('2024-01-01'),
      targetPeriodEnd: new Date('2024-12-31'),
      currentDateTime: new Date('2024-06-15T10:00:00Z'),
    });

    expect(result.notificationSent).toBe(false);
    expect(result.detectionResults).toBeDefined();
    expect(Array.isArray(result.detectionResults)).toBe(true);
    expect(result.totalUnbilledCount).toBe(1);
    expect(result.totalDelayedCount).toBe(0);
  });
});
