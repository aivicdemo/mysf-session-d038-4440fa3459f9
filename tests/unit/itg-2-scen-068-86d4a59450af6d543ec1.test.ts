import { validateMappingAndClassifyGaps, ValidateMappingAndClassifyGapsInput, InvalidMappingDataError } from '../../src/logic/mapping-validation-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as mappingPersistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';

jest.mock('../../../src/logic/authentication-authorization');
jest.mock('../../../src/logic/project-context-resolver');
jest.mock('../../../src/logic/mapping-persistence');
jest.mock('../../../src/logic/audit-trail-service');

describe('SCEN-068: validateMappingAndClassifyGaps - エラー系：機能マッピング詳細レコードのデータが不完全または矛盾している', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidMappingDataError when mapping data is incomplete or inconsistent', async () => {
    const input: ValidateMappingAndClassifyGapsInput = {
      projectId: 'proj-001',
      targetSystemId: 'sys-001',
      userId: 'user-001',
      sessionId: 'session-001',
      executionTimestamp: 1672531200000,
      mappingDetailIds: ['mapping-detail-001'],
    };

    const authResult = {
      isAuthenticated: true,
      userId: 'user-001',
      sessionId: 'session-001',
      hasValidPermission: true,
      role: 'PROJECT_MANAGER',
    };

    const projectResult = {
      projectId: 'proj-001',
      targetSystemId: 'sys-001',
      isValid: true,
      projectStatus: 'ACTIVE',
    };

    const mappingDetails = [
      {
        mappingDetailId: 'mapping-detail-001',
        salesforceObjectName: 'Invoice__c',
        fields: [
          { name: 'Amount__c', dataType: 'Currency', required: true },
          { name: 'InvoiceDate__c', dataType: 'Date', required: null },
        ],
        calculationLogic: { formula: 'Amount__c * 1.1', description: 'Tax calculation' },
        relationships: [{ name: 'Opportunity__r', referencedObject: 'Opportunity', type: 'lookup' }],
      },
    ];

    const targetCapabilities = [
      {
        featureId: 'feature-001',
        featureName: 'Invoice Management',
        fields: [
          { name: 'amount', dataType: 'decimal', supported: true },
          { name: 'invoice_date', dataType: 'date', supported: true },
        ],
        calculationSupport: true,
        customizationLimits: 50,
        apiAvailability: true,
      },
    ];

    jest.mocked(authModule.verifyUserAuthenticationAndAuthorization).mockResolvedValue(authResult);
    jest.mocked(projectContextModule.resolveProjectContext).mockResolvedValue(projectResult);
    jest.mocked(mappingPersistenceModule.retrieveMappingDetailsForProject).mockResolvedValue(mappingDetails);
    jest.mocked(mappingPersistenceModule.retrieveMappingDetailsByTargetSystem).mockResolvedValue(targetCapabilities);

    await expect(validateMappingAndClassifyGaps(input)).rejects.toThrow(InvalidMappingDataError);
    await expect(validateMappingAndClassifyGaps(input)).rejects.toThrow('機能マッピングデータが不正です。データを確認してください。');
  });
});
