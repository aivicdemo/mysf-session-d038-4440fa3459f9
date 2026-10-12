import { verifyInvoiceOutputConsistency } from '../../src/logic/invoice-output-verification';

describe('SCEN-229: 旧新システムのデータが取得できないとき、データ取得失敗エラーが発生する', () => {
  it('nullのデータで呼び出すとエラーが発生する', async () => {
    const input = {
      legacySystemInvoices: null as any,
      newSystemInvoices: null as any,
      testExecutionContext: {
        environmentId: 'test-env-001',
        targetPeriodStart: '2024-01-01',
        targetPeriodEnd: '2024-01-31',
        executedAt: '2024-02-01T10:00:00Z',
      },
      toleranceSettings: {
        amountToleranceYen: 0,
        calculationLogicComparisonMode: 'strict' as const,
      },
    };

    await expect(verifyInvoiceOutputConsistency(input)).rejects.toThrow(
      /旧新システムのデータ取得に失敗しました。システム接続を確認してください/
    );
  });
});
