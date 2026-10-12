import { deleteRecord, InvalidTableNameError } from '../../src/logic/data-persistence';

describe('SCEN-972: 管理対象テーブルに含まれないテーブル名を指定した場合、InvalidTableNameErrorが発生する', () => {
  it('deleteRecord 関数を呼び出し、targetTableName が無効な場合に InvalidTableNameError をスロー', async () => {
    const targetTableName = 'invalid_table_name';
    const targetRecordId = '550e8400-e29b-41d4-a716-446655440000';

    try {
      await deleteRecord({ targetTableName, targetRecordId });
      fail('InvalidTableNameError should have been thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidTableNameError);
      expect((error as InvalidTableNameError).message).toBe('無効なテーブル名です: invalid_table_name');
    }
  });
});
