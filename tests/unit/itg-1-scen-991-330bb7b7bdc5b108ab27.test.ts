import { loadActiveValidationRules } from '../../src/logic/validation-rule-engine';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-991: 該当するルール定義がない場合、ruleCountは0を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('targetTable="請求書", targetColumn=null で該当ルール定義がない場合、ruleCount=0、rules=[]を返す', async () => {
    // 前提条件: activeValidationRules が空配列
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const input = {
      targetTable: '請求書',
      targetColumn: null,
      currentDateTime: new Date('2026-10-15T10:00:00.000Z'),
    };

    const result = await loadActiveValidationRules(input);

    // ruleCountが0であることを確認
    expect(result.ruleCount).toBe(0);

    // rulesが空配列であることを確認
    expect(result.rules).toEqual([]);
    expect(result.rules).toHaveLength(0);
  });
});
