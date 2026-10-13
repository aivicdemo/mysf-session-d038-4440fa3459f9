import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { startScheduledMonitoringCycle } from '../../src/logic/scheduled-monitoring-orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

describe('SCEN-129: SLA期限の計算に失敗するとfailedステータスとエラー詳細を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return failed status with error message when SLA calculation fails', async () => {
    const input = {
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
      isBusinessDay: true,
      targetPeriodStart: new Date('2025-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2025-01-15T23:59:59Z'),
    };

    // Mock retrieveMonitoringLogsAndCorrectionHistory to provide preconditions
    jest.spyOn(discrepancyPersistence, 'retrieveMonitoringLogsAndCorrectionHistory').mockResolvedValue({
      logs: [
        {
          monitoringCycleId: 'cycle-001',
          executionTimestamp: new Date('2025-01-14T09:00:00Z'),
          discrepanciesDetected: 3,
        },
      ],
      correctionHistory: [
        {
          discrepancyId: 'disc-001',
          correctionStatus: 'completed',
          completionTimestamp: new Date('2025-01-14T11:30:00Z'),
        },
      ],
    } as any);

    const result = await startScheduledMonitoringCycle(input);

    expect(result.executionStatus).toBe('failed');
    expect(result.errorDetails).toBe('SLA期限の計算に失敗しました。');
    expect(result.monitoringCycleId).toBeTruthy();
    expect(result.discrepanciesDetected).toBe(0);
    expect(result.escalationExecuted).toBe(false);
  });
});
