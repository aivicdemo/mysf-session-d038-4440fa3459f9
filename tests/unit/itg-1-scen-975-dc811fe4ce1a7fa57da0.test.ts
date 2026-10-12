import { validateDataAgainstRules, ValidationRuleNotFound } from '../../src/logic/validation-rule-engine';

describe('SCEN-975: 対象テーブル・カラムに適用されるルール定義が存在しない場合', () => {
  it('ValidationRuleNotFoundエラーが発生する', async () => {
    const targetTable = 'invoices';
    const targetColumn = 'amount';
    const inputData = {
      amount: 150000,
      invoice_date: '2026-01-15',
    };
    const currentDateTime = new Date('2026-01-20T10:00:00Z');

    await expect(
      validateDataAgainstRules({
        targetTable,
        targetColumn,
        inputData,
        currentDateTime,
      })
    ).rejects.toThrow(ValidationRuleNotFound);

    await expect(
      validateDataAgainstRules({
        targetTable,
        targetColumn,
        inputData,
        currentDateTime,
      })
    ).rejects.toThrow('対象テーブル・カラムに適用されるルール定義が見つかりません。');
  });
});
