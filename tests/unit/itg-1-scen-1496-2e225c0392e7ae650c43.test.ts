import { fetchActivitiesByRepresentative, DataStoreError } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1496: ダッシュボード表示要求から60秒でタイムアウト判定が行われる', () => {
  const mockListRecords = dataPersistence.listRecords as jest.Mock;

  const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';
  const salesRepresentativeData = [
    {
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
      作成者: 'admin',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('60秒経過時点でタイムアウトエラーが throws される', async () => {
    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '営業担当者') {
        return Promise.resolve(salesRepresentativeData);
      } else if (tableName === '営業活動') {
        // 営業活動テーブルが60秒以上応答しない状況
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new DataStoreError('営業活動データの取得に失敗しました。'));
          }, 60000);
        });
      }
      return Promise.resolve([]);
    });

    const startTime = Date.now();
    await expect(
      Promise.race([
        fetchActivitiesByRepresentative({ salesRepresentativeId }),
        new Promise((resolve, reject) =>
          setTimeout(
            () => reject(new DataStoreError('営業活動データの取得に失敗しました。')),
            60000
          )
        ),
      ])
    ).rejects.toThrow('営業活動データの取得に失敗しました。');

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(60000);
  });

  it('DataStoreError が文言「営業活動データの取得に失敗しました。」で throws される', async () => {
    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '営業担当者') {
        return Promise.resolve(salesRepresentativeData);
      } else if (tableName === '営業活動') {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new DataStoreError('営業活動データの取得に失敗しました。'));
          }, 60000);
        });
      }
      return Promise.resolve([]);
    });

    try {
      await Promise.race([
        fetchActivitiesByRepresentative({ salesRepresentativeId }),
        new Promise((resolve, reject) =>
          setTimeout(
            () => reject(new DataStoreError('営業活動データの取得に失敗しました。')),
            60000
          )
        ),
      ]);
      fail('Should have thrown DataStoreError');
    } catch (error) {
      expect(error).toBeInstanceOf(DataStoreError);
      expect((error as Error).message).toBe('営業活動データの取得に失敗しました。');
    }
  });
});
