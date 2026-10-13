import { validateMappingAndClassifyGaps, InvalidMappingDataError } from '../../src/logic/mapping-validation-service';

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

describe('SCEN-079: Salesforceのオブジェクト構成情報が不完全な場合のエラーハンドリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Salesforceオブジェクト構成情報が null または fields が空の場合、InvalidMappingDataError を発生させる', async () => {
    const mockAuthResult = {
      isAuthenticated: true,
      userId: 'user-sales-mgr-001',
      role: 'project_manager',
      hasValidSession: true,
      permissions: ['validate_mapping', 'view_mapping'],
    };

    const mockProjectContext = {
      projectId: 'proj-001',
      targetSystemId: 'sys-oracle-erp',
      projectStatus: 'active',
      systemStatus: 'active',
    };

    const mockMappingDetails = [
      {
        mappingDetailId: 'mapping-001',
        salesforceObjectStructure: {
          objectName: 'Account',
          fields: [
            { fieldName: 'Name', dataType: 'Text', isRequired: true },
            { fieldName: 'BillingStreet', dataType: 'Text', isRequired: false },
          ],
        },
        calculationLogic: null,
        referenceRelationships: [],
      },
      {
        mappingDetailId: 'mapping-002',
        salesforceObjectStructure: null,
        calculationLogic: null,
        referenceRelationships: [],
      },
      {
        mappingDetailId: 'mapping-003',
        salesforceObjectStructure: {
          objectName: 'Invoice_Line_Item__c',
          fields: [],
        },
        calculationLogic: null,
        referenceRelationships: null,
      },
    ];

    const mockTargetSystemCapabilities = {
      systemName: 'Oracle ERP',
      standardFeatures: [
        {
          featureName: 'Customer Master',
          supportedFields: ['customer_name', 'address'],
          customizationPossible: true,
        },
        {
          featureName: 'Billing',
          supportedFields: ['invoice_number', 'amount'],
          customizationPossible: true,
        },
      ],
    };

    (verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockAuthResult);
    (resolveProjectContext as jest.Mock).mockResolvedValue(mockProjectContext);
    (retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(mockMappingDetails);
    (retrieveMappingDetailsByTargetSystem as jest.Mock).mockResolvedValue(mockTargetSystemCapabilities);

    const input = {
      projectId: 'proj-001',
      targetSystemId: 'sys-oracle-erp',
      userId: 'user-sales-mgr-001',
      sessionId: 'sess-valid-abc123',
      executionTimestamp: 1672531200000,
      mappingDetailIds: ['mapping-001', 'mapping-002', 'mapping-003'],
    };

    await expect(validateMappingAndClassifyGaps(input)).rejects.toThrow(InvalidMappingDataError);
  });
});
