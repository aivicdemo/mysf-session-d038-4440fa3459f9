import { detectInvoiceDelayAndClassifyPriority } from '../../src/logic/invoice-delay-detection';
import * as dataPersistenceModule from '../../src/logic/data-persistence';
import * as invoiceSLAModule from '../../src/logic/invoice-sla-monitoring';
import * as invoiceStatusModule from '../../src/logic/invoice-status-classification';
import * as notificationModule from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({ ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'), fetchDealsWithInvoices: jest.fn() }));
jest.mock('../../src/logic/invoice-sla-monitoring', () => ({ ...jest.requireActual<typeof import('../../src/logic/invoice-sla-monitoring')>('../../src/logic/invoice-sla-monitoring'), calculateInvoiceSLADeadline: jest.fn() }));
jest.mock('../../src/logic/invoice-status-classification', () => ({ ...jest.requireActual<typeof import('../../src/logic/invoice-status-classification')>('../../src/logic/invoice-status-classification'), classifyInvoiceStatus: jest.fn() }));
jest.mock('../../src/logic/notification-service', () => ({ ...jest.requireActual<typeof import('../../src/logic/notification-service')>('../../src/logic/notification-service'), notifyIssueResponse: jest.fn() }));

describe('SCEN-288: 複数の問題がある場合、請求漏れ > 金額ズレ > 遅延の順で優先度を決定する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数の問題を優先度順にソートして返す', async () => {
    const mockFetchDealsWithInvoices = dataPersistenceModule.fetchDealsWithInvoices as jest.MockedFunction<any>;
    const mockCalculateInvoiceSLADeadline = invoiceSLAModule.calculateInvoiceSLADeadline as jest.MockedFunction<any>;
    const mockClassifyInvoiceStatus = invoiceStatusModule.classifyInvoiceStatus as jest.MockedFunction<any>;
    const mockNotifyIssueResponse = notificationModule.notifyIssueResponse as jest.MockedFunction<any>;

    const dealsWithInvoices = [
      {
        dealId: 'deal-001',
        dealName: 'Deal 001',
        customerId: 'CUST-001',
        customerName: 'Customer 001',
        dealStatus: '受注',
        dealAmount: 100000,
        invoiceId: 'inv-001',
        invoiceStatus: '未作成',
        invoiceAmount: 0,
        invoiceDueDate: '2024-11-10',
      },
      {
        dealId: 'deal-002',
        dealName: 'Deal 002',
        customerId: 'CUST-002',
        customerName: 'Customer 002',
        dealStatus: '受注',
        dealAmount: 50000,
        invoiceId: 'inv-002',
        invoiceStatus: '作成済',
        invoiceAmount: 48000,
        invoiceDueDate: '2024-11-05',
      },
      {
        dealId: 'deal-003',
        dealName: 'Deal 003',
        customerId: 'CUST-003',
        customerName: 'Customer 003',
        dealStatus: '受注',
        dealAmount: 200000,
        invoiceId: 'inv-003',
        invoiceStatus: '送付済',
        invoiceAmount: 195000,
        invoiceDueDate: '2024-11-01',
      },
    ];

    mockFetchDealsWithInvoices.mockResolvedValue(dealsWithInvoices);

    mockCalculateInvoiceSLADeadline.mockResolvedValue([
      {
        dealId: 'deal-001',
        slaDeadline: '2024-11-05',
        actualDeadline: '2024-11-10',
      },
      {
        dealId: 'deal-002',
        slaDeadline: '2024-11-03',
        actualDeadline: '2024-11-05',
      },
      {
        dealId: 'deal-003',
        slaDeadline: '2024-10-28',
        actualDeadline: '2024-11-01',
      },
    ]);

    mockClassifyInvoiceStatus.mockResolvedValue([
      {
        dealId: 'deal-001',
        classifiedStatus: '未請求',
      },
      {
        dealId: 'deal-002',
        classifiedStatus: '部分請求',
      },
      {
        dealId: 'deal-003',
        classifiedStatus: '部分請求',
      },
    ]);

    mockNotifyIssueResponse.mockResolvedValue({
      notificationId: 'notif-batch-001',
      status: 'sent',
      recipientCount: 1,
      timestamp: '2024-11-15T10:00:30Z',
    });

    const result = await detectInvoiceDelayAndClassifyPriority({
      salesRepresentativeId: 'rep-001',
      targetPeriodStart: new Date('2024-01-01'),
      targetPeriodEnd: new Date('2024-12-31'),
      currentDateTime: new Date('2024-11-15T10:00:00Z'),
    });

    expect(result.detectionResults).toHaveLength(3);
    // deal-001 should be first (unbilled)
    expect(result.detectionResults[0].dealId).toBe('deal-001');
    expect(result.detectionResults[0].issueType).toBe('unbilled');
    expect(result.detectionResults[0].priority).toBe('high');
    // deal-002 should be second (partiallyBilled)
    expect(result.detectionResults[1].dealId).toBe('deal-002');
    expect(result.detectionResults[1].issueType).toBe('partiallyBilled');
    expect(result.detectionResults[1].priority).toBe('high');
    // deal-003 should be third (partiallyBilled, sent status so no delay)
    expect(result.detectionResults[2].dealId).toBe('deal-003');
    expect(result.detectionResults[2].issueType).toBe('partiallyBilled');
    expect(result.detectionResults[2].priority).toBe('high');

    expect(result.totalUnbilledCount).toBe(1);
    expect(result.totalDelayedCount).toBe(0);
    expect(result.notificationSent).toBe(true);
  });
});
