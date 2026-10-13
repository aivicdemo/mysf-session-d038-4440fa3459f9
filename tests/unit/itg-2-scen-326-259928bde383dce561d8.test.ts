import { resolveProjectContext, TargetSystemNotFoundException } from '../../src/logic/project-context-resolver';

describe('SCEN-326: TargetSystemNotFoundException when targetSystemRecord is null', () => {
  it('should throw TargetSystemNotFoundException when targetSystemRecord is null', async () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const projectId = '660e8400-e29b-41d4-a716-446655440001';
    const targetSystemId = '770e8400-e29b-41d4-a716-446655440002';

    const userRecord = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      role: 'ProjectManager',
      status: 'active',
    };

    const projectRecord = {
      projectId: '660e8400-e29b-41d4-a716-446655440001',
      status: 'active',
      projectManager: '550e8400-e29b-41d4-a716-446655440000',
    };

    const targetSystemRecord = null;

    await expect(
      resolveProjectContext({
        userId,
        projectId,
        targetSystemId,
        userRecord,
        projectRecord,
        targetSystemRecord,
      })
    ).rejects.toThrow(TargetSystemNotFoundException);

    try {
      await resolveProjectContext({
        userId,
        projectId,
        targetSystemId,
        userRecord,
        projectRecord,
        targetSystemRecord,
      });
      fail('Expected TargetSystemNotFoundException to be thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(TargetSystemNotFoundException);
      expect((e as Error).message).toBe('指定された移行対象システムが見つかりません。');
    }
  });
});
