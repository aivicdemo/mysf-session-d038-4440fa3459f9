import { runTx12Imp1Agent, type Tx12Imp1AiClient, MappingGenerationFailedException } from '../../src/agents/tx-12-imp-1/orchestrator';
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

describe('SCEN-020: MappingGenerationFailedException', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw MappingGenerationFailedException when generateMappingTable returns null', async () => {
    const mockResolveProjectContext = projectContextResolver.resolveProjectContext as jest.Mock;
    mockResolveProjectContext.mockResolvedValue({
      projectId: 'proj-salesforce-migration-001',
      targetSystemId: 'target-sys-oracle-erp-001',
      resolvedAt: '2026-10-07T14:30:00Z',
      status: 'resolved'
    });

    const mockVerifyUserAuthenticationAndAuthorization = authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock;
    mockVerifyUserAuthenticationAndAuthorization.mockResolvedValue({
      userId: 'user-migration-manager-001',
      permissions: ['mapping:generate', 'mapping:validate', 'mapping:export']
    });

    const mockGenerateMappingTable = mappingGenerationService.generateMappingTable as jest.Mock;
    mockGenerateMappingTable.mockResolvedValue(null);

    const input = {
      projectId: 'proj-salesforce-migration-001',
      targetSystemId: 'target-sys-oracle-erp-001',
      userId: 'user-migration-manager-001',
      existingProcessDefinitions: [
        {
          processName: '請求書作成プロセス',
          processDescription: 'Salesforceカスタムオブジェクトから請求書を生成',
          workflowSteps: [
            {
              stepName: '商談確定検証',
              stepLogic: '商談ステージがクローズ勝利の場合、請求書作成対象にマーク'
            }
          ],
          calculationLogics: [
            {
              logicName: '請求金額計算',
              logicExpression: 'SUM(請求明細.金額)'
            }
          ]
        }
      ],
      partnerConfirmationDetails: [
        {
          confirmationTopic: '請求機能要件',
          confirmedContent: 'Oracle ERPの請求機能は複数通貨対応が標準。Salesforceカスタムオブジェクトは単一通貨のみ。',
          confirmationDate: '2026-10-01T10:00:00Z',
          confirmedBy: 'partner-finance-lead-001'
        }
      ],
      executionTimestamp: '2026-10-07T14:30:00Z'
    };

    const mockAiClient: Tx12Imp1AiClient = {};

    await expect(runTx12Imp1Agent(input, mockAiClient)).rejects.toThrow(
      new MappingGenerationFailedException(
        '機能マッピング表の生成に失敗しました。入力データを確認してください。'
      )
    );
  });
});
