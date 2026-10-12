import { verifyInvoiceOutputConsistency, InvoiceRecordNotFound } from '../../src/logic/invoice-output-verification';

describe('SCEN-222: 旧システムに存在する請求書が新システムに存在しない場合', () => {
  test('記録未検出として検出され、修正完了判定が否定される', async () => {
    const legacySystemInvoices = [
      {
        invoiceId: 'INV-2024-001',
        invoiceNumber: '20240101-001',
        invoiceDate: '2024-01-01',
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
        invoiceNumber: '20240101-002',
        invoiceDate: '2024-01-01',
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
        invoiceNumber: '20240101-001',
        invoiceDate: '2024-01-01',
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

    const testExecutionContext = {
      environmentId: 'TEST-ENV-001',
      targetPeriodStart: '2024-01-01',
      targetPeriodEnd: '2024-01-31',
      executedAt: '2024-01-15T10:00:00Z',
    };

    const toleranceSettings = {
      amountToleranceYen: 0,
      calculationLogicComparisonMode: 'strict' as const,
    };

    const result = await verifyInvoiceOutputConsistency({
      legacySystemInvoices,
      newSystemInvoices,
      testExecutionContext,
      toleranceSettings,
    });

    expect(result.isConsistent).toBe(false);
    expect(result.verificationResult.amountVerification.isMatched).toBe(true);
    expect(result.verificationResult.lineItemCountVerification.isMatched).toBe(true);
    expect(result.verificationResult.lineItemAmountVerification.isMatched).toBe(true);
    expect(result.verificationResult.calculationLogicVerification.isMatched).toBe(true);
    expect(result.modificationCompletionJudgment.canCompleteModification).toBe(false);
    expect(result.modificationCompletionJudgment.reason).toContain('INV-2024-002');
    expect(result.modificationCompletionJudgment.reason).toContain('新システムに存在しません');
    expect(result.modificationCompletionJudgment.recommendedAction).toContain('新システムへの請求書データ移行');
    expect(result.testExecutionSummary.totalInvoicesCompared).toBe(2);
  });
});
