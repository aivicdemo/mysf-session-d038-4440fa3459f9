import { validateMappingAndClassifyGaps, TargetSystemCapabilitiesNotFoundError } from '../../src/logic/mapping-validation-service';

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));

jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn(),
}));

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  retrieveMappingDetailsForProject: jest.fn(),
  retrieveMappingDetailsByTargetSystem: jest.fn(),
}));

jest.mock('../../src/logic/audit-trail-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/audit-trail-service')>('../../src/logic/audit-trail-service'),
  recordMappingValidationAuditTrail: jest.fn(),
}));

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  createRecord: jest.fn(),
}));

import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';
import { resolveProjectContext } from '../../src/logic/project-context-resolver';
import { retrieveMappingDetailsForProject, retrieveMappingDetailsByTargetSystem } from '../../src/logic/mapping-persistence';

describe('SCEN-080: 移行対象システムの標準機能仕様が提供されていない場合のエラーハンドリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retrieveMappingDetailsByTargetSystem が null を返す場合、TargetSystemCapabilitiesNotFoundError を発生させる', async () => {
    const mockAuthResult = {
      isAuthenticated: true,
      userId: 'user-99999',
      role: 'MappingValidator',
      hasProjectAccess: true,
      permissions: ['execute_mapping_validation'],
    };

    const mockProjectContext = {
      projectId: 'proj-12345',
      targetSystemId: 'target-sys-oracle-001',
      projectStatus: 'active',
      systemStatus: 'active',
    };

    const mockMappingDetails = [
      {
        mappingDetailId: 'map-detail-001',
        objectName: 'Invoice__c',
        fieldName: 'InvoiceAmount__c',
        dataType: 'Currency',
        isRequired: true,
        computationLogic: 'SUM(Invoice_Line_Item__r.Amount__c)',
        referenceRelationships: ['Invoice_Line_Item__c'],
      },
      {
        mappingDetailId: 'map-detail-002',
        objectName: 'Invoice_Line_Item__c',
        fieldName: 'Quantity__c',
        dataType: 'Number',
        isRequired: true,
        computationLogic: null,
        referenceRelationships: ['Invoice__c'],
      },
    ];

    (verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockAuthResult);
    (resolveProjectContext as jest.Mock).mockResolvedValue(mockProjectContext);
    (retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(mockMappingDetails);
    (retrieveMappingDetailsByTargetSystem as jest.Mock).mockResolvedValue(null);

    const input = {
      projectId: 'proj-12345',
      targetSystemId: 'target-sys-oracle-001',
      userId: 'user-99999',
      sessionId: 'session-abc123def456',
      executionTimestamp: 1704067200000,
      mappingDetailIds: undefined,
    };

    await expect(validateMappingAndClassifyGaps(input)).rejects.toThrow(TargetSystemCapabilitiesNotFoundError);
  });
});
