import { runTx12Imp1Agent, type Tx12Imp1AiClient, TechnicalSpecificationGenerationFailedException } from '../../src/agents/tx-12-imp-1/orchestrator';
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

describe('SCEN-026: TechnicalSpecificationGenerationFailedException', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw TechnicalSpecificationGenerationFailedException when validation results are null', async () => {
    const mockResolveProjectContext = projectContextResolver.resolveProjectContext as jest.Mock;
    mockResolveProjectContext.mockResolvedValue({
      projectId: 'proj-migration-001',
      targetSystemId: 'tgt-sys-oracle-erp'
    });

    const mockVerifyUserAuthenticationAndAuthorization = authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock;
    mockVerifyUserAuthenticationAndAuthorization.mockResolvedValue({
      userId: 'user-mapper-001'
    });

    const mockGenerateMappingTable = mappingGenerationService.generateMappingTable as jest.Mock;
    mockGenerateMappingTable.mockResolvedValue({
      mappingTableId: 'mapping-tbl-001',
      extractedObjects: [
        {
          objectName: 'Invoice__c',
          fields: [
            {
              fieldName: 'InvoiceNumber__c',
              dataType: 'Text',
              required: true
            },
            {
              fieldName: 'Amount__c',
              dataType: 'Currency',
              required: true
            }
          ],
          calculationFormulas: [
            {
              formulaName: 'TotalWithTax__c',
              expression: 'Amount__c * 1.1'
            }
          ]
        }
      ]
    });

    const mockValidateMappingAndClassifyGaps = mappingValidationService.validateMappingAndClassifyGaps as jest.Mock;
    mockValidateMappingAndClassifyGaps.mockResolvedValue(null);

    const mockAssessMigrationRisksFromMapping = riskAssessmentService.assessMigrationRisksFromMapping as jest.Mock;
    mockAssessMigrationRisksFromMapping.mockResolvedValue([
      {
        riskId: 'risk-calc-logic-001',
        riskClassification: 'calculation_logic_mismatch',
        riskScore: 7.5,
        mitigationStrategy: 'Salesforceでの計算ロジックをOracle ERPのTAX_CALCULATIONパッケージに移行し、テストケースで検証'
      }
    ]);

    const mockAnalyzeReferenceRelationships = referenceRelationshipAnalyzer.analyzeReferenceRelationships as jest.Mock;
    mockAnalyzeReferenceRelationships.mockResolvedValue({
      analysisId: 'ref-analysis-001',
      relationships: [
        {
          sourceObject: 'Invoice__c',
          targetObject: 'Opportunity',
          relationType: 'lookup',
          circularDependency: false
        }
      ]
    });

    const mockMapCalculationLogicsToTargetSystem = calculationLogicMapper.mapCalculationLogicsToTargetSystem as jest.Mock;
    mockMapCalculationLogicsToTargetSystem.mockResolvedValue({
      mappingId: 'calc-mapping-001',
      mappedLogics: [
        {
          sfLogicName: 'TotalWithTax__c',
          targetSystemLogicName: 'TAX_CALCULATION.calculate_total',
          implementationMethod: 'stored_procedure',
          status: 'mapped'
        }
      ]
    });

    const input = {
      projectId: 'proj-migration-001',
      targetSystemId: 'tgt-sys-oracle-erp',
      userId: 'user-mapper-001',
      existingProcessDefinitions: [
        {
          processName: '請求書作成プロセス',
          processDescription: '商談から請求書を自動生成するプロセス',
          workflowSteps: [
            {
              stepName: '商談確定確認',
              stepLogic: '商談ステージが『成約』かつ金額が0より大きい'
            },
            {
              stepName: '請求書レコード作成',
              stepLogic: '新規請求書を作成し、商談IDをリンク'
            }
          ],
          calculationLogics: [
            {
              logicName: '請求金額計算',
              logicExpression: '商談商品の金額合計 * (1 + 消費税率)'
            }
          ]
        }
      ],
      partnerConfirmationDetails: [
        {
          confirmationTopic: '請求書フィールド仕様',
          confirmedContent: 'Oracle ERPではINVOICE_HEADER表に請求書マスタ、INVOICE_LINES表に請求明細を持つ構成で実装',
          confirmationDate: '2026-01-15',
          confirmedBy: 'partner-architect-001'
        },
        {
          confirmationTopic: '消費税計算ルール',
          confirmedContent: 'Oracle ERPではTAX_CALCULATIONパッケージで消費税率は設定値から参照。標準は10%',
          confirmationDate: '2026-01-15',
          confirmedBy: 'partner-architect-001'
        }
      ],
      executionTimestamp: '2026-01-20T14:30:00Z'
    };

    const mockAiClient: Tx12Imp1AiClient = {};

    await expect(runTx12Imp1Agent(input, mockAiClient)).rejects.toThrow(
      new TechnicalSpecificationGenerationFailedException(
        '技術仕様書の生成に失敗しました。マッピングとリスク評価を確認してください。'
      )
    );
  });
});
