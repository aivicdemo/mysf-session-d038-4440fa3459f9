import { verifyInvoiceOutputConsistency } from '../../src/logic/invoice-output-verification';
import type {
  VerifyInvoiceOutputConsistencyInput,
  VerifyInvoiceOutputConsistencyOutput,
} from '../../src/logic/invoice-output-verification';

describe('SCEN-219: 旧新システムの請求書に紐付く明細件数が一致しない場合、件数不一致として検出され、修正完了判定が否定される', () => {
  it('should detect line item count mismatch and deny modification completion', async () => {
    const legacySystemInvoices = [
      {
        invoiceId: 'INV-2024-001',
        invoiceNumber: 'INV20240101',
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
        invoiceId: 'INV-2024-001',
        invoiceNumber: 'INV20240101',
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
        ],
      },
    ];

    const testExecutionContext = {
      environmentId: 'test-env-001',
      targetPeriodStart: '2024-01-01',
      targetPeriodEnd: '2024-01-31',
      executedAt: '2024-01-20T10:00:00Z',
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
    expect(result.verificationResult.lineItemCountVerification.isMatched).toBe(false);
    expect(result.verificationResult.lineItemCountVerification.mismatchedInvoices.length).toBeGreaterThan(0);
    const mismatch = result.verificationResult.lineItemCountVerification.mismatchedInvoices[0];
    expect(mismatch.invoiceId).toBe('INV-2024-001');
    expect(mismatch.legacyCount).toBe(2);
    expect(mismatch.newCount).toBe(1);
    expect(result.modificationCompletionJudgment.canCompleteModification).toBe(false);
    expect(result.modificationCompletionJudgment.reason).toContain('INV-2024-001');
    expect(result.modificationCompletionJudgment.reason).toContain('2');
    expect(result.modificationCompletionJudgment.reason).toContain('1');
    expect(result.modificationCompletionJudgment.recommendedAction).toBeDefined();
    expect(result.testExecutionSummary.environmentId).toBe('test-env-001');
    expect(result.testExecutionSummary.targetPeriod.start).toBe('2024-01-01');
    expect(result.testExecutionSummary.targetPeriod.end).toBe('2024-01-31');
    expect(result.testExecutionSummary.totalInvoicesCompared).toBe(1);
  });
});
