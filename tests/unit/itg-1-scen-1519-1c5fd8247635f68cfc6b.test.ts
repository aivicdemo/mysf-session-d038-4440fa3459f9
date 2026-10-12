import { fetchActivitiesByRepresentative, FetchActivitiesByRepresentativeInput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1519: 営業活動が0件の場合、正常に完了して空の結果セットを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業担当者が存在し営業活動が0件のとき、空配列が返される', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const salesRepresentatives = [
      {
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
        name: '山田太郎',
        emailAddress: 'yamada@example.com',
        phoneNumber: '090-1234-5678',
        department: '営業部',
        jobTitle: '営業課長',
        supervisorId: '660e8400-e29b-41d4-a716-446655440001',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockImplementation(async (tableName: string) => {
      if (tableName === 'SalesRepresentative') {
        return salesRepresentatives;
      }
      if (tableName === 'Activity') {
        return [];
      }
      return [];
    });

    const input: FetchActivitiesByRepresentativeInput = { salesRepresentativeId };
    const result = await fetchActivitiesByRepresentative(input);

    expect(result.activities).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');
  });
});
