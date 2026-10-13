import { runTx12Imp1Agent, type Tx12Imp1AiClient, CalculationLogicMappingFailedException } from '../../src/agents/tx-12-imp-1/orchestrator';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationService from '../../src/logic/authentication-authorization';
import * as mappingGenerationService from '../../src/logic/mapping-generation-service';
import * as mappingValidationService from '../../src/logic/mapping-validation-service';
import * as riskAssessmentService from '../../src/logic/risk-assessment-service';
import * as referenceRelationshipAnalyzer from '../../src/logic/reference-relationship-analyzer';


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

import * as calculationLogicMapper from '../../src/logic/calculation-logic-mapper';

describe('SCEN-024: CalculationLogicMappingFailedException', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw CalculationLogicMappingFailedException when calculation logic mapping fails', async () => {
    const mockResolveProjectContext = projectContextResolver.resolveProjectContext as jest.Mock;
    mockResolveProjectContext.mockResolvedValue({
      projectId: 'proj-20250107-001',
      targetSystemId: 'oracle-erp-001'
    });

    const mockVerifyUserAuthenticationAndAuthorization = authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock;
    mockVerifyUserAuthenticationAndAuthorization.mockResolvedValue({
      userId: 'user-12345'
    });

    const mockGenerateMappingTable = mappingGenerationService.generateMappingTable as jest.Mock;
    mockGenerateMappingTable.mockResolvedValue({
      status: 'success',
      mappingTableId: 'map-001',
      mappingEntries: []
    });

    const mockValidateMappingAndClassifyGaps = mappingValidationService.validateMappingAndClassifyGaps as jest.Mock;
    mockValidateMappingAndClassifyGaps.mockResolvedValue({
      status: 'success',
      validationResults: [
        {
          mappingId: 'map-001',
          gapClassification: 'minor',
          gapScore: 0.3,
          validationStatus: 'valid'
        }
      ]
    });

    const mockAssessMigrationRisksFromMapping = riskAssessmentService.assessMigrationRisksFromMapping as jest.Mock;
    mockAssessMigrationRisksFromMapping.mockResolvedValue({
      status: 'success',
      riskAssessments: [
        {
          riskId: 'risk-001',
          riskClassification: 'low',
          riskScore: 0.2,
          mitigationStrategy: '標準機能で対応可能'
        }
      ]
    });

    const mockAnalyzeReferenceRelationships = referenceRelationshipAnalyzer.analyzeReferenceRelationships as jest.Mock;
    mockAnalyzeReferenceRelationships.mockResolvedValue({
      status: 'success',
      referenceAnalysis: []
    });

    const mockMapCalculationLogicsToTargetSystem = calculationLogicMapper.mapCalculationLogicsToTargetSystem as jest.Mock;
    mockMapCalculationLogicsToTargetSystem.mockResolvedValue({
      status: 'failure',
      errorCode: 'CALC_LOGIC_MAP_FAILED',
      errorMessage: '計算ロジック「小計計算」のOracleプロシージャ構文変換に失敗しました。ロジック定義を確認してください。',
      failedLogicMappings: [
        {
          logicName: '小計計算',
          sourceExpression: 'SUM(請求明細.単価 * 請求明細.数量)',
          targetExpressionAttempt: null,
          failureReason: '参照フィールドの循環依存が検出されたため、プロシージャ化できません'
        }
      ]
    });

    const input = {
      projectId: 'proj-20250107-001',
      targetSystemId: 'oracle-erp-001',
      userId: 'user-12345',
      existingProcessDefinitions: [
        {
          processName: '請求書作成プロセス',
          processDescription: '商談から請求書を生成',
          workflowSteps: [
            {
              stepName: '請求書初期化',
              stepLogic: '新規請求書レコード作成'
            }
          ],
          calculationLogics: [
            {
              logicName: '小計計算',
              logicExpression: 'SUM(請求明細.単価 * 請求明細.数量)'
            }
          ]
        }
      ],
      partnerConfirmationDetails: [
        {
          confirmationTopic: '計算ロジック実装方式',
          confirmedContent: 'Oracleストアドプロシージャで実装',
          confirmationDate: '2025-01-07T10:00:00Z',
          confirmedBy: 'partner-user-001'
        }
      ],
      executionTimestamp: '2025-01-07T11:30:00Z'
    };

    const mockAiClient: Tx12Imp1AiClient = {};

    await expect(runTx12Imp1Agent(input, mockAiClient)).rejects.toThrow(
      new CalculationLogicMappingFailedException(
        '計算ロジックのマッピングに失敗しました。ロジック定義を確認してください。'
      )
    );
  });
});
