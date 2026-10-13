import { resolveProjectContext, TargetSystemInactiveException } from '../../src/logic/project-context-resolver';

describe('SCEN-327: TargetSystemInactiveException when targetSystemRecord status is inactive', () => {
  it('should throw TargetSystemInactiveException when targetSystemRecord status is inactive', async () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const projectId = '660e8400-e29b-41d4-a716-446655440001';
    const targetSystemId = '770e8400-e29b-41d4-a716-446655440002';

    const userRecord = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      role: 'Analyst',
      status: 'active',
      authenticated: true,
    };

    const projectRecord = {
      projectId: '660e8400-e29b-41d4-a716-446655440001',
      status: 'active',
    };

    const targetSystemRecord = {
      targetSystemId: '770e8400-e29b-41d4-a716-446655440002',
      status: 'inactive',
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
    ).rejects.toThrow(TargetSystemInactiveException);

    try {
      await resolveProjectContext({
        userId,
        projectId,
        targetSystemId,
        userRecord,
        projectRecord,
        targetSystemRecord,
      });
      fail('Expected TargetSystemInactiveException to be thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(TargetSystemInactiveException);
      expect((e as Error).message).toBe('指定された移行対象システムは無効な状態です。');
    }
  });
});
