import { fetchUserPermissions } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-880: ユーザー権限取得 - 有効フラグでフィルタリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('有効フラグがtrueのみを返す', async () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';

    const mockPermissionRecords = [
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        permissionId: '660e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        permissionCode: 'INVOICE_VIEW',
        permissionName: '請求書閲覧',
        description: '請求書の閲覧権限',
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
        permissionCode: 'INVOICE_EDIT',
        permissionName: '請求書編集',
        description: '請求書の編集権限',
        validFlag: false,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-15T14:30:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440099',
        updatedBy: '550e8400-e29b-41d4-a716-446655440099',
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440003',
        permissionId: '660e8400-e29b-41d4-a716-446655440003',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        permissionCode: 'INVOICE_DELETE',
        permissionName: '請求書削除',
        description: '請求書の削除権限',
        validFlag: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440099',
        updatedBy: '550e8400-e29b-41d4-a716-446655440099',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce(
      mockPermissionRecords
    );

    const result = await fetchUserPermissions({ userId });

    expect(result.permissions).toHaveLength(2);
    expect(result.permissions[0].permissionCode).toBe('INVOICE_VIEW');
    expect(result.permissions[1].permissionCode).toBe('INVOICE_DELETE');
    expect(result.totalCount).toBe(2);
    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');
  });
});
