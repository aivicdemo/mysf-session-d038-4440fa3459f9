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
import { recordMappingValidationAuditTrail } from '../../src/logic/audit-trail-service';
import { createRecord } from '../../src/platform/data-store';

describe('SCEN-076: 移行対象システムの標準機能情報が入手できない場合のエラーハンドリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('移行対象システムの標準機能情報が null の場合、TargetSystemCapabilitiesNotFoundError を発生させる', async () => {
    const mockAuthResult = {
      isAuthenticated: true,
      hasProjectAccess: true,
      rolePermissions: ['mapping_validation_execute'],
      userId: 'user-finance-mgr-001',
    };

    const mockProjectContext = {
      projectId: 'proj-20250115-001',
      targetSystemId: 'sys-oracle-erp-001',
      projectStatus: 'active',
      systemStatus: 'active',
    };

    const mockMappingDetails = [
      {
        mappingDetailId: 'map-detail-001',
        functionName: '請求書作成',
        sfObjectStructure: {
          objectName: 'Invoice__c',
          fields: [
            { name: 'InvoiceNumber', type: 'Text' },
            { name: 'TotalAmount', type: 'Currency' },
          ],
          calculationLogic: 'SUM(請求明細.金額)',
          relationships: ['Account', 'Opportunity'],
        },
      },
    ];

    (verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockAuthResult);
    (resolveProjectContext as jest.Mock).mockResolvedValue(mockProjectContext);
    (retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(mockMappingDetails);
    (retrieveMappingDetailsByTargetSystem as jest.Mock).mockResolvedValue(null);

    const input = {
      projectId: 'proj-20250115-001',
      targetSystemId: 'sys-oracle-erp-001',
      userId: 'user-finance-mgr-001',
      sessionId: 'session-valid-20250115-abc123',
      executionTimestamp: 1705315200000,
      mappingDetailIds: [],
    };

    await expect(validateMappingAndClassifyGaps(input)).rejects.toThrow(TargetSystemCapabilitiesNotFoundError);
  });
});
