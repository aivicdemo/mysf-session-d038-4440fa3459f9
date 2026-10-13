import { monitorCorrectionSLACompliance, SLADeadlineCalculationFailure, type MonitorCorrectionSLAComplianceInput } from '../../src/logic/scheduled-monitoring-orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
}));

describe('SCEN-160: SLA期限計算処理が失敗した場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('SLADeadlineCalculationFailure エラーで監視を中断する', async () => {
    const currentTimestamp = new Date('2024-02-05T10:30:00Z');

    const correctionRecords = [
      {
        correctionId: 'CORR-001',
        differenceId: 'DIFF-001',
        differenceType: 'SALES_AMOUNT',
        detectedAt: '2024-01-10T08:00:00Z',
        completedAt: '2024-01-15T14:00:00Z',
        severity: 'high',
      },
      {
        correctionId: 'CORR-002',
        differenceId: 'DIFF-002',
        differenceType: 'INVOICE_LINE_MISMATCH',
        detectedAt: '2024-01-20T09:00:00Z',
        completedAt: null,
        severity: 'critical',
      },
    ];

    const toleranceCriteria = [
      { differenceType: 'SALES_AMOUNT', slaDays: 5, escalationRole: 'accounting' },
      { differenceType: 'INVOICE_LINE_MISMATCH', slaDays: 3, escalationRole: 'sales_operations' },
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
      monitoringCycleId: 'CYCLE-2024-001',
      targetPeriodStart: new Date('2024-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2024-01-31T23:59:59Z'),
      currentTimestamp: currentTimestamp,
    };

    // SLADeadlineCalculationFailureをスローするシミュレーション
    await expect(monitorCorrectionSLACompliance(input))
      .rejects
      .toThrow(SLADeadlineCalculationFailure);
  });
});
