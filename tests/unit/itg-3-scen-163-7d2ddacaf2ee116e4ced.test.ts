import { monitorCorrectionSLACompliance, type MonitorCorrectionSLAComplianceInput, type MonitorCorrectionSLAComplianceOutput } from '../../src/logic/scheduled-monitoring-orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
}));

describe('SCEN-163: SLA超過レコードが存在しない場合、escalationExecuted が false に設定され、escalationDetails は null のままである', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return escalationExecuted false with escalationDetails null when no SLA exceeded records exist', async () => {
    (discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as jest.Mock)
      .mockResolvedValue({
        correctionTrackingHistory: [],
      });

    const toleranceCriteria = [
      { differenceType: 'accounting_variance', slaHours: 48, escalationThresholdHours: 24 },
      { differenceType: 'data_mismatch', slaHours: 72, escalationThresholdHours: 24 },
    ];

    (discrepancyPersistence.retrieveToleranceCriteriaByType as jest.Mock)
      .mockImplementation((input: any) => {
        const criteria = toleranceCriteria.find(c => c.differenceType === input.discrepancyType);
        return Promise.resolve(criteria || null);
      });

    const input: MonitorCorrectionSLAComplianceInput = {
      monitoringCycleId: 'CYCLE-2025-01-15-001',
      targetPeriodStart: new Date('2025-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2025-01-15T23:59:59Z'),
      currentTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    const result: MonitorCorrectionSLAComplianceOutput = await monitorCorrectionSLACompliance(input);

    expect(result.monitoringCycleId).toBe('CYCLE-2025-01-15-001');
    expect(result.slaComplianceStatus).toBe('compliant');
    expect(result.totalCorrectionRecordsMonitored).toBe(0);
    expect(result.compliantRecordCount).toBe(0);
    expect(result.atRiskRecordCount).toBe(0);
    expect(result.exceededRecordCount).toBe(0);
    expect(result.slaExceededDetails).toEqual([]);
    expect(result.escalationExecuted).toBe(false);
    expect(result.escalationDetails).toBeNull();
    expect(result.errorDetails).toBeNull();
  });
});
