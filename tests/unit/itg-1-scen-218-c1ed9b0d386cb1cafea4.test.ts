import { verifyInvoiceOutputConsistency } from '../../src/logic/invoice-output-verification';
import type {
  VerifyInvoiceOutputConsistencyInput,
  VerifyInvoiceOutputConsistencyOutput,
} from '../../src/logic/invoice-output-verification';

describe('SCEN-218: 旧新システムの請求書金額が許容値を超えて一致しない場合、金額ズレとして検出され、修正完了判定が否定される', () => {
  it('should detect amount mismatch exceeding tolerance and deny modification completion', async () => {
    const legacySystemInvoices = [
      {
        invoiceId: 'INV-001',
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
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceNumber: '2024001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 110500,
        taxAmount: 10050,
        taxExcludedAmount: 100450,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 10,
            unitPrice: 10045,
            amount: 100450,
            taxRate: 0.1,
            taxAmount: 10050,
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
      amountToleranceYen: 100,
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
    expect(result.verificationResult.amountVerification.isMatched).toBe(false);
    expect(result.verificationResult.amountVerification.mismatchedInvoices.length).toBeGreaterThan(0);
    const mismatch = result.verificationResult.amountVerification.mismatchedInvoices[0];
    expect(mismatch.invoiceId).toBe('INV-001');
    expect(mismatch.legacyAmount).toBe(110000);
    expect(mismatch.newAmount).toBe(110500);
    expect(mismatch.difference).toBe(500);
    expect(result.modificationCompletionJudgment.canCompleteModification).toBe(false);
    expect(result.modificationCompletionJudgment.reason).toContain('INV-001');
    expect(result.modificationCompletionJudgment.reason).toContain('110000');
    expect(result.modificationCompletionJudgment.reason).toContain('110500');
    expect(result.modificationCompletionJudgment.recommendedAction).toContain('500');
    expect(result.modificationCompletionJudgment.recommendedAction).toContain('100');
  });
});
