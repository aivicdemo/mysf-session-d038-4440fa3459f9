import { validateDataAgainstRules, DataValidationFailed } from '../../src/logic/validation-rule-engine';

describe('SCEN-977: 入力データが1件以上のルール定義に違反する場合', () => {
  it('DataValidationFailedエラーが発生しisValidがfalseで違反内容が返される', async () => {
    const targetTable = 'invoices';
    const targetColumn = null;
    const inputData = {
      col1: 'value1',
      col2: 50000,
      col3: '2024-01-15',
      col4: '2024-01-10',
    };
    const currentDateTime = new Date('2024-01-20T10:00:00Z');

    await expect(
      validateDataAgainstRules({
        targetTable,
        targetColumn,
        inputData,
        currentDateTime,
      })
    ).rejects.toThrow(DataValidationFailed);

    try {
      await validateDataAgainstRules({
        targetTable,
        targetColumn,
        inputData,
        currentDateTime,
      });
    } catch (error: any) {
      expect(error).toBeInstanceOf(DataValidationFailed);
      expect(error.message).toContain('入力データが業務ルールに違反しています。');

      if ('output' in error) {
        expect(error.output.isValid).toBe(false);
        expect(error.output.validationResults).toHaveLength(2);

        const rule001Result = error.output.validationResults.find(
          (vr: any) => vr.validationType === 'business_rule'
        );
        const rule002Result = error.output.validationResults[1];

        expect(rule001Result.passed).toBe(false);
        expect(rule002Result.passed).toBe(true);
        expect(error.output.errorSummary).not.toBeNull();
      }
    }
  });
});
