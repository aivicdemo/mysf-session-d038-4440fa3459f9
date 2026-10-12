import { fetchActivitiesByRepresentative, DataStoreError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1548: fetchActivitiesByRepresentative - DataStoreError on activity table read failure', () => {
  const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError when activity table read fails', async () => {
    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;

    // Mock sales representative table to return valid data
    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === '営業担当者') {
        return Promise.resolve([
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
            作成日時: '2024-01-01T00:00:00Z',
            更新日時: '2024-01-01T00:00:00Z',
            作成者: 'admin',
          },
        ]);
      }
      // Simulate activity table read failure
      if (tableName === '営業活動') {
        return Promise.reject(new DataStoreError('営業活動データの取得に失敗しました。'));
      }
      return Promise.resolve([]);
    });

    await expect(
      fetchActivitiesByRepresentative({ salesRepresentativeId })
    ).rejects.toThrow(DataStoreError);

    await expect(
      fetchActivitiesByRepresentative({ salesRepresentativeId })
    ).rejects.toThrow('営業活動データの取得に失敗しました。');
  });
});
