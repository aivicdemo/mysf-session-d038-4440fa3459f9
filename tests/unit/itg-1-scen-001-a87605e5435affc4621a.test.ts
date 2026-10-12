import { runTx2Imp1Agent, Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-001: 監視対象期間内に金額ズレ・未請求・ステータス不整合が複数件検出され、すべて修正・再発行・通知に成功した場合', () => {
  it('成功ステータスと各件数が出力される', async () => {
    const mockAiClient: Tx2Imp1AiClient = {
      enforceAccessControlForDataDisplay: jest.fn().mockResolvedValue({
        hasAccess: true,
        accessLevel: 'full',
      }),
      fetchDealsForPeriod: jest.fn().mockResolvedValue({
        deals: [
          { dealId: 'deal-001', amount: 100000, status: 'closed_won', closingDate: '2025-01-15' },
          { dealId: 'deal-002', amount: 250000, status: 'closed_won', closingDate: '2025-01-20' },
          { dealId: 'deal-003', amount: 75000, status: 'closed_won', closingDate: '2025-01-25' },
        ],
      }),
      fetchInvoicesForPeriod: jest.fn().mockResolvedValue({
        invoices: [
          { invoiceId: 'inv-001', dealId: 'deal-001', amount: 95000, status: 'issued' },
          { invoiceId: 'inv-002', dealId: 'deal-002', amount: 250000, status: 'issued' },
        ],
      }),
      detectDataflowAnomalies: jest.fn().mockResolvedValue({
        anomalies: [
          {
            anomalyId: 'anom-001',
            type: 'amount_mismatch',
            dealId: 'deal-001',
            invoiceId: 'inv-001',
            description: '商談金額100000と請求書金額95000の不一致',
            severity: 'high',
          },
          {
            anomalyId: 'anom-002',
            type: 'missing_invoice',
            dealId: 'deal-003',
            invoiceId: null,
            description: '商談deal-003に対応する請求書が存在しない',
            severity: 'high',
          },
          {
            anomalyId: 'anom-003',
            type: 'status_mismatch',
            dealId: 'deal-002',
            invoiceId: 'inv-002',
            description: '商談ステータスclosed_wonと請求書ステータスissuedの不整合',
            severity: 'medium',
          },
        ],
      }),
      reconcileDealAndInvoice: jest.fn().mockResolvedValue({
        reconciliationResults: [
          {
            anomalyId: 'anom-001',
            isConsistent: false,
            mismatchDetails: { dealAmount: 100000, invoiceAmount: 95000, difference: 5000 },
          },
          {
            anomalyId: 'anom-002',
            isConsistent: false,
            mismatchDetails: { dealAmount: 75000, invoiceAmount: 0 },
          },
          {
            anomalyId: 'anom-003',
            isConsistent: false,
            mismatchDetails: { dealStatus: 'closed_won', invoiceStatus: 'issued' },
          },
        ],
      }),
      detectInvoiceDelayAndClassifyPriority: jest.fn().mockResolvedValue({
        invoiceDelays: [
          { anomalyId: 'anom-002', dealId: 'deal-003', delayDays: 7, priority: 'urgent' },
        ],
      }),
      classifyAndRespondToIssue: jest.fn().mockResolvedValue({
        responses: [
          {
            anomalyId: 'anom-001',
            responseAction: 'modify_invoice',
            correctAmount: 100000,
            reason: '金額ズレを修正',
          },
          {
            anomalyId: 'anom-002',
            responseAction: 'reissue_invoice',
            correctAmount: 75000,
            reason: '未請求案件に対して請求書を新規発行',
          },
          {
            anomalyId: 'anom-003',
            responseAction: 'modify_invoice',
            correctStatus: 'closed_won',
            reason: 'ステータス不整合を修正',
          },
        ],
      }),
      modifyInvoice: jest.fn().mockResolvedValue({
        modificationResults: [
          {
            anomalyId: 'anom-001',
            invoiceId: 'inv-001',
            action: 'modify',
            success: true,
            newAmount: 100000,
            modificationTimestamp: '2025-02-01T10:05:00Z',
          },
          {
            anomalyId: 'anom-003',
            invoiceId: 'inv-002',
            action: 'modify',
            success: true,
            newStatus: 'closed_won',
            modificationTimestamp: '2025-02-01T10:07:00Z',
          },
        ],
      }),
      reissueInvoice: jest.fn().mockResolvedValue({
        reissueResults: [
          {
            anomalyId: 'anom-002',
            invoiceId: 'inv-003',
            action: 'reissue',
            success: true,
            newAmount: 75000,
            issuanceTimestamp: '2025-02-01T10:06:00Z',
          },
        ],
      }),
      recordAnomalyDetection: jest.fn().mockResolvedValue({
        logIds: ['log-001', 'log-002', 'log-003'],
        recordedAnomalies: [
          { logId: 'log-001', anomalyId: 'anom-001', recordedTimestamp: '2025-02-01T10:05:15Z' },
          { logId: 'log-002', anomalyId: 'anom-002', recordedTimestamp: '2025-02-01T10:05:30Z' },
          { logId: 'log-003', anomalyId: 'anom-003', recordedTimestamp: '2025-02-01T10:05:45Z' },
        ],
      }),
      notifyIssueResponse: jest.fn().mockResolvedValue({
        notificationResults: [
          {
            anomalyId: 'anom-001',
            recipientUserId: 'sales-user-001',
            notificationType: 'invoice_modification_completed',
            deliveryStatus: 'sent',
            deliveryTimestamp: '2025-02-01T10:08:00Z',
          },
          {
            anomalyId: 'anom-002',
            recipientUserId: 'sales-user-002',
            notificationType: 'invoice_reissued',
            deliveryStatus: 'sent',
            deliveryTimestamp: '2025-02-01T10:08:30Z',
          },
          {
            anomalyId: 'anom-003',
            recipientUserId: 'sales-user-001',
            notificationType: 'invoice_modification_completed',
            deliveryStatus: 'sent',
            deliveryTimestamp: '2025-02-01T10:09:00Z',
          },
        ],
      }),
    };

    const input = {
      executorUserId: 'user-001',
      targetPeriod: { startDate: '2025-01-01', endDate: '2025-01-31' },
      executionTimestamp: '2025-02-01T10:00:00Z',
    };

    const result = await runTx2Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('success');
    expect(result.anomaliesDetected).toBe(3);
    expect(result.anomaliesResolved).toBe(3);
    expect(result.notificationsDelivered).toBe(3);
    expect(result.detectionLogIds).toEqual(['log-001', 'log-002', 'log-003']);
    expect(result.executionSummary).toContain('監視対象期間 2025-01-01 から 2025-01-31');
    expect(result.executionSummary).toContain('3 件の異常を検出');
  });
});
