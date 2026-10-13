import { resolveProjectContext, ResolveProjectContextInput, ProjectNotFoundException } from '../../src/logic/project-context-resolver';

describe('SCEN-323: resolveProjectContext - Project record does not exist', () => {
  it('should throw ProjectNotFoundException when projectRecord is null', async () => {
    const input: ResolveProjectContextInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '660e8400-e29b-41d4-a716-446655440111',
      targetSystemId: '770e8400-e29b-41d4-a716-446655440222',
      userRecord: {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'Analyst',
        status: 'active',
      },
      projectRecord: null,
      targetSystemRecord: {
        targetSystemId: '770e8400-e29b-41d4-a716-446655440222',
        projectId: '660e8400-e29b-41d4-a716-446655440111',
        status: 'active',
      },
    };

    await expect(resolveProjectContext(input)).rejects.toThrow(ProjectNotFoundException);
    await expect(resolveProjectContext(input)).rejects.toThrow('指定されたプロジェクトが見つかりません。');
  });
});
