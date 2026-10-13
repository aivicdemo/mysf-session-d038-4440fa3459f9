import { resolveProjectContext, ResolveProjectContextInput, UserAccountInactiveException } from '../../src/logic/project-context-resolver';

describe('SCEN-321: resolveProjectContext - User account status is inactive', () => {
  it('should throw UserAccountInactiveException when userRecord status is INACTIVE', async () => {
    const input: ResolveProjectContextInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '650e8400-e29b-41d4-a716-446655440001',
      targetSystemId: '750e8400-e29b-41d4-a716-446655440002',
      userRecord: {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'Analyst',
        status: 'INACTIVE',
      },
      projectRecord: {
        projectId: '650e8400-e29b-41d4-a716-446655440001',
        status: 'ACTIVE',
      },
      targetSystemRecord: {
        targetSystemId: '750e8400-e29b-41d4-a716-446655440002',
        projectId: '650e8400-e29b-41d4-a716-446655440001',
        status: 'ACTIVE',
      },
    };

    await expect(resolveProjectContext(input)).rejects.toThrow(UserAccountInactiveException);
    await expect(resolveProjectContext(input)).rejects.toThrow('ユーザーアカウントが無効です。管理者に連絡してください。');
  });
});
