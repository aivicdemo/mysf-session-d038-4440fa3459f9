import { detectInvoiceDelayAndClassifyPriority } from '../../src/logic/invoice-delay-detection';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as invoiceSlaMonitoring from '../../src/logic/invoice-sla-monitoring';
import * as invoiceStatusClassification from '../../src/logic/invoice-status-classification';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/invoice-sla-monitoring');
jest.mock('../../src/logic/invoice-status-classification');
jest.mock('../../src/logic/notification-service');

describe('SCEN-297: 商談ステータスが未定義の場合、「商談ステータスが設定されていません」で warn する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should warn when deal status is undefined', async () => {
    const dealAndInvoiceRecords = [
      {
        dealStatus: null,
        invoiceStatus: '未作成',
        invoiceAmount: 0,
        dealAmount: 500000,
        invoiceDueDate: '2024-06-30',
      },
    ];

    const invoiceSLADeadlines = [
      {
        deadline: '2024-06-30T23:59:59Z',
      },
    ];

    const invoiceStatusResults = [
      {
        status: '未請求',
      },
    ];

    (jest.spyOn(dataPersistence, 'fetchDealsWithInvoices') as any)
      .mockResolvedValueOnce(dealAndInvoiceRecords);
    (jest.spyOn(invoiceSlaMonitoring, 'calculateInvoiceSLADeadline') as any)
      .mockResolvedValueOnce(invoiceSLADeadlines);
    (jest.spyOn(invoiceStatusClassification, 'classifyInvoiceStatus') as any)
      .mockResolvedValueOnce(invoiceStatusResults);

    const result = await detectInvoiceDelayAndClassifyPriority({
      salesRepresentativeId: 'REP-001',
      targetPeriodStart: new Date('2024-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2024-12-31T23:59:59Z'),
      currentDateTime: new Date('2024-06-15T10:00:00Z'),
    });

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('商談ステータスが設定されていません')
    );
    expect(result.detectionResults).toBeDefined();
    expect(Array.isArray(result.detectionResults)).toBe(true);
    expect(result.notificationSent).toEqual(expect.any(Boolean));
  });
});
