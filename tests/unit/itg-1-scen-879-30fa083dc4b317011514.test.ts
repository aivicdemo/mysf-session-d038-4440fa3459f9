import { fetchUserPermissions } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

const mockDataStore = require('../../src/platform/data-store');

describe('SCEN-879: 指定ユーザーが有効でかつ権限を保有していない場合、空の権限レコード一覧と件数0と取得日時を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty permissions array and totalCount 0 when user has no permissions', async () => {
    // Setup precondition: userId and user permissions table state (empty)
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    mockDataStore.listRecords.mockResolvedValue([]);

    // Call fetchUserPermissions with specified userId
    const result = await fetchUserPermissions({ userId });

    // Verify permissions is empty array
    expect(result.permissions).toEqual([]);

    // Verify totalCount is 0
    expect(result.totalCount).toBe(0);

    // Verify fetchedAt is ISO 8601 format
    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(result.fetchedAt)).toBe(true);

    // No error should be raised
  });
});
