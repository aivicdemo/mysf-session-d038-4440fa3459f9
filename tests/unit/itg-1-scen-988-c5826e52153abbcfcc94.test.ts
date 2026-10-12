import { loadActiveValidationRules, InvalidTargetTableSpecified } from '../../src/logic/validation-rule-engine';

describe('SCEN-988: targetTableが空文字列のとき、対象テーブル名が指定されていないか不正です例外を発生させる', () => {
  it('should throw InvalidTargetTableSpecified error when targetTable is empty string', async () => {
    const input = {
      targetTable: '',
      targetColumn: null,
      currentDateTime: new Date('2026-10-07T10:00:00Z'),
    };

    await expect(loadActiveValidationRules(input)).rejects.toThrow(InvalidTargetTableSpecified);
    await expect(loadActiveValidationRules(input)).rejects.toThrow('対象テーブル名が指定されていないか不正です。');
  });
});
