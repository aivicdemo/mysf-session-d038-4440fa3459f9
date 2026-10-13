import { validateMappingAndClassifyGaps, ValidateMappingAndClassifyGapsInput, TargetSystemCapabilitiesNotFoundError } from '../../src/logic/mapping-validation-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as mappingPersistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';

jest.mock('../../../src/logic/authentication-authorization');
jest.mock('../../../src/logic/project-context-resolver');
jest.mock('../../../src/logic/mapping-persistence');
jest.mock('../../../src/logic/audit-trail-service');

describe('SCEN-067: validateMappingAndClassifyGaps - エラー系：移行対象システムの標準機能情報が取得できない', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw TargetSystemCapabilitiesNotFoundError when target system capabilities not found', async () => {
    const input: ValidateMappingAndClassifyGapsInput = {
      projectId: 'proj-001',
      targetSystemId: 'sys-001',
      userId: 'user-001',
      sessionId: 'sess-abc123',
      executionTimestamp: 1704067200000,
    };

    const authResult = {
      isAuthenticated: true,
      role: 'ProjectManager',
      hasAccessToProject: true,
    };

    const projectResult = {
      projectId: 'proj-001',
      targetSystemId: 'sys-001',
      projectStatus: 'active',
      isValid: true,
    };

    const mappingDetails = [
      {
        mappingDetailId: 'map-001',
        sfObjectName: 'Invoice__c',
        sfFields: ['Name', 'Amount__c', 'Date__c'],
        calculationLogic: 'Amount__c = sum(LineItems__r.Amount__c)',
        references: ['Account', 'Opportunity'],
      },
      {
        mappingDetailId: 'map-002',
        sfObjectName: 'InvoiceLineItem__c',
        sfFields: ['Name', 'Quantity__c', 'UnitPrice__c'],
        calculationLogic: 'ExtendedAmount__c = Quantity__c * UnitPrice__c',
        references: ['Invoice__c'],
      },
    ];

    jest.mocked(authModule.verifyUserAuthenticationAndAuthorization).mockResolvedValue(authResult);
    jest.mocked(projectContextModule.resolveProjectContext).mockResolvedValue(projectResult);
    jest.mocked(mappingPersistenceModule.retrieveMappingDetailsForProject).mockResolvedValue(mappingDetails);
    jest.mocked(mappingPersistenceModule.retrieveMappingDetailsByTargetSystem).mockResolvedValue(null);

    await expect(validateMappingAndClassifyGaps(input)).rejects.toThrow(TargetSystemCapabilitiesNotFoundError);
    await expect(validateMappingAndClassifyGaps(input)).rejects.toThrow('移行対象システムの標準機能情報が見つかりません。');
  });
});
