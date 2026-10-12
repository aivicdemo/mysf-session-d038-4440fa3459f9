import { runTx2Imp1Agent, Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-007: 検出された異常のうち一部のみ修正・再発行に成功した場合', () => {
  it('partial_successステータスと各件数が出力される', async () => {
    const mockAiClient: Tx2Imp1AiClient = {
      enforceAccessControlForDataDisplay: jest.fn().mockResolvedValue({
        userId: 'user-001',
        permissions: ['read_deals', 'read_invoices', 'modify_invoices'],
      }),
      fetchDealsForPeriod: jest.fn().mockResolvedValue({
        deals: [
          { dealId: 'deal-001', dealAmount: 100000, dealStatus: 'closed_won', closeDate: '2024-01-15' },
          { dealId: 'deal-002', dealAmount: 150000, dealStatus: 'closed_won', closeDate: '2024-01-20' },
          { dealId: 'deal-003', dealAmount: 200000, dealStatus: 'closed_won', closeDate: '2024-01-25' },
        ],
      }),
      fetchInvoicesForPeriod: jest.fn().mockResolvedValue({
        invoices: [
          { invoiceId: 'inv-001', dealId: 'deal-001', invoiceAmount: 100000, invoiceStatus: 'issued' },
          { invoiceId: 'inv-002', dealId: 'deal-002', invoiceAmount: 150000, invoiceStatus: 'draft' },
          { invoiceId: 'inv-003', dealId: 'deal-003', invoiceAmount: 200000, invoiceStatus: 'issued' },
        ],
      }),
      detectDataflowAnomalies: jest.fn().mockResolvedValue({
        anomalies: [
          { anomalyId: 'anom-001', dealId: 'deal-001', anomalyType: 'amount_mismatch', description: '請求金額が商談金額と一致していない', severity: 'high' },
          { anomalyId: 'anom-002', dealId: 'deal-002', anomalyType: 'status_mismatch', description: '請求書ステータスが不整合', severity: 'medium' },
          { anomalyId: 'anom-003', dealId: 'deal-003', anomalyType: 'missing_invoice', description: '請求書が未作成', severity: 'high' },
          { anomalyId: 'anom-004', dealId: 'deal-004', anomalyType: 'amount_mismatch', description: '追加で検出された金額ズレ', severity: 'medium' },
        ],
      }),
      reconcileDealAndInvoice: jest.fn().mockResolvedValue({
        results: [
          { dealId: 'deal-001', invoiceId: 'inv-001', consistent: false, details: '請求金額95000は商談金額100000と不一致' },
          { dealId: 'deal-002', invoiceId: 'inv-002', consistent: false, details: '請求書ステータスが\'draft\'のまま' },
          { dealId: 'deal-003', invoiceId: null, consistent: false, details: '商談に対応する請求書が存在しない' },
        ],
      }),
      detectInvoiceDelayAndClassifyPriority: jest.fn().mockResolvedValue({
        delayedAndUnbilledDeals: [
          { dealId: 'deal-003', priority: 'urgent', daysOverdue: 5 },
        ],
      }),
      classifyAndRespondToIssue: jest.fn().mockResolvedValue({
        issues: [
          { anomalyId: 'anom-001', dealId: 'deal-001', action: 'modify_invoice', targetAmount: 100000 },
          { anomalyId: 'anom-002', dealId: 'deal-002', action: 'reissue_invoice', targetStatus: 'issued' },
          { anomalyId: 'anom-003', dealId: 'deal-003', action: 'generate_invoice', targetAmount: 200000 },
        ],
      }),
      modifyInvoice: jest.fn().mockResolvedValue({
        outcomes: [
          { anomalyId: 'anom-001', dealId: 'deal-001', invoiceId: 'inv-001-modified', success: true, modifiedAmount: 100000, timestamp: '2024-02-01T10:15:00Z' },
          { anomalyId: 'anom-002', dealId: 'deal-002', invoiceId: 'inv-002-reissued', success: true, newStatus: 'issued', timestamp: '2024-02-01T10:16:00Z' },
          { anomalyId: 'anom-003', dealId: 'deal-003', invoiceId: null, success: false, errorMessage: '請求書生成に失敗しました。取引先マスタのバリデーションエラー', timestamp: '2024-02-01T10:17:00Z' },
        ],
      }),
      recordAnomalyDetection: jest.fn().mockResolvedValue({
        recordedLogIds: ['log-anom-001', 'log-anom-002', 'log-anom-003'],
      }),
      notifyIssueResponse: jest.fn().mockResolvedValue({
        deliveredCount: 2,
        deliveredNotifications: [
          { notificationId: 'notif-001', recipientUserId: 'sales-user-001', recipientEmail: 'sales001@company.com', anomalyId: 'anom-001', status: 'delivered', message: 'deal-001 の請求書修正が完了しました。修正金額: 100,000円', timestamp: '2024-02-01T10:15:30Z' },
          { notificationId: 'notif-002', recipientUserId: 'sales-user-002', recipientEmail: 'sales002@company.com', anomalyId: 'anom-002', status: 'delivered', message: 'deal-002 の請求書が再発行されました。', timestamp: '2024-02-01T10:16:30Z' },
        ],
      }),
    };

    const input = {
      executorUserId: 'user-001',
      targetPeriod: { startDate: '2024-01-01', endDate: '2024-01-31' },
      executionTimestamp: '2024-02-01T10:00:00Z',
    };

    const result = await runTx2Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('partial_success');
    expect(result.anomaliesDetected).toBe(4);
    expect(result.anomaliesResolved).toBe(2);
    expect(result.notificationsDelivered).toBe(2);
    expect(result.detectionLogIds).toEqual(['log-anom-001', 'log-anom-002', 'log-anom-003']);
    expect(result.executionSummary).toContain('4件の異常を検出し、2件の修正・再発行に成功しました');
  });
});
