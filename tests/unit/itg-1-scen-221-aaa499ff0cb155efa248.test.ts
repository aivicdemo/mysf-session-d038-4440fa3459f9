import { verifyInvoiceOutputConsistency } from '../../src/logic/invoice-output-verification';
import type {
  VerifyInvoiceOutputConsistencyInput,
  VerifyInvoiceOutputConsistencyOutput,
} from '../../src/logic/invoice-output-verification';

describe('SCEN-221: 旧新システムの金額計算・税額計算・端数処理の計算ロジックに差異がある場合、ロジック差異として検出され、修正完了判定が否定される', () => {
  it('should detect calculation logic difference and deny modification completion', async () => {
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
        taxAmount: 10001,
        taxExcludedAmount: 99999,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 2,
            unitPrice: 50000,
            amount: 100000,
            taxRate: 0.1,
            taxAmount: 10001,
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
    expect(result.verificationResult.calculationLogicVerification.isMatched).toBe(false);
    expect(result.verificationResult.calculationLogicVerification.differences.length).toBeGreaterThan(0);
    const diff = result.verificationResult.calculationLogicVerification.differences[0];
    expect(diff.invoiceId).toBe('INV-2024-001');
    expect(diff.logicType).toContain('税');
    expect(diff.detail).toContain('10000');
    expect(diff.detail).toContain('10001');
    expect(result.modificationCompletionJudgment.canCompleteModification).toBe(false);
    expect(result.modificationCompletionJudgment.reason).toContain('計算ロジック差異');
    expect(result.modificationCompletionJudgment.recommendedAction).toContain('端数処理');
    expect(result.testExecutionSummary.environmentId).toBe('TEST-ENV-001');
    expect(result.testExecutionSummary.targetPeriod.start).toBe('2024-01-01');
    expect(result.testExecutionSummary.targetPeriod.end).toBe('2024-01-31');
    expect(result.testExecutionSummary.executedAt).toBe('2024-01-20T10:30:00Z');
    expect(result.testExecutionSummary.totalInvoicesCompared).toBe(1);
  });
});
