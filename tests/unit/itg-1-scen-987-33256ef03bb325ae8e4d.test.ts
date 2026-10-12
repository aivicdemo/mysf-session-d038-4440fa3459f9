import { loadActiveValidationRules, ValidationRulesNotFound } from '../../src/logic/validation-rule-engine';

describe('SCEN-987: 指定したテーブルとカラムの条件に合致するルール定義が存在しないとき', () => {
  it('検証ルール定義見つかりません例外を発生させる', async () => {
    const targetTable = '顧客';
    const targetColumn = 'メールアドレス';
    const currentDateTime = new Date('2026-10-15T10:00:00Z');

    await expect(
      loadActiveValidationRules({
        targetTable,
        targetColumn,
        currentDateTime,
      })
    ).rejects.toThrow(ValidationRulesNotFound);

    await expect(
      loadActiveValidationRules({
        targetTable,
        targetColumn,
        currentDateTime,
      })
    ).rejects.toThrow('対象テーブル・カラムに適用されるルール定義が見つかりません。');
  });
});
