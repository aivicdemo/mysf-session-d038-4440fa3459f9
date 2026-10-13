import { runTx12Imp1Agent, type Tx12Imp1AiClient, ProjectContextNotResolvedException } from '../../src/agents/tx-12-imp-1/orchestrator';
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

describe('SCEN-015: ProjectContextNotResolvedException', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ProjectContextNotResolvedException when resolveProjectContext fails', async () => {
    const mockResolveProjectContext = projectContextResolver.resolveProjectContext as jest.Mock;
    mockResolveProjectContext.mockResolvedValue(null);

    const input = {
      projectId: 'proj-20250107-001',
      targetSystemId: 'sys-oracle-erp-v11',
      userId: 'user-migration-lead-001',
      existingProcessDefinitions: [
        {
          processName: '請求書作成フロー',
          processDescription: 'Salesforceの請求書カスタムオブジェクトの作成・更新フロー',
          workflowSteps: [
            {
              stepName: '金額計算',
              stepLogic: '請求明細の合計から税金を計算'
            }
          ],
          calculationLogics: [
            {
              logicName: '請求額合計',
              logicExpression: 'SUM(請求明細.金額)'
            }
          ]
        }
      ],
      partnerConfirmationDetails: [
        {
          confirmationTopic: '請求機能の仕様確認',
          confirmedContent: 'Oracle ERP標準の請求機能で対応可能',
          confirmationDate: '2025-01-06',
          confirmedBy: 'partner-consultant-001'
        }
      ],
      executionTimestamp: '2025-01-07T09:30:00.000Z'
    };

    const mockAiClient: Tx12Imp1AiClient = {};

    await expect(runTx12Imp1Agent(input, mockAiClient)).rejects.toThrow(
      new ProjectContextNotResolvedException(
        'プロジェクトコンテキストが解決できません。プロジェクトIDと移行対象システムIDを確認してください。'
      )
    );
  });
});
