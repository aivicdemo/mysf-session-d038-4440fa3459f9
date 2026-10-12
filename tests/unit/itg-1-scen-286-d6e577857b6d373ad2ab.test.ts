import { detectInvoiceDelayAndClassifyPriority } from '../../src/logic/invoice-delay-detection';
import * as dataPersistenceModule from '../../src/logic/data-persistence';
import * as invoiceSLAModule from '../../src/logic/invoice-sla-monitoring';
import * as invoiceStatusModule from '../../src/logic/invoice-status-classification';
import * as notificationModule from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({ ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'), fetchDealsWithInvoices: jest.fn() }));
jest.mock('../../src/logic/invoice-sla-monitoring', () => ({ ...jest.requireActual<typeof import('../../src/logic/invoice-sla-monitoring')>('../../src/logic/invoice-sla-monitoring'), calculateInvoiceSLADeadline: jest.fn() }));
jest.mock('../../src/logic/invoice-status-classification', () => ({ ...jest.requireActual<typeof import('../../src/logic/invoice-status-classification')>('../../src/logic/invoice-status-classification'), classifyInvoiceStatus: jest.fn() }));
jest.mock('../../src/logic/notification-service', () => ({ ...jest.requireActual<typeof import('../../src/logic/notification-service')>('../../src/logic/notification-service'), notifyIssueResponse: jest.fn() }));

describe('SCEN-286: 請求書ステータスが作成済で商談金額と請求金額の差分が1000円以上の場合、金額ズレとして高優先度で分類する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('金額ズレを高優先度で分類し、出力を検証する', async () => {
    const mockFetchDealsWithInvoices = dataPersistenceModule.fetchDealsWithInvoices as jest.MockedFunction<any>;
    const mockCalculateInvoiceSLADeadline = invoiceSLAModule.calculateInvoiceSLADeadline as jest.MockedFunction<any>;
    const mockClassifyInvoiceStatus = invoiceStatusModule.classifyInvoiceStatus as jest.MockedFunction<any>;
    const mockNotifyIssueResponse = notificationModule.notifyIssueResponse as jest.MockedFunction<any>;

    const dealsWithInvoices = [
      {
        dealId: 'DEAL-001',
        dealName: 'Deal 001',
        customerId: 'CUST-001',
        customerName: 'Customer 001',
        dealStatus: '受注',
        dealAmount: 150000,
        dealClosedDate: '2024-06-01',
        invoiceId: 'INV-001',
        invoiceStatus: '作成済',
        invoiceAmount: 148500,
        invoiceDueDate: '2024-07-01',
      },
    ];

    mockFetchDealsWithInvoices.mockResolvedValue(dealsWithInvoices);

    mockCalculateInvoiceSLADeadline.mockResolvedValue([
      {
        dealId: 'DEAL-001',
        invoiceId: 'INV-001',
        slaDeadline: '2024-06-10',
        dueDate: '2024-07-01',
      },
    ]);

    mockClassifyInvoiceStatus.mockResolvedValue([
      {
        dealId: 'DEAL-001',
        invoiceId: 'INV-001',
        classifiedStatus: '作成済',
      },
    ]);

    mockNotifyIssueResponse.mockResolvedValue({
      success: true,
      notificationId: 'NOTIF-12345',
      sentAt: '2024-06-15T10:00:30Z',
    });

    const result = await detectInvoiceDelayAndClassifyPriority({
      salesRepresentativeId: 'REP-001',
      targetPeriodStart: new Date('2024-01-01'),
      targetPeriodEnd: new Date('2024-12-31'),
      currentDateTime: new Date('2024-06-15T10:00:00Z'),
    });

    expect(result.detectionResults).toHaveLength(1);
    expect(result.detectionResults[0].issueType).toBe('partiallyBilled');
    expect(result.detectionResults[0].priority).toBe('high');
    expect(result.detectionResults[0].dealId).toBe('DEAL-001');
    expect(result.totalUnbilledCount).toBe(0);
    expect(result.totalDelayedCount).toBe(0);
    expect(result.notificationSent).toBe(true);
  });
});
