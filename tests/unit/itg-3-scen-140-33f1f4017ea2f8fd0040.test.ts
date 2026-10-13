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

describe('SCEN-140: 月次締め日まで1営業日以内で高以上の差異のとき是正優先度を即時に設定する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set correctionPriority to immediate when high severity and 1 business day until month end', async () => {
    const input: StartScheduledMonitoringCycleInput = {
      executionTimestamp: new Date('2025-02-27T09:00:00Z'),
      isBusinessDay: true,
      targetPeriodStart: new Date('2025-02-01T00:00:00Z'),
      targetPeriodEnd: new Date('2025-02-27T23:59:59Z'),
    };

    const mockLogs = {
      lastCycleId: 'CYCLE-2025-02-26',
      correctionStatus: 'in_progress',
      escalationHistory: [],
      daysUntilMonthEnd: 1,
      dataDiscrepancies: [
        {
          field: 'invoiceAmount',
          oldSystemValue: 1050000,
          newSystemValue: 950000,
          discrepancyType: 'amount',
        },
      ],
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
      new Date('2025-02-27T13:00:00Z')
    );
    expect(result.escalationDetails![1].recipientRole).toBe('経理部門');
    expect(result.escalationDetails![1].slaDeadline).toEqual(
      new Date('2025-02-27T13:00:00Z')
    );
    expect(result.errorDetails).toBeNull();
  });
});
