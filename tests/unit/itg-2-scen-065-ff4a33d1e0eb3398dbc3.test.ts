import { validateMappingAndClassifyGaps, ValidateMappingAndClassifyGapsInput, ProjectContextNotResolvedError } from '../../src/logic/mapping-validation-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as mappingPersistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';

jest.mock('../../../src/logic/authentication-authorization');
jest.mock('../../../src/logic/project-context-resolver');
jest.mock('../../../src/logic/mapping-persistence');
jest.mock('../../../src/logic/audit-trail-service');

describe('SCEN-065: validateMappingAndClassifyGaps - エラー系：プロジェクトコンテキストが解決できない', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ProjectContextNotResolvedError when project context cannot be resolved', async () => {
    const input: ValidateMappingAndClassifyGapsInput = {
      projectId: 'proj-20250107-001',
      targetSystemId: 'sys-oracle-erp-01',
      userId: 'user-sales-001',
      sessionId: 'session-valid-20250107-001',
      executionTimestamp: 1704624000000,
    };

    const authResult = {
      isAuthenticated: true,
      userId: 'user-sales-001',
      sessionId: 'session-valid-20250107-001',
    };

    jest.mocked(authModule.verifyUserAuthenticationAndAuthorization).mockResolvedValue(authResult);
    jest.mocked(projectContextModule.resolveProjectContext).mockResolvedValue(null);

    await expect(validateMappingAndClassifyGaps(input)).rejects.toThrow(ProjectContextNotResolvedError);
    await expect(validateMappingAndClassifyGaps(input)).rejects.toThrow('プロジェクトコンテキストが無効です。プロジェクトを選択してください。');
  });
});
