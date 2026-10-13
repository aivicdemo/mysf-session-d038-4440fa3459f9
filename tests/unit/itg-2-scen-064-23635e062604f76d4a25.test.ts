import { validateMappingAndClassifyGaps, ValidateMappingAndClassifyGapsInput, UserUnauthorizedError } from '../../src/logic/mapping-validation-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as mappingPersistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';

jest.mock('../../../src/logic/authentication-authorization');
jest.mock('../../../src/logic/project-context-resolver');
jest.mock('../../../src/logic/mapping-persistence');
jest.mock('../../../src/logic/audit-trail-service');

describe('SCEN-064: validateMappingAndClassifyGaps - エラー系：ユーザーのロール権限が不足している', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserUnauthorizedError when user lacks required permissions', async () => {
    const input: ValidateMappingAndClassifyGapsInput = {
      projectId: 'proj-migration-001',
      targetSystemId: 'target-sys-oracle-001',
      userId: 'user-sales-operator-001',
      sessionId: 'session-abc123def456',
      executionTimestamp: 1704067200000,
      mappingDetailIds: ['mapping-detail-001', 'mapping-detail-002'],
    };

    const authResult = {
      userId: 'user-sales-operator-001',
      authenticated: true,
      sessionValid: true,
      userRole: 'sales_operator',
      permissions: ['view_mapping_table'],
      hasAccessToProject: true,
    };

    jest.mocked(authModule.verifyUserAuthenticationAndAuthorization).mockResolvedValue(authResult);

    await expect(validateMappingAndClassifyGaps(input)).rejects.toThrow(UserUnauthorizedError);
    await expect(validateMappingAndClassifyGaps(input)).rejects.toThrow('この操作を実行する権限がありません。');
  });
});
