import { runTx12Imp1Agent, type Tx12Imp1AiClient, UserAuthorizationFailedException } from '../../src/agents/tx-12-imp-1/orchestrator';
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

describe('SCEN-017: UserAuthorizationFailedException', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserAuthorizationFailedException when user lacks mapping execution authority', async () => {
    const mockResolveProjectContext = projectContextResolver.resolveProjectContext as jest.Mock;
    mockResolveProjectContext.mockResolvedValue({
      projectId: 'proj-migration-001',
      targetSystemId: 'sys-oracle-erp-001',
      isValid: true
    });

    const mockVerifyUserAuthenticationAndAuthorization = authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock;
    mockVerifyUserAuthenticationAndAuthorization.mockResolvedValue({
      userId: 'user-no-mapping-permission-001',
      isAuthenticated: true,
      hasMappingExecutionAuthority: false,
      authorizedPermissions: ['view_mapping', 'download_report']
    });

    const input = {
      projectId: 'proj-migration-001',
      targetSystemId: 'sys-oracle-erp-001',
      userId: 'user-no-mapping-permission-001',
      existingProcessDefinitions: [
        {
          processName: '請求書作成プロセス',
          processDescription: '商談から請求書を自動生成',
          workflowSteps: [
            {
              stepName: '商談検証',
              stepLogic: '金額 > 0'
            }
          ],
          calculationLogics: [
            {
              logicName: '税額計算',
              logicExpression: '金額 * 0.1'
            }
          ]
        }
      ],
      partnerConfirmationDetails: [
        {
          confirmationTopic: '請求書フロー要件',
          confirmedContent: 'Oracle請求モジュールとの統合方式を確認',
          confirmationDate: '2026-10-01',
          confirmedBy: 'partner-pm-001'
        }
      ],
      executionTimestamp: '2026-10-07T10:00:00Z'
    };

    const mockAiClient: Tx12Imp1AiClient = {};

    await expect(runTx12Imp1Agent(input, mockAiClient)).rejects.toThrow(
      new UserAuthorizationFailedException(
        'この操作を実行する権限がありません。'
      )
    );
  });
});
