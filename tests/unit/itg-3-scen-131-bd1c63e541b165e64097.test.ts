import { startScheduledMonitoringCycle } from '../../src/logic/scheduled-monitoring-orchestrator';

describe('SCEN-131: 照合対象期間の指定が無効な場合', () => {
  it('開始日が終了日より後のとき、failedステータスとエラー詳細を返す', async () => {
    const input = {
      executionTimestamp: new Date('2025-02-15T09:00:00Z'),
      isBusinessDay: true,
      targetPeriodStart: new Date('2025-02-15T00:00:00Z'),
      targetPeriodEnd: new Date('2025-02-10T23:59:59Z'),
    };

    const result = await startScheduledMonitoringCycle(input);

    expect(result.executionStatus).toBe('failed');
    expect(result.errorDetails).toBe('照合対象期間の指定が無効です。');
    expect(result.escalationExecuted).toBe(false);
  });
});
