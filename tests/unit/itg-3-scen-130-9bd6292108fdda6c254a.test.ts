import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { startScheduledMonitoringCycle, InvalidExecutionTimestamp } from '../../src/logic/scheduled-monitoring-orchestrator';

describe('SCEN-130: 実行時刻の形式が無効な場合はfailedステータスとエラー詳細を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject with InvalidExecutionTimestamp when executionTimestamp is a string', async () => {
    const input = {
      executionTimestamp: '2024-01-15' as any,
      isBusinessDay: true,
      targetPeriodStart: new Date('2024-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2024-01-31T23:59:59Z'),
    };

    await expect(startScheduledMonitoringCycle(input)).rejects.toThrow(InvalidExecutionTimestamp);
  });

  it('should reject with InvalidExecutionTimestamp when executionTimestamp is an invalid Date object', async () => {
    const invalidDate = new Date('Invalid');
    const input = {
      executionTimestamp: invalidDate,
      isBusinessDay: true,
      targetPeriodStart: new Date('2024-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2024-01-31T23:59:59Z'),
    };

    await expect(startScheduledMonitoringCycle(input)).rejects.toThrow(InvalidExecutionTimestamp);
  });

  it('should reject with InvalidExecutionTimestamp when executionTimestamp is null', async () => {
    const input = {
      executionTimestamp: null as any,
      isBusinessDay: true,
      targetPeriodStart: new Date('2024-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2024-01-31T23:59:59Z'),
    };

    await expect(startScheduledMonitoringCycle(input)).rejects.toThrow(InvalidExecutionTimestamp);
  });

  it('should reject with InvalidExecutionTimestamp when executionTimestamp is undefined', async () => {
    const input = {
      executionTimestamp: undefined as any,
      isBusinessDay: true,
      targetPeriodStart: new Date('2024-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2024-01-31T23:59:59Z'),
    };

    await expect(startScheduledMonitoringCycle(input)).rejects.toThrow(InvalidExecutionTimestamp);
  });

  it('should reject with InvalidExecutionTimestamp when executionTimestamp is a numeric timestamp not converted to Date', async () => {
    const input = {
      executionTimestamp: 1705276800000 as any,
      isBusinessDay: true,
      targetPeriodStart: new Date('2024-01-01T00:00:00Z'),
      targetPeriodEnd: new Date('2024-01-31T23:59:59Z'),
    };

    await expect(startScheduledMonitoringCycle(input)).rejects.toThrow(InvalidExecutionTimestamp);
  });

  it('should reject and handle invalid execution timestamp with proper error message', async () => {
    try {
      await startScheduledMonitoringCycle({
        executionTimestamp: {} as any,
        isBusinessDay: true,
        targetPeriodStart: new Date('2024-01-01T00:00:00Z'),
        targetPeriodEnd: new Date('2024-01-31T23:59:59Z'),
      });
      fail('Should have thrown InvalidExecutionTimestamp');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidExecutionTimestamp);
      expect((error as Error).message).toContain('実行時刻の形式が無効です。');
    }
  });
});
