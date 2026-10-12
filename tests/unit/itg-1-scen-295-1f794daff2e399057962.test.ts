import { detectInvoiceDelayAndClassifyPriority } from '../../src/logic/invoice-delay-detection';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as invoiceSlaMonitoring from '../../src/logic/invoice-sla-monitoring';
import * as invoiceStatusClassification from '../../src/logic/invoice-status-classification';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/invoice-sla-monitoring');
jest.mock('../../src/logic/invoice-status-classification');
jest.mock('../../src/logic/notification-service');

describe('SCEN-295: 商談金額が0以下の場合、「商談金額が不正です。確認してください」で throw する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when deal amount is negative', async () => {
    const dealWithInvoices = [
      {
        dealId: 'DEAL-001',
        dealAmount: -5000,
        dealStatus: '受注',
        dealDate: '2024-05-01',
        invoiceId: 'INV-001',
        invoiceStatus: '未作成',
        invoiceAmount: 0,
        invoiceDueDate: '2024-06-01',
      },
    ];

    const invoiceSLADeadlines = [
      {
        dealId: 'DEAL-001',
        slaDeadline: '2024-05-08',
        invoiceDueDate: '2024-06-01',
      },
    ];

    const invoiceStatusResults = [
      {
        dealId: 'DEAL-001',
        classificationStatus: '未請求',
        isValid: true,
      },
    ];

    (jest.spyOn(dataPersistence, 'fetchDealsWithInvoices') as any)
      .mockResolvedValueOnce(dealWithInvoices);
    (jest.spyOn(invoiceSlaMonitoring, 'calculateInvoiceSLADeadline') as any)
      .mockResolvedValueOnce(invoiceSLADeadlines);
    (jest.spyOn(invoiceStatusClassification, 'classifyInvoiceStatus') as any)
      .mockResolvedValueOnce(invoiceStatusResults);

    await expect(
      detectInvoiceDelayAndClassifyPriority({
        salesRepresentativeId: 'REP-001',
        targetPeriodStart: new Date('2024-01-01'),
        targetPeriodEnd: new Date('2024-12-31'),
        currentDateTime: new Date('2024-06-15T10:00:00Z'),
      })
    ).rejects.toThrow('商談金額が不正です。確認してください');
  });
});
