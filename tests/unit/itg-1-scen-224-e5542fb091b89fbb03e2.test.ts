import { verifyInvoiceOutputConsistency } from '../../src/logic/invoice-output-verification';

describe('SCEN-224: 金額許容値を指定したとき', () => {
  test('許容値以内の金額ズレは合格判定に含まれ、修正完了と判定できる', async () => {
    const legacySystemInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: '2024-001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 110000,
        taxAmount: 10000,
        taxExcludedAmount: 100000,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 10,
            unitPrice: 5000,
            amount: 50000,
            taxRate: 0.1,
            taxAmount: 5000,
          },
          {
            lineNumber: 2,
            quantity: 10,
            unitPrice: 5000,
            amount: 50000,
            taxRate: 0.1,
            taxAmount: 5000,
          },
        ],
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: '2024-001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 110025,
        taxAmount: 10002,
        taxExcludedAmount: 100023,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 10,
            unitPrice: 5000,
            amount: 50010,
            taxRate: 0.1,
            taxAmount: 5001,
          },
          {
            lineNumber: 2,
            quantity: 10,
            unitPrice: 5000,
            amount: 50015,
            taxRate: 0.1,
            taxAmount: 5001,
          },
        ],
      },
    ];

    const testExecutionContext = {
      environmentId: 'TEST-ENV-001',
      targetPeriodStart: '2024-01-01',
      targetPeriodEnd: '2024-01-31',
      executedAt: '2024-01-20T10:30:00Z',
    };

    const toleranceSettings = {
      amountToleranceYen: 50,
      calculationLogicComparisonMode: 'lenient' as const,
    };

    const result = await verifyInvoiceOutputConsistency({
      legacySystemInvoices,
      newSystemInvoices,
      testExecutionContext,
      toleranceSettings,
    });

    expect(result.isConsistent).toBe(true);
    expect(result.verificationResult.amountVerification.isMatched).toBe(true);
    expect(result.verificationResult.amountVerification.mismatchedInvoices).toEqual([]);
    expect(result.verificationResult.lineItemCountVerification.isMatched).toBe(true);
    expect(result.verificationResult.lineItemCountVerification.mismatchedInvoices).toEqual([]);
    expect(result.verificationResult.lineItemAmountVerification.isMatched).toBe(true);
    expect(result.verificationResult.lineItemAmountVerification.mismatchedLineItems).toEqual([]);
    expect(result.verificationResult.calculationLogicVerification.isMatched).toBe(true);
    expect(result.verificationResult.calculationLogicVerification.differences).toEqual([]);
    expect(result.testExecutionSummary.environmentId).toBe('TEST-ENV-001');
    expect(result.testExecutionSummary.targetPeriod.start).toBe('2024-01-01');
    expect(result.testExecutionSummary.targetPeriod.end).toBe('2024-01-31');
    expect(result.testExecutionSummary.executedAt).toBe('2024-01-20T10:30:00Z');
    expect(result.testExecutionSummary.totalInvoicesCompared).toBe(1);
    expect(result.modificationCompletionJudgment.canCompleteModification).toBe(true);
    expect(result.modificationCompletionJudgment.reason).toContain('旧新システムの請求書出力結果が完全に一致');
    expect(result.modificationCompletionJudgment.reason).toContain('許容値内の金額ズレ');
    expect(result.modificationCompletionJudgment.recommendedAction).toContain('修正完了');
  });
});
