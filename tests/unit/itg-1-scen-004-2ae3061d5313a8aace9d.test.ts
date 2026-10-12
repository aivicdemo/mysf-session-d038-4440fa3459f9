import { runTx2Imp1Agent, Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-004: 監視対象期間の開始日が終了日と同じ場合', () => {
  it('処理が実行される', async () => {
    const mockAiClient: Tx2Imp1AiClient = {
      enforceAccessControlForDataDisplay: jest.fn().mockResolvedValue({
        hasAccessToSalesData: true,
        hasAccessToInvoiceData: true,
      }),
      fetchDealsForPeriod: jest.fn().mockResolvedValue({
        deals: [
          { dealId: 'deal-001', dealName: 'A社案件', dealAmount: 1000000, dealStatus: 'Closed Won', dealDate: '2024-01-15' },
          { dealId: 'deal-002', dealName: 'B社案件', dealAmount: 500000, dealStatus: 'Closed Won', dealDate: '2024-01-15' },
        ],
      }),
      fetchInvoicesForPeriod: jest.fn().mockResolvedValue({
        invoices: [
          { invoiceId: 'invoice-001', dealId: 'deal-001', amount: 950000, status: 'issued' },
        ],
      }),
      detectDataflowAnomalies: jest.fn().mockResolvedValue({
        anomalies: [
          {
            anomalyId: 'anomaly-001',
            type: 'amount_mismatch',
            dealId: 'deal-001',
            expectedAmount: 1000000,
            actualInvoiceAmount: 950000,
            severity: 'high',
          },
        ],
        totalCount: 1,
      }),
      reconcileDealAndInvoice: jest.fn().mockResolvedValue({
        reconciliationResults: [
          {
            dealId: 'deal-001',
            invoiceId: 'invoice-001',
            isReconciled: false,
            discrepancyDetails: { amountDifference: -50000, statusMismatch: false },
          },
        ],
      }),
      detectInvoiceDelayAndClassifyPriority: jest.fn().mockResolvedValue({
        delayedInvoices: [],
        uninvoicedDeals: [],
      }),
      classifyAndRespondToIssue: jest.fn().mockResolvedValue({
        responsibleAnomalies: [
          {
            anomalyId: 'anomaly-001',
            actionType: 'modify_invoice',
            targetInvoiceId: 'invoice-001',
            correctionAmount: 1000000,
            priority: 'high',
          },
        ],
      }),
      modifyInvoice: jest.fn().mockResolvedValue({
        modifications: [
          {
            invoiceId: 'invoice-001',
            status: 'success',
            modifiedAmount: 1000000,
            modificationTimestamp: '2024-01-15T10:31:00Z',
          },
        ],
      }),
      recordAnomalyDetection: jest.fn().mockResolvedValue({
        logIds: ['log-001'],
        recordedCount: 1,
      }),
      notifyIssueResponse: jest.fn().mockResolvedValue({
        notifications: [
          {
            notificationId: 'notif-001',
            recipientUserId: 'sales-user-001',
            type: 'invoice_modified',
            status: 'delivered',
          },
        ],
        deliveredCount: 1,
      }),
    };

    const input = {
      executorUserId: 'user-001',
      targetPeriod: { startDate: '2024-01-15', endDate: '2024-01-15' },
      executionTimestamp: '2024-01-15T10:30:00Z',
    };

    const result = await runTx2Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('success');
    expect(result.anomaliesDetected).toBe(1);
    expect(result.anomaliesResolved).toBe(1);
    expect(result.notificationsDelivered).toBe(1);
    expect(result.detectionLogIds).toEqual(['log-001']);
    expect(result.executionSummary).toContain('2024-01-15');
  });
});
