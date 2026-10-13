import { runTx12Imp1Agent, type Tx12Imp1AiClient, MappingValidationFailedException } from '../../src/agents/tx-12-imp-1/orchestrator';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationService from '../../src/logic/authentication-authorization';
import * as mappingGenerationService from '../../src/logic/mapping-generation-service';


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

import * as mappingValidationService from '../../src/logic/mapping-validation-service';

describe('SCEN-021: MappingValidationFailedException', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw MappingValidationFailedException when mapping validation fails', async () => {
    const mockResolveProjectContext = projectContextResolver.resolveProjectContext as jest.Mock;
    mockResolveProjectContext.mockResolvedValue({
      projectId: 'proj-sf-migration-001',
      targetSystemId: 'target-erp-oracle-001',
      resolvedSuccessfully: true
    });

    const mockVerifyUserAuthenticationAndAuthorization = authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock;
    mockVerifyUserAuthenticationAndAuthorization.mockResolvedValue({
      userId: 'user-migration-lead-001',
      authorizationVerified: true
    });

    const mockGenerateMappingTable = mappingGenerationService.generateMappingTable as jest.Mock;
    mockGenerateMappingTable.mockResolvedValue({
      mappingTableId: 'mapping-tbl-001',
      mappings: [
        {
          mappingId: 'map-001',
          salesforceField: '請求書.金額',
          targetSystemField: 'AR_INVOICES.AMOUNT',
          mappingType: 'direct'
        }
      ]
    });

    const mockValidateMappingAndClassifyGaps = mappingValidationService.validateMappingAndClassifyGaps as jest.Mock;
    mockValidateMappingAndClassifyGaps.mockResolvedValue({
      validationStatus: 'failure',
      validationResults: [
        {
          mappingId: 'map-001',
          gapClassification: 'critical',
          gapScore: 8.5,
          validationStatus: 'failed',
          errorDetails: '計算ロジックの実装方式がSalesforceとOracle間で互換性なし'
        }
      ]
    });

    const input = {
      projectId: 'proj-sf-migration-001',
      targetSystemId: 'target-erp-oracle-001',
      userId: 'user-migration-lead-001',
      existingProcessDefinitions: [
        {
          processName: '請求書作成ワークフロー',
          processDescription: '商談から請求書を自動生成するプロセス',
          workflowSteps: [
            {
              stepName: '商談確定時に請求書レコード作成',
              stepLogic: '商談ステージが『成約』になったとき、請求書オブジェクトに新規レコードを作成'
            }
          ],
          calculationLogics: [
            {
              logicName: '請求書合計金額計算',
              logicExpression: 'SUM(請求明細.金額)'
            }
          ]
        }
      ],
      partnerConfirmationDetails: [
        {
          confirmationTopic: '請求書オブジェクトのフィールド構成',
          confirmedContent: '請求書番号、顧客名、請求金額、請求日、期限日、ステータスの6フィールド必須',
          confirmationDate: '2026-10-01',
          confirmedBy: 'partner-architect-001'
        }
      ],
      executionTimestamp: '2026-10-07T06:31:50.000Z'
    };

    const mockAiClient: Tx12Imp1AiClient = {};

    await expect(runTx12Imp1Agent(input, mockAiClient)).rejects.toThrow(
      new MappingValidationFailedException(
        'マッピング検証に失敗しました。マッピング定義を確認してください。'
      )
    );
  });
});
