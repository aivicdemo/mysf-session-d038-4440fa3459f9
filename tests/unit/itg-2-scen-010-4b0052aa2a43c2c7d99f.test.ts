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

describe('SCEN-010: 操作履歴への記録に失敗した場合', () => {
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

  it('AuditTrailRecordingFailedExceptionが発生し、正しいエラーメッセージが返される', async () => {
    const input = {
      projectId: 'proj-migration-2026-001',
      targetSystemCandidates: [
        {
          systemId: 'oracle-erp-001',
          systemName: 'Oracle ERP',
          systemDescription: 'Oracle Enterprise Resource Planning System',
        },
      ],
      dataExtractionScope: {
        requiredDataItems: ['invoice_number', 'invoice_amount', 'invoice_date'],
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
        outlierStandardDeviations: 3,
      },
      currentDateTime: '2026-10-07T10:30:00Z',
      executingUserId: 'user-pm-001',
    };

    // スタブ化：認証成功
    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      hasPermission: true,
    });

    // スタブ化：プロジェクトコンテキスト解決成功
    (contextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: 'proj-migration-2026-001',
      isResolved: true,
    });

    // スタブ化：マッピング詳細取得成功
    (persistenceModule.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue({
      projectId: 'proj-migration-2026-001',
      status: 'ACTIVE',
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2028-12-31T23:59:59Z',
    });

    // スタブ化：操作履歴記録失敗
    (auditModule.recordMappingGenerationAuditTrail as jest.Mock).mockResolvedValue({
      auditTrailId: null,
      recordingFailed: true,
    });

    // AI クライアント：正常に処理を完了
    mockAiClient.extractDataItems = jest.fn().mockResolvedValue({
      items: [
        { itemName: 'invoice_number', value: 'INV-001' },
        { itemName: 'invoice_amount', value: 100000 },
        { itemName: 'invoice_date', value: '2026-01-01' },
      ],
    });

    mockAiClient.collectData = jest.fn().mockResolvedValue({
      collectedItems: [
        { itemName: 'invoice_number', value: 'INV-001' },
        { itemName: 'invoice_amount', value: 100000 },
        { itemName: 'invoice_date', value: '2026-01-01' },
      ],
    });

    mockAiClient.calculateTco = jest.fn().mockResolvedValue({
      tcoResults: [
        {
          systemId: 'oracle-erp-001',
          systemName: 'Oracle ERP',
          threeyearTotalCost: 1000000,
          costPerUser: 50000,
        },
      ],
    });

    mockAiClient.detectAnomalies = jest.fn().mockResolvedValue({
      anomalies: [],
    });

    // テスト実行
    let thrownError: Error | undefined;
    try {
      await runTx9Imp1Agent(input, mockAiClient);
    } catch (error) {
      thrownError = error as Error;
    }

    // エラーが発生したことを確認
    expect(thrownError).toBeDefined();
    expect(thrownError?.message).toBe(
      '操作履歴の記録に失敗しました。システム管理者に連絡してください。'
    );
  });
});
