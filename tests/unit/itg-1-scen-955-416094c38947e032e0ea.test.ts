import { deleteRecord } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-955: 営業担当者レコード削除', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('存在する営業担当者レコードを指定IDで削除すると、削除成功を示す出力が返される', async () => {
    const mockSalesRepRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
      名前: '田中太郎',
      メールアドレス: 'tanaka@example.com',
      電話番号: '09012345678',
      部門: '営業部',
      役職: '営業課長',
      上司ID: '660e8400-e29b-41d4-a716-446655440001',
      ステータス: 'active',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-15T15:30:00Z',
      作成者: 'admin',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([mockSalesRepRecord])
      .mockResolvedValueOnce([]);
    (dataStore.deleteRecord as jest.Mock).mockResolvedValue(undefined);

    const result = await deleteRecord({
      targetTableName: '営業担当者',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.targetTableName).toBe('営業担当者');
    expect(result.targetRecordId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.success).toBe(true);
    expect(result.deletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/);
    expect(dataStore.deleteRecord).toHaveBeenCalledWith('営業担当者', '550e8400-e29b-41d4-a716-446655440000');
  });
});
