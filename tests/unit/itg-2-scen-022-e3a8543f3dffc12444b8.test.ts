import { runTx12Imp1Agent, type Tx12Imp1AiClient, RiskAssessmentFailedException } from '../../src/agents/tx-12-imp-1/orchestrator';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationService from '../../src/logic/authentication-authorization';
import * as mappingGenerationService from '../../src/logic/mapping-generation-service';
import * as mappingValidationService from '../../src/logic/mapping-validation-service';


jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn()
}));
jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn()
}));
jest.mock('../../src/logic/mapping-generation-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-generation-service')>('../../src/logic/mapping-generation-service'),
  generateMappingTable: jest.fn()
}));
jest.mock('../../src/logic/mapping-validation-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-validation-service')>('../../src/logic/mapping-validation-service'),
  validateMappingAndClassifyGaps: jest.fn()
}));
jest.mock('../../src/logic/risk-assessment-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/risk-assessment-service')>('../../src/logic/risk-assessment-service'),
  assessMigrationRisksFromMapping: jest.fn()
}));
jest.mock('../../src/logic/reference-relationship-analyzer', () => ({
  ...jest.requireActual<typeof import('../../src/logic/reference-relationship-analyzer')>('../../src/logic/reference-relationship-analyzer'),
  analyzeReferenceRelationships: jest.fn()
}));
jest.mock('../../src/logic/calculation-logic-mapper', () => ({
  ...jest.requireActual<typeof import('../../src/logic/calculation-logic-mapper')>('../../src/logic/calculation-logic-mapper'),
  mapCalculationLogicsToTargetSystem: jest.fn()
}));
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/audit-trail-service');

import * as riskAssessmentService from '../../src/logic/risk-assessment-service';

describe('SCEN-022: RiskAssessmentFailedException', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw RiskAssessmentFailedException when risk assessment fails', async () => {
    const mockResolveProjectContext = projectContextResolver.resolveProjectContext as jest.Mock;
    mockResolveProjectContext.mockResolvedValue({
      projectId: 'proj-sf-migration-001',
      targetSystemId: 'target-erp-oracle-001',
      isValid: true,
      accessLevel: 'admin'
    });

    const mockVerifyUserAuthenticationAndAuthorization = authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock;
    mockVerifyUserAuthenticationAndAuthorization.mockResolvedValue({
      userId: 'user-migration-admin-001',
      isAuthenticated: true,
      hasMapppingExecutionRight: true,
      permissions: ['mapping_create', 'mapping_validate', 'risk_assess']
    });

    const mockGenerateMappingTable = mappingGenerationService.generateMappingTable as jest.Mock;
    mockGenerateMappingTable.mockResolvedValue({
      mappingTableId: 'mapping-20250120-001'
    });

    const mockValidateMappingAndClassifyGaps = mappingValidationService.validateMappingAndClassifyGaps as jest.Mock;
    mockValidateMappingAndClassifyGaps.mockResolvedValue({
      validationResults: [
        {
          mappingId: 'map-001',
          gapClassification: 'standard_feature_available',
          gapScore: 0.2,
          validationStatus: 'valid'
        }
      ]
    });

    const mockAssessMigrationRisksFromMapping = riskAssessmentService.assessMigrationRisksFromMapping as jest.Mock;
    mockAssessMigrationRisksFromMapping.mockRejectedValue(new Error('Risk assessment failed'));

    const input = {
      projectId: 'proj-sf-migration-001',
      targetSystemId: 'target-erp-oracle-001',
      userId: 'user-migration-admin-001',
      existingProcessDefinitions: [
        {
          processName: '請求書作成プロセス',
          processDescription: '商談から請求書を自動生成するプロセス',
          workflowSteps: [
            {
              stepName: '請求書ヘッダ作成',
              stepLogic: '商談情報から請求書ヘッダを生成'
            }
          ],
          calculationLogics: [
            {
              logicName: '請求金額計算',
              logicExpression: 'SUM(請求明細.金額)'
            }
          ]
        }
      ],
      partnerConfirmationDetails: [
        {
          confirmationTopic: '請求書ワークフロー承認',
          confirmedContent: '3段階承認フロー（部門長→経理→CFO）を標準化',
          confirmationDate: '2025-01-15',
          confirmedBy: 'partner-pmo-lead'
        }
      ],
      executionTimestamp: '2025-01-20T10:30:00Z'
    };

    const mockAiClient: Tx12Imp1AiClient = {};

    await expect(runTx12Imp1Agent(input, mockAiClient)).rejects.toThrow(
      new RiskAssessmentFailedException(
        '移行リスク評価に失敗しました。マッピング情報を確認してください。'
      )
    );
  });
});
