import { validateMappingAndClassifyGaps, ValidateMappingAndClassifyGapsInput, UserNotAuthenticatedError } from '../../src/logic/mapping-validation-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as mappingPersistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';

jest.mock('../../../src/logic/authentication-authorization');
jest.mock('../../../src/logic/project-context-resolver');
jest.mock('../../../src/logic/mapping-persistence');
jest.mock('../../../src/logic/audit-trail-service');

describe('SCEN-063: validateMappingAndClassifyGaps - エラー系：ユーザーが認証されていない', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserNotAuthenticatedError when user is not authenticated', async () => {
    const input: ValidateMappingAndClassifyGapsInput = {
      projectId: 'proj-20250115-001',
      targetSystemId: 'sys-oracle-erp-001',
      userId: 'user-admin-001',
      sessionId: 'session-20250115-xyz789',
      executionTimestamp: 1705305600000,
    };

    const authResult = {
      isAuthenticated: false,
      sessionValid: false,
      userId: 'user-admin-001',
    };

    jest.mocked(authModule.verifyUserAuthenticationAndAuthorization).mockResolvedValue(authResult);

    await expect(validateMappingAndClassifyGaps(input)).rejects.toThrow(UserNotAuthenticatedError);
    await expect(validateMappingAndClassifyGaps(input)).rejects.toThrow('ユーザー認証に失敗しました。ログインしてください。');
  });
});
