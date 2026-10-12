import { loadActiveValidationRules } from '../../src/logic/validation-rule-engine';

describe('SCEN-984: 指定したテーブルに一致するルール定義のうち、適用終了日が現在日時より前のものは除外', () => {
  it('適用終了日が現在日時より前のルールを除外して返す', async () => {
    const result = await loadActiveValidationRules({
      targetTable: '請求書',
      targetColumn: '金額',
      currentDateTime: new Date('2026-07-15T10:30:00Z'),
    });

    expect(result.ruleCount).toBe(1);
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0].validationRuleId).toBe('rule-002');
  });
});
