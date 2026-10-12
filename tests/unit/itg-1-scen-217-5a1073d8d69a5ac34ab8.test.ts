import { verifyInvoiceOutputConsistency } from '../../src/logic/invoice-output-verification';
import type {
  VerifyInvoiceOutputConsistencyInput,
  VerifyInvoiceOutputConsistencyOutput,
} from '../../src/logic/invoice-output-verification';

describe('SCEN-217: 旧新システムの請求書が完全に一致し、金額・明細件数・計算ロジックすべてに差異がない場合、修正完了と判定できる', () => {
  it('should return isConsistent true and canCompleteModification true when all invoices match perfectly', async () => {
    const legacySystemInvoices = [
      {
        invoiceId: 'INV-2024-001',
        invoiceNumber: 'INV20240001',
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
      {
        invoiceId: 'INV-2024-002',
        invoiceNumber: 'INV20240002',
        invoiceDate: '2024-01-20',
        invoiceAmount: 55000,
        taxAmount: 5000,
        taxExcludedAmount: 50000,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 5,
            unitPrice: 10000,
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
        invoiceNumber: 'INV20240001',
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
      {
        invoiceId: 'INV-2024-002',
        invoiceNumber: 'INV20240002',
        invoiceDate: '2024-01-20',
        invoiceAmount: 55000,
        taxAmount: 5000,
        taxExcludedAmount: 50000,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 5,
            unitPrice: 10000,
            amount: 50000,
            taxRate: 0.1,
            taxAmount: 5000,
          },
        ],
      },
    ];

    const testExecutionContext = {
      environmentId: 'TEST-ENV-001',
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
    expect(result.testExecutionSummary.executedAt).toBe('2024-02-01T10:00:00Z');
    expect(result.testExecutionSummary.totalInvoicesCompared).toBe(2);
    expect(result.modificationCompletionJudgment.canCompleteModification).toBe(true);
    expect(result.modificationCompletionJudgment.reason).toContain('完全に一致');
    expect(result.modificationCompletionJudgment.recommendedAction).toContain('本番環境');
  });
});
