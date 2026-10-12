import { runTx2Imp1Agent, Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-010: 営業担当者への通知送信に失敗した場合', () => {
  it('NotificationFailedErrorが発生する', async () => {
    class NotificationFailedError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'NotificationFailedError';
      }
    }
    const mockAiClient: Tx2Imp1AiClient = {
      enforceAccessControlForDataDisplay: jest.fn().mockResolvedValue({
        hasAccessRight: true,
      }),
      fetchDealsForPeriod: jest.fn().mockResolvedValue({
        deals: [
          { dealId: 'deal-001', amount: 100000, status: 'closed_won' },
        ],
      }),
      fetchInvoicesForPeriod: jest.fn().mockResolvedValue({
        invoices: [
          { invoiceId: 'invoice-001', dealId: 'deal-001', amount: 95000, status: 'issued' },
        ],
      }),
      detectDataflowAnomalies: jest.fn().mockResolvedValue({
        anomalies: [
          { anomalyId: 'anomaly-001', type: 'amount_mismatch', dealId: 'deal-001', discrepancy: 5000 },
        ],
        count: 1,
      }),
      reconcileDealAndInvoice: jest.fn().mockResolvedValue({
        isConsistent: true,
        details: [],
      }),
      detectInvoiceDelayAndClassifyPriority: jest.fn().mockResolvedValue({
        unInvoiced: [],
        delayed: [],
      }),
      classifyAndRespondToIssue: jest.fn().mockResolvedValue({
        resolvableIssues: [
          { anomalyId: 'anomaly-001', resolution: 'modify_invoice', targetInvoiceId: 'invoice-001' },
        ],
      }),
      modifyInvoice: jest.fn().mockResolvedValue({
        success: true,
        modifiedInvoiceId: 'invoice-001-modified',
        details: 'Amount corrected from 95000 to 100000',
      }),
      recordAnomalyDetection: jest.fn().mockResolvedValue({
        logId: 'log-001',
        recorded: true,
      }),
      notifyIssueResponse: jest.fn().mockRejectedValue(
        new NotificationFailedError('営業担当者への通知送信に失敗しました。')
      ),
    };

    const input = {
      executorUserId: 'user-001',
      targetPeriod: { startDate: '2024-01-01', endDate: '2024-01-31' },
      executionTimestamp: '2024-02-01T10:00:00Z',
    };

    await expect(runTx2Imp1Agent(input, mockAiClient)).rejects.toThrow(
      '営業担当者への通知送信に失敗しました。'
    );
  });
});
