import { verifyInvoiceOutputConsistency } from '../../src/logic/invoice-output-verification';

describe('SCEN-225: 計算ロジック比較を lenient モードで実施', () => {
  test('許容可能なロジック差異は修正完了判定に影響しない', async () => {
    const legacySystemInvoices = [
      {
        invoiceId: 'INV-2024-001',
        invoiceNumber: '202401001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 110000,
        taxAmount: 10000,
        taxExcludedAmount: 100000,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 100,
            unitPrice: 1000,
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
        invoiceNumber: '202401001',
        invoiceDate: '2024-01-15',
        invoiceAmount: 110000,
        taxAmount: 10001,
        taxExcludedAmount: 99999,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 100,
            unitPrice: 1000,
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
      executedAt: '2024-02-01T10:00:00Z',
    };

    const toleranceSettings = {
      amountToleranceYen: 2,
      calculationLogicComparisonMode: 'lenient' as const,
    };

    const result = await verifyInvoiceOutputConsistency({
      legacySystemInvoices,
      newSystemInvoices,
      testExecutionContext,
      toleranceSettings,
    });

    expect(result.isConsistent).toBe(true);
    expect(result.verificationResult.amountVerification.isMatched).toBe(false);
    expect(result.verificationResult.calculationLogicVerification.isMatched).toBe(true);
    expect(result.verificationResult.calculationLogicVerification.differences).toEqual([]);
    expect(result.modificationCompletionJudgment.canCompleteModification).toBe(true);
    expect(result.modificationCompletionJudgment.reason).toContain('lenient モード');
    expect(result.modificationCompletionJudgment.reason).toContain('端数処理');
    expect(result.testExecutionSummary.totalInvoicesCompared).toBe(1);
  });
});
