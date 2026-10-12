import { runTx6Imp1Agent, Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as dataflowAnomaly from '../../src/logic/dataflow-anomaly-detection';
import * as notificationService from '../../src/logic/notification-service';
import * as salesPerformanceAgg from '../../src/logic/sales-performance-aggregation';
import * as dashboardFreshness from '../../src/logic/dashboard-data-freshness';
import * as dashboardIntegrity from '../../src/logic/dashboard-data-integrity';
import * as dashboardPerformance from '../../src/logic/dashboard-performance-optimization';
import * as accessControl from '../../src/logic/access-control-enforcement';
import * as mobileSecurity from '../../src/logic/mobile-security-enforcement';
import * as anomalyLogging from '../../src/logic/anomaly-detection-logging';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/dataflow-anomaly-detection');
jest.mock('../../src/logic/notification-service');
jest.mock('../../src/logic/sales-performance-aggregation');
jest.mock('../../src/logic/dashboard-data-freshness');
jest.mock('../../src/logic/dashboard-data-integrity');
jest.mock('../../src/logic/dashboard-performance-optimization');
jest.mock('../../src/logic/access-control-enforcement');
jest.mock('../../src/logic/mobile-security-enforcement');
jest.mock('../../src/logic/anomaly-detection-logging');

describe('SCEN-035: 異常検知結果の通知送信に失敗すると、notificationsSentに失敗が記録され、executionStatusが部分成功になる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('通知送信失敗時に partial_success が返され、失敗結果が記録される', async () => {
    const currentDateTime = new Date('2026-10-07T10:00:00Z');
    const targetPeriodStart = new Date('2026-10-01T00:00:00Z');
    const targetPeriodEnd = new Date('2026-10-07T23:59:59Z');
    const requestingUserId = 'user-001';
    const deviceContext = {
      deviceType: 'desktop',
      isSecureConnection: true,
      ipAddress: '192.168.1.100',
    };

    const mockDeals = [
      {
        dealId: 'deal-001',
        accountId: 'account-001',
        amount: 1000000,
        stage: 'Closed Won',
      },
    ];

    const mockSalesTargets = [
      {
        representativeId: 'rep-001',
        targetAmount: 5000000,
        targetCount: 10,
      },
    ];

    const mockSalesReps = [
      {
        representativeId: 'rep-001',
        name: '営業太郎',
        email: 'taro@example.com',
        organizationUnit: '営業部',
      },
    ];

    const mockActivities = [
      {
        representativeId: 'rep-001',
        activityCount: 25,
        frequency: 'daily',
        performanceScore: 85,
      },
    ];

    const mockDealStages = [
      {
        stageId: 'stage-001',
        stageName: 'Prospecting',
        sequenceOrder: 1,
      },
      {
        stageId: 'stage-002',
        stageName: 'Closed Won',
        sequenceOrder: 5,
      },
    ];

    const mockAnomalyDetection = {
      notificationSendResult: {
        status: 'failed',
        errorMessage: '通知サービスが一時的に利用不可',
      },
      anomalies: [
        {
          anomalyId: 'anomaly-001',
          anomalyType: 'amount_mismatch',
          severity: 'high',
          targetRecordId: 'deal-001',
          anomalyContent: '取引先ー商談間で金額ズレ検出',
          detectedAt: new Date('2026-10-07T09:30:00Z'),
        },
      ],
    };

    const mockPerformanceAgg = {
      aggregationStatus: 'success',
      performanceData: {
        representativeId: 'rep-001',
        achievementRate: 0.42,
        guidancePriorityScore: 8,
      },
    };

    const mockFreshness = {
      isFresh: true,
      lastUpdateTime: new Date('2026-10-07T09:55:00Z'),
    };

    const mockIntegrity = {
      isComplete: true,
      missingFieldCount: 0,
    };

    const mockPerformanceOpt = {
      responseTime: 8000,
      optimizationApplied: false,
      fallbackMode: false,
    };

    const mockAccessControl = {
      isAuthorized: true,
      accessibleOrgUnits: ['営業部'],
    };

    const mockMobileSecurity = {
      policyApplied: false,
      isCompliant: true,
    };

    const mockAnomalyLogs = [
      {
        logId: 'log-001',
        anomalyId: 'anomaly-001',
        detectedAt: new Date('2026-10-06T14:30:00Z'),
        status: 'unresolved',
      },
    ];

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue(
      mockDeals
    );
    (dataPersistence.fetchSalesTargets as jest.Mock).mockResolvedValue(
      mockSalesTargets
    );
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue(
      mockSalesReps
    );
    (dataPersistence.fetchActivitiesByRepresentative as jest.Mock).mockResolvedValue(
      mockActivities
    );
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue(
      mockDealStages
    );
    (dataflowAnomaly.detectDataflowAnomalies as jest.Mock).mockResolvedValue(
      mockAnomalyDetection
    );
    (salesPerformanceAgg.aggregateSalesPerformanceForDashboard as jest.Mock).mockResolvedValue(
      mockPerformanceAgg
    );
    (dashboardFreshness.validateDashboardDataFreshness as jest.Mock).mockResolvedValue(
      mockFreshness
    );
    (dashboardIntegrity.validateDashboardDataIntegrity as jest.Mock).mockResolvedValue(
      mockIntegrity
    );
    (dashboardPerformance.optimizeDashboardPerformanceWithFallback as jest.Mock).mockResolvedValue(
      mockPerformanceOpt
    );
    (accessControl.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue(
      mockAccessControl
    );
    (mobileSecurity.enforceSecurityPolicyForMobileAccess as jest.Mock).mockResolvedValue(
      mockMobileSecurity
    );
    (anomalyLogging.retrieveUnresolvedAnomalyLogs as jest.Mock).mockResolvedValue(
      mockAnomalyLogs
    );

    (notificationService.notifyAnomalyDetection as jest.Mock).mockResolvedValue({
      status: 'failed',
      error: '通知サービスが一時的に利用不可',
    });

    const mockAiClient: Tx6Imp1AiClient = {};

    const result = await runTx6Imp1Agent(
      {
        currentDateTime,
        targetPeriodStart,
        targetPeriodEnd,
        requestingUserId,
        deviceContext,
      },
      mockAiClient
    );

    expect(result.executionStatus).toBe('partial_success');
    expect(result.notificationsSent).toHaveLength(1);
    expect(result.notificationsSent[0].status).toBe('failure');
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails).not.toBeNull();
    const notificationFailure = result.errorDetails.find(
      (e: any) => e.errorCode === 'NotificationFailure'
    );
    expect(notificationFailure).toBeDefined();
    expect(notificationFailure.errorMessage).toBe(
      '異常検知結果の通知送信に失敗しました。ダッシュボードで確認してください。'
    );
    expect(result.dashboardData).not.toBeNull();
    expect(result.anomalies).toHaveLength(1);
    expect(result.anomalies[0].anomalyType).toBe('amount_mismatch');
  });
});
