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

describe('SCEN-011: すべての修正・再発行・通知に失敗した場合、failedステータスが出力される', () => {
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
        { dealId: 'deal-001', dealAmount: 100000, stageId: 'closed_won', contractedDate: '2025-01-15' },
        { dealId: 'deal-002', dealAmount: 250000, stageId: 'closed_won', contractedDate: '2025-01-20' },
        { dealId: 'deal-003', dealAmount: 150000, stageId: 'closed_won', contractedDate: '2025-01-25' },
      ],
      totalCount: 3,
      fetchedAt: '2025-02-01T10:00:00Z',
    });

    mockDetectDataflowAnomalies.mockResolvedValue({
      anomalyDetectionLogIds: ['log-001', 'log-002', 'log-003'],
      totalAnomaliesDetected: 3,
      anomalySummaryByType: { amount_mismatch: 1, missing_invoice: 1, status_inconsistency: 1 },
      detectionCompletedAt: new Date('2025-02-01T10:00:00Z'),
    });

    mockReconcileDealAndInvoice.mockImplementation(async (input: any) => {
      if (input.dealId === 'deal-001') {
        return {
          dealId: 'deal-001',
          reconciliationStatus: 'status_mismatch',
          dealAmount: 100000,
          totalInvoiceAmount: 100000,
          amountDiscrepancy: null,
          invoiceCount: 1,
          invoices: [{ invoiceId: 'inv-001', invoiceAmount: 100000, invoiceStatus: 'issued', lineItemCount: 1 }],
          detectedIssues: [{ issueType: 'status_mismatch', description: 'Status mismatch', severity: 'error' }],
          validationTimestamp: new Date(),
        };
      } else if (input.dealId === 'deal-002') {
        return {
          dealId: 'deal-002',
          reconciliationStatus: 'amount_discrepancy',
          dealAmount: 250000,
          totalInvoiceAmount: 240000,
          amountDiscrepancy: 10000,
          invoiceCount: 1,
          invoices: [{ invoiceId: 'inv-002', invoiceAmount: 240000, invoiceStatus: 'issued', lineItemCount: 1 }],
          detectedIssues: [{ issueType: 'amount_mismatch', description: 'Amount mismatch', severity: 'error' }],
          validationTimestamp: new Date(),
        };
      } else if (input.dealId === 'deal-003') {
        return {
          dealId: 'deal-003',
          reconciliationStatus: 'unbilled',
          dealAmount: 150000,
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
          dealId: 'deal-003',
          dealName: 'Deal 3',
          customerId: 'cust-003',
          customerName: 'Customer 3',
          dealAmount: 150000,
          dealStatus: 'closed_won',
          invoiceStatus: 'not_issued',
          issueType: 'unbilled',
          priority: 'critical',
          daysOverdue: 7,
          expectedInvoiceDate: new Date('2025-01-25'),
          detectionReason: 'Invoice delayed',
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
      requiredSteps: ['step1', 'step2'],
      estimatedResolutionDateTime: '2025-02-01T11:00:00Z',
      notificationContent: {
        recipientUserId: 'sales-rep-001',
        notificationChannel: 'email',
        subject: 'Issue found',
        message: 'Invoice issue detected',
      },
      responseDecisionDateTime: '2025-02-01T10:05:00Z',
    });

    mockModifyInvoice.mockResolvedValue({
      invoiceId: 'inv-001',
      invoiceNumber: 'INV-001',
      invoiceAmount: 100000,
      taxAmount: 10000,
      untaxedAmount: 90000,
      modifiedLineItemIds: [],
      invoiceStatus: 'modified',
      modificationRecordId: 'mod-001',
      modifiedAt: new Date('2025-02-01T10:05:00Z'),
    }).mockRejectedValueOnce(new Error('Modification failed'));

    mockReissueInvoice.mockRejectedValueOnce(new Error('Reissue failed'));

    mockRecordAnomalyDetection.mockResolvedValueOnce({
      anomalyDetectionLogId: 'log-001',
      recordedAt: new Date('2025-02-01T10:05:30Z'),
      status: 'recorded',
    }).mockResolvedValueOnce({
      anomalyDetectionLogId: 'log-002',
      recordedAt: new Date('2025-02-01T10:06:15Z'),
      status: 'recorded',
    }).mockResolvedValueOnce({
      anomalyDetectionLogId: 'log-003',
      recordedAt: new Date('2025-02-01T10:07:00Z'),
      status: 'recorded',
    });

    mockNotifyIssueResponse.mockRejectedValue(new Error('Notification failed'));
  });

  it('should return failed status when all modifications, reissues, and notifications fail', async () => {
    const input = {
      executorUserId: 'user-001',
      targetPeriod: { startDate: '2025-01-01', endDate: '2025-01-31' },
      executionTimestamp: '2025-02-01T10:00:00Z',
    };

    const result = await runTx2Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('failed');
    expect(result.anomaliesDetected).toBe(3);
    expect(result.anomaliesResolved).toBe(0);
    expect(result.notificationsDelivered).toBe(0);
    expect(result.detectionLogIds).toEqual(['log-001', 'log-002', 'log-003']);
    expect(result.executionSummary).toContain('複数の異常が検出されましたが、修正・再発行処理に失敗しました');
    expect(result.executionSummary).toContain('営業担当者への通知送信にも失敗しました');
  });
});
