import { runTx12Imp1Agent, type Tx12Imp1AiClient, PartnerConfirmationDetailsInvalidException } from '../../src/agents/tx-12-imp-1/orchestrator';
import * as projectContextResolver from '../../src/logic/project-context-resolver';


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

import * as authorizationService from '../../src/logic/authentication-authorization';

describe('SCEN-025: PartnerConfirmationDetailsInvalidException', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw PartnerConfirmationDetailsInvalidException when partner confirmation details have missing required fields', async () => {
    const mockResolveProjectContext = projectContextResolver.resolveProjectContext as jest.Mock;
    mockResolveProjectContext.mockResolvedValue({
      projectId: 'proj-20250107-001',
      targetSystemId: 'tgt-oracle-erp-001',
      resolved: true
    });

    const mockVerifyUserAuthenticationAndAuthorization = authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock;
    mockVerifyUserAuthenticationAndAuthorization.mockResolvedValue({
      userId: 'user-migration-lead-001',
      authenticated: true,
      authorized: true
    });

    const input = {
      projectId: 'proj-20250107-001',
      targetSystemId: 'tgt-oracle-erp-001',
      userId: 'user-migration-lead-001',
      existingProcessDefinitions: [
        {
          processName: 'Invoice_Approval_Process',
          processDescription: 'Salesforce請求書承認ワークフロー',
          workflowSteps: [
            {
              stepName: 'Submit_for_Approval',
              stepLogic: "Status = 'Pending Approval'"
            }
          ],
          calculationLogics: [
            {
              logicName: 'Total_Amount_Calc',
              logicExpression: 'SUM(Line_Items.Amount)'
            }
          ]
        }
      ],
      partnerConfirmationDetails: [
        {
          confirmationTopic: 'Invoice_Structure_Mapping',
          confirmedContent: '',
          confirmationDate: '2025-01-07T10:00:00Z',
          confirmedBy: ''
        }
      ],
      executionTimestamp: '2025-01-07T11:30:00Z'
    };

    const mockAiClient: Tx12Imp1AiClient = {};

    await expect(runTx12Imp1Agent(input, mockAiClient)).rejects.toThrow(
      new PartnerConfirmationDetailsInvalidException(
        'パートナー確認内容の形式が不正です。必須項目を確認してください。'
      )
    );
  });
});
