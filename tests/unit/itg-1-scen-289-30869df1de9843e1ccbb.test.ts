import { detectInvoiceDelayAndClassifyPriority } from '../../src/logic/invoice-delay-detection';
import * as dataPersistenceModule from '../../src/logic/data-persistence';
import * as invoiceSLAModule from '../../src/logic/invoice-sla-monitoring';
import * as invoiceStatusModule from '../../src/logic/invoice-status-classification';
import * as notificationModule from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({ ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'), fetchDealsWithInvoices: jest.fn() }));
jest.mock('../../src/logic/invoice-sla-monitoring', () => ({ ...jest.requireActual<typeof import('../../src/logic/invoice-sla-monitoring')>('../../src/logic/invoice-sla-monitoring'), calculateInvoiceSLADeadline: jest.fn() }));
jest.mock('../../src/logic/invoice-status-classification', () => ({ ...jest.requireActual<typeof import('../../src/logic/invoice-status-classification')>('../../src/logic/invoice-status-classification'), classifyInvoiceStatus: jest.fn() }));
jest.mock('../../src/logic/notification-service', () => ({ ...jest.requireActual<typeof import('../../src/logic/notification-service')>('../../src/logic/notification-service'), notifyIssueResponse: jest.fn() }));

describe('SCEN-289: 問題が検出されない場合、issueType を「なし」で低優先度とする', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('問題なしを低優先度で分類し、出力を検証する', async () => {
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
        dealStatus: '失注',
        dealAmount: 500000,
        invoiceId: 'INV-001',
        invoiceStatus: '未作成',
        invoiceAmount: 0,
        invoiceDueDate: '2024-06-10',
      },
      {
        dealId: 'DEAL-002',
        dealName: 'Deal 002',
        customerId: 'CUST-002',
        customerName: 'Customer 002',
        dealStatus: '受注',
        dealAmount: 300000,
        invoiceId: 'INV-002',
        invoiceStatus: '送付済',
        invoiceAmount: 300000,
        invoiceDueDate: '2024-06-20',
      },
    ];

    mockFetchDealsWithInvoices.mockResolvedValue(dealsWithInvoices);

    mockCalculateInvoiceSLADeadline.mockResolvedValue([
      {
        dealId: 'DEAL-001',
        slaDeadline: '2024-01-10',
        actualInvoiceDeadline: '2024-06-10',
      },
      {
        dealId: 'DEAL-002',
        slaDeadline: '2024-01-15',
        actualInvoiceDeadline: '2024-06-20',
      },
    ]);

    mockClassifyInvoiceStatus.mockResolvedValue([
      {
        dealId: 'DEAL-001',
        invoiceStatus: '未作成',
        classification: '未請求',
      },
      {
        dealId: 'DEAL-002',
        invoiceStatus: '送付済',
        classification: '請求済',
      },
    ]);

    mockNotifyIssueResponse.mockResolvedValue({
      notificationSent: true,
      notificationId: 'NOTIF-001',
      timestamp: '2024-06-15T10:00:00Z',
    });

    const result = await detectInvoiceDelayAndClassifyPriority({
      salesRepresentativeId: 'REP-001',
      targetPeriodStart: new Date('2024-01-01'),
      targetPeriodEnd: new Date('2024-12-31'),
      currentDateTime: new Date('2024-06-15T10:00:00Z'),
    });

    expect(result.detectionResults).toHaveLength(2);
    // Detections should include both deals
    const dealIds = result.detectionResults.map(r => r.dealId);
    expect(dealIds).toContain('DEAL-001');
    expect(dealIds).toContain('DEAL-002');

    expect(result.totalUnbilledCount).toBe(1);
    expect(result.totalDelayedCount).toBe(0);
    expect(result.notificationSent).toBe(true);
  });
});
