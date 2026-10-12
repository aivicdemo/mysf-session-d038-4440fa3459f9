import { deleteRecord } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  deleteRecord: jest.fn(),
}));

describe('SCEN-962: deleteRecord - ユーザーレコード削除', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('存在するユーザーレコードを指定IDで削除すると、削除成功を示す出力が返される', async () => {
    const targetTableName = 'ユーザー';
    const targetRecordId = '550e8400-e29b-41d4-a716-446655440000';

    const mockRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      ユーザーID: '550e8400-e29b-41d4-a716-446655440000',
      ログインID: 'user001',
      パスワードハッシュ: 'hashed_password_value',
      ユーザー名: '営業太郎',
      メールアドレス: 'taro@example.com',
      ロール: '営業',
      営業担当者ID: '660e8400-e29b-41d4-a716-446655440001',
      有効フラグ: true,
      最終ログイン日時: '2025-01-15T10:30:00Z',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-15T10:30:00Z',
      作成者: '550e8400-e29b-41d4-a716-446655440099',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([mockRecord]);
    (dataStore.deleteRecord as jest.Mock).mockResolvedValue(undefined);

    const result = await deleteRecord({
      targetTableName,
      targetRecordId,
    });

    expect(result.targetTableName).toBe('ユーザー');
    expect(result.targetRecordId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.success).toBe(true);
    expect(typeof result.deletedAt).toBe('string');

    // ISO 8601 形式の確認
    const deletedDate = new Date(result.deletedAt);
    expect(deletedDate.toString()).not.toBe('Invalid Date');

    // deleteRecord が呼ばれたことを確認
    expect(dataStore.deleteRecord).toHaveBeenCalledWith(targetTableName, targetRecordId);
  });
});
