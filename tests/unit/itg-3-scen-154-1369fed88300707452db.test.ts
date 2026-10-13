import { monitorCorrectionSLACompliance, type MonitorCorrectionSLAComplianceInput, type MonitorCorrectionSLAComplianceOutput } from '../../src/logic/scheduled-monitoring-orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
}));

describe('SCEN-154: 監視対象期間内に是正レコードがあり、一部がSLA期限まで24時間以内の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('at_risk状態で期限間近レコード数を含めて報告する', async () => {
    const currentTimestamp = new Date('2025-01-15T18:00:00Z');

    // 是正追跡レコード一覧をモック
    const correctionRecords = [
      {
        correctionId: 'corr-001',
        differenceId: 'diff-001',
        differenceType: 'inventory_mismatch',
        detectionDate: '2025-01-10T10:00:00Z',
        completionStatus: 'completed',
        completedAt: '2025-01-12T14:30:00Z',
      },
      {
        correctionId: 'corr-002',
        differenceId: 'diff-002',
        differenceType: 'revenue_timing',
        detectionDate: '2025-01-12T09:00:00Z',
        completionStatus: 'in_progress',
        completedAt: null,
      },
      {
        correctionId: 'corr-003',
        differenceId: 'diff-003',
        differenceType: 'account_reconciliation',
        detectionDate: '2025-01-14T11:00:00Z',
        completionStatus: 'in_progress',
        completedAt: null,
      },
      {
        correctionId: 'corr-004',
        differenceId: 'diff-004',
        differenceType: 'inventory_mismatch',
        detectionDate: '2025-01-09T08:00:00Z',
        completionStatus: 'pending',
        completedAt: null,
      },
    ];

    // SLA基準をモック
    const toleranceCriteria = [
      { differenceType: 'inventory_mismatch', slaHours: 48 },
      { differenceType: 'revenue_timing', slaHours: 72 },
      { differenceType: 'account_reconciliation', slaHours: 96 },
    ];

    (discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as jest.Mock).mockResolvedValue({
      correctionTrackingHistory: correctionRecords,
    });

    (discrepancyPersistence.retrieveToleranceCriteriaByType as jest.Mock)
      .mockImplementation((input: any) => {
        const criteria = toleranceCriteria.find(c => c.differenceType === input.discrepancyType);
        return Promise.resolve(criteria || null);
      });

    const input: MonitorCorrectionSLAComplianceInput = {
      monitoringCycleId: 'cycle-20250115-001',
      targetPeriodStart: new Date('2025-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2025-01-15T23:59:59Z'),
      currentTimestamp: currentTimestamp,
    };

    const result = await monitorCorrectionSLACompliance(input);

    expect(result.monitoringCycleId).toBe('cycle-20250115-001');
    expect(result.slaComplianceStatus).toBe('at_risk');
    expect(result.totalCorrectionRecordsMonitored).toBe(4);
    expect(result.compliantRecordCount).toBe(2);
    expect(result.atRiskRecordCount).toBe(1);
    expect(result.exceededRecordCount).toBe(1);
    expect(result.escalationExecuted).toBe(true);
    expect(result.errorDetails).toBeNull();
    expect(result.slaExceededDetails).toHaveLength(1);
    expect(result.slaExceededDetails[0].correctionId).toBe('corr-004');
    expect(result.slaExceededDetails[0].exceedanceHours).toBe(106);
    expect(result.escalationDetails).toBeTruthy();
    expect(result.escalationDetails).toHaveLength(1);
  });
});
