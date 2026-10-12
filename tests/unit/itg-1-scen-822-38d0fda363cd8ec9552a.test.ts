import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-822: 営業担当者が存在し、営業活動が0件の場合、空の一覧を返す', () => {
  const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';
  const salesRepData = {
    salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440000',
    name: '山田太郎',
    emailAddress: 'yamada@example.com',
    phoneNumber: '09012345678',
    department: '営業部',
    jobTitle: '営業課長',
    supervisorId: '550e8400-e29b-41d4-a716-446655440001',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'admin',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty activities list when representative has no activities', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords.mockImplementation((tableName: string) => {
      if (tableName === 'salesRepresentatives') {
        return Promise.resolve([salesRepData]);
      }
      if (tableName === 'activities') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    const result = await fetchActivitiesByRepresentative({ salesRepresentativeId });

    expect(result.activities).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
