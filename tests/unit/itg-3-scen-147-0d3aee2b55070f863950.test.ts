import { executeEscalationByDiscrepancySeverity, SLACalculationFailureError, type ExecuteEscalationByDiscrepancySeverityInput } from '../../src/logic/scheduled-monitoring-orchestrator';

describe('SCEN-147: SLA calculation failure error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw SLACalculationFailureError when SLA deadline calculation fails', async () => {
    const input: ExecuteEscalationByDiscrepancySeverityInput = {
      discrepancies: [
        {
          discrepancyId: 'DISC-001',
          severity: 'critical',
          discrepancyType: 'revenue_mismatch',
          amountDifference: 50000,
          affectedRecordCount: 12,
          detectionTimestamp: new Date('2025-01-15T10:30:00Z'),
        },
      ],
      executionTimestamp: new Date('2025-01-15T11:00:00Z'),
      monitoringCycleId: 'CYCLE-20250115-001',
    };

    await expect(executeEscalationByDiscrepancySeverity(input)).rejects.toThrow(
      SLACalculationFailureError,
    );

    try {
      await executeEscalationByDiscrepancySeverity(input);
    } catch (error) {
      if (error instanceof SLACalculationFailureError) {
        expect(error.message).toBe(
          'SLA期限の計算に失敗しました。営業日カレンダーまたはSLA定義が利用できません。',
        );
      }
    }
  });
});
