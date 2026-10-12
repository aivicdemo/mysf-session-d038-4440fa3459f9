import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1549: fetchActivitiesByRepresentative - returns activities sorted by activityDateTime descending', () => {
  const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return activities sorted by activityDateTime in descending order', async () => {
    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;

    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '営業担当者') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
            名前: '田中太郎',
            メールアドレス: 'tanaka@example.com',
            電話番号: '090-1234-5678',
            部門: '営業部',
            役職: '営業課長',
            上司ID: '660e8400-e29b-41d4-a716-446655440001',
            ステータス: 'active',
            createdAt: '2024-01-15T09:00:00.000Z',
            updatedAt: '2024-01-15T09:00:00.000Z',
            作成者: 'admin',
          },
        ]);
      }
      if (tableName === '営業活動') {
        return Promise.resolve([
          {
            id: '770e8400-e29b-41d4-a716-446655440002',
            営業活動ID: '770e8400-e29b-41d4-a716-446655440002',
            取引先ID: '880e8400-e29b-41d4-a716-446655440003',
            営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
            活動種別: '訪問',
            活動日時: '2024-06-15T14:30:00.000Z',
            活動内容: '製品デモンストレーション実施',
            次回フォローアップ予定日: '2024-06-22T10:00:00.000Z',
            商談ステージ: '提案',
            見積金額: 500000,
            成約フラグ: false,
            createdAt: '2024-06-15T14:35:00.000Z',
            updatedAt: '2024-06-15T14:35:00.000Z',
            作成日時: '2024-06-15T14:35:00.000Z',
            作成者ID: '550e8400-e29b-41d4-a716-446655440000',
            更新日時: '2024-06-15T14:35:00.000Z',
            更新者ID: '550e8400-e29b-41d4-a716-446655440000',
            商談ID: '990e8400-e29b-41d4-a716-446655440004',
            活動時間: 120,
            活動件数: 1,
            活動頻度: '週1回',
            活動結果: '成功',
            次のアクション: '見積提出待ち',
          },
          {
            id: 'aa0e8400-e29b-41d4-a716-446655440005',
            営業活動ID: 'aa0e8400-e29b-41d4-a716-446655440005',
            取引先ID: 'bb0e8400-e29b-41d4-a716-446655440006',
            営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
            活動種別: '電話',
            活動日時: '2024-06-10T10:15:00.000Z',
            活動内容: 'ニーズヒアリング',
            次回フォローアップ予定日: '2024-06-17T14:00:00.000Z',
            商談ステージ: 'ヒアリング',
            見積金額: 300000,
            成約フラグ: false,
            createdAt: '2024-06-10T10:20:00.000Z',
            updatedAt: '2024-06-10T10:20:00.000Z',
            作成日時: '2024-06-10T10:20:00.000Z',
            作成者ID: '550e8400-e29b-41d4-a716-446655440000',
            更新日時: '2024-06-10T10:20:00.000Z',
            更新者ID: '550e8400-e29b-41d4-a716-446655440000',
            商談ID: 'cc0e8400-e29b-41d4-a716-446655440007',
            活動時間: 45,
            活動件数: 1,
            活動頻度: '月2回',
            活動結果: '成功',
            次のアクション: '資料送付',
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const result = await fetchActivitiesByRepresentative({ salesRepresentativeId });

    expect(result.activities).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.fetchedAt).toBeDefined();

    // Verify activities are sorted by activityDateTime in descending order
    expect(result.activities[0].activityId).toBe('770e8400-e29b-41d4-a716-446655440002');
    expect(result.activities[0].activityDateTime).toBe('2024-06-15T14:30:00.000Z');

    expect(result.activities[1].activityId).toBe('aa0e8400-e29b-41d4-a716-446655440005');
    expect(result.activities[1].activityDateTime).toBe('2024-06-10T10:15:00.000Z');

    // Verify fetchedAt is ISO 8601 format
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});
