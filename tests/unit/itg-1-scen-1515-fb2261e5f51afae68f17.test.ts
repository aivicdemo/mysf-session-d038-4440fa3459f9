import { fetchActivitiesByRepresentative, DealAmountInvalid, type FetchActivitiesByRepresentativeInput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1515: 商談金額が0以下のとき例外が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DealAmountInvalid when activity has negative deal amount', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    // Mock data-store to return sales representative and activities
    const mockSalesRepresentativeRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
      名前: '山田太郎',
      メールアドレス: 'yamada@example.com',
      電話番号: '09012345678',
      部門: '営業部',
      役職: '営業課長',
      上司ID: '550e8400-e29b-41d4-a716-446655440001',
      ステータス: 'active',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      作成者: 'admin',
    };

    const mockActivityRecord = {
      id: '660e8400-e29b-41d4-a716-446655440001',
      営業活動ID: '660e8400-e29b-41d4-a716-446655440001',
      取引先ID: '770e8400-e29b-41d4-a716-446655440001',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
      活動種別: '電話',
      活動日時: '2025-01-15T10:30:00Z',
      活動内容: '顧客ヒアリング',
      次回フォローアップ予定日: '2025-01-22T00:00:00Z',
      商談ステージ: '提案',
      見積金額: -50000,
      成約フラグ: false,
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-15T10:30:00Z',
      作成者ID: '550e8400-e29b-41d4-a716-446655440000',
      更新者ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '880e8400-e29b-41d4-a716-446655440001',
      活動時間: 30,
      活動件数: 1,
      活動頻度: 'weekly',
      活動結果: '継続検討',
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

    await expect(fetchActivitiesByRepresentative(input)).rejects.toThrow(DealAmountInvalid);
  });
});
