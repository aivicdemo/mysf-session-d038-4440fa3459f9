import { loadActiveValidationRules } from '../../src/logic/validation-rule-engine';

describe('SCEN-986: カラム名が指定されていないとき、テーブル全体に適用されるルール定義をすべて返す', () => {
  it('テーブル全体に適用されるルール定義を含めて返す', async () => {
    const result = await loadActiveValidationRules({
      targetTable: '請求書',
      targetColumn: null,
      currentDateTime: new Date('2026-10-15T10:30:00Z'),
    });

    expect(result.ruleCount).toBe(3);
    expect(result.rules).toHaveLength(3);

    const tableWideRules = result.rules.filter((r: any) => r.targetColumn === null);
    const columnSpecificRules = result.rules.filter((r: any) => r.targetColumn !== null);

    expect(tableWideRules).toHaveLength(2);
    expect(columnSpecificRules).toHaveLength(1);
    expect(result.rules.map((r: any) => r.validationRuleId)).toContain('RULE-001');
    expect(result.rules.map((r: any) => r.validationRuleId)).toContain('RULE-002');
    expect(result.rules.map((r: any) => r.validationRuleId)).toContain('RULE-003');
  });
});
