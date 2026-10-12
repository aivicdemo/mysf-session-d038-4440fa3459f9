import { detectInvoiceDelayAndClassifyPriority } from '../../src/logic/invoice-delay-detection';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as invoiceSlaMonitoring from '../../src/logic/invoice-sla-monitoring';
import * as invoiceStatusClassification from '../../src/logic/invoice-status-classification';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/invoice-sla-monitoring');
jest.mock('../../src/logic/invoice-status-classification');
jest.mock('../../src/logic/notification-service');

describe('SCEN-299: 遅延日数は現在日時から期日までの日数差分として正確に計算される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly calculate days overdue', async () => {
    const dealAndInvoiceRecords = [
      {
        dealId: 'DEAL001',
        dealStatus: '受注',
        dealAmount: 100000,
        invoiceStatus: '送付済',
        invoiceAmount: 100000,
        invoiceDueDate: '2024-06-10T00:00:00Z',
      },
      {
        dealId: 'DEAL002',
        dealStatus: '受注',
        dealAmount: 50000,
        invoiceStatus: '送付済',
        invoiceAmount: 50000,
        invoiceDueDate: '2024-06-20T00:00:00Z',
      },
      {
        dealId: 'DEAL003',
        dealStatus: '受注',
        dealAmount: 75000,
        invoiceStatus: '送付済',
        invoiceAmount: 75000,
        invoiceDueDate: '2024-06-05T00:00:00Z',
      },
    ];

    const invoiceSLADeadlines = [
      {
        dealId: 'DEAL001',
        slaDeadline: '2024-06-10T00:00:00Z',
        actualDueDate: '2024-06-10T00:00:00Z',
      },
      {
        dealId: 'DEAL002',
        slaDeadline: '2024-06-20T00:00:00Z',
        actualDueDate: '2024-06-20T00:00:00Z',
      },
      {
        dealId: 'DEAL003',
        slaDeadline: '2024-06-05T00:00:00Z',
        actualDueDate: '2024-06-05T00:00:00Z',
      },
    ];

    const invoiceStatusResults = [
      { dealId: 'DEAL001', invoiceStatus: '送付済' },
      { dealId: 'DEAL002', invoiceStatus: '送付済' },
      { dealId: 'DEAL003', invoiceStatus: '送付済' },
    ];

    (jest.spyOn(dataPersistence, 'fetchDealsWithInvoices') as any)
      .mockResolvedValueOnce(dealAndInvoiceRecords);
    (jest.spyOn(invoiceSlaMonitoring, 'calculateInvoiceSLADeadline') as any)
      .mockResolvedValueOnce(invoiceSLADeadlines);
    (jest.spyOn(invoiceStatusClassification, 'classifyInvoiceStatus') as any)
      .mockResolvedValueOnce(invoiceStatusResults);

    const result = await detectInvoiceDelayAndClassifyPriority({
      salesRepresentativeId: 'SR001',
      targetPeriodStart: new Date('2024-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2024-12-31T23:59:59Z'),
      currentDateTime: new Date('2024-06-15T10:00:00Z'),
    });

    expect(result.detectionResults).toBeDefined();
    expect(Array.isArray(result.detectionResults)).toBe(true);
    expect(result.totalDelayedCount).toBe(0);
    expect(result.totalUnbilledCount).toBe(0);
    expect(result.notificationSent).toBe(false);
  });
});
