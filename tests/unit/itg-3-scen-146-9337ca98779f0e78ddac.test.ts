import { executeEscalationByDiscrepancySeverity, NoEscalationRecipientsFoundError, type ExecuteEscalationByDiscrepancySeverityInput } from '../../src/logic/scheduled-monitoring-orchestrator';

describe('SCEN-146: No escalation recipients found error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NoEscalationRecipientsFoundError when no escalation recipients are determined', async () => {
    const input: ExecuteEscalationByDiscrepancySeverityInput = {
      discrepancies: [
        {
          discrepancyId: 'DISC-001',
          severity: 'critical',
          discrepancyType: '金額差異',
          amountDifference: 50000,
          affectedRecordCount: 3,
          detectionTimestamp: new Date('2026-01-15T10:30:00Z'),
        },
      ],
      executionTimestamp: new Date('2026-01-15T11:00:00Z'),
      monitoringCycleId: 'CYCLE-2026-01-15',
    };

    await expect(executeEscalationByDiscrepancySeverity(input)).rejects.toThrow(
      NoEscalationRecipientsFoundError,
    );

    try {
      await executeEscalationByDiscrepancySeverity(input);
    } catch (error) {
      if (error instanceof NoEscalationRecipientsFoundError) {
        expect(error.message).toBe('指定された重大度に対応するエスカレーション対象者が見つかりません。');
      }
    }
  });
});
