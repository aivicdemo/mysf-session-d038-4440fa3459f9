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

describe('SCEN-014: executorUserIdが空文字列で指定された場合、アクセス権検証で拒否される', () => {
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
      accessGranted: false,
      visibleDataScope: {},
      fieldMaskingRules: [],
      operationPermissions: [],
      denialReason: 'executorUserIdが空文字列のため、ユーザー識別ができず権限検証に失敗',
    });

    mockFetchDealsForPeriod.mockResolvedValue({
      deals: [],
      totalCount: 0,
      fetchedAt: '2026-01-15T10:30:00Z',
    });

    mockDetectDataflowAnomalies.mockResolvedValue({
      anomalyDetectionLogIds: [],
      totalAnomaliesDetected: 0,
      anomalySummaryByType: {},
      detectionCompletedAt: new Date('2026-01-15T10:30:00Z'),
    });

    mockReconcileDealAndInvoice.mockResolvedValue({
      dealId: '',
      reconciliationStatus: 'success',
      dealAmount: 0,
      totalInvoiceAmount: 0,
      amountDiscrepancy: null,
      invoiceCount: 0,
      invoices: [],
      detectedIssues: [],
      validationTimestamp: new Date(),
    });

    mockDetectInvoiceDelayAndClassifyPriority.mockResolvedValue({
      detectionResults: [],
      totalUnbilledCount: 0,
      totalDelayedCount: 0,
      notificationSent: false,
    });

    mockClassifyAndRespondToIssue.mockResolvedValue({
      issueRootCause: '',
      responseAction: '',
      responseActionDescription: '',
      requiredSteps: [],
      estimatedResolutionDateTime: '',
      notificationContent: {
        recipientUserId: '',
        notificationChannel: '',
        subject: '',
        message: '',
      },
      responseDecisionDateTime: '',
    });

    mockModifyInvoice.mockResolvedValue({
      invoiceId: '',
      invoiceNumber: '',
      invoiceAmount: 0,
      taxAmount: 0,
      untaxedAmount: 0,
      modifiedLineItemIds: [],
      invoiceStatus: '',
      modificationRecordId: '',
      modifiedAt: new Date(),
    });

    mockRecordAnomalyDetection.mockResolvedValue({
      anomalyDetectionLogId: '',
      recordedAt: new Date(),
      status: '',
    });

    mockNotifyIssueResponse.mockResolvedValue({
      notificationId: '',
      recipientCount: 0,
      sentChannels: [],
      sentRecipients: [],
      failedChannels: [],
      responseNotificationId: '',
    });
  });

  it('should throw error when executorUserId is empty string', async () => {
    const input = {
      executorUserId: '',
      targetPeriod: { startDate: '2026-01-01', endDate: '2026-01-31' },
      executionTimestamp: '2026-01-15T10:30:00Z',
    };

    await expect(runTx2Imp1Agent(input, mockAiClient)).rejects.toThrow();
  });

  it('should throw error with message mentioning access denial', async () => {
    const input = {
      executorUserId: '',
      targetPeriod: { startDate: '2026-01-01', endDate: '2026-01-31' },
      executionTimestamp: '2026-01-15T10:30:00Z',
    };

    await expect(runTx2Imp1Agent(input, mockAiClient)).rejects.toThrow(
      /アクセス権|拒否|権限/
    );
  });
});
