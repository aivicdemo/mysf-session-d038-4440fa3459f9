import { loadActiveValidationRules } from '../../src/logic/validation-rule-engine';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-990: 取得されたルール定義の件数がruleCountとして正確に返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('targetTable="請求書", targetColumn="金額"のルール定義が2件返される', async () => {
    const mockRules = [
      {
        id: 'RULE-001',
        ruleId: 'RULE-001',
        targetTable: '請求書',
        targetColumn: '金額',
        validationLogic: 'amount > 0',
        appliedStartDate: '2026-01-01',
        appliedEndDate: '2026-12-31',
        isActive: true,
      },
      {
        id: 'RULE-002',
        ruleId: 'RULE-002',
        targetTable: '請求書',
        targetColumn: '金額',
        validationLogic: 'amount <= 9999999',
        appliedStartDate: '2026-01-01',
        appliedEndDate: '2026-12-31',
        isActive: true,
      },
      {
        id: 'RULE-003',
        ruleId: 'RULE-003',
        targetTable: '請求書',
        targetColumn: '対象外カラム',
        validationLogic: 'someRule',
        appliedStartDate: '2026-01-01',
        appliedEndDate: '2026-12-31',
        isActive: true,
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockRules);

    const input = {
      targetTable: '請求書',
      targetColumn: '金額',
      currentDateTime: new Date('2026-06-15T10:30:00Z'),
    };

    const result = await loadActiveValidationRules(input);

    // ruleCountが2であることを確認
    expect(result.ruleCount).toBe(2);

    // rulesが配列で2件含まれていることを確認
    expect(result.rules).toHaveLength(2);

    // RULE-001と RULE-002が含まれていることを確認
    const ruleIds = result.rules.map((rule) => rule.validationRuleId);
    expect(ruleIds).toContain('RULE-001');
    expect(ruleIds).toContain('RULE-002');

    // targetColumnが"対象外カラム"のRULE-003は除外されていることを確認
    expect(ruleIds).not.toContain('RULE-003');

    // 各ルールが正しいテーブルとカラムで構成されていることを確認
    result.rules.forEach((rule) => {
      expect(rule.targetTable).toBe('請求書');
      expect(rule.targetColumn).toBe('金額');
    });
  });
});
