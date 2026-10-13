import { resolveProjectContext, ResolveProjectContextInput, InsufficientRolePermissionException } from '../../src/logic/project-context-resolver';

describe('SCEN-322: resolveProjectContext - User role lacks permission for mapping operations', () => {
  it('should throw InsufficientRolePermissionException when user role is Viewer', async () => {
    const input: ResolveProjectContextInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '660e8400-e29b-41d4-a716-446655440001',
      targetSystemId: '770e8400-e29b-41d4-a716-446655440002',
      userRecord: {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'Viewer',
        status: 'active',
      },
      projectRecord: {
        projectId: '660e8400-e29b-41d4-a716-446655440001',
        status: 'active',
      },
      targetSystemRecord: {
        targetSystemId: '770e8400-e29b-41d4-a716-446655440002',
        migrationProjectId: '660e8400-e29b-41d4-a716-446655440001',
        status: 'active',
      },
    };

    await expect(resolveProjectContext(input)).rejects.toThrow(InsufficientRolePermissionException);
    await expect(resolveProjectContext(input)).rejects.toThrow('このユーザーロールには機能マッピング操作の権限がありません。');
  });
});
