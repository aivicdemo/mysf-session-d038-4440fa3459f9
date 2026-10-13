import { searchMappingsByCondition, InvalidSearchConditionError } from '../../src/logic/mapping-query-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectModule from '../../src/logic/project-context-resolver';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');

describe('SCEN-238: InvalidSearchConditionError when gap classification is invalid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidSearchConditionError when gapClassification is not a valid value', async () => {
    const mockAuthModule = jest.mocked(authModule);
    const mockProjectModule = jest.mocked(projectModule);

    mockAuthModule.verifyUserAuthenticationAndAuthorization.mockResolvedValue({
      isAuthorized: true,
      userId: 'user-001',
      operationType: 'search_mapping',
      projectId: 'proj-001',
    });

    mockProjectModule.resolveProjectContext.mockResolvedValue({
      projectId: 'proj-001',
      targetSystemId: 'target-001',
    });

    const input = {
      userId: 'user-001',
      projectId: 'proj-001',
      targetSystemId: 'target-001',
      gapClassification: '無効な値',
    };

    await expect(searchMappingsByCondition(input)).rejects.toThrow(InvalidSearchConditionError);
    await expect(searchMappingsByCondition(input)).rejects.toThrow('検索条件の値が無効です。');
  });
});
