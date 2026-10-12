import { verifyInvoiceOutputConsistency } from '../../src/logic/invoice-output-verification';
import type {
  VerifyInvoiceOutputConsistencyInput,
  VerifyInvoiceOutputConsistencyOutput,
} from '../../src/logic/invoice-output-verification';

describe('SCEN-227: 旧新システムの請求書がすべて一致し、修正完了判定が肯定されたとき、推奨アクションが本番環境への切り替え準備完了を示唆する', () => {
  it('verifyInvoiceOutputConsistency が旧新システム請求書を比較し、すべて一致したとき完全一致と判定し推奨アクションが本番環境への切り替え準備完了を示唆する', async () => {
    const legacySystemInvoices = [
      {
        invoiceId: 'INV-2024-001',
        invoiceNumber: 'SFC-2024-001',
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
        invoiceNumber: 'SFC-2024-002',
        invoiceDate: '2024-01-20',
        invoiceAmount: 220000,
        taxAmount: 20000,
        taxExcludedAmount: 200000,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 20,
            unitPrice: 10000,
            amount: 200000,
            taxRate: 0.1,
            taxAmount: 20000,
          },
        ],
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'INV-2024-001',
        invoiceNumber: 'SFC-2024-001',
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
        invoiceNumber: 'SFC-2024-002',
        invoiceDate: '2024-01-20',
        invoiceAmount: 220000,
        taxAmount: 20000,
        taxExcludedAmount: 200000,
        lineItems: [
          {
            lineNumber: 1,
            quantity: 20,
            unitPrice: 10000,
            amount: 200000,
            taxRate: 0.1,
            taxAmount: 20000,
          },
        ],
      },
    ];

    const testExecutionContext = {
      environmentId: 'TEST-ENV-001',
      targetPeriodStart: '2024-01-01',
      targetPeriodEnd: '2024-01-31',
      executedAt: '2024-01-31T18:30:00Z',
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

    const result = await verifyInvoiceOutputConsistency(input);

    expect(result.isConsistent).toBe(true);

    expect(result.verificationResult.amountVerification.isMatched).toBe(true);
    expect(result.verificationResult.amountVerification.mismatchedInvoices).toEqual(
      []
    );

    expect(result.verificationResult.lineItemCountVerification.isMatched).toBe(
      true
    );
    expect(
      result.verificationResult.lineItemCountVerification.mismatchedInvoices
    ).toEqual([]);

    expect(result.verificationResult.lineItemAmountVerification.isMatched).toBe(
      true
    );
    expect(
      result.verificationResult.lineItemAmountVerification.mismatchedLineItems
    ).toEqual([]);

    expect(result.verificationResult.calculationLogicVerification.isMatched).toBe(
      true
    );
    expect(result.verificationResult.calculationLogicVerification.differences).toEqual(
      []
    );

    expect(result.testExecutionSummary.environmentId).toBe('TEST-ENV-001');
    expect(result.testExecutionSummary.targetPeriod.start).toBe('2024-01-01');
    expect(result.testExecutionSummary.targetPeriod.end).toBe('2024-01-31');
    expect(result.testExecutionSummary.executedAt).toBe('2024-01-31T18:30:00Z');
    expect(result.testExecutionSummary.totalInvoicesCompared).toBe(2);

    expect(result.modificationCompletionJudgment.canCompleteModification).toBe(
      true
    );
    expect(result.modificationCompletionJudgment.reason).toBe(
      '旧新システムの請求書出力結果が完全に一致し、金額ズレ・件数不一致・計算ロジック差異が検出されていません。'
    );
    expect(result.modificationCompletionJudgment.recommendedAction).toBe(
      '本番環境への切り替え準備完了。商談単位での請求書・請求明細の新システムへの完全移行が可能です。'
    );
  });
});
