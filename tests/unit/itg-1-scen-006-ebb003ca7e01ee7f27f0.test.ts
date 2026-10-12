import { runTx2Imp1Agent, Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-006: 監視対象期間内に検出対象の異常が存在しない場合', () => {
  it('NoAnomaliesDetectedErrorが発生する', async () => {
    const mockAiClient: Tx2Imp1AiClient = {
      enforceAccessControlForDataDisplay: jest.fn().mockResolvedValue({
        hasAccess: true,
      }),
      fetchDealsForPeriod: jest.fn().mockResolvedValue({
        deals: [
          { id: 'deal-001', amount: 100000, status: 'closed_won' },
        ],
      }),
      fetchInvoicesForPeriod: jest.fn().mockResolvedValue({
        invoices: [
          { id: 'inv-001', dealId: 'deal-001', amount: 100000, status: 'issued' },
        ],
      }),
      detectDataflowAnomalies: jest.fn().mockResolvedValue({
        anomalies: [],
      }),
      reconcileDealAndInvoice: jest.fn().mockResolvedValue({
        isConsistent: true,
      }),
      detectInvoiceDelayAndClassifyPriority: jest.fn().mockResolvedValue({
        issues: [],
      }),
      classifyAndRespondToIssue: jest.fn().mockResolvedValue({
        correctableIssues: [],
      }),
    };

    const input = {
      executorUserId: 'user-001',
      targetPeriod: { startDate: '2024-01-01', endDate: '2024-01-31' },
      executionTimestamp: '2024-02-01T10:00:00Z',
    };

    await expect(runTx2Imp1Agent(input, mockAiClient)).rejects.toThrow(
      '監視対象期間内に検出対象の異常はありません。'
    );
  });
});
