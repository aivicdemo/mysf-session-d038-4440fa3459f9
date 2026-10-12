import { loadActiveValidationRules } from '../../src/logic/validation-rule-engine';

describe('SCEN-985: 指定したテーブルに一致するルール定義のうち、適用開始日が現在日時より後のものは除外', () => {
  it('適用開始日が現在日時より後のルールを除外して返す', async () => {
    const result = await loadActiveValidationRules({
      targetTable: '請求書',
      targetColumn: null,
      currentDateTime: new Date('2026-10-15T10:00:00Z'),
    });

    expect(result.ruleCount).toBe(2);
    expect(result.rules).toHaveLength(2);
    expect(result.rules.map((r: any) => r.validationRuleId)).toEqual(['rule-001', 'rule-003']);
  });
});
