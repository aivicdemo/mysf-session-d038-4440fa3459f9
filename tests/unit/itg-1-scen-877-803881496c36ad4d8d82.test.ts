import { fetchAllUsers } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

const mockDataStore = require('../../src/platform/data-store');

describe('SCEN-877: データ取得時刻がISO 8601形式で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return fetchedAt in ISO 8601 format with 2 user records', async () => {
    // Setup precondition: ユーザーテーブルの全レコード with 2 records
    const mockUsers = [
      {
        userId: '550e8400-e29b-41d4-a716-446655440001',
        loginId: 'user001',
        userName: '山田太郎',
        emailAddress: 'yamada@example.com',
        role: 'admin',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440101',
        validFlag: true,
        lastLoginDateTime: '2026-10-07T10:30:00Z',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-10-07T09:00:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
      },
      {
        userId: '550e8400-e29b-41d4-a716-446655440002',
        loginId: 'user002',
        userName: '佐藤花子',
        emailAddress: 'sato@example.com',
        role: 'sales',
        salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440102',
        validFlag: true,
        lastLoginDateTime: '2026-10-06T14:15:00Z',
        createdAt: '2026-02-15T00:00:00Z',
        updatedAt: '2026-10-06T12:00:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440000',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(mockUsers);

    // Call fetchAllUsers
    const result = await fetchAllUsers({});

    // Verify fetchedAt is in ISO 8601 format
    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');
    // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DDTHH:mm:ssZ
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(result.fetchedAt)).toBe(true);

    // Verify users array contains 2 records
    expect(result.users.length).toBe(2);
    expect(result.totalCount).toBe(2);

    // Verify user details
    expect(result.users[0].loginId).toBe('user001');
    expect(result.users[1].loginId).toBe('user002');
  });
});
