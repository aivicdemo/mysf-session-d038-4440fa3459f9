import { verifyInvoiceOutputConsistency } from '../../src/logic/invoice-output-verification';
import type {
  VerifyInvoiceOutputConsistencyInput,
  VerifyInvoiceOutputConsistencyOutput,
} from '../../src/logic/invoice-output-verification';

describe('SCEN-220: 旧新システムの請求明細の数量・単価・金額・税率・税額のいずれかが一致しない場合、明細金額ズレとして検出され、修正完了判定が否定される', () => {
  it('should detect line item amount mismatch and deny modification completion', async () => {
    const legacySystemInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: '2024-0001',
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
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: '2024-0001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 110000,
        taxAmount: 10000,
        taxExcludedAmount: 100000,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 10,
            unitPrice: 9500,
            amount: 95000,
            taxRate: 0.1,
            taxAmount: 9500,
          },
        ],
      },
    ];

    const testExecutionContext = {
      environmentId: 'test-env-001',
      targetPeriodStart: '2024-01-01',
      targetPeriodEnd: '2024-01-31',
      executedAt: '2024-02-01T10:00:00Z',
    };

    const toleranceSettings = {
      amountToleranceYen: 0,
      calculationLogicComparisonMode: 'strict' as const,
    };

    const input: VerifyInvoiceOutputConsistencyInput = {
      legacySystemInvoices,
      newSystemInvoices,
      testExecutionContext,
      toleranceSettings,
    };

    const result: VerifyInvoiceOutputConsistencyOutput = await verifyInvoiceOutputConsistency(input);

    expect(result.isConsistent).toBe(false);
    expect(result.verificationResult.lineItemAmountVerification.isMatched).toBe(false);
    expect(result.verificationResult.lineItemAmountVerification.mismatchedLineItems.length).toBeGreaterThan(0);
    const mismatch = result.verificationResult.lineItemAmountVerification.mismatchedLineItems[0];
    expect(mismatch.invoiceId).toBe('INV-001');
    expect(mismatch.lineNumber).toBe(1);
    expect(mismatch.legacyAmount).toBe(100000);
    expect(mismatch.newAmount).toBe(95000);
    expect(mismatch.difference).toBe(5000);
    expect(result.modificationCompletionJudgment.canCompleteModification).toBe(false);
    expect(result.modificationCompletionJudgment.reason).toContain('INV-001');
    expect(result.modificationCompletionJudgment.reason).toContain('100000');
    expect(result.modificationCompletionJudgment.reason).toContain('95000');
    expect(result.modificationCompletionJudgment.recommendedAction).toContain('数量');
    expect(result.testExecutionSummary.environmentId).toBe('test-env-001');
    expect(result.testExecutionSummary.targetPeriod.start).toBe('2024-01-01');
    expect(result.testExecutionSummary.targetPeriod.end).toBe('2024-01-31');
    expect(result.testExecutionSummary.executedAt).toBe('2024-02-01T10:00:00Z');
    expect(result.testExecutionSummary.totalInvoicesCompared).toBe(1);
  });
});
