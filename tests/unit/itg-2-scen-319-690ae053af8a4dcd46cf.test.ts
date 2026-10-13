import { resolveProjectContext, ResolveProjectContextInput } from '../../src/logic/project-context-resolver';

describe('SCEN-319: resolveProjectContext - Happy path with all validations passed', () => {
  it('should return valid project context when user is authenticated, authorized, and project/system are active', async () => {
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
        projectManager: '550e8400-e29b-41d4-a716-446655440001',
      },
      targetSystemRecord: {
        systemId: '550e8400-e29b-41d4-a716-446655440003',
        migrationProjectId: '550e8400-e29b-41d4-a716-446655440002',
        status: 'active',
      },
    };

    const result = await resolveProjectContext(input);

    expect(result.projectId).toBe('550e8400-e29b-41d4-a716-446655440002');
    expect(result.targetSystemId).toBe('550e8400-e29b-41d4-a716-446655440003');
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.userRole).toBe('Analyst');
    expect(result.isContextValid).toBe(true);
  });
});
