import { monitorCorrectionSLACompliance, EscalationRecipientDeterminationFailure, type MonitorCorrectionSLAComplianceInput, type MonitorCorrectionSLAComplianceOutput } from '../../src/logic/scheduled-monitoring-orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
}));

describe('SCEN-161: エスカレーション受信者決定処理が失敗した場合、EscalationRecipientDeterminationFailure エラーで監視を中断する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error details when recipient determination fails', async () => {
    const correctionRecords = [
      {
        correctionId: 'corr-001',
        differenceId: 'diff-001',
        differenceType: 'sales_data_mismatch',
        detectedAt: '2025-01-02T08:00:00Z',
        correctionCompletedAt: '2025-01-08T09:00:00Z',
        severity: 'high',
      },
      {
        correctionId: 'corr-002',
        differenceId: 'diff-002',
        differenceType: 'invoice_amount_discrepancy',
        detectedAt: '2025-01-03T10:00:00Z',
        correctionCompletedAt: null,
        severity: 'critical',
      },
    ];

    const toleranceCriteria = [
      { differenceType: 'sales_data_mismatch', slaDurationHours: 24 },
      { differenceType: 'invoice_amount_discrepancy', slaDurationHours: 48 },
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
      currentTimestamp: new Date('2025-01-08T10:30:00Z'),
    };

    const result: MonitorCorrectionSLAComplianceOutput = await monitorCorrectionSLACompliance(input);

    expect(result.escalationExecuted).toBe(false);
    expect(result.escalationDetails).toBeNull();
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails).toContain('エスカレーション対象の決定に失敗しました');
  });
});
