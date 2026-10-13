import {
  validateMappingAndClassifyGaps,
  ValidationRecommendationGenerationFailedError,
  ValidateMappingAndClassifyGapsInput,
} from '../../src/logic/mapping-validation-service';

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn().mockResolvedValue({
    isAuthenticated: true,
    userId: 'user-001',
    hasValidSession: true,
    rolePermissions: ['mapping_validation_execute'],
    projectAccessLevel: 'full_access',
  }),
}));

jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn().mockResolvedValue({
    projectId: 'proj-001',
    targetSystemId: 'tgt-sys-001',
    projectStatus: 'active',
    systemStatus: 'active',
  }),
}));

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  retrieveMappingDetailsForProject: jest.fn().mockResolvedValue([
    {
      mappingDetailId: 'map-detail-001',
      salesforceObjectName: 'Invoice__c',
      targetSystemObjectName: 'BILL_HEADER',
      fieldMappings: [
        {
          sfField: 'Invoice_Number__c',
          targetField: 'BILL_NUMBER',
          dataType: 'Text',
        },
      ],
      calculationLogic: 'SUM(Amount__c)',
      referenceRelationships: ['Account'],
    },
    {
      mappingDetailId: 'map-detail-002',
      salesforceObjectName: 'Invoice_Line_Item__c',
      targetSystemObjectName: 'BILL_DETAIL',
      fieldMappings: [
        {
          sfField: 'Line_Amount__c',
          targetField: 'LINE_AMOUNT',
          dataType: 'Currency',
        },
      ],
      calculationLogic: 'Unit_Price__c * Quantity__c',
      referenceRelationships: ['Invoice__c'],
    },
  ]),
  retrieveMappingDetailsByTargetSystem: jest.fn().mockResolvedValue({
    targetSystemId: 'tgt-sys-001',
    standardFeatures: [
      {
        featureName: 'BILL_HEADER',
        supportedFields: ['BILL_NUMBER', 'BILL_DATE'],
        calculationCapability: true,
        customizationLimits: 50,
      },
      {
        featureName: 'BILL_DETAIL',
        supportedFields: ['LINE_AMOUNT', 'QUANTITY'],
        calculationCapability: true,
        customizationLimits: 30,
      },
    ],
  }),
  saveMappingValidationResult: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/logic/audit-trail-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/audit-trail-service')>('../../src/logic/audit-trail-service'),
  recordMappingValidationAuditTrail: jest.fn().mockResolvedValue(undefined),
}));

describe('SCEN-071: エラー系：検証推奨事項の生成処理中にエラーが発生した場合、ValidationRecommendationGenerationFailedError が発生する', () => {
  it('generateValidationRecommendations 内で例外が発生した場合、ValidationRecommendationGenerationFailedError が発生し、saveMappingValidationResult と recordMappingValidationAuditTrail は呼び出されない', async () => {
    const input: ValidateMappingAndClassifyGapsInput = {
      projectId: 'proj-001',
      targetSystemId: 'tgt-sys-001',
      userId: 'user-001',
      sessionId: 'sess-valid-001',
      executionTimestamp: 1696857600000,
      mappingDetailIds: ['map-detail-001', 'map-detail-002'],
    };

    const persistenceMock = require('../../src/logic/mapping-persistence');
    const auditTrailMock = require('../../src/logic/audit-trail-service');

    await expect(validateMappingAndClassifyGaps(input)).rejects.toThrow(
      ValidationRecommendationGenerationFailedError
    );

    try {
      await validateMappingAndClassifyGaps(input);
    } catch (error: any) {
      expect(error.message).toBe('検証推奨事項の生成に失敗しました。');
      expect(persistenceMock.saveMappingValidationResult).not.toHaveBeenCalled();
      expect(auditTrailMock.recordMappingValidationAuditTrail).not.toHaveBeenCalled();
    }
  });
});
