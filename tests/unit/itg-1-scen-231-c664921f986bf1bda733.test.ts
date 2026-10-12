import { verifyInvoiceOutputConsistency } from '../../src/logic/invoice-output-verification';

describe('SCEN-231: テスト実行コンテキストの対象期間がテスト実行日時と矛盾しない場合、検証が実行され、testExecutionSummary に正しく記録される', () => {
  it('対象期間内で一致したデータについてtestExecutionSummaryが正しく記録される', async () => {
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
            unitPrice: 10000,
            amount: 100000,
            taxRate: 0.1,
            taxAmount: 10000,
          },
        ],
      },
      {
        invoiceId: 'INV-2024-002',
        invoiceNumber: 'INV20240102',
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
        invoiceNumber: 'INV20240101',
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
        invoiceNumber: 'INV20240102',
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

    const input = {
      legacySystemInvoices,
      newSystemInvoices,
      testExecutionContext: {
        environmentId: 'TEST-ENV-001',
        targetPeriodStart: '2024-01-01',
        targetPeriodEnd: '2024-01-31',
        executedAt: '2024-01-25T14:30:00Z',
      },
      toleranceSettings: {
        amountToleranceYen: 0,
        calculationLogicComparisonMode: 'strict' as const,
      },
    };

    const result = await verifyInvoiceOutputConsistency(input);

    expect(result.isConsistent).toBe(true);
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
    expect(result.testExecutionSummary.executedAt).toBe('2024-01-25T14:30:00Z');
    expect(result.testExecutionSummary.totalInvoicesCompared).toBe(2);

    expect(result.modificationCompletionJudgment.canCompleteModification).toBe(true);
  });
});
