import { verifyInvoiceOutputConsistency, InvoiceRecordNotFound } from '../../src/logic/invoice-output-verification';

describe('SCEN-228: 検証対象の請求書が 0 件のとき、テスト対象データ存在しないエラーが発生する', () => {
  it('空の請求書配列で呼び出すとInvoiceRecordNotFoundエラーが発生する', async () => {
    const input = {
      legacySystemInvoices: [],
      newSystemInvoices: [],
      testExecutionContext: {
        environmentId: 'test-env-001',
        targetPeriodStart: '2026-01-01',
        targetPeriodEnd: '2026-01-31',
        executedAt: '2026-01-31T23:59:59Z',
      },
      toleranceSettings: {
        amountToleranceYen: 0,
        calculationLogicComparisonMode: 'strict' as const,
      },
    };

    await expect(verifyInvoiceOutputConsistency(input)).rejects.toThrow(InvoiceRecordNotFound);
    await expect(verifyInvoiceOutputConsistency(input)).rejects.toThrow(
      /テスト対象データが存在しません。初回請求処理を実行してください/
    );
  });
});
