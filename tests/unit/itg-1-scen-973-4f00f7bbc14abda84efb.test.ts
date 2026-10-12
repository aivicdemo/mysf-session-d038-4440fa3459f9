import { deleteRecord, DataStoreOperationError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  deleteRecord: jest.fn(),
}));

describe('SCEN-973: データストアの削除操作がシステムエラーで失敗した場合、DataStoreOperationErrorが発生する', () => {
  it('deleteRecord の呼び出し先データストア削除操作がシステムエラーで失敗したとき、DataStoreOperationError をスロー', async () => {
    const targetTableName = '取引先';
    const targetRecordId = '550e8400-e29b-41d4-a716-446655440000';
    const errorMessage = 'Connection timeout: failed to connect to database';

    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    const mockDeleteRecord = dataStore.deleteRecord as jest.MockedFunction<typeof dataStore.deleteRecord>;

    mockListRecords.mockResolvedValue([{
      id: targetRecordId,
      '取引先ID': targetRecordId,
      '取引先名': 'テスト取引先A',
      '取引先名カナ': 'テストトリヒキサキエー',
      '取引先区分': '顧客',
      '郵便番号': '100-0001',
      '住所': '東京都千代田区丸の内',
      '電話番号': '03-1234-5678',
      'メールアドレス': 'contact@test-a.jp',
      '担当者名': '山田太郎',
      '支払条件': '月末締め翌月末払い',
      '請求先住所': '東京都千代田区丸の内',
      '請求先メールアドレス': 'billing@test-a.jp',
      'ステータス': '有効',
      'createdAt': '2024-01-15T10:00:00Z',
      'updatedAt': '2024-01-15T10:00:00Z',
      '作成者': 'user001',
      '更新者': 'user001',
    } as any]);

    mockDeleteRecord.mockRejectedValue(new Error(errorMessage));

    try {
      await deleteRecord({ targetTableName, targetRecordId });
      fail('DataStoreOperationError should have been thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(DataStoreOperationError);
      expect((error as DataStoreOperationError).message).toBe(
        'レコード削除に失敗しました。テーブル: 取引先, ID: 550e8400-e29b-41d4-a716-446655440000, エラー詳細: Connection timeout: failed to connect to database'
      );
    }
  });
});
