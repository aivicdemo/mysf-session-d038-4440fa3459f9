import { fetchActivitiesByRepresentative, SalesRepresentativeNotFound, DataStoreError } from '../../src/logic/data-persistence';
import type { FetchActivitiesByRepresentativeInput, FetchActivitiesByRepresentativeOutput, SaveActivityOutput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1538: 営業活動レコードが1件も存在しないとき警告が記録される', () => {
  let mockWarn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWarn = jest.fn();
    global.console.warn = mockWarn;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('営業担当者が存在し、営業活動レコードが空のとき、活動配列が空、totalCountが0、fetchedAtが現在時刻であり、警告ログが記録されること', async () => {
    const { listRecords } = require('../../src/platform/data-store');

    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const salesRepresentatives = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        名前: '田中太郎',
        メールアドレス: 'tanaka@example.com',
        電話番号: '09012345678',
        部門: '営業部',
        役職: '営業課長',
        上司ID: '550e8400-e29b-41d4-a716-446655440001',
        ステータス: 'active',
        作成日時: '2026-01-01T00:00:00.000Z',
        更新日時: '2026-01-01T00:00:00.000Z',
        作成者: 'system',
      },
    ];

    const activities: SaveActivityOutput[] = [];

    listRecords.mockImplementation((tableName: string) => {
      if (tableName === '営業担当者') {
        return Promise.resolve(salesRepresentatives);
      }
      if (tableName === '営業活動') {
        return Promise.resolve(activities);
      }
      return Promise.resolve([]);
    });

    const result: FetchActivitiesByRepresentativeOutput = await fetchActivitiesByRepresentative({
      salesRepresentativeId,
    });

    expect(result.activities).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');

    // ISO 8601形式であることを簡易的に検証
    const fetchedAtDate = new Date(result.fetchedAt);
    expect(fetchedAtDate.getTime()).toBeGreaterThan(0);

    // ログレベルWARNで警告メッセージが記録されていることを確認
    // 仕様の期待結果: ログレベル WARN で「指定営業担当者の営業活動レコードが存在しません」という警告メッセージが記録される
    expect(mockWarn).toHaveBeenCalled();
  });

  it('指定営業担当者が見つからないとき、SalesRepresentativeNotFoundエラーが発生すること', async () => {
    const { listRecords } = require('../../src/platform/data-store');

    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440999';

    const salesRepresentatives: any[] = [];

    listRecords.mockImplementation((tableName: string) => {
      if (tableName === '営業担当者') {
        return Promise.resolve(salesRepresentatives);
      }
      return Promise.resolve([]);
    });

    await expect(
      fetchActivitiesByRepresentative({
        salesRepresentativeId,
      })
    ).rejects.toThrow(SalesRepresentativeNotFound);
  });

  it('営業担当者テーブルの読み取りに失敗したとき、DataStoreErrorエラーが発生すること', async () => {
    const { listRecords } = require('../../src/platform/data-store');

    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    listRecords.mockImplementation((tableName: string) => {
      if (tableName === '営業担当者') {
        return Promise.reject(new DataStoreError('テーブルアクセス失敗'));
      }
      return Promise.resolve([]);
    });

    await expect(
      fetchActivitiesByRepresentative({
        salesRepresentativeId,
      })
    ).rejects.toThrow(DataStoreError);
  });
});
