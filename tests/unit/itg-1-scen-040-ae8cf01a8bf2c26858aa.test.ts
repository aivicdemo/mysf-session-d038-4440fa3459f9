import { runTx6Imp1Agent, Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

jest.mock('../../src/logic/data-persistence.ts', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence.ts')>('../../src/logic/data-persistence.ts'),
  fetchDealsForPeriod: jest.fn(),
  fetchSalesTargets: jest.fn(),
  fetchAllSalesRepresentatives: jest.fn(),
  fetchActivitiesByRepresentative: jest.fn(),
  fetchAllDealStages: jest.fn(),
}));

jest.mock('../../src/logic/dataflow-anomaly-detection.ts', () => ({
  ...jest.requireActual<typeof import('../../src/logic/dataflow-anomaly-detection.ts')>('../../src/logic/dataflow-anomaly-detection.ts'),
  detectDataflowAnomalies: jest.fn(),
}));

jest.mock('../../src/logic/sales-performance-aggregation.ts', () => ({
  ...jest.requireActual<typeof import('../../src/logic/sales-performance-aggregation.ts')>('../../src/logic/sales-performance-aggregation.ts'),
  aggregateSalesPerformanceForDashboard: jest.fn(),
}));

jest.mock('../../src/logic/dashboard-data-freshness.ts', () => ({
  ...jest.requireActual<typeof import('../../src/logic/dashboard-data-freshness.ts')>('../../src/logic/dashboard-data-freshness.ts'),
  validateDashboardDataFreshness: jest.fn(),
}));

jest.mock('../../src/logic/dashboard-data-integrity.ts', () => ({
  ...jest.requireActual<typeof import('../../src/logic/dashboard-data-integrity.ts')>('../../src/logic/dashboard-data-integrity.ts'),
  validateDashboardDataIntegrity: jest.fn(),
}));

jest.mock('../../src/logic/dashboard-performance-optimization.ts', () => ({
  ...jest.requireActual<typeof import('../../src/logic/dashboard-performance-optimization.ts')>('../../src/logic/dashboard-performance-optimization.ts'),
  optimizeDashboardPerformanceWithFallback: jest.fn(),
}));

jest.mock('../../src/logic/access-control-enforcement.ts', () => ({
  ...jest.requireActual<typeof import('../../src/logic/access-control-enforcement.ts')>('../../src/logic/access-control-enforcement.ts'),
  enforceAccessControlForDataDisplay: jest.fn(),
}));

jest.mock('../../src/logic/mobile-security-enforcement.ts', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mobile-security-enforcement.ts')>('../../src/logic/mobile-security-enforcement.ts'),
  enforceSecurityPolicyForMobileAccess: jest.fn(),
}));

jest.mock('../../src/logic/anomaly-detection-logging.ts', () => ({
  ...jest.requireActual<typeof import('../../src/logic/anomaly-detection-logging.ts')>('../../src/logic/anomaly-detection-logging.ts'),
  retrieveUnresolvedAnomalyLogs: jest.fn(),
}));

describe('SCEN-040: エラーがない場合、errorDetailsがnullになる', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const dataPersistence = require('../../src/logic/data-persistence.ts');
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue([
      {
        dealId: 'deal-001',
        representativeId: 'rep-001',
        amount: 500000,
        stage: 'contract',
        createdAt: '2026-10-05T08:00:00Z',
      },
    ]);
    (dataPersistence.fetchSalesTargets as jest.Mock).mockResolvedValue([
      {
        representativeId: 'rep-001',
        targetAmount: 1000000,
        targetCount: 5,
      },
    ]);
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      {
        representativeId: 'rep-001',
        name: '山田太郎',
        organizationLevel: 2,
      },
    ]);
    (dataPersistence.fetchActivitiesByRepresentative as jest.Mock).mockResolvedValue([
      {
        representativeId: 'rep-001',
        activityCount: 12,
        frequency: 'daily',
        performance: 'normal',
      },
    ]);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue([
      {
        stageId: 'stage-contract',
        stageName: '契約',
        order: 5,
      },
    ]);

    const anomalyDetection = require('../../src/logic/dataflow-anomaly-detection.ts');
    (anomalyDetection.detectDataflowAnomalies as jest.Mock).mockResolvedValue([]);

    const performanceAggregation = require('../../src/logic/sales-performance-aggregation.ts');
    (performanceAggregation.aggregateSalesPerformanceForDashboard as jest.Mock).mockResolvedValue({
      representativePerformance: [
        {
          representativeId: 'rep-001',
          achievementRate: 0.5,
          stageDistribution: { contract: 1 },
          anomalyHighlights: [],
          guidancePriorityScore: 0,
        },
      ],
    });

    const freshness = require('../../src/logic/dashboard-data-freshness.ts');
    (freshness.validateDashboardDataFreshness as jest.Mock).mockResolvedValue({
      isFresh: true,
      warnings: [],
    });

    const integrity = require('../../src/logic/dashboard-data-integrity.ts');
    (integrity.validateDashboardDataIntegrity as jest.Mock).mockResolvedValue({
      isIntegral: true,
      warnings: [],
    });

    const performance = require('../../src/logic/dashboard-performance-optimization.ts');
    (performance.optimizeDashboardPerformanceWithFallback as jest.Mock).mockResolvedValue({
      isOptimized: true,
      warnings: [],
    });

    const accessControl = require('../../src/logic/access-control-enforcement.ts');
    (accessControl.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue({
      hasAccess: true,
      dataScope: 'all',
    });

    const mobileSecurity = require('../../src/logic/mobile-security-enforcement.ts');
    (mobileSecurity.enforceSecurityPolicyForMobileAccess as jest.Mock).mockResolvedValue({
      isAllowed: true,
      restrictions: [],
    });

    const anomalyLogging = require('../../src/logic/anomaly-detection-logging.ts');
    (anomalyLogging.retrieveUnresolvedAnomalyLogs as jest.Mock).mockResolvedValue([]);
  });

  it('should have null errorDetails when no errors occur', async () => {
    const input: any = {
      currentDateTime: new Date('2026-10-07T10:00:00Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-10-07T23:59:59Z'),
      requestingUserId: 'user-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '127.0.0.1',
      },
    };

    const aiClient: Tx6Imp1AiClient = {};

    const result = await runTx6Imp1Agent(input, aiClient);

    expect(result.errorDetails).toBeNull();
    expect(result.executionStatus.status).toBe('success');
    expect(result.dashboardData).not.toBeNull();
    expect(result.anomalies).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.notificationsSent).toEqual([]);
  });
});
