import { runTx6Imp1Agent, Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-027: Anomaly detection failure results in partial_success status', () => {
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
    (aiClient.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: [
        {
          dealId: 'deal-A',
          dealName: '案件A',
          amount: 500000,
          stageId: 'stage-negotiation',
          ownerId: 'rep-001',
          createdAt: '2026-10-02T08:00:00Z',
        },
      ],
      activities: [
        {
          activityId: 'act-001',
          representativeId: 'rep-001',
          activityDate: '2026-10-05T14:00:00Z',
        },
      ],
    });

    (aiClient.fetchSalesTargets as jest.Mock).mockResolvedValue([
      {
        representativeId: 'rep-001',
        targetAmount: 2000000,
        targetCount: 10,
      },
    ]);

    (aiClient.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      {
        representativeId: 'rep-001',
        name: '営業太郎',
        organizationId: 'org-001',
      },
    ]);

    (aiClient.fetchActivitiesByRepresentative as jest.Mock).mockResolvedValue([
      {
        representativeId: 'rep-001',
        activityCount: 5,
        frequency: 'daily',
      },
    ]);

    (aiClient.fetchAllDealStages as jest.Mock).mockResolvedValue([
      {
        stageId: 'stage-negotiation',
        stageName: '交渉中',
        sequenceOrder: 3,
      },
    ]);

    // Anomaly detection fails
    (aiClient.detectDataflowAnomalies as jest.Mock).mockRejectedValue(
      new Error('Anomaly detection process failed'),
    );

    (aiClient.aggregateSalesPerformanceForDashboard as jest.Mock).mockResolvedValue({
      performanceByRepresentative: [
        {
          representativeId: 'rep-001',
          achievementRate: 0.25,
          anomalyHighlights: [],
          guidancePriorityScore: 0.5,
        },
      ],
    });

    (aiClient.validateDashboardDataFreshness as jest.Mock).mockResolvedValue({
      isFresh: true,
      lastUpdateTime: '2026-10-07T09:55:00Z',
    });

    (aiClient.validateDashboardDataIntegrity as jest.Mock).mockResolvedValue({
      isIntegral: true,
      missingFields: [],
    });

    (aiClient.optimizeDashboardPerformanceWithFallback as jest.Mock).mockResolvedValue({
      optimizationApplied: false,
      responseTime: 8500,
    });

    (aiClient.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue({
      hasAccess: true,
      allowedOrganizationIds: ['org-001'],
    });

    (aiClient.enforceSecurityPolicyForMobileAccess as jest.Mock).mockResolvedValue({
      restrictionApplied: false,
      allowedDataFields: null,
    });

    (aiClient.retrieveUnresolvedAnomalyLogs as jest.Mock).mockResolvedValue([]);
  });

  it('should return partial_success status when anomaly detection fails', async () => {
    const input = {
      currentDateTime: new Date('2026-10-07T10:00:00Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-10-07T23:59:59Z'),
      requestingUserId: 'user-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.1',
      },
    };

    const result = await runTx6Imp1Agent(input, aiClient);

    expect(result.executionStatus).toBe('partial_success');
  });

  it('should include AnomalyDetectionFailure warning when anomaly detection fails', async () => {
    const input = {
      currentDateTime: new Date('2026-10-07T10:00:00Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-10-07T23:59:59Z'),
      requestingUserId: 'user-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.1',
      },
    };

    const result = await runTx6Imp1Agent(input, aiClient);

    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        type: 'AnomalyDetectionFailure',
        message: '異常検知処理に失敗しました。ダッシュボード表示は制限されます。',
      }),
    );
  });

  it('should generate dashboard data from aggregation result', async () => {
    const input = {
      currentDateTime: new Date('2026-10-07T10:00:00Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-10-07T23:59:59Z'),
      requestingUserId: 'user-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.1',
      },
    };

    const result = await runTx6Imp1Agent(input, aiClient);

    expect(result.dashboardData).not.toBeNull();
  });

  it('should return empty anomalies array when anomaly detection fails', async () => {
    const input = {
      currentDateTime: new Date('2026-10-07T10:00:00Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-10-07T23:59:59Z'),
      requestingUserId: 'user-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.1',
      },
    };

    const result = await runTx6Imp1Agent(input, aiClient);

    expect(result.anomalies).toEqual([]);
  });

  it('should return empty notificationsSent when no anomalies detected', async () => {
    const input = {
      currentDateTime: new Date('2026-10-07T10:00:00Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-10-07T23:59:59Z'),
      requestingUserId: 'user-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.1',
      },
    };

    const result = await runTx6Imp1Agent(input, aiClient);

    expect(result.notificationsSent).toEqual([]);
  });

  it('should include error details with AnomalyDetectionFailure', async () => {
    const input = {
      currentDateTime: new Date('2026-10-07T10:00:00Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-10-07T23:59:59Z'),
      requestingUserId: 'user-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.1',
      },
    };

    const result = await runTx6Imp1Agent(input, aiClient);

    expect(result.errorDetails).not.toBeNull();
    if (result.errorDetails) {
      expect(result.errorDetails).toContainEqual(
        expect.objectContaining({
          errorCode: 'AnomalyDetectionFailure',
          errorMessage: '異常検知処理に失敗しました。ダッシュボード表示は制限されます。',
        }),
      );
    }
  });
});
