import { runTx12Imp1Agent, type Tx12Imp1AiClient, ReferenceRelationshipAnalysisFailedException } from '../../src/agents/tx-12-imp-1/orchestrator';
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

import * as referenceRelationshipAnalyzer from '../../src/logic/reference-relationship-analyzer';

describe('SCEN-023: ReferenceRelationshipAnalysisFailedException', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ReferenceRelationshipAnalysisFailedException when reference relationship analysis fails', async () => {
    const mockResolveProjectContext = projectContextResolver.resolveProjectContext as jest.Mock;
    mockResolveProjectContext.mockResolvedValue({
      projectId: 'proj-migration-2026-001',
      targetSystemId: 'target-erp-oracle-001'
    });

    const mockVerifyUserAuthenticationAndAuthorization = authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock;
    mockVerifyUserAuthenticationAndAuthorization.mockResolvedValue({
      userId: 'user-migration-specialist-001',
      authenticationStatus: 'authenticated',
      mappingExecutionPermission: 'granted'
    });

    const mockAnalyzeReferenceRelationships = referenceRelationshipAnalyzer.analyzeReferenceRelationships as jest.Mock;
    mockAnalyzeReferenceRelationships.mockResolvedValue({
      status: 'failure',
      errorMessage: 'Circular dependency detected in Invoice-InvoiceLineItem-Product reference chain. Unable to resolve bidirectional references.'
    });

    const input = {
      projectId: 'proj-migration-2026-001',
      targetSystemId: 'target-erp-oracle-001',
      userId: 'user-migration-specialist-001',
      existingProcessDefinitions: [
        {
          processName: 'Invoice Generation Process',
          processDescription: '既存Salesforceの請求書生成ワークフロー',
          workflowSteps: [
            {
              stepName: 'Validate Invoice',
              stepLogic: 'Check mandatory fields'
            },
            {
              stepName: 'Calculate Total Amount',
              stepLogic: 'Sum line items'
            }
          ],
          calculationLogics: [
            {
              logicName: 'Line Item Tax Calculation',
              logicExpression: 'Amount * TaxRate'
            }
          ]
        }
      ],
      partnerConfirmationDetails: [
        {
          confirmationTopic: 'Invoice Object Mapping',
          confirmedContent: 'Confirmed mapping of Salesforce Invoice custom object to Oracle AR_INVOICES table',
          confirmationDate: '2026-01-15T10:30:00Z',
          confirmedBy: 'partner-stakeholder-001'
        }
      ],
      executionTimestamp: '2026-01-20T14:00:00Z'
    };

    const mockAiClient: Tx12Imp1AiClient = {};

    await expect(runTx12Imp1Agent(input, mockAiClient)).rejects.toThrow(
      new ReferenceRelationshipAnalysisFailedException(
        '参照関係の解析に失敗しました。オブジェクト定義を確認してください。'
      )
    );
  });
});
