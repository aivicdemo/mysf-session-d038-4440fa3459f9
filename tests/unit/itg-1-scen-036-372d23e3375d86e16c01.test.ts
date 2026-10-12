import { runTx6Imp1Agent, Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-036: Anomaly logging failure results in partial_success status', () => {
  let aiClient: jest.Mocked<Tx6Imp1AiClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    aiClient = {
      detectDataflowAnomalies: jest.fn(),
      fetchDealsForPeriod: jest.fn(),
      fetchSalesTargets: jest.fn(),
      fetchAllSalesRepresentatives: jest.fn(),
      fetchActivitiesByRepresentative: jest.fn(),
      fetchAllDealStages: jest.fn(),
      aggregateSalesPerformanceForDashboard: jest.fn(),
      validateDashboardDataFreshness: jest.fn(),
      validateDashboardDataIntegrity: jest.fn(),
      optimizeDashboardPerformanceWithFallback: jest.fn(),
      enforceAccessControlForDataDisplay: jest.fn(),
      enforceSecurityPolicyForMobileAccess: jest.fn(),
      retrieveUnresolvedAnomalyLogs: jest.fn(),
      recordAnomalyDetection: jest.fn(),
      notifyAnomalyDetection: jest.fn(),
    } as unknown as jest.Mocked<Tx6Imp1AiClient>;

    // Setup mock returns per preconditions
    (aiClient.detectDataflowAnomalies as jest.Mock).mockResolvedValue({
      anomalies: [
        {
          type: 'amount_mismatch',
          dealId: 'DEAL-2026-001',
          description: '請求額が商談金額と不一致',
          severity: 'high',
          detectedAt: '2026-10-14T16:00:00Z',
        },
      ],
      success: true,
    });

    (aiClient.fetchDealsForPeriod as jest.Mock).mockResolvedValue([
      {
        dealId: 'DEAL-2026-001',
        salesRepId: 'REP-001',
        amount: 500000,
        stageId: 'STAGE-3',
        lastUpdated: '2026-10-14T15:00:00Z',
      },
    ]);

    (aiClient.fetchSalesTargets as jest.Mock).mockResolvedValue([
      {
        salesRepId: 'REP-001',
        targetAmount: 1000000,
        targetCount: 5,
      },
    ]);

    (aiClient.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      {
        salesRepId: 'REP-001',
        name: '営業太郎',
        organizationId: 'ORG-001',
        email: 'taro@example.com',
      },
    ]);

    (aiClient.fetchActivitiesByRepresentative as jest.Mock).mockResolvedValue([
      {
        salesRepId: 'REP-001',
        activityCount: 8,
        frequency: 'daily',
        performance: 0.85,
      },
    ]);

    (aiClient.fetchAllDealStages as jest.Mock).mockResolvedValue([
      {
        stageId: 'STAGE-1',
        stageName: '初期接触',
        order: 1,
      },
      {
        stageId: 'STAGE-3',
        stageName: '提案中',
        order: 3,
      },
    ]);

    (aiClient.aggregateSalesPerformanceForDashboard as jest.Mock).mockResolvedValue({
      aggregationId: 'AGG-2026-001',
      performanceData: [
        {
          salesRepId: 'REP-001',
          achievementRate: 0.5,
          guidancePriorityScore: 8.5,
        },
      ],
      success: true,
    });

    (aiClient.validateDashboardDataFreshness as jest.Mock).mockResolvedValue({
      isFresh: true,
      lastUpdateTime: '2026-10-15T10:00:00Z',
      warning: null,
    });

    (aiClient.validateDashboardDataIntegrity as jest.Mock).mockResolvedValue({
      isIntegral: true,
      missingRecords: 0,
      warning: null,
    });

    (aiClient.optimizeDashboardPerformanceWithFallback as jest.Mock).mockResolvedValue({
      responseTime: 2500,
      optimizationApplied: false,
      fallbackUsed: false,
      warning: null,
    });

    (aiClient.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue({
      allowedOrgIds: ['ORG-001'],
      viewableDataLevel: 'organization',
      granted: true,
    });

    (aiClient.enforceSecurityPolicyForMobileAccess as jest.Mock).mockResolvedValue({
      isMobileDevice: false,
      policyEnforced: false,
      dataRestriction: null,
    });

    (aiClient.retrieveUnresolvedAnomalyLogs as jest.Mock).mockResolvedValue([
      {
        logId: 'LOG-2026-001',
        type: 'amount_mismatch',
        dealId: 'DEAL-2026-001',
        status: 'unresolved',
        createdAt: '2026-10-14T16:00:00Z',
      },
    ]);

    // recordAnomalyDetection fails
    (aiClient.recordAnomalyDetection as jest.Mock).mockResolvedValue({
      success: false,
      errorCode: 'LOGGING_ERROR',
      errorMessage: '異常検知ログの記録に失敗しました。',
    });

    (aiClient.notifyAnomalyDetection as jest.Mock).mockResolvedValue({
      notificationsSent: [
        {
          status: 'sent',
          sentAt: '2026-10-15T10:30:30Z',
        },
      ],
      success: true,
    });
  });

  it('should return partial_success when anomaly logging fails', async () => {
    const input = {
      currentDateTime: new Date('2026-10-15T10:30:00Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-10-15T23:59:59Z'),
      requestingUserId: 'user-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
      },
    };

    const result = await runTx6Imp1Agent(input, aiClient);

    expect(result.executionStatus).toBe('partial_success');
  });

  it('should include detected anomaly in anomalies array', async () => {
    const input = {
      currentDateTime: new Date('2026-10-15T10:30:00Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-10-15T23:59:59Z'),
      requestingUserId: 'user-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
      },
    };

    const result = await runTx6Imp1Agent(input, aiClient);

    expect(result.anomalies).toContainEqual(
      expect.objectContaining({
        type: 'amount_mismatch',
        dealId: 'DEAL-2026-001',
        severity: 'high',
      }),
    );
  });

  it('should generate non-null dashboard data', async () => {
    const input = {
      currentDateTime: new Date('2026-10-15T10:30:00Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-10-15T23:59:59Z'),
      requestingUserId: 'user-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
      },
    };

    const result = await runTx6Imp1Agent(input, aiClient);

    expect(result.dashboardData).not.toBeNull();
  });

  it('should have empty warnings array', async () => {
    const input = {
      currentDateTime: new Date('2026-10-15T10:30:00Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-10-15T23:59:59Z'),
      requestingUserId: 'user-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
      },
    };

    const result = await runTx6Imp1Agent(input, aiClient);

    expect(result.warnings).toEqual([]);
  });

  it('should include notification sent result', async () => {
    const input = {
      currentDateTime: new Date('2026-10-15T10:30:00Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-10-15T23:59:59Z'),
      requestingUserId: 'user-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
      },
    };

    const result = await runTx6Imp1Agent(input, aiClient);

    expect(result.notificationsSent).toContainEqual(
      expect.objectContaining({
        status: 'sent',
      }),
    );
  });

  it('should include AnomalyLoggingFailure in errorDetails', async () => {
    const input = {
      currentDateTime: new Date('2026-10-15T10:30:00Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-10-15T23:59:59Z'),
      requestingUserId: 'user-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
      },
    };

    const result = await runTx6Imp1Agent(input, aiClient);

    expect(result.errorDetails).not.toBeNull();
    if (result.errorDetails) {
      expect(result.errorDetails).toContainEqual(
        expect.objectContaining({
          errorCode: 'AnomalyLoggingFailure',
          errorMessage: '異常検知ログの記録に失敗しました。',
        }),
      );
    }
  });
});
