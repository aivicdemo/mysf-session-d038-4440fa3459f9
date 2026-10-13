import { resolveProjectContext, ResolveProjectContextInput, ProjectInactiveException } from '../../src/logic/project-context-resolver';

describe('SCEN-324: resolveProjectContext - Project status is inactive', () => {
  it('should throw ProjectInactiveException when projectRecord status is inactive', async () => {
    const input: ResolveProjectContextInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '660e8400-e29b-41d4-a716-446655440001',
      targetSystemId: '770e8400-e29b-41d4-a716-446655440002',
      userRecord: {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'Analyst',
        status: 'active',
      },
      projectRecord: {
        projectId: '660e8400-e29b-41d4-a716-446655440001',
        status: 'inactive',
      },
      targetSystemRecord: {
        targetSystemId: '770e8400-e29b-41d4-a716-446655440002',
        projectId: '660e8400-e29b-41d4-a716-446655440001',
        status: 'active',
      },
    };

    await expect(resolveProjectContext(input)).rejects.toThrow(ProjectInactiveException);
    await expect(resolveProjectContext(input)).rejects.toThrow('指定されたプロジェクトは無効な状態です。');
  });
});
