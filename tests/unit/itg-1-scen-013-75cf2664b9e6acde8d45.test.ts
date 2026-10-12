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

describe('SCEN-013: executionTimestampがISO 8601形式でない場合の処理の振る舞い', () => {
  const mockEnforceAccessControl = logic.enforceAccessControlForDataDisplay as jest.Mock;
  const mockFetchDealsForPeriod = dataPersistence.fetchDealsForPeriod as jest.Mock;
  const mockDetectDataflowAnomalies = anomalyDetection.detectDataflowAnomalies as jest.Mock;
  const mockReconcileDealAndInvoice = dealReconciliation.reconcileDealAndInvoice as jest.Mock;
  const mockDetectInvoiceDelayAndClassifyPriority = invoiceDelay.detectInvoiceDelayAndClassifyPriority as jest.Mock;
  const mockClassifyAndRespondToIssue = issueResponse.classifyAndRespondToIssue as jest.Mock;
  const mockModifyInvoice = invoiceGeneration.modifyInvoice as jest.Mock;
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
      ],
      totalCount: 1,
      fetchedAt: '2024-02-01T15:35:00Z',
    });

    mockDetectDataflowAnomalies.mockResolvedValue({
      anomalyDetectionLogIds: ['detected-001'],
      totalAnomaliesDetected: 1,
      anomalySummaryByType: { amount_mismatch: 1 },
      detectionCompletedAt: new Date('2024-02-01T15:35:00Z'),
    });

    mockReconcileDealAndInvoice.mockResolvedValue({
      dealId: 'deal-001',
      reconciliationStatus: 'amount_discrepancy',
      dealAmount: 100000,
      totalInvoiceAmount: 95000,
      amountDiscrepancy: 5000,
      invoiceCount: 1,
      invoices: [{ invoiceId: 'inv-001', invoiceAmount: 95000, invoiceStatus: 'issued', lineItemCount: 1 }],
      detectedIssues: [{ issueType: 'amount_mismatch', description: 'Amount mismatch', severity: 'error' }],
      validationTimestamp: new Date(),
    });

    mockDetectInvoiceDelayAndClassifyPriority.mockResolvedValue({
      detectionResults: [],
      totalUnbilledCount: 0,
      totalDelayedCount: 0,
      notificationSent: false,
    });

    mockClassifyAndRespondToIssue.mockResolvedValue({
      issueRootCause: 'data_mismatch',
      responseAction: 'modify_invoice',
      responseActionDescription: 'Modify invoice',
      requiredSteps: ['step1'],
      estimatedResolutionDateTime: '2024-02-01T16:35:00Z',
      notificationContent: {
        recipientUserId: 'sales-rep-001',
        notificationChannel: 'email',
        subject: 'Invoice modified',
        message: 'Your invoice has been modified',
      },
      responseDecisionDateTime: '2024-02-01T15:35:00Z',
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
      modifiedAt: new Date('2024-02-01T15:35:00Z'),
    });

    mockRecordAnomalyDetection.mockResolvedValue({
      anomalyDetectionLogId: 'log-001',
      recordedAt: new Date('2024-02-01T15:35:00Z'),
      status: 'recorded',
    });

    mockNotifyIssueResponse.mockResolvedValue({
      notificationId: 'notif-001',
      recipientCount: 1,
      sentChannels: ['email'],
      sentRecipients: [
        {
          userId: 'sales-rep-001',
          userName: 'Sales Rep 1',
          role: 'sales_representative',
          channel: 'email',
          sentAt: new Date('2024-02-01T15:35:30Z'),
        },
      ],
      failedChannels: [],
      responseNotificationId: 'resp-notif-001',
    });
  });

  it('should throw validation error when executionTimestamp is not in ISO 8601 format', async () => {
    const input = {
      executorUserId: 'user-123',
      targetPeriod: { startDate: '2024-01-01', endDate: '2024-01-31' },
      executionTimestamp: 'invalid-timestamp',
    };

    await expect(runTx2Imp1Agent(input, mockAiClient)).rejects.toThrow();
  });
});
