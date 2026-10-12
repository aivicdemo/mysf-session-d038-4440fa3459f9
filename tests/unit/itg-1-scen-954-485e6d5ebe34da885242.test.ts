import { deleteRecord } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-954: 取引先レコード削除', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('存在する取引先レコードを指定IDで削除すると、削除成功を示す出力が返される', async () => {
    const mockCustomerRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      取引先ID: '550e8400-e29b-41d4-a716-446655440000',
      取引先名: '株式会社ABC商事',
      取引先名カナ: 'カブシキガイシャエービーシーショウジ',
      取引先区分: '顧客',
      郵便番号: '100-0001',
      住所: '東京都千代田区丸の内1-1-1',
      電話番号: '03-1234-5678',
      メールアドレス: 'info@abc-shouji.jp',
      担当者名: '田中太郎',
      支払条件: '末日払い',
      請求先住所: '東京都千代田区丸の内1-1-1',
      請求先メールアドレス: 'billing@abc-shouji.jp',
      ステータス: '有効',
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2025-01-15T15:30:00Z',
      作成者: 'user001',
      更新者: 'user002',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([mockCustomerRecord])
      .mockResolvedValueOnce([]);
    (dataStore.deleteRecord as jest.Mock).mockResolvedValue(undefined);

    const result = await deleteRecord({
      targetTableName: '取引先',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.targetTableName).toBe('取引先');
    expect(result.targetRecordId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.success).toBe(true);
    expect(result.deletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/);
    expect(dataStore.deleteRecord).toHaveBeenCalledWith('取引先', '550e8400-e29b-41d4-a716-446655440000');
  });
});
