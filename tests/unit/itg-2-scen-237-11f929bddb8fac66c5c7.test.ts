import { searchMappingsByCondition, InvalidProjectContextError } from '../../src/logic/mapping-query-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectModule from '../../src/logic/project-context-resolver';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');

describe('SCEN-237: InvalidProjectContextError when project or target system is invalid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidProjectContextError when projectId does not exist', async () => {
    const mockAuthModule = jest.mocked(authModule);
    const mockProjectModule = jest.mocked(projectModule);

    mockAuthModule.verifyUserAuthenticationAndAuthorization.mockResolvedValue({
      isAuthorized: true,
      userId: 'user-123',
      operationType: 'search_mapping',
      projectId: 'proj-invalid-9999',
    });

    mockProjectModule.resolveProjectContext.mockResolvedValue(null);

    const input = {
      userId: 'user-123',
      projectId: 'proj-invalid-9999',
      targetSystemId: 'sys-invalid-8888',
    };

    await expect(searchMappingsByCondition(input)).rejects.toThrow(InvalidProjectContextError);
    await expect(searchMappingsByCondition(input)).rejects.toThrow(
      '指定されたプロジェクトまたは移行対象システムが見つかりません。'
    );
  });
});
