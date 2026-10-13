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

describe('SCEN-141: 月次締め日が未設定の場合は期限ベースの重大度調整ができないことを警告する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should warn when month end date is not set and continue with existing severity', async () => {
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
          executedAt: new Date('2025-01-14T09:00:00Z'),
          discrepanciesFound: 3,
        },
      ],
      correctionHistory: [],
    };

    const mockFn = discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as any;
    mockFn.mockResolvedValue(mockLogs);

    const result: StartScheduledMonitoringCycleOutput = await startScheduledMonitoringCycle(input);

    expect(result.executionStatus).toBe('completed');
    expect(result.monitoringCycleId).toBeDefined();
    expect(result.discrepanciesDetected).toBe(1);
    expect(result.escalationExecuted).toBe(true);
    expect(result.escalationDetails).toBeDefined();
    expect(result.escalationDetails!.length).toBe(2);
    expect(result.escalationDetails![0].recipientRole).toBe('営業部システム担当');
    expect(result.escalationDetails![0].slaDeadline).toEqual(
      new Date('2025-01-15T13:00:00Z')
    );
    expect(result.escalationDetails![1].recipientRole).toBe('経理部門');
    expect(result.escalationDetails![1].slaDeadline).toEqual(
      new Date('2025-01-15T13:00:00Z')
    );
    expect(result.errorDetails).toBeNull();
  });
});
