import { loadActiveValidationRules } from '../../src/logic/validation-rule-engine';

describe('SCEN-982: 指定したテーブルと一致するルール定義が複数存在し、すべて有効期間内', () => {
  it('合致するすべてのルール定義を検証エンジンが評価可能な形式で返す', async () => {
    const result = await loadActiveValidationRules({
      targetTable: '請求書',
      targetColumn: '金額',
      currentDateTime: new Date('2026-06-15T10:30:00Z'),
    });

    expect(result.ruleCount).toBe(2);
    expect(result.rules).toHaveLength(2);
    expect(result.rules[0].validationRuleId).toBe('RULE-001');
    expect(result.rules[1].validationRuleId).toBe('RULE-002');
    expect(result.rules[0].targetTable).toBe('請求書');
    expect(result.rules[0].targetColumn).toBe('金額');
  });
});
