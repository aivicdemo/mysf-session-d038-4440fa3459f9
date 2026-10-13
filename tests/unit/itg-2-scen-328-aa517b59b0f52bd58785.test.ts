import { resolveProjectContext, ProjectSystemMismatchException } from '../../src/logic/project-context-resolver';

describe('SCEN-328: ProjectSystemMismatchException when targetSystemId does not belong to projectId', () => {
  it('should throw ProjectSystemMismatchException when targetSystemRecord.projectId does not match projectId', async () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const projectId = '660e8400-e29b-41d4-a716-446655440001';
    const targetSystemId = '770e8400-e29b-41d4-a716-446655440002';

    const userRecord = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      role: 'Analyst',
      status: 'active',
    };

    const projectRecord = {
      projectId: '660e8400-e29b-41d4-a716-446655440001',
      status: 'active',
      manager: '550e8400-e29b-41d4-a716-446655440000',
    };

    const targetSystemRecord = {
      targetSystemId: '770e8400-e29b-41d4-a716-446655440002',
      projectId: '880e8400-e29b-41d4-a716-446655440003',
      status: 'active',
    };

    await expect(
      resolveProjectContext({
        userId,
        projectId,
        targetSystemId,
        userRecord,
        projectRecord,
        targetSystemRecord,
      })
    ).rejects.toThrow(ProjectSystemMismatchException);

    try {
      await resolveProjectContext({
        userId,
        projectId,
        targetSystemId,
        userRecord,
        projectRecord,
        targetSystemRecord,
      });
      fail('Expected ProjectSystemMismatchException to be thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ProjectSystemMismatchException);
      expect((e as Error).message).toBe('指定された移行対象システムはこのプロジェクトに属していません。');
    }
  });
});
