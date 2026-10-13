import { assessMigrationRisksFromMapping } from '../../src/logic/risk-assessment-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as contextModule from '../../src/logic/project-context-resolver';
import * as persistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';

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
  saveMigrationRiskAssessment: jest.fn(),
}));
jest.mock('../../src/logic/audit-trail-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/audit-trail-service')>('../../src/logic/audit-trail-service'),
  recordRiskAssessmentAuditTrail: jest.fn(),
}));

describe('SCEN-114: マッピング検証結果にギャップが存在する場合の評価', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      userRole: 'PROJECT_MANAGER',
      hasPermission: true,
      userId: 'user-20240115-pm-001',
    });

    (contextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: 'proj-20240115-001',
      targetSystemId: 'oracle-erp-sys-001',
      isValid: true,
      userHasAccess: true,
    });

    (persistenceModule.saveMigrationRiskAssessment as jest.Mock).mockResolvedValue({
      riskAssessmentId: 'risk-assess-20240115-001',
      savedDateTime: '2024-01-15T10:30:00Z',
    });

    (auditModule.recordRiskAssessmentAuditTrail as jest.Mock).mockResolvedValue({
      auditTrailId: 'AT-20240115-001',
      recordedDateTime: '2024-01-15T10:30:00Z',
    });
  });

  it('should return risk assessment output with multiple gap risk factors', async () => {
    const input = {
      projectId: 'proj-20240115-001',
      targetSystemId: 'oracle-erp-sys-001',
      mappingValidationResults: [
        {
          mappingDetailId: 'map-invoice-001',
          existingFunctionName: 'Invoice__c',
          gapCategory: '機能ギャップ',
          gapScore: 45,
          validationStatus: '検証済',
          detectedIssues: ['承認フロー機能がない'],
          recommendations: ['カスタム承認ワークフロー実装が必要'],
          riskLevel: '中',
        },
        {
          mappingDetailId: 'map-invoice-detail-001',
          existingFunctionName: 'InvoiceLineItem__c',
          gapCategory: '計算ロジック差異',
          gapScore: 32,
          validationStatus: '検証済',
          detectedIssues: ['自動計算実装方式が異なる'],
          recommendations: ['計算ロジックの再実装が必要'],
          riskLevel: '中',
        },
      ],
      calculationLogicMetadata: [
        {
          calculationLogicId: 'calc-invoice-amount-001',
          logicName: 'InvoiceAmount',
          logicType: 'FORMULA_FIELD',
          migrationDifficulty: '高',
          dependentLogicIds: [],
          referencedFieldCount: 3,
          migrationRisk: 'formula_compatibility',
        },
      ],
      objectReferenceMetadata: [
        {
          referenceRelationshipId: 'ref-invoice-account-001',
          sourceObjectName: 'Invoice__c',
          targetObjectName: 'Account',
          referenceFieldName: 'Account__r',
          cardinality: 'MANY_TO_ONE',
          isRequired: false,
          deleteAction: 'restrict',
          isPartOfCircularDependency: false,
        },
      ],
      targetSystemCapabilities: [
        {
          capabilityId: 'cap-approval-workflow-001',
          functionName: '承認ワークフロー',
          functionCategory: 'workflow',
          complexityLevel: 2,
          isMappingTarget: true,
          dependentCapabilityIds: [],
        },
        {
          capabilityId: 'cap-calculation-rules-001',
          functionName: '計算ルール',
          functionCategory: 'calculation',
          complexityLevel: 3,
          isMappingTarget: true,
          dependentCapabilityIds: [],
        },
      ],
      evaluationDateTime: new Date('2024-01-15T10:30:00Z'),
      userId: 'user-20240115-pm-001',
    };

    const result = await assessMigrationRisksFromMapping(input);

    expect(result.riskAssessmentId).toBeDefined();
    expect(result.projectId).toBe('proj-20240115-001');
    expect(result.targetSystemId).toBe('oracle-erp-sys-001');
    expect(result.riskFactors).toBeInstanceOf(Array);
    expect(result.riskFactors.length).toBeGreaterThanOrEqual(2);
    expect(result.overallRiskScore).toBeDefined();
    expect(result.overallRiskLevel).toBeDefined();
    expect(result.mitigationStrategies).toBeInstanceOf(Array);
    expect(result.dependencyRisks).toBeInstanceOf(Array);
    expect(result.evaluationDateTime).toEqual(new Date('2024-01-15T10:30:00Z'));
    expect(result.evaluatedByUserId).toBe('user-20240115-pm-001');

    expect(persistenceModule.saveMigrationRiskAssessment).toHaveBeenCalled();
    expect(auditModule.recordRiskAssessmentAuditTrail).toHaveBeenCalled();
  });
});
