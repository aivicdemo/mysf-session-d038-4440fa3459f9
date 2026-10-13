import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  executeEscalationByDiscrepancySeverity,
  ExecuteEscalationByDiscrepancySeverityInput,
  NotificationSendFailureError,
} from '../../src/logic/scheduled-monitoring-orchestrator';

describe('SCEN-149: メール送信サービスが応答しない場合、NotificationSendFailureErrorが発生する', () => {
  beforeEach(() => {
    // No setup needed
  });

  it('should throw NotificationSendFailureError when email service does not respond', async () => {
    const input: ExecuteEscalationByDiscrepancySeverityInput = {
      discrepancies: [
        {
          discrepancyId: 'DISC-001',
          severity: 'critical',
          discrepancyType: 'amount_mismatch',
          amountDifference: 50000,
          affectedRecordCount: 3,
          detectionTimestamp: new Date('2026-01-15T10:30:00Z'),
        },
        {
          discrepancyId: 'DISC-002',
          severity: 'high',
          discrepancyType: 'record_count_mismatch',
          amountDifference: 0,
          affectedRecordCount: 5,
          detectionTimestamp: new Date('2026-01-15T10:30:00Z'),
        },
      ],
      executionTimestamp: new Date('2026-01-15T11:00:00Z'),
      monitoringCycleId: 'CYCLE-20260115-001',
    };

    try {
      await executeEscalationByDiscrepancySeverity(input);
      fail('Expected NotificationSendFailureError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(NotificationSendFailureError);
      expect((error as Error).message).toBe('通知の送信に失敗しました。メール送信サービスが利用できません。');
    }
  });
});
