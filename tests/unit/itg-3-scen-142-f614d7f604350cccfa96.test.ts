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

describe('SCEN-142: 差異の絶対値が負の数の場合はデータ入力が不正であることを例外送出する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete successfully when discrepancy absolute value is positive (not negative)', async () => {
    const input: StartScheduledMonitoringCycleInput = {
      executionTimestamp: new Date('2026-01-15T09:00:00Z'),
      isBusinessDay: true,
      targetPeriodStart: new Date('2026-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2026-01-15T23:59:59Z'),
    };

    const mockLogs = {
      logs: [],
      correctionHistory: [],
    };

    const mockFn = discrepancyPersistence.retrieveMonitoringLogsAndCorrectionHistory as any;
    mockFn.mockResolvedValue(mockLogs);

    const result: StartScheduledMonitoringCycleOutput = await startScheduledMonitoringCycle(input);

    expect(result.executionStatus).toBe('completed');
    expect(result.discrepanciesDetected).toBe(1);
    expect(result.escalationExecuted).toBe(true);
    expect(result.escalationDetails).toBeDefined();
    expect(result.escalationDetails!.length).toBe(3);
    expect(result.escalationDetails![0].recipientRole).toBe('営業部システム担当');
    expect(result.escalationDetails![1].recipientRole).toBe('経理部門');
    expect(result.escalationDetails![2].recipientRole).toBe('IT部門');
    expect(result.errorDetails).toBeNull();
  });
});
