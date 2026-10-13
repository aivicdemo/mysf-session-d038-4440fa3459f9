import { executeEscalationByDiscrepancySeverity, EmptyDiscrepancyListError, type ExecuteEscalationByDiscrepancySeverityInput } from '../../src/logic/scheduled-monitoring-orchestrator';

describe('SCEN-145: Empty discrepancy list error', () => {
  it('should throw EmptyDiscrepancyListError when discrepancies list is empty', async () => {
    const input: ExecuteEscalationByDiscrepancySeverityInput = {
      discrepancies: [],
      executionTimestamp: new Date('2026-10-07T10:30:00Z'),
      monitoringCycleId: 'cycle-20261007-001',
    };

    await expect(executeEscalationByDiscrepancySeverity(input)).rejects.toThrow(
      EmptyDiscrepancyListError,
    );

    try {
      await executeEscalationByDiscrepancySeverity(input);
    } catch (error) {
      if (error instanceof EmptyDiscrepancyListError) {
        expect(error.message).toBe('エスカレーション対象の差異レコードが指定されていません。');
      }
    }
  });
});
