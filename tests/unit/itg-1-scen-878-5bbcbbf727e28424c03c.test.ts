import { fetchUserPermissions } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

const mockDataStore = require('../../src/platform/data-store');

describe('SCEN-878: 指定ユーザーが有効でかつ複数の権限を保有する場合、有効な権限レコード一覧と件数と取得日時を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return valid permissions filtered by validFlag=true for specified user', async () => {
    // Setup precondition: userId and user permissions table state
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const mockPermissions = [
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        permissionId: '660e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        permissionCode: 'VIEW_INVOICE',
        permissionName: '請求書閲覧',
        description: '請求書情報の閲覧権限',
        validFlag: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440099',
        updatedBy: '550e8400-e29b-41d4-a716-446655440099',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440002',
        permissionId: '660e8400-e29b-41d4-a716-446655440002',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        permissionCode: 'EDIT_INVOICE',
        permissionName: '請求書編集',
        description: '請求書情報の編集権限',
        validFlag: true,
        createdAt: '2026-01-02T10:00:00Z',
        updatedAt: '2026-01-02T10:00:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440099',
        updatedBy: '550e8400-e29b-41d4-a716-446655440099',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440003',
        permissionId: '660e8400-e29b-41d4-a716-446655440003',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        permissionCode: 'DELETE_INVOICE',
        permissionName: '請求書削除',
        description: '請求書情報の削除権限',
        validFlag: false,
        createdAt: '2026-01-03T10:00:00Z',
        updatedAt: '2026-01-03T15:00:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440099',
        updatedBy: '550e8400-e29b-41d4-a716-446655440099',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(mockPermissions);

    // Call fetchUserPermissions with specified userId
    const result = await fetchUserPermissions({ userId });

    // Verify permissions contains only validFlag=true records (2 records)
    expect(result.permissions).toHaveLength(2);
    expect(result.permissions.map((p) => p.permissionCode)).toEqual([
      'VIEW_INVOICE',
      'EDIT_INVOICE',
    ]);

    // Verify totalCount is 2
    expect(result.totalCount).toBe(2);

    // Verify fetchedAt is ISO 8601 format
    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(result.fetchedAt)).toBe(true);

    // Verify DELETE_INVOICE permission (validFlag=false) is not included
    expect(result.permissions.some((p) => p.permissionCode === 'DELETE_INVOICE')).toBe(false);
  });
});
