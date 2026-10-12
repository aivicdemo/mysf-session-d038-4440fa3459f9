import type {
  DetectInvoiceDelayAndClassifyPriorityInput,
  DetectInvoiceDelayAndClassifyPriorityOutput,
} from '../../src/logic/invoice-delay-detection';
import { detectInvoiceDelayAndClassifyPriority } from '../../src/logic/invoice-delay-detection';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as invoiceStatusClassification from '../../src/logic/invoice-status-classification';
import * as invoiceSLAMonitoring from '../../src/logic/invoice-sla-monitoring';
import * as notificationService from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealsWithInvoices: jest.fn(),
}));

jest.mock('../../src/logic/invoice-status-classification', () => ({
  ...jest.requireActual<typeof import('../../src/logic/invoice-status-classification')>('../../src/logic/invoice-status-classification'),
  classifyInvoiceStatus: jest.fn(),
}));

jest.mock('../../src/logic/invoice-sla-monitoring', () => ({
  ...jest.requireActual<typeof import('../../src/logic/invoice-sla-monitoring')>('../../src/logic/invoice-sla-monitoring'),
  calculateInvoiceSLADeadline: jest.fn(),
}));

jest.mock('../../src/logic/notification-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/notification-service')>('../../src/logic/notification-service'),
  notifyIssueResponse: jest.fn(),
}));

describe('SCEN-285: detectInvoiceDelayAndClassifyPriority - 請求漏れ判定テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('商談ステータスが受注で請求ステータスが未作成の場合、請求漏れとして高優先度で分類する', async () => {
    const input: DetectInvoiceDelayAndClassifyPriorityInput = {
      salesRepresentativeId: 'REP-001',
      targetPeriodStart: new Date('2024-01-01'),
      targetPeriodEnd: new Date('2024-12-31'),
      currentDateTime: new Date('2024-06-15T10:00:00Z'),
    };

    const dealsWithInvoices = {
      dealsWithInvoices: [
        {
          deal: {
            dealId: 'DEAL-001',
            customerId: 'CUST-001',
            salesRepresentativeId: 'REP-001',
            dealName: 'Test Deal',
            dealAmount: 500000,
            stageId: 'STAGE-001',
            expectedContractDate: '2024-05-01',
            contractedDate: '2024-05-01',
            description: null,
            lossReason: null,
            invoiceGenerationSLADeadline: null,
            invoiceSLAExceededFlag: false,
            createdAt: '2024-05-01T00:00:00Z',
            updatedAt: '2024-05-01T00:00:00Z',
            createdBy: 'USER-001',
          },
          invoices: [],
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-06-15T10:00:00Z',
    };

    const invoiceStatusResult = {
      invoiceStatusClassifications: [
        {
          dealId: 'DEAL-001',
          status: 'unbilled',
        },
      ],
    };

    const slaDeadlineResult = {
      slaDeadlines: [
        {
          dealId: 'DEAL-001',
          deadline: new Date('2024-05-15'),
        },
      ],
    };

    const notificationResult = {
      notificationId: 'NOTIF-001',
      recipientCount: 1,
      sentChannels: ['email' as const],
      sentRecipients: [
        {
          userId: 'USER-001',
          userName: 'Rep User',
          role: 'sales_representative' as const,
          channel: 'email' as const,
          sentAt: new Date('2024-06-15T10:00:00Z'),
        },
      ],
      failedRecipients: [],
      anomalyCount: 1,
    };

    (dataPersistence.fetchDealsWithInvoices as jest.Mock).mockResolvedValue(dealsWithInvoices);
    (invoiceStatusClassification.classifyInvoiceStatus as jest.Mock).mockResolvedValue(invoiceStatusResult);
    (invoiceSLAMonitoring.calculateInvoiceSLADeadline as jest.Mock).mockResolvedValue(slaDeadlineResult);
    (notificationService.notifyIssueResponse as jest.Mock).mockResolvedValue(notificationResult);

    const result: DetectInvoiceDelayAndClassifyPriorityOutput = await detectInvoiceDelayAndClassifyPriority(input);

    expect(result.totalUnbilledCount).toBe(1);
    expect(result.totalDelayedCount).toBe(0);
    expect(result.notificationSent).toBe(true);
    expect(result.detectionResults).toHaveLength(1);

    const detectionResult = result.detectionResults[0];
    expect(detectionResult.dealId).toBe('DEAL-001');
    expect(detectionResult.issueType).toBe('unbilled');
    expect(detectionResult.priority).toBe('high');
    expect(detectionResult.daysOverdue).toBe(0);
    expect(detectionResult.amountDifference).toBe(500000);
    expect(detectionResult.recommendedAction).toBe('請求書を作成してください');

    expect(dataPersistence.fetchDealsWithInvoices).toHaveBeenCalledWith(expect.objectContaining({
      periodStartDateTime: expect.any(String),
      periodEndDateTime: expect.any(String),
      salesRepresentativeIdFilter: 'REP-001',
    }));

    expect(invoiceStatusClassification.classifyInvoiceStatus).toHaveBeenCalled();
    expect(invoiceSLAMonitoring.calculateInvoiceSLADeadline).toHaveBeenCalled();
    expect(notificationService.notifyIssueResponse).toHaveBeenCalled();
  });
});
