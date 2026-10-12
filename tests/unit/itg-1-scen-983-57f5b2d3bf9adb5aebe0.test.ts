import { loadActiveValidationRules } from '../../src/logic/validation-rule-engine';

describe('SCEN-983: 指定したテーブルとカラムの両方に一致し、現在日時が有効期間内のルール定義のみを抽出', () => {
  it('現在日時が有効期間内のルール定義のみを返す', async () => {
    const result = await loadActiveValidationRules({
      targetTable: '請求書',
      targetColumn: '金額',
      currentDateTime: new Date('2026-06-15T10:30:00Z'),
    });

    expect(result.ruleCount).toBe(2);
    expect(result.rules).toHaveLength(2);
    expect(result.rules.map((r: any) => r.validationRuleId)).toEqual(['rule-001', 'rule-002']);
  });
});
