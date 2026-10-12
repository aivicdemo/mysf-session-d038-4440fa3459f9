import { runTx9Imp1Agent, LicenseMetricsRetrievalFailed, type Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';
import * as tcoEstimation from '../../src/logic/tco-estimation';

jest.mock('../../src/logic/tco-estimation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/tco-estimation')>('../../src/logic/tco-estimation'),
  estimateTCOForMigrationCandidates: jest.fn(),
}));

describe('SCEN-074: TCO試算モジュールの呼び出しに失敗してライセンスメトリクスが取得できない場合、LicenseMetricsRetrievalFailedエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return failed status with LicenseMetricsRetrievalFailed error when estimateTCOForMigrationCandidates fails', async () => {
    const input: any = {
      migrationCandidates: [
        {
          candidateId: 'CAND-001',
          candidateName: 'Microsoft Dynamics 365',
          systemType: 'CRM',
        },
        {
          candidateId: 'CAND-002',
          candidateName: 'SAP C/4HANA',
          systemType: 'ERP',
        },
      ],
      currentDateTime: new Date('2026-10-07T10:00:00.000Z'),
      executionContext: {
        userId: 'USER-001',
        userRole: 'financial_analyst',
        organizationId: 'ORG-001',
        sessionId: 'SESSION-12345',
      },
    };

    const errorResponse = {
      success: false,
      errorCode: 'LICENSE_METRICS_RETRIEVAL_FAILED',
      errorMessage: 'ライセンス情報取得API呼び出し時に接続タイムアウト発生',
      licenseMetricsForCandidates: null,
      threeYearTCOBaseline: null,
      tcoAnomalousValues: null,
    };

    (tcoEstimation.estimateTCOForMigrationCandidates as jest.Mock).mockResolvedValue(errorResponse);

    const result = await runTx9Imp1Agent(input, {} as any);

    expect(result.status).toBe('failed');
    expect(result.tcoEstimationResults).toEqual([]);
    expect(result.anomalousValues).toEqual([]);
    expect(result.dataCollectionSummary.failedCollections).toBe(2);
    expect(result.dataCollectionSummary.successfulCollections).toBe(0);

    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails).not.toBeNull();
    const error = result.errorDetails![0];
    expect(error.errorCode).toBe('LicenseMetricsRetrievalFailed');
    expect(error.errorMessage).toBe('ライセンス情報の取得に失敗しました。各部門のシステムへのアクセスを確認してください。');
    expect(error.affectedCandidates).toContain('CAND-001');
    expect(error.affectedCandidates).toContain('CAND-002');

    expect(result.executionLog.some(log => log.step === 'TCO Estimation' && log.status === 'failed')).toBe(true);
  });
});
