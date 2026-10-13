import { runTx12Imp1Agent, type Tx12Imp1AiClient, SalesforceObjectStructureExtractionFailedException } from '../../src/agents/tx-12-imp-1/orchestrator';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationService from '../../src/logic/authentication-authorization';


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

import * as mappingGenerationService from '../../src/logic/mapping-generation-service';

describe('SCEN-019: SalesforceObjectStructureExtractionFailedException', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw SalesforceObjectStructureExtractionFailedException when generateMappingTable returns null', async () => {
    const mockResolveProjectContext = projectContextResolver.resolveProjectContext as jest.Mock;
    mockResolveProjectContext.mockResolvedValue({
      projectId: 'proj-sf-migration-001',
      targetSystemId: 'target-sys-oracle-erp-001',
      isValid: true,
      userAccessLevel: 'full'
    });

    const mockVerifyUserAuthenticationAndAuthorization = authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock;
    mockVerifyUserAuthenticationAndAuthorization.mockResolvedValue({
      userId: 'user-mapper-001',
      isAuthenticated: true,
      hasMappingExecutionPermission: true,
      authorizationLevel: 'admin'
    });

    const mockGenerateMappingTable = mappingGenerationService.generateMappingTable as jest.Mock;
    mockGenerateMappingTable.mockResolvedValue(null);

    const input = {
      projectId: 'proj-sf-migration-001',
      targetSystemId: 'target-sys-oracle-erp-001',
      userId: 'user-mapper-001',
      existingProcessDefinitions: [
        {
          processName: '請求書作成プロセス',
          processDescription: '取引先から商談を経由して請求書を生成するプロセス',
          workflowSteps: [
            {
              stepName: '商談確定検証',
              stepLogic: '商談ステージが確定済みであることを確認'
            },
            {
              stepName: '請求書オブジェクト生成',
              stepLogic: 'Salesforceカスタムオブジェクト Invoice__c を生成'
            }
          ],
          calculationLogics: [
            {
              logicName: '請求金額計算',
              logicExpression: 'SUM(InvoiceLineItem__c.Amount__c) WHERE Invoice__c.Id = this.Id'
            }
          ]
        }
      ],
      partnerConfirmationDetails: [
        {
          confirmationTopic: '請求オブジェクト構造',
          confirmedContent: 'カスタムオブジェクト Invoice__c と InvoiceLineItem__c の構造が確認された',
          confirmationDate: '2026-10-01',
          confirmedBy: 'partner-001'
        }
      ],
      executionTimestamp: '2026-10-07T10:00:00Z'
    };

    const mockAiClient: Tx12Imp1AiClient = {};

    await expect(runTx12Imp1Agent(input, mockAiClient)).rejects.toThrow(
      new SalesforceObjectStructureExtractionFailedException(
        'Salesforceオブジェクト構造の抽出に失敗しました。オブジェクト定義を確認してください。'
      )
    );
  });
});
