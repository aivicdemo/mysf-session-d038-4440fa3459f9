import { verifyInvoiceOutputConsistency } from '../../src/logic/invoice-output-verification';

describe('SCEN-226: 複数の請求書を比較し、一部に差異がある場合', () => {
  test('差異のある請求書のみが mismatchedInvoices に記録される', async () => {
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
      {
        invoiceId: 'INV-002',
        invoiceNumber: '2024-002',
        invoiceDate: '2024-01-16',
        invoiceAmount: 132000,
        taxAmount: 12000,
        taxExcludedAmount: 120000,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 20,
            unitPrice: 6000,
            amount: 120000,
            taxRate: 0.1,
            taxAmount: 12000,
          },
        ],
      },
      {
        invoiceId: 'INV-003',
        invoiceNumber: '2024-003',
        invoiceDate: '2024-01-17',
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
        invoiceId: 'INV-002',
        invoiceNumber: '2024-002',
        invoiceDate: '2024-01-16',
        invoiceAmount: 135000,
        taxAmount: 12000,
        taxExcludedAmount: 120000,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 20,
            unitPrice: 6000,
            amount: 120000,
            taxRate: 0.1,
            taxAmount: 12000,
          },
        ],
      },
      {
        invoiceId: 'INV-003',
        invoiceNumber: '2024-003',
        invoiceDate: '2024-01-17',
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
      executedAt: '2024-01-20T10:30:00Z',
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
    expect(result.verificationResult.amountVerification.isMatched).toBe(false);
    expect(result.verificationResult.amountVerification.mismatchedInvoices).toHaveLength(1);
    expect(result.verificationResult.amountVerification.mismatchedInvoices[0]).toMatchObject({
      invoiceId: 'INV-002',
      legacyAmount: 132000,
      newAmount: 135000,
      difference: 3000,
    });
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
    expect(result.testExecutionSummary.totalInvoicesCompared).toBe(3);
    expect(result.modificationCompletionJudgment.canCompleteModification).toBe(false);
    expect(result.modificationCompletionJudgment.reason).toContain('INV-002');
    expect(result.modificationCompletionJudgment.reason).toContain('金額が一致しません');
    expect(result.modificationCompletionJudgment.reason).toContain('132000');
    expect(result.modificationCompletionJudgment.reason).toContain('135000');
    expect(result.modificationCompletionJudgment.recommendedAction).toContain('新システムの請求書生成ロジック');
  });
});
