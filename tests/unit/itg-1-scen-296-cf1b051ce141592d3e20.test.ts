import { detectInvoiceDelayAndClassifyPriority } from '../../src/logic/invoice-delay-detection';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as invoiceSlaMonitoring from '../../src/logic/invoice-sla-monitoring';
import * as invoiceStatusClassification from '../../src/logic/invoice-status-classification';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/invoice-sla-monitoring');
jest.mock('../../src/logic/invoice-status-classification');
jest.mock('../../src/logic/notification-service');

describe('SCEN-296: 請求書期日が不正な日付形式の場合、「請求書期日の形式が正しくありません」で throw する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when invoice due date has invalid format', async () => {
    const dealAndInvoiceRecords = [
      {
        dealId: 'DEAL-001',
        dealStatus: '受注',
        dealAmount: 500000,
        invoiceId: 'INV-001',
        invoiceStatus: '作成済',
        invoiceAmount: 500000,
        invoiceDueDate: '2024/06/30',
      },
    ];

    const invoiceSLADeadlines = [
      {
        dealId: 'DEAL-001',
        slaDeadline: '2024-06-10T23:59:59Z',
        actualDueDate: '2024-06-30T23:59:59Z',
      },
    ];

    const invoiceStatusResults = [
      {
        dealId: 'DEAL-001',
        invoiceStatus: '作成済',
        classificationResult: '作成済',
      },
    ];

    (jest.spyOn(dataPersistence, 'fetchDealsWithInvoices') as any)
      .mockResolvedValueOnce(dealAndInvoiceRecords);
    (jest.spyOn(invoiceSlaMonitoring, 'calculateInvoiceSLADeadline') as any)
      .mockResolvedValueOnce(invoiceSLADeadlines);
    (jest.spyOn(invoiceStatusClassification, 'classifyInvoiceStatus') as any)
      .mockResolvedValueOnce(invoiceStatusResults);

    await expect(
      detectInvoiceDelayAndClassifyPriority({
        salesRepresentativeId: 'REP-001',
        targetPeriodStart: new Date('2024-01-01T00:00:00Z'),
        targetPeriodEnd: new Date('2024-12-31T23:59:59Z'),
        currentDateTime: new Date('2024-06-15T10:00:00Z'),
      })
    ).rejects.toThrow('請求書期日の形式が正しくありません');
  });
});
