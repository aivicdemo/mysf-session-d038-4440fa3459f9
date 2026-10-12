import { runTx2Imp1Agent, Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-008: 検出された異常に対する修正・再発行処理が失敗した場合', () => {
  it('ModificationFailedErrorが発生する', async () => {
    const mockAiClient: Tx2Imp1AiClient = {
      enforceAccessControlForDataDisplay: jest.fn().mockResolvedValue({
        hasAccess: true,
      }),
      fetchDealsForPeriod: jest.fn().mockResolvedValue({
        deals: [
          { id: 'deal-001', amount: 100000, status: 'closed_won', createdDate: '2024-01-15' },
        ],
      }),
      fetchInvoicesForPeriod: jest.fn().mockResolvedValue({
        invoices: [],
      }),
      detectDataflowAnomalies: jest.fn().mockResolvedValue({
        anomalies: [
          { id: 'anomaly-001', targetId: 'deal-001', type: 'amount_mismatch', expectedValue: 100000, actualValue: 95000, level: 'high' },
        ],
      }),
      reconcileDealAndInvoice: jest.fn().mockResolvedValue({
        targetId: 'deal-001',
        isValid: false,
        issues: [
          { fieldName: 'amount', sourceValue: 100000, targetValue: 95000 },
        ],
      }),
      detectInvoiceDelayAndClassifyPriority: jest.fn().mockResolvedValue({
        issues: [
          { targetId: 'deal-001', type: 'unbilled', rank: 'high', delayDays: 5 },
        ],
      }),
      classifyAndRespondToIssue: jest.fn().mockResolvedValue({
        issues: [
          { id: 'anomaly-001', targetId: 'deal-001', action: 'modify_and_reissue', correctedAmount: 100000, description: 'Amount mismatch detected between deal and invoice' },
        ],
      }),
      modifyInvoice: jest.fn().mockResolvedValue({
        result: 'failed',
        targetId: 'invoice-001',
        code: 'AMOUNT_CALCULATION_ERROR',
        message: 'Tax calculation failed due to invalid tax rate configuration',
        metadata: { requestedAmount: 100000, reason: 'Tax rate not found for region JP' },
      }),
      recordAnomalyDetection: jest.fn().mockResolvedValue({
        id: 'log-001',
        anomalyId: 'anomaly-001',
        timestamp: '2024-02-01T10:00:00Z',
        result: 'recorded',
      }),
      notifyIssueResponse: jest.fn().mockResolvedValue({
        result: 'not_attempted',
        reason: 'Prior modification step failed',
      }),
    };

    const input = {
      executorUserId: 'user-001',
      targetPeriod: { startDate: '2024-01-01', endDate: '2024-01-31' },
      executionTimestamp: '2024-02-01T10:00:00Z',
    };

    await expect(runTx2Imp1Agent(input, mockAiClient)).rejects.toThrow(
      '請求書の修正・再発行に失敗しました。詳細はログを確認してください。'
    );
  });
});
