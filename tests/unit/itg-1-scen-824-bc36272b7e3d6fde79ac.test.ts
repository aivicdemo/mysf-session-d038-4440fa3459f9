import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchActivitiesByRepresentative, DataStoreError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-824: fetchActivitiesByRepresentative - DataStoreError', () => {
  const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業活動テーブルの読み取りに失敗した場合、DataStoreErrorエラーが発生する', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const mockSalesReps = [
      {
        営業担当者ID: salesRepresentativeId,
        名前: '山田太郎',
        メールアドレス: 'yamada@example.com',
        電話番号: '090-1234-5678',
        部門: '営業部',
        役職: '営業課長',
        上司ID: '660e8400-e29b-41d4-a716-446655440001',
        ステータス: 'active',
      },
    ];

    mockListRecords.mockImplementation((tableName) => {
      if (tableName === '営業担当者') {
        return Promise.resolve(mockSalesReps as any);
      }
      if (tableName === '営業活動') {
        return Promise.reject(new dataStore.DataStoreError('読み取りエラー'));
      }
      return Promise.resolve([]);
    });

    await expect(fetchActivitiesByRepresentative({ salesRepresentativeId })).rejects.toThrow(
      expect.objectContaining({
        message: '営業活動データの取得に失敗しました。',
      })
    );
  });
});
