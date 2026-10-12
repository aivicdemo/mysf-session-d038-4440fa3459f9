import { validateDataAgainstRules, DataValidationFailed } from '../../src/logic/validation-rule-engine';

describe('SCEN-979: 複数のルール違反が存在する場合', () => {
  it('各違反がvalidationResults配列に全て含まれerrorSummaryに要約メッセージが返される', async () => {
    const targetTable = 'sales_orders';
    const targetColumn = null;
    const inputData = {
      order_amount: 150000,
      customer_id: 'CUST-999',
      order_date: '2026-01-15',
    };
    const currentDateTime = new Date('2026-01-20T10:00:00Z');

    try {
      await validateDataAgainstRules({
        targetTable,
        targetColumn,
        inputData,
        currentDateTime,
      });
    } catch (error: any) {
      expect(error).toBeInstanceOf(DataValidationFailed);

      if ('output' in error) {
        const output = error.output;
        expect(output.isValid).toBe(false);
        expect(output.validationResults).toHaveLength(3);

        const rule001 = output.validationResults.find(
          (vr: any) => vr.validationType === 'RANGE_CHECK'
        );
        const rule002 = output.validationResults.find(
          (vr: any) => vr.validationType === 'REFERENCE_CHECK'
        );
        const rule003 = output.validationResults.find(
          (vr: any) => vr.validationType === 'BUSINESS_RULE'
        );

        expect(rule001.passed).toBe(true);
        expect(rule002.passed).toBe(false);
        expect(rule002.details).toContain('顧客IDが顧客マスタに存在しません。');
        expect(rule003.passed).toBe(true);

        expect(output.errorSummary).not.toBeNull();
        expect(output.errorSummary).toContain('入力データが業務ルールに違反しています。');
      }
    }
  });
});
