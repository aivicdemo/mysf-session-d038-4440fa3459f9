import { runTx9Imp1Agent, Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';
import * as authModule from '../../src/logic/authentication-authorization';
import * as contextModule from '../../src/logic/project-context-resolver';
import * as persistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));

jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn(),
}));

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  retrieveMappingDetailsForProject: jest.fn(),
}));

jest.mock('../../src/logic/audit-trail-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/audit-trail-service')>('../../src/logic/audit-trail-service'),
  recordMappingGenerationAuditTrail: jest.fn(),
}));

describe('SCEN-009: 異常値検出処理が実行できない、またはエラーになった場合', () => {
  let mockAiClient: jest.Mocked<Tx9Imp1AiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAiClient = {
      extractDataItems: jest.fn(),
      collectData: jest.fn(),
      calculateTco: jest.fn(),
      detectAnomalies: jest.fn(),
    } as any;
  });

  it('AnomalyDetectionFailedExceptionが発生し、正しいエラーメッセージが返される', async () => {
    const input = {
      projectId: 'proj-migration-001',
      targetSystemCandidates: [
        {
          systemId: 'oracle-erp-001',
          systemName: 'Oracle ERP',
          systemDescription: 'Oracle請求管理システム',
        },
      ],
      dataExtractionScope: {
        requiredDataItems: ['invoice_amount', 'invoice_date', 'customer_id'],
        departmentSources: [
          {
            departmentName: 'Finance',
            sourceSystemIds: ['oracle-erp-001'],
          },
        ],
        collectionDeadline: '2026-12-31T23:59:59Z',
      },
      tcoPeriodYears: 3,
      anomalyDetectionThresholds: {
        costVariancePercentage: 15,
        dataCompletenessMinimum: 95,
        outlierStandardDeviations: 2.5,
      },
      currentDateTime: '2026-10-07T12:00:00Z',
      executingUserId: 'user-migration-001',
    };

    // スタブ化：認証成功
    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId: 'user-migration-001',
      roles: ['migration_manager'],
      isAuthenticated: true,
    });

    // スタブ化：プロジェクトコンテキスト解決成功
    (contextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: 'proj-migration-001',
      targetSystemIds: ['oracle-erp-001'],
      contextResolved: true,
    });

    // スタブ化：マッピング詳細取得成功
    (persistenceModule.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue({
      projectId: 'proj-migration-001',
      status: 'active',
      migrationStartDate: '2026-09-01T00:00:00Z',
      migrationEndDate: '2027-09-01T00:00:00Z',
    });

    // AI クライアントの異常値検出処理をモック：エラーを発生
    mockAiClient.detectAnomalies = jest.fn().mockRejectedValue(
      new Error('Data type mismatch or resource exhaustion')
    );

    // テスト実行
    let thrownError: Error | undefined;
    try {
      await runTx9Imp1Agent(input, mockAiClient);
    } catch (error) {
      thrownError = error as Error;
    }

    // エラーが発生したことを確認
    expect(thrownError).toBeDefined();
    expect(thrownError?.message).toBe('異常値検出処理に失敗しました。TCO試算データを確認してください。');
  });
});
