import { executeEscalationByDiscrepancySeverity, NotificationContentGenerationError, type ExecuteEscalationByDiscrepancySeverityInput } from '../../src/logic/scheduled-monitoring-orchestrator';

describe('SCEN-148: Notification content generation error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NotificationContentGenerationError when notification content is null', async () => {
    const input: ExecuteEscalationByDiscrepancySeverityInput = {
      discrepancies: [
        {
          discrepancyId: 'DISC-001',
          severity: 'critical',
          discrepancyType: 'invoice_amount_mismatch',
          amountDifference: 50000,
          affectedRecordCount: 3,
          detectionTimestamp: new Date('2026-01-15T10:30:00Z'),
        },
      ],
      executionTimestamp: new Date('2026-01-15T14:00:00Z'),
      monitoringCycleId: 'CYCLE-20260115-001',
    };

    await expect(executeEscalationByDiscrepancySeverity(input)).rejects.toThrow(
      NotificationContentGenerationError,
    );

    try {
      await executeEscalationByDiscrepancySeverity(input);
    } catch (error) {
      if (error instanceof NotificationContentGenerationError) {
        expect(error.message).toBe('通知メッセージの生成に失敗しました。差異情報が不完全です。');
      }
    }
  });
});
