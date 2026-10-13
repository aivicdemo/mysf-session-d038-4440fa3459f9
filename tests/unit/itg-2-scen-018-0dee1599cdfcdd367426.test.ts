import { runTx12Imp1Agent, type Tx12Imp1AiClient, ExistingProcessDefinitionInvalidException } from '../../src/agents/tx-12-imp-1/orchestrator';
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

describe('SCEN-018: ExistingProcessDefinitionInvalidException', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ExistingProcessDefinitionInvalidException when existing process definitions have null required fields', async () => {
    const mockResolveProjectContext = projectContextResolver.resolveProjectContext as jest.Mock;
    mockResolveProjectContext.mockResolvedValue({
      projectId: 'proj-001',
      targetSystemId: 'target-sys-001'
    });

    const mockVerifyUserAuthenticationAndAuthorization = authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock;
    mockVerifyUserAuthenticationAndAuthorization.mockResolvedValue({
      userId: 'user-001'
    });

    const input = {
      projectId: 'proj-001',
      targetSystemId: 'target-sys-001',
      userId: 'user-001',
      existingProcessDefinitions: [
        {
          processName: null as any,
          processDescription: '請求書生成プロセス',
          workflowSteps: [
            {
              stepName: 'ステップ1',
              stepLogic: 'データ取得'
            }
          ],
          calculationLogics: [
            {
              logicName: '合計金額計算',
              logicExpression: 'SUM(amount)'
            }
          ]
        }
      ],
      partnerConfirmationDetails: [
        {
          confirmationTopic: '請求書フロー',
          confirmedContent: '承認ステップ2段階',
          confirmationDate: '2026-01-15',
          confirmedBy: 'partner-001'
        }
      ],
      executionTimestamp: '2026-01-15T10:30:00Z'
    };

    const mockAiClient: Tx12Imp1AiClient = {};

    await expect(runTx12Imp1Agent(input, mockAiClient)).rejects.toThrow(
      new ExistingProcessDefinitionInvalidException(
        '既存プロセス定義の形式が不正です。必須項目を確認してください。'
      )
    );
  });
});
