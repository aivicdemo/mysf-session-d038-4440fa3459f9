import { verifyInvoiceOutputConsistency } from '../../src/logic/invoice-output-verification';

describe('SCEN-230: 請求書IDでマッチングできない行が存在するとき、警告が記録され、マッチング不可の請求書が差異として報告される', () => {
  it('旧システムのINV-002が新システムに存在しない場合、マッチング不可として検出される', async () => {
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
            unitPrice: 10000,
            amount: 100000,
            taxRate: 0.1,
            taxAmount: 10000,
          },
        ],
      },
      {
        invoiceId: 'INV-002',
        invoiceNumber: '2024-002',
        invoiceDate: '2024-01-16',
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
            unitPrice: 10000,
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
        environmentId: 'TEST-ENV-001',
        targetPeriodStart: '2024-01-01',
        targetPeriodEnd: '2024-01-31',
        executedAt: '2024-01-20T10:00:00Z',
      },
      toleranceSettings: {
        amountToleranceYen: 0,
        calculationLogicComparisonMode: 'strict' as const,
      },
    };

    const result = await verifyInvoiceOutputConsistency(input);

    expect(result.isConsistent).toBe(false);
    expect(result.verificationResult.amountVerification.isMatched).toBe(true);
    expect(result.verificationResult.lineItemCountVerification.isMatched).toBe(true);
    expect(result.verificationResult.lineItemAmountVerification.isMatched).toBe(true);
    expect(result.verificationResult.calculationLogicVerification.isMatched).toBe(true);
    expect(result.verificationResult.amountVerification.mismatchedInvoices).toEqual([]);
    expect(result.verificationResult.lineItemCountVerification.mismatchedInvoices).toEqual([]);
    expect(result.verificationResult.lineItemAmountVerification.mismatchedLineItems).toEqual([]);
    expect(result.verificationResult.calculationLogicVerification.differences).toEqual([]);

    expect(result.testExecutionSummary.environmentId).toBe('TEST-ENV-001');
    expect(result.testExecutionSummary.targetPeriod.start).toBe('2024-01-01');
    expect(result.testExecutionSummary.targetPeriod.end).toBe('2024-01-31');
    expect(result.testExecutionSummary.totalInvoicesCompared).toBe(1);

    expect(result.modificationCompletionJudgment.canCompleteModification).toBe(false);
    expect(result.modificationCompletionJudgment.reason).toContain('一部の請求書がシステム間でマッチングできません');
    expect(result.modificationCompletionJudgment.recommendedAction).toContain('新システムへのデータ移行を確認し');
  });
});
