import { jest } from '@jest/globals';
import { runTx6Imp1Agent, type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-028: 営業実績集計処理が失敗すると、異常値ハイライト・指導優先度スコアが生成できず、警告が生成される', () => {
  let mockAiClient: any;

  beforeEach(() => {
    mockAiClient = {
      // @ts-ignore
      fetchDealsForPeriod: jest.fn().mockResolvedValue([
        {
          dealId: 'deal-001',
          representativeId: 'rep-001',
          amount: 500000,
          stage: '商談',
          createdAt: '2026-10-05T08:30:00Z',
        },
        {
          dealId: 'deal-002',
          representativeId: 'rep-002',
          amount: 300000,
          stage: '提案',
          createdAt: '2026-10-10T14:15:00Z',
        },
      ]),
      // @ts-ignore
      fetchSalesTargets: jest.fn().mockResolvedValue([
        { representativeId: 'rep-001', targetAmount: 1000000, targetCount: 5 },
        { representativeId: 'rep-002', targetAmount: 800000, targetCount: 4 },
      ]),
      // @ts-ignore
      fetchAllSalesRepresentatives: jest.fn().mockResolvedValue([
        { representativeId: 'rep-001', name: '営業太郎', organizationLevel: 'level-2' },
        { representativeId: 'rep-002', name: '営業花子', organizationLevel: 'level-2' },
      ]),
      // @ts-ignore
      fetchActivitiesByRepresentative: jest.fn().mockResolvedValue([
        { representativeId: 'rep-001', activityCount: 12, frequency: 2.4 },
        { representativeId: 'rep-002', activityCount: 8, frequency: 1.6 },
      ]),
      // @ts-ignore
      fetchAllDealStages: jest.fn().mockResolvedValue([
        { stageId: 'stage-001', stageName: '初期接触', order: 1 },
        { stageId: 'stage-002', stageName: '提案', order: 2 },
        { stageId: 'stage-003', stageName: '商談', order: 3 },
        { stageId: 'stage-004', stageName: '受注', order: 4 },
      ]),
      // @ts-ignore
      detectDataflowAnomalies: jest.fn().mockResolvedValue({
        anomalies: [
          {
            anomalyId: 'anom-001',
            type: '金額ズレ',
            severity: 'high',
            description: 'deal-001の請求金額が営業実績と不一致',
          },
        ],
      }),
      aggregateSalesPerformanceForDashboard: jest.fn().mockRejectedValue(
        // @ts-ignore
        new Error('異常値ハイライト・指導優先度スコアの計算に失敗しました')
      ),
      // @ts-ignore
      validateDashboardDataFreshness: jest.fn().mockResolvedValue({ isFresh: true, lastUpdateTime: '2026-10-15T09:55:00Z' }),
      // @ts-ignore
      validateDashboardDataIntegrity: jest.fn().mockResolvedValue({ isIntegral: true, missingFields: [] }),
      // @ts-ignore
      optimizeDashboardPerformanceWithFallback: jest.fn().mockResolvedValue({ responseTime: 2500, isOptimized: true, useFallback: false }),
      // @ts-ignore
      enforceAccessControlForDataDisplay: jest.fn().mockResolvedValue({ isAuthorized: true, visibleRepresentatives: ['rep-001', 'rep-002'] }),
      // @ts-ignore
      enforceSecurityPolicyForMobileAccess: jest.fn().mockResolvedValue({ isCompliant: true, restrictedFields: [] }),
      // @ts-ignore
      retrieveUnresolvedAnomalyLogs: jest.fn().mockResolvedValue([
        {
          logId: 'log-001',
          anomalyType: 'ステータス不整合',
          recordedAt: '2026-10-12T16:20:00Z',
          isResolved: false,
        },
      ]),
    };
  });

  it('should return partial_success with warning when performance aggregation fails', async () => {
    const input: any = {
      currentDateTime: new Date('2026-10-15T10:00:00Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-10-15T23:59:59Z'),
      requestingUserId: 'user-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.100',
      },
    };

    const output = await runTx6Imp1Agent(input, mockAiClient);

    expect(output.executionStatus).toEqual('partial_success');
    expect(output.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          warningType: 'PerformanceAnomalyDetectionFailure',
          message: '営業実績の集計に失敗しました。基本情報のみ表示します。',
        }),
      ])
    );
    expect(output.dashboardData).not.toBeNull();
    expect(output.anomalies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          anomalyType: '金額ズレ',
          severity: 'high',
        }),
      ])
    );
    expect(output.errorDetails).toBeNull();
    expect(output.notificationsSent).toEqual([]);
  });
});
