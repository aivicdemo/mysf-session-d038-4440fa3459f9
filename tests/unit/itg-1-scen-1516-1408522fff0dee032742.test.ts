import { fetchActivitiesByRepresentative, DataStoreError, type FetchActivitiesByRepresentativeInput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1516: 請求書期日が不正な日付形式のとき例外が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError when activity has invalid date format', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    // Mock data-store to return sales representative and activities with invalid date
    const mockSalesRepresentativeRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
      名前: '山田太郎',
      メールアドレス: 'yamada@example.com',
      電話番号: '09012345678',
      部門: '営業部',
      役職: '営業課長',
      上司ID: '660e8400-e29b-41d4-a716-446655440001',
      ステータス: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      作成者: 'admin',
    };

    const mockActivityRecord = {
      id: '770e8400-e29b-41d4-a716-446655440002',
      営業活動ID: '770e8400-e29b-41d4-a716-446655440002',
      取引先ID: '880e8400-e29b-41d4-a716-446655440003',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
      活動種別: '電話営業',
      活動日時: '2024-06-15T14:30:00Z',
      活動内容: '商品説明',
      次回フォローアップ予定日: '2024-13-40T10:00:00Z', // Invalid date: month 13, day 40
      商談ステージ: '提案中',
      見積金額: 500000,
      成約フラグ: false,
      作成日時: '2024-06-15T14:30:00Z',
      作成者ID: '550e8400-e29b-41d4-a716-446655440000',
      更新日時: '2024-06-15T14:30:00Z',
      更新者ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '990e8400-e29b-41d4-a716-446655440004',
      活動時間: 30,
      活動件数: 1,
      活動頻度: '週1回',
      活動結果: '好感触',
      次のアクション: '提案資料送付',
    };

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '営業担当者') {
        return Promise.resolve([mockSalesRepresentativeRecord]);
      }
      if (tableName === '営業活動') {
        return Promise.resolve([mockActivityRecord]);
      }
      return Promise.resolve([]);
    });

    const input: FetchActivitiesByRepresentativeInput = {
      salesRepresentativeId,
    };

    // Expects DataStoreError with message about failed data retrieval
    await expect(fetchActivitiesByRepresentative(input)).rejects.toThrow(DataStoreError);
  });
});
