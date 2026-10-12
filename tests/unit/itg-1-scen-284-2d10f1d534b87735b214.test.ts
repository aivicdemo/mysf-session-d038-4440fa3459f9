import { detectInvoiceDelayAndClassifyPriority, NoDealsFoundForRepresentative, InvoiceStatusClassificationFailed, SLACalculationFailed } from '../../src/logic/invoice-delay-detection';
import * as dataPersistenceModule from '../../src/logic/data-persistence';
import * as invoiceSLAModule from '../../src/logic/invoice-sla-monitoring';
import * as invoiceStatusModule from '../../src/logic/invoice-status-classification';
import * as notificationModule from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({ ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'), fetchDealsWithInvoices: jest.fn() }));
jest.mock('../../src/logic/invoice-sla-monitoring', () => ({ ...jest.requireActual<typeof import('../../src/logic/invoice-sla-monitoring')>('../../src/logic/invoice-sla-monitoring'), calculateInvoiceSLADeadline: jest.fn() }));
jest.mock('../../src/logic/invoice-status-classification', () => ({ ...jest.requireActual<typeof import('../../src/logic/invoice-status-classification')>('../../src/logic/invoice-status-classification'), classifyInvoiceStatus: jest.fn() }));
jest.mock('../../src/logic/notification-service', () => ({ ...jest.requireActual<typeof import('../../src/logic/notification-service')>('../../src/logic/notification-service'), notifyIssueResponse: jest.fn() }));

describe('SCEN-284: 対象期間内の商談が存在し、すべての依存処理が成功した場合、検出結果を優先度順にソートして返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('検出結果を優先度順にソートして返す', async () => {
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
        dealAmount: 100000,
        dealCreatedDate: '2024-01-15',
        invoiceId: 'INV-001',
        invoiceStatus: '未作成',
        invoiceAmount: 0,
        invoiceDueDate: '2024-02-15',
      },
      {
        dealId: 'DEAL-002',
        dealName: 'Deal 002',
        customerId: 'CUST-002',
        customerName: 'Customer 002',
        dealStatus: '受注',
        dealAmount: 50000,
        dealCreatedDate: '2024-01-20',
        invoiceId: 'INV-002',
        invoiceStatus: '作成済',
        invoiceAmount: 48000,
        invoiceDueDate: '2024-02-05',
      },
      {
        dealId: 'DEAL-003',
        dealName: 'Deal 003',
        customerId: 'CUST-003',
        customerName: 'Customer 003',
        dealStatus: '受注',
        dealAmount: 75000,
        dealCreatedDate: '2024-01-10',
        invoiceId: 'INV-003',
        invoiceStatus: '送付済',
        invoiceAmount: 75000,
        invoiceDueDate: '2024-02-01',
      },
    ];

    mockFetchDealsWithInvoices.mockResolvedValue(dealsWithInvoices);

    mockClassifyInvoiceStatus.mockResolvedValue([
      { dealId: 'DEAL-001', invoiceStatus: '未請求' },
      { dealId: 'DEAL-002', invoiceStatus: '部分請求' },
      { dealId: 'DEAL-003', invoiceStatus: '請求済' },
    ]);

    mockCalculateInvoiceSLADeadline.mockResolvedValue([
      { dealId: 'DEAL-001', slaDeadline: '2024-01-22', isDelay: true },
      { dealId: 'DEAL-002', slaDeadline: '2024-01-27', isDelay: true },
      { dealId: 'DEAL-003', slaDeadline: '2024-01-17', isDelay: false },
    ]);

    mockNotifyIssueResponse.mockResolvedValue({
      success: true,
      notificationId: 'NOTIF-12345',
      sentAt: '2024-02-10T10:00:30Z',
    });

    const result = await detectInvoiceDelayAndClassifyPriority({
      salesRepresentativeId: 'SR-001',
      targetPeriodStart: new Date('2024-01-01'),
      targetPeriodEnd: new Date('2024-01-31'),
      currentDateTime: new Date('2024-02-10T10:00:00Z'),
    });

    expect(result.detectionResults).toHaveLength(3);
    expect(result.detectionResults[0].dealId).toBe('DEAL-001');
    expect(result.detectionResults[1].dealId).toBe('DEAL-002');
    expect(result.detectionResults[2].dealId).toBe('DEAL-003');
    expect(result.totalUnbilledCount).toBe(1);
    expect(result.totalDelayedCount).toBe(2);
    expect(result.notificationSent).toBe(true);
  });
});
