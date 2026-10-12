import { runTx6Imp1Agent, type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-026: 営業データの集約処理が失敗すると、ダッシュボードデータがnullになり、executionStatusが失敗を示す', () => {
  it('should return failure status with null dashboardData when data aggregation fails', async () => {
    const mockAiClient: any = {
      fetchDealsForPeriod: jest.fn().mockRejectedValue(
        new Error('営業データの集約に失敗しました。システム管理者に連絡してください。')
      ),
      fetchSalesTargets: jest.fn().mockResolvedValue([]),
      fetchAllSalesRepresentatives: jest.fn().mockResolvedValue([]),
      fetchActivitiesByRepresentative: jest.fn().mockResolvedValue([]),
      fetchAllDealStages: jest.fn().mockResolvedValue([]),
      detectDataflowAnomalies: jest.fn().mockResolvedValue([]),
      aggregateSalesPerformanceForDashboard: jest.fn().mockResolvedValue([]),
      validateDashboardDataFreshness: jest.fn().mockResolvedValue({ isValid: true, warnings: [] }),
      validateDashboardDataIntegrity: jest.fn().mockResolvedValue({ isValid: true, warnings: [] }),
      optimizeDashboardPerformanceWithFallback: jest.fn().mockResolvedValue({ isOptimized: true, warnings: [] }),
      enforceAccessControlForDataDisplay: jest.fn().mockResolvedValue({ isAuthorized: true, restrictions: [] }),
      enforceSecurityPolicyForMobileAccess: jest.fn().mockResolvedValue({ isCompliant: true, restrictions: [] }),
      retrieveUnresolvedAnomalyLogs: jest.fn().mockResolvedValue([]),
    };

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

    expect(output.executionStatus).toEqual('failure');
    expect(output.dashboardData).toBeNull();
    expect(output.anomalies).toEqual([]);
    expect(output.warnings).toEqual([]);
    expect(output.notificationsSent).toEqual([]);
    expect(output.errorDetails).not.toBeNull();
    expect(output.errorDetails).toHaveLength(1);
    expect(output.errorDetails?.[0].errorCode).toEqual('DataAggregationFailure');
    expect(output.errorDetails?.[0].errorMessage).toEqual('営業データの集約に失敗しました。システム管理者に連絡してください。');
  });
});
