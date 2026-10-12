import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1512: 請求金額がマイナス値のとき例外が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('見積金額がマイナス値の場合、例外が発生する', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const salesRepresentatives = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        名前: '山田太郎',
        メールアドレス: 'yamada@example.com',
        電話番号: '090-1234-5678',
        部門: '営業部',
        役職: '営業課長',
        上司ID: '550e8400-e29b-41d4-a716-446655440001',
        ステータス: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        作成者: 'admin',
      },
    ];

    const activities = [
      {
        id: '660e8400-e29b-41d4-a716-446655440000',
        営業活動ID: '660e8400-e29b-41d4-a716-446655440000',
        取引先ID: '770e8400-e29b-41d4-a716-446655440000',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        活動種別: '訪問',
        活動日時: '2026-01-15T10:30:00Z',
        活動内容: '商品説明',
        次回フォローアップ予定日: '2026-02-01T00:00:00Z',
        商談ステージ: '提案',
        見積金額: -50000,
        成約フラグ: false,
        createdAt: '2026-01-15T10:30:00Z',
        updatedAt: '2026-01-15T10:30:00Z',
        作成日時: '2026-01-15T10:30:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440000',
        更新日時: '2026-01-15T10:30:00Z',
        更新者ID: '550e8400-e29b-41d4-a716-446655440000',
        商談ID: '880e8400-e29b-41d4-a716-446655440000',
        活動時間: 60,
        活動件数: 1,
        活動頻度: '初回',
        活動結果: '良好',
        次のアクション: '提案資料送付',
      },
    ];

    (dataPersistence.listRecords as jest.Mock)
      .mockResolvedValueOnce(salesRepresentatives)
      .mockResolvedValueOnce(activities);

    await expect(
      fetchActivitiesByRepresentative({ salesRepresentativeId })
    ).rejects.toThrow();
  });
});
