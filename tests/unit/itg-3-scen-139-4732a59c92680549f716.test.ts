import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  startScheduledMonitoringCycle,
  StartScheduledMonitoringCycleInput,
  StartScheduledMonitoringCycleOutput,
} from '../../src/logic/scheduled-monitoring-orchestrator';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveMonitoringLogsAndCorrectionHistory: jest.fn() as any,
}));

describe('SCEN-139: 月次締め日まで3営業日以内で低レベルの差異のとき重大度を中に上げて8時間以内のSLAを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should escalate low severity to medium and apply 8-hour SLA when within 3 business days before month end', async () => {
    const input: StartScheduledMonitoringCycleInput = {
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
      isBusinessDay: true,
      targetPeriodStart: new Date('2025-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2025-01-31T23:59:59Z'),
    };

    const mockLogs = {
      logs: [
        {
          cycleId: 'CYCLE-20250114',
          executionDate: new Date('2025-01-14T09:00:00Z'),
          discrepanciesDetected: 1,
          severity: 'low',
        },
      ],
      correctionHistory: [],
    };

    const mockFn = discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as any;
    mockFn.mockResolvedValue(mockLogs);

    const result: StartScheduledMonitoringCycleOutput = await startScheduledMonitoringCycle(input);

    expect(result.executionStatus).toBe('completed');
    expect(result.monitoringCycleId).toBeDefined();
    expect(result.discrepanciesDetected).toBe(2);
    expect(result.escalationExecuted).toBe(true);
    expect(result.escalationDetails).toBeDefined();
    expect(result.escalationDetails!.length).toBe(2);
    expect(result.escalationDetails![0].recipientRole).toBe('営業部システム担当');
    expect(result.escalationDetails![0].slaDeadline).toEqual(
      new Date('2025-01-15T13:00:00Z')
    );
    expect(result.escalationDetails![1].recipientRole).toBe('経理部門');
    expect(result.errorDetails).toBeNull();
  });
});
