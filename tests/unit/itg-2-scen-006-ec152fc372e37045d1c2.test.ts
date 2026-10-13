import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import type { Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectModule from '../../src/logic/project-context-resolver';
import * as mappingModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/audit-trail-service');

describe('SCEN-006: データ項目自動抽出失敗時のエラーハンドリング', () => {
  let mockAiClient: Tx9Imp1AiClient;
  let recordAuditTrailMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // 認証・認可の成功をモック
    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      userId: 'user-migration-admin-001',
      roles: ['migration_admin'],
      hasPermission: true,
    });

    // プロジェクトコンテキスト解決の成功をモック
    (projectModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: 'proj-migration-2024-001',
      projectName: 'Salesforce to Oracle Migration',
      resolvedSuccessfully: true,
    });

    // 移行プロジェクトメタデータ取得の成功をモック
    (mappingModule.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue({
      projectId: 'proj-migration-2024-001',
      projectStatus: 'in_progress',
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2026-12-31T23:59:59Z',
    });

    recordAuditTrailMock = jest.fn().mockResolvedValue({
      auditTrailId: 'audit-trail-001',
    });
    (auditModule.recordMappingGenerationAuditTrail as jest.Mock) = recordAuditTrailMock;

    mockAiClient = {
      [Symbol.toStringTag]: 'Tx9Imp1AiClient',
    };
  });

  it('移行対象システムのデータ項目抽出失敗時にExceptionがスローされ、監査証跡に失敗詳細が記録される', async () => {
    const input = {
      projectId: 'proj-migration-2024-001',
      targetSystemCandidates: [
        {
          systemId: 'sys-oracle-erp-001',
          systemName: 'Oracle ERP System',
          systemDescription: 'Legacy Oracle-based billing system',
        },
      ],
      dataExtractionScope: {
        requiredDataItems: ['invoice_number', 'invoice_date', 'total_amount', 'customer_id'],
        departmentSources: [
          {
            departmentName: 'Finance',
            sourceSystemIds: ['sys-oracle-erp-001'],
          },
        ],
        collectionDeadline: '2024-12-31T23:59:59Z',
      },
      tcoPeriodYears: 3,
      anomalyDetectionThresholds: {
        costVariancePercentage: 15,
        dataCompletenessMinimum: 95,
        outlierStandardDeviations: 2.5,
      },
      currentDateTime: '2024-11-15T10:30:00Z',
      executingUserId: 'user-migration-admin-001',
    };

    // 認証・認可・プロジェクトコンテキスト・メタデータ取得は成功し、
    // データ抽出時点で失敗することを想定
    const rejectedPromise = runTx9Imp1Agent(input, mockAiClient);
    await expect(rejectedPromise).rejects.toThrow();

    // 監査証跡が記録されることを確認：
    // - データ抽出失敗を記録
    // - タイムスタンプ、実行ユーザー、プロジェクト、失敗ステップが含まれる
    expect(recordAuditTrailMock).toHaveBeenCalled();
    const auditCall = recordAuditTrailMock.mock.calls[0];
    expect(auditCall).toBeDefined();
    if (auditCall && auditCall[0]) {
      const auditData = auditCall[0];
      expect(auditData.timestamp).toBe('2024-11-15T10:30:00Z');
      expect(auditData.executingUserId).toBe('user-migration-admin-001');
      expect(auditData.projectId).toBe('proj-migration-2024-001');
      expect(auditData.failureStep).toBe('data_extraction');
    }
  });
});
