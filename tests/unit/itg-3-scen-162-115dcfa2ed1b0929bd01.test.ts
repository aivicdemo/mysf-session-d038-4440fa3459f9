import { monitorCorrectionSLACompliance, type MonitorCorrectionSLAComplianceInput, type MonitorCorrectionSLAComplianceOutput } from '../../src/logic/scheduled-monitoring-orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
}));

describe('SCEN-162: SLA超過レコードが存在する場合、escalationExecuted が true に設定され、複数の受信者ロール別に分類された通知詳細が配列で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return escalationExecuted true with notification details per recipient role', async () => {
    const correctionRecords = [
      {
        correctionId: 'corr-001',
        differenceId: 'diff-001',
        differenceType: 'billing_amount',
        detectedAt: '2025-01-02T08:00:00Z',
        completedAt: '2025-01-06T18:30:00Z',
        status: 'completed',
        severity: 'critical',
      },
      {
        correctionId: 'corr-002',
        differenceId: 'diff-002',
        differenceType: 'order_qty',
        detectedAt: '2025-01-03T09:15:00Z',
        completedAt: null,
        status: 'in_progress',
        severity: 'high',
      },
      {
        correctionId: 'corr-003',
        differenceId: 'diff-003',
        differenceType: 'billing_amount',
        detectedAt: '2025-01-01T14:00:00Z',
        completedAt: null,
        status: 'pending',
        severity: 'critical',
      },
    ];

    const toleranceCriteria = [
      { differenceType: 'billing_amount', slaHours: 72, severity: 'critical' },
      { differenceType: 'order_qty', slaHours: 48, severity: 'high' },
    ];

    (discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as jest.Mock)
      .mockResolvedValue({
        correctionTrackingHistory: correctionRecords,
      });

    (discrepancyPersistence.retrieveToleranceCriteriaByType as jest.Mock)
      .mockImplementation((input: any) => {
        const criteria = toleranceCriteria.find(c => c.differenceType === input.discrepancyType);
        return Promise.resolve(criteria || null);
      });

    const input: MonitorCorrectionSLAComplianceInput = {
      monitoringCycleId: 'cycle-20250107-001',
      targetPeriodStart: new Date('2025-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2025-01-07T23:59:59Z'),
      currentTimestamp: new Date('2025-01-08T10:00:00Z'),
    };

    const result = await monitorCorrectionSLACompliance(input);

    expect(result.monitoringCycleId).toBe('cycle-20250107-001');
    expect(result.slaComplianceStatus).toBe('exceeded');
    expect(result.totalCorrectionRecordsMonitored).toBe(3);
    expect(result.compliantRecordCount).toBeGreaterThanOrEqual(0);
    expect(result.exceededRecordCount).toBeGreaterThan(0);
    expect(result.escalationExecuted).toBe(true);
    expect(result.escalationDetails).toBeDefined();
    expect(Array.isArray(result.escalationDetails)).toBe(true);
    if (result.escalationDetails) {
      expect(result.escalationDetails.length).toBeGreaterThan(0);
      expect(result.escalationDetails.every(d =>
        ['sales_operations', 'accounting', 'it_operations'].includes(d.recipientRole)
      )).toBe(true);
    }
    expect(result.errorDetails).toBeNull();
  });
});
