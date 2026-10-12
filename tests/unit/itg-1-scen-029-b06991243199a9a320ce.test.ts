import { jest } from '@jest/globals';
import { runTx6Imp1Agent, type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-029: ダッシュボード表示データの鮮度が不足すると、警告が追加される', () => {
  it('should include freshness warning when data is older than threshold', async () => {
    const mockAiClient: any = {
      // @ts-ignore
      fetchDealsForPeriod: jest.fn().mockResolvedValue([]),
      // @ts-ignore
      fetchSalesTargets: jest.fn().mockResolvedValue([]),
      // @ts-ignore
      fetchAllSalesRepresentatives: jest.fn().mockResolvedValue([]),
      // @ts-ignore
      fetchActivitiesByRepresentative: jest.fn().mockResolvedValue([]),
      // @ts-ignore
      fetchAllDealStages: jest.fn().mockResolvedValue([]),
      // @ts-ignore
      detectDataflowAnomalies: jest.fn().mockResolvedValue({ anomalies: [], detectionStatus: 'success' }),
      // @ts-ignore
      aggregateSalesPerformanceForDashboard: jest.fn().mockResolvedValue({
        aggregationStatus: 'success',
        performanceData: [
          { salesRepId: 'rep-001', targetAmount: 1000000, achievedAmount: 750000, achievementRate: 75, dealCount: 15 },
        ],
      }),
      // @ts-ignore
      validateDashboardDataFreshness: jest.fn().mockResolvedValue({
        freshnessValid: false,
        lastUpdateTime: '2026-10-15T08:00:00Z',
        freshnessThresholdMinutes: 120,
        minutesSinceLastUpdate: 390,
        warning: '表示データが古い可能性があります。最新データの再取得を推奨します。',
      }),
      // @ts-ignore
      validateDashboardDataIntegrity: jest.fn().mockResolvedValue({
        integrityValid: true,
        missingDataCount: 0,
        inconsistencyCount: 0,
      }),
      // @ts-ignore
      optimizeDashboardPerformanceWithFallback: jest.fn().mockResolvedValue({
        responseTimeMs: 1200,
        isWithinThreshold: true,
        fallbackApplied: false,
      }),
      // @ts-ignore
      enforceAccessControlForDataDisplay: jest.fn().mockResolvedValue({
        isAccessAllowed: true,
        dataAccessLevel: 'full',
      }),
      // @ts-ignore
      enforceSecurityPolicyForMobileAccess: jest.fn().mockResolvedValue({
        isPolicyCompliant: true,
        restrictedFieldCount: 0,
      }),
      // @ts-ignore
      retrieveUnresolvedAnomalyLogs: jest.fn().mockResolvedValue({ unresolvedAnomalies: [] }),
    };

    const input: any = {
      currentDateTime: new Date('2026-10-15T14:30:00Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-10-15T23:59:59Z'),
      requestingUserId: 'user-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.100',
      },
    };

    const output = await runTx6Imp1Agent(input, mockAiClient);

    expect(output.executionStatus).toEqual('success');
    expect(output.dashboardData).not.toBeNull();
    expect(output.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          warningType: 'DataFreshnessWarning',
          message: '表示データが古い可能性があります。最新データの再取得を推奨します。',
        }),
      ])
    );
    expect(output.anomalies).toEqual([]);
    expect(output.notificationsSent).toEqual([]);
    expect(output.errorDetails).toBeNull();
  });
});
