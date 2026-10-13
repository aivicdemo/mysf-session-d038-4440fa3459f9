import { generateMappingTable, ProjectNotFoundError } from '../../src/logic/mapping-generation-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));
jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn(),
}));

describe('SCEN-031: ProjectNotFoundError', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440000';
  const targetSystemId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = '770e8400-e29b-41d4-a716-446655440002';
  const executionTimestamp = 1704067200000;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ProjectNotFoundError when project context resolution fails due to invalid or missing project', async () => {
    const mockAuthResult = {
      isAuthorized: true,
      userId,
      operationType: 'mapping_generation',
      projectId,
    };

    const mockProjectContextError = new ProjectNotFoundError(
      '指定されたプロジェクトが見つかりません。プロジェクトIDを確認してください。'
    );

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(
      mockAuthResult
    );
    (projectContextModule.resolveProjectContext as jest.Mock).mockRejectedValue(
      mockProjectContextError
    );

    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await expect(generateMappingTable(input)).rejects.toThrow(ProjectNotFoundError);
    await expect(generateMappingTable(input)).rejects.toThrow(
      '指定されたプロジェクトが見つかりません。プロジェクトIDを確認してください。'
    );
  });
});
