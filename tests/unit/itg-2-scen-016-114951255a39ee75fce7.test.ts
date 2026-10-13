import { runTx12Imp1Agent, type Tx12Imp1AiClient, UserAuthenticationFailedException } from '../../src/agents/tx-12-imp-1/orchestrator';
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

describe('SCEN-016: UserAuthenticationFailedException', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserAuthenticationFailedException when user authentication fails', async () => {
    const mockResolveProjectContext = projectContextResolver.resolveProjectContext as jest.Mock;
    mockResolveProjectContext.mockResolvedValue({
      projectId: 'proj-20250107-001',
      targetSystemId: 'target-oracle-erp-001'
    });

    const mockVerifyUserAuthenticationAndAuthorization = authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock;
    mockVerifyUserAuthenticationAndAuthorization.mockResolvedValue({
      isAuthenticated: false,
      userId: 'user-12345'
    });

    const input = {
      projectId: 'proj-20250107-001',
      targetSystemId: 'target-oracle-erp-001',
      userId: 'user-12345',
      existingProcessDefinitions: [
        {
          processName: '請求書作成プロセス',
          processDescription: '商談から請求書を自動生成',
          workflowSteps: [
            {
              stepName: '請求書レコード作成',
              stepLogic: '商談レコードをトリガーに請求書カスタムオブジェクトを作成'
            }
          ],
          calculationLogics: [
            {
              logicName: '請求額計算',
              logicExpression: 'SUM(商談商品.単価 * 商談商品.数量)'
            }
          ]
        }
      ],
      partnerConfirmationDetails: [
        {
          confirmationTopic: '請求書オブジェクトマッピング',
          confirmedContent: 'Salesforce請求書カスタムオブジェクト → Oracle請求テーブルへのマッピング確認済み',
          confirmationDate: '2025-01-07T10:00:00Z',
          confirmedBy: 'partner-user-001'
        }
      ],
      executionTimestamp: '2025-01-07T14:30:00Z'
    };

    const mockAiClient: Tx12Imp1AiClient = {};

    await expect(runTx12Imp1Agent(input, mockAiClient)).rejects.toThrow(
      new UserAuthenticationFailedException(
        'ユーザーの認証に失敗しました。ログインし直してください。'
      )
    );
  });
});
