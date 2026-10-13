import { validateMappingAndClassifyGaps, ValidateMappingAndClassifyGapsInput, MappingDetailsNotFoundError } from '../../src/logic/mapping-validation-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as mappingPersistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';

jest.mock('../../../src/logic/authentication-authorization');
jest.mock('../../../src/logic/project-context-resolver');
jest.mock('../../../src/logic/mapping-persistence');
jest.mock('../../../src/logic/audit-trail-service');

describe('SCEN-066: validateMappingAndClassifyGaps - エラー系：検証対象の機能マッピング詳細レコードが存在しない', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw MappingDetailsNotFoundError when no mapping details found', async () => {
    const input: ValidateMappingAndClassifyGapsInput = {
      projectId: 'proj-001',
      targetSystemId: 'sys-001',
      userId: 'user-001',
      sessionId: 'session-valid-001',
      executionTimestamp: 1700000000000,
      mappingDetailIds: ['mapping-detail-001', 'mapping-detail-002'],
    };

    const authResult = {
      userId: 'user-001',
      authenticated: true,
      authorized: true,
      rolePermissions: ['MAPPING_VALIDATOR'],
    };

    const projectResult = {
      projectId: 'proj-001',
      targetSystemId: 'sys-001',
      resolved: true,
    };

    jest.mocked(authModule.verifyUserAuthenticationAndAuthorization).mockResolvedValue(authResult);
    jest.mocked(projectContextModule.resolveProjectContext).mockResolvedValue(projectResult);
    jest.mocked(mappingPersistenceModule.retrieveMappingDetailsForProject).mockResolvedValue([]);

    await expect(validateMappingAndClassifyGaps(input)).rejects.toThrow(MappingDetailsNotFoundError);
    await expect(validateMappingAndClassifyGaps(input)).rejects.toThrow('検証対象の機能マッピングが見つかりません。');
  });
});
