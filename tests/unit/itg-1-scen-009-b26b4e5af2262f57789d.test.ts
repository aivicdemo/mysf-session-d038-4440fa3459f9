import { runTx2Imp1Agent, Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('SCEN-009: 修正・再発行後の請求書が商談・請求明細と整合しない状態が残存している場合', () => {
  it('DataConsistencyErrorが発生する', async () => {
    const mockAiClient: Tx2Imp1AiClient = {
      enforceAccessControlForDataDisplay: jest.fn().mockResolvedValue({
        hasAccess: true,
        accessLevel: 'full',
      }),
      fetchDealsForPeriod: jest.fn().mockResolvedValue({
        deals: [
          { dealId: 'deal-001', dealAmount: 100000, dealStatus: 'closed_won', dealDate: '2024-01-15' },
        ],
        invoices: [
          { invoiceId: 'inv-001', invoiceAmount: 95000, invoiceStatus: 'issued', dealId: 'deal-001' },
        ],
        invoiceDetails: [
          { detailId: 'detail-001', invoiceId: 'inv-001', amount: 95000, dealId: 'deal-001' },
        ],
      }),
      detectDataflowAnomalies: jest.fn().mockResolvedValue({
        anomalies: [
          {
            anomalyId: 'anom-001',
            type: 'amount_mismatch',
            dealId: 'deal-001',
            invoiceId: 'inv-001',
            expectedAmount: 100000,
            actualAmount: 95000,
            severity: 'high',
          },
        ],
        totalCount: 1,
      }),
      reconcileDealAndInvoice: jest.fn()
        .mockResolvedValueOnce({
          reconciliationId: 'recon-001',
          isConsistent: false,
          dealId: 'deal-001',
          invoiceId: 'inv-001',
          inconsistencies: [
            {
              type: 'amount_mismatch',
              dealAmount: 100000,
              invoiceAmount: 95000,
              discrepancy: 5000,
            },
          ],
        })
        .mockResolvedValueOnce({
          sequenceNumber: 2,
          reconciliationId: 'recon-002',
          isConsistent: false,
          dealId: 'deal-001',
          invoiceId: 'inv-001-rev01',
          inconsistencies: [
            {
              type: 'status_mismatch',
              dealStatus: 'closed_won',
              invoiceStatus: 'draft',
              message: '請求書ステータスが下書きのまま',
            },
          ],
        }),
      detectInvoiceDelayAndClassifyPriority: jest.fn().mockResolvedValue({
        delayedInvoices: [],
        uninvoicedDeals: [],
        priorityClassification: [],
      }),
      classifyAndRespondToIssue: jest.fn().mockResolvedValue({
        classificationId: 'class-001',
        issues: [
          {
            issueId: 'issue-001',
            anomalyId: 'anom-001',
            dealId: 'deal-001',
            invoiceId: 'inv-001',
            responseType: 'invoice_modification',
            correctedAmount: 100000,
          },
        ],
        resolvableCount: 1,
      }),
      modifyInvoice: jest.fn().mockResolvedValue({
        modificationId: 'mod-001',
        invoiceId: 'inv-001',
        originalAmount: 95000,
        correctedAmount: 100000,
        status: 'success',
        newInvoiceId: 'inv-001-rev01',
        modificationDetails: {
          correctionType: 'amount_adjustment',
          reason: 'データ整合性エラーの修正',
        },
      }),
      recordAnomalyDetection: jest.fn().mockResolvedValue({
        logIds: ['log-001', 'log-002'],
        recordedAt: '2024-02-01T10:05:00Z',
        anomaliesLogged: 1,
        status: 'recorded',
      }),
    };

    const input = {
      executorUserId: 'user-001',
      targetPeriod: { startDate: '2024-01-01', endDate: '2024-01-31' },
      executionTimestamp: '2024-02-01T10:00:00Z',
    };

    await expect(runTx2Imp1Agent(input, mockAiClient)).rejects.toThrow(
      '修正後のデータ整合性検証に失敗しました。'
    );
  });
});
