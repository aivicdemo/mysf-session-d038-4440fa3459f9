import { fetchAllUsers, type FetchAllUsersOutput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

const mockDataStore = require('../../src/platform/data-store');

describe('SCEN-875: ユーザーテーブルが空の場合、空の配列と0件の総件数を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty users array and totalCount 0 when user table is empty', async () => {
    // Setup precondition: ユーザーテーブルの全レコード = []
    mockDataStore.listRecords.mockResolvedValue([]);

    // Call fetchAllUsers without input parameters
    const result = await fetchAllUsers({});

    // Verify users field is empty array
    expect(result.users).toEqual([]);

    // Verify totalCount field is 0
    expect(result.totalCount).toBe(0);

    // Verify fetchedAt field is ISO 8601 format
    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');
    // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DDTHH:mm:ssZ
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(result.fetchedAt)).toBe(true);
  });
});
