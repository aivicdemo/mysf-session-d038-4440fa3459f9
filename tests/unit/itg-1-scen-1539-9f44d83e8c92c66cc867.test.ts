import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchActivitiesByRepresentative, SalesRepresentativeNotFound, DataStoreError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1539: ダッシュボード表示要求のタイムスタンプが現在時刻より未来のとき例外が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error when timestamp is in the future', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords
      .mockResolvedValueOnce([{
        id: '550e8400-e29b-41d4-a716-446655440000',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        名前: '山田太郎',
        メールアドレス: 'yamada@example.com',
        電話番号: '09012345678',
        部門: '営業部',
        役職: '営業課長',
        上司ID: '550e8400-e29b-41d4-a716-446655440001',
        ステータス: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        作成者: 'admin'
      }])
      .mockResolvedValueOnce([{
        id: '660e8400-e29b-41d4-a716-446655440000',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440000',
        取引先ID: '770e8400-e29b-41d4-a716-446655440000',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        活動種別: '電話',
        活動日時: '2024-01-15T10:30:00Z',
        活動内容: '提案内容についての確認',
        次回フォローアップ予定日: '2024-01-20T00:00:00Z',
        商談ステージ: '提案',
        見積金額: 500000,
        成約フラグ: false,
        createdAt: '2024-01-15T11:00:00Z',
        updatedAt: '2024-01-15T11:00:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440000',
        更新者ID: '550e8400-e29b-41d4-a716-446655440000',
        商談ID: '880e8400-e29b-41d4-a716-446655440000',
        活動時間: 30,
        活動件数: 1,
        活動頻度: '週1回',
        活動結果: '継続検討',
        次のアクション: '見積書送付'
      }]);

    await expect(
      fetchActivitiesByRepresentative({ salesRepresentativeId })
    ).rejects.toThrow();
  });
});
