import { resolveProjectContext, ResolveProjectContextInput, UserNotAuthenticatedException } from '../../src/logic/project-context-resolver';

describe('SCEN-320: resolveProjectContext - User record does not exist', () => {
  it('should throw UserNotAuthenticatedException when userRecord is null', async () => {
    const input: ResolveProjectContextInput = {
      userId: '550e8400-e29b-41d4-a716-446655440001',
      projectId: '550e8400-e29b-41d4-a716-446655440002',
      targetSystemId: '550e8400-e29b-41d4-a716-446655440003',
      userRecord: null,
      projectRecord: {
        projectId: '550e8400-e29b-41d4-a716-446655440002',
        status: 'active',
      },
      targetSystemRecord: {
        systemId: '550e8400-e29b-41d4-a716-446655440003',
        migrationProjectId: '550e8400-e29b-41d4-a716-446655440002',
        status: 'active',
      },
    };

    await expect(resolveProjectContext(input)).rejects.toThrow(UserNotAuthenticatedException);
    await expect(resolveProjectContext(input)).rejects.toThrow('ユーザーが認証されていません。ログインしてください。');
  });
});
