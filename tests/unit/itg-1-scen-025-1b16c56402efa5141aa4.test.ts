import { runTx6Imp1Agent, type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

const jest = global.jest || require('jest');
const { expect } = require('@jest/globals');

describe('SCEN-025: 正常な入力で、営業データが集約され、ダッシュボード表示データ・異常検知結果・警告が正常に生成される', () => {
  it('should return successful execution with valid dashboard data and empty anomalies', async () => {
    const mockAiClient: any = {
      fetchDealsForPeriod: jest.fn().mockResolvedValue([
        {
          dealId: 'deal-001',
          dealName: 'A社新規案件',
          amount: 5000000,
          stage: 'stage-03',
          ownerUserId: 'rep-001',
          createdDate: '2026-10-05T09:00:00.000Z',
          lastModifiedDate: '2026-10-14T15:30:00.000Z',
        },
        {
          dealId: 'deal-002',
          dealName: 'B社拡大案件',
          amount: 3000000,
          stage: 'stage-04',
          ownerUserId: 'rep-002',
          createdDate: '2026-09-20T10:00:00.000Z',
          lastModifiedDate: '2026-10-12T14:00:00.000Z',
        },
      ]),
      fetchSalesTargets: jest.fn().mockResolvedValue([
        {
          representativeId: 'rep-001',
          periodStart: '2026-10-01',
          periodEnd: '2026-10-31',
          targetAmount: 10000000,
          targetDealCount: 5,
        },
        {
          representativeId: 'rep-002',
          periodStart: '2026-10-01',
          periodEnd: '2026-10-31',
          targetAmount: 8000000,
          targetDealCount: 4,
        },
      ]),
      fetchAllSalesRepresentatives: jest.fn().mockResolvedValue([
        {
          representativeId: 'rep-001',
          name: '山田太郎',
          departmentId: 'dept-001',
          managerUserId: 'mgr-001',
          status: 'active',
        },
        {
          representativeId: 'rep-002',
          name: '鈴木花子',
          departmentId: 'dept-001',
          managerUserId: 'mgr-001',
          status: 'active',
        },
      ]),
      fetchActivitiesByRepresentative: jest.fn().mockResolvedValue([
        {
          representativeId: 'rep-001',
          activityCount: 12,
          contactCount: 5,
          meetingCount: 3,
          callCount: 4,
          periodStart: '2026-10-01',
          periodEnd: '2026-10-15',
        },
        {
          representativeId: 'rep-002',
          activityCount: 10,
          contactCount: 4,
          meetingCount: 2,
          callCount: 4,
          periodStart: '2026-10-01',
          periodEnd: '2026-10-15',
        },
      ]),
      fetchAllDealStages: jest.fn().mockResolvedValue([
        { stageId: 'stage-01', stageName: '初期接触', sequenceNumber: 1 },
        { stageId: 'stage-02', stageName: '提案', sequenceNumber: 2 },
        { stageId: 'stage-03', stageName: '商談中', sequenceNumber: 3 },
        { stageId: 'stage-04', stageName: '契約済', sequenceNumber: 4 },
        { stageId: 'stage-05', stageName: '失注', sequenceNumber: 5 },
      ]),
      detectDataflowAnomalies: jest.fn().mockResolvedValue({
        anomalies: [],
        status: 'success',
        detectionTimestamp: '2026-10-15T10:28:00.000Z',
      }),
      aggregateSalesPerformanceForDashboard: jest.fn().mockResolvedValue({
        performanceData: {
          'rep-001': {
            representativeId: 'rep-001',
            name: '山田太郎',
            targetAmount: 10000000,
            actualAmount: 5000000,
            achievementRate: 0.5,
            targetDealCount: 5,
            actualDealCount: 1,
            dealAchievementRate: 0.2,
            activityMetrics: {
              totalActivities: 12,
              contactCount: 5,
              meetingCount: 3,
              callCount: 4,
            },
            stageBreakdown: {
              'stage-01': 0,
              'stage-02': 0,
              'stage-03': 1,
              'stage-04': 0,
              'stage-05': 0,
            },
            anomalyFlags: [],
            guidancePriorityScore: 2,
          },
          'rep-002': {
            representativeId: 'rep-002',
            name: '鈴木花子',
            targetAmount: 8000000,
            actualAmount: 3000000,
            achievementRate: 0.375,
            targetDealCount: 4,
            actualDealCount: 1,
            dealAchievementRate: 0.25,
            activityMetrics: {
              totalActivities: 10,
              contactCount: 4,
              meetingCount: 2,
              callCount: 4,
            },
            stageBreakdown: {
              'stage-01': 0,
              'stage-02': 0,
              'stage-03': 0,
              'stage-04': 1,
              'stage-05': 0,
            },
            anomalyFlags: [],
            guidancePriorityScore: 1,
          },
        },
        status: 'success',
      }),
      validateDashboardDataFreshness: jest.fn().mockResolvedValue({
        freshnessStatus: 'current',
        lastUpdateTime: '2026-10-15T10:25:00.000Z',
        warning: null,
      }),
      validateDashboardDataIntegrity: jest.fn().mockResolvedValue({
        integrityStatus: 'complete',
        missingRecords: [],
        inconsistencies: [],
        warning: null,
      }),
      optimizeDashboardPerformanceWithFallback: jest.fn().mockResolvedValue({
        responseDurationMs: 2850,
        isOptimized: true,
        usedCache: false,
        usedFallback: false,
        warning: null,
      }),
      enforceAccessControlForDataDisplay: jest.fn().mockResolvedValue({
        userId: 'user-001',
        accessGranted: true,
        accessibleDepartments: ['dept-001'],
        accessibleRepresentatives: ['rep-001', 'rep-002'],
        restrictions: null,
      }),
      enforceSecurityPolicyForMobileAccess: jest.fn().mockResolvedValue({
        deviceType: 'desktop',
        policyApplied: false,
        restrictedDataFields: [],
        warning: null,
      }),
      retrieveUnresolvedAnomalyLogs: jest.fn().mockResolvedValue({
        unresolvedAnomalies: [],
        totalCount: 0,
      }),
    };

    const input: any = {
      currentDateTime: new Date('2026-10-15T10:30:00.000Z'),
      targetPeriodStart: new Date('2026-10-01T00:00:00.000Z'),
      targetPeriodEnd: new Date('2026-10-15T23:59:59.999Z'),
      requestingUserId: 'user-001',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.100',
      },
    };

    const output = await runTx6Imp1Agent(input, mockAiClient);

    expect(output.executionStatus).toEqual('success');
    expect(output.dashboardData).not.toBeNull();
    expect(output.dashboardData).toBeDefined();
    expect(output.anomalies).toEqual([]);
    expect(output.warnings).toEqual([]);
    expect(output.notificationsSent).toEqual([]);
    expect(output.errorDetails).toBeNull();
  });
});
