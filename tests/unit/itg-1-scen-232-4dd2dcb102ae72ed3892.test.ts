import { verifyInvoiceOutputConsistency } from '../../src/logic/invoice-output-verification';

describe('SCEN-232: 旧新システムの請求書データが全て一致し、金額許容値・計算ロジック比較モードのデフォルト値で検証した場合、修正完了可否が肯定され、本番移行準備完了と判定される', () => {
  it('完全一致のデータでデフォルト許容値設定で検証すると、本番移行準備完了と判定される', async () => {
    const legacySystemInvoices = [
      {
        invoiceId: 'INV-2024-001',
        invoiceNumber: '2024001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 110000,
        taxAmount: 10000,
        taxExcludedAmount: 100000,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 10,
            unitPrice: 10000,
            amount: 100000,
            taxRate: 0.1,
            taxAmount: 10000,
          },
        ],
      },
      {
        invoiceId: 'INV-2024-002',
        invoiceNumber: '2024002',
        invoiceDate: '2024-01-20',
        invoiceAmount: 220000,
        taxAmount: 20000,
        taxExcludedAmount: 200000,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 5,
            unitPrice: 20000,
            amount: 100000,
            taxRate: 0.1,
            taxAmount: 10000,
          },
          {
            lineNumber: 2,
            quantity: 2,
            unitPrice: 50000,
            amount: 100000,
            taxRate: 0.1,
            taxAmount: 10000,
          },
        ],
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'INV-2024-001',
        invoiceNumber: '2024001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 110000,
        taxAmount: 10000,
        taxExcludedAmount: 100000,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 10,
            unitPrice: 10000,
            amount: 100000,
            taxRate: 0.1,
            taxAmount: 10000,
          },
        ],
      },
      {
        invoiceId: 'INV-2024-002',
        invoiceNumber: '2024002',
        invoiceDate: '2024-01-20',
        invoiceAmount: 220000,
        taxAmount: 20000,
        taxExcludedAmount: 200000,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 5,
            unitPrice: 20000,
            amount: 100000,
            taxRate: 0.1,
            taxAmount: 10000,
          },
          {
            lineNumber: 2,
            quantity: 2,
            unitPrice: 50000,
            amount: 100000,
            taxRate: 0.1,
            taxAmount: 10000,
          },
        ],
      },
    ];

    const input = {
      legacySystemInvoices,
      newSystemInvoices,
      testExecutionContext: {
        environmentId: 'test-env-001',
        targetPeriodStart: '2024-01-01',
        targetPeriodEnd: '2024-01-31',
        executedAt: '2024-01-31T18:00:00Z',
      },
      toleranceSettings: {
        amountToleranceYen: 0,
        calculationLogicComparisonMode: 'strict' as const,
      },
    };

    const result = await verifyInvoiceOutputConsistency(input);

    expect(result.isConsistent).toBe(true);
    expect(result.verificationResult.amountVerification.isMatched).toBe(true);
    expect(result.verificationResult.amountVerification.mismatchedInvoices).toEqual([]);
    expect(result.verificationResult.lineItemCountVerification.isMatched).toBe(true);
    expect(result.verificationResult.lineItemCountVerification.mismatchedInvoices).toEqual([]);
    expect(result.verificationResult.lineItemAmountVerification.isMatched).toBe(true);
    expect(result.verificationResult.lineItemAmountVerification.mismatchedLineItems).toEqual([]);
    expect(result.verificationResult.calculationLogicVerification.isMatched).toBe(true);
    expect(result.verificationResult.calculationLogicVerification.differences).toEqual([]);

    expect(result.testExecutionSummary.environmentId).toBe('test-env-001');
    expect(result.testExecutionSummary.targetPeriod.start).toBe('2024-01-01');
    expect(result.testExecutionSummary.targetPeriod.end).toBe('2024-01-31');
    expect(result.testExecutionSummary.executedAt).toBe('2024-01-31T18:00:00Z');
    expect(result.testExecutionSummary.totalInvoicesCompared).toBe(2);

    expect(result.modificationCompletionJudgment.canCompleteModification).toBe(true);
    expect(result.modificationCompletionJudgment.reason).toBe(
      '旧新システムの請求書出力結果が完全に一致し、金額ズレ・件数不一致・計算ロジック差異が検出されない'
    );
    expect(result.modificationCompletionJudgment.recommendedAction).toBe('本番移行の準備が完了した');
  });
});
