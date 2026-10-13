import { generateMappingTable, TargetSystemNotFoundError } from '../../src/logic/mapping-generation-service';
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

describe('SCEN-032: TargetSystemNotFoundError', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440000';
  const targetSystemId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = '770e8400-e29b-41d4-a716-446655440002';
  const executionTimestamp = 1704067200000;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw TargetSystemNotFoundError when target system is not found or not attached to project', async () => {
    const mockAuthResult = {
      isAuthorized: true,
      userId,
      operationType: 'mapping_generation',
      projectId,
    };

    const mockProjectContextResult = {
      projectId,
      targetSystemId,
      userId,
      userRole: 'project_manager',
      isContextValid: true,
      attachedTargetSystemIds: ['660e8400-e29b-41d4-a716-446655440010'],
    };

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(
      mockAuthResult
    );
    (projectContextModule.resolveProjectContext as jest.Mock).mockResolvedValue(
      mockProjectContextResult
    );

    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await expect(generateMappingTable(input)).rejects.toThrow(TargetSystemNotFoundError);
    await expect(generateMappingTable(input)).rejects.toThrow(
      '指定された移行対象システムが見つかりません。システムIDを確認してください。'
    );
  });
});
