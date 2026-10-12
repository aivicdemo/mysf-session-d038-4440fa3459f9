import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import type { Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';
import * as logic from '../../src/logic/access-control-enforcement';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as anomalyDetection from '../../src/logic/dataflow-anomaly-detection';
import * as dealReconciliation from '../../src/logic/deal-invoice-reconciliation';
import * as invoiceDelay from '../../src/logic/invoice-delay-detection';
import * as issueResponse from '../../src/logic/issue-response-management';
import * as invoiceGeneration from '../../src/logic/invoice-generation-management';
import * as anomalyLogging from '../../src/logic/anomaly-detection-logging';
import * as notification from '../../src/logic/notification-service';

jest.mock('../../src/logic/access-control-enforcement');
jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/dataflow-anomaly-detection');
jest.mock('../../src/logic/deal-invoice-reconciliation');
jest.mock('../../src/logic/invoice-delay-detection');
jest.mock('../../src/logic/issue-response-management');
jest.mock('../../src/logic/invoice-generation-management');
jest.mock('../../src/logic/anomaly-detection-logging');
jest.mock('../../src/logic/notification-service');

describe('SCEN-012: 異常検知ログの記録に成功した場合、detectionLogIdsに記録されたログIDが出力される', () => {
  const mockEnforceAccessControl = logic.enforceAccessControlForDataDisplay as jest.Mock;
  const mockFetchDealsForPeriod = dataPersistence.fetchDealsForPeriod as jest.Mock;
  const mockDetectDataflowAnomalies = anomalyDetection.detectDataflowAnomalies as jest.Mock;
  const mockReconcileDealAndInvoice = dealReconciliation.reconcileDealAndInvoice as jest.Mock;
  const mockDetectInvoiceDelayAndClassifyPriority = invoiceDelay.detectInvoiceDelayAndClassifyPriority as jest.Mock;
  const mockClassifyAndRespondToIssue = issueResponse.classifyAndRespondToIssue as jest.Mock;
  const mockModifyInvoice = invoiceGeneration.modifyInvoice as jest.Mock;
  const mockReissueInvoice = invoiceGeneration.reissueInvoice as jest.Mock;
  const mockRecordAnomalyDetection = anomalyLogging.recordAnomalyDetection as jest.Mock;
  const mockNotifyIssueResponse = notification.notifyIssueResponse as jest.Mock;

  const mockAiClient: Tx2Imp1AiClient = {};

  beforeEach(() => {
    jest.clearAllMocks();

    mockEnforceAccessControl.mockResolvedValue({
      accessGranted: true,
      visibleDataScope: {},
      fieldMaskingRules: [],
      operationPermissions: [],
    });

    mockFetchDealsForPeriod.mockResolvedValue({
      deals: [
        { dealId: 'deal-001', dealAmount: 100000, stageId: 'closed_won', contractedDate: '2024-01-15' },
        { dealId: 'deal-002', dealAmount: 50000, stageId: 'closed_won', contractedDate: '2024-01-20' },
      ],
      totalCount: 2,
      fetchedAt: '2024-02-01T10:00:00Z',
    });

    mockDetectDataflowAnomalies.mockResolvedValue({
      anomalyDetectionLogIds: ['detected-001', 'detected-002'],
      totalAnomaliesDetected: 2,
      anomalySummaryByType: { amount_mismatch: 1, missing_invoice: 1 },
      detectionCompletedAt: new Date('2024-02-01T10:00:00Z'),
    });

    mockReconcileDealAndInvoice.mockImplementation(async (input: any) => {
      if (input.dealId === 'deal-001') {
        return {
          dealId: 'deal-001',
          reconciliationStatus: 'amount_discrepancy',
          dealAmount: 100000,
          totalInvoiceAmount: 95000,
          amountDiscrepancy: 5000,
          invoiceCount: 1,
          invoices: [{ invoiceId: 'inv-001', invoiceAmount: 95000, invoiceStatus: 'issued', lineItemCount: 1 }],
          detectedIssues: [{ issueType: 'amount_mismatch', description: 'Amount mismatch', severity: 'error' }],
          validationTimestamp: new Date(),
        };
      } else if (input.dealId === 'deal-002') {
        return {
          dealId: 'deal-002',
          reconciliationStatus: 'unbilled',
          dealAmount: 50000,
          totalInvoiceAmount: 0,
          amountDiscrepancy: null,
          invoiceCount: 0,
          invoices: [],
          detectedIssues: [{ issueType: 'missing_invoice', description: 'Missing invoice', severity: 'error' }],
          validationTimestamp: new Date(),
        };
      }
      return {};
    });

    mockDetectInvoiceDelayAndClassifyPriority.mockResolvedValue({
      detectionResults: [
        {
          dealId: 'deal-002',
          dealName: 'Deal 2',
          customerId: 'cust-002',
          customerName: 'Customer 2',
          dealAmount: 50000,
          dealStatus: 'closed_won',
          invoiceStatus: 'not_issued',
          issueType: 'unbilled',
          priority: 'high',
          daysOverdue: 12,
          expectedInvoiceDate: new Date('2024-01-20'),
          detectionReason: 'Invoice not issued',
        },
      ],
      totalUnbilledCount: 1,
      totalDelayedCount: 0,
      notificationSent: false,
    });

    mockClassifyAndRespondToIssue.mockResolvedValue({
      issueRootCause: 'data_mismatch',
      responseAction: 'modify_invoice',
      responseActionDescription: 'Modify invoice',
      requiredSteps: ['step1'],
      estimatedResolutionDateTime: '2024-02-01T11:00:00Z',
      notificationContent: {
        recipientUserId: 'sales-user-001',
        notificationChannel: 'email',
        subject: 'Invoice modified',
        message: 'Your invoice has been modified',
      },
      responseDecisionDateTime: '2024-02-01T10:05:00Z',
    });

    mockModifyInvoice.mockResolvedValue({
      invoiceId: 'inv-001',
      invoiceNumber: 'INV-001',
      invoiceAmount: 100000,
      taxAmount: 10000,
      untaxedAmount: 90000,
      modifiedLineItemIds: ['line-001'],
      invoiceStatus: 'modified',
      modificationRecordId: 'mod-001',
      modifiedAt: new Date('2024-02-01T10:05:00Z'),
    });

    mockReissueInvoice.mockResolvedValue({
      invoiceId: 'inv-002',
      invoiceNumber: 'INV-002',
      reissueCount: 1,
      lastReissuedAt: new Date('2024-02-01T10:06:00Z'),
      modificationRecordId: 'mod-002',
      invoiceStatus: 'issued',
    });

    mockRecordAnomalyDetection.mockResolvedValueOnce({
      anomalyDetectionLogId: 'log-2024-0001',
      recordedAt: new Date('2024-02-01T10:05:30Z'),
      status: 'recorded',
    }).mockResolvedValueOnce({
      anomalyDetectionLogId: 'log-2024-0002',
      recordedAt: new Date('2024-02-01T10:06:15Z'),
      status: 'recorded',
    });

    mockNotifyIssueResponse.mockResolvedValueOnce({
      notificationId: 'notif-001',
      recipientCount: 1,
      sentChannels: ['email'],
      sentRecipients: [
        {
          userId: 'sales-user-001',
          userName: 'Sales Rep 1',
          role: 'sales_representative',
          channel: 'email',
          sentAt: new Date('2024-02-01T10:07:00Z'),
        },
      ],
      failedChannels: [],
      responseNotificationId: 'resp-notif-001',
    }).mockResolvedValueOnce({
      notificationId: 'notif-002',
      recipientCount: 1,
      sentChannels: ['email'],
      sentRecipients: [
        {
          userId: 'sales-user-002',
          userName: 'Sales Rep 2',
          role: 'sales_representative',
          channel: 'email',
          sentAt: new Date('2024-02-01T10:07:30Z'),
        },
      ],
      failedChannels: [],
      responseNotificationId: 'resp-notif-002',
    });
  });

  it('should return success status with logged anomaly IDs when all operations succeed', async () => {
    const input = {
      executorUserId: 'user-001',
      targetPeriod: { startDate: '2024-01-01', endDate: '2024-01-31' },
      executionTimestamp: '2024-02-01T10:00:00Z',
    };

    const result = await runTx2Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('success');
    expect(result.anomaliesDetected).toBe(2);
    expect(result.anomaliesResolved).toBe(2);
    expect(result.notificationsDelivered).toBe(2);
    expect(result.detectionLogIds).toEqual(['log-2024-0001', 'log-2024-0002']);
    expect(result.executionSummary).toContain('実行成功');
  });
});
