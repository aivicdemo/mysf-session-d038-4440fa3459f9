import { resolveProjectContext, ResolveProjectContextInput, UserProjectAccessDeniedException } from '../../src/logic/project-context-resolver';

describe('SCEN-325: resolveProjectContext - User lacks access permission to the project', () => {
  it('should throw UserProjectAccessDeniedException when user does not have access to project', async () => {
    const input: ResolveProjectContextInput = {
      userId: '550e8400-e29b-41d4-a716-446655440001',
      projectId: '550e8400-e29b-41d4-a716-446655440002',
      targetSystemId: '550e8400-e29b-41d4-a716-446655440003',
      userRecord: {
        userId: '550e8400-e29b-41d4-a716-446655440001',
        role: 'Analyst',
        status: 'active',
      },
      projectRecord: {
        projectId: '550e8400-e29b-41d4-a716-446655440002',
        status: 'active',
        projectManager: '550e8400-e29b-41d4-a716-446655440010',
      },
      targetSystemRecord: {
        targetSystemId: '550e8400-e29b-41d4-a716-446655440003',
        projectId: '550e8400-e29b-41d4-a716-446655440002',
        status: 'active',
      },
    };

    await expect(resolveProjectContext(input)).rejects.toThrow(UserProjectAccessDeniedException);
    await expect(resolveProjectContext(input)).rejects.toThrow('このプロジェクトへのアクセス権がありません。');
  });
});
