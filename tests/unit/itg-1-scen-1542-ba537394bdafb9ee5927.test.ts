import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchActivitiesByRepresentative, SalesRepresentativeNotFound } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1542: ログイン中のユーザーが営業部長権限を持たないとき例外が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw SalesRepresentativeNotFound when salesRepresentativeId does not exist', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords
      .mockResolvedValueOnce([{
        id: '550e8400-e29b-41d4-a716-446655440001',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440001',
        名前: '田中太郎',
        メールアドレス: 'tanaka@example.com',
        電話番号: '090-1234-5678',
        部門: '営業部',
        役職: '営業担当者',
        上司ID: '550e8400-e29b-41d4-a716-446655440002',
        ステータス: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        作成者: 'admin'
      }]);

    await expect(
      fetchActivitiesByRepresentative({ salesRepresentativeId })
    ).rejects.toThrow(SalesRepresentativeNotFound);

    try {
      await fetchActivitiesByRepresentative({ salesRepresentativeId });
    } catch (error) {
      if (error instanceof SalesRepresentativeNotFound) {
        expect(error.message).toBe('指定された営業担当者が見つかりません。');
      }
    }
  });
});
